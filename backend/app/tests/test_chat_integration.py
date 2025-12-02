# app/tests/test_chat_integration.py
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
API_PREFIX = "/api/v1"


# -----------------------
# 1. End-to-end chat flow
# -----------------------
def test_chat_flow(test_client: TestClient, setup_test_user, db_session):
    """
    Full chat flow:
    1) Create a session
    2) Send a message
    3) Fetch message list and verify content
    """
    user_id = str(setup_test_user)

    # Create a chat session
    resp = test_client.post(
        f"{API_PREFIX}/sessions",
        json={"user_id": user_id, "title": "My Chat Session"},
    )
    assert resp.status_code == 200
    session_data = resp.json()
    session_id = session_data["id"]

    # Send a message in that session
    resp_msg = test_client.post(
        f"{API_PREFIX}/sessions/{session_id}/messages",
        json={"user_id": user_id, "content": "hello world"},
    )
    assert resp_msg.status_code == 200

    # Fetch messages and verify
    resp_list = test_client.get(f"{API_PREFIX}/sessions/{session_id}/messages")
    assert resp_list.status_code == 200
    msgs = resp_list.json()
    assert len(msgs) == 1
    assert msgs[0]["content"] == "hello world"


# -----------------------
# 2. Session CRUD & detail
# -----------------------
def test_sessions_crud_and_detail(test_client: TestClient, setup_test_user):
    """
    Test creating multiple sessions, listing them by user_id,
    and fetching a single session's detail.
    """
    user_id = str(setup_test_user)

    ids = []
    for i in range(2):
        resp = test_client.post(
            f"{API_PREFIX}/sessions",
            json={"user_id": user_id, "title": f"Chat {i}"},
        )
        assert resp.status_code == 200
        ids.append(resp.json()["id"])

    # List sessions for the user
    resp_list = test_client.get(
        f"{API_PREFIX}/sessions", params={"user_id": user_id}
    )
    assert resp_list.status_code == 200
    data = resp_list.json()
    assert len(data) >= 2

    # Get session detail
    resp_detail = test_client.get(f"{API_PREFIX}/sessions/{ids[0]}")
    assert resp_detail.status_code == 200
    detail = resp_detail.json()
    assert detail["id"] == ids[0]


# -------------------------------
# 3. Message: rate / pin / search
# -------------------------------
def test_message_rate_pin_and_search(
    test_client: TestClient, setup_test_user, setup_test_session
):
    """
    For a given session:
    - Create messages
    - Rate a message
    - Toggle pin on a message
    - Search messages by keyword
    """
    user_id = str(setup_test_user)
    session_id = str(setup_test_session)

    # Create two messages
    m1 = test_client.post(
        f"{API_PREFIX}/sessions/{session_id}/messages",
        json={"user_id": user_id, "content": "hello world"},
    ).json()

    m2 = test_client.post(
        f"{API_PREFIX}/sessions/{session_id}/messages",
        json={"user_id": user_id, "content": "fastapi testing"},
    ).json()

    # Rate a message
    resp_rate = test_client.post(
        f"{API_PREFIX}/messages/{m1['id']}/rate",
        json={"rating": 5},
    )
    assert resp_rate.status_code == 200

    # Toggle pin state twice
    resp_pin1 = test_client.post(f"{API_PREFIX}/messages/{m1['id']}/pin")
    assert resp_pin1.status_code == 200

    resp_pin2 = test_client.post(f"{API_PREFIX}/messages/{m1['id']}/pin")
    assert resp_pin2.status_code == 200

    # Search messages in the session
    resp_search = test_client.get(
        f"{API_PREFIX}/sessions/{session_id}/search",
        params={"q": "fastapi"},
    )
    assert resp_search.status_code == 200
    data = resp_search.json()
    # Search endpoint returns {"results": [...]}
    results = data.get("results", [])
    assert any("fastapi" in m["content"] for m in results)
