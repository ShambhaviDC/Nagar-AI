from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.database import get_database
from app.auth.dependencies import get_current_user
from app.services.notification_service import (
    get_user_notifications, mark_notification_read, mark_all_notifications_read
)
from typing import List

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
async def get_my_notifications(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    notifications = await get_user_notifications(user_id=current_user["id"], limit=limit)
    return notifications

@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    success = await mark_notification_read(notification_id=notification_id, user_id=current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@router.post("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    count = await mark_all_notifications_read(user_id=current_user["id"])
    return {"message": f"Marked {count} notifications as read"}
