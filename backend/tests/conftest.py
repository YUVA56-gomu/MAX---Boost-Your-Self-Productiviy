import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from backend.app.config import settings
from backend.app.db.base import Base
from backend.app.db.session import get_db
import backend.app.models  # Load all models
from backend.app.models.workspace import Workspace
from backend.app.main import app

from sqlalchemy.pool import StaticPool

# Isolated in-memory SQLite engine for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    expire_on_commit=False,
)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh database tables and yield an isolated database session per test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()

    # Seed default workspace
    ws = Workspace(
        id="default",
        name="Personal",
        slug="personal",
        color="#6366F1",
        icon="folder",
        is_default=True,
    )
    session.add(ws)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """TestClient with get_db overridden to use isolated db_session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers():
    """Valid Bearer authorization headers matching configured token."""
    return {"Authorization": f"Bearer {settings.auth_token}"}
