import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.DATABASE_NAME]
    logger.info(f"Connected to MongoDB database: {settings.DATABASE_NAME}")

    # Ensure indexes
    try:
        await db.db.users.create_index("email", unique=True)
        await db.db.users.create_index("role")
        await db.db.complaints.create_index([("locality_id", 1), ("street_id", 1), ("status", 1)])
        await db.db.complaints.create_index("priority")
        await db.db.complaints.create_index("created_at")
        await db.db.complaints.create_index("resident_id")
        await db.db.complaints.create_index("assigned_street_head_id")
        await db.db.notifications.create_index([("user_id", 1), ("is_read", 1)])
        await db.db.escalation_records.create_index("complaint_id")
        await db.db.streets.create_index([("locality_id", 1), ("name", 1)])
        logger.info("MongoDB indexes verified.")
    except Exception as e:
        logger.warning(f"Error creating indexes: {e}")

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db.client:
        db.client.close()
    logger.info("MongoDB connection closed.")

def get_database():
    return db.db
