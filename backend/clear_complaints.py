import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clear_all_complaints():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    db = client["nagarai_db"]

    res_c = await db.complaints.delete_many({})
    res_h = await db.complaint_history.delete_many({})
    res_e = await db.escalation_records.delete_many({})
    res_n = await db.notifications.delete_many({})
    res_f = await db.feedback.delete_many({})
    res_a = await db.assignments.delete_many({})

    # Reset worker counters
    await db.maintenance_workers.update_many(
        {},
        {"$set": {"status": "available", "active_tasks_count": 0}}
    )

    print("SUCCESS: Cleared all demo complaints, histories, and escalations!")
    print(f"Deleted complaints: {res_c.deleted_count}")
    print(f"Deleted history logs: {res_h.deleted_count}")
    print(f"Deleted escalation records: {res_e.deleted_count}")
    print(f"Deleted notifications: {res_n.deleted_count}")
    print("Reset worker active tasks count to 0.")

    client.close()

if __name__ == "__main__":
    asyncio.run(clear_all_complaints())
