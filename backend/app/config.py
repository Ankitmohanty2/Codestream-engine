from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    mongo_host: str = "localhost"
    mongo_port: int = 27017
    mongo_db_name: str = "codestream"

    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    auto_save_interval: int = 5

    code_execution_timeout: int = 30

    cors_origins: list[str] = ["http://localhost:3000"]

    @property
    def mongo_url(self) -> str:
        return f"mongodb://{self.mongo_host}:{self.mongo_port}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
