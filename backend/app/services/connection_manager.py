import asyncio
import logging
from typing import Dict, Set, Optional, Any, List
from datetime import datetime
import json
import uuid
import random

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    CURSOR_COLORS = [
        "#EF4444", "#F97316", "#F59E0B", "#84CC16",
        "#22C55E", "#14B8A6", "#06B6D4", "#3B82F6",
        "#8B5CF6", "#D946EF", "#EC4899"
    ]

    def __init__(self):
        self.rooms: Dict[str, Set[WebSocket]] = {}
        self.connection_rooms: Dict[WebSocket, str] = {}
        self.connection_users: Dict[WebSocket, Dict[str, Any]] = {}
        self.user_connections: Dict[str, WebSocket] = {}
        self.room_versions: Dict[str, int] = {}
        self._lock = asyncio.Lock()

    @classmethod
    def get_random_color(cls) -> str:
        return random.choice(cls.CURSOR_COLORS)

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, username: str) -> bool:
        await websocket.accept()

        async with self._lock:
            if room_id not in self.rooms:
                self.rooms[room_id] = set()
                self.room_versions[room_id] = 1

            existing_websocket = self.user_connections.get(user_id)
            if existing_websocket and existing_websocket in self.rooms.get(room_id, set()):
                await self._remove_connection(existing_websocket, room_id)

            self.rooms[room_id].add(websocket)
            self.connection_rooms[websocket] = room_id

            user_info = {
                "user_id": user_id,
                "username": username,
                "color": self.get_random_color(),
                "cursor_position": {"line": 1, "column": 1},
                "connected_at": datetime.utcnow().isoformat()
            }
            self.connection_users[websocket] = user_info
            self.user_connections[user_id] = websocket

            logger.info(f"User {user_id} ({username}) connected to room {room_id}")

        await self.broadcast_to_room(
            room_id,
            {
                "type": "user_joined",
                "payload": user_info,
                "timestamp": datetime.utcnow().isoformat()
            },
            exclude_user=user_id
        )

        await self._send_room_state(websocket, room_id)
        await self._broadcast_active_users(room_id)

        return True

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            await self._remove_connection(websocket)

    async def _remove_connection(self, websocket: WebSocket, room_id: Optional[str] = None) -> None:
        room_id = room_id or self.connection_rooms.get(websocket)

        if not room_id:
            return

        user_info = self.connection_users.get(websocket, {})
        user_id = user_info.get("user_id")

        if room_id in self.rooms:
            self.rooms[room_id].discard(websocket)

            if not self.rooms[room_id]:
                del self.rooms[room_id]
                if room_id in self.room_versions:
                    del self.room_versions[room_id]

        self.connection_rooms.pop(websocket, None)
        self.connection_users.pop(websocket, None)

        if user_id:
            self.user_connections.pop(user_id, None)

        if user_id:
            logger.info(f"User {user_id} disconnected from room {room_id}")

            await self._broadcast_message(
                room_id,
                {
                    "type": "user_left",
                    "payload": {"user_id": user_id},
                    "timestamp": datetime.utcnow().isoformat()
                }
            )

            await self._broadcast_active_users(room_id)

    async def broadcast_to_room(
        self,
        room_id: str,
        message: Dict[str, Any],
        exclude_user: Optional[str] = None
    ) -> None:
        await self._broadcast_message(room_id, message, exclude_user)

    async def _broadcast_message(
        self,
        room_id: str,
        message: Dict[str, Any],
        exclude_user: Optional[str] = None
    ) -> None:
        if room_id not in self.rooms:
            return

        message_str = json.dumps(message)
        disconnected = []

        for websocket in self.rooms[room_id]:
            user_info = self.connection_users.get(websocket, {})

            if exclude_user and user_info.get("user_id") == exclude_user:
                continue

            try:
                await websocket.send_text(message_str)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                disconnected.append(websocket)

        for ws in disconnected:
            await self._remove_connection(ws, room_id)

    async def send_personal_message(self, user_id: str, message: Dict[str, Any]) -> bool:
        websocket = self.user_connections.get(user_id)

        if not websocket:
            return False

        try:
            await websocket.send_text(json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            return False

    async def broadcast_diff(
        self,
        room_id: str,
        diff: str,
        user_id: str,
        version: int
    ) -> None:
        await self._broadcast_message(
            room_id,
            {
                "type": "diff",
                "payload": {
                    "diff": diff,
                    "user_id": user_id,
                    "version": version
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    async def broadcast_cursor(
        self,
        room_id: str,
        user_id: str,
        username: str,
        color: str,
        position: Dict[str, int],
        selection: Optional[Dict[str, Any]] = None
    ) -> None:
        await self._broadcast_message(
            room_id,
            {
                "type": "cursor",
                "payload": {
                    "user_id": user_id,
                    "username": username,
                    "color": color,
                    "position": position,
                    "selection": selection
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    async def update_version(self, room_id: str, version: int) -> None:
        async with self._lock:
            self.room_versions[room_id] = version

    def get_version(self, room_id: str) -> int:
        return self.room_versions.get(room_id, 1)

    async def get_room_users(self, room_id: str) -> List[Dict[str, Any]]:
        users = []

        if room_id in self.rooms:
            for ws in self.rooms[room_id]:
                user_info = self.connection_users.get(ws)
                if user_info:
                    users.append(user_info)

        return users

    async def _send_room_state(self, websocket: WebSocket, room_id: str) -> None:
        users = await self.get_room_users(room_id)
        version = self.get_version(room_id)

        await websocket.send_text(json.dumps({
            "type": "room_state",
            "payload": {
                "room_id": room_id,
                "users": users,
                "version": version
            },
            "timestamp": datetime.utcnow().isoformat()
        }))

    async def _broadcast_active_users(self, room_id: str) -> None:
        users = await self.get_room_users(room_id)

        await self._broadcast_message(
            room_id,
            {
                "type": "users_update",
                "payload": {"users": users},
                "timestamp": datetime.utcnow().isoformat()
            }
        )


manager = ConnectionManager()
