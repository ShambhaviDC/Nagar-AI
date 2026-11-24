from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timezone
import logging
from app.database import get_database
from app.agents.orchestrator import orchestrator
from app.services.audit_service import record_complaint_history
from app.services.notification_service import create_notification, notify_users_by_role

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def run_surveillance_and_escalations():
    """Background monitoring job executing task-based AI agent monitoring and escalation."""
    db = get_database()
    if db is None:
        return

    try:
        # 1. Fetch active unresolved complaints
        cursor = db.complaints.find({
            "status": {"$nin": ["resolved", "verified"]}
        })
        active_complaints = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            active_complaints.append(doc)

        if not active_complaints:
            return

        # 2. Fetch existing active escalations
        esc_cursor = db.escalation_records.find({"status": "active"})
        existing_escalations = [e async for e in esc_cursor]

        # 3. Execute AI Orchestrator Monitoring Cycle (Agent 5 & Agent 6)
        results = await orchestrator.run_monitoring_cycle(
            active_complaints=active_complaints,
            existing_escalations=existing_escalations
        )

        esc_summary = results.get("escalation_summary", {})
        actions = esc_summary.get("actions_taken", [])

        now = datetime.now(timezone.utc)

        for action in actions:
            cid = action.get("complaint_id")
            code = action.get("complaint_code")
            act_type = action.get("action_type")
            esc_level = action.get("escalation_level", 1)
            role = action.get("target_role")
            target_uid = action.get("target_user_id")
            title = action.get("notification_title")
            msg = action.get("notification_message")
            reason = action.get("reason")

            if act_type == "send_reminder":
                if target_uid:
                    await create_notification(
                        user_id=target_uid,
                        title=title,
                        message=msg,
                        notification_type="reminder",
                        complaint_id=cid
                    )
                await record_complaint_history(
                    complaint_id=cid,
                    action="reminder_issued",
                    performed_by_id="system_agent",
                    performed_by_name="Accountability & Escalation Agent",
                    performed_by_role="ai_agent",
                    details=f"Issued automated reminder to Street Head: {reason}"
                )

            elif act_type == "escalate_to_central":
                # Find matching complaint to get street and locality info
                comp_match = next((c for c in active_complaints if c["id"] == cid), {})
                
                # Check if already recorded
                existing = await db.escalation_records.find_one({
                    "complaint_id": cid,
                    "status": "active"
                })
                
                if not existing:
                    esc_record = {
                        "complaint_id": cid,
                        "street_id": comp_match.get("street_id"),
                        "street_name": comp_match.get("street_name", "Local Street"),
                        "assigned_street_head_id": comp_match.get("assigned_street_head_id"),
                        "street_head_name": comp_match.get("assigned_street_head_name"),
                        "reason": reason,
                        "escalation_level": esc_level,
                        "escalated_to_role": "central_head",
                        "status": "active",
                        "intervention_notes": None,
                        "intervened_by_id": None,
                        "created_at": now,
                        "resolved_at": None
                    }
                    await db.escalation_records.insert_one(esc_record)

                # Update complaint escalation level
                try:
                    from bson import ObjectId
                    await db.complaints.update_one(
                        {"_id": ObjectId(cid)},
                        {"$set": {"escalation_level": esc_level, "status": "escalated"}}
                    )
                except Exception:
                    await db.complaints.update_one(
                        {"id": cid},
                        {"$set": {"escalation_level": esc_level, "status": "escalated"}}
                    )

                # Notify Central Head
                await notify_users_by_role(
                    role="central_head",
                    title=title,
                    message=msg,
                    notification_type="escalation",
                    complaint_id=cid,
                    locality_id=comp_match.get("locality_id")
                )

                await record_complaint_history(
                    complaint_id=cid,
                    action="complaint_escalated",
                    performed_by_id="system_agent",
                    performed_by_name="Accountability & Escalation Agent",
                    performed_by_role="ai_agent",
                    details=f"Escalated to Central Administration (Level {esc_level}). Reason: {reason}"
                )

        if actions:
            logger.info(f"Surveillance cycle completed: {len(actions)} actions taken.")

    except Exception as e:
        logger.error(f"Error during surveillance and escalation cycle: {e}")

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            run_surveillance_and_escalations,
            "interval",
            seconds=60,
            id="sla_surveillance_job",
            replace_existing=True
        )
        scheduler.start()
        logger.info("APScheduler SLA surveillance service started.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped.")
