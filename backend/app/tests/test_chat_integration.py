# app/tests/test_chat_integration.py
import uuid
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_chat_flow(setup_test_user):
    """
    集成测试 /api/v1/chat：
    - 创建用户
    - 创建 session
    - 调用 /chat 第一次（不命中缓存）
    - 再调用 /chat 第二次（命中 Redis 缓存）
    """
    # 用 fixture 创建一个真实存在于 DB 的用户
    user_id = setup_test_user  # type: uuid.UUID

    # 创建 session
    resp_create = client.post(
        "/api/v1/sessions",
        json={"user_id": str(user_id), "title": "Test Session"},
    )
    assert resp_create.status_code == 200
    session_id = resp_create.json()["id"]

    # 第一次调用 /chat —— 不在缓存里
    payload = {
        "session_id": session_id,
        "prompt": "Hello",
    }
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["content"].startswith("Echo: Hello")
    assert data["cached"] is False
    first_message_id = data["message_id"]

    # 第二次调用 /chat —— 相同 session + prompt，应命中 Redis 缓存
    response2 = client.post("/api/v1/chat", json=payload)
    assert response2.status_code == 200

    data2 = response2.json()
    assert data2["content"].startswith("Echo: Hello")
    assert data2["cached"] is True

    # 确认第二次的 message_id 不同（因为我们每次都创建新的 Message 记录）
    assert data2["message_id"] != first_message_id


def test_sessions_crud_and_detail(setup_test_user):
    """
    集成测试 sessions 相关接口：
    - POST /sessions 创建会话
    - GET /sessions?user_id=... 列出会话
    - 调用 /chat 产生若干 message
    - GET /sessions/{id} 能返回 messages 列表
    """
    user_id = setup_test_user

    # 创建 session
    resp_create = client.post(
        "/api/v1/sessions",
        json={"user_id": str(user_id), "title": "My Session"},
    )
    assert resp_create.status_code == 200
    body = resp_create.json()
    session_id = body["id"]
    assert body["title"] == "My Session"

    # 列表接口
    resp_list = client.get("/api/v1/sessions", params={"user_id": str(user_id)})
    assert resp_list.status_code == 200
    sessions = resp_list.json()
    assert any(s["id"] == session_id for s in sessions)

    # 用 /chat 生成几条消息（user + assistant）
    for prompt in ["hello world", "another message"]:
        client.post(
            "/api/v1/chat",
            json={"session_id": session_id, "prompt": prompt},
        )

    # 查看 session 详情，里面应该有 messages
    resp_detail = client.get(f"/api/v1/sessions/{session_id}")
    assert resp_detail.status_code == 200
    detail = resp_detail.json()
    assert detail["id"] == session_id
    assert len(detail["messages"]) >= 4
    roles = {m["role"] for m in detail["messages"]}
    assert "user" in roles and "assistant" in roles


def test_message_rate_pin_and_search(setup_test_user):
    """
    集成测试 messages & search：
    - 用 /chat 生成一条消息
    - /messages/{id}/rate 点赞
    - /messages/{id} 查看 rating 字段
    - /messages/{id}/pin 反复调用，检查 pinned 开关
    - /sessions/{id}/search?q=... 能搜到刚才的内容
    """
    user_id = setup_test_user

    # 先创建 session
    resp_create = client.post(
        "/api/v1/sessions",
        json={"user_id": str(user_id), "title": "Search Session"},
    )
    assert resp_create.status_code == 200
    session_id = resp_create.json()["id"]

    # 调用 /chat 生成一条包含关键字 "unittest" 的消息
    prompt = "this is a unittest message"
    resp_chat = client.post(
        "/api/v1/chat",
        json={"session_id": session_id, "prompt": prompt},
    )
    assert resp_chat.status_code == 200
    chat_body = resp_chat.json()
    message_id = chat_body["message_id"]

    # 1) rate message
    resp_rate = client.post(
        f"/api/v1/messages/{message_id}/rate",
        json={"rating": "up"},
    )
    assert resp_rate.status_code == 200
    assert resp_rate.json()["status"] == "rated"

    # 再 get 一下确认 rating 已经写入
    resp_get = client.get(f"/api/v1/messages/{message_id}")
    assert resp_get.status_code == 200
    msg = resp_get.json()
    assert msg["rating"] == "up"

    # 2) pin / unpin
    resp_pin1 = client.post(f"/api/v1/messages/{message_id}/pin")
    assert resp_pin1.status_code == 200
    assert resp_pin1.json()["pinned"] is True

    resp_pin2 = client.post(f"/api/v1/messages/{message_id}/pin")
    assert resp_pin2.status_code == 200
    assert resp_pin2.json()["pinned"] is False

    # 3) search
    resp_search = client.get(
        f"/api/v1/sessions/{session_id}/search",
        params={"q": "unittest"},
    )
    assert resp_search.status_code == 200
    results = resp_search.json()["results"]
    assert any("unittest" in m["content"].lower() for m in results)
