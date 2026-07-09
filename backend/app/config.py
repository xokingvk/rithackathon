"""
Application configuration.
All values can be overridden via environment variables or a .env file.
Copy .env.example to .env and fill in secrets before deploying.
"""
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "VoltaicIQ Battery Analytics API"
    ENV: str = "development"
    API_PREFIX: str = "/api"
    CORS_ORIGINS: list[str] = ["*"]

    # Database — defaults to local SQLite, override with a Postgres DSN in production
    # e.g. postgresql+psycopg2://user:password@host:5432/voltaiq
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'voltaiq.db'}"

    # ML models
    MODEL_DIR: Path = BASE_DIR / "app" / "ml" / "models"
    SOH_MODEL_PATH: Path = MODEL_DIR / "soh_model.pkl"
    RUL_MODEL_PATH: Path = MODEL_DIR / "rul_model.pkl"
    CHARGING_MODEL_PATH: Path = MODEL_DIR / "anomaly_model.pkl"

    # End-of-life threshold used for RUL projection (SoH %)
    EOL_SOH_THRESHOLD: float = 70.0

    # Reports
    REPORTS_DIR: Path = BASE_DIR / "generated_reports"

    # Groq chatbot
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_API_URL: str = "https://api.groq.com/openai/v1/chat/completions"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    return settings
