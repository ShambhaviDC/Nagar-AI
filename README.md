# NagarAI
## AI-Powered Locality-Based Smart Complaint Resolution and Accountability Platform

> **"Smarter Neighborhoods. Faster Resolutions."**

**GitHub Repository**: [https://github.com/ShambhaviDC/Nagar-AI.git](https://github.com/ShambhaviDC/Nagar-AI.git)

NagarAI is a full-stack, AI-powered civic technology platform connecting residents, street heads, and central municipal administration through an intelligent 3-tier hierarchy, eight specialized autonomous AI agents, and a collective resident consensus mechanism.

---

## 🏛️ System Architecture

NagarAI implements a robust 3-level locality governance structure:

```
                  ┌────────────────────────────────────────┐
                  │          LEVEL 3: CENTRAL HEAD         │
                  │  Locality-Wide Command & Surveillance  │
                  └──────────────────┬─────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           │                                                   │
┌────────────────────────┐                           ┌────────────────────────┐
│  LEVEL 2: STREET HEAD  │  ... (8 Street Heads) ... │  LEVEL 2: STREET HEAD  │
│      MG Road Head      │                           │   Hospital Road Head   │
└───────────┬────────────┘                           └───────────┬────────────┘
            │                                                    │
┌───────────┴────────────┐                           ┌───────────┴────────────┐
│   LEVEL 1: RESIDENTS   │                           │   LEVEL 1: RESIDENTS   │
│  Report, Voice, Photos │                           │  Report, Voice, Photos │
│   & Community Voting   │                           │   & Community Voting   │
└────────────────────────┘                           └────────────────────────┘
```

### 1. Level 1: Resident (Citizen Empowerment)
- **Natural Language & Voice Input**: Register complaints by typing or speaking in real time using the native browser **Web Speech API** (with Indian English and Hindi support).
- **Optional Description**: Simply speak or attach a photo—the AI autonomous agents synthesize the title, detect the category, and assess severity automatically.
- **Street Community Feed & Upvoting**: Browse all registered issues on your street/locality (`/resident/street-feed`). Endorse issues affecting your household with **"👍 Upvote (Problem to all residents)"** to escalate priority and fast-track repairs.
- **Interactive Location Pinning**: Click on Leaflet OpenStreetMap to pinpoint precise coordinates and add landmark references.
- **Verification & Reopening**: Confirm repairs with a 5-star rating or reopen inadequate repairs with one click.

### 2. Level 2: Street Head (Direct Street-Level Accountability)
- **Assigned Street Corridor**: Directly accountable for issues on their designated street (e.g., MG Road, Brigade Road, Nehru Marg).
- **Strict SLA Timers**: Acknowledgement targets (P1 Critical: 15 mins, P2 High: 2 hours, P3 Medium: 12 hours, P4 Low: 24 hours).
- **Intelligent Dispatch**: Assign department maintenance technicians based on active workloads and department skills.
- **Resolution Proof**: Upload resolution photographs and repair documentation before marking tasks resolved.

### 3. Level 3: Central Head (Locality-Wide Command & Audit)
- **Master GIS Map**: Live Leaflet map displaying real-time priority markers across all 8 streets simultaneously.
- **Automated Escalation Management**: Immediate alerts for inactive street heads, unacknowledged tickets, or repeated reopenings.
- **Administrative Direct Intervention**: Override priorities, reassign technicians, or issue directives across any street.
- **Analytics & Insights**: Street Head scorecards, recurring defect hotspots, resolution time distributions, and automated trend reports.

---

## 🤖 8 Specialized Autonomous AI Multi-Agent Workers

NagarAI employs task-based agent orchestration with structured Pydantic schemas:

| # | Agent Name | Core Capabilities |
|---|------------|-------------------|
| **01** | **Complaint Understanding Agent** | Extracts civic assets, defects, landmarks, voice transcripts, and performs **Computer Vision image scanning** to verify photographic proof of on-ground damage. |
| **02** | **Classification & Priority Agent** | Dynamically evaluates voice/text severity cues (*"serious issue"*, *"problem to all residents"*), scanned visual hazards, and community upvotes to assign P1 (Critical), P2 (High), P3 (Medium), or P4 (Low) priorities with public safety justifications. |
| **03** | **Duplicate Detection Agent** | Clusters semantically and spatiotemporally similar complaints without discarding individual citizen voices. |
| **04** | **Smart Assignment Agent** | Resolves geographic street ownership, matches responsible Street Heads, and recommends technicians by workload. |
| **05** | **Complaint Monitoring Agent** | Continuous SLA surveillance; flags stalled, overdue, or unacknowledged complaints. |
| **06** | **Accountability & Escalation Agent** | Issues automated warnings to Street Heads and administrative escalations to the Central Head upon SLA breach. |
| **07** | **Resolution Verification Agent** | Evaluates repair proof quality and orchestrates resident confirmation and reopening workflows. |
| **08** | **Locality Analytics & Insights Agent** | Aggregates street head performance ratings, recurring defect hotspots, and data-driven recommendations. |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Leaflet.js, React-Leaflet, Web Speech API, Recharts, Lucide Icons.
- **Backend**: Python 3.12, FastAPI, Motor (AsyncIO MongoDB driver), PyMongo, Pydantic v2, WebSockets.
- **Database**: MongoDB 8.0 (10 collections: `users`, `localities`, `streets`, `complaints`, `maintenance_workers`, `assignments`, `complaint_history`, `notifications`, `feedback`, `escalation_records`).
- **AI & Automation**: Google Gemini API multimodal integration with offline heuristic rule engine, Sentence Transformers semantic clustering, APScheduler background surveillance.
- **Security**: Bcrypt password hashing, JWT Bearer tokens, Role-Based Access Control (RBAC), Locality and street-level data isolation.

---

## 🌆 Greenfield Locality: Common Indian Streets & Street Heads

The platform includes **Greenfield Locality (Bengaluru)** with 8 realistic common streets:

| Street Code | Street Name | Assigned Street Head | Login Email |
| :--- | :--- | :--- | :--- |
| **`MGR-01`** | **MG Road (Mahatma Gandhi Road)** | **Vikram Sethi - MG Road Head** | `head.mgroad@nagarai.gov.in` |
| **`BRG-02`** | **Brigade Road** | **Ananya Iyer - Brigade Road Head** | `head.brigade@nagarai.gov.in` |
| **`NHR-03`** | **Nehru Marg** | **Suresh Kulkarni - Nehru Marg Head** | `head.nehru@nagarai.gov.in` |
| **`STN-04`** | **Station Road** | **Pooja Hegde - Station Road Head** | `head.station@nagarai.gov.in` |
| **`MKT-05`** | **Market Street** | **Mohammed Farooq - Market Street Head** | `head.market@nagarai.gov.in` |
| **`TMP-06`** | **Temple Road** | **Kavitha Reddy - Temple Road Head** | `head.temple@nagarai.gov.in` |
| **`PRK-07`** | **Park Avenue** | **Ramesh Sharma - Park Avenue Head** | `head.park@nagarai.gov.in` |
| **`HSP-08`** | **Hospital Road** | **Dr. Deepa Nair - Hospital Road Head** | `head.hospital@nagarai.gov.in` |

- **Central Administrator**: Dr. Rajeshwar Sharma (`central@nagarai.gov.in`)
- **Sample Residents**: `resident1@nagarai.gov.in` through `resident12@nagarai.gov.in`
- **Default Password for All Accounts**: **`Password@123`**

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **MongoDB Server** (Running locally on port 27017 or via Atlas)

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python update_streets.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at: [http://localhost:5173](http://localhost:5173)

---

## 📜 License
MIT License. Built for smart, accountable, and transparent neighborhood governance.
