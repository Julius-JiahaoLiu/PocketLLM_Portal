# PocketLLM_Portal

### Quick Start

- **Docker** and **Docker Compose** installed.

1. Open a terminal in the project root directory.
2. Run the following command to build and start all services:

   ```bash
   docker compose up --build
   ```

3. Wait for the containers to initialize. You will see logs indicating that Postgres, Redis, Backend, and Frontend are running.

- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Base URL**: `http://localhost:8000/api/v1` (or via proxy at `http://localhost:3000/api/v1`)

- Press `Ctrl+C` to stop the running containers.
- To tear down the containers and networks:
  ```bash
  docker compose down
  ```

## Docker Container Design & Interaction

- Frontend (React + nginx) Calls backend API endpoints (/api/v1/...) via HTTP.

- Backend (FastAPI) Handles requests, queries Postgres for persistent data, checks Redis for cache hits.

- Redis Provides fast cache lookup for prompts/responses.

- Postgres Stores users, sessions, messages, ratings, pins.

### API endpoints (prefixed with /api/v1)

1. Chat

- POST /api/v1/chat

Request: { "session_id": "uuid", "prompt": "string" }

Response: { "message_id": "uuid", "content": "string", "cached": true|false }

Logic: Backend checks Redis for cached response. If found, return cached. If not, generate (stub for now), store in Postgres, and cache in Redis.

2. Sessions

- POST /api/v1/sessions

Create new session.

Response: { "session_id": "uuid" }

- GET /api/v1/sessions

List all sessions for user.

- GET /api/v1/sessions/{id}

Retrieve session details with messages.

- DELETE /api/v1/sessions/{id}

Delete session and associated messages.

3. Messages

- GET /api/v1/messages/{id}

Retrieve single message.

- POST /api/v1/messages/{id}/rate

Request: { "rating": "up" | "down" }

- POST /api/v1/messages/{id}/pin

Toggle pin/bookmark.

4. Search

- GET /api/v1/sessions/{id}/search?q=keyword

Search messages in a session (Postgres full-text search).

### PostgreSQL DB Model

users

- id UUID PK

- email VARCHAR UNIQUE

- password_hash VARCHAR

- role ENUM('user','admin')

- created_at TIMESTAMP

sessions

- id UUID PK

- user_id UUID FK -> users.id

- title VARCHAR

- created_at TIMESTAMP

- updated_at TIMESTAMP

messages

- id UUID PK

- session_id UUID FK -> sessions.id

- role ENUM('user','assistant')

- content TEXT

- rating ENUM('up','down', NULL)

- pinned BOOLEAN DEFAULT false

- created_at TIMESTAMP

### Redis Model

cache_metadata (Use this table to log cache hits)

- prompt_hash VARCHAR PK (hash(prompt + session_id), value = response JSON)

- response_id UUID FK -> messages.id

- cached_at TIMESTAMP

- hits INT

### Local Development (Optional)

If you want to work on the code with IDE support (autocompletion, linting), set up a local environment:

1. **Backend**:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   ```

**Note**: You do NOT need this to run the app with Docker. Docker manages its own dependencies.
