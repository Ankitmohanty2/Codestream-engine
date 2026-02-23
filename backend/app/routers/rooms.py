import uuid
import logging
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.schemas import (
    RoomCreate,
    RoomResponse,
    RoomInfo,
    Language
)
from app.models.database import RoomRepository
from app.services.connection_manager import ConnectionManager, manager
from app.dependencies import get_room_repository, get_connection_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    room_data: RoomCreate,
    room_repo: RoomRepository = Depends(get_room_repository),
    conn_manager: ConnectionManager = Depends(get_connection_manager)
) -> RoomResponse:
    room_id = str(uuid.uuid4())[:8]

    room_doc = await room_repo.create_room(
        room_id=room_id,
        name=room_data.name,
        language=room_data.language.value,
        initial_code=room_data.initial_code or ""
    )

    await conn_manager.update_version(room_id, 1)

    logger.info(f"Created room: {room_id} ({room_data.name})")

    return RoomResponse(
        room_id=room_doc["room_id"],
        name=room_doc["name"],
        language=Language(room_doc["language"]),
        code=room_doc["code"],
        version=room_doc["version"],
        created_at=room_doc["created_at"],
        updated_at=room_doc["updated_at"],
        active_users=[]
    )


@router.get("", response_model=List[RoomInfo])
async def list_rooms(
    limit: int = 50,
    room_repo: RoomRepository = Depends(get_room_repository)
) -> List[RoomInfo]:
    rooms = await room_repo.list_rooms(limit=limit)

    return [
        RoomInfo(
            room_id=room["room_id"],
            name=room["name"],
            language=Language(room["language"]),
            active_users=room.get("active_users", 0),
            created_at=room["created_at"]
        )
        for room in rooms
    ]


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    room_repo: RoomRepository = Depends(get_room_repository),
    conn_manager: ConnectionManager = Depends(get_connection_manager)
) -> RoomResponse:
    room = await room_repo.get_room(room_id)

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room {room_id} not found"
        )

    active_users = await conn_manager.get_room_users(room_id)

    from app.models.schemas import UserInfo
    users = [
        UserInfo(
            user_id=u["user_id"],
            username=u["username"],
            color=u.get("color", "#3B82F6"),
            cursor_position=u.get("cursor_position")
        )
        for u in active_users
    ]

    return RoomResponse(
        room_id=room["room_id"],
        name=room["name"],
        language=Language(room["language"]),
        code=room["code"],
        version=room["version"],
        created_at=room["created_at"],
        updated_at=room["updated_at"],
        active_users=users
    )


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: str,
    room_repo: RoomRepository = Depends(get_room_repository),
    conn_manager: ConnectionManager = Depends(get_connection_manager)
) -> None:
    active_users = await conn_manager.get_room_users(room_id)

    if active_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete room with active users"
        )

    deleted = await room_repo.delete_room(room_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room {room_id} not found"
        )

    logger.info(f"Deleted room: {room_id}")
