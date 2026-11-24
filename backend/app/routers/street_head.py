from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional

from app.database import get_database
from app.models.complaint import ComplaintResponse
from app.models.worker import MaintenanceWorkerCreate, MaintenanceWorkerResponse
from app.auth.dependencies import require_street_head

router = APIRouter(prefix="/street-head", tags=["Street Head Operations"])

def clean_doc(doc: dict) -> dict:
    if not doc:
        return None
    d = dict(doc)
    d["id"] = str(d["_id"])
    del d["_id"]
    return d

@router.get("/dashboard")
async def get_street_head_dashboard(
    current_user: dict = Depends(require_street_head),
    db = Depends(get_database)
):
    street_id = current_user.get("street_id")
    street = None
    if street_id:
        try:
            street = await db.streets.find_one({"_id": ObjectId(street_id)})
        except Exception:
            street = await db.streets.find_one({"id": street_id})

    now = datetime.now(timezone.utc)
    base_filter = {"street_id": street_id} if street_id else {}

    total_count = await db.complaints.count_documents(base_filter)
    new_count = await db.complaints.count_documents({**base_filter, "status": "registered"})
    ack_count = await db.complaints.count_documents({**base_filter, "status": "acknowledged"})
    assigned_count = await db.complaints.count_documents({**base_filter, "status": "worker_assigned"})
    in_progress_count = await db.complaints.count_documents({**base_filter, "status": "in_progress"})
    resolved_count = await db.complaints.count_documents({**base_filter, "status": {"$in": ["resolved", "verified"]}})
    reopened_count = await db.complaints.count_documents({**base_filter, "status": "reopened"})

    # Calculate overdue
    overdue_count = await db.complaints.count_documents({
        **base_filter,
        "status": {"$nin": ["resolved", "verified"]},
        "resolution_deadline": {"$lt": now}
    })

    # Recent complaints
    recent_cursor = db.complaints.find(base_filter).sort("created_at", -1).limit(10)
    recent = [clean_doc(c) async for c in recent_cursor]

    # Available workers
    locality_id = current_user.get("locality_id")
    worker_filter = {"locality_id": locality_id} if locality_id else {}
    workers_cursor = db.maintenance_workers.find(worker_filter)
    workers = [clean_doc(w) async for w in workers_cursor]

    return {
        "street": clean_doc(street) if street else None,
        "metrics": {
            "total_complaints": total_count,
            "new_complaints": new_count,
            "acknowledged_complaints": ack_count,
            "assigned_complaints": assigned_count,
            "in_progress_complaints": in_progress_count,
            "overdue_complaints": overdue_count,
            "resolved_complaints": resolved_count,
            "reopened_complaints": reopened_count
        },
        "recent_complaints": recent,
        "maintenance_workers": workers
    }

@router.get("/complaints")
async def get_street_complaints(
    tab: Optional[str] = Query(None, description="all, new, assigned, in_progress, overdue, resolved"),
    current_user: dict = Depends(require_street_head),
    db = Depends(get_database)
):
    street_id = current_user.get("street_id")
    query = {"street_id": street_id} if street_id else {}
    now = datetime.now(timezone.utc)

    if tab == "new":
        query["status"] = "registered"
    elif tab == "assigned":
        query["status"] = "worker_assigned"
    elif tab == "in_progress":
        query["status"] = "in_progress"
    elif tab == "resolved":
        query["status"] = {"$in": ["resolved", "verified"]}
    elif tab == "overdue":
        query["status"] = {"$nin": ["resolved", "verified"]}
        query["resolution_deadline"] = {"$lt": now}

    cursor = db.complaints.find(query).sort("created_at", -1)
    complaints = [ComplaintResponse(**clean_doc(c)) async for c in cursor]
    return complaints

@router.get("/workers", response_model=List[MaintenanceWorkerResponse])
async def list_workers(
    current_user: dict = Depends(require_street_head),
    db = Depends(get_database)
):
    locality_id = current_user.get("locality_id")
    filter_q = {"locality_id": locality_id} if locality_id else {}
    cursor = db.maintenance_workers.find(filter_q)
    return [MaintenanceWorkerResponse(**clean_doc(w)) async for w in cursor]

@router.post("/workers", response_model=MaintenanceWorkerResponse)
async def create_worker(
    worker_in: MaintenanceWorkerCreate,
    current_user: dict = Depends(require_street_head),
    db = Depends(get_database)
):
    worker_doc = worker_in.model_dump()
    worker_doc["created_at"] = datetime.now(timezone.utc)
    result = await db.maintenance_workers.insert_one(worker_doc)
    worker_doc["id"] = str(result.inserted_id)
    del worker_doc["_id"]
    return MaintenanceWorkerResponse(**worker_doc)
