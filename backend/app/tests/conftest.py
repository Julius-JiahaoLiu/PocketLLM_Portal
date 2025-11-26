# app/tests/conftest.py
import os
import sys
import uuid
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# ------------------ 关键：修正 import 路径 ------------------
# 当前文件路径：backend/app/tests/conftest.py
# BASE_DIR = backend/app
# ROOT_DIR = backend
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

# 确保 backend 在 sys.path 里，这样才能 import app.xxx
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# 现在可以用 app.xxx 正常导入
from app.main import app
from app.database import get_db
from app.models import User, Session as ChatSession
# ------------------------------------------------------


@pytest.fixture(scope="session")
def test_client() -> Generator[TestClient, None, None]:
    """
    提供一个 FastAPI TestClient，
    走完整的 app 路由和依赖注入。
    """
    client = TestClient(app)
    yield client


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    每个测试用一个独立的 DB Session，结束后关闭。
    使用 app.database.get_db 里面的 SessionLocal。
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
    在 users 表里插入一个测试用户，返回 user_id。
    每个测试用不同的 email，避免违反唯一约束 users_email_key。
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
    为上面的测试用户创建一个 session，返回 session_id。
    """
    s = ChatSession(
        user_id=setup_test_user,
        title="Test Session",
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s.id
