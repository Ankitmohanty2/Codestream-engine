import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends

from app.models.schemas import Language
from app.services.connection_manager import ConnectionManager, manager
from app.services.sync_service import SyncService
from app.services.execution_service import ExecutionService
from app.dependencies import get_sync_service, get_execution_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    user_id: str,
    username: str,
    sync_service: SyncService = Depends(get_sync_service),
    exec_service: ExecutionService = Depends(get_execution_service),
    conn_manager: ConnectionManager = Depends(lambda: manager)
):
    await conn_manager.connect(websocket, room_id, user_id, username)

    user_info = conn_manager.connection_users.get(websocket, {})
    user_color = user_info.get("color", "#3B82F6")

    try:
        doc_state = await sync_service.full_sync(room_id)

        await websocket.send_text(json.dumps({
            "type": "sync",
            "payload": {
                "code": doc_state["code"],
                "version": doc_state.get("version", 1),
                "language": doc_state.get("language", "python"),
                "name": doc_state.get("name", "")
            },
            "timestamp": datetime.utcnow().isoformat()
        }))

        await conn_manager.update_version(room_id, doc_state.get("version", 1))

        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                msg_type = message.get("type")
                payload = message.get("payload", {})

                logger.debug(f"Received {msg_type} from {user_id}")

                if msg_type == "diff":
                    await _handle_diff(
                        payload, user_id, room_id,
                        sync_service, conn_manager
                    )

                elif msg_type == "cursor":
                    await _handle_cursor(
                        payload, user_id, username, user_color,
                        room_id, conn_manager
                    )

                elif msg_type == "sync":
                    doc_state = await sync_service.full_sync(room_id)
                    await websocket.send_text(json.dumps({
                        "type": "sync",
                        "payload": doc_state,
                        "timestamp": datetime.utcnow().isoformat()
                    }))

                elif msg_type == "run":
                    await _handle_execution(
                        payload, room_id, websocket,
                        exec_service, conn_manager
                    )

                else:
                    logger.warning(f"Unknown message type: {msg_type}")

            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
            except Exception as e:
                logger.error(f"Error handling message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "payload": {"error": str(e)},
                    "timestamp": datetime.utcnow().isoformat()
                }))

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await conn_manager.disconnect(websocket)


async def _handle_diff(
    payload: Dict[str, Any],
    user_id: str,
    room_id: str,
    sync_service: SyncService,
    conn_manager: ConnectionManager
):
    diff = payload.get("diff")
    user_version = payload.get("version", 1)

    if not diff:
        return

    success, new_version, new_code = await sync_service.apply_user_diff(
        room_id, diff, user_version, user_id
    )

    if success:
        await conn_manager.update_version(room_id, new_version)

        await conn_manager.broadcast_diff(
            room_id, diff, user_id, new_version
        )

        await conn_manager.send_personal_message(user_id, {
            "type": "ack",
            "payload": {"version": new_version},
            "timestamp": datetime.utcnow().isoformat()
        })


async def _handle_cursor(
    payload: Dict[str, Any],
    user_id: str,
    username: str,
    user_color: str,
    room_id: str,
    conn_manager: ConnectionManager
):
    position = payload.get("position", {"line": 1, "column": 1})
    selection = payload.get("selection")

    await conn_manager.broadcast_cursor(
        room_id, user_id, username, user_color, position, selection
    )


async def _handle_execution(
    payload: Dict[str, Any],
    room_id: str,
    websocket: WebSocket,
    exec_service: ExecutionService,
    conn_manager: ConnectionManager
):
    code = payload.get("code", "")
    language_str = payload.get("language", "python")
    input_data = payload.get("input", "")

    try:
        language = Language(language_str)
    except ValueError:
        await websocket.send_text(json.dumps({
            "type": "execution_result",
            "payload": {"error": f"Unsupported language: {language_str}"},
            "timestamp": datetime.utcnow().isoformat()
        }))
        return

    output, error, exec_time = await exec_service.execute(
        code, language, input_data
    )

    await websocket.send_text(json.dumps({
        "type": "execution_result",
        "payload": {
            "output": output,
            "error": error,
            "execution_time": exec_time
        },
        "timestamp": datetime.utcnow().isoformat()
    }))
