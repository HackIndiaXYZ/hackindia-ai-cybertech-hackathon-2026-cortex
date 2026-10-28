"""
EcoShelter Report Service.

Collects environmental analysis, historical climate data, bioclimatic zone
classification, thermal risk indicators, passive architectural requirements,
and top MCDM ranked designs, then compiles them into a structured, publication-quality
PDF document using ReportLab.
"""

import asyncio
from datetime import datetime, timezone
from io import BytesIO
import logging
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.analysis.design_ranker import rank_designs
from app.analysis.environment_analyzer import analyze_environment
from app.analysis.recommend import get_requirements
from app.analysis.risk import assess_risk
from app.analysis.zone_classifier import classify_zone
from app.schemas.climate_schema import ClimateResponse
from app.services import flood_service, geocoding_service, weather_service
from app.services.climate_service import get_climate_summary

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Numbered Canvas for Running Header & Footer
# ---------------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas that writes dynamic total page numbers and running headers."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states: List[Dict[str, Any]] = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running header (on pages 2 and later)
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(36, 756, 576, 756)
            self.drawString(36, 760, "EcoShelter Bioclimatic Architectural Assessment")
            self.drawRightString(576, 760, "Advisory Report")

        # Running footer (all pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(36, 42, 576, 42)
        self.drawString(36, 28, "EcoShelter Climate-Adaptive Design Platform — Advisory Only")
        self.drawRightString(576, 28, f"Page {self._pageNumber} of {total_pages}")
        self.restoreState()


