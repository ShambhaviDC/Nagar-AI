from fastapi import APIRouter, Depends, HTTPException, Query, Body
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.database import get_database
from app.models.complaint import ComplaintResponse, ComplaintPriority
from app.auth.dependencies import require_central_head
from app.agents.orchestrator import orchestrator
from app.services.audit_service import record_complaint_history
from app.services.notification_service import create_notification

router = APIRouter(prefix="/central", tags=["Central Head Operations"])

def clean_doc(doc: dict) -> dict:
    if not doc:
        return None
    d = dict(doc)
    d["id"] = str(d["_id"])
    del d["_id"]
    return d

@router.get("/dashboard")
async def get_central_dashboard(
    current_user: dict = Depends(require_central_head),
    db = Depends(get_database)
):
    locality_id = current_user.get("locality_id")
    locality = None
    if locality_id:
        try:
            locality = await db.localities.find_one({"_id": ObjectId(locality_id)})
        except Exception:
            locality = await db.localities.find_one({"id": locality_id})
    if not locality:
        locality = await db.localities.find_one({})

    loc_id = str(locality["_id"]) if locality else None
    loc_filter = {"locality_id": loc_id} if loc_id else {}
    now = datetime.now(timezone.utc)

    total = await db.complaints.count_documents(loc_filter)
    pending = await db.complaints.count_documents({**loc_filter, "status": {"$nin": ["resolved", "verified"]}})
    resolved = await db.complaints.count_documents({**loc_filter, "status": {"$in": ["resolved", "verified"]}})
    overdue = await db.complaints.count_documents({
        **loc_filter,
        "status": {"$nin": ["resolved", "verified"]},
        "resolution_deadline": {"$lt": now}
    })
    critical_p1 = await db.complaints.count_documents({
        **loc_filter,
        "priority": "P1",
        "status": {"$nin": ["resolved", "verified"]}
    })
    reopened = await db.complaints.count_documents({**loc_filter, "status": "reopened"})

    # Active escalations
    esc_cursor = db.escalation_records.find({"status": "active"}).sort("created_at", -1).limit(10)
    escalations = [clean_doc(e) async for e in esc_cursor]

    # Streets with complaint counts
    streets_cursor = db.streets.find(loc_filter)
    streets_summary = []
    async for s in streets_cursor:
        sid = str(s["_id"])
        s_clean = clean_doc(s)
        s_clean["active_count"] = await db.complaints.count_documents({
            "street_id": sid,
            "status": {"$nin": ["resolved", "verified"]}
        })
        s_clean["resolved_count"] = await db.complaints.count_documents({
            "street_id": sid,
            "status": {"$in": ["resolved", "verified"]}
        })
        s_clean["overdue_count"] = await db.complaints.count_documents({
            "street_id": sid,
            "status": {"$nin": ["resolved", "verified"]},
            "resolution_deadline": {"$lt": now}
        })
        streets_summary.append(s_clean)

    # Street Head performance list
    street_heads_cursor = db.users.find({"role": "street_head", **loc_filter})
    street_heads = [clean_doc(u) async for u in street_heads_cursor]

    return {
        "locality": clean_doc(locality) if locality else None,
        "metrics": {
            "total_complaints": total,
            "pending_complaints": pending,
            "resolved_complaints": resolved,
            "overdue_complaints": overdue,
            "critical_p1_complaints": critical_p1,
            "reopened_complaints": reopened,
            "active_escalations": len(escalations)
        },
        "streets_summary": streets_summary,
        "street_heads": street_heads,
        "recent_escalations": escalations
    }

@router.get("/locality-overview")
async def get_locality_overview(
    current_user: dict = Depends(require_central_head),
    db = Depends(get_database)
):
    locality = await db.localities.find_one({})
    if not locality:
        raise HTTPException(status_code=404, detail="Locality not configured")

    loc_id = str(locality["_id"])
    cursor_st = db.streets.find({"locality_id": loc_id})
    streets = [clean_doc(s) async for s in cursor_st]

    cursor_c = db.complaints.find({"locality_id": loc_id})
    complaints = [clean_doc(c) async for c in cursor_c]

    insights = await orchestrator.generate_locality_insights(
        locality=clean_doc(locality),
        streets=streets,
        complaints=complaints
    )

    return insights.model_dump()

@router.get("/street-performance")
async def get_street_performance(
    current_user: dict = Depends(require_central_head),
    db = Depends(get_database)
):
    locality = await db.localities.find_one({})
    loc_id = str(locality["_id"]) if locality else None
    
    cursor_st = db.streets.find({"locality_id": loc_id} if loc_id else {})
    streets = [clean_doc(s) async for s in cursor_st]

    cursor_c = db.complaints.find({"locality_id": loc_id} if loc_id else {})
    complaints = [clean_doc(c) async for c in cursor_c]

    insights = await orchestrator.generate_locality_insights(
        locality=clean_doc(locality) if locality else {},
        streets=streets,
        complaints=complaints
    )

    return insights.street_performance

@router.get("/overdue-complaints", response_model=List[ComplaintResponse])
async def get_overdue_complaints(
    current_user: dict = Depends(require_central_head),
    db = Depends(get_database)
):
    now = datetime.now(timezone.utc)
    cursor = db.complaints.find({
        "status": {"$nin": ["resolved", "verified"]},
        "resolution_deadline": {"$lt": now}
    }).sort("priority", 1)
    
    complaints = [ComplaintResponse(**clean_doc(c)) async for c in cursor]
    return complaints

