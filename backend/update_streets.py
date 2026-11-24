import asyncio
import os
import sys
from datetime import datetime, timezone
from bson import ObjectId

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.auth.security import get_password_hash

async def update_streets_and_heads():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    locality = await db.localities.find_one({})
    if not locality:
        print("No locality found, creating Greenfield Locality...")
        loc_id = str(ObjectId())
        await db.localities.insert_one({
            "_id": ObjectId(loc_id),
            "name": "Greenfield Locality",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560034",
            "description": "Model urban locality for smart civic infrastructure monitoring.",
            "center_lat": 12.9352,
            "center_lng": 77.6245,
            "created_at": datetime.now(timezone.utc)
        })
    else:
        loc_id = str(locality["_id"])

    # Common Indian street names
    common_streets = [
        {
            "code": "MGR-01",
            "name": "MG Road (Mahatma Gandhi Road)",
            "lat": 12.9358,
            "lng": 77.6235,
            "landmarks": ["Near Metro Station Gate 2", "Opposite Central Bank", "Trinity Junction"],
            "head_name": "Vikram Sethi - MG Road Head",
            "head_email": "head.mgroad@nagarai.gov.in",
            "head_aliases": ["head.gulmohar@nagarai.gov.in"],
            "phone": "+91 98450 22001"
        },
        {
            "code": "BRG-02",
            "name": "Brigade Road",
            "lat": 12.9365,
            "lng": 77.6248,
            "landmarks": ["Near Rex Plaza", "Shoppers Stop Corner", "Traffic Signal #4"],
            "head_name": "Ananya Iyer - Brigade Road Head",
            "head_email": "head.brigade@nagarai.gov.in",
            "head_aliases": ["head.neelgiri@nagarai.gov.in"],
            "phone": "+91 98450 22002"
        },
        {
            "code": "NHR-03",
            "name": "Nehru Marg",
            "lat": 12.9348,
            "lng": 77.6256,
            "landmarks": ["Near Government Higher School", "Children's Park Chauraha", "Nehru Statue"],
            "head_name": "Suresh Kulkarni - Nehru Marg Head",
            "head_email": "head.nehru@nagarai.gov.in",
            "head_aliases": ["head.peepal@nagarai.gov.in"],
            "phone": "+91 98450 22003"
        },
        {
            "code": "STN-04",
            "name": "Station Road",
            "lat": 12.9339,
            "lng": 77.6240,
            "landmarks": ["Near Railway Overbridge", "Auto Stand #1", "Civic Water Tank"],
            "head_name": "Pooja Hegde - Station Road Head",
            "head_email": "head.station@nagarai.gov.in",
            "head_aliases": ["head.banyan@nagarai.gov.in"],
            "phone": "+91 98450 22004"
        },
        {
            "code": "MKT-05",
            "name": "Market Street",
            "lat": 12.9344,
            "lng": 77.6228,
            "landmarks": ["Near Locality Sabzi Mandi", "Cooperative Milk Booth", "Community Hall"],
            "head_name": "Mohammed Farooq - Market Street Head",
            "head_email": "head.market@nagarai.gov.in",
            "head_aliases": ["head.amaltas@nagarai.gov.in"],
            "phone": "+91 98450 22005"
        },
        {
            "code": "TMP-06",
            "name": "Temple Road",
            "lat": 12.9360,
            "lng": 77.6260,
            "landmarks": ["Near Shiv Temple Gate", "Banyan Tree Chauraha", "Transformer Yard"],
            "head_name": "Kavitha Reddy - Temple Road Head",
            "head_email": "head.temple@nagarai.gov.in",
            "head_aliases": ["head.ashoka@nagarai.gov.in"],
            "phone": "+91 98450 22006"
        },
        {
            "code": "PRK-07",
            "name": "Park Avenue",
            "lat": 12.9370,
            "lng": 77.6245,
            "landmarks": ["Near Deer Park East Gate", "Joggers Track", "Civic Gym"],
            "head_name": "Ramesh Sharma - Park Avenue Head",
            "head_email": "head.park@nagarai.gov.in",
            "head_aliases": [],
            "phone": "+91 98450 22007"
        },
        {
            "code": "HSP-08",
            "name": "Hospital Road",
            "lat": 12.9330,
            "lng": 77.6250,
            "landmarks": ["Near City Care Hospital", "24/7 Pharmacy Corner", "Ambulance Bay"],
            "head_name": "Dr. Deepa Nair - Hospital Road Head",
            "head_email": "head.hospital@nagarai.gov.in",
            "head_aliases": [],
            "phone": "+91 98450 22008"
        }
    ]

    pwd_hash = get_password_hash("Password@123")

    # Clear old streets and re-insert common streets
    await db.streets.delete_many({})
    # Clear old street heads
    await db.users.delete_many({"role": "street_head"})

    for cs in common_streets:
        s_id = str(ObjectId())
        street_doc = {
            "_id": ObjectId(s_id),
            "name": cs["name"],
            "code": cs["code"],
            "locality_id": loc_id,
            "center_lat": cs["lat"],
            "center_lng": cs["lng"],
            "landmarks": cs["landmarks"],
            "created_at": datetime.now(timezone.utc)
        }
        await db.streets.insert_one(street_doc)

        # Create Street Head User
        head_id = str(ObjectId())
        head_user = {
            "_id": ObjectId(head_id),
            "name": cs["head_name"],
            "email": cs["head_email"],
            "password_hash": pwd_hash,
            "role": "street_head",
            "phone": cs["phone"],
            "locality_id": loc_id,
            "street_id": s_id,
            "street_name": cs["name"],
            "assigned_street_name": cs["name"],
            "avatar_url": f"https://api.dicebear.com/7.x/initials/svg?seed={cs['head_name'].split()[0]}",
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(head_user)

        # Also insert alias email accounts so if user clicks previous credentials, it works seamlessly!
        for alias in cs["head_aliases"]:
            alias_user = dict(head_user)
            alias_user["_id"] = ObjectId()
            alias_user["email"] = alias
            await db.users.insert_one(alias_user)

    print(f"Successfully seeded {len(common_streets)} common Indian streets and corresponding Street Heads with street names in titles!")

if __name__ == "__main__":
    asyncio.run(update_streets_and_heads())
