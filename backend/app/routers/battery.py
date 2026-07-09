"""
/api/battery — CSV upload, manual BMS entry, and per-battery predictions.
"""
import io
import logging
import uuid

import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ManualEntryIn, HealthEstimateOut, CsvUploadOut
from app.services import battery_service
from app.services.pdf_generator import generate_health_report_pdf

logger = logging.getLogger("voltaiq.battery")
router = APIRouter(prefix="/battery", tags=["battery"])

REQUIRED_CSV_COLUMNS = {"voltage", "current", "temperature", "cycle_count"}


@router.post("/upload-csv", response_model=CsvUploadOut)
async def upload_csv(
    file: UploadFile = File(...),
    battery_id: str | None = Form(None),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Please upload a .csv file.")

    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception:
        raise HTTPException(400, "Could not parse CSV file.")

    df.columns = [c.strip().lower() for c in df.columns]
    missing = REQUIRED_CSV_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(400, f"CSV is missing required columns: {sorted(missing)}")

    battery_id = battery_id or f"PACK-{uuid.uuid4().hex[:6].upper()}"
    battery = battery_service.get_or_create_battery(db, battery_id)

    for _, row in df.iterrows():
        battery_service.save_reading(
            db, battery,
            voltage=float(row["voltage"]), current=float(row["current"]),
            temperature=float(row["temperature"]), cycle_count=int(row["cycle_count"]),
            soc=float(row["soc"]) if "soc" in df.columns and not pd.isna(row.get("soc")) else None,
            source="csv",
        )

    # Score using the most recent row (models are designed for point-in-time scoring;
    # a future version could aggregate trend features across the full upload).
    last = df.iloc[-1]
    score = battery_service.score_reading(
        voltage=float(last["voltage"]), current=float(last["current"]),
        temperature=float(last["temperature"]), cycle_count=int(last["cycle_count"]),
        soc=float(last["soc"]) if "soc" in df.columns and not pd.isna(last.get("soc")) else None,
    )

    report = battery_service.save_report(db, battery, score, notes=f"Generated from CSV upload ({len(df)} rows).")
    try:
        pdf_path = generate_health_report_pdf(
            report.id, battery.battery_id, score["soh"], score["rul_cycles"],
            score["charging_efficiency"], score["status"], report.generated_at,
        )
        report.pdf_path = str(pdf_path)
        db.commit()
    except Exception as exc:
        logger.warning("PDF generation failed: %s", exc)

    return CsvUploadOut(
        battery_id=battery.battery_id, rows_ingested=len(df), report_id=report.id, **score,
    )


@router.post("/manual-entry", response_model=HealthEstimateOut)
def manual_entry(payload: ManualEntryIn, db: Session = Depends(get_db)):
    battery = battery_service.get_or_create_battery(db, payload.battery_id)
    battery_service.save_reading(
        db, battery, voltage=payload.voltage, current=payload.current,
        temperature=payload.temperature, cycle_count=payload.cycle_count,
        soc=payload.soc, source="manual",
    )
    score = battery_service.score_reading(
        payload.voltage, payload.current, payload.temperature, payload.cycle_count, payload.soc,
    )
    report = battery_service.save_report(db, battery, score, notes="Generated from manual BMS entry.")
    return HealthEstimateOut(battery_id=battery.battery_id, generated_at=report.generated_at, **score)


@router.get("/{battery_id}/health", response_model=HealthEstimateOut)
def get_health(battery_id: str, db: Session = Depends(get_db)):
    battery, reading = _require_battery_with_reading(db, battery_id)
    score = battery_service.score_reading(
        reading.voltage, reading.current, reading.temperature, reading.cycle_count, reading.soc,
    )
    return HealthEstimateOut(battery_id=battery.battery_id, generated_at=reading.timestamp, **score)


@router.get("/{battery_id}/rul")
def get_rul(battery_id: str, db: Session = Depends(get_db)):
    battery, reading = _require_battery_with_reading(db, battery_id)
    score = battery_service.score_reading(
        reading.voltage, reading.current, reading.temperature, reading.cycle_count, reading.soc,
    )
    return {"battery_id": battery.battery_id, "rul_cycles": score["rul_cycles"], "status": score["status"]}


@router.get("/{battery_id}/charging")
def get_charging(battery_id: str, db: Session = Depends(get_db)):
    battery, reading = _require_battery_with_reading(db, battery_id)
    score = battery_service.score_reading(
        reading.voltage, reading.current, reading.temperature, reading.cycle_count, reading.soc,
    )
    return {"battery_id": battery.battery_id, "charging_efficiency": score["charging_efficiency"]}


def _require_battery_with_reading(db: Session, battery_id: str):
    from app import models
    battery = db.query(models.Battery).filter_by(battery_id=battery_id).first()
    if not battery:
        raise HTTPException(404, f"Battery '{battery_id}' not found.")
    reading = battery_service.latest_reading_for(db, battery)
    if not reading:
        raise HTTPException(404, f"No readings recorded for '{battery_id}' yet.")
    return battery, reading