@router.get("/analytics")
async def get_analytics(
    current_user: dict = Depends(require_central_head),
    db = Depends(get_database)
):
    locality = await db.localities.find_one({})
    loc_id = str(locality["_id"]) if locality else None
    
    cursor_st = db.streets.find({"locality_id": loc_id} if loc_id else {})
    streets = [clean_doc(s) async for s in cursor_st]

    cursor_c = db.complaints.find({"locality_id": loc_id} if loc_id else {})
    complaints = [clean_doc(c) async for c in cursor_c]

    insights = await orchestrator.generate_locality_insights(
        locality=clean_doc(locality) if locality else {},
        streets=streets,
        complaints=complaints
    )

    return {
        "category_distribution": insights.category_distribution,
        "priority_distribution": insights.priority_distribution,
        "recurring_hotspots": insights.recurring_hotspots,
        "ai_recommendations": insights.ai_recommendations,
        "overall_sla_compliance": insights.overall_sla_compliance
    }

@router.post("/complaints/{complaint_id}/reassign", response_model=ComplaintResponse)
async def reassign_complaint(
    complaint_id: str,
    payload: dict = Body(..., example={"new_street_head_id": "...", "reason": "..."}),
    current_user: dict = Depends(require_central_head),
    db = Depends(get_database)
):
    """Central Head reassigns a complaint to another Street Head."""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        complaint = await db.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    new_head_id = payload.get("new_street_head_id")
    try:
        new_head = await db.users.find_one({"_id": ObjectId(new_head_id)})
    except Exception:
        new_head = await db.users.find_one({"id": new_head_id})
    if not new_head:
        raise HTTPException(status_code=400, detail="Target Street Head not found")

    now = datetime.now(timezone.utc)
    update_data = {
        "assigned_street_head_id": str(new_head.get("_id", new_head.get("id"))),
        "assigned_street_head_name": new_head.get("name"),
        "updated_at": now
    }

    try:
        await db.complaints.update_one({"_id": complaint["_id"]}, {"$set": update_data})
    except Exception:
        await db.complaints.update_one({"id": complaint_id}, {"$set": update_data})

    complaint.update(update_data)

    # Audit Trail
    await record_complaint_history(
        complaint_id=complaint_id,
        action="reassigned_by_central",
        performed_by_id=current_user["id"],
        performed_by_name=current_user.get("name"),
        performed_by_role=current_user.get("role"),
        details=f"Central Head reassigned complaint to {new_head.get('name')}. Reason: {payload.get('reason', 'Administrative reassignment')}"
    )

    # Notify new street head
    await create_notification(
        user_id=str(new_head.get("_id", new_head.get("id"))),
        title=f"Reassigned Complaint: {complaint.get('complaint_code')}",
        message=f"Central Head has assigned {complaint.get('complaint_code')} on {complaint.get('street_name')} to your command.",
        notification_type="alert",
        complaint_id=complaint_id
    )

    return ComplaintResponse(**clean_doc(complaint))

@router.post("/trigger-surveillance")
async def trigger_surveillance(
    current_user: dict = Depends(require_central_head)
):
    """Manually invoke the background SLA monitoring & escalation cycle on demand."""
    from app.services.scheduler_service import run_surveillance_and_escalations
    await run_surveillance_and_escalations()
    return {"message": "Surveillance cycle completed successfully."}


@router.post("/complaints/{complaint_id}/intervene", response_model=ComplaintResponse)
async def intervene_complaint(
    complaint_id: str,
    payload: dict = Body(..., example={"intervention_notes": "...", "elevate_priority": "P1", "direct_action": "..."}),
    current_user: dict = Depends(require_central_head),
    db = Depends(get_database)
):
    """Central Head administratively intervenes in a stalled or critical complaint."""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        complaint = await db.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.now(timezone.utc)
    set_fields = {"updated_at": now}
    
    if payload.get("elevate_priority"):
        set_fields["priority"] = payload["elevate_priority"]

    if payload.get("status"):
        set_fields["status"] = payload["status"]

    try:
        await db.complaints.update_one({"_id": complaint["_id"]}, {"$set": set_fields})
    except Exception:
        await db.complaints.update_one({"id": complaint_id}, {"$set": set_fields})

    # Update or resolve matching escalation record
    await db.escalation_records.update_many(
        {"complaint_id": complaint_id, "status": "active"},
        {"$set": {
            "status": "intervened",
            "intervention_notes": payload.get("intervention_notes", "Central Head intervened directly."),
            "intervened_by_id": current_user["id"],
            "resolved_at": now
        }}
    )

    complaint.update(set_fields)

    # Audit Trail
    await record_complaint_history(
        complaint_id=complaint_id,
        action="central_intervention",
        performed_by_id=current_user["id"],
        performed_by_name=current_user.get("name"),
        performed_by_role=current_user.get("role"),
        details=f"Central Head intervened: {payload.get('intervention_notes')}. Action: {payload.get('direct_action', 'Direct Command')}"
    )

    # Notify street head and resident
    if complaint.get("assigned_street_head_id"):
        await create_notification(
            user_id=str(complaint["assigned_street_head_id"]),
            title=f"Central Intervention on {complaint.get('complaint_code')}",
            message=f"Central Head has issued an intervention directive: {payload.get('intervention_notes')}",
            notification_type="escalation",
            complaint_id=complaint_id
        )

    return ComplaintResponse(**clean_doc(complaint))

@router.post("/trigger-surveillance")
async def trigger_surveillance(
    current_user: dict = Depends(require_central_head)
):
    """Manually invoke the background SLA monitoring & escalation cycle on demand."""
    from app.services.scheduler_service import run_surveillance_and_escalations
    await run_surveillance_and_escalations()
    return {"message": "Surveillance cycle completed successfully."}

