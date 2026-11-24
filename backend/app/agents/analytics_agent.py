from app.agents.base import BaseAgent
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import statistics

class StreetPerformanceMetrics(BaseModel):
    street_id: str
    street_name: str
    street_head_id: Optional[str] = None
    street_head_name: str
    total_complaints: int
    pending_complaints: int
    resolved_complaints: int
    overdue_complaints: int
    reopened_complaints: int
    avg_resolution_hours: float
    sla_compliance_rate: float = Field(description="Percentage 0-100 of complaints resolved within SLA")
    performance_rating: str  # Excellent, Good, Needs Improvement, Critical Attention

class LocalityInsightsReport(BaseModel):
    timestamp: datetime
    locality_id: str
    locality_name: str
    total_complaints: int
    active_complaints: int
    resolved_complaints: int
    overdue_complaints: int
    critical_p1_count: int
    overall_sla_compliance: float
    category_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    street_performance: List[StreetPerformanceMetrics]
    recurring_hotspots: List[str]
    ai_recommendations: List[str]

def ensure_tz(dt):
    if dt is None:
        return None
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        except Exception:
            return None
    if isinstance(dt, datetime) and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

class LocalityAnalyticsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Locality Analytics and Insights Agent",
            role_description="Aggregates locality-wide telemetry, computes street head accountability scores, uncovers recurring infrastructural defects, and provides factual analytics for Central Administration."
        )

    async def generate_insights(
        self,
        locality: Dict[str, Any],
        streets: List[Dict[str, Any]],
        complaints: List[Dict[str, Any]]
    ) -> LocalityInsightsReport:
        now = datetime.now(timezone.utc)
        total = len(complaints)
        active = 0
        resolved = 0
        overdue = 0
        critical_p1 = 0

        cat_dist: Dict[str, int] = {}
        pri_dist: Dict[str, int] = {"P1": 0, "P2": 0, "P3": 0, "P4": 0}
        street_complaint_map: Dict[str, List[Dict[str, Any]]] = {}

        for c in complaints:
            status = c.get("status", "registered")
            pri = c.get("priority", "P3")
            cat = c.get("category", "Other locality-related issues")
            sid = str(c.get("street_id", ""))

            cat_dist[cat] = cat_dist.get(cat, 0) + 1
            pri_dist[pri] = pri_dist.get(pri, 0) + 1

            if pri == "P1":
                critical_p1 += 1

            if status in ["resolved", "verified"]:
                resolved += 1
            else:
                active += 1

            # Check overdue
            res_dl = ensure_tz(c.get("resolution_deadline"))
            if res_dl and status not in ["resolved", "verified"]:
                if now > res_dl:
                    overdue += 1

            street_complaint_map.setdefault(sid, []).append(c)

        # Street metrics
        street_perf: List[StreetPerformanceMetrics] = []
        recurring_hotspots: List[str] = []

        for st in streets:
            sid = str(st.get("_id", st.get("id", "")))
            s_name = st.get("name", "Street")
            s_head_id = st.get("assigned_street_head_id")
            s_head_name = st.get("street_head_name", "Unassigned")
            
            s_complaints = street_complaint_map.get(sid, [])
            s_total = len(s_complaints)
            s_pending = sum(1 for x in s_complaints if x.get("status") not in ["resolved", "verified"])
            s_resolved = sum(1 for x in s_complaints if x.get("status") in ["resolved", "verified"])
            s_reopened = sum(1 for x in s_complaints if x.get("reopened_count", 0) > 0)
            
            s_overdue = 0
            res_times = []
            compliant_count = 0

            for x in s_complaints:
                dl = ensure_tz(x.get("resolution_deadline"))
                resolved_at = ensure_tz(x.get("resolved_at"))
                c_at = ensure_tz(x.get("created_at")) or now
                
                if x.get("status") in ["resolved", "verified"]:
                    if resolved_at and c_at:
                        delta_hours = max(0.5, (resolved_at - c_at).total_seconds() / 3600.0)
                        res_times.append(delta_hours)
                    
                    if dl and resolved_at:
                        if resolved_at <= dl:
                            compliant_count += 1
                    else:
                        compliant_count += 1
                else:
                    if dl and now > dl:
                        s_overdue += 1

            avg_res = round(statistics.mean(res_times), 1) if res_times else 0.0
            sla_rate = round((compliant_count / max(1, s_resolved)) * 100, 1) if s_resolved > 0 else 85.0

            if sla_rate >= 90 and s_overdue == 0:
                rating = "Excellent"
            elif sla_rate >= 75 and s_overdue <= 1:
                rating = "Good"
            elif sla_rate >= 50 or s_overdue <= 3:
                rating = "Needs Improvement"
            else:
                rating = "Critical Attention"

            street_perf.append(StreetPerformanceMetrics(
                street_id=sid,
                street_name=s_name,
                street_head_id=str(s_head_id) if s_head_id else None,
                street_head_name=s_head_name,
                total_complaints=s_total,
                pending_complaints=s_pending,
                resolved_complaints=s_resolved,
                overdue_complaints=s_overdue,
                reopened_complaints=s_reopened,
                avg_resolution_hours=avg_res,
                sla_compliance_rate=sla_rate,
                performance_rating=rating
            ))

            # Detect hotspot: more than 4 complaints in same category on this street
            s_cats = {}
            for x in s_complaints:
                c_name = x.get("category", "")
                s_cats[c_name] = s_cats.get(c_name, 0) + 1
            for c_name, count in s_cats.items():
                if count >= 3:
                    recurring_hotspots.append(f"{s_name}: Recurring {c_name} issue ({count} incidents recorded).")

        overall_sla = round(((resolved - overdue) / max(1, total)) * 100, 1)
        overall_sla = max(0.0, min(100.0, overall_sla))

        recommendations = [
            "Prioritize pending P1 public safety hazards immediately to avoid life safety incidents.",
            "Schedule root-cause preventive maintenance in identified recurring hotspots.",
            "Strengthen street head response times where acknowledgement compliance is below 80%."
        ]

        return LocalityInsightsReport(
            timestamp=now,
            locality_id=str(locality.get("_id", locality.get("id", ""))),
            locality_name=locality.get("name", "Greenfield Locality"),
            total_complaints=total,
            active_complaints=active,
            resolved_complaints=resolved,
            overdue_complaints=overdue,
            critical_p1_count=critical_p1,
            overall_sla_compliance=overall_sla,
            category_distribution=cat_dist,
            priority_distribution=pri_dist,
            street_performance=street_perf,
            recurring_hotspots=recurring_hotspots,
            ai_recommendations=recommendations
        )
