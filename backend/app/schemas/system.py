from pydantic import BaseModel


class ShutdownResponse(BaseModel):
    status: str = "shutting_down"
