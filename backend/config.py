import os
import secrets
import warnings
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import json


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    jwt_secret: str = secrets.token_urlsafe(32)   # auto-generated if not set
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440        # 24 hours
    backend_cors_origins: Union[str, List[str]] = [
        "http://localhost:5173",
        "https://your-frontend.vercel.app",
    ]
    environment: str = "development"
    embedding_model: str = "all-MiniLM-L6-v2"
    demo_mode: bool = False  # Set DEMO_MODE=true in .env for hackathon judge demos only

    # OCR Configurations
    ocr_engine: str = "auto"
    ocr_cloud_provider: str = "aws"
    
    aws_textract_region: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    
    ocr_tesseract_min_confidence: float = 0.60
    ocr_cloud_min_confidence: float = 0.75
    
    ocr_max_pages: int = 200
    ocr_large_doc_sample_rate: int = 5
    
    ocr_dpi: int = 300
    ocr_parallel_workers: int = 4
    
    ocr_retry_attempts: int = 3
    ocr_retry_backoff: int = 2

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    def get_cors_origins(self) -> List[str]:
        if isinstance(self.backend_cors_origins, str):
            try:
                return json.loads(self.backend_cors_origins)
            except json.JSONDecodeError:
                return [o.strip() for o in self.backend_cors_origins.split(",")]
        return self.backend_cors_origins

    def __init__(self, **data):
        super().__init__(**data)
        # Warn if default/weak JWT secret is used
        weak_secrets = {"your-jwt-secret", "secret", "123456", "changeme"}
        if self.jwt_secret in weak_secrets:
            warnings.warn(
                "⚠️  SECURITY: JWT_SECRET is weak. Set a strong random string in .env",
                stacklevel=2,
            )


settings = Settings()
