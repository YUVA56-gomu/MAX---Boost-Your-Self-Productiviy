from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.project import Project
from backend.app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
)

router = APIRouter(prefix="/projects", tags=["Goals & Projects"])


def serialize_project(project: Project) -> ProjectResponse:
    """Helper to convert Project model with task metrics."""
    tasks = project.tasks
    completed = [t for t in tasks if t.status == "completed"]
    return ProjectResponse(
        id=project.id,
        workspace_id=project.workspace_id,
        goal_id=project.goal_id,
        title=project.title,
        description=project.description,
        color=project.color,
        status=project.status,
        target_date=project.target_date,
        position=project.position,
        task_count=len(tasks),
        completed_task_count=len(completed),
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    workspace_id: str = Query(..., description="Target workspace ID"),
    goal_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List projects matching query filters."""
    query = db.query(Project).filter(Project.workspace_id == workspace_id)
    if goal_id:
        query = query.filter(Project.goal_id == goal_id)
    if status:
        query = query.filter(Project.status == status)

    projects = query.order_by(Project.position.asc(), Project.created_at.desc()).all()
    return [serialize_project(p) for p in projects]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project container."""
    project = Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return serialize_project(project)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get single project by ID."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return serialize_project(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, payload: ProjectUpdate, db: Session = Depends(get_db)):
    """Update project attributes."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(project, field, val)

    db.commit()
    db.refresh(project)
    return serialize_project(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Delete project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    db.delete(project)
    db.commit()
    return None
