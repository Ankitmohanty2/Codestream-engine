from typing import AsyncGenerator
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.database import Database, RoomRepository
from app.services.connection_manager import manager
from app.services.sync_service import SyncService
from app.services.execution_service import execution_service


async def get_database() -> AsyncIOMotorDatabase:
    return Database.get_db()


async def get_room_repository(
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> RoomRepository:
    return RoomRepository(db)


async def get_sync_service(
    room_repo: RoomRepository = Depends(get_room_repository)
) -> SyncService:
    return SyncService(room_repo)


async def get_connection_manager():
    return manager


async def get_execution_service():
    return execution_service
