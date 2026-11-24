from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional
import random

from app.database import get_database
from app.models.complaint import (
    ComplaintCreate, ComplaintResponse, WorkerAssignmentRequest,
    ResolutionEvidenceRequest, FeedbackRequest, ReopenRequest, ComplaintStatus
)
from app.auth.dependencies import get_current_user, require_resident, require_street_head
from app.agents.orchestrator import orchestrator
from app.services.audit_service import record_complaint_history, get_complaint_history
from app.services.notification_service import create_notification, notify_users_by_role

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def clean_doc(doc: dict) -> dict:
    if not doc:
        return None
    d = dict(doc)
    d["id"] = str(d["_id"])
    del d["_id"]
    return d

@router.post("", response_model=ComplaintResponse)
async def register_complaint(
    payload: ComplaintCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Resident complaint registration triggered with automated AI Multi-Agent orchestration."""
    # Verify street exists
    try:
        street = await db.streets.find_one({"_id": ObjectId(payload.street_id)})
    except Exception:
        street = await db.streets.find_one({"id": payload.street_id})
    
    if not street:
        raise HTTPException(status_code=400, detail="Invalid street_id specified.")

    street_name = street.get("name", "Local Street")

    # If description is empty, use voice transcript or default
    effective_description = (payload.description or "").strip()
    if not effective_description and payload.voice_transcript:
        effective_description = payload.voice_transcript.strip()
    if not effective_description and payload.landmark:
        effective_description = f"Civic defect reported near landmark: {payload.landmark}"
    if not effective_description:
        effective_description = f"Civic infrastructure issue reported on {street_name}."

    # Fetch recent complaints on this street for duplicate detection
    recent_cursor = db.complaints.find({
        "street_id": payload.street_id,
        "status": {"$ne": "resolved"}
    }).limit(20)
    recent_complaints = [clean_doc(c) async for c in recent_cursor]

    # Fetch available maintenance workers
    workers_cursor = db.maintenance_workers.find({"locality_id": payload.locality_id})
    available_workers = [clean_doc(w) async for w in workers_cursor]

    # Run AI multi-agent pipeline
    ai_intake = await orchestrator.process_new_complaint(
        text=effective_description,
        locality_id=payload.locality_id,
        street_id=payload.street_id,
        street_doc=clean_doc(street),
        recent_complaints=recent_complaints,
        available_workers=available_workers,
        user_category=payload.category,
        user_priority=payload.priority,
        voice_transcript=payload.voice_transcript,
        image_urls=payload.image_urls
    )

    # Generate sequential unique complaint code e.g. CMP-2026-XXXX
    count = await db.complaints.count_documents({}) + 101
    complaint_code = f"CMP-2026-{count:04d}"

    now = datetime.now(timezone.utc)
    
    complaint_doc = {
        "complaint_code": complaint_code,
        "title": payload.title or ai_intake["title"],
        "description": effective_description,
        "category": ai_intake["category"],
        "priority": ai_intake["priority"],
        "status": ComplaintStatus.REGISTERED,
        "locality_id": payload.locality_id,
        "street_id": payload.street_id,
        "street_name": street_name,
        "landmark": payload.landmark,
        "latitude": payload.latitude or street.get("center_lat"),
        "longitude": payload.longitude or street.get("center_lng"),
        "image_urls": payload.image_urls or [],
        "voice_url": payload.voice_url,
        "voice_transcript": payload.voice_transcript,
        "resident_id": current_user["id"],
        "resident_name": current_user.get("name"),
        "resident_phone": current_user.get("phone"),
        "assigned_street_head_id": ai_intake["assigned_street_head_id"],
        "assigned_street_head_name": ai_intake["assigned_street_head_name"],
        "assigned_worker_id": None,
        "worker_name": None,
        "worker_department": ai_intake["recommended_department"],
        "resolution_notes": None,
        "resolution_image_urls": [],
        "acknowledgement_deadline": ai_intake["acknowledgement_deadline"],
        "resolution_deadline": ai_intake["resolution_deadline"],
        "acknowledged_at": None,
        "assigned_at": None,
        "resolved_at": None,
        "verified_at": None,
        "upvotes_count": 0,
        "upvoted_by": [],
        "severity_score": ai_intake.get("severity_score", 5),
        "impact_scope": ai_intake.get("impact_scope", "street_segment"),
        "image_scan_result": ai_intake.get("image_scan_result"),
        "reopened_count": 0,
        "escalation_level": 0,
        "ai_metadata": ai_intake["ai_metadata"],
        "created_at": now,
        "updated_at": now
    }

    result = await db.complaints.insert_one(complaint_doc)
    complaint_id = str(result.inserted_id)
    complaint_doc["id"] = complaint_id
    del complaint_doc["_id"]

    # Audit Trail
    await record_complaint_history(
        complaint_id=complaint_id,
        action="registered",
        performed_by_id=current_user["id"],
        performed_by_name=current_user.get("name"),
        performed_by_role=current_user.get("role"),
        details=f"Complaint registered and classified as {ai_intake['priority']} ({ai_intake['category']}). Assigned to Street Head {ai_intake['assigned_street_head_name']}."
    )

    # Notify Resident
    await create_notification(
        user_id=current_user["id"],
        title=f"Complaint Registered: {complaint_code}",
        message=f"Your complaint regarding '{complaint_doc['title']}' has been registered as {ai_intake['priority']}. Street maintenance has been alerted.",
        notification_type="complaint_status",
        complaint_id=complaint_id
    )

    # Notify Assigned Street Head
    if ai_intake["assigned_street_head_id"]:
        await create_notification(
            user_id=ai_intake["assigned_street_head_id"],
            title=f"New {ai_intake['priority']} Complaint on {street_name}",
            message=f"{complaint_code}: '{complaint_doc['title']}'. Acknowledgement required by {ai_intake['acknowledgement_deadline'].strftime('%H:%M UTC')}.",
            notification_type="complaint_status",
            complaint_id=complaint_id
        )

    # If P1 Critical, also immediately alert Central Head
    if ai_intake["priority"] == "P1":
        await notify_users_by_role(
            role="central_head",
            title=f"URGENT: P1 Critical Hazard on {street_name}",
            message=f"Critical complaint {complaint_code}: '{complaint_doc['title']}'. Life safety risk reported.",
            notification_type="alert",
            complaint_id=complaint_id,
            locality_id=payload.locality_id
        )

    return ComplaintResponse(**complaint_doc)

@router.get("", response_model=List[ComplaintResponse])
async def list_complaints(
    locality_id: Optional[str] = None,
    street_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    query = {}
    if locality_id:
        query["locality_id"] = locality_id
    if street_id:
        query["street_id"] = street_id
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if category:
        query["category"] = category

    # If Street Head, isolate to their assigned street unless they are central head
    if current_user.get("role") == "street_head":
        user_street_id = current_user.get("street_id")
        if user_street_id:
            query["street_id"] = user_street_id

    # If Resident calling general list, isolate to their own complaints
    if current_user.get("role") == "resident":
        query["resident_id"] = current_user["id"]

    cursor = db.complaints.find(query).sort("created_at", -1).limit(100)
    complaints = []
    async for c in cursor:
        d = clean_doc(c)
        d["has_upvoted"] = current_user["id"] in d.get("upvoted_by", [])
        complaints.append(ComplaintResponse(**d))
    return complaints

@router.get("/street-feed", response_model=List[ComplaintResponse])
async def get_street_feed(
    street_id: Optional[str] = None,
    locality_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Community Street Feed: Allows residents to see all registered complaints on their street/locality and upvote them."""
    query = {}
    target_loc = locality_id or current_user.get("locality_id")
    if target_loc:
        query["locality_id"] = target_loc
    
    if street_id:
        query["street_id"] = street_id
    elif current_user.get("role") == "resident" and current_user.get("street_id"):
        query["street_id"] = current_user.get("street_id")

    cursor = db.complaints.find(query).sort([("upvotes_count", -1), ("created_at", -1)]).limit(100)
    complaints = []
    async for c in cursor:
        d = clean_doc(c)
        d["has_upvoted"] = current_user["id"] in d.get("upvoted_by", [])
        complaints.append(ComplaintResponse(**d))
    return complaints

@router.get("/my", response_model=List[ComplaintResponse])
async def get_my_complaints(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    cursor = db.complaints.find({"resident_id": current_user["id"]}).sort("created_at", -1)
    complaints = []
    async for c in cursor:
        d = clean_doc(c)
        d["has_upvoted"] = current_user["id"] in d.get("upvoted_by", [])
        complaints.append(ComplaintResponse(**d))
    return complaints

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        complaint = await db.complaints.find_one({"id": complaint_id})

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Security check: residents can view complaints in their own locality (enables community corroboration)
    if current_user.get("role") == "resident":
        user_loc = current_user.get("locality_id")
        comp_loc = complaint.get("locality_id")
        if user_loc and comp_loc and user_loc != comp_loc:
            raise HTTPException(status_code=403, detail="Unauthorized to view complaints from other localities")

    # Security check: street heads can only see complaints from their assigned street
    if current_user.get("role") == "street_head":
        head_street_id = current_user.get("street_id")
        if head_street_id and str(complaint.get("street_id")) != head_street_id:
            raise HTTPException(status_code=403, detail="Unauthorized to access complaints from other streets")

    doc = clean_doc(complaint)
    doc["has_upvoted"] = current_user["id"] in doc.get("upvoted_by", [])
    return ComplaintResponse(**doc)

@router.post("/{complaint_id}/vote", response_model=ComplaintResponse)
async def vote_complaint(
    complaint_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Resident upvotes or withdraws upvote for a street complaint ('Problem to all residents').
    Recalculates complaint priority and SLA deadlines automatically based on community voting!"""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        complaint = await db.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    user_id = current_user["id"]
    upvoted_by = list(complaint.get("upvoted_by", []))
    already_voted = user_id in upvoted_by

    now = datetime.now(timezone.utc)
    if already_voted:
        upvoted_by = [u for u in upvoted_by if u != user_id]
        new_count = max(0, len(upvoted_by))
        action_note = f"Resident {current_user.get('name')} withdrew upvote. Total community votes: {new_count}."
    else:
        upvoted_by.append(user_id)
        new_count = len(upvoted_by)
        action_note = f"Resident {current_user.get('name')} upvoted this complaint as affecting them ('Problem to all residents'). Total community votes: {new_count}."

    # Re-evaluate priority with new vote count
    reassessment = await orchestrator.classification_agent.assess(
        title=complaint.get("title", ""),
        description=complaint.get("description", ""),
        category_hint=complaint.get("category"),
        voice_transcript=complaint.get("voice_transcript"),
        image_urls=complaint.get("image_urls", []),
        image_scan_result=complaint.get("image_scan_result"),
        upvotes_count=new_count
    )

    old_priority = complaint.get("priority", "P3")
    new_priority = reassessment.priority
    priority_order = {"P4": 1, "P3": 2, "P2": 3, "P1": 4}
    priority_elevated = priority_order.get(new_priority, 2) > priority_order.get(old_priority, 2)

    update_fields = {
        "upvotes_count": new_count,
        "upvoted_by": upvoted_by,
        "severity_score": reassessment.severity_score,
        "impact_scope": reassessment.impact_scope,
        "updated_at": now
    }

    if priority_elevated:
        from app.config import settings
        from datetime import timedelta
        update_fields["priority"] = new_priority
        ack_mins = settings.SLA_ACK_MINUTES.get(new_priority, 120)
        res_hours = settings.SLA_RESOLVE_HOURS.get(new_priority, 24)
        update_fields["acknowledgement_deadline"] = now + timedelta(minutes=ack_mins)
        update_fields["resolution_deadline"] = now + timedelta(hours=res_hours)

    try:
        await db.complaints.update_one({"_id": complaint["_id"]}, {"$set": update_fields})
    except Exception:
        await db.complaints.update_one({"id": complaint_id}, {"$set": update_fields})

    # Record history
    await record_complaint_history(
        complaint_id=complaint_id,
        action="community_vote",
        performed_by_id=user_id,
        performed_by_name=current_user.get("name"),
        performed_by_role=current_user.get("role"),
        details=action_note + (f" Priority escalated to {new_priority}!" if priority_elevated else "")
    )

    # Notify street head if priority was elevated
    if priority_elevated and complaint.get("assigned_street_head_id"):
        await create_notification(
            user_id=str(complaint["assigned_street_head_id"]),
            title=f"PRIORITY ESCALATED: {complaint.get('complaint_code')} on {complaint.get('street_name')}",
            message=f"Community voting reached {new_count} affected residents. Escalated from {old_priority} to {new_priority}.",
            notification_type="alert",
            complaint_id=complaint_id
        )

    # If escalated to P1, alert central head
    if priority_elevated and new_priority == "P1":
        await notify_users_by_role(
            role="central_head",
            title=f"CRITICAL COMMUNITY ALERT: {complaint.get('complaint_code')}",
            message=f"Escalated to P1 Critical via community consensus ({new_count} votes) on {complaint.get('street_name')}.",
            notification_type="escalation",
            complaint_id=complaint_id,
            locality_id=complaint.get("locality_id")
        )

    complaint.update(update_fields)
    doc = clean_doc(complaint)
    doc["has_upvoted"] = (not already_voted)
    return ComplaintResponse(**doc)

@router.get("/{complaint_id}/history")
async def get_history(
    complaint_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    history = await get_complaint_history(complaint_id)
    return history

@router.post("/{complaint_id}/acknowledge", response_model=ComplaintResponse)
async def acknowledge_complaint(
    complaint_id: str,
    current_user: dict = Depends(require_street_head),
    db = Depends(get_database)
):
    """Street Head acknowledges complaint receipt, stopping unacknowledged SLA timer."""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        complaint = await db.complaints.find_one({"id": complaint_id})
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.now(timezone.utc)
    update_data = {
        "status": ComplaintStatus.ACKNOWLEDGED,
        "acknowledged_at": now,
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
        action="acknowledged",
        performed_by_id=current_user["id"],
        performed_by_name=current_user.get("name"),
        performed_by_role=current_user.get("role"),
        details=f"Complaint acknowledged by Street Head {current_user.get('name')}."
    )

    # Notify Resident
    await create_notification(
        user_id=str(complaint["resident_id"]),
        title=f"Complaint Acknowledged: {complaint.get('complaint_code')}",
        message=f"Street Head {current_user.get('name')} has acknowledged your complaint and is arranging maintenance.",
        notification_type="complaint_status",
        complaint_id=complaint_id
    )

    return ComplaintResponse(**clean_doc(complaint))

@router.post("/{complaint_id}/assign-worker", response_model=ComplaintResponse)
async def assign_worker(
    complaint_id: str,
    payload: WorkerAssignmentRequest,
    current_user: dict = Depends(require_street_head),
    db = Depends(get_database)
):
    """Street Head assigns maintenance worker to address the issue."""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        complaint = await db.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Fetch worker
    try:
        worker = await db.maintenance_workers.find_one({"_id": ObjectId(payload.worker_id)})
    except Exception:
        worker = await db.maintenance_workers.find_one({"id": payload.worker_id})
    if not worker:
        raise HTTPException(status_code=400, detail="Specified worker not found")

    now = datetime.now(timezone.utc)
    update_data = {
        "status": ComplaintStatus.WORKER_ASSIGNED,
        "assigned_worker_id": str(worker.get("_id", worker.get("id"))),
        "worker_name": worker.get("name"),
        "worker_department": worker.get("department"),
        "assigned_at": now,
        "updated_at": now
    }

    try:
        await db.complaints.update_one({"_id": complaint["_id"]}, {"$set": update_data})
        await db.maintenance_workers.update_one(
            {"_id": worker["_id"]},
            {"$inc": {"active_tasks_count": 1}, "$set": {"status": "busy"}}
        )
    except Exception:
        await db.complaints.update_one({"id": complaint_id}, {"$set": update_data})

    # Record assignment record
    await db.assignments.insert_one({
        "complaint_id": complaint_id,
        "worker_id": str(worker.get("_id", worker.get("id"))),
        "worker_name": worker.get("name"),
        "worker_phone": worker.get("phone"),
        "street_head_id": current_user["id"],
        "instructions": payload.instructions,
        "status": "assigned",
        "assigned_at": now
    })

    complaint.update(update_data)

    # Audit Trail
    await record_complaint_history(
        complaint_id=complaint_id,
        action="worker_assigned",
        performed_by_id=current_user["id"],
        performed_by_name=current_user.get("name"),
        performed_by_role=current_user.get("role"),
        details=f"Assigned to {worker.get('name')} ({worker.get('department')}). Instructions: {payload.instructions or 'None'}"
    )

    # Notify Resident
    await create_notification(
        user_id=str(complaint["resident_id"]),
        title=f"Worker Assigned: {complaint.get('complaint_code')}",
        message=f"Maintenance worker {worker.get('name')} from {worker.get('department')} has been deployed.",
        notification_type="complaint_status",
        complaint_id=complaint_id
    )

    return ComplaintResponse(**clean_doc(complaint))

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(
    complaint_id: str,
    status_update: dict,
    current_user: dict = Depends(require_street_head),
    db = Depends(get_database)
):
    """Street Head updates status (e.g. in_progress, resolved with evidence)."""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        complaint = await db.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    new_status = status_update.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Missing 'status' field")

    now = datetime.now(timezone.utc)
    set_fields = {"status": new_status, "updated_at": now}

    if new_status == ComplaintStatus.RESOLVED:
        set_fields["resolved_at"] = now
        set_fields["resolution_notes"] = status_update.get("resolution_notes", "Repairs completed on site.")
        set_fields["resolution_image_urls"] = status_update.get("resolution_image_urls", [])

        # Release worker workload if assigned
        if complaint.get("assigned_worker_id"):
            try:
                await db.maintenance_workers.update_one(
                    {"_id": ObjectId(complaint["assigned_worker_id"])},
                    {"$inc": {"active_tasks_count": -1}, "$set": {"status": "available"}}
                )
            except Exception:
                pass

        # Trigger Resolution Verification Agent
        verification = await orchestrator.verify_resolution(
            complaint=clean_doc(complaint),
            resolution_notes=set_fields["resolution_notes"],
            resolution_image_urls=set_fields["resolution_image_urls"]
        )

        # Notify Resident for confirmation
        await create_notification(
            user_id=str(complaint["resident_id"]),
            title=f"Work Done: Confirm Resolution of {complaint.get('complaint_code')}",
            message=verification.resident_notification_message,
            notification_type="verification",
            complaint_id=complaint_id
        )

    try:
        await db.complaints.update_one({"_id": complaint["_id"]}, {"$set": set_fields})
    except Exception:
        await db.complaints.update_one({"id": complaint_id}, {"$set": set_fields})

    complaint.update(set_fields)

    # Audit Trail
    await record_complaint_history(
        complaint_id=complaint_id,
        action=f"status_updated_to_{new_status}",
        performed_by_id=current_user["id"],
        performed_by_name=current_user.get("name"),
        performed_by_role=current_user.get("role"),
        details=f"Status transitioned to '{new_status}'. Notes: {status_update.get('resolution_notes', 'N/A')}"
    )

    return ComplaintResponse(**clean_doc(complaint))

@router.post("/{complaint_id}/feedback")
async def submit_feedback(
    complaint_id: str,
    feedback: FeedbackRequest,
    current_user: dict = Depends(require_resident),
    db = Depends(get_database)
):
    """Resident confirms resolution and submits feedback score."""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        complaint = await db.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if str(complaint.get("resident_id")) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only reporting resident can submit resolution feedback")

    now = datetime.now(timezone.utc)
    feedback_doc = {
        "complaint_id": complaint_id,
        "resident_id": current_user["id"],
        "rating": feedback.rating,
        "comment": feedback.comment,
        "is_satisfied": feedback.is_satisfied,
        "created_at": now
    }
    await db.feedback.insert_one(feedback_doc)

    # If satisfied, mark complaint as verified/closed
    if feedback.is_satisfied:
        update_data = {
            "status": ComplaintStatus.VERIFIED,
            "verified_at": now,
            "updated_at": now
        }
        try:
            await db.complaints.update_one({"_id": complaint["_id"]}, {"$set": update_data})
        except Exception:
            await db.complaints.update_one({"id": complaint_id}, {"$set": update_data})

        await record_complaint_history(
            complaint_id=complaint_id,
            action="verified_closed",
            performed_by_id=current_user["id"],
            performed_by_name=current_user.get("name"),
            performed_by_role=current_user.get("role"),
            details=f"Resident confirmed resolution with rating {feedback.rating}/5. Complaint verified and officially closed."
        )

    return {"message": "Feedback submitted successfully.", "verified": feedback.is_satisfied}

@router.post("/{complaint_id}/reopen", response_model=ComplaintResponse)
async def reopen_complaint(
    complaint_id: str,
    reopen_data: ReopenRequest,
    current_user: dict = Depends(require_resident),
    db = Depends(get_database)
):
    """Resident reopens complaint if issue persists or repair was inadequate."""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        complaint = await db.complaints.find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if str(complaint.get("resident_id")) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only reporting resident can reopen this complaint")

    reopen_plan = await orchestrator.verification_agent.handle_resident_reopen(
        complaint=clean_doc(complaint),
        reopen_reason=reopen_data.reason
    )

    now = datetime.now(timezone.utc)
    update_data = {
        "status": ComplaintStatus.REOPENED,
        "reopened_count": reopen_plan["reopened_count"],
        "priority": reopen_plan["new_priority"],
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
        action="reopened",
        performed_by_id=current_user["id"],
        performed_by_name=current_user.get("name"),
        performed_by_role=current_user.get("role"),
        details=reopen_plan["log"]
    )

    # Notify Street Head
    if complaint.get("assigned_street_head_id"):
        await create_notification(
            user_id=str(complaint["assigned_street_head_id"]),
            title=f"REOPENED: {complaint.get('complaint_code')}",
            message=f"Resident reported repair inadequate: '{reopen_data.reason}'. Priority elevated to {reopen_plan['new_priority']}.",
            notification_type="alert",
            complaint_id=complaint_id
        )

    # If reopened multiple times, alert Central Head
    if reopen_plan.get("escalate_immediately"):
        await notify_users_by_role(
            role="central_head",
            title=f"REPEATED REOPENING ESCALATION: {complaint.get('complaint_code')}",
            message=f"Complaint has been reopened {reopen_plan['reopened_count']} times on {complaint.get('street_name')}. Investigation recommended.",
            notification_type="escalation",
            complaint_id=complaint_id,
            locality_id=complaint.get("locality_id")
        )

    return ComplaintResponse(**clean_doc(complaint))
