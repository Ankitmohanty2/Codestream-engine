"""
Pydantic schemas for request/response validation.
Separates internal models from API contracts.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class Language(str, Enum):
    """Supported programming languages."""
    PYTHON = "python"
    CPP = "cpp"


class UserInfo(BaseModel):
    """User information for presence tracking."""
    user_id: str
    username: str
    color: str = "#3B82F6"  # Default blue
    cursor_position: Optional[Dict[str, int]] = None
    selection: Optional[Dict[str, Any]] = None


class RoomCreate(BaseModel):
    """Request schema for creating a room."""
    name: str = Field(..., min_length=1, max_length=100)
    language: Language = Language.PYTHON
    initial_code: Optional[str] = ""


class RoomResponse(BaseModel):
    """Response schema for room data."""
    room_id: str
    name: str
    language: Language
    code: str
    version: int
    created_at: datetime
    updated_at: datetime
    active_users: List[UserInfo] = []


class RoomInfo(BaseModel):
    """Lightweight room info for listings."""
    room_id: str
    name: str
    language: Language
    active_users: int
    created_at: datetime


class CursorUpdate(BaseModel):
    """Schema for cursor position updates."""
    user_id: str
    username: str
    color: str
    position: Dict[str, int]  # {"line": 1, "column": 1}
    selection: Optional[Dict[str, Any]] = None


class DiffMessage(BaseModel):
    """Schema for diff-based sync messages."""
    user_id: str
    diff: str  # Patch in diff-match-patch format
    version: int


class CodeExecutionRequest(BaseModel):
    """Request schema for code execution."""
    code: str
    language: Language
    input: Optional[str] = ""


class CodeExecutionResponse(BaseModel):
    """Response schema for code execution."""
    output: str
    error: Optional[str] = None
    execution_time: float


class WebSocketMessage(BaseModel):
    """Generic WebSocket message envelope."""
    type: str  # "join", "leave", "cursor", "diff", "sync", "execution"
    payload: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    code: str
