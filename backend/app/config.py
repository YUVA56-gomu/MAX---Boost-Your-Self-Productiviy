from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application configuration settings for local-first backend."""

    app_name: str = "Adaptive Productivity Backend"
    app_version: str = "0.1.0"
    
    # Loopback binding: strictly 127.0.0.1
    host: str = "127.0.0.1"
    port: int = 24125
    
    # Restricted CORS origins for local dev and Tauri
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "tauri://localhost",
    ]
    
    # Local SQLite database path
    database_url: str = "sqlite:///./data/app.db"

    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
