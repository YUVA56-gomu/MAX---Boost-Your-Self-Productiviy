from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class WorkspaceBase(BaseModel):
    name: str
    slug: str
    color: Optional[str] = "#6366F1"
    icon: Optional[str] = "folder"


class WorkspaceCreate(WorkspaceBase):
    is_default: Optional[bool] = False


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_default: Optional[bool] = None


class WorkspaceResponse(WorkspaceBase):
    id: str
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
