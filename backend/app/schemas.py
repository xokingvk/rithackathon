"""
Pydantic schemas — request/response contracts for the API.
"""
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


# ---------- Battery readings ----------

class ManualEntryIn(BaseModel):
    battery_id: str = Field(..., examples=["PACK-0142"])
    voltage: float
    current: float
    temperature: float
    cycle_count: int
    soc: Optional[float] = None


class HealthEstimateOut(BaseModel):
    battery_id: str
    soh: float
    rul_cycles: int
    charging_efficiency: float
    anomaly_detected: Optional[bool] = None
    status: str
    generated_at: datetime


class CsvUploadOut(BaseModel):
    battery_id: str
    rows_ingested: int
    soh: float
    rul_cycles: int
    charging_efficiency: float
    anomaly_detected: Optional[bool] = None
    status: str
    report_id: str


# ---------- Dashboard ----------

class KpiOut(BaseModel):
    avg_soh: float
    soh_delta: str
    avg_rul_cycles: int
    rul_delta: str
    avg_charging_efficiency: float
    charging_delta: str
    flagged_count: int
    flagged_delta: str


class ChartSeriesOut(BaseModel):
    labels: List[str]
    values: List[Optional[float]]


class DegradationChartOut(BaseModel):
    labels: List[str]
    observed: List[Optional[float]]
    predicted: List[Optional[float]]


# ---------- Reports ----------

class ReportOut(BaseModel):
    report_id: str
    battery_id: str
    generated_at: str
    soh: float
    rul: int
    status: str


class ReportGenerateIn(BaseModel):
    battery_id: str


# ---------- Fleet ----------

class FleetBatteryOut(BaseModel):
    battery_id: str
    soh: float
    cycles: int
    rul: int
    charging_efficiency: float
    status: str


# ---------- Chatbot ----------

class ChatMessageIn(BaseModel):
    message: str
    context: Optional[dict] = None
    session_id: Optional[str] = None


class ChatMessageOut(BaseModel):
    reply: str
