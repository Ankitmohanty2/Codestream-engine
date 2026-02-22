"""
MongoDB database models using Motor async driver.
Implements repository pattern for data access.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class Database:
    """
    MongoDB database wrapper with Motor async driver.
    Provides connection management and collection access.
    """
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect(cls) -> None:
        """Establish connection to MongoDB."""
        try:
            cls.client = AsyncIOMotorClient(settings.mongo_url)
            cls.db = cls.client[settings.mongo_db_name]
            
            # Create indexes for better query performance
            await cls.db.rooms.create_index("room_id", unique=True)
            await cls.db.rooms.create_index("created_at")
            await cls.db.rooms.create_index("name")
            
            logger.info(f"Connected to MongoDB at {settings.mongo_url}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    @classmethod
    async def disconnect(cls) -> None:
        """Close MongoDB connection."""
        if cls.client:
            cls.client.close()
            logger.info("Disconnected from MongoDB")

    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """Get database instance."""
        if cls.db is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return cls.db


class RoomRepository:
    """
    Repository for room data operations.
    Encapsulates MongoDB queries for rooms collection.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.rooms
    
    async def create_room(
        self,
        room_id: str,
        name: str,
        language: str,
        initial_code: str = ""
    ) -> Dict[str, Any]:
        """
        Create a new room document.
        
        Args:
            room_id: Unique room identifier
            name: Room name
            language: Programming language
            initial_code: Initial code content
            
        Returns:
            Created room document
        """
        now = datetime.utcnow()
        room_doc = {
            "room_id": room_id,
            "name": name,
            "language": language,
            "code": initial_code,
            "version": 1,
            "created_at": now,
            "updated_at": now,
            "active_users": []
        }
        await self.collection.insert_one(room_doc)
        logger.info(f"Created room: {room_id}")
        return room_doc
    
    async def get_room(self, room_id: str) -> Optional[Dict[str, Any]]:
        """Get room by ID."""
        return await self.collection.find_one({"room_id": room_id})
    
    async def update_room_code(
        self,
        room_id: str,
        code: str,
        version: int
    ) -> bool:
        """
        Update room code with version check (optimistic locking).
        
        Args:
            room_id: Room identifier
            code: New code content
            version: New version number
            
        Returns:
            True if update succeeded, False otherwise
        """
        result = await self.collection.update_one(
            {"room_id": room_id, "version": version - 1},
            {
                "$set": {
                    "code": code,
                    "version": version,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
    
    async def add_user(self, room_id: str, user: Dict[str, Any]) -> bool:
        """Add user to room's active users list."""
        result = await self.collection.update_one(
            {"room_id": room_id},
            {"$push": {"active_users": user}}
        )
        return result.modified_count > 0
    
    async def remove_user(self, room_id: str, user_id: str) -> bool:
        """Remove user from room's active users list."""
        result = await self.collection.update_one(
            {"room_id": room_id},
            {"$pull": {"active_users": {"user_id": user_id}}}
        )
        return result.modified_count > 0
    
    async def update_user_cursor(
        self,
        room_id: str,
        user_id: str,
        cursor_position: Dict[str, int]
    ) -> bool:
        """Update user's cursor position in room."""
        result = await self.collection.update_one(
            {"room_id": room_id, "active_users.user_id": user_id},
            {
                "$set": {
                    "active_users.$.cursor_position": cursor_position
                }
            }
        )
        return result.modified_count > 0
    
    async def list_rooms(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List all rooms with active user counts."""
        cursor = self.collection.find(
            {},
            {
                "room_id": 1,
                "name": 1,
                "language": 1,
                "created_at": 1,
                "active_users": {"$size": "$active_users"}
            }
        ).sort("created_at", -1).limit(limit)
        
        rooms = await cursor.to_list(length=limit)
        return rooms
    
    async def delete_room(self, room_id: str) -> bool:
        """Delete a room."""
        result = await self.collection.delete_one({"room_id": room_id})
        return result.deleted_count > 0
