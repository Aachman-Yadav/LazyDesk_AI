"""
LazyDesk AI - Configuration Module
Reads settings from environment variables / .env file.
"""
from __future__ import annotations

import os
from functools import lru_cache
from zoneinfo import ZoneInfo

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Ollama configuration
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_timeout: int = 120  # seconds

    # Backend server configuration
    backend_host: str = "127.0.0.1"
    backend_port: int = 8000

    # Frontend origin for CORS
    frontend_origin: str = "http://localhost:5173"

    # Timezone for deadline resolution (IANA timezone name)
    local_timezone: str = "Asia/Kolkata"

    # Input limits
    max_notes_length: int = 5000
    min_notes_length: int = 10

    # AI retry configuration
    max_retries: int = 2

    # Demo mode (uses sample responses - NEVER the default in production)
    demo_mode: bool = False

    @property
    def timezone(self) -> ZoneInfo:
        """Return the configured timezone as a ZoneInfo object."""
        try:
            return ZoneInfo(self.local_timezone)
        except Exception:
            return ZoneInfo("UTC")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
