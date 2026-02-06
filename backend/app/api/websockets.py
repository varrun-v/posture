from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.socket_manager import manager

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive and listen for any client messages
            # (Though currently we only push from server)
            data = await websocket.receive_text()
            # Echo or process if needed
            # await manager.send_personal_message({"message": "Ack"}, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
