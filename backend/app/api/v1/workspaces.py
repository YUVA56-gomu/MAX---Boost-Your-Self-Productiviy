from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.session import get_db
from backend.app.models.workspace import Workspace
from backend.app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
)

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(db: Session = Depends(get_db)):
    """List all available workspaces."""
    return db.query(Workspace).order_by(Workspace.is_default.desc(), Workspace.name.asc()).all()


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(payload: WorkspaceCreate, db: Session = Depends(get_db)):
    """Create a new workspace."""
    existing = db.query(Workspace).filter(Workspace.slug == payload.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Workspace with slug '{payload.slug}' already exists",
        )

    ws = Workspace(**payload.model_dump())
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: str, db: Session = Depends(get_db)):
    """Get single workspace by UUID or slug."""
    ws = db.query(Workspace).filter(
        (Workspace.id == workspace_id) | (Workspace.slug == workspace_id)
    ).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return ws


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(workspace_id: str, payload: WorkspaceUpdate, db: Session = Depends(get_db)):
    """Update workspace attributes."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != ws.slug:
        existing = db.query(Workspace).filter(Workspace.slug == update_data["slug"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Workspace slug '{update_data['slug']}' already in use",
            )

    for field, value in update_data.items():
        setattr(ws, field, value)

    db.commit()
    db.refresh(ws)
    return ws


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace_id: str, db: Session = Depends(get_db)):
    """Delete a workspace (default workspace cannot be deleted)."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    if ws.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete default primary workspace",
        )

    db.delete(ws)
    db.commit()
    return None
