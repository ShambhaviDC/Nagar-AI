import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NagarAI"
    TAGLINE: str = "Smarter Neighborhoods. Faster Resolutions."
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nagarai_super_secret_jwt_key_2026_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for development ease

    # MongoDB connection
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "nagarai_db")

    # AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    # SLA Default Deadlines in Minutes
    SLA_ACK_MINUTES: dict = {
        "P1": 15,     # 15 minutes
        "P2": 120,    # 2 hours
        "P3": 720,    # 12 hours
        "P4": 1440    # 24 hours
    }

    SLA_RESOLVE_HOURS: dict = {
        "P1": 6,      # 6 hours
        "P2": 24,     # 24 hours
        "P3": 48,     # 48 hours
        "P4": 96      # 4 days
    }

    # Uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
