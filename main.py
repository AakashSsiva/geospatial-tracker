from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import asyncio
import json
from analysis.panoptic import run_detection_cycle
from ingestion.traffic_cams import get_all_camera_info
from config import POLL_INTERVAL_SECONDS, OPENSKY_BBOX

app = FastAPI(
    title="Geospatial Tracker — World Monitor",
    description="Real-time geospatial tracking with OpenSky + Gemini Vision",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connected_clients: list[WebSocket] = []
latest_geojson: dict = {"type": "FeatureCollection", "features": [], "metadata": {}}

# Current active bounding box — can be changed via API
current_bbox: dict = dict(OPENSKY_BBOX)


class RegionRequest(BaseModel):
    lamin: float
    lomin: float
    lamax: float
    lomax: float
    name: str = ""


@app.get("/")
async def root():
    return {
        "service": "Geospatial Tracker — World Monitor",
        "status": "running",
        "connected_clients": len(connected_clients),
        "latest_features": len(latest_geojson.get("features", [])),
        "current_bbox": current_bbox,
    }


@app.get("/api/cameras")
async def get_cameras():
    cameras = await get_all_camera_info()
    return JSONResponse(content=cameras)


@app.get("/api/latest")
async def get_latest():
    return JSONResponse(content=latest_geojson)


@app.get("/api/region")
async def get_region():
    """Returns the current active bounding box."""
    return JSONResponse(content=current_bbox)


@app.post("/api/region")
async def set_region(region: RegionRequest):
    """Updates the bounding box for aircraft tracking."""
    global current_bbox, latest_geojson
    current_bbox = {
        "lamin": region.lamin,
        "lomin": region.lomin,
        "lamax": region.lamax,
        "lomax": region.lomax,
    }
    print(f"[Region] Changed to: {region.name} → {current_bbox}")

    # Clear current data and run an immediate detection cycle
    latest_geojson = {"type": "FeatureCollection", "features": [], "metadata": {}}

    # Broadcast empty state immediately so frontend clears old markers
    payload = json.dumps(latest_geojson)
    for client in connected_clients.copy():
        try:
            await client.send_text(payload)
        except Exception:
            if client in connected_clients:
                connected_clients.remove(client)

    # Trigger immediate fetch in background
    asyncio.create_task(run_and_broadcast())

    return JSONResponse(content={"status": "ok", "bbox": current_bbox, "name": region.name})


async def run_and_broadcast():
    """Run a single detection cycle and broadcast results."""
    global latest_geojson
    try:
        geojson = await run_detection_cycle(bbox_override=current_bbox)
        latest_geojson = geojson
        payload = json.dumps(geojson)
        for client in connected_clients.copy():
            try:
                await client.send_text(payload)
            except Exception:
                if client in connected_clients:
                    connected_clients.remove(client)
        print(f"[Region] Immediate fetch: {len(geojson.get('features', []))} features")
    except Exception as e:
        print(f"[Region] Fetch error: {e}")


@app.websocket("/ws/live")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_clients.append(ws)
    print(f"[WS] Client connected. Total: {len(connected_clients)}")

    try:
        await ws.send_text(json.dumps(latest_geojson))
    except Exception:
        pass

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(ws)
        print(f"[WS] Client disconnected. Total: {len(connected_clients)}")
    except Exception:
        if ws in connected_clients:
            connected_clients.remove(ws)


async def broadcast_loop():
    global latest_geojson
    await asyncio.sleep(2)

    while True:
        try:
            print(f"[Broadcast] Running detection cycle...")
            geojson = await run_detection_cycle(bbox_override=current_bbox)
            latest_geojson = geojson

            payload = json.dumps(geojson)
            features_count = len(geojson.get("features", []))
            print(f"[Broadcast] {features_count} features → {len(connected_clients)} clients")

            for client in connected_clients.copy():
                try:
                    await client.send_text(payload)
                except Exception:
                    if client in connected_clients:
                        connected_clients.remove(client)

        except Exception as e:
            print(f"[Broadcast] Cycle error: {e}")

        await asyncio.sleep(POLL_INTERVAL_SECONDS)


@app.on_event("startup")
async def startup():
    print(f"[Server] Starting broadcast loop (interval: {POLL_INTERVAL_SECONDS}s)")
    asyncio.create_task(broadcast_loop())
