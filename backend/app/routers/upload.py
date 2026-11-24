import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import settings

router = APIRouter(prefix="/upload", tags=["Uploads"])

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """Upload photos or recorded voice complaints."""
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".mp3", ".wav", ".webm", ".ogg", ".m4a"}
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported: {', '.join(allowed_extensions)}"
        )

    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    file_url = f"/uploads/{unique_name}"
    return {
        "url": file_url,
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(content)
    }
