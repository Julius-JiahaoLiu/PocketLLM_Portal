from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class ChatRequest(BaseModel):
    session_id: UUID
    prompt: str

class ChatResponse(BaseModel):
    message_id: UUID
    content: str
    cached: bool

class SessionCreate(BaseModel):
    user_id: UUID 
    title: Optional[str] = "New Session"

class SessionResponse(BaseModel):
    id: UUID
    title: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    rating: Optional[str]
    pinned: bool
    created_at: datetime
    class Config:
        from_attributes = True

class SessionDetail(SessionResponse):
    messages: List[MessageResponse]

class RatingRequest(BaseModel):
    rating: str # 'up' or 'down'

class SearchResponse(BaseModel):
    results: List[MessageResponse]
