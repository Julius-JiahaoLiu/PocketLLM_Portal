# app/tests/conftest.py
import os
import sys
import uuid
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# ------------------ Import path configuration ------------------
# File location: backend/app/tests/conftest.py
# BASE_DIR = backend/app
# ROOT_DIR = backend
#
# Ensure "backend" is in sys.path so imports like "from app.xxx" work.
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Imports now work correctly (app.main, app.database, app.models)
from app.main import app
from app.database import get_db
from app.models import User, Session as ChatSession
# --------------------------------------------------------------


@pytest.fixture(scope="session")
def test_client() -> Generator[TestClient, None, None]:
    """
    Provides a FastAPI TestClient for the entire test session.
    Uses the full application with routing and dependency injection.
    """
    client = TestClient(app)
    yield client


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Provides a fresh SQLAlchemy DB session for each test.
    The session comes from the get_db() dependency generator.
    Automatically closes the session after each test.
    """
    db_gen = get_db()
    db = next(db_gen)
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def setup_test_user(db_session: Session) -> uuid.UUID:
    """
    Inserts a test user into the database and returns the user_id.
    Generates a unique email to avoid violating the unique constraint.
    """
    email = f"testuser_{uuid.uuid4()}@example.com"

    user = User(
        email=email,
        password_hash="dummy-hash",
        role="user",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user.id


@pytest.fixture(scope="function")
def setup_test_session(
    db_session: Session, setup_test_user: uuid.UUID
) -> uuid.UUID:
    """
    Creates a chat session for the previously created test user.
    Returns the session_id.
    """
    s = ChatSession(
        user_id=setup_test_user,
        title="Test Session",
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s.id
