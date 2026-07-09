"""
/api/dashboard — KPI summary and Chart.js-ready time series.
Includes an /alerts endpoint for at-risk battery notifications.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas import KpiOut, ChartSeriesOut, DegradationChartOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# ──────────────────────────────────────────────────────────────
# KPI summary
# ──────────────────────────────────────────────────────────────

@router.get("/kpis", response_model=KpiOut)
def get_kpis(db: Session = Depends(get_db)):
    reports = _latest_report_per_battery(db)
    if not reports:
        return KpiOut(
            avg_soh=0, soh_delta="No data yet",
            avg_rul_cycles=0, rul_delta="No data yet",
            avg_charging_efficiency=0, charging_delta="No data yet",
            flagged_count=0, flagged_delta="No data yet",
        )

    n = len(reports)
    avg_soh      = round(sum(r.soh for r in reports) / n, 1)
    avg_rul      = round(sum(r.rul_cycles for r in reports) / n)
    avg_charging = round(sum(r.charging_efficiency for r in reports) / n, 1)
    flagged      = sum(1 for r in reports if r.status.value != "healthy")

    return KpiOut(
        avg_soh=avg_soh,
        soh_delta=f"Across {n} battery(ies)",
        avg_rul_cycles=avg_rul,
        rul_delta="Based on latest readings",
        avg_charging_efficiency=avg_charging,
        charging_delta="Fleet average",
        flagged_count=flagged,
        flagged_delta=f"{flagged} pack(s) need attention",
    )


# ──────────────────────────────────────────────────────────────
# Alerts — at-risk / watch batteries
# ──────────────────────────────────────────────────────────────

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """
    Returns batteries whose latest report is 'at-risk' or 'watch',
    sorted by SoH ascending (worst first).
    Consumed by the dashboard alert banner.
    """
    reports = _latest_report_per_battery(db)
    flagged = [r for r in reports if r.status.value in ("at-risk", "watch")]
    flagged.sort(key=lambda r: r.soh)

    recommendations = {
        "at-risk": "Plan for replacement — avoid deep discharge cycles.",
        "watch":   "Schedule an inspection within 30 days.",
    }

    return [
        {
            "battery_id": r.battery.battery_id,
            "soh":        round(r.soh, 1),
            "rul_cycles": r.rul_cycles,
            "status":     r.status.value,
            "message":    recommendations.get(r.status.value, "Monitor closely."),
            "generated_at": r.generated_at.isoformat(),
        }
        for r in flagged
    ]


# ──────────────────────────────────────────────────────────────
# Chart data endpoints
# ──────────────────────────────────────────────────────────────

@router.get("/charts/soh-trend", response_model=ChartSeriesOut)
def soh_trend(battery_id: str | None = Query(None), db: Session = Depends(get_db)):
    query = db.query(models.HealthReport).join(models.Battery)
    if battery_id:
        query = query.filter(models.Battery.battery_id == battery_id)
    reports = query.order_by(models.HealthReport.generated_at.asc()).limit(50).all()
    labels = [r.generated_at.strftime("%m/%d") for r in reports]
    values = [r.soh for r in reports]
    return ChartSeriesOut(labels=labels, values=values)


@router.get("/charts/degradation", response_model=DegradationChartOut)
def degradation_trend(battery_id: str | None = Query(None), db: Session = Depends(get_db)):
    query = db.query(models.HealthReport).join(models.Battery)
    if battery_id:
        query = query.filter(models.Battery.battery_id == battery_id)
    reports = query.order_by(models.HealthReport.generated_at.asc()).limit(50).all()
    labels   = [f"Cyc {i * 50}" for i in range(len(reports))]
    observed = [r.soh for r in reports]
    predicted = list(observed)

    if len(observed) >= 2:
        slope = observed[-1] - observed[-2]
        for _ in range(4):
            next_val = max(0.0, round(predicted[-1] + slope, 1))
            predicted.append(next_val)
            labels.append(f"Cyc {len(labels) * 50}")
            observed.append(None)  # type: ignore[arg-type]

    return DegradationChartOut(labels=labels, observed=observed, predicted=predicted)


@router.get("/charts/charging-efficiency", response_model=ChartSeriesOut)
def charging_efficiency_chart(battery_id: str | None = Query(None), db: Session = Depends(get_db)):
    reports = _latest_report_per_battery(db)
    if battery_id:
        reports = [r for r in reports if r.battery.battery_id == battery_id]
    labels = [r.battery.battery_id for r in reports]
    values = [r.charging_efficiency for r in reports]
    return ChartSeriesOut(labels=labels, values=values)


# ──────────────────────────────────────────────────────────────
# Helper
# ──────────────────────────────────────────────────────────────

def _latest_report_per_battery(db: Session) -> list[models.HealthReport]:
    """Return the single most-recent HealthReport for every registered battery."""
    batteries = db.query(models.Battery).all()
    latest = []
    for b in batteries:
        r = (
            db.query(models.HealthReport)
            .filter_by(battery_id_fk=b.id)
            .order_by(models.HealthReport.generated_at.desc())
            .first()
        )
        if r:
            latest.append(r)
    return latest
