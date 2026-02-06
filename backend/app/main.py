from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import engine
from app.api import users, sessions, posture, websockets
import redis.asyncio as redis
from app.core.celery_app import REDIS_URL
from app.core.socket_manager import manager
import asyncio
import json

async def redis_listener():
    """Background task to subscribe to Redis and broadcast to WebSockets."""
    try:
        r = redis.from_url(REDIS_URL, decode_responses=True)
        pubsub = r.pubsub()
        await pubsub.subscribe("posture_updates", "notifications")
        print("✓ Redis listener started")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    await manager.broadcast(data)
                except json.JSONDecodeError:
                    print(f"Error decoding Redis message: {message['data']}")
    except Exception as e:
        print(f"✗ Redis listener failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Check database connection
    try:
        with engine.connect() as conn:
            print("✓ Database connection successful")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
    
    # Start Redis listener
    task = asyncio.create_task(redis_listener())
    
    yield
    
    # Shutdown
    print("Shutting down...")
    task.cancel()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
    description="Real-time posture monitoring and analytics API"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(users.router, prefix=settings.api_v1_prefix)
app.include_router(sessions.router, prefix=settings.api_v1_prefix)
app.include_router(posture.router, prefix=settings.api_v1_prefix)
app.include_router(websockets.router) # WebSocket endpoint


@app.get("/")
async def root():
    return {
        "message": "Posture Monitor API",
        "status": "running",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


