#  CodeStream Engine

A real-time collaborative code editor built with **FastAPI, WebSockets, MongoDB, and Next.js**.

CodeStream Engine allows multiple users to edit code simultaneously inside shared rooms, execute programs on the backend, and see live cursor updates — similar to Google Docs, but for code.

---


##  Purpose

This project explores:

- Real-time distributed state synchronization
- WebSocket connection management
- Concurrency handling with version control
- Conflict resolution strategies
- Backend code execution sandboxing
- Scalable architecture design

It goes beyond CRUD APIs and demonstrates systems-level backend engineering.

---

#  System Architecture

Client (Next.js + Monaco Editor)
        │
        │ WebSocket (Diff + Cursor Events)
        ▼
FastAPI WebSocket Manager
        │
        │ Async State Handling
        ▼
MongoDB (Motor - Async Driver)
        │
        ▼
Code Execution Engine (Sandboxed subprocess)

---

#  Tech Stack

## Backend
- FastAPI (async)
- WebSockets
- MongoDB (Motor - async driver)
- Pydantic
- Docker
- Python subprocess (sandboxed execution)

## Frontend
- Next.js (App Router)
- Tailwind CSS
- Monaco Editor
- WebSocket API

---

#  Project Structure

backend/
├── app/
│   ├── config.py           # Environment configuration
│   ├── main.py            # Application entry point
│   ├── dependencies.py    # Dependency injection
│   ├── models/
│   │   ├── schemas.py     # Pydantic schemas
│   │   └── database.py    # MongoDB models & repositories
│   ├── routers/
│   │   ├── rooms.py       # REST endpoints for rooms
│   │   ├── execution.py   # Code execution endpoint
│   │   └── websocket.py   # WebSocket handler
│   └── services/
│       ├── connection_manager.py  # WebSocket connection management
│       ├── sync_service.py       # Code sync & conflict resolution
│       └── execution_service.py  # Code execution sandbox
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

### Frontend (Next.js)

```
frontend/
├── app/
│   ├── page.tsx              # Home page (create/join rooms)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── room/[roomId]/
│       └── page.tsx          # Collaborative editor page
├── components/
│   ├── Editor.tsx            # Monaco Editor wrapper
│   ├── Terminal.tsx          # Code output terminal
│   └── Sidebar.tsx          # User list & controls
├── hooks/
│   └── useWebSocket.ts       # WebSocket hook with reconnection
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── Dockerfile
```

### Database Schema

**Room Collection:**
```json
{
  "room_id": "string",
  "name": "string",
  "language": "python|cpp",
  "code": "string",
  "version": 1,
  "created_at": "datetime",
  "updated_at": "datetime",
  "active_users": []
}
```

### WebSocket Message Format

```json
{
  "type": "code_update",
  "version": 12,
  "diff": {
    "start": 25,
    "end": 30,
    "text": "int main() {"
  }
}