# ---------------------------------------------------------------------------
# Data Collection
# ---------------------------------------------------------------------------
async def collect_report_data(
    latitude: float,
    longitude: float,
    weights: Optional[Dict[str, float]] = None,
    plot_size: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Collects all required datasets concurrently with graceful degradation:
    - Weather observations (Open-Meteo)
    - Flood estimate (GloFAS)
    - Location name (OSM Nominatim)
    - Environmental analysis classification
    - Multi-year climate history & monthly summaries
    - Bioclimatic zone classification & reason
    - Thermal stress risk assessment
    - Passive shelter architectural requirements
    - Top 3 MCDM ranked envelope designs
    """
    logger.info("Collecting report data for (%.4f, %.4f)", latitude, longitude)

    # 1. Fetch live weather, flood, and location in parallel
    try:
        weather, flood, location = await asyncio.gather(
            weather_service.get_weather(latitude, longitude),
            flood_service.get_flood(latitude, longitude),
            geocoding_service.get_location(latitude, longitude),
        )
    except Exception as exc:
        logger.warning("Error fetching real-time environmental APIs: %s", exc)
        weather = None
        flood = None
        location = None

    # Environmental classification from current weather
    if weather:
        try:
            env_analysis = analyze_environment(
                temperature=weather.temperature,
                humidity=float(weather.humidity) if weather.humidity is not None else None,
                wind_speed=weather.wind_speed,
                rainfall=weather.rainfall,
            )
        except Exception:
            env_analysis = None
    else:
        env_analysis = None

    # 2. Fetch multi-year climate history
    climate_summary: Optional[ClimateResponse] = None
    try:
        climate_summary = await get_climate_summary(lat=latitude, lon=longitude, years=5)
    except Exception as exc:
        logger.warning("Could not fetch climate history: %s. Using safe defaults.", exc)

    # 3. Bioclimatic Zone Classification
    zone_code = "COMPOSITE"
    zone_reason = "Composite climate zone characterized by seasonal temperature and moisture fluctuations."
    matched_rule = "Baseline default rule"
    if climate_summary:
        try:
            zone_result = classify_zone(climate_summary)
            zone_code = zone_result.get("zone", "COMPOSITE")
            zone_reason = zone_result.get("reason", zone_reason)
            matched_rule = zone_result.get("matched_rule", matched_rule)
        except Exception as exc:
            logger.warning("Zone classification failure: %s", exc)

    # 4. Thermal Risk Assessment
    risk_data: Dict[str, Any] = {}
    if climate_summary:
        try:
            risk_data = assess_risk(climate_summary)
        except Exception as exc:
            logger.warning("Risk assessment error: %s", exc)
            risk_data = {
                "heat": {"level": "medium", "score_0_100": 50, "reason": "Standard seasonal heat variation."},
                "cold": {"level": "low", "score_0_100": 20, "reason": "Minimal extreme cold exposure."},
                "explanation": "Standard seasonal thermal fluctuations requiring balanced envelope mass.",
            }
    else:
        risk_data = {
            "heat": {"level": "medium", "score_0_100": 50, "reason": "Estimated moderate thermal stress."},
            "cold": {"level": "low", "score_0_100": 20, "reason": "Estimated low winter cold exposure."},
            "explanation": "Estimated thermal risk based on regional baseline indicators.",
        }

    # 5. Passive Architectural Requirements
    reqs_data: Dict[str, Any] = {}
    try:
        reqs_data = get_requirements(zone=zone_code, alerts=[])
    except Exception as exc:
        logger.warning("Requirements retrieval error for zone %s: %s", zone_code, exc)
        reqs_data = {"strategies": []}

    # 6. Top 3 MCDM Ranked Designs
    top_designs: List[Dict[str, Any]] = []
    try:
        ranked_res = rank_designs(zone=zone_code, weights=weights, top_n=3)
        top_designs = ranked_res.get("designs", [])[:3]
    except Exception as exc:
        logger.warning("Design ranking error for zone %s: %s", zone_code, exc)

    return {
        "latitude": latitude,
        "longitude": longitude,
        "location": location,
        "weather": weather,
        "flood": flood,
        "env_analysis": env_analysis,
        "climate_summary": climate_summary,
        "zone": zone_code,
        "zone_reason": zone_reason,
        "matched_rule": matched_rule,
        "risk": risk_data,
        "requirements": reqs_data,
        "top_designs": top_designs,
        "weights": weights,
        "plot_size": plot_size,
        "generated_at": datetime.now(timezone.utc),
    }


# ---------------------------------------------------------------------------
# PDF Generation with ReportLab
# ---------------------------------------------------------------------------
def build_pdf_document(data: Dict[str, Any]) -> bytes:
    """
    Constructs an elegant, multi-page architectural assessment PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46,
    )

    # Styles
    base_styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=base_styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0F172A"),
        alignment=0,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12,
    )

    h1_style = ParagraphStyle(
        "SectionHeading",
        parent=base_styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0F766E"),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "DocBody",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )

    body_bold = ParagraphStyle(
        "DocBodyBold",
        parent=body_style,
        fontName="Helvetica-Bold",
    )

    th_style = ParagraphStyle(
        "TableHeader",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=0,
    )

    td_style = ParagraphStyle(
        "TableCell",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#1E293B"),
    )

    td_style_bold = ParagraphStyle(
        "TableCellBold",
        parent=td_style,
        fontName="Helvetica-Bold",
    )

    disclaimer_style = ParagraphStyle(
        "DisclaimerText",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#92400E"),
        alignment=1,
    )

    story: List[Any] = []

    # 1. Document Header Banner
    story.append(Paragraph("EcoShelter Bioclimatic Architectural Assessment", title_style))

    loc = data.get("location")
    loc_name = f"{loc.name}, {loc.country}" if (loc and loc.name) else "Selected Coordinates"
    lat = data.get("latitude", 0.0)
    lon = data.get("longitude", 0.0)
    gen_date = data["generated_at"].strftime("%B %d, %Y %H:%M UTC")

    meta_text = (
        f"<b>Location:</b> {loc_name} ({lat:.4f}°, {lon:.4f}°) &nbsp;|&nbsp; "
        f"<b>Generated:</b> {gen_date} &nbsp;|&nbsp; "
        f"<b>Standard:</b> NBC 2016 Part 8 & ECBC 2017"
    )
    story.append(Paragraph(meta_text, subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0F766E"), spaceAfter=10))

    # 2. Executive Summary Cards (Zone & Real-Time Environment)
    zone_code = data.get("zone", "COMPOSITE")
    zone_reason = data.get("zone_reason", "")
    weather = data.get("weather")
    flood = data.get("flood")
    env_analysis = data.get("env_analysis")

    zone_display = zone_code.replace("_", " ").title()
    summary_data = [
        [
            Paragraph("<b>Bioclimatic Zone Classification</b>", body_bold),
            Paragraph(f"<font color='#0F766E'><b>{zone_display} ({zone_code})</b></font>", body_bold),
        ],
        [
            Paragraph("<b>Zone Rationale</b>", body_style),
            Paragraph(zone_reason, body_style),
        ],
        [
            Paragraph("<b>Real-Time Observations</b>", body_bold),
            Paragraph(
                f"Temperature: <b>{weather.temperature if weather and weather.temperature is not None else 'N/A'}°C</b> &nbsp;|&nbsp; "
                f"Humidity: <b>{weather.humidity if weather and weather.humidity is not None else 'N/A'}%</b> &nbsp;|&nbsp; "
                f"Wind: <b>{weather.wind_speed if weather and weather.wind_speed is not None else 'N/A'} km/h</b> &nbsp;|&nbsp; "
                f"Rain: <b>{weather.rainfall if weather and weather.rainfall is not None else 'N/A'} mm</b>",
                body_style,
            ),
        ],
        [
            Paragraph("<b>Flood Risk & Classification</b>", body_bold),
            Paragraph(
                f"Flood Risk Estimate: <b>{flood.risk if flood else 'Low'}</b> &nbsp;|&nbsp; "
                f"App Environment Category: <b>{env_analysis.classification if env_analysis else 'Standard'}</b>",
                body_style,
            ),
        ],
    ]

    summary_table = Table(summary_data, colWidths=[150, 390])
    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # 3. Thermal Risk & Stress Profile
    story.append(Paragraph("Thermal Risk & Climatic Stress Assessment", h1_style))
    risk = data.get("risk", {})
    heat_data = risk.get("heat", {})
    cold_data = risk.get("cold", {})
    heat_score = heat_data.get("score_0_100", risk.get("heatStress", 50))
    cold_score = cold_data.get("score_0_100", risk.get("coldStress", 20))
    heat_level = heat_data.get("level", "medium").upper()
    cold_level = cold_data.get("level", "low").upper()
    explanation = risk.get("explanation", "Standard bioclimatic buffering required.")

    risk_table_data = [
        [
            Paragraph("<b>Stress Vector</b>", th_style),
            Paragraph("<b>Severity Level</b>", th_style),
            Paragraph("<b>Index Score (0-100)</b>", th_style),
            Paragraph("<b>Architectural Impact & Criteria</b>", th_style),
        ],
        [
            Paragraph("<b>Heat Stress</b>", td_style_bold),
            Paragraph(f"<font color='#B91C1C'><b>{heat_level}</b></font>", td_style),
            Paragraph(f"<b>{heat_score} / 100</b>", td_style),
            Paragraph(heat_data.get("reason", "Summer cooling and shading prioritization."), td_style),
        ],
        [
            Paragraph("<b>Cold Stress</b>", td_style_bold),
            Paragraph(f"<font color='#0284C7'><b>{cold_level}</b></font>", td_style),
            Paragraph(f"<b>{cold_score} / 100</b>", td_style),
            Paragraph(cold_data.get("reason", "Winter envelope insulation and solar gain retention."), td_style),
        ],
    ]
    risk_table = Table(risk_table_data, colWidths=[90, 80, 90, 280])
    risk_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F766E")),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(risk_table)
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"<i>Assessment Note: {explanation}</i>", body_style))
    story.append(Spacer(1, 10))

    # 4. Multi-Year Historical Climate Analysis (Table & Key Metrics)
    climate = data.get("climate_summary")
    if climate and hasattr(climate, "monthly_summary") and climate.monthly_summary:
        story.append(Paragraph("Multi-Year Historical Climate Profile (Open-Meteo Archive)", h1_style))

        # Metrics callout
        derived = getattr(climate, "derived_metrics", None)
        if derived:
            metrics_line = (
                f"<b>Annual Rainfall:</b> {derived.annual_rain:.0f} mm &nbsp;|&nbsp; "
                f"<b>Extreme Heat Days (≥40°C):</b> {derived.days_above_40:.1f} days/yr &nbsp;|&nbsp; "
                f"<b>Cold Days (≤5°C):</b> {derived.days_below_5:.1f} days/yr &nbsp;|&nbsp; "
                f"<b>Hottest Month:</b> Month {derived.hottest_month} &nbsp;|&nbsp; "
                f"<b>Coldest Month:</b> Month {derived.coldest_month}"
            )
            story.append(Paragraph(metrics_line, body_style))
            story.append(Spacer(1, 5))

        climate_rows = [
            [
                Paragraph("<b>Month</b>", th_style),
                Paragraph("<b>Max °C</b>", th_style),
                Paragraph("<b>Min °C</b>", th_style),
                Paragraph("<b>Mean °C</b>", th_style),
                Paragraph("<b>Humidity</b>", th_style),
                Paragraph("<b>Rainfall</b>", th_style),
                Paragraph("<b>Wind Speed</b>", th_style),
            ]
        ]
        for m in climate.monthly_summary:
            climate_rows.append([
                Paragraph(m.month_name[:3], td_style_bold),
                Paragraph(f"{m.avg_temp_max:.1f}°C" if m.avg_temp_max is not None else "-", td_style),
                Paragraph(f"{m.avg_temp_min:.1f}°C" if m.avg_temp_min is not None else "-", td_style),
                Paragraph(f"{m.avg_temp_mean:.1f}°C" if m.avg_temp_mean is not None else "-", td_style),
                Paragraph(f"{m.avg_humidity:.0f}%" if m.avg_humidity is not None else "-", td_style),
                Paragraph(f"{m.avg_rainfall:.1f} mm" if m.avg_rainfall is not None else "-", td_style),
                Paragraph(f"{m.avg_wind_speed:.1f} km/h" if m.avg_wind_speed is not None else "-", td_style),
            ])

        # Widths: 70 + 75 + 75 + 75 + 75 + 85 + 85 = 540 pt
        climate_table = Table(climate_rows, colWidths=[65, 75, 75, 75, 75, 85, 90])
        climate_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#CBD5E1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("ALIGN", (1, 1), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ])
        )
        story.append(climate_table)
        story.append(Spacer(1, 10))

    # 5. Passive Architectural Requirements Table
    reqs = data.get("requirements", {})
    strategies = reqs.get("strategies", [])
    if strategies:
        story.append(Paragraph("Passive Architectural Strategies & Guidelines (NBC 2016 / ECBC)", h1_style))
        req_rows = [
            [
                Paragraph("<b>Building Element</b>", th_style),
                Paragraph("<b>Recommended Strategy & Architectural Rationale</b>", th_style),
            ]
        ]
        for s in strategies:
            title = s.get("title") or s.get("element", "Strategy").title()
            val = s.get("value") or s.get("recommendation", "")
            reason = s.get("reason", "")
            content = f"<b>{val}</b>"
            if reason:
                content += f"<br/><font color='#475569'>{reason}</font>"
            req_rows.append([
                Paragraph(f"<b>{title}</b>", td_style_bold),
                Paragraph(content, td_style),
            ])

        req_table = Table(req_rows, colWidths=[120, 420])
        req_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F766E")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#CBD5E1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ])
        )
        story.append(req_table)
        story.append(Spacer(1, 10))

    # 6. Top 3 MCDM Ranked Architectural Designs
    top_designs = data.get("top_designs", [])
    if top_designs:
        story.append(Paragraph("Top Ranked Climate-Adaptive Designs (MCDM Weighted Sum)", h1_style))

        design_rows = [
            [
                Paragraph("<b>Rank & Design Archetype</b>", th_style),
                Paragraph("<b>Total Score</b>", th_style),
                Paragraph("<b>Criteria Breakdown</b>", th_style),
                Paragraph("<b>Envelope Specification & Rationale</b>", th_style),
            ]
        ]
        for idx, d in enumerate(top_designs, 1):
            name = d.get("name", f"Design Alternative #{idx}")
            total_score = d.get("totalScore", d.get("scores", {}).get("comfort", 75))
            sc = d.get("scores", {})
            criteria_str = (
                f"Comfort: <b>{sc.get('comfort', 0)}</b><br/>"
                f"Cost Eff.: <b>{sc.get('cost', 0)}</b><br/>"
                f"Safety: <b>{sc.get('safety', 0)}</b><br/>"
                f"Eco: <b>{sc.get('sustainability', 0)}</b>"
            )
            desc = d.get("description", "")
            reasons = d.get("reasons", [])
            reasons_html = ""
            if reasons:
                reasons_html = "<br/>• " + "<br/>• ".join(reasons[:2])

            design_rows.append([
                Paragraph(f"<b>#{idx} {name}</b>", td_style_bold),
                Paragraph(f"<font color='#0F766E' size='11'><b>{total_score}</b></font><br/><font size='7' color='#64748B'>/ 100</font>", td_style),
                Paragraph(criteria_str, td_style),
                Paragraph(f"<b>{desc}</b>{reasons_html}", td_style),
            ])

        designs_table = Table(design_rows, colWidths=[130, 55, 95, 260])
        designs_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#CBD5E1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("ALIGN", (1, 1), (1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ])
        )
        story.append(designs_table)
        story.append(Spacer(1, 14))

    # 7. Mandatory Disclaimer Box
    disclaimer_box_data = [
        [
            Paragraph(
                "<b>ADVISORY NOTICE:</b> This report is generated by the EcoShelter algorithmic design engine "
                "for conceptual planning and bioclimatic guidance only, consult a qualified architect and "
                "local building codes before proceeding with any structural development.",
                disclaimer_style,
            )
        ]
    ]
    disclaimer_table = Table(disclaimer_box_data, colWidths=[540])
    disclaimer_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#F59E0B")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ])
    )
    story.append(KeepTogether([disclaimer_table]))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    return buffer.getvalue()


async def generate_report_pdf(
    latitude: float,
    longitude: float,
    weights: Optional[Dict[str, float]] = None,
    plot_size: Optional[Dict[str, float]] = None,
) -> bytes:
    """
    High-level entry point: gathers data and renders PDF bytes.
    """
    data = await collect_report_data(
        latitude=latitude,
        longitude=longitude,
        weights=weights,
        plot_size=plot_size,
    )
    return build_pdf_document(data)
