"""
Shared battery scoring logic, used by the battery, dashboard, reports,
and fleet routers so predictions stay consistent everywhere.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app import models
from app.ml.model_loader import model_registry, classify_status


def get_or_create_battery(db: Session, battery_id: str) -> models.Battery:
    battery = db.query(models.Battery).filter_by(battery_id=battery_id).first()
    if not battery:
        battery = models.Battery(battery_id=battery_id)
        db.add(battery)
        db.commit()
        db.refresh(battery)
    return battery


def score_reading(voltage: float, current: float, temperature: float,
                   cycle_count: int, soc: Optional[float] = None) -> dict:
    """Run the three models against a single reading and return a unified result."""
    soh = model_registry.predict_soh(voltage, current, temperature, cycle_count, soc)
    rul = model_registry.predict_rul(soh, cycle_count, temperature)
    charging_efficiency = model_registry.predict_charging_efficiency(voltage, current, temperature, cycle_count)
    anomaly_detected = model_registry.predict_anomaly(voltage, current, temperature, cycle_count)
    status = classify_status(soh)
    return {
        "soh": round(soh, 1),
        "rul_cycles": rul,
        "charging_efficiency": round(charging_efficiency, 1),
        "anomaly_detected": anomaly_detected,
        "status": status,
    }


def save_reading(db: Session, battery: models.Battery, voltage: float, current: float,
                  temperature: float, cycle_count: int, soc: Optional[float], source: str) -> models.Reading:
    reading = models.Reading(
        battery_id_fk=battery.id, voltage=voltage, current=current, temperature=temperature,
        cycle_count=cycle_count, soc=soc, source=source, timestamp=datetime.utcnow(),
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


def save_report(db: Session, battery: models.Battery, score: dict, notes: str = "", pdf_path: str = None) -> models.HealthReport:
    report = models.HealthReport(
        battery_id_fk=battery.id,
        soh=score["soh"],
        rul_cycles=score["rul_cycles"],
        charging_efficiency=score["charging_efficiency"],
        status=score["status"],
        notes=notes,
        pdf_path=pdf_path,
        generated_at=datetime.utcnow(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def latest_reading_for(db: Session, battery: models.Battery) -> Optional[models.Reading]:
    return (
        db.query(models.Reading)
        .filter_by(battery_id_fk=battery.id)
        .order_by(models.Reading.timestamp.desc())
        .first()
    )
