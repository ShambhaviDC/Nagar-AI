from fastapi import APIRouter, Depends, Body
from app.agents.orchestrator import orchestrator
from app.database import get_database
from typing import Dict, Any, Optional

router = APIRouter(prefix="/ai", tags=["AI Agent Intelligence"])

@router.post("/analyze-complaint")
async def analyze_complaint(
    payload: Dict[str, Any] = Body(..., example={"text": "Sparking transformer near Park Avenue", "voice_transcript": None, "image_urls": []})
):
    """Runs Complaint Understanding Agent on raw resident input including speech and photos."""
    text = payload.get("text", "")
    transcript = payload.get("voice_transcript")
    image_urls = payload.get("image_urls", [])
    result = await orchestrator.understanding_agent.understand(text=text, voice_transcript=transcript, image_urls=image_urls)
    return result.model_dump()

@router.post("/classify-complaint")
async def classify_complaint(
    payload: Dict[str, Any] = Body(..., example={"title": "Broken water main", "description": "Gallons of clean water leaking onto the street"})
):
    """Runs Classification and Priority Agent."""
    title = payload.get("title", "")
    desc = payload.get("description", "")
    hint = payload.get("category_hint")
    transcript = payload.get("voice_transcript")
    image_urls = payload.get("image_urls", [])
    scan_result = payload.get("image_scan_result")
    upvotes = payload.get("upvotes_count", 0)
    result = await orchestrator.classification_agent.assess(
        title=title,
        description=desc,
        category_hint=hint,
        voice_transcript=transcript,
        image_urls=image_urls,
        image_scan_result=scan_result,
        upvotes_count=upvotes
    )
    return result.model_dump()

@router.post("/detect-duplicates")
async def detect_duplicates(
    payload: Dict[str, Any] = Body(...),
    db = Depends(get_database)
):
    """Detects semantically similar complaints on the same street."""
    street_id = payload.get("street_id")
    cursor = db.complaints.find({"street_id": street_id, "status": {"$ne": "resolved"}}).limit(20)
    recent = []
    async for c in cursor:
        c["id"] = str(c["_id"])
        del c["_id"]
        recent.append(c)

    new_comp = {
        "title": payload.get("title", ""),
        "description": payload.get("description", ""),
        "category": payload.get("category", ""),
        "street_id": street_id
    }
    result = await orchestrator.duplicate_agent.detect_duplicates(new_complaint=new_comp, recent_complaints=recent)
    return result.model_dump()

@router.post("/generate-insights")
async def generate_insights(db = Depends(get_database)):
    """Runs Locality Analytics Agent on live MongoDB records."""
    locality = await db.localities.find_one({})
    if not locality:
        return {"error": "No locality data found"}
    loc_id = str(locality["_id"])
    locality["id"] = loc_id
    del locality["_id"]

    streets = []
    async for s in db.streets.find({"locality_id": loc_id}):
        s["id"] = str(s["_id"])
        del s["_id"]
        streets.append(s)

    complaints = []
    async for c in db.complaints.find({"locality_id": loc_id}):
        c["id"] = str(c["_id"])
        del c["_id"]
        complaints.append(c)

    report = await orchestrator.generate_locality_insights(locality=locality, streets=streets, complaints=complaints)
    return report.model_dump()
