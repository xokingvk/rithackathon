"""
SQLAlchemy ORM models for batteries, readings, health reports, and chat logs.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Float, Integer, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class BatteryStatus(str, enum.Enum):
    healthy = "healthy"
    watch = "watch"
    at_risk = "at-risk"


class Battery(Base):
    """A single battery pack registered on the platform."""
    __tablename__ = "batteries"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id = Column(String, unique=True, index=True, nullable=False)  # human-friendly ID, e.g. PACK-042
    label = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    readings = relationship("Reading", back_populates="battery", cascade="all, delete-orphan")
    reports = relationship("HealthReport", back_populates="battery", cascade="all, delete-orphan")


class Reading(Base):
    """A single usage-data point, either from a CSV row or manual BMS entry."""
    __tablename__ = "readings"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id_fk = Column(String, ForeignKey("batteries.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    voltage = Column(Float, nullable=False)
    current = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    cycle_count = Column(Integer, nullable=False)
    soc = Column(Float, nullable=True)  # state of charge, %

    source = Column(String, default="manual")  # 'manual' | 'csv'

    battery = relationship("Battery", back_populates="readings")


class HealthReport(Base):
    """A generated health/RUL/charging report snapshot for a battery."""
    __tablename__ = "health_reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id_fk = Column(String, ForeignKey("batteries.id"), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)

    soh = Column(Float, nullable=False)               # state of health, %
    rul_cycles = Column(Integer, nullable=False)       # remaining useful life, cycles
    charging_efficiency = Column(Float, nullable=False)  # %
    status = Column(Enum(BatteryStatus), default=BatteryStatus.healthy)

    notes = Column(Text, nullable=True)
    pdf_path = Column(String, nullable=True)

    battery = relationship("Battery", back_populates="reports")


class ChatLog(Base):
    """Chatbot conversation log, kept for context/debugging."""
    __tablename__ = "chat_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    created_at = Column(DateTime, default=datetime.utcnow)
    role = Column(String, nullable=False)  # 'user' | 'assistant'
    message = Column(Text, nullable=False)
    session_id = Column(String, index=True, nullable=True)
