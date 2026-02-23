# 🚀 CodeStream Engine

A real-time collaborative code editor built with **FastAPI, WebSockets, MongoDB, and Next.js**.

CodeStream Engine allows multiple users to edit code simultaneously inside shared rooms, execute programs on the backend, and see live cursor updates — similar to Google Docs, but for code.

---


## 🧠 Purpose

This project explores:

- Real-time distributed state synchronization
- WebSocket connection management
- Concurrency handling with version control
- Conflict resolution strategies
- Backend code execution sandboxing
- Scalable architecture design

It goes beyond CRUD APIs and demonstrates systems-level backend engineering.

---

# 🏗 System Architecture

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

# ⚙️ Tech Stack

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

# 📂 Project Structure

backend/
│
├── app/
│   ├── routers/
│   │   ├── rooms.py
│   │   └── execution.py
│   │
│   ├── services/
│   │   ├── connection_manager.py
│   │   ├── room_service.py
│   │   └── execution_service.py
│   │
│   ├── repositories/
│   │   └── room_repository.py
│   │
│   ├── schemas/
│   │   └── room_schema.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   │
│   └── main.py
│
├── Dockerfile
└── docker-compose.yml

---

# 🔌 WebSocket API

### Endpoint

/ws/{room_id}

---

## Message Types

### 1. Code Update (Diff)

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
