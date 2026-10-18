from sqlalchemy.orm import Session
from backend.app.models.workspace import Workspace
from backend.app.db.session import SessionLocal, engine
from backend.app.db.base import Base


def init_db(db: Session | None = None) -> None:
    """Initialize database tables and ensure default workspace exists."""
    # Ensure tables exist (Alembic or metadata)
    Base.metadata.create_all(bind=engine)

    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        # Check if default workspace exists
        default_ws = db.query(Workspace).filter(Workspace.is_default == True).first()
        if not default_ws:
            default_ws = Workspace(
                id="default",
                name="Personal",
                slug="personal",
                color="#6366F1",
                icon="folder",
                is_default=True,
            )
            db.add(default_ws)
            db.commit()
    finally:
        if close_session:
            db.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized with default workspace.")
