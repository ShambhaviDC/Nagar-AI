from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime, timezone
from app.database import get_database
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserRole
from app.auth.security import get_password_hash, verify_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserCreate, db = Depends(get_database)):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_in.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Resolve street and locality
    street_id = user_in.street_id
    street_name = None
    locality_id = user_in.locality_id
    if street_id:
        try:
            st = await db.streets.find_one({"_id": ObjectId(street_id)})
        except Exception:
            st = await db.streets.find_one({"$or": [{"id": street_id}, {"code": street_id}, {"name": street_id}]})
        if st:
            street_id = str(st["_id"])
            street_name = st.get("name")
            if not locality_id and st.get("locality_id"):
                locality_id = st.get("locality_id")

    if not street_id:
        first_street = await db.streets.find_one({})
        if first_street:
            street_id = str(first_street["_id"])
            street_name = first_street.get("name")
            if not locality_id:
                locality_id = first_street.get("locality_id")

    # Hash password
    hashed_pwd = get_password_hash(user_in.password)
    now = datetime.now(timezone.utc)
    
    user_doc = {
        "name": user_in.name,
        "email": user_in.email.lower(),
        "password_hash": hashed_pwd,
        "role": user_in.role or UserRole.RESIDENT,
        "phone": user_in.phone,
        "locality_id": locality_id,
        "street_id": street_id,
        "street_name": street_name,
        "avatar_url": user_in.avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={user_in.name}",
        "created_at": now
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    del user_doc["password_hash"]
    del user_doc["_id"]

    token = create_access_token({"sub": user_doc["id"], "role": user_doc["role"], "email": user_doc["email"]})
    return TokenResponse(access_token=token, token_type="bearer", user=UserResponse(**user_doc))

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db = Depends(get_database)):
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "role": user.get("role"), "email": user.get("email")})
    
    user["id"] = user_id
    del user["_id"]
    if "password_hash" in user:
        del user["password_hash"]
        
    return TokenResponse(access_token=token, token_type="bearer", user=UserResponse(**user))

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user_data = dict(current_user)
    if "_id" in user_data:
        del user_data["_id"]
    if "password_hash" in user_data:
        del user_data["password_hash"]
    return UserResponse(**user_data)

@router.get("/demo-users")
async def list_demo_users(db = Depends(get_database)):
    """List available demo accounts for easy role switching in frontend."""
    users = []
    cursor = db.users.find({}, {"password_hash": 0}).limit(35)
    async for u in cursor:
        u["id"] = str(u["_id"])
        del u["_id"]
        if u.get("street_id") and not u.get("street_name"):
            try:
                st = await db.streets.find_one({"_id": ObjectId(u["street_id"])})
                if st:
                    u["street_name"] = st.get("name")
            except Exception:
                pass
        users.append(u)
    return users

@router.post("/demo-switch/{user_id}", response_model=TokenResponse)
async def demo_switch(user_id: str, db = Depends(get_database)):
    """Allows instant 1-click token generation for demo accounts."""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await db.users.find_one({"id": user_id})
        
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found")
        
    token = create_access_token({"sub": str(user["_id"]), "role": user.get("role"), "email": user.get("email")})
    user["id"] = str(user["_id"])
    del user["_id"]
    if "password_hash" in user:
        del user["password_hash"]
    return TokenResponse(access_token=token, token_type="bearer", user=UserResponse(**user))
