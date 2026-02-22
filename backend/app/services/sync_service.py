import logging
from typing import Optional, Dict, Any, Tuple
from datetime import datetime
from diff_match_patch import diff_match_patch

from app.models.database import RoomRepository

logger = logging.getLogger(__name__)


class SyncService:
    def __init__(self, room_repo: RoomRepository):
        self.room_repo = room_repo
        self.dmp = diff_match_patch()
        self._document_cache: Dict[str, str] = {}

    async def get_document(self, room_id: str) -> Tuple[str, int]:
        if room_id in self._document_cache:
            version = self.dmp.patch_toText(self._document_cache.get(room_id, ""))
            return self._document_cache[room_id], 0

        room = await self.room_repo.get_room(room_id)
        if room:
            self._document_cache[room_id] = room.get("code", "")
            return room["code"], room.get("version", 1)

        return "", 1

    def compute_diff(self, old_text: str, new_text: str) -> str:
        patches = self.dmp.patch_make(old_text, new_text)
        return self.dmp.patch_toText(patches)

    def apply_diff(self, text: str, diff: str) -> Tuple[str, bool]:
        try:
            patches = self.dmp.patch_fromText(diff)
            new_text, _ = self.dmp.patch_apply(patches, text)
            return new_text, True
        except Exception as e:
            logger.error(f"Failed to apply diff: {e}")
            return text, False

    async def apply_user_diff(
        self,
        room_id: str,
        user_diff: str,
        user_version: int,
        user_id: str
    ) -> Tuple[bool, int, str]:
        current_code, current_version = await self.get_document(room_id)

        if user_version != current_version:
            logger.info(
                f"Version conflict for room {room_id}: "
                f"user={user_version}, server={current_version}. "
                "Attempting rebase."
            )

            rebased, success = self.apply_diff(current_code, user_diff)

            if not success:
                return False, current_version, current_code

            current_code = rebased
            current_version += 1
        else:
            new_code, success = self.apply_diff(current_code, user_diff)

            if not success:
                return False, current_version, current_code

            current_code = new_code
            current_version += 1

        self._document_cache[room_id] = current_code

        try:
            await self.room_repo.update_room_code(
                room_id, current_code, current_version
            )
        except Exception as e:
            logger.error(f"Failed to save to database: {e}")

        return True, current_version, current_code

    async def full_sync(self, room_id: str) -> Dict[str, Any]:
        room = await self.room_repo.get_room(room_id)

        if not room:
            return {
                "code": "",
                "version": 1,
                "language": "python"
            }

        self._document_cache[room_id] = room.get("code", "")

        return {
            "code": room.get("code", ""),
            "version": room.get("version", 1),
            "language": room.get("language", "python"),
            "name": room.get("name", "")
        }

    async def save_snapshot(self, room_id: str) -> bool:
        if room_id not in self._document_cache:
            return True

        code = self._document_cache[room_id]
        room = await self.room_repo.get_room(room_id)

        if not room:
            return False

        version = room.get("version", 1)

        try:
            await self.room_repo.update_room_code(room_id, code, version)
            logger.debug(f"Auto-saved room {room_id}")
            return True
        except Exception as e:
            logger.error(f"Auto-save failed for room {room_id}: {e}")
            return False

    def invalidate_cache(self, room_id: str) -> None:
        self._document_cache.pop(room_id, None)
