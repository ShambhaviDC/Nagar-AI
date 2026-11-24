import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
from bson import ObjectId

# Ensure backend root on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.auth.security import get_password_hash

async def seed_database():
    print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    print("Clearing existing collections in nagarai_db...")
    collections = [
        "users", "localities", "streets", "complaints",
        "maintenance_workers", "assignments", "complaint_history",
        "notifications", "feedback", "escalation_records"
    ]
    for col in collections:
        await db[col].delete_many({})

    print("Seeding Greenfield Locality...")
    loc_id = str(ObjectId())
    locality_doc = {
        "_id": ObjectId(loc_id),
        "name": "Greenfield Locality",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560034",
        "description": "Illustrative model locality consisting of 6 residential and mixed-use streets for smart civic monitoring.",
        "center_lat": 12.9352,
        "center_lng": 77.6245,
        "created_at": datetime.now(timezone.utc)
    }
    await db.localities.insert_one(locality_doc)

    print("Seeding 6 Streets...")
    street_configs = [
        {"name": "Gulmohar Avenue", "code": "GUL-01", "lat": 12.9358, "lng": 77.6235, "landmarks": ["Near Gulmohar Park", "Opposite Community Hall"]},
        {"name": "Neelgiri Marg", "code": "NEL-02", "lat": 12.9365, "lng": 77.6248, "landmarks": ["Near Neelgiri Supermarket", "Metro Feeder Stand"]},
        {"name": "Peepal Marg", "code": "PPL-03", "lat": 12.9348, "lng": 77.6256, "landmarks": ["Old Peepal Tree Chauraha", "Children's Play Arena"]},
        {"name": "Banyan Cross", "code": "BYN-04", "lat": 12.9339, "lng": 77.6240, "landmarks": ["Banyan Enclave Gate 1", "Civic Water Tank"]},
        {"name": "Amaltas Way", "code": "AML-05", "lat": 12.9344, "lng": 77.6228, "landmarks": ["Amaltas Primary Health Sub-Center", "Corner Bakery"]},
        {"name": "Ashoka Lane", "code": "ASH-06", "lat": 12.9360, "lng": 77.6260, "landmarks": ["Ashoka Resident Welfare Office", "Transformer Yard"]}
    ]

    street_ids = []
    for sc in street_configs:
        sid = str(ObjectId())
        doc = {
            "_id": ObjectId(sid),
            "name": sc["name"],
            "code": sc["code"],
            "locality_id": loc_id,
            "center_lat": sc["lat"],
            "center_lng": sc["lng"],
            "landmarks": sc["landmarks"],
            "created_at": datetime.now(timezone.utc)
        }
        await db.streets.insert_one(doc)
        street_ids.append((sid, sc["name"]))

    print("Seeding Users (1 Central Head, 6 Street Heads, 12 Residents)...")
    default_pwd_hash = get_password_hash("Password@123")

    # 1 Central Head
    central_head_id = str(ObjectId())
    central_user = {
        "_id": ObjectId(central_head_id),
        "name": "Dr. Rajeshwar Sharma",
        "email": "central@nagarai.gov.in",
        "password_hash": default_pwd_hash,
        "role": "central_head",
        "phone": "+91 98450 11000",
        "locality_id": loc_id,
        "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=Rajeshwar+Sharma",
        "created_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(central_user)

    # 6 Street Heads
    street_head_info = [
        ("Vikram Sethi", "head.gulmohar@nagarai.gov.in", "+91 98450 22001"),
        ("Ananya Iyer", "head.neelgiri@nagarai.gov.in", "+91 98450 22002"),
        ("Suresh Kulkarni", "head.peepal@nagarai.gov.in", "+91 98450 22003"),
        ("Pooja Hegde", "head.banyan@nagarai.gov.in", "+91 98450 22004"),
        ("Mohammed Farooq", "head.amaltas@nagarai.gov.in", "+91 98450 22005"),
        ("Kavitha Reddy", "head.ashoka@nagarai.gov.in", "+91 98450 22006")
    ]

    street_head_ids = []
    for i, (name, email, phone) in enumerate(street_head_info):
        sid, sname = street_ids[i]
        hid = str(ObjectId())
        sh_doc = {
            "_id": ObjectId(hid),
            "name": name,
            "email": email,
            "password_hash": default_pwd_hash,
            "role": "street_head",
            "phone": phone,
            "locality_id": loc_id,
            "street_id": sid,
            "avatar_url": f"https://api.dicebear.com/7.x/initials/svg?seed={name}",
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(sh_doc)
        street_head_ids.append((hid, name, sid, sname))

        # Update street with head info
        await db.streets.update_one(
            {"_id": ObjectId(sid)},
            {"$set": {"assigned_street_head_id": hid, "street_head_name": name}}
        )

    # 12 Residents (2 per street)
    resident_names = [
        ("Arun Nair", "+91 91234 00001"), ("Deepa Menon", "+91 91234 00002"),
        ("Rohan Gupta", "+91 91234 00003"), ("Sneha Patil", "+91 91234 00004"),
        ("Manoj Tiwari", "+91 91234 00005"), ("Priyanka Das", "+91 91234 00006"),
        ("Karthik Rao", "+91 91234 00007"), ("Lakshmi Narayanan", "+91 91234 00008"),
        ("Sameer Khan", "+91 91234 00009"), ("Farah Sheikh", "+91 91234 00010"),
        ("Venkatesh Prasad", "+91 91234 00011"), ("Meenakshi Sundaram", "+91 91234 00012")
    ]

    resident_ids = []
    for idx, (rname, rphone) in enumerate(resident_names):
        s_idx = idx // 2
        sid, sname = street_ids[s_idx]
        rid = str(ObjectId())
        r_doc = {
            "_id": ObjectId(rid),
            "name": rname,
            "email": f"resident{idx+1}@nagarai.gov.in",
            "password_hash": default_pwd_hash,
            "role": "resident",
            "phone": rphone,
            "locality_id": loc_id,
            "street_id": sid,
            "avatar_url": f"https://api.dicebear.com/7.x/initials/svg?seed={rname}",
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(r_doc)
        resident_ids.append((rid, rname, rphone, sid, sname))

    print("Seeding 6 Maintenance Workers...")
    workers_data = [
        {"name": "Ramesh Verma", "phone": "+91 97400 33001", "department": "Electrical Maintenance", "skills": ["Streetlights", "Cabling", "Substation"]},
        {"name": "Somu Naidu", "phone": "+91 97400 33002", "department": "Sewerage & Drainage", "skills": ["Drain cleaning", "Manhole suction", "Jetting"]},
        {"name": "Santosh Kumar", "phone": "+91 97400 33003", "department": "Water Works & Pipeline", "skills": ["Mainline welding", "Valve fitting", "Booster pumps"]},
        {"name": "Meena Bai", "phone": "+91 97400 33004", "department": "Solid Waste Management", "skills": ["Secondary waste pickup", "Composting", "Segregation"]},
        {"name": "Gurpreet Singh", "phone": "+91 97400 33005", "department": "Civil Works & Paving", "skills": ["Cold mix asphalt", "Curb repair", "Paver block laying"]},
        {"name": "Abdul Basith", "phone": "+91 97400 33006", "department": "Health & Sanitation", "skills": ["Fogging", "Larvicide spraying", "Public hygiene"]}
    ]

    worker_ids = []
    for wd in workers_data:
        wid = str(ObjectId())
        w_doc = {
            "_id": ObjectId(wid),
            "name": wd["name"],
            "phone": wd["phone"],
            "department": wd["department"],
            "skills": wd["skills"],
            "locality_id": loc_id,
            "status": "available",
            "active_tasks_count": 0,
            "created_at": datetime.now(timezone.utc)
        }
        await db.maintenance_workers.insert_one(w_doc)
        worker_ids.append((wid, wd["name"], wd["department"]))

    print("Seeding 30 Sample Complaints across varied categories, priorities, and statuses...")
    now = datetime.now(timezone.utc)

    complaint_templates = [
        # P1 Critical (Life safety hazards)
        {
            "title": "Live electric wire hanging low over footpath",
            "desc": "Heavy branch fell and snapped overhead wire near Gulmohar Park gate. Wire is sparking intermittently and poses severe electrocution risk to pedestrians.",
            "cat": "Electricity", "pri": "P1", "street_idx": 0, "status": "escalated",
            "hours_ago": 3, "ack_overdue": True, "res_overdue": False, "esc_level": 2
        },
        {
            "title": "Open uncovered sewer manhole in dark corner",
            "desc": "Heavy cast iron manhole cover missing on Neelgiri Marg near school crossing. Extremely hazardous in evening hours as streetlights are dim.",
            "cat": "Drainage", "pri": "P1", "street_idx": 1, "status": "worker_assigned",
            "hours_ago": 2, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Gas smell and pipeline subsidence near electrical box",
            "desc": "Ground caved in exposing gas conduit adjacent to street junction transformer box on Banyan Cross.",
            "cat": "Public safety", "pri": "P1", "street_idx": 3, "status": "in_progress",
            "hours_ago": 4, "ack_overdue": False, "res_overdue": False, "esc_level": 1
        },
        # P2 High (Severe disruption)
        {
            "title": "Main water supply pipeline burst flooding street",
            "desc": "Drinking water pipeline fractured opposite Community Hall. Gallons of clean water gushing out and flooding road surface.",
            "cat": "Water supply", "pri": "P2", "street_idx": 0, "status": "acknowledged",
            "hours_ago": 5, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Entire stretch of streetlights dead on Peepal Marg",
            "desc": "Six consecutive luminaire poles blacked out leaving the road pitch dark. Safety hazard for women and senior citizens walking after dusk.",
            "cat": "Streetlights", "pri": "P2", "street_idx": 2, "status": "registered",
            "hours_ago": 4, "ack_overdue": True, "res_overdue": False, "esc_level": 1
        },
        {
            "title": "Sewer overflow flooding residential gates",
            "desc": "Blocked drainage line causing foul sewage to backup and overflow into residential driveways near H.No 42 Amaltas Way.",
            "cat": "Drainage", "pri": "P2", "street_idx": 4, "status": "reopened",
            "hours_ago": 30, "ack_overdue": False, "res_overdue": True, "esc_level": 2, "reopened": 1
        },
        {
            "title": "Deep pothole causing two-wheeler skids",
            "desc": "Large asphalt depression measuring 2 feet across with loose gravel causing bike riders to lose balance at Ashoka Lane junction.",
            "cat": "Road damage", "pri": "P2", "street_idx": 5, "status": "in_progress",
            "hours_ago": 12, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        # P3 Medium (Standard maintenance)
        {
            "title": "Overflowing garbage dump site attracting stray dogs",
            "desc": "Secondary municipal bin not cleared for 3 days on Neelgiri Marg. Refuse spilled over road.",
            "cat": "Garbage collection", "pri": "P3", "street_idx": 1, "status": "resolved",
            "hours_ago": 24, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Streetlight pole #8 blinking continuously",
            "desc": "LED luminaire fixture blinking erratically like a strobe light outside House #15 Gulmohar Avenue.",
            "cat": "Streetlights", "pri": "P3", "street_idx": 0, "status": "verified",
            "hours_ago": 48, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Low water pressure in municipal supply line",
            "desc": "Morning supply pressure is extremely sluggish across Houses 20-30 on Peepal Marg.",
            "cat": "Water supply", "pri": "P3", "street_idx": 2, "status": "registered",
            "hours_ago": 1, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Foul smell and mosquito breeding in stagnant storm drain",
            "desc": "Drain blocked by silt and dry leaves causing stagnant water accumulation on Amaltas Way.",
            "cat": "Sanitation", "pri": "P3", "street_idx": 4, "status": "worker_assigned",
            "hours_ago": 8, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Public tap valve broken leaking continuously",
            "desc": "Brass stopcock valve missing at community water kiosk on Banyan Cross.",
            "cat": "Plumbing", "pri": "P3", "street_idx": 3, "status": "resolved",
            "hours_ago": 36, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Damaged pedestrian speed breaker paver blocks",
            "desc": "Raised table crossing has dislodged interlocking pavers causing thumping noise and vehicle scraping on Ashoka Lane.",
            "cat": "Public infrastructure", "pri": "P3", "street_idx": 5, "status": "acknowledged",
            "hours_ago": 6, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Uncollected commercial packaging waste on pavement",
            "desc": "Cardboard crates and styrofoam discarded on footpath outside shops on Neelgiri Marg.",
            "cat": "Garbage collection", "pri": "P3", "street_idx": 1, "status": "resolved",
            "hours_ago": 20, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Tree roots cracked roadside stormwater gutter",
            "desc": "Gulmohar tree root expansion fractured the concrete drain wall causing localized seepage.",
            "cat": "Public infrastructure", "pri": "P3", "street_idx": 0, "status": "in_progress",
            "hours_ago": 14, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        # P4 Low (Routine)
        {
            "title": "Overgrown hedge obstructing street name sign",
            "desc": "Bougainvillea bushes need trimming as they block view of Banyan Cross street board.",
            "cat": "Other locality-related issues", "pri": "P4", "street_idx": 3, "status": "registered",
            "hours_ago": 10, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Request for anti-larval fogging in back alley",
            "desc": "Seasonal monsoon mosquito activity noticed along back boundary wall of Peepal Marg.",
            "cat": "Sanitation", "pri": "P4", "street_idx": 2, "status": "worker_assigned",
            "hours_ago": 18, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Faded road speed limit markings need repainting",
            "desc": "White thermo-plastic markings near school zone have eroded on Ashoka Lane.",
            "cat": "Road damage", "pri": "P4", "street_idx": 5, "status": "acknowledged",
            "hours_ago": 15, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        # More realistic complaints to reach 30
        {
            "title": "Water meter chamber lid broken on footpath",
            "desc": "Cast lid collapsed when delivery van parked on sidewalk near House #12 Amaltas Way.",
            "cat": "Plumbing", "pri": "P3", "street_idx": 4, "status": "resolved",
            "hours_ago": 50, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Flickering sodium vapor streetlight pole #22",
            "desc": "Yellow streetlight turns on and off every 30 seconds outside Banyan Cross park.",
            "cat": "Streetlights", "pri": "P3", "street_idx": 3, "status": "verified",
            "hours_ago": 60, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Drain silt accumulation after sudden downpour",
            "desc": "Roadside channel choked with dry pine needles and mud on Neelgiri Marg.",
            "cat": "Drainage", "pri": "P2", "street_idx": 1, "status": "resolved",
            "hours_ago": 40, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Exposed distribution box panel door flapping open",
            "desc": "Low-voltage feeder pillar door latch broken, exposed terminals accessible to stray animals on Gulmohar Avenue.",
            "cat": "Electricity", "pri": "P1", "street_idx": 0, "status": "resolved",
            "hours_ago": 16, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Overflowing public dustbin near bus shelter",
            "desc": "Bin full of beverage cups and packaging debris near Peepal Marg shelter.",
            "cat": "Garbage collection", "pri": "P3", "street_idx": 2, "status": "registered",
            "hours_ago": 2, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Sewage inspection chamber overflowing onto road",
            "desc": "Chamber overflowing during morning peak water usage hours on Ashoka Lane.",
            "cat": "Drainage", "pri": "P2", "street_idx": 5, "status": "escalated",
            "hours_ago": 28, "ack_overdue": False, "res_overdue": True, "esc_level": 2
        },
        {
            "title": "Damaged granite kerb stones along walkway",
            "desc": "Three stone kerbs dislodged after municipal cable trenching work on Amaltas Way.",
            "cat": "Public infrastructure", "pri": "P4", "street_idx": 4, "status": "in_progress",
            "hours_ago": 22, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Drinking water turbidity and rust discoloration",
            "desc": "Tap water running brownish tint since morning hours in Banyan Cross Block B.",
            "cat": "Water supply", "pri": "P2", "street_idx": 3, "status": "acknowledged",
            "hours_ago": 7, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Aggressive stray dog pack near primary school gate",
            "desc": "Pack of 5 stray dogs harassing pedestrians and delivery drivers during morning school drop off.",
            "cat": "Public safety", "pri": "P2", "street_idx": 1, "status": "worker_assigned",
            "hours_ago": 9, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Dead animal carcass on roadside median",
            "desc": "Sanitation removal needed immediately for dead cat lying on Neelgiri Marg median.",
            "cat": "Sanitation", "pri": "P1", "street_idx": 1, "status": "resolved",
            "hours_ago": 12, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Asphalt depression near rainwater harvesting pit",
            "desc": "Road surface sagging noticeably near Peepal Marg chauraha rainwater filter pit.",
            "cat": "Road damage", "pri": "P3", "street_idx": 2, "status": "resolved",
            "hours_ago": 72, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        },
        {
            "title": "Request for installing solar street luminaire",
            "desc": "Dim corner adjacent to public park needs additional streetlight pole on Gulmohar Avenue.",
            "cat": "Streetlights", "pri": "P4", "street_idx": 0, "status": "verified",
            "hours_ago": 96, "ack_overdue": False, "res_overdue": False, "esc_level": 0
        }
    ]

    for idx, tmpl in enumerate(complaint_templates):
        s_idx = tmpl["street_idx"]
        sid, sname = street_ids[s_idx]
        hid, hname, _, _ = street_head_ids[s_idx]
        
        # Resident for this street
        r_entry = resident_ids[s_idx * 2 + (idx % 2)]
        rid, rname, rphone, _, _ = r_entry

        c_time = now - timedelta(hours=tmpl["hours_ago"])
        ack_target_mins = 15 if tmpl["pri"] == "P1" else (120 if tmpl["pri"] == "P2" else (720 if tmpl["pri"] == "P3" else 1440))
        res_target_hours = 6 if tmpl["pri"] == "P1" else (24 if tmpl["pri"] == "P2" else (48 if tmpl["pri"] == "P3" else 96))

        ack_deadline = c_time + timedelta(minutes=ack_target_mins)
        res_deadline = c_time + timedelta(hours=res_target_hours)

        w_entry = worker_ids[idx % len(worker_ids)]
        wid, wname, wdept = w_entry

        resolved_at = None
        verified_at = None
        acknowledged_at = None
        assigned_at = None

        if tmpl["status"] in ["acknowledged", "worker_assigned", "in_progress", "resolved", "verified", "reopened", "escalated"]:
            acknowledged_at = c_time + timedelta(minutes=min(ack_target_mins - 5, 20))

        if tmpl["status"] in ["worker_assigned", "in_progress", "resolved", "verified", "reopened"]:
            assigned_at = c_time + timedelta(minutes=45)

        if tmpl["status"] in ["resolved", "verified"]:
            resolved_at = c_time + timedelta(hours=min(tmpl["hours_ago"] - 1, res_target_hours - 2))

        if tmpl["status"] == "verified":
            verified_at = resolved_at + timedelta(hours=2)

        # Slight jitter for coordinates
        sc = street_configs[s_idx]
        lat_offset = ((idx % 7) - 3) * 0.0002
        lng_offset = ((idx % 5) - 2) * 0.0002
        c_lat = round(sc["lat"] + lat_offset, 6)
        c_lng = round(sc["lng"] + lng_offset, 6)

        c_code = f"CMP-2026-{(1000 + idx + 1):04d}"

        complaint_doc = {
            "complaint_code": c_code,
            "title": tmpl["title"],
            "description": tmpl["desc"],
            "category": tmpl["cat"],
            "priority": tmpl["pri"],
            "status": tmpl["status"],
            "locality_id": loc_id,
            "street_id": sid,
            "street_name": sname,
            "landmark": f"Near {sname} landmark #{idx+1}",
            "latitude": c_lat,
            "longitude": c_lng,
            "image_urls": [f"https://picsum.photos/seed/civic{idx}/600/400"],
            "voice_url": None,
            "voice_transcript": f"Audio recorded: {tmpl['title']} on {sname}.",
            "resident_id": rid,
            "resident_name": rname,
            "resident_phone": rphone,
            "assigned_street_head_id": hid,
            "assigned_street_head_name": hname,
            "assigned_worker_id": wid if tmpl["status"] in ["worker_assigned", "in_progress", "resolved", "verified"] else None,
            "worker_name": wname if tmpl["status"] in ["worker_assigned", "in_progress", "resolved", "verified"] else None,
            "worker_department": wdept,
            "resolution_notes": f"Repairs completed on site by {wname}. Inspected and certified." if resolved_at else None,
            "resolution_image_urls": [f"https://picsum.photos/seed/repair{idx}/600/400"] if resolved_at else [],
            "acknowledgement_deadline": ack_deadline,
            "resolution_deadline": res_deadline,
            "acknowledged_at": acknowledged_at,
            "assigned_at": assigned_at,
            "resolved_at": resolved_at,
            "verified_at": verified_at,
            "reopened_count": tmpl.get("reopened", 0),
            "escalation_level": tmpl.get("esc_level", 0),
            "ai_metadata": {
                "understanding": {
                    "identified_issue": tmpl["title"],
                    "affected_asset": tmpl["cat"],
                    "sentiment": "urgent" if tmpl["pri"] in ["P1", "P2"] else "neutral"
                },
                "priority_assessment": {
                    "priority": tmpl["pri"],
                    "justification": f"Auto-assessed based on public safety risk and {tmpl['cat']} impact."
                }
            },
            "created_at": c_time,
            "updated_at": now - timedelta(hours=max(0, tmpl["hours_ago"] - 2))
        }

        res = await db.complaints.insert_one(complaint_doc)
        cid = str(res.inserted_id)

        # Audit History
        await db.complaint_history.insert_one({
            "complaint_id": cid,
            "action": "registered",
            "performed_by_id": rid,
            "performed_by_name": rname,
            "performed_by_role": "resident",
            "details": f"Registered via NagarAI Mobile Portal. Priority assessed as {tmpl['pri']}.",
            "timestamp": c_time
        })

        if acknowledged_at:
            await db.complaint_history.insert_one({
                "complaint_id": cid,
                "action": "acknowledged",
                "performed_by_id": hid,
                "performed_by_name": hname,
                "performed_by_role": "street_head",
                "details": f"Street Head {hname} acknowledged receipt and began triage.",
                "timestamp": acknowledged_at
            })

        if assigned_at:
            await db.complaint_history.insert_one({
                "complaint_id": cid,
                "action": "worker_assigned",
                "performed_by_id": hid,
                "performed_by_name": hname,
                "performed_by_role": "street_head",
                "details": f"Dispatched technician {wname} ({wdept}).",
                "timestamp": assigned_at
            })

        if resolved_at:
            await db.complaint_history.insert_one({
                "complaint_id": cid,
                "action": "resolved",
                "performed_by_id": hid,
                "performed_by_name": hname,
                "performed_by_role": "street_head",
                "details": f"Work completed by {wname}. Evidence uploaded for resident verification.",
                "timestamp": resolved_at
            })

        if verified_at:
            await db.complaint_history.insert_one({
                "complaint_id": cid,
                "action": "verified_closed",
                "performed_by_id": rid,
                "performed_by_name": rname,
                "performed_by_role": "resident",
                "details": "Resident verified the repairs and submitted 5-star rating.",
                "timestamp": verified_at
            })

        # If escalated, add escalation record
        if tmpl.get("esc_level", 0) > 0:
            esc_doc = {
                "complaint_id": cid,
                "street_id": sid,
                "street_name": sname,
                "assigned_street_head_id": hid,
                "street_head_name": hname,
                "reason": f"SLA Violation: {tmpl['pri']} complaint exceeded allowed resolution or acknowledgement timeframe.",
                "escalation_level": tmpl["esc_level"],
                "escalated_to_role": "central_head",
                "status": "active" if tmpl["status"] in ["escalated", "reopened"] else "intervened",
                "intervention_notes": "Central Head dispatched backup crew." if tmpl["status"] not in ["escalated", "reopened"] else None,
                "intervened_by_id": central_head_id if tmpl["status"] not in ["escalated", "reopened"] else None,
                "created_at": c_time + timedelta(hours=1),
                "resolved_at": resolved_at
            }
            await db.escalation_records.insert_one(esc_doc)

            # Notification for Central Head
            await db.notifications.insert_one({
                "user_id": central_head_id,
                "title": f"ESCALATION: {c_code} on {sname}",
                "message": f"{tmpl['pri']} complaint exceeded SLA. Assigned Street Head: {hname}.",
                "type": "escalation",
                "complaint_id": cid,
                "is_read": False,
                "created_at": c_time + timedelta(hours=1)
            })

        # Resident Notification
        await db.notifications.insert_one({
            "user_id": rid,
            "title": f"Update on {c_code}",
            "message": f"Your complaint '{tmpl['title']}' status is now {tmpl['status']}.",
            "type": "complaint_status",
            "complaint_id": cid,
            "is_read": tmpl["status"] in ["resolved", "verified"],
            "created_at": now - timedelta(hours=1)
        })

    print("SUCCESS: Greenfield Locality seeded successfully!")
    print(f"Total Users: {1 + len(street_head_ids) + len(resident_ids)}")
    print(f"Total Streets: {len(street_ids)}")
    print(f"Total Complaints: {len(complaint_templates)}")
    print(f"Total Maintenance Workers: {len(worker_ids)}")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
