from datetime import datetime, timezone
from bson import ObjectId
from app.database import get_database
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

async def create_notification(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "complaint_status",
    complaint_id: Optional[str] = None
) -> str:
    """Create in-app notification for a user and trigger real-time updates."""
    db = get_database()
    notif_doc = {
        "user_id": str(user_id),
        "title": title,
        "message": message,
        "type": notification_type,
        "complaint_id": str(complaint_id) if complaint_id else None,
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.notifications.insert_one(notif_doc)
    logger.info(f"Notification created for user {user_id}: {title}")
    return str(result.inserted_id)

async def notify_users_by_role(
    role: str,
    title: str,
    message: str,
    notification_type: str = "escalation",
    complaint_id: Optional[str] = None,
    locality_id: Optional[str] = None
):
    """Notify all users of a specific role in a locality (e.g. Central Head)."""
    db = get_database()
    query = {"role": role}
    if locality_id:
        query["locality_id"] = locality_id
    
    cursor = db.users.find(query)
    async for user in cursor:
        await create_notification(
            user_id=str(user["_id"]),
            title=title,
            message=message,
            notification_type=notification_type,
            complaint_id=complaint_id
        )

async def get_user_notifications(user_id: str, limit: int = 50) -> List[dict]:
    db = get_database()
    cursor = db.notifications.find({"user_id": str(user_id)}).sort("created_at", -1).limit(limit)
    notifications = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        notifications.append(doc)
    return notifications

async def mark_notification_read(notification_id: str, user_id: str) -> bool:
    db = get_database()
    try:
        query = {"_id": ObjectId(notification_id), "user_id": str(user_id)}
    except Exception:
        query = {"id": notification_id, "user_id": str(user_id)}
    
    result = await db.notifications.update_one(query, {"$set": {"is_read": True}})
    return result.modified_count > 0

async def mark_all_notifications_read(user_id: str) -> int:
    db = get_database()
    result = await db.notifications.update_many(
        {"user_id": str(user_id), "is_read": False},
        {"$set": {"is_read": True}}
    )
    return result.modified_count
