from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class ChatRequest(BaseModel):
    """
    Request body for sending a prompt in a chat session.
    """
    session_id: UUID
    prompt: str


class ChatResponse(BaseModel):
    """
    Response returned after processing a chat request.
    Includes generated message ID, content, and whether it was served from cache.
    """
    message_id: UUID
    content: str
    cached: bool


class SessionCreate(BaseModel):
    """
    Request body for creating a new chat session.
    """
    user_id: UUID
    title: Optional[str] = "New Session"


class SessionResponse(BaseModel):
    """
    Basic session information returned in list and creation responses.
    """
    id: UUID
    title: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    """
    Request body for creating a new user message under a session.
    """
    user_id: UUID
    content: str


class MessageResponse(BaseModel):
    """
    Response model for a single message.
    Includes role, content, optional rating, pinned status, and timestamps.
    """
    id: UUID
    role: str
    content: str
    rating: Optional[int] = None  # 1–5 or None
    pinned: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SessionDetail(SessionResponse):
    """
    Detailed session information including its messages.
    Extends SessionResponse.
    """
    messages: List[MessageResponse]


class RatingRequest(BaseModel):
    """
    Request body for rating a message.
    """
    rating: str  # Expected values: 'up' 'down'


class SearchResponse(BaseModel):
    """
    Response structure for search results.
    """
    results: List[MessageResponse]
