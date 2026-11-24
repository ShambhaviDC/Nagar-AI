from app.agents.base import BaseAgent
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class WorkerRecommendation(BaseModel):
    worker_id: str
    worker_name: str
    phone: str
    department: str
    active_tasks: int
    match_reason: str
    suitability_score: float

class AssignmentRecommendation(BaseModel):
    locality_id: str
    street_id: str
    street_name: str
    responsible_street_head_id: Optional[str] = None
    responsible_street_head_name: Optional[str] = None
    recommended_department: str
    priority_level: str
    recommended_workers: List[WorkerRecommendation] = []
    assignment_notes: str

class SmartAssignmentAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Smart Assignment Agent",
            role_description="Directs complaints to the responsible Street Head and recommends suitable maintenance workers based on skill department and active workload."
        )

    CATEGORY_DEPT_MAP = {
        "Streetlights": "Electrical Maintenance",
        "Electricity": "Electrical Power & Grid",
        "Water supply": "Water Works & Pipeline",
        "Plumbing": "Water Works & Pipeline",
        "Drainage": "Sewerage & Drainage",
        "Garbage collection": "Solid Waste Management",
        "Road damage": "Civil Works & Paving",
        "Public infrastructure": "Public Works",
        "Sanitation": "Health & Sanitation",
        "Public safety": "Municipal Safety & Vigilance",
        "Other locality-related issues": "General Public Works"
    }

    async def recommend_assignment(
        self,
        complaint: Dict[str, Any],
        street: Dict[str, Any],
        available_workers: List[Dict[str, Any]]
    ) -> AssignmentRecommendation:
        category = complaint.get("category", "Other locality-related issues")
        priority = complaint.get("priority", "P3")
        recommended_dept = self.CATEGORY_DEPT_MAP.get(category, "General Public Works")
        
        street_head_id = street.get("assigned_street_head_id")
        street_head_name = street.get("street_head_name", "Unassigned Street Head")
        street_name = street.get("name", "Unknown Street")

        # Rank workers: matching department first, lower active_tasks first
        recommended_workers = []
        for w in available_workers:
            w_dept = w.get("department", "")
            w_active = w.get("active_tasks_count", 0)
            status = w.get("status", "available")
            
            score = 0.0
            if status == "available":
                score += 40
            elif status == "busy":
                score += 10
            else:
                score -= 50

            if w_dept.lower() in recommended_dept.lower() or recommended_dept.lower() in w_dept.lower():
                score += 50
                reason = f"Exact department match: {w_dept}"
            else:
                score += 10
                reason = f"Cross-functional support from {w_dept}"

            # Workload penalty: minus 5 points per active task
            score = max(0.0, score - (w_active * 5))

            recommended_workers.append(WorkerRecommendation(
                worker_id=str(w.get("_id", w.get("id", ""))),
                worker_name=w.get("name", "Worker"),
                phone=w.get("phone", ""),
                department=w_dept,
                active_tasks=w_active,
                match_reason=reason,
                suitability_score=round(score, 1)
            ))

        # Sort workers by suitability score descending
        recommended_workers.sort(key=lambda r: r.suitability_score, reverse=True)

        notes = (
            f"Assigned to Street Head {street_head_name} for {street_name}. "
            f"Recommended department '{recommended_dept}' with {len(recommended_workers)} prospective personnel."
        )

        return AssignmentRecommendation(
            locality_id=str(complaint.get("locality_id", "")),
            street_id=str(street.get("id", street.get("_id", ""))),
            street_name=street_name,
            responsible_street_head_id=str(street_head_id) if street_head_id else None,
            responsible_street_head_name=street_head_name,
            recommended_department=recommended_dept,
            priority_level=priority,
            recommended_workers=recommended_workers[:3],
            assignment_notes=notes
        )
