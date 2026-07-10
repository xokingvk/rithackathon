"""
PDF report generation using reportlab.
Produces a detailed health report per battery, saved to REPORTS_DIR.

Report includes:
- Header with brand, battery ID, and timestamp
- Metrics table (SoH, RUL, charging efficiency, status)
- Visual SoH health bar
- Status-aware recommendation section
- Footer with report ID and generation info
"""
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics import renderPDF

from app.config import get_settings

settings = get_settings()


# ──────────────────────────────────────────────────────────────
# Colour palette (mirrors CSS variables)
# ──────────────────────────────────────────────────────────────
INK        = colors.HexColor("#0B0E14")
INK_SOFT   = colors.HexColor("#5B6472")
INK_FAINT  = colors.HexColor("#94A0AF")
SURFACE    = colors.HexColor("#F7F8FA")
BORDER     = colors.HexColor("#E6E8EC")
ACCENT     = colors.HexColor("#3B5BFF")

VOLT_LOW  = colors.HexColor("#EF4444")
VOLT_MID  = colors.HexColor("#F59E0B")
VOLT_HIGH = colors.HexColor("#22C55E")


def _status_color(status: str) -> colors.Color:
    return {"healthy": VOLT_HIGH, "watch": VOLT_MID, "at-risk": VOLT_LOW}.get(status, INK_FAINT)


def _soh_bar(soh: float, width: float = 360, height: float = 16) -> Drawing:
    """Render a colour-coded SoH bar as a ReportLab Drawing."""
    d = Drawing(width, height + 4)

    # Background track
    d.add(Rect(0, 2, width, height, fillColor=BORDER, strokeColor=None, rx=4, ry=4))

    # Filled portion
    fill_w = max(0, min(width, width * soh / 100))
    if soh >= 80:
        fill_color = VOLT_HIGH
    elif soh >= 65:
        fill_color = VOLT_MID
    else:
        fill_color = VOLT_LOW
    d.add(Rect(0, 2, fill_w, height, fillColor=fill_color, strokeColor=None, rx=4, ry=4))

    # Label
    label_txt = f"{soh:.1f}%"
    d.add(String(fill_w + 6, height / 2 - 2, label_txt,
                 fontSize=8, fillColor=INK_SOFT))
    return d


# ──────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────

