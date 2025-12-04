from pydantic import BaseModel
from typing import Optional, List, Union
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
    user_message_id: UUID
    content: str
    cached: bool


class SessionCreate(BaseModel):
    """
    Request body for creating a new chat session.
    """
    user_id: UUID
    title: Optional[str] = "New Session"


class SessionUpdate(BaseModel):
    """
    Request body for updating a session.
    """
    title: Optional[str] = None


class SessionResponse(BaseModel):
    """
    Basic session information returned in list and creation responses.
    """
    id: UUID
    title: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SystemStats(BaseModel):
    """
    System monitoring statistics.
    """
    uptime_seconds: float
    total_requests: int
    cache_hits: int
    cache_misses: int
    cache_hit_rate: float
    total_tokens_generated: int
    avg_latency_ms: float
    model_loaded: bool
    model_path: str


class MessageCreate(BaseModel):
    """
    Request body for creating a new message under a session.
    """
    content: str
    role: Optional[str] = "user"  # "user" or "assistant"


class MessageResponse(BaseModel):
    """
    Response model for a single message.
    Includes role, content, optional rating, pinned status, and timestamps.
    """
    id: UUID
    role: str
    content: str
    rating: Optional[str] = None  # "up", "down" or None
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
    Accepts either an integer score (1-5) for backward compatibility,
    or a string value 'up'/'down' used by the frontend.
    """
    rating: Union[int, str]


class SearchResponse(BaseModel):
    """
    Response structure for search results.
    """
    results: List[MessageResponse]


class RegisterRequest(BaseModel):
    """
    Request body for user registration.
    """
    email: str
    password: str


class LoginRequest(BaseModel):
    """
    Request body for user login.
    """
    email: str
    password: str


class AuthResponse(BaseModel):
    """
    Response returned after successful registration or login.
    """
    user_id: str
    email: str
    token: str

