"""
/api/fleet — aggregate, fleet-wide analytics across all registered batteries.
Includes per-battery detail endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas import FleetBatteryOut
from app.services import battery_service

router = APIRouter(prefix="/fleet", tags=["fleet"])


@router.get("", response_model=list[FleetBatteryOut])
def list_fleet(db: Session = Depends(get_db)):
    """All batteries ranked by SoH ascending (worst first for easy triage)."""
    batteries = db.query(models.Battery).all()
    out = []
    for b in batteries:
        reading = battery_service.latest_reading_for(db, b)
        if not reading:
            continue
        score = battery_service.score_reading(
            reading.voltage, reading.current, reading.temperature, reading.cycle_count, reading.soc,
        )
        out.append(FleetBatteryOut(
            battery_id=b.battery_id,
            soh=score["soh"],
            cycles=reading.cycle_count,
            rul=score["rul_cycles"],
            charging_efficiency=score["charging_efficiency"],
            status=score["status"],
        ))
    return sorted(out, key=lambda x: x.soh)


@router.get("/summary")
def fleet_summary(db: Session = Depends(get_db)):
    """High-level fleet health summary with distribution counts."""
    fleet = list_fleet(db)
    dist = {"healthy": 0, "watch": 0, "at-risk": 0}
    for b in fleet:
        dist[b.status] = dist.get(b.status, 0) + 1

    avg_soh = round(sum(b.soh for b in fleet) / len(fleet), 1) if fleet else 0
    avg_rul = round(sum(b.rul for b in fleet) / len(fleet)) if fleet else 0
    return {
        "total_batteries": len(fleet),
        "avg_soh": avg_soh,
        "avg_rul_cycles": avg_rul,
        "distribution": dist,
    }


@router.get("/{battery_id}", response_model=FleetBatteryOut)
def get_battery_detail(battery_id: str, db: Session = Depends(get_db)):
    """
    Per-battery detail: returns the latest scored metrics for a single pack.
    Useful for a drill-down view or mobile detail page.
    """
    battery = db.query(models.Battery).filter_by(battery_id=battery_id).first()
    if not battery:
        raise HTTPException(404, f"Battery '{battery_id}' not found.")

    reading = battery_service.latest_reading_for(db, battery)
    if not reading:
        raise HTTPException(404, f"No readings recorded for '{battery_id}' yet.")

    score = battery_service.score_reading(
        reading.voltage, reading.current, reading.temperature, reading.cycle_count, reading.soc,
    )
    return FleetBatteryOut(
        battery_id=battery.battery_id,
        soh=score["soh"],
        cycles=reading.cycle_count,
        rul=score["rul_cycles"],
        charging_efficiency=score["charging_efficiency"],
        status=score["status"],
    )
