from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class Language(str, Enum):
    PYTHON = "python"
    CPP = "cpp"


class UserInfo(BaseModel):
    user_id: str
    username: str
    color: str = "#3B82F6"
    cursor_position: Optional[Dict[str, int]] = None
    selection: Optional[Dict[str, Any]] = None


class RoomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    language: Language = Language.PYTHON
    initial_code: Optional[str] = ""


class RoomResponse(BaseModel):
    room_id: str
    name: str
    language: Language
    code: str
    version: int
    created_at: datetime
    updated_at: datetime
    active_users: List[UserInfo] = []


class RoomInfo(BaseModel):
    room_id: str
    name: str
    language: Language
    active_users: int
    created_at: datetime


class CursorUpdate(BaseModel):
    user_id: str
    username: str
    color: str
    position: Dict[str, int]
    selection: Optional[Dict[str, Any]] = None


class DiffMessage(BaseModel):
    user_id: str
    diff: str
    version: int


class CodeExecutionRequest(BaseModel):
    code: str
    language: Language
    input: Optional[str] = ""


class CodeExecutionResponse(BaseModel):
    output: str
    error: Optional[str] = None
    execution_time: float


class WebSocketMessage(BaseModel):
    type: str
    payload: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: str
