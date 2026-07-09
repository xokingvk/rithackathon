"""
VoltaicIQ Battery Analytics API — application entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000

Interactive docs: http://localhost:8000/docs
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.ml.model_loader import model_registry
from app.routers import battery, dashboard, reports, fleet, chatbot

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="Predictive battery health, remaining-useful-life, and charging analytics API.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    from app.database import SessionLocal, seed_database_if_empty
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
    model_registry.load()
    logging.getLogger("voltaiq").info("Startup complete — DB ready, models loaded, database seeded.")


@app.get("/", tags=["meta"])
def root():
    return {"service": settings.APP_NAME, "status": "ok", "docs": "/docs"}


@app.get("/api/health", tags=["meta"])
def health_check():
    return {"status": "ok"}


app.include_router(battery.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(fleet.router, prefix=settings.API_PREFIX)
app.include_router(chatbot.router, prefix=settings.API_PREFIX)
