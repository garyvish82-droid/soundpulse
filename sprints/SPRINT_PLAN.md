# SoundPulse — Sprint Plan

**Owner:** Garik | **Goal:** Land a PM role at a music production software company
**Stack:** Python · FastMCP · Supabase · AWS · SoundCloud API
**Cadence:** 4 hours × 3 sessions/week

---

## What We're Building

An **MCP (Model Context Protocol) server** that gives AI agents real-time access to SoundCloud usage data and produces actionable UX insights. Stakeholders interact with it through a **natural language chat interface** and can export a polished **PDF/HTML insight report**.

This MVP proves three things to any music-tech product team:
1. You understand agentic AI infrastructure (MCP, LLM tooling)
2. You can translate raw usage data into product decisions
3. You can ship — not just theorize

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  STAKEHOLDER DEMO                   │
│          Chat Interface  +  PDF Report Export       │
└──────────────────────┬──────────────────────────────┘
                       │ MCP Protocol
┌──────────────────────▼──────────────────────────────┐
│              MCP SERVER  (AWS Lambda / EC2)          │
│                                                     │
│  Tools:                                             │
│  • sc_get_track_analytics      (real API)           │
│  • sc_analyze_retention        (analysis engine)    │
│  • sc_find_discovery_gaps      (analysis engine)    │
│  • sc_get_creator_feedback     (analysis engine)    │
│  • sc_query_trends             (Supabase query)     │
│  • sc_generate_ux_report       (report export)      │
│  • sc_store_snapshot           (data ingestion)     │
└──────────┬────────────────────────┬─────────────────┘
           │                        │
┌──────────▼──────────┐   ┌────────▼────────────────┐
│  SoundCloud API v1  │   │  Supabase (PostgreSQL)   │
│  (Tracks, Users,    │   │  (Historical snapshots,  │
│   Comments, Likes)  │   │   aggregated insights)   │
└─────────────────────┘   └─────────────────────────┘
```

---

## Sprints

### WEEK 1 — Foundation (12 hours)

#### Session 1 · 4h · Setup & Data Layer
**Goal:** Repo live, Supabase schema up, SoundCloud API connected

| Task | Time | Output |
|------|------|--------|
| SoundCloud developer account + API key | 30 min | `.env` with credentials |
| Supabase project + schema migration | 45 min | DB tables live |
| Python project scaffold + FastMCP | 30 min | `main.py` runs |
| SoundCloud API client (`src/soundcloud/client.py`) | 60 min | Fetch tracks/users |
| Supabase client + seed demo data | 75 min | Realistic mock data in DB |

**Deliverable:** `python main.py` starts the MCP server locally

---

#### Session 2 · 4h · Core Analytics Tools
**Goal:** First 3 MCP tools returning real data

| Task | Time | Output |
|------|------|--------|
| `sc_get_track_analytics` tool | 60 min | Real SoundCloud track data |
| `sc_analyze_retention` tool | 90 min | Retention curve per track |
| `sc_find_discovery_gaps` tool | 90 min | Search vs. listen mismatch |

**Deliverable:** Run 3 tools via MCP Inspector, all return data

---

#### Session 3 · 4h · Intelligence Layer
**Goal:** Creator feedback + trend querying tools

| Task | Time | Output |
|------|------|--------|
| `sc_get_creator_feedback` tool | 90 min | Comment/like/repost ratios |
| `sc_query_trends` (Supabase) | 60 min | Historical trend queries |
| `sc_store_snapshot` tool | 60 min | Writes fresh data to Supabase |
| Integration test all tools | 30 min | All 6 tools verified |

**Deliverable:** Full data pipeline end-to-end

---

### WEEK 2 — Intelligence & Deployment (12 hours)

#### Session 4 · 4h · Report Generation
**Goal:** `sc_generate_ux_report` produces a stakeholder-ready HTML/PDF

| Task | Time | Output |
|------|------|--------|
| Report template (HTML + CSS) | 90 min | Beautiful report design |
| Analysis aggregation logic | 90 min | Pulls all 3 insight types |
| HTML → PDF export (WeasyPrint) | 60 min | Downloadable PDF report |

**Deliverable:** One-command report generation

---

#### Session 5 · 4h · AWS Deployment
**Goal:** MCP server live on AWS, reachable via HTTPS

| Task | Time | Output |
|------|------|--------|
| Dockerfile + docker-compose | 45 min | Container builds |
| AWS ECR push | 45 min | Image in registry |
| AWS Lambda or EC2 setup | 90 min | Server live at HTTPS URL |
| Environment variables in AWS Secrets Manager | 60 min | Credentials secured |

**Deliverable:** `curl https://your-mcp-server.aws.../health` returns 200

---

#### Session 6 · 4h · Demo Chat Interface
**Goal:** Stakeholders can talk to the agent in a browser

| Task | Time | Output |
|------|------|--------|
| HTML chat UI (`demo/index.html`) | 90 min | Beautiful chat page |
| Proxy endpoint (FastAPI) to relay MCP calls | 90 min | Chat → MCP → response |
| Pre-canned demo questions | 60 min | 5 killer demo questions |

**Deliverable:** Open `demo/index.html` and ask "What's killing retention?"

---

### WEEK 3 — Polish & Stakeholder Prep (12 hours)

#### Session 7 · 4h · Data Realism
**Goal:** Seed data feels like real SoundCloud at scale

| Task | Time | Output |
|------|------|--------|
| 1,000 synthetic track records | 60 min | Believable play/skip data |
| User journey simulation | 90 min | Session depth patterns |
| A/B scenario seeds | 90 min | "What changed after this drop?" |

---

#### Session 8 · 4h · Stakeholder Demo Script
**Goal:** 15-minute demo that closes interviews

| Task | Time | Output |
|------|------|--------|
| Demo narrative & talking points | 60 min | Story arc written |
| 5 "wow moments" scripted | 90 min | Agent does something impressive |
| One-page product spec for the feature | 90 min | Shows PM instincts |

---

#### Session 9 · 4h · Final Polish
**Goal:** Production-ready presentation

| Task | Time | Output |
|------|------|--------|
| README with 5-minute setup | 60 min | Anyone can run it |
| GitHub repo clean + tagged v1.0 | 30 min | Professional repo |
| Deploy final version to AWS | 60 min | Live demo URL |
| Record a 3-min Loom walkthrough | 90 min | Send in applications |

---

## Success Metrics (for Portfolio)

| Metric | Target |
|--------|--------|
| MCP tools implemented | 7 |
| Analysis dimensions covered | 3 (Retention · Discovery · Feedback) |
| Demo query response time | < 3 seconds |
| Report generation time | < 10 seconds |
| Stakeholder "wow" reactions | ≥ 2 per demo |

---

## The Pitch (Use This in Interviews)

> *"I built an MCP server that connects to SoundCloud's API, stores behavioral snapshots in Supabase, and exposes 7 analytical tools to an AI agent. Stakeholders can ask natural language questions like 'Where are we losing listeners on hip-hop tracks?' and get instant, data-backed UX recommendations — plus export a full insight report. I built this in 3 weeks while working, to prove I can ship product in the music-tech space."*
