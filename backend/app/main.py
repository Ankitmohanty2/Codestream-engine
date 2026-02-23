import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.database import Database
from app.services.sync_service import SyncService
from app.services.connection_manager import manager
from app.routers import rooms, execution, websocket

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting CodeStream Engine...")
    await Database.connect()
    logger.info("Database connected")
    auto_save_task = asyncio.create_task(auto_save_loop())

    yield

    logger.info("Shutting down CodeStream Engine...")
    auto_save_task.cancel()
    try:
        await auto_save_task
    except asyncio.CancelledError:
        pass
    await Database.disconnect()
    logger.info("Database disconnected")


async def auto_save_loop():
    while True:
        try:
            await asyncio.sleep(settings.auto_save_interval)
            for room_id in list(manager.rooms.keys()):
                db = Database.get_db()
                from app.models.database import RoomRepository
                repo = RoomRepository(db)
                sync_service = SyncService(repo)
                await sync_service.save_snapshot(room_id)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Auto-save error: {e}")


app = FastAPI(
    title="CodeStream Engine API",
    description="Real-time collaborative code editor backend",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms.router)
app.include_router(execution.router)
app.include_router(websocket.router)


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "CodeStream Engine",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected" if Database.db is not None else "disconnected",
        "active_rooms": len(manager.rooms)
    }
