from functools import lru_cache
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration."""

    database_url: str = Field(default="sqlite:///./invoices.db")
    secret_key: str = Field(default="your-secret-key-change-in-production")

    # Google OAuth
    google_client_id: Optional[str] = Field(default=None)
    google_client_secret: Optional[str] = Field(default=None)
    google_redirect_uri: str = Field(default="http://localhost:8000/auth/google/callback")

    # OpenAI
    openai_api_key: Optional[str] = Field(default=None)

    # Frontend
    frontend_url: str = Field(default="http://localhost:3000")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


@lru_cache
def get_settings() -> Settings:
    """Returns cached settings instance."""
    return Settings()
