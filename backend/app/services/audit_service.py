from datetime import datetime, timezone
from bson import ObjectId
from app.database import get_database

async def record_complaint_history(
    complaint_id: str,
    action: str,
    performed_by_id: str,
    performed_by_name: str,
    performed_by_role: str,
    details: str,
    metadata: dict = None
):
    """Record an audit trail event for a complaint."""
    db = get_database()
    history_entry = {
        "complaint_id": str(complaint_id),
        "action": action,
        "performed_by_id": str(performed_by_id) if performed_by_id else "system",
        "performed_by_name": performed_by_name or "System AI / Automation",
        "performed_by_role": performed_by_role or "system",
        "details": details,
        "metadata": metadata or {},
        "timestamp": datetime.now(timezone.utc)
    }
    result = await db.complaint_history.insert_one(history_entry)
    return str(result.inserted_id)

async def get_complaint_history(complaint_id: str):
    """Retrieve chronologically ordered audit logs for a complaint."""
    db = get_database()
    cursor = db.complaint_history.find({"complaint_id": str(complaint_id)}).sort("timestamp", 1)
    history = []
    async for entry in cursor:
        entry["id"] = str(entry["_id"])
        del entry["_id"]
        history.append(entry)
    return history
