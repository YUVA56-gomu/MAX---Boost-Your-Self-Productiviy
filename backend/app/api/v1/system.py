import os
import signal
import threading
from fastapi import APIRouter, status
from backend.app.schemas.system import ShutdownResponse
from backend.app.db.session import engine

router = APIRouter(prefix="/system", tags=["System"])


def perform_shutdown():
    """Flush database connections and terminate process."""
    try:
        engine.dispose()
    finally:
        # Trigger SIGTERM to terminate the process cleanly
        os.kill(os.getpid(), signal.SIGTERM)


@router.post("/shutdown", response_model=ShutdownResponse, status_code=status.HTTP_200_OK)
def system_shutdown():
    """Gracefully flush open SQLite WAL connections and exit sidecar."""
    # Run shutdown in a background thread so the HTTP 200 response completes
    threading.Timer(0.2, perform_shutdown).start()
    return ShutdownResponse(status="shutting_down")