def generate_health_report_pdf(
    report_id: str,
    battery_id: str,
    soh: float,
    rul_cycles: int,
    charging_efficiency: float,
    status: str,
    generated_at: datetime | None = None,
) -> Path:
    """Render a health report PDF and return its filesystem path."""
    generated_at = generated_at or datetime.utcnow()
    out_path = settings.REPORTS_DIR / f"{report_id}.pdf"

    styles = getSampleStyleSheet()

    # ---- Custom styles ----
    h1 = ParagraphStyle(
        "VQ_H1", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=INK,
        spaceAfter=4,
    )
    subtitle = ParagraphStyle(
        "VQ_Sub", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10, leading=13, textColor=INK_SOFT,
    )
    section_label = ParagraphStyle(
        "VQ_Label", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=INK_FAINT,
        spaceBefore=16, spaceAfter=6, letterSpacing=1,
    )
    body = ParagraphStyle(
        "VQ_Body", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10, textColor=INK_SOFT,
        leading=15,
    )
    rec_bold = ParagraphStyle(
        "VQ_RecBold", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=INK,
        spaceBefore=4,
    )
    footer_style = ParagraphStyle(
        "VQ_Footer", parent=styles["Normal"],
        fontName="Helvetica", fontSize=7.5, leading=10, textColor=INK_FAINT,
        alignment=1,  # centre
    )

    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=letter,
        topMargin=0.65 * inch, bottomMargin=0.65 * inch,
        leftMargin=0.75 * inch, rightMargin=0.75 * inch,
    )
    story = []

    # ── Header ──────────────────────────────────────────────
    story.append(Paragraph("VoltaicIQ", h1))
    story.append(Paragraph("AI Battery Health Analytics — Automated Report", subtitle))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=14))

    # Battery & timestamp row
    meta_data = [
        ["Battery ID", battery_id],
        ["Generated", generated_at.strftime("%Y-%m-%d  %H:%M UTC")],
        ["Report ID", report_id],
    ]
    meta_tbl = Table(meta_data, colWidths=[110, 340])
    meta_tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 0), (0, -1), INK),
        ("TEXTCOLOR", (1, 0), (1, -1), INK_SOFT),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, SURFACE]),
    ]))
    story.append(meta_tbl)
    story.append(Spacer(1, 18))

    # ── Metrics table ────────────────────────────────────────
    story.append(Paragraph("HEALTH METRICS", section_label))

    metrics_data = [
        ["Metric", "Value", "Benchmark"],
        ["State of Health (SoH)", f"{soh:.1f}%", "≥80% = Healthy"],
        ["Remaining Useful Life", f"{rul_cycles:,} cycles", "Cycles to end-of-life"],
        ["Charging Efficiency", f"{charging_efficiency:.1f}%", "≥90% = Good"],
        ["Overall Status", status.upper(), "healthy / watch / at-risk"],
    ]
    metrics_tbl = Table(metrics_data, colWidths=[200, 130, 170])
    status_c = _status_color(status)
    metrics_tbl.setStyle(TableStyle([
        # Header
        ("BACKGROUND",    (0, 0), (-1, 0), INK),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        # Body
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING",    (0, 0), (-1, -1), 9),
        ("GRID",          (0, 0), (-1, -1), 0.4, BORDER),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, SURFACE]),
        # Status cell highlight
        ("TEXTCOLOR",     (1, 4), (1, 4), status_c),
        ("FONTNAME",      (1, 4), (1, 4), "Helvetica-Bold"),
        # Values column bold
        ("FONTNAME",      (1, 1), (1, 3), "Helvetica-Bold"),
        ("TEXTCOLOR",     (1, 1), (1, 1), _soh_color_text(soh)),
        # Benchmark column muted
        ("TEXTCOLOR",     (2, 1), (2, -1), INK_FAINT),
        ("FONTSIZE",      (2, 1), (2, -1), 9),
    ]))
    story.append(metrics_tbl)
    story.append(Spacer(1, 16))

    # ── SoH bar ──────────────────────────────────────────────
    story.append(Paragraph("STATE OF HEALTH VISUAL", section_label))
    story.append(_soh_bar(soh, width=450, height=18))
    story.append(Spacer(1, 20))

    # ── Recommendation ───────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=12))
    story.append(Paragraph("RECOMMENDATION", section_label))

    recs = {
        "healthy": [
            "✓  No immediate action required.",
            "✓  Continue standard charging practices (avoid sustained >90% SoC).",
            "✓  Schedule routine health check in 90 days.",
        ],
        "watch": [
            "⚠  Schedule a physical inspection within 30 days.",
            "⚠  Reduce fast-charging frequency to slow further degradation.",
            "⚠  Set end-of-life alerts and monitor weekly SoH trend.",
        ],
        "at-risk": [
            "✗  Plan for immediate replacement.",
            "✗  Avoid deep discharge (below 20% SoC) and high-temperature charging.",
            "✗  Do not use for high-load applications until replaced.",
        ],
    }.get(status, ["Continue monitoring and re-run analysis after next charge cycle."])

    for line in recs:
        story.append(Paragraph(line, rec_bold if "✗" in line or "⚠" in line or "✓" in line else body))

    story.append(Spacer(1, 28))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=8))

    # ── Footer ───────────────────────────────────────────────
    footer_txt = (
        f"Generated by VoltaicIQ Analytics Engine  ·  Report {report_id}  ·  "
        f"{generated_at.strftime('%Y-%m-%d %H:%M UTC')}<br/>"
        "Physics-informed heuristic or XGBoost model prediction  ·  Not a substitute for professional inspection"
    )
    story.append(Paragraph(footer_txt, footer_style))

    doc.build(story)
    return out_path


def _soh_color_text(soh: float) -> colors.Color:
    if soh >= 80:
        return colors.HexColor("#15803D")
    if soh >= 65:
        return colors.HexColor("#92400E")
    return colors.HexColor("#991B1B")
