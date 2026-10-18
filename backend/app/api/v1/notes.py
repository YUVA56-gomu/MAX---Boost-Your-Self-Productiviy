import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.db.session import get_db
from backend.app.models.note import Note, NoteLink
from backend.app.schemas.note import (
    NoteCreate,
    NoteUpdate,
    NoteResponse,
    NoteBacklinkResponse,
)

router = APIRouter(prefix="/notes", tags=["Contextual Notes"])


def sync_wikilinks(note: Note, db: Session):
    """Parse [[Target Title]] links in markdown and sync NoteLink association records."""
    db.query(NoteLink).filter(NoteLink.source_note_id == note.id).delete()

    # Find [[WikiLink]] occurrences
    links = re.findall(r"\[\[(.*?)\]\]", note.content_markdown)
    for target_title in set(links):
        target = (
            db.query(Note)
            .filter(
                Note.workspace_id == note.workspace_id,
                Note.title.ilike(target_title.strip()),
                Note.id != note.id,
            )
            .first()
        )
        if target:
            db.add(NoteLink(source_note_id=note.id, target_note_id=target.id))


@router.get("", response_model=List[NoteResponse])
def list_notes(
    workspace_id: str = Query(..., description="Target workspace ID"),
    project_id: Optional[str] = None,
    goal_id: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List contextual notes for workspace."""
    query = db.query(Note).filter(Note.workspace_id == workspace_id, Note.is_archived == False)
    if project_id:
        query = query.filter(Note.project_id == project_id)
    if goal_id:
        query = query.filter(Note.goal_id == goal_id)
    if search:
        query = query.filter(
            or_(Note.title.ilike(f"%{search}%"), Note.content_markdown.ilike(f"%{search}%"))
        )

    notes = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc()).all()
    results = []
    for n in notes:
        out_links = db.query(NoteLink).filter(NoteLink.source_note_id == n.id).count()
        results.append(
            NoteResponse(
                id=n.id,
                workspace_id=n.workspace_id,
                project_id=n.project_id,
                goal_id=n.goal_id,
                title=n.title,
                content_markdown=n.content_markdown,
                is_pinned=n.is_pinned,
                is_archived=n.is_archived,
                outgoing_link_count=out_links,
                created_at=n.created_at,
                updated_at=n.updated_at,
            )
        )
    return results


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)):
    """Create a new note and sync outgoing wikilinks."""
    note = Note(**payload.model_dump())
    db.add(note)
    db.flush()

    sync_wikilinks(note, db)
    db.commit()
    db.refresh(note)

    out_links = db.query(NoteLink).filter(NoteLink.source_note_id == note.id).count()
    return NoteResponse(
        id=note.id,
        workspace_id=note.workspace_id,
        project_id=note.project_id,
        goal_id=note.goal_id,
        title=note.title,
        content_markdown=note.content_markdown,
        is_pinned=note.is_pinned,
        is_archived=note.is_archived,
        outgoing_link_count=out_links,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: str, db: Session = Depends(get_db)):
    """Get note by ID."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    out_links = db.query(NoteLink).filter(NoteLink.source_note_id == note.id).count()
    return NoteResponse(
        id=note.id,
        workspace_id=note.workspace_id,
        project_id=note.project_id,
        goal_id=note.goal_id,
        title=note.title,
        content_markdown=note.content_markdown,
        is_pinned=note.is_pinned,
        is_archived=note.is_archived,
        outgoing_link_count=out_links,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, payload: NoteUpdate, db: Session = Depends(get_db)):
    """Update note content and resync wikilinks."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(note, field, val)

    if "content_markdown" in update_data:
        sync_wikilinks(note, db)

    db.commit()
    db.refresh(note)

    out_links = db.query(NoteLink).filter(NoteLink.source_note_id == note.id).count()
    return NoteResponse(
        id=note.id,
        workspace_id=note.workspace_id,
        project_id=note.project_id,
        goal_id=note.goal_id,
        title=note.title,
        content_markdown=note.content_markdown,
        is_pinned=note.is_pinned,
        is_archived=note.is_archived,
        outgoing_link_count=out_links,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: str, db: Session = Depends(get_db)):
    """Delete a note and its links."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    db.delete(note)
    db.commit()
    return None


@router.get("/{note_id}/backlinks", response_model=List[NoteBacklinkResponse])
def get_note_backlinks(note_id: str, db: Session = Depends(get_db)):
    """Get all incoming wikilink references pointing to this note."""
    links = db.query(NoteLink).filter(NoteLink.target_note_id == note_id).all()
    results = []
    for l in links:
        source_note = db.query(Note).filter(Note.id == l.source_note_id).first()
        if source_note:
            results.append(
                NoteBacklinkResponse(
                    id=l.id,
                    source_note_id=source_note.id,
                    source_note_title=source_note.title,
                    created_at=l.created_at,
                )
            )
    return results
