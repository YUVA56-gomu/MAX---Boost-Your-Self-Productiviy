from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List


class NoteBase(BaseModel):
    title: str
    content_markdown: Optional[str] = ""
    is_pinned: Optional[bool] = False


class NoteCreate(NoteBase):
    workspace_id: str
    project_id: Optional[str] = None
    goal_id: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content_markdown: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None
    project_id: Optional[str] = None
    goal_id: Optional[str] = None


class NoteBacklinkResponse(BaseModel):
    id: str
    source_note_id: str
    source_note_title: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NoteResponse(NoteBase):
    id: str
    workspace_id: str
    project_id: Optional[str] = None
    goal_id: Optional[str] = None
    is_archived: bool
    outgoing_link_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
