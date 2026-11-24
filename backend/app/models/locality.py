from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class LocalityBase(BaseModel):
    name: str
    city: str
    state: str
    pincode: str
    description: Optional[str] = None
    center_lat: float
    center_lng: float
    boundary: Optional[Dict[str, Any]] = None

class LocalityCreate(LocalityBase):
    pass

class LocalityResponse(LocalityBase):
    id: str
    created_at: datetime
    street_count: Optional[int] = 0
    total_complaints: Optional[int] = 0

class StreetBase(BaseModel):
    name: str
    code: str
    locality_id: str
    assigned_street_head_id: Optional[str] = None
    street_head_name: Optional[str] = None
    center_lat: float
    center_lng: float
    landmarks: Optional[List[str]] = []

class StreetCreate(StreetBase):
    pass

class StreetResponse(StreetBase):
    id: str
    created_at: datetime
    active_complaints: Optional[int] = 0
    resolved_complaints: Optional[int] = 0
