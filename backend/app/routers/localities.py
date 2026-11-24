from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.database import get_database
from typing import List

router = APIRouter(prefix="", tags=["Localities & Streets"])

@router.get("/localities")
async def get_localities(db = Depends(get_database)):
    localities = []
    cursor = db.localities.find({})
    async for loc in cursor:
        loc["id"] = str(loc["_id"])
        del loc["_id"]
        # Count streets
        loc["street_count"] = await db.streets.count_documents({"locality_id": loc["id"]})
        loc["total_complaints"] = await db.complaints.count_documents({"locality_id": loc["id"]})
        localities.append(loc)
    return localities

@router.get("/localities/{locality_id}")
async def get_locality(locality_id: str, db = Depends(get_database)):
    try:
        loc = await db.localities.find_one({"_id": ObjectId(locality_id)})
    except Exception:
        loc = await db.localities.find_one({"id": locality_id})
    if not loc:
        raise HTTPException(status_code=404, detail="Locality not found")
    loc["id"] = str(loc["_id"])
    del loc["_id"]
    loc["street_count"] = await db.streets.count_documents({"locality_id": loc["id"]})
    loc["total_complaints"] = await db.complaints.count_documents({"locality_id": loc["id"]})
    return loc

@router.get("/localities/{locality_id}/streets")
async def get_locality_streets(locality_id: str, db = Depends(get_database)):
    streets = []
    cursor = db.streets.find({"locality_id": locality_id})
    async for st in cursor:
        st["id"] = str(st["_id"])
        del st["_id"]
        st["active_complaints"] = await db.complaints.count_documents({
            "street_id": st["id"],
            "status": {"$nin": ["resolved", "verified"]}
        })
        st["resolved_complaints"] = await db.complaints.count_documents({
            "street_id": st["id"],
            "status": {"$in": ["resolved", "verified"]}
        })
        streets.append(st)
    return streets

@router.get("/streets")
async def list_all_streets(db = Depends(get_database)):
    streets = []
    cursor = db.streets.find({})
    async for st in cursor:
        st["id"] = str(st["_id"])
        del st["_id"]
        streets.append(st)
    return streets
