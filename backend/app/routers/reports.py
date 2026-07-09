"""
/api/reports — report history, on-demand generation, and PDF download.
"""
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas import ReportOut, ReportGenerateIn
from app.services import battery_service
from app.services.pdf_generator import generate_health_report_pdf

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[ReportOut])
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(models.HealthReport).order_by(models.HealthReport.generated_at.desc()).limit(100).all()
    return [
        ReportOut(
            report_id=r.id, battery_id=r.battery.battery_id,
            generated_at=r.generated_at.strftime("%Y-%m-%d"),
            soh=r.soh, rul=r.rul_cycles, status=r.status.value,
        )
        for r in reports
    ]


@router.post("/generate", response_model=ReportOut)
def generate_report(payload: ReportGenerateIn, db: Session = Depends(get_db)):
    battery = db.query(models.Battery).filter_by(battery_id=payload.battery_id).first()
    if not battery:
        raise HTTPException(404, f"Battery '{payload.battery_id}' not found.")
    reading = battery_service.latest_reading_for(db, battery)
    if not reading:
        raise HTTPException(404, "No readings recorded for this battery yet.")

    score = battery_service.score_reading(
        reading.voltage, reading.current, reading.temperature, reading.cycle_count, reading.soc,
    )
    report = battery_service.save_report(db, battery, score, notes="Generated on demand.")

    pdf_path = generate_health_report_pdf(
        report.id, battery.battery_id, score["soh"], score["rul_cycles"],
        score["charging_efficiency"], score["status"], report.generated_at,
    )
    report.pdf_path = str(pdf_path)
    db.commit()

    return ReportOut(
        report_id=report.id, battery_id=battery.battery_id,
        generated_at=report.generated_at.strftime("%Y-%m-%d"),
        soh=report.soh, rul=report.rul_cycles, status=report.status.value,
    )


@router.get("/{report_id}/download")
def download_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(models.HealthReport).filter_by(id=report_id).first()
    if not report:
        raise HTTPException(404, "Report not found.")
    if not report.pdf_path or not Path(report.pdf_path).exists():
        # Regenerate on the fly if the file is missing
        pdf_path = generate_health_report_pdf(
            report.id, report.battery.battery_id, report.soh, report.rul_cycles,
            report.charging_efficiency, report.status.value, report.generated_at,
        )
        report.pdf_path = str(pdf_path)
        db.commit()
    return FileResponse(report.pdf_path, media_type="application/pdf", filename=f"{report.battery.battery_id}_{report_id}.pdf")
