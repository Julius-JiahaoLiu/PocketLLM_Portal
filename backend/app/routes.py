from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import uuid
import json
import time

from . import models, schemas
from .database import get_db
from .cache import CacheService
from .auth import hash_password, verify_password, create_token, verify_token
import os
from llama_cpp import Llama

MODEL_PATH = os.getenv("MODEL_PATH", "/app/models/qwen2.5-1.5b-instruct-q4_k_m.gguf")
N_THREADS = int(os.getenv("N_THREADS", "4"))
llm = None

# Global Monitoring Stats
START_TIME = time.time()
STATS = {
    "total_requests": 0,
    "cache_hits": 0,
    "cache_misses": 0,
    "total_tokens": 0,
    "total_latency_ms": 0
}

# Initialize Llama model if file exists
if os.path.exists(MODEL_PATH):
    print(f"Loading local LLM from {MODEL_PATH} with {N_THREADS} threads...")
    try:
        llm = Llama(
            model_path=MODEL_PATH,
            n_ctx=2048,      # Context window size
            n_threads=N_THREADS,     # Number of CPU threads to use
            verbose=False
        )
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Failed to load model: {e}")
else:
    print(f"Warning: Model file not found at {MODEL_PATH}")

router = APIRouter(prefix="/api/v1")
cache_service = CacheService()


@router.get("/health")
def health():
    """
    Simple health check endpoint.
    """
    return {"status": "ok"}


# ============ Auth Endpoints ============

