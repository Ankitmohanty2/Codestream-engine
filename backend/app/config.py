"""
Configuration module using Pydantic Settings.
Manages environment variables for the application.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # MongoDB Configuration
    mongo_host: str = "localhost"
    mongo_port: int = 27017
    mongo_db_name: str = "codestream"

    # Application Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # Auto-save interval in seconds
    auto_save_interval: int = 5

    # Code execution timeout in seconds
    code_execution_timeout: int = 30

    # CORS settings
    cors_origins: list[str] = ["http://localhost:3000"]

    @property
    def mongo_url(self) -> str:
        """Construct MongoDB connection URL."""
        return f"mongodb://{self.mongo_host}:{self.mongo_port}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
