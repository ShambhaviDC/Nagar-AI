from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserRole:
    RESIDENT = "resident"
    STREET_HEAD = "street_head"
    CENTRAL_HEAD = "central_head"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = UserRole.RESIDENT
    phone: Optional[str] = None
    locality_id: Optional[str] = None
    street_id: Optional[str] = None
    street_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
