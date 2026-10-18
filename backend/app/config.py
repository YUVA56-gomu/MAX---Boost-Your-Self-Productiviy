from typing import List, Optional
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings for local-first backend."""

    app_name: str = "Adaptive Productivity Backend"
    app_version: str = "0.1.0"
    app_env: str = "development"  # "development", "test", "production"
    
    # Loopback binding: strictly 127.0.0.1
    host: str = "127.0.0.1"
    port: int = 24125
    
    # Restricted CORS origins for local dev and Tauri
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "tauri://localhost",
    ]
    
    # Local SQLite database path - connection pool initialized in Milestone 2
    database_url: str = "sqlite:///./data/app.db"

    # Ephemeral 32-byte authorization token injected via APP_AUTH_TOKEN
    # In production, Tauri generates a random token and injects it via APP_AUTH_TOKEN
    auth_token: Optional[str] = None

    # Local AI (Ollama) settings - full application service scheduled for Milestone 6
    ai_enabled: bool = False
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "gemma2:2b"
    ai_probe_timeout_seconds: float = 0.5

    @model_validator(mode="after")
    def validate_auth_token_for_env(self) -> "Settings":
        DEV_FALLBACK_TOKEN = "dev-ephemeral-auth-token-32-bytes-local"
        if self.app_env == "production":
            if not self.auth_token or self.auth_token == DEV_FALLBACK_TOKEN:
                raise ValueError(
                    "In production mode, a secure, non-default APP_AUTH_TOKEN must be provided by the Tauri shell."
                )
        else:
            if not self.auth_token:
                self.auth_token = DEV_FALLBACK_TOKEN
        return self

    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
