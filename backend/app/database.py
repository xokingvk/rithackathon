"""
SQLAlchemy engine/session setup.
Works with SQLite out of the box; set DATABASE_URL to a Postgres DSN
(e.g. postgresql+psycopg2://user:pass@host:5432/db) for production.

SQLite improvements:
- WAL mode (Write-Ahead Logging) for better concurrent read performance
- Foreign keys enforced via PRAGMA
- Pool pre-ping keeps connections healthy

PostgreSQL improvements:
- pool_size + max_overflow for connection pooling
- pool_pre_ping to detect stale connections
"""
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import get_settings

settings = get_settings()

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Build engine with appropriate settings per driver
if _is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_conn, _connection_record):
        """Enable WAL mode and foreign-key enforcement for every new connection."""
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

else:
    # PostgreSQL / other relational databases
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Called on application startup."""
    from app import models  # noqa: F401  (ensure models are registered on Base)
    Base.metadata.create_all(bind=engine)


def seed_database_if_empty(db):
    """Populates the database with realistic historical cycle readings and reports if empty."""
    from app import models
    from app.services import battery_service
    from datetime import datetime, timedelta

    if db.query(models.Battery).count() > 0:
        return

    # Seed demo batteries
    demo_packs = [
        {"id": "PACK-011", "cycles": 120, "v": 4.15, "curr": 1.5, "temp": 24.5},
        {"id": "PACK-024", "cycles": 340, "v": 4.13, "curr": 1.5, "temp": 25.2},
        {"id": "PACK-035", "cycles": 810, "v": 4.09, "curr": 1.5, "temp": 27.8},
        {"id": "PACK-042", "cycles": 410, "v": 4.12, "curr": 1.5, "temp": 25.8},
        {"id": "PACK-058", "cycles": 1120, "v": 4.01, "curr": 1.5, "temp": 32.4},
        {"id": "PACK-071", "cycles": 620, "v": 4.10, "curr": 1.5, "temp": 26.5},
    ]

    for pack in demo_packs:
        battery = battery_service.get_or_create_battery(db, pack["id"])
        
        max_cycles = pack["cycles"]
        # Create 5 historical points for trend chart visualization
        steps = [1, int(max_cycles * 0.25), int(max_cycles * 0.5), int(max_cycles * 0.75), max_cycles]
        steps = sorted(list(set(steps)))

        for i, cyc in enumerate(steps):
            ratio = cyc / 1200.0
            volts = max(3.8, 4.17 - ratio * 0.16)
            temp = 24.0 + ratio * 8.5
            curr = 1.5
            
            reading = models.Reading(
                battery_id_fk=battery.id,
                voltage=volts,
                current=curr,
                temperature=temp,
                cycle_count=cyc,
                soc=85.0 - ratio * 20.0,
                source="manual",
                timestamp=datetime.utcnow() - timedelta(days=(len(steps) - 1 - i) * 3)
            )
            db.add(reading)
            db.commit()
            db.refresh(reading)
            
            score = battery_service.score_reading(volts, curr, temp, cyc)
            
            report = models.HealthReport(
                battery_id_fk=battery.id,
                soh=score["soh"],
                rul_cycles=score["rul_cycles"],
                charging_efficiency=score["charging_efficiency"],
                status=score["status"],
                notes="Auto-seeded historical lifecycle data.",
                generated_at=reading.timestamp
            )
            db.add(report)
            db.commit()
