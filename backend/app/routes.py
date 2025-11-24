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
    return {"status": "ok"}

# 1. Chat
@router.post("/chat", response_model=schemas.ChatResponse)
def chat(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    # Check if session exists
    session = db.query(models.Session).filter(models.Session.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Check Redis cache
    cached_response = cache_service.get(request.session_id, request.prompt)
    
    if cached_response:
        # If found, we still need to save the interaction to DB to keep history
        # Save User Message
        user_msg = models.Message(
            session_id=request.session_id,
            role="user",
            content=request.prompt
        )
        db.add(user_msg)
        
        # Save Assistant Message (from cache)
        assistant_msg = models.Message(
            session_id=request.session_id,
            role="assistant",
            content=cached_response
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)
        
        return schemas.ChatResponse(
            message_id=assistant_msg.id,
            content=cached_response,
            cached=True
        )

    # 2. If not in cache, generate response (Stub)
    generated_content = f"Echo: {request.prompt} (This is a stub response)"
    
    # Save User Message
    user_msg = models.Message(
        session_id=request.session_id,
        role="user",
        content=request.prompt
    )
    db.add(user_msg)
    
    # Save Assistant Message
    assistant_msg = models.Message(
        session_id=request.session_id,
        role="assistant",
        content=generated_content
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    # 3. Cache the response
    cache_service.set(request.session_id, request.prompt, generated_content, 3600) # cached for 1 hour

    return schemas.ChatResponse(
        message_id=assistant_msg.id,
        content=generated_content,
        cached=False
    )

# 2. Sessions
@router.post("/sessions", response_model=schemas.SessionResponse)
def create_session(session: schemas.SessionCreate, db: Session = Depends(get_db)):
    # Verify user exists (optional, depending on strictness)
    # user = db.query(models.User).filter(models.User.id == session.user_id).first()
    # if not user: raise HTTPException...
    
    new_session = models.Session(
        user_id=session.user_id,
        title=session.title
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/sessions", response_model=List[schemas.SessionResponse])
def list_sessions(user_id: uuid.UUID, db: Session = Depends(get_db)):
    sessions = db.query(models.Session).filter(models.Session.user_id == user_id).all()
    return sessions

@router.get("/sessions/{session_id}", response_model=schemas.SessionDetail)
def get_session(session_id: uuid.UUID, db: Session = Depends(get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.delete("/sessions/{session_id}")
def delete_session(session_id: uuid.UUID, db: Session = Depends(get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return {"status": "deleted", "id": str(session_id)}

# 3. Messages
@router.get("/messages/{message_id}", response_model=schemas.MessageResponse)
def get_message(message_id: uuid.UUID, db: Session = Depends(get_db)):
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message

@router.post("/messages/{message_id}/rate")
def rate_message(message_id: uuid.UUID, rating: schemas.RatingRequest, db: Session = Depends(get_db)):
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if rating.rating not in ["up", "down"]:
        raise HTTPException(status_code=400, detail="Invalid rating")
        
    message.rating = rating.rating
    db.commit()
    return {"status": "rated", "rating": rating.rating}

@router.post("/messages/{message_id}/pin")
def pin_message(message_id: uuid.UUID, db: Session = Depends(get_db)):
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.pinned = not message.pinned # Toggle
    db.commit()
    return {"status": "toggled", "pinned": message.pinned}

# 4. Search
@router.get("/sessions/{session_id}/search", response_model=schemas.SearchResponse)
def search_messages(session_id: uuid.UUID, q: str, db: Session = Depends(get_db)):
    # Using Postgres full-text search
    # Note: This requires the index we added in init.sql
    # to_tsvector('english', content) @@ plainto_tsquery('english', :q)
    if not q or not q.strip():
        return schemas.SearchResponse(results=[])
    
    # ORM query using the same expression as the GIN index so Postgres can use it
    results_orm = db.query(models.Message).filter(
        models.Message.session_id == session_id,
        text("to_tsvector('english', content) @@ plainto_tsquery('english', :q)")
    ).params(q=q).all()
    
    return schemas.SearchResponse(results=results_orm)
