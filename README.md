# PocketLLM_Portal

### Quick Start

- **Docker** and **Docker Compose** installed.

1. Open a terminal in the project root directory.
2. Download the lightweight Qwen model (Qwen2.5-1.5B-Instruct-Q4_K_M.gguf) from [Hugging Face](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/blob/main/qwen2.5-1.5b-instruct-q4_k_m.gguf).
3. Place the downloaded file into the `models/` directory.
4. Run the following command to build and start all services:

   ```bash
   docker compose down -v
   docker compose up --build
   ```

5. Wait for the containers to initialize. You will see logs indicating that Postgres, Redis, Backend, and Frontend are running.

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

11.19
——————————————————————————————————————————————————————————————————————————

# PocketLLM Portal - Prescriptive Architecture Documentation

**Course**: USC CSCI 578 - Software Architectures, Fall 2025  
**Date**:

---

## Table of Contents

1. [Summary](#1-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Scope](#3-scope)
4. [Architectural Style](#4-architectural-style)
5. [UML Diagrams](#5-uml-diagrams)
6. [Component Specifications](#6-component-specifications)
7. [Data Model](#7-data-model)
8. [API Specifications](#8-api-specifications)
9. [Technology Stack](#9-technology-stack)

---

## 1. Summary

PocketLLM Portal is a lightweight, browser-based LLM application. This prescriptive architecture document defines the complete system design ：）

**Core Capabilities Included in MVP**:

- User chat interface with LLM interaction
- Session management (create, list, view, delete)
- Message actions (rate, pin)
- Caching mechanism for repeated prompts
- Keyword search within sessions
- Basic telemetry and logging (can do later)

**Architecture Selection**: We selected a **Layered Client-Server architecture** combined with elements of **Microservices** patterns, utilizing:

- React frontend (presentation layer)
- FastAPI backend (business logic layer)
- PostgreSQL (data persistence layer)
- Redis (caching layer)

---

## 2. Architecture Overview

### Why This Architecture?

**Primary Style**: **Layered Client-Server** with **Cache-Aware** design

**Rationale**:

1. **Clear Separation of Concerns**: Each layer has distinct responsibilities, making the system maintainable and testable
2. **Resource Efficiency**: Caching layer (Redis)(cache latency ≤500ms)(cache hit rate ≥40%)
3. **Scalability**: Stateless backend allows horizontal scaling if needed in future
4. **Framework Compliance**: React's component-based architecture naturally maps to our UI requirements
5. **CPU-Only Constraint**: FastAPI's async capabilities maximize throughput on limited CPU resources

**Tradeoffs Accepted**:

- **Pro**: Simplicity and Capability to meet all functional requirements
- **Con**: Synchronous request-response may not be optimal for very long LLM generations (I thought all commercial LLM Portal provide sync response, are't they?)
- **Con**: Single backend instance creates a potential bottleneck (mitigated by keeping backend stateless)

**Alternative Considered**: Event-driven architecture with message queues was considered but rejected due to:

- Higher complexity
- Overkill for current scale (8 concurrent users per NFR11)
- Implementation time constraints (2.5 wks)

---

## 3. Scope

### 3.1 Included Features (MVP)

| Feature ID   | Component        | Description                                       | Priority |
| ------------ | ---------------- | ------------------------------------------------- | -------- |
| FR1          | Chat UI          | Send prompt, receive response                     | MUST     |
| FR2          | Session Manager  | Create, list, switch, delete sessions             | MUST     |
| FR11         | Cache Service    | Cache prompt-response pairs                       | MUST     |
| FR12         | Session Service  | Persist chat history                              | MUST     |
| FR13         | Logging Service  | Log metadata (timestamp, latency, cache hit/miss) | SHOULD   |
| Partial FR4  | Template Service | Basic prompt templates (3-5 predefined)           | SHOULD   |
| Partial FR14 | Telemetry        | Basic metrics (request count, cache hit rate)     | SHOULD   |

### 3.2 Excluded Features (Future Work)

- FR3: Fast/Accurate mode switching (use single mode only)
- FR5: Authentication service (assume single trusted user)
- FR6: Developer API playground
- FR10: Runtime configuration changes
- FR15: Rate limiting (not needed at current scale)
- FR16: Admin console UI
- FR17: Hot-swap model capability

### 3.3 Non-Functional Requirements Coverage

| NFR ID | Requirement                    | Implementation Strategy             |
| ------ | ------------------------------ | ----------------------------------- | ------------------------------------------------ |
| NFR1   | Cache latency ≤500ms           | Redis in-memory cache               |
| NFR2   | Cold latency ≤10s              | Lightweight model (1-3B parameters) | (Do we need to embed model into implementation?) |
| NFR6   | Reboot ≤10s                    | Docker containerization             |
| NFR10  | Logging metadata               | Structured logging in backend       |
| NFR11  | Support ≥8 concurrent sessions | FastAPI async handlers              |
| NFR12  | Cache hit rate ≥40%            | Semantic similarity matching        |
| NFR13  | UI learnability ≤30s           | Intuitive chat interface            |
| NFR17  | Dockerized, ready in ≤60s      | Docker Compose orchestration        |

---

## 4. Architectural Style

**Style**: **Layered Client-Server with Cache-Aware Pattern**

### 4.1 Layer Breakdown

```
┌─────────────────────────────────────────┐
│  Presentation Layer (React Frontend)    │
│  - SessionList, ChatWindow, Components  │
└─────────────────────────────────────────┘
                  ↓ HTTP/REST
┌─────────────────────────────────────────┐
│  API Gateway Layer (FastAPI Routers)    │
│  - Request validation, routing          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Business Logic Layer (Services)        │
│  - ChatService, CacheService, etc.      │
└─────────────────────────────────────────┘
        ↓                    ↓
┌──────────────────┐  ┌──────────────────┐
│  Cache Layer     │  │  Data Layer      │
│  (Redis)         │  │  (PostgreSQL)    │
└──────────────────┘  └──────────────────┘
```

### 4.2 Component Interaction Constraints

1. **Frontend → Backend**: Only through REST API endpoints (`/api/v1/*`)
2. **Backend → Cache**: Check cache before DB or LLM
3. **Backend → Database**: All persistent storage goes through ORM
4. **No direct Frontend ↔ Database**: Enforced by network isolation in Docker

---

## 5. UML Diagrams

### 5.1 Use Case Diagram

**Diagram Type**: UML Use Case Diagram

```
                    ┌──────────────────────┐
                    │   PocketLLM Portal   │
                    └──────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
     ┌────▼────┐         ┌────▼────┐          ┌───▼────┐
     │         │         │         │          │        │
     │  User   │         │ System  │          │  LLM   │
     │         │         │         │          │ Model  │
     └─────────┘         └─────────┘          └────────┘
          │                   │                    │
          │                   │                    │
  ┌───────┴───────┐      ┌────┴────┐           ┌───┴────┐
  │               │      │         │           │        │
  ├─ Create       │      ├─ Cache  │           ├─ Gen   │
  │   Session     │      │   Check │           │   Text │
  │               │      │         │           │        │
  ├─ Send Prompt  │      ├─ Store  │           │        │
  │               │      │   Data  │           │        │
  ├─ View         │      │         │           │        │
  │   History     │      ├─ Log    │           │        │
  │               │      │   Event │           │        │
  ├─ Rate         │      │         │           │        │
  │   Message     │      │         │           │        │
  │               │      │         │           │        │
  ├─ Pin Message  │      │         │           │        │
  │               │      │         │           │        │
  ├─ Search       │      │         │           │        │
  │   Messages    │      │         │           │        │
  │               │      │         │           │        │
  └─ Delete       │      │         │           │        │
      Session     │      │         │           │        │
                  │      │         │           │        │
```

**Use Cases**:

- **UC1**: Create Session
- **UC2**: Send Prompt & Receive Response (includes cache check, extends to LLM generation on cache miss)
- **UC3**: View Session History
- **UC4**: Rate Message (thumbs up/down)
- **UC5**: Pin/Unpin Message
- **UC6**: Search Messages in Session
- **UC7**: Delete Session

---

### 5.2 Component Diagram

**Diagram Type**: UML Component Diagram (Layered Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Container                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ SessionList  │  │ ChatWindow   │  │ MessageBubble│       │
│  │  Component   │  │  Component   │  │  Component   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                       │                                     │
│                  ┌────▼─────┐                               │
│                  │ API      │                               │
│                  │ Client   │                               │
│                  └──────────┘                               │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST
                        │ /api/v1/*
┌───────────────────────▼─────────────────────────────────────┐
│                    Backend Container                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │              API Gateway (FastAPI)                 │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │     │
│  │  │ /chat   │ │/sessions│ │/messages│ │/search  │   │     │
│  │  │ router  │ │ router  │ │ router  │ │ router  │   │     │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │     │
│  └──────────────────────┬───────────────────────────. ┘     │
│                         │                                   │
│  ┌──────────────────────▼───────────────────────────┐     │
│  │           Service Layer                          │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐      │     │
│  │  │  Chat    │ │  Cache   │ │  Logging     │      │     │
│  │  │ Service  │ │ Service  │ │  Service     │      │     │
│  │  └──────────┘ └──────────┘ └──────────────┘      │     │
│  │       │             │              │             │     │
│  │  ┌────▼─────┐  ┌───▼────┐    ┌────▼────┐         │     │
│  │  │   LLM    │  │Session │    │Telemetry│         │     │
│  │  │ Adapter  │  │Service │    │ Service │         │     │
│  │  └──────────┘  └────────┘    └─────────┘         │     │
│  └──────────────────────┬───────────────────────────┘     │
└─────────────────────────┼─────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │                                 │
┌────────▼─────────┐            ┌──────────▼────────┐
│  Redis Container │            │ PostgreSQL        │
│                  │            │ Container         │
│  ┌────────────┐  │            │  ┌─────────────┐  │
│  │ Cache      │  │            │  │  users      │  │
│  │ Store      │  │            │  │  sessions   │  │
│  └────────────┘  │            │  │  messages   │  │
│                  │            │  └─────────────┘  │
└──────────────────┘            └───────────────────┘
```

**Components**:

1. **Frontend Components**: UI rendering only, no business logic
2. **API Gateway**: Request routing, validation, error handling
3. **Service Layer**: Core business logic, orchestrates data flow
4. **LLM Adapter**: Isolates model interaction (stub for MVP)
5. **Cache Store (Redis)**: In-memory prompt-response cache
6. **Database (PostgreSQL)**: Persistent storage

---

### 5.3 Sequence Diagram - Send Prompt Flow

**Diagram Type**: UML Sequence Diagram

```
work in progress :)
```

**Key Steps**:

1. User types prompt in ChatWindow
2. Frontend sends POST to `/api/v1/chat` with `{session_id, prompt}`
3. API Gateway validates request
4. ChatService calls CacheService to check cache
5. **Cache Miss Path**: Call LLMAdapter → generate → save to DB → cache response
6. **Cache Hit Path** (not shown): Return cached response immediately
7. Return response to frontend with `{message_id, content, cached: true/false}`
8. Frontend displays message

---

### 5.4 Sequence Diagram - Session Management

**Diagram Type**: UML Sequence Diagram

```
User    Frontend    APIGateway    SessionService    PostgreSQL
 │          │            │              │              │
 │  clicks  │            │              │              │
 │  "New    │            │              │              │
 │  Chat"   │            │              │              │
 ├─────────>│            │              │              │
 │          │            │              │              │
 │          │ POST       │              │              │
 │          │ /api/v1/   │              │              │
 │          │ sessions   │              │              │
 │          ├───────────>│              │              │
 │          │            │              │              │
 │          │            │ create_      │              │
 │          │            │ session()    │              │
 │          │            ├─────────────>│              │
 │          │            │              │              │
 │          │            │              │  INSERT      │
 │          │            │              │  sessions    │
 │          │            │              ├─────────────>│
 │          │            │              │              │
 │          │            │              │  session_id  │
 │          │            │              │<─────────────┤
 │          │            │              │              │
 │          │            │  session_id  │              │
 │          │            │<─────────────┤              │
 │          │            │              │              │
 │          │  JSON      │              │              │
 │          │  {id}      │              │              │
 │          │<───────────┤              │              │
 │          │            │              │              │
 │  redirect│            │              │              │
 │  to /    │            │              │              │
 │  session │            │              │              │
 │  /:id    │            │              │              │
 │<─────────┤            │              │              │
```

---

### 5.5 Class Diagram - Backend Services

**Diagram Type**: UML Class Diagram

```
┌─────────────────────────────┐
│      ChatService            │
├─────────────────────────────┤
│ - cache_service: Cache      │
│ - llm_adapter: LLMAdapter   │
│ - session_service: Session  │
│ - logging_service: Logging  │
├─────────────────────────────┤
│ + generate_response(        │
│     session_id: UUID,       │
│     prompt: str             │
│   ): ChatResponse           │
│ + _check_cache(): Optional  │
│ + _call_model(): str        │
│ + _save_and_cache(): None   │
└─────────────────────────────┘
              │
              │ uses
              ▼
┌─────────────────────────────┐
│      CacheService           │
├─────────────────────────────┤
│ - redis_client: Redis       │
├─────────────────────────────┤
│ + get(key: str): Optional   │
│ + set(key: str,             │
│      value: str,            │
│      ttl: int): bool        │
│ + _generate_key(            │
│     session: UUID,          │
│     prompt: str): str       │
│ + increment_hits(key): None │
└─────────────────────────────┘

┌─────────────────────────────┐
│      SessionService         │
├─────────────────────────────┤
│ - db: Database              │
├─────────────────────────────┤
│ + create_session(           │
│     user_id: UUID,          │
│     title: str): Session    │
│ + get_sessions(             │
│     user_id: UUID): List    │
│ + get_session_detail(       │
│     session_id: UUID        │
│   ): SessionDetail          │
│ + delete_session(           │
│     session_id: UUID): bool │
│ + save_message(             │
│     session_id: UUID,       │
│     role: str,              │
│     content: str): Message  │
└─────────────────────────────┘

┌─────────────────────────────┐
│      LLMAdapter             │
├─────────────────────────────┤
│ - model_name: str           │
│ - max_tokens: int           │
├─────────────────────────────┤
│ + generate(                 │
│     prompt: str,            │
│     context: List[Message]  │
│   ): str                    │
│ + _format_context(): str    │
└─────────────────────────────┘

optional for now
┌─────────────────────────────┐
│      LoggingService         │
├─────────────────────────────┤
│ - logger: Logger            │
├─────────────────────────────┤
│ + log_request(              │
│     request_id: UUID,       │
│     endpoint: str,          │
│     latency: float,         │
│     cache_hit: bool): None  │
│ + log_error(                │
│     error: Exception): None │
└─────────────────────────────┘

optional for now
┌─────────────────────────────┐
│      TelemetryService       │
├─────────────────────────────┤
│ - metrics: Dict             │
├─────────────────────────────┤
│ + increment_request(): None │
│ + record_latency(           │
│     latency: float): None   │
│ + get_metrics(): Dict       │
└─────────────────────────────┘
```

---

### 5.6 Deployment Diagram

**Diagram Type**: UML Deployment Diagram

```
work in progress
```

**Deployment Specifications**:

- **Resource Limits**: Each container limited to ensure total ≤ 4 vCPU, 16GB RAM
- **Network**: Internal bridge network for container-to-container communication
- **Volumes**: Persist PostgreSQL data and logs across restarts
- **Startup Order**: postgres → redis → backend → frontend

---

## 6. Component Specifications

### 6.1 Frontend Components (React)

**File Structure**: (flexible 你可以自己改 与 function 对齐就行)

```
frontend/src/
├── components/
│   ├── SessionList.tsx      - Display and manage sessions
│   ├── ChatWindow.tsx       - Main chat interface
│   ├── MessageBubble.tsx    - Individual message display
│   └── SearchBar.tsx        - Message search
├── api/
│   ├── chat.ts             - Chat API calls
│   ├── sessions.ts         - Session API calls
│   └── messages.ts         - Message API calls
└── types/
    └── api.ts              - TypeScript interfaces
```

#### 6.1.1 SessionList Component

**Location**: `src/components/SessionList.tsx`

**Responsibilities**:

- Fetches and displays all user sessions
- Provides "New Chat" button to create sessions
- Allows deleting sessions with confirmation
- Clicking a session navigates to chat window

**Key API Calls**:

- GET `/api/v1/sessions` - Load sessions on mount
- POST `/api/v1/sessions` - Create new session
- DELETE `/api/v1/sessions/{id}` - Delete session

---

#### 6.1.2 ChatWindow Component

**Location**: `src/components/ChatWindow.tsx`

**Responsibilities**:

- Displays message history for a session
- Provides input box to send prompts
- Shows loading indicator during generation
- Displays "cached" badge for cached responses

**Key API Calls**:

- GET `/api/v1/sessions/{id}` - Load session and messages
- POST `/api/v1/chat` - Send prompt and get response

---

#### 6.1.3 MessageBubble Component

**Location**: `src/components/MessageBubble.tsx`

**Responsibilities**:

- Renders user or assistant message with appropriate styling
- Shows timestamp and cached indicator
- Provides thumbs up/down buttons (assistant messages only)
- Provides pin/bookmark button

**Key API Calls**:

- POST `/api/v1/messages/{id}/rate` - Rate message
- POST `/api/v1/messages/{id}/pin` - Toggle pin

---

#### 6.1.4 SearchBar Component

**Location**: `src/components/SearchBar.tsx`

**Responsibilities**:

- Provides search input for keyword search
- Displays search results in a list
- Allows clearing search to return to normal view

**Key API Calls**:

- GET `/api/v1/sessions/{id}/search?q={keyword}` - Search messages

---

### 6.2 Backend Services

**File Structure**: （下面的 function 定义也是可以按实际的更改）

```
backend/app/
├── routers/
│   ├── chat.py              - POST /chat
│   ├── sessions.py          - Session CRUD
│   ├── messages.py          - Message operations
│   └── metrics.py           - Telemetry endpoints (之后再做可以 先不用)
├── services/
│   ├── chat_service.py      - Chat orchestration
│   ├── cache_service.py     - Redis operations
│   ├── session_service.py   - DB operations for sessions
│   ├── llm_adapter.py       - LLM interface (stub 或者之后选定的llm api)
│   ├── logging_service.py   - Structured logging （这两个也是）
│   └── telemetry_service.py - Metrics tracking（这两个也是）
└── models/
    ├── database.py          - SQLAlchemy models orm映射
    └── api_models.py        - Pydantic schemas API 请求 & 响应的数据结构（不存储）
```

#### 6.2.1 ChatService

**Location**: `app/services/chat_service.py`

**Responsibilities**:

1. Check cache for prompt response
2. If cache miss: call LLM, save to DB, cache result
3. If cache hit: return cached response
4. Log all metadata (latency, cache hit/miss) (先可以不用)
5. Update telemetry (先可以不用)

**Key Method**:

```python
async def generate_response(
    session_id: UUID,
    prompt: str,
    request_id: UUID
) -> ChatResponse
```

**Flow**:

```
Check Cache → [Hit] Return cached
           → [Miss] Call LLM → Save to DB → Cache → Log → Return
```

---

#### 6.2.2 CacheService

**Location**: `app/services/cache_service.py`

**Responsibilities**:

- Generate cache keys from `session_id + prompt_hash`
- Store/retrieve responses in Redis
- Track cache hit statistics
- Set TTL of 1 hour for cache entries

**Key Methods**:

```python
async def get(session_id: UUID, prompt: str) -> Optional[Dict]
async def set(session_id: UUID, prompt: str, response: Dict) -> bool
async def get_stats() -> Dict  # Cache hit rate, total hits, etc.
```

**Cache Key Format**: `cache:{session_id}:{prompt_hash}`

---

#### 6.2.3 SessionService

**Location**: `app/services/session_service.py`

**Responsibilities**:

- CRUD operations for sessions and messages
- Fetch message history with pagination
- Full-text search in messages
- Update session timestamps on new messages

**Key Methods**:

```python
async def create_session(user_id: UUID, title: str) -> Session
async def get_sessions(user_id: UUID) -> List[Session]
async def get_session_detail(session_id: UUID) -> SessionDetail
async def delete_session(session_id: UUID) -> bool
async def save_message(session_id: UUID, role: str, content: str) -> Message
async def search_messages(session_id: UUID, query: str) -> List[Message]
```

---

#### 6.2.4 LLMAdapter

**Location**: `app/services/llm_adapter.py`

**Responsibilities** (MVP - Stub Implementation):

- Returns canned responses for testing
- Simulates 0.5s processing delay
- Formats context from previous messages
- **TODO**: Replace with real LLM in production ：）

**Key Method**:

```python
async def generate(prompt: str, context: List[Message]) -> str
```

**Stub Response Format**:

```
"[STUB] This is a generated response to: '{prompt}'.
In production, this would call {model_name}."
```

---

#### 6.2.5 LoggingService （log 和 telemetry 可以先不做）

**Location**: `app/services/logging_service.py`

**Responsibilities**:

- Log each request with metadata (request_id, latency, cache_hit, etc.)
- Log errors with context
- Output in JSON format for easy parsing

**Key Method**:

```python
def log_request(
    request_id: UUID,
    session_id: UUID,
    latency: float,
    cache_hit: bool,
    model_id: str = None
)
```

**Log Format Example**:

```json
{
  "request_id": "...",
  "session_id": "...",
  "latency_ms": 450.23,
  "cache_hit": true,
  "timestamp": "2025-11-19T12:34:56Z"
}
```

---

#### 6.2.6 TelemetryService

**Location**: `app/services/telemetry_service.py`

**Responsibilities**:

- Track total requests, cache hits/misses
- Record latency for all requests
- Calculate p95 latency and cache hit rate
- Provide metrics via `/api/v1/metrics` endpoint

**Key Methods**:

```python
async def increment_cache_hit()
async def increment_cache_miss()
async def record_latency(latency: float)
async def get_metrics() -> Dict
```

**Metrics Returned**:

- total_requests
- cache_hit_rate
- avg_latency_ms
- p95_latency_ms
- error_count
- uptime_seconds

---

## 7. Data Model

### 7.1 PostgreSQL Schema

**File**: `backend/app/db/migrations/001_initial_schema.sql`

#### users table

| Column        | Type         | Constraints                            | Notes                         |
| ------------- | ------------ | -------------------------------------- | ----------------------------- |
| id            | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid() | User identifier               |
| email         | VARCHAR(255) | UNIQUE, NOT NULL                       | User email                    |
| password_hash | VARCHAR(255) | -                                      | For future auth (MVP: unused) |
| role          | VARCHAR(20)  | DEFAULT 'user'                         | 'user' or 'admin'             |
| created_at    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP              | Creation time                 |

**Indexes**: None needed for MVP (single default user)

---

#### sessions table

| Column     | Type         | Constraints                            | Notes              |
| ---------- | ------------ | -------------------------------------- | ------------------ |
| id         | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid() | Session identifier |
| user_id    | UUID         | FOREIGN KEY → users(id), NOT NULL      | Owner              |
| title      | VARCHAR(255) | NOT NULL, DEFAULT 'New Chat'           | Session name       |
| created_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP              | Creation time      |
| updated_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP              | Last message time  |

**Indexes**:

- `idx_sessions_user_id` on `user_id`
- `idx_sessions_updated_at` on `updated_at DESC` (for sorting)

**On Delete**: CASCADE (delete sessions when user deleted)

---

#### messages table

| Column     | Type        | Constraints                             | Notes              |
| ---------- | ----------- | --------------------------------------- | ------------------ |
| id         | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()  | Message identifier |
| session_id | UUID        | FOREIGN KEY → sessions(id), NOT NULL    | Parent session     |
| role       | VARCHAR(20) | NOT NULL, CHECK ('user' OR 'assistant') | Message sender     |
| content    | TEXT        | NOT NULL                                | Message text       |
| rating     | VARCHAR(10) | CHECK ('up', 'down', NULL)              | User feedback      |
| pinned     | BOOLEAN     | DEFAULT FALSE                           | Bookmarked status  |
| created_at | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP               | Message time       |

**Indexes**:

- `idx_messages_session_id` on `session_id`
- `idx_messages_created_at` on `created_at`
- `idx_messages_pinned` on `pinned` WHERE `pinned = TRUE`
- `idx_messages_content_search` GIN index on `to_tsvector('english', content)` (for full-text search)

**On Delete**: CASCADE (delete messages when session deleted)

---

#### Default Data （flexible 可以改）

```sql
-- Insert default user for MVP (no authentication)
INSERT INTO users (id, email, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'default@pocketllm.local', 'user');
```

---

### 7.2 Redis Data Structures （这个我没仔细看 生成的当参考可以自行看一下做的时候）

#### Cache Entries

**Key Format**: `cache:{session_id}:{prompt_hash}`

- `prompt_hash`: First 16 chars of SHA256 hash of prompt text
- **TTL**: 3600 seconds (1 hour)

**Value** (JSON string):

```json
{
  "message_id": "uuid",
  "content": "response text"
}
```

**Example**:

```
Key: cache:123e4567-e89b-12d3-a456-426614174000:abc123def456
Value: {"message_id":"789...", "content":"Here is the answer..."}
```

---

#### Cache Statistics

**Key**: `cache_stats` (Redis Hash)

**Fields**:

- `{cache_key}:hits` → Integer (number of times this cache entry was hit)
- `{cache_key}:cached_at` → Float (Unix timestamp when cached)

**Example**:

```
HGETALL cache_stats
1) "cache:123...:abc:hits"
2) "5"
3) "cache:123...:abc:cached_at"
4) "1732041600.0"
```

---

### 7.3 Data Relationships

```
users (1) ──< sessions (many)
             │
             └──< messages (many)
```

**Cascade Delete Rules**:

- Delete user → Delete all their sessions → Delete all messages in those sessions
- Delete session → Delete all messages in that session

---

## 8. API Specifications

(What Endpoints to Implement)

**Base URL**: `http://localhost:8000/api/v1`
All responses are JSON. Timestamps use ISO 8601 strings.

### 8.1 Chat

- **POST `/chat`**

  - Request:

    ```json
    { "session_id": "uuid", "prompt": "string" }
    ```

  - Response:

    ```json
    {
      "message_id": "uuid",
      "content": "string",
      "cached": true | false
    }
    ```

  - Behavior:

    - Check cache → return cached if found.
    - Otherwise:

      - Load recent context from DB,
      - Call `LLMAdapter`,
      - Save user + assistant messages,
      - Cache assistant response.

### 8.2 Sessions

- **POST `/sessions`**
  Create a new chat session.

  - Request: `{ "title": "optional string" }`
  - Response: `{ "session_id": "uuid" }`

- **GET `/sessions`**
  List all sessions for the (default) user.

  - Response: array of `{ session_id, title, message_count, created_at, updated_at }`.

- **GET `/sessions/{id}`**
  Get one session plus full message history (ordered by time).

- **DELETE `/sessions/{id}`**
  Delete a session and all its messages.

### 8.3 Messages

- **GET `/messages/{id}`**
  Return one message’s full info.

- **POST `/messages/{id}/rate`**

  - Request: `{ "rating": "up" | "down" }`
  - Sets the rating for an **assistant** message.

- **POST `/messages/{id}/pin`**

  - Request body optional (can be empty).
  - If body omitted → toggle pin state.
  - Response: `{ "message_id": "uuid", "pinned": true | false }`.

### 8.4 Search

- **GET `/sessions/{id}/search?q=keyword&limit=20`**

  - Uses PostgreSQL full-text search on `messages.content`.
  - Response: `{ query, session_id, results: [ {message_id, role, content, created_at} ], total_results }`.

---

## 9. Technology Stack

---