@router.post("/auth/register", response_model=schemas.AuthResponse)
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user.
    Email must be unique.
    """
    # 检查邮箱是否已存在
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 创建新用户
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(req.password)
    
    new_user = models.User(
        id=uuid.UUID(user_id),
        email=req.email,
        password_hash=hashed_pwd,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 生成 token
    token = create_token(user_id)
    
    return schemas.AuthResponse(
        user_id=user_id,
        email=new_user.email,
        token=token
    )


@router.post("/auth/login", response_model=schemas.AuthResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password.
    Returns JWT token if successful.
    """
    # 查找用户
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # 验证密码
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # 生成 token
    token = create_token(str(user.id))
    
    return schemas.AuthResponse(
        user_id=str(user.id),
        email=user.email,
        token=token
    )



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
    start_ts = time.time()
    STATS["total_requests"] += 1

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
        STATS["cache_hits"] += 1
        STATS["total_latency_ms"] += (time.time() - start_ts) * 1000

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
        db.refresh(user_msg)

        return schemas.ChatResponse(
            message_id=assistant_msg.id,
            user_message_id=user_msg.id,
            content=cached_response,
            cached=True,
        )


    # 2. Cache miss: call local LLM
    STATS["cache_misses"] += 1
    
    if llm is None:
        # If model not loaded, return error message
        generated_content = f"Error: Local LLM not loaded. Please check if {MODEL_PATH} exists."
    else:
        try:
            # Fetch conversation history from DB to provide context
            history_msgs = (
                db.query(models.Message)
                .filter(models.Message.session_id == request.session_id)
                .order_by(models.Message.created_at.asc())
                .all()
            )
            
            # Build messages list for LLM context
            messages_payload = [
                {"role": msg.role, "content": msg.content} for msg in history_msgs
            ]
            # Add the current prompt
            messages_payload.append({"role": "user", "content": request.prompt})

            completion = llm.create_chat_completion(
                messages=messages_payload,
                max_tokens=512,
                temperature=0.2,
            )
            # Extract assistant text
            generated_content = completion["choices"][0]["message"]["content"] or ""
            
            # Track tokens
            usage = completion.get("usage", {})
            STATS["total_tokens"] += usage.get("total_tokens", 0)
            
        except Exception as e:
            # On error, produce a safe fallback and continue
            generated_content = f"(LLM error) {str(e)}"


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
    db.refresh(user_msg)

    # 3. Cache the response for future identical prompts in this session (TTL: 1 hour)
    cache_service.set(request.session_id, request.prompt, generated_content, 3600)

    STATS["total_latency_ms"] += (time.time() - start_ts) * 1000

    return schemas.ChatResponse(
        message_id=assistant_msg.id,
        user_message_id=user_msg.id,
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


@router.put("/sessions/{session_id}", response_model=schemas.SessionResponse)
def update_session(
    session_id: uuid.UUID,
    update: schemas.SessionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a session's title.
    """
    session = (
        db.query(models.Session)
        .filter(models.Session.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if update.title is not None:
        session.title = update.title
    
    db.commit()
    db.refresh(session)
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
    Create a new message under a given session.
    Can be used to import messages with any role.
    """
    session = (
        db.query(models.Session)
        .filter(models.Session.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Validate role
    if body.role not in ["user", "assistant"]:
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'assistant'")

    msg = models.Message(
        session_id=session_id,
        role=body.role,
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

    # Support both numeric (1-5) and string ('up'/'down') ratings for compatibility.
    val = rating.rating
    if isinstance(val, int):
        if not (1 <= val <= 5):
            raise HTTPException(status_code=400, detail="Invalid numeric rating. Must be 1-5")
        # Map numeric scale to 'up'/'down' for storage (>=4 => up, <=2 => down, 3 => up)
        mapped = 'up' if val >= 3 else 'down'
    elif isinstance(val, str):
        if val not in ['up', 'down']:
            raise HTTPException(status_code=400, detail="Invalid rating. Use 'up' or 'down'")
        mapped = val
    else:
        raise HTTPException(status_code=400, detail="Invalid rating type")

    message.rating = mapped
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


@router.post("/messages/{message_id}/delete")
def delete_message(message_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete a message by its ID.
    """
    message = (
        db.query(models.Message)
        .filter(models.Message.id == message_id)
        .first()
    )
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    db.delete(message)
    db.commit()
    return {"status": "deleted", "id": str(message_id)}


# ======================
# 4. Search
# ======================
@router.get(
    "/sessions/{session_id}/search",
    response_model=schemas.SearchResponse,
)
def search_messages(
    session_id: uuid.UUID, q: str, db: Session = Depends(get_db)
):
    """
    Search messages within a session for exact keyword matches.
    Searches both user and assistant messages.
    Returns a list of matching Message objects.
    """
    if not q or not q.strip():
        # Empty or whitespace-only query returns no results.
        return schemas.SearchResponse(results=[])

    # Use case-insensitive LIKE for exact keyword matching
    # This will match the keyword anywhere in the content
    search_pattern = f"%{q.strip()}%"
    
    results_orm = (
        db.query(models.Message)
        .filter(
            models.Message.session_id == session_id,
            models.Message.content.ilike(search_pattern)
        )
        .order_by(models.Message.created_at.asc())
        .all()
    )

    return schemas.SearchResponse(results=results_orm)


# ======================
# 5. Admin & Monitoring
# ======================
@router.get("/admin/stats", response_model=schemas.SystemStats)
def get_system_stats():
    """
    Retrieve system monitoring statistics.
    """
    uptime = time.time() - START_TIME
    total = STATS["total_requests"]
    hits = STATS["cache_hits"]
    rate = (hits / total) if total > 0 else 0.0
    avg_lat = (STATS["total_latency_ms"] / total) if total > 0 else 0.0
    
    return schemas.SystemStats(
        uptime_seconds=uptime,
        total_requests=total,
        cache_hits=hits,
        cache_misses=STATS["cache_misses"],
        cache_hit_rate=rate,
        total_tokens_generated=STATS["total_tokens"],
        avg_latency_ms=avg_lat,
        model_loaded=(llm is not None),
        model_path=MODEL_PATH
    )


@router.post("/admin/cache/clear")
def clear_cache():
    """
    Clear the entire Redis cache.
    """
    try:
        cache_service.clear_all()
        return {"status": "success", "message": "Cache cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

