from fastapi import APIRouter, Depends, Query
from bson import ObjectId
from app.database import get_database
from app.auth.dependencies import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/map", tags=["Geographical Intelligence & Maps"])

def clean_doc(doc: dict) -> dict:
    if not doc:
        return None
    d = dict(doc)
    d["id"] = str(d["_id"])
    del d["_id"]
    return d

@router.get("/complaints")
async def get_map_complaints(
    locality_id: Optional[str] = None,
    street_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, description="active, resolved, all"),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Retrieve geo-tagged complaints with priority colors and street head info for Leaflet maps."""
    query = {}
    if locality_id:
        query["locality_id"] = locality_id
    if street_id:
        query["street_id"] = street_id

    # Street Head scope isolation
    if current_user.get("role") == "street_head":
        user_street = current_user.get("street_id")
        if user_street:
            query["street_id"] = user_street

    if status_filter == "active":
        query["status"] = {"$nin": ["resolved", "verified"]}
    elif status_filter == "resolved":
        query["status"] = {"$in": ["resolved", "verified"]}

    cursor = db.complaints.find(query).limit(200)
    features = []
    
    # Priority color mapping
    priority_colors = {
        "P1": "#EF4444",  # Red
        "P2": "#F59E0B",  # Amber/Orange
        "P3": "#3B82F6",  # Blue
        "P4": "#10B981"   # Emerald Green
    }

    async for c in cursor:
        lat = c.get("latitude")
        lng = c.get("longitude")
        if lat is not None and lng is not None:
            features.append({
                "id": str(c["_id"]),
                "complaint_code": c.get("complaint_code"),
                "title": c.get("title"),
                "description": c.get("description"),
                "category": c.get("category"),
                "priority": c.get("priority"),
                "status": c.get("status"),
                "marker_color": priority_colors.get(c.get("priority"), "#6B7280"),
                "latitude": lat,
                "longitude": lng,
                "street_name": c.get("street_name"),
                "landmark": c.get("landmark"),
                "assigned_street_head_name": c.get("assigned_street_head_name"),
                "image_urls": c.get("image_urls", []),
                "created_at": c.get("created_at").isoformat() if c.get("created_at") else None
            })

    return {
        "is_demo_data": True,
        "coordinate_notice": "Coordinates are illustrative sample geo-points located in Greenfield Locality demo environment.",
        "features": features
    }

@router.get("/street-summary")
async def get_street_map_summary(
    locality_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Retrieve street centers, bounding lines, and complaint density counts."""
    query = {}
    if locality_id:
        query["locality_id"] = locality_id
        
    cursor = db.streets.find(query)
    street_summaries = []
    
    async for s in cursor:
        sid = str(s["_id"])
        active_count = await db.complaints.count_documents({
            "street_id": sid,
            "status": {"$nin": ["resolved", "verified"]}
        })
        resolved_count = await db.complaints.count_documents({
            "street_id": sid,
            "status": {"$in": ["resolved", "verified"]}
        })
        p1_count = await db.complaints.count_documents({
            "street_id": sid,
            "priority": "P1",
            "status": {"$nin": ["resolved", "verified"]}
        })

        street_summaries.append({
            "id": sid,
            "name": s.get("name"),
            "code": s.get("code"),
            "center_lat": s.get("center_lat"),
            "center_lng": s.get("center_lng"),
            "street_head_name": s.get("street_head_name", "Unassigned"),
            "active_complaints": active_count,
            "resolved_complaints": resolved_count,
            "critical_p1_count": p1_count,
            "density_weight": min(1.0, active_count / 10.0)
        })

    return street_summaries
