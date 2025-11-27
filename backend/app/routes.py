from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import uuid
import json

from . import models, schemas
from .database import get_db
from .cache import CacheService

router = APIRouter(prefix="/api/v1")
cache_service = CacheService()


@router.get("/health")
def health():
    """
    Simple health check endpoint.
    """
    return {"status": "ok"}


# ======================
# 1. Chat
# ======================
@router.post("/chat", response_model=schemas.ChatResponse)
def chat(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    """
    Handle a chat request:
    - Validate that the session exists.
    - Check Redis cache for an existing answer to the same prompt in this session.
    - If cached:
        * Save both user and assistant messages to DB (for history).
        * Return cached answer.
    - If not cached:
        * Generate a stub response.
        * Save both user and assistant messages to DB.
        * Cache the assistant response.
    """
    # Check if session exists
    session = (
        db.query(models.Session)
        .filter(models.Session.id == request.session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Try Redis cache
    cached_response = cache_service.get(request.session_id, request.prompt)

    if cached_response:
        # Cache hit: still persist the interaction to DB to keep a complete history.

        # Save user message
        user_msg = models.Message(
            session_id=request.session_id,
            role="user",
            content=request.prompt,
        )
        db.add(user_msg)

        # Save assistant message (from cache)
        assistant_msg = models.Message(
            session_id=request.session_id,
            role="assistant",
            content=cached_response,
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        return schemas.ChatResponse(
            message_id=assistant_msg.id,
            content=cached_response,
            cached=True,
        )

    # 2. Cache miss: generate response (stub implementation)
    generated_content = f"Echo: {request.prompt} (This is a stub response)"

    # Save user message
    user_msg = models.Message(
        session_id=request.session_id,
        role="user",
        content=request.prompt,
    )
    db.add(user_msg)

    # Save assistant message
    assistant_msg = models.Message(
        session_id=request.session_id,
        role="assistant",
        content=generated_content,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    # 3. Cache the response for future identical prompts in this session (TTL: 1 hour)
    cache_service.set(request.session_id, request.prompt, generated_content, 3600)

    return schemas.ChatResponse(
        message_id=assistant_msg.id,
        content=generated_content,
        cached=False,
    )


# ======================
# 2. Sessions
# ======================
@router.post("/sessions", response_model=schemas.SessionResponse)
def create_session(
    session: schemas.SessionCreate, db: Session = Depends(get_db)
):
    """
    Create a new chat session for a given user.
    """
    # Optionally, you can enforce user existence check here:
    # user = db.query(models.User).filter(models.User.id == session.user_id).first()
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")

    new_session = models.Session(
        user_id=session.user_id,
        title=session.title,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.get("/sessions", response_model=List[schemas.SessionResponse])
def list_sessions(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    List all sessions belonging to a given user.
    """
    sessions = (
        db.query(models.Session)
        .filter(models.Session.user_id == user_id)
        .all()
    )
    return sessions


@router.get("/sessions/{session_id}", response_model=schemas.SessionDetail)
def get_session(session_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Retrieve a single session by its ID.
    """
    session = (
        db.query(models.Session)
        .filter(models.Session.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/sessions/{session_id}")
def delete_session(session_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete a session by its ID.
    """
    session = (
        db.query(models.Session)
        .filter(models.Session.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)
    db.commit()
    return {"status": "deleted", "id": str(session_id)}


# ======================
# 3. Messages
# ======================
@router.get(
    "/sessions/{session_id}/messages",
    response_model=List[schemas.MessageResponse],
)
def list_session_messages(
    session_id: uuid.UUID, db: Session = Depends(get_db)
):
    """
    List all messages under a given session, ordered by creation time (ascending).
    """
    session = (
        db.query(models.Session)
        .filter(models.Session.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = (
        db.query(models.Message)
        .filter(models.Message.session_id == session_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return messages


@router.post(
    "/sessions/{session_id}/messages",
    response_model=schemas.MessageResponse,
)
def create_message_for_session(
    session_id: uuid.UUID,
    body: schemas.MessageCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new user message under a given session.
    """
    session = (
        db.query(models.Session)
        .filter(models.Session.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    msg = models.Message(
        session_id=session_id,
        role="user",
        content=body.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/messages/{message_id}", response_model=schemas.MessageResponse)
def get_message(message_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Retrieve a single message by its ID.
    """
    message = (
        db.query(models.Message)
        .filter(models.Message.id == message_id)
        .first()
    )
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message


@router.post("/messages/{message_id}/rate")
def rate_message(
    message_id: uuid.UUID,
    rating: schemas.RatingRequest,
    db: Session = Depends(get_db),
):
    """
    Rate a message with a score between 1 and 5.
    """
    message = (
        db.query(models.Message)
        .filter(models.Message.id == message_id)
        .first()
    )
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if not (rating.rating in ['up', 'down']):
        raise HTTPException(status_code=400, detail="Invalid rating value")

    message.rating = rating.rating
    db.commit()
    db.refresh(message)

    return {"status": "rated", "rating": message.rating}


@router.post("/messages/{message_id}/pin")
def pin_message(message_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Toggle the 'pinned' state of a message.
    """
    message = (
        db.query(models.Message)
        .filter(models.Message.id == message_id)
        .first()
    )
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Toggle pinned flag
    message.pinned = not message.pinned
    db.commit()
    return {"status": "toggled", "pinned": message.pinned}


# ======================
# 4. Search
# ======================
@router.get(
    "/sessions/{session_id}/search",
    response_model=List[schemas.MessageResponse],
)
def search_messages(
    session_id: uuid.UUID, q: str, db: Session = Depends(get_db)
):
    """
    Search messages within a session using PostgreSQL full-text search on `content`.
    Returns a list of matching Message objects.
    """
    if not q or not q.strip():
        # Empty or whitespace-only query returns no results.
        return []

    results_orm = (
        db.query(models.Message)
        .filter(
            models.Message.session_id == session_id,
            text(
                "to_tsvector('english', content) "
                "@@ plainto_tsquery('english', :q)"
            ),
        )
        .params(q=q)
        .all()
    )

    return results_orm
