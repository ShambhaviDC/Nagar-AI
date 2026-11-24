import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def make_req(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"HTTP {e.code} Error for {endpoint}: {err}")
        raise e

def run_tests():
    print("=" * 60)
    print("NAGARAI END-TO-END AUTOMATED VERIFICATION SUITE")
    print("=" * 60)

    # 1. Healthcheck
    health = make_req("/health")
    assert health["status"] == "healthy"
    print("✓ 1. Backend healthcheck verified:", health["app"], health["tagline"])

    # 2. Authentications
    res_login = make_req("/auth/login", method="POST", data={"email": "resident1@nagarai.gov.in", "password": "Password@123"})
    resident_token = res_login["access_token"]
    resident_user = res_login["user"]
    print("✓ 2a. Resident authenticated:", resident_user["name"], f"({resident_user['email']})")

    sh_login = make_req("/auth/login", method="POST", data={"email": "head.gulmohar@nagarai.gov.in", "password": "Password@123"})
    street_head_token = sh_login["access_token"]
    street_head_user = sh_login["user"]
    print("✓ 2b. Street Head authenticated:", street_head_user["name"], f"({street_head_user['email']})")

    ch_login = make_req("/auth/login", method="POST", data={"email": "central@nagarai.gov.in", "password": "Password@123"})
    central_head_token = ch_login["access_token"]
    central_head_user = ch_login["user"]
    print("✓ 2c. Central Head authenticated:", central_head_user["name"], f"({central_head_user['email']})")

    # Fetch streets to find Gulmohar Avenue
    streets = make_req("/streets", token=resident_token)
    gulmohar = next(s for s in streets if "Gulmohar" in s["name"])
    print(f"✓ 3. Located target street: {gulmohar['name']} (ID: {gulmohar['id']})")

    # FLOW A: Resident reports complaint -> AI orchestrates -> Street Head resolves -> Resident confirms
    print("\n--- FLOW A: COMPLETE COMPLAINT RESOLUTION LIFECYCLE ---")
    complaint_in = {
        "title": "Low hanging sparking wire on Gulmohar Avenue",
        "description": "Overhead electrical cable snapped and is hanging 5 feet above the footpath sparking occasionally. Immediate hazard to school children.",
        "locality_id": gulmohar["locality_id"],
        "street_id": gulmohar["id"],
        "landmark": "Near Gulmohar Park Main Gate",
        "latitude": gulmohar["center_lat"],
        "longitude": gulmohar["center_lng"]
    }
    comp_res = make_req("/complaints", method="POST", data=complaint_in, token=resident_token)
    cid = comp_res["id"]
    code = comp_res["complaint_code"]
    print(f"✓ 4a. Complaint registered: {code} (ID: {cid})")
    print(f"     Priority: {comp_res['priority']} | Category: {comp_res['category']}")
    print(f"     Assigned Street Head: {comp_res['assigned_street_head_name']}")
    assert comp_res["priority"] == "P1", f"Expected P1, got {comp_res['priority']}"
    assert comp_res["status"] == "registered"

    # Street Head acknowledges
    ack_res = make_req(f"/complaints/{cid}/acknowledge", method="POST", token=street_head_token)
    print(f"✓ 4b. Street Head acknowledged {code}. Status: {ack_res['status']}")
    assert ack_res["status"] == "acknowledged"

    # Street Head assigns worker
    workers = make_req("/street-head/workers", token=street_head_token)
    elec_worker = next((w for w in workers if "Electrical" in w["department"]), workers[0])
    assign_res = make_req(
        f"/complaints/{cid}/assign-worker",
        method="POST",
        data={"worker_id": elec_worker["id"], "instructions": "De-energize cable and re-insulate immediately."},
        token=street_head_token
    )
    print(f"✓ 4c. Worker dispatched: {assign_res['worker_name']} ({assign_res['worker_department']}). Status: {assign_res['status']}")
    assert assign_res["status"] == "worker_assigned"

    # Street Head marks resolved with evidence
    resolve_res = make_req(
        f"/complaints/{cid}/status",
        method="PATCH",
        data={
            "status": "resolved",
            "resolution_notes": "Crew re-tensioned overhead lines, replaced damaged insulator, and cleared surrounding branches. Line re-energized safely.",
            "resolution_image_urls": ["https://picsum.photos/seed/repaircompleted/600/400"]
        },
        token=street_head_token
    )
    print(f"✓ 4d. Street Head marked resolved. Notes: '{resolve_res['resolution_notes'][:50]}...'. Status: {resolve_res['status']}")
    assert resolve_res["status"] == "resolved"

    # Resident confirms resolution with 5-star rating
    feedback_res = make_req(
        f"/complaints/{cid}/feedback",
        method="POST",
        data={"rating": 5, "comment": "Excellent and rapid resolution by Vikram and Ramesh!", "is_satisfied": True},
        token=resident_token
    )
    print(f"✓ 4e. Resident verified resolution: {feedback_res['message']} (Verified: {feedback_res['verified']})")

    # Fetch final complaint state
    final_comp = make_req(f"/complaints/{cid}", token=resident_token)
    print(f"✓ 4f. Final State: {final_comp['complaint_code']} is '{final_comp['status']}'")
    assert final_comp["status"] == "verified"

    # Verify audit history
    hist = make_req(f"/complaints/{cid}/history", token=resident_token)
    print(f"✓ 4g. Audit history verified: {len(hist)} chronological audit events recorded.")
    actions = [h["action"] for h in hist]
    print(f"     Audit Trail Actions: {' -> '.join(actions)}")
    assert "registered" in actions
    assert "acknowledged" in actions
    assert "worker_assigned" in actions
    assert "verified_closed" in actions

    # FLOW B: Inactivity, Surveillance & Escalation Cycle
    print("\n--- FLOW B: SURVEILLANCE & CENTRAL INTERVENTION ---")
    surveillance_res = make_req("/central/trigger-surveillance", method="POST", token=central_head_token)
    print("✓ 5a. Central Head triggered automated surveillance cycle:", surveillance_res["message"])

    overdue_list = make_req("/central/overdue-complaints", token=central_head_token)
    print(f"✓ 5b. Overdue complaints retrieved: {len(overdue_list)} issues currently breaching SLA.")

    if overdue_list:
        target_overdue = overdue_list[0]
        t_id = target_overdue["id"]
        intervene_res = make_req(
            f"/central/complaints/{t_id}/intervene",
            method="POST",
            data={
                "intervention_notes": "Central Command direct directive: Emergency backup maintenance team deployed to assist street head.",
                "elevate_priority": "P1",
                "direct_action": "Central Directive Issued"
            },
            token=central_head_token
        )
        print(f"✓ 5c. Central Head intervened on {target_overdue['complaint_code']}: {intervene_res['priority']} (Status: {intervene_res['status']})")

    # FLOW C: Central Head Locality Analytics & GIS Map
    print("\n--- FLOW C: GIS MAP & TELEMETRY ---")
    map_data = make_req("/map/complaints", token=central_head_token)
    print(f"✓ 6a. Map Complaints Endpoint: {len(map_data['features'])} geo-markers with priority colors loaded.")
    assert len(map_data["features"]) > 0

    analytics = make_req("/central/analytics", token=central_head_token)
    print(f"✓ 6b. Locality Analytics Endpoint: Categories ({len(analytics['category_distribution'])}), Compliance: {analytics['overall_sla_compliance']}%")
    print(f"     Recurring Hotspots Identified: {len(analytics['recurring_hotspots'])}")

    perf = make_req("/central/street-performance", token=central_head_token)
    print(f"✓ 6c. Street Performance Scorecard: {len(perf)} street heads evaluated.")
    for p in perf[:3]:
        print(f"     {p['street_name']}: Rating={p['performance_rating']}, SLA={p['sla_compliance_rate']}%, Overdue={p['overdue_complaints']}")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("NagarAI Platform is completely functional and verified.")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
