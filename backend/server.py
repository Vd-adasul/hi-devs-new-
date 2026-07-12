"""
LawyerOS mock backend — Python FastAPI.

The real backend for LawyerOS is a Fastify + Prisma + Postgres + Redis +
Elasticsearch + Neo4j service (see /app/backend/src). That stack requires
several external services which aren't available in this preview pod, and
the platform's supervisor is preconfigured to run `uvicorn server:app`
(Python) — so we bridge the gap with this lightweight Python service.

What this serves:
  - Auth (login/register/refresh/logout/me/request-password-reset)
  - Dashboard KPIs and activity
  - Contracts, Matters, Negotiations, Approvals, Requests, Obligations,
    Renewals, Counterparties, Templates, Clauses, Playbook, Analytics,
    Diligence, Signatures, Team, Users, Skills, Organization, Notifications

Everything is served with seeded, deterministic demo data so the UI can
be exercised end-to-end without a real database.

Auth is JWT-lookalike — we accept any Bearer token (or the demo token
we return from /auth/login) and rehydrate the demo user. This is a
demo-only shortcut and NOT production-grade.
"""

from __future__ import annotations

import base64
import json
import random
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ─── Boot ─────────────────────────────────────────────────────────────────────

app = FastAPI(title="LawyerOS Mock API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Seed data ────────────────────────────────────────────────────────────────

random.seed(42)  # deterministic seed → same demo data across restarts

DEMO_USER = {
    "id": "user_demo_1",
    "email": "maya@lawyeros.ai",
    "name": "Maya Goldberg",
    "roles": ["ADMIN", "LEGAL_OPS"],
    "orgId": "org_demo_1",
    "avatarUrl": None,
    "title": "General Counsel",
    "createdAt": "2025-06-01T10:00:00Z",
}

DEMO_ORG = {
    "id": "org_demo_1",
    "name": "Aegis Cloud, Inc.",
    "domain": "aegiscloud.com",
    "logo": None,
    "createdAt": "2025-06-01T10:00:00Z",
    "plan": "FIRM",
    "seatsUsed": 12,
    "seatsLimit": 50,
}

TEAM_MEMBERS = [
    {"id": "u1", "name": "Maya Goldberg",   "email": "maya@lawyeros.ai",       "role": "ADMIN",       "title": "General Counsel"},
    {"id": "u2", "name": "Rohan Mehta",     "email": "rohan@aegiscloud.com",   "role": "LEGAL_OPS",   "title": "Head of Legal Ops"},
    {"id": "u3", "name": "Amara Devi",      "email": "amara@aegiscloud.com",   "role": "COUNSEL",     "title": "Senior Counsel"},
    {"id": "u4", "name": "James Whitfield", "email": "james@aegiscloud.com",   "role": "COUNSEL",     "title": "Contract Manager"},
    {"id": "u5", "name": "Sofia Rodriguez", "email": "sofia@aegiscloud.com",   "role": "COUNSEL",     "title": "Commercial Counsel"},
    {"id": "u6", "name": "Kenji Nakamura",  "email": "kenji@aegiscloud.com",   "role": "REVIEWER",    "title": "Legal Analyst"},
    {"id": "u7", "name": "Priya Sharma",    "email": "priya@aegiscloud.com",   "role": "COUNSEL",     "title": "Data Privacy Counsel"},
    {"id": "u8", "name": "David Chen",      "email": "david@aegiscloud.com",   "role": "REQUESTER",   "title": "VP Sales"},
    {"id": "u9", "name": "Olivia Brooks",   "email": "olivia@aegiscloud.com",  "role": "REQUESTER",   "title": "Head of Procurement"},
    {"id": "u10","name": "Nadia Al-Farsi",  "email": "nadia@aegiscloud.com",   "role": "COUNSEL",     "title": "IP Counsel"},
    {"id": "u11","name": "Ethan Blackwell", "email": "ethan@aegiscloud.com",   "role": "APPROVER",    "title": "CFO"},
    {"id": "u12","name": "Lila Weiss",      "email": "lila@aegiscloud.com",    "role": "APPROVER",    "title": "COO"},
]

COUNTERPARTIES = [
    {"id": "cp1", "name": "Zenith Labs, Inc.",       "type": "VENDOR",   "country": "US", "contractCount": 12, "totalValue": 4_200_000, "riskLevel": "MEDIUM"},
    {"id": "cp2", "name": "Nova Systems Ltd.",       "type": "CUSTOMER", "country": "UK", "contractCount": 8,  "totalValue": 2_850_000, "riskLevel": "LOW"},
    {"id": "cp3", "name": "Aegis Cloud Services",    "type": "PARTNER",  "country": "US", "contractCount": 6,  "totalValue": 1_950_000, "riskLevel": "LOW"},
    {"id": "cp4", "name": "Meridian Financial LLP",  "type": "CUSTOMER", "country": "US", "contractCount": 15, "totalValue": 6_700_000, "riskLevel": "MEDIUM"},
    {"id": "cp5", "name": "Palladian & Co.",         "type": "PARTNER",  "country": "IN", "contractCount": 4,  "totalValue": 890_000,   "riskLevel": "LOW"},
    {"id": "cp6", "name": "Harrow West Holdings",    "type": "VENDOR",   "country": "UK", "contractCount": 9,  "totalValue": 3_100_000, "riskLevel": "HIGH"},
    {"id": "cp7", "name": "Ironcrown LLP",           "type": "VENDOR",   "country": "US", "contractCount": 3,  "totalValue": 540_000,   "riskLevel": "LOW"},
    {"id": "cp8", "name": "Brunswick Bar Ltd.",      "type": "CUSTOMER", "country": "AU", "contractCount": 7,  "totalValue": 1_680_000, "riskLevel": "MEDIUM"},
    {"id": "cp9", "name": "Rosewood Partners",       "type": "CUSTOMER", "country": "SG", "contractCount": 5,  "totalValue": 1_240_000, "riskLevel": "LOW"},
    {"id": "cp10","name": "Heron & Finch",           "type": "PARTNER",  "country": "CA", "contractCount": 11, "totalValue": 3_950_000, "riskLevel": "MEDIUM"},
]

CONTRACT_TITLES = [
    ("MSA — Zenith Labs, Inc.",          "MSA",              "cp1"),
    ("DPA — Nova Systems Ltd.",          "DPA",              "cp2"),
    ("Vendor SLA — Aegis Cloud",         "SLA",              "cp3"),
    ("NDA — Meridian Financial",         "NDA",              "cp4"),
    ("SOW #4 — Palladian & Co.",         "SOW",              "cp5"),
    ("Employment — J. Chen",             "EMPLOYMENT",       "cp3"),
    ("License — Harrow West Holdings",   "LICENSE",          "cp6"),
    ("Partnership — Rosewood Partners",  "PARTNERSHIP",      "cp9"),
    ("MSA — Ironcrown LLP",              "MSA",              "cp7"),
    ("SOW — Brunswick Bar",              "SOW",              "cp8"),
    ("Vendor Agreement — Heron & Finch", "VENDOR_AGREEMENT", "cp10"),
    ("NDA — Zenith Labs",                "NDA",              "cp1"),
    ("MSA — Nova Systems Renewal",       "MSA",              "cp2"),
    ("DPA — Meridian Financial",         "DPA",              "cp4"),
    ("SLA — Rosewood Partners",          "SLA",              "cp9"),
    ("Employment — S. Rodriguez",        "EMPLOYMENT",       "cp3"),
    ("License — Ironcrown Technologies", "LICENSE",          "cp7"),
    ("Vendor SLA — Brunswick Bar",       "SLA",              "cp8"),
    ("MSA — Harrow West",                "MSA",              "cp6"),
    ("NDA — Heron & Finch",              "NDA",              "cp10"),
    ("SOW #12 — Palladian Advisory",     "SOW",              "cp5"),
    ("Partnership — Aegis Cloud",        "PARTNERSHIP",      "cp3"),
]

CONTRACT_STATUSES = [
    "DRAFT", "PENDING_REVIEW", "UNDER_NEGOTIATION", "PENDING_APPROVAL",
    "APPROVED", "PENDING_SIGNATURE", "EXECUTED", "EXECUTED", "EXECUTED",
    "EXECUTED", "EXPIRED",
]

def _make_contracts() -> list[dict[str, Any]]:
    contracts = []
    now = datetime.now(timezone.utc)
    for i, (title, ctype, cp) in enumerate(CONTRACT_TITLES):
        rng = random.Random(i)
        status = rng.choice(CONTRACT_STATUSES)
        value = rng.randint(25, 4200) * 1000
        signed_days_ago = rng.randint(1, 600) if "EXECUTED" in status or "EXPIRED" in status else None
        expires_in = rng.randint(-40, 400) if signed_days_ago else None
        contracts.append({
            "id": f"c_{i+1:03d}",
            "title": title,
            "type": ctype,
            "status": status,
            "counterpartyId": cp,
            "counterpartyName": next((c["name"] for c in COUNTERPARTIES if c["id"] == cp), ""),
            "value": value,
            "currency": "USD",
            "signedAt": (now - timedelta(days=signed_days_ago)).isoformat() if signed_days_ago else None,
            "expiresAt": (now + timedelta(days=expires_in)).isoformat() if expires_in is not None else None,
            "daysToExpiry": expires_in,
            "createdAt": (now - timedelta(days=rng.randint(30, 800))).isoformat(),
            "updatedAt": (now - timedelta(days=rng.randint(0, 60))).isoformat(),
            "daysSinceUpdate": rng.randint(0, 60),
            "ownerId": rng.choice(TEAM_MEMBERS)["id"],
            "ownerName": rng.choice(TEAM_MEMBERS)["name"],
            "riskScore": round(rng.random(), 2),
            "clauseFlags": {
                "forceMajeure": rng.random() > 0.7,
                "mfn": rng.random() > 0.8,
                "changeOfControl": rng.random() > 0.6,
                "auditRights": rng.random() > 0.5,
                "assignmentRestriction": rng.random() > 0.6,
                "limitationOfLiability": rng.random() > 0.4,
            },
            "phase": None,
            "versions": [{"id": f"v_{i+1}_1", "version": 1, "s3Key": f"org_demo/contracts/{int(time.time())}-{title.split(' — ')[0].lower().replace(' ', '_')}.pdf"}],
        })
    return contracts

CONTRACTS = _make_contracts()

MATTERS = [
    {"id": "m1", "name": "Project Atlas — Series C acquisition", "type": "M_AND_A",    "status": "ACTIVE",   "ownerId": "u1", "priority": "HIGH",   "contractsCount": 4,  "obligationsCount": 12, "openApprovals": 3, "tags": ["M&A", "Series C", "Diligence"],   "createdAt": "2025-11-01T00:00:00Z"},
    {"id": "m2", "name": "Zenith Vendor Consolidation",          "type": "COMMERCIAL", "status": "ACTIVE",   "ownerId": "u3", "priority": "MEDIUM", "contractsCount": 8,  "obligationsCount": 24, "openApprovals": 1, "tags": ["Vendor", "Cost-savings"],         "createdAt": "2025-09-15T00:00:00Z"},
    {"id": "m3", "name": "GDPR Response — Meridian Breach",      "type": "REGULATORY", "status": "ACTIVE",   "ownerId": "u7", "priority": "HIGH",   "contractsCount": 2,  "obligationsCount": 6,  "openApprovals": 0, "tags": ["Privacy", "GDPR", "Incident"],     "createdAt": "2025-12-20T00:00:00Z"},
    {"id": "m4", "name": "Employment — Q1 Restructure",          "type": "EMPLOYMENT", "status": "ACTIVE",   "ownerId": "u5", "priority": "MEDIUM", "contractsCount": 12, "obligationsCount": 18, "openApprovals": 2, "tags": ["HR", "Restructure"],               "createdAt": "2025-12-05T00:00:00Z"},
    {"id": "m5", "name": "IP Portfolio Audit — Aegis",           "type": "IP",         "status": "ACTIVE",   "ownerId": "u10","priority": "LOW",    "contractsCount": 6,  "obligationsCount": 4,  "openApprovals": 0, "tags": ["IP", "Audit"],                      "createdAt": "2025-08-01T00:00:00Z"},
    {"id": "m6", "name": "Litigation Prep — Ironcrown Dispute",  "type": "LITIGATION", "status": "ACTIVE",   "ownerId": "u4", "priority": "HIGH",   "contractsCount": 3,  "obligationsCount": 8,  "openApprovals": 1, "tags": ["Litigation", "Contract dispute"],  "createdAt": "2025-10-10T00:00:00Z"},
    {"id": "m7", "name": "SaaS Enterprise Rollout — Palladian",  "type": "COMMERCIAL", "status": "CLOSED",   "ownerId": "u5", "priority": "MEDIUM", "contractsCount": 5,  "obligationsCount": 0,  "openApprovals": 0, "tags": ["Commercial", "Enterprise"],        "createdAt": "2025-04-01T00:00:00Z"},
    {"id": "m8", "name": "Data Residency Migration — EU",        "type": "REGULATORY", "status": "ACTIVE",   "ownerId": "u7", "priority": "MEDIUM", "contractsCount": 7,  "obligationsCount": 15, "openApprovals": 4, "tags": ["Privacy", "Data residency", "EU"], "createdAt": "2025-11-20T00:00:00Z"},
]

NEGOTIATIONS = [
    {"id": "n1", "contractId": "c_001", "contractTitle": "MSA — Zenith Labs, Inc.",     "status": "COUNTERPARTY_TURN", "rounds": 3, "lastActivityAt": "2026-01-08T14:20:00Z", "openThreads": 5, "ourTurn": False, "counterparty": "Zenith Labs, Inc."},
    {"id": "n2", "contractId": "c_002", "contractTitle": "DPA — Nova Systems Ltd.",     "status": "OUR_TURN",          "rounds": 2, "lastActivityAt": "2026-01-10T09:15:00Z", "openThreads": 3, "ourTurn": True,  "counterparty": "Nova Systems Ltd."},
    {"id": "n3", "contractId": "c_004", "contractTitle": "NDA — Meridian Financial",    "status": "OUR_TURN",          "rounds": 1, "lastActivityAt": "2026-01-11T11:00:00Z", "openThreads": 2, "ourTurn": True,  "counterparty": "Meridian Financial LLP"},
    {"id": "n4", "contractId": "c_009", "contractTitle": "MSA — Ironcrown LLP",         "status": "COUNTERPARTY_TURN", "rounds": 4, "lastActivityAt": "2026-01-07T16:45:00Z", "openThreads": 7, "ourTurn": False, "counterparty": "Ironcrown LLP"},
    {"id": "n5", "contractId": "c_013", "contractTitle": "MSA — Nova Systems Renewal",  "status": "STALLED",           "rounds": 5, "lastActivityAt": "2025-12-22T10:30:00Z", "openThreads": 1, "ourTurn": True,  "counterparty": "Nova Systems Ltd."},
    {"id": "n6", "contractId": "c_019", "contractTitle": "MSA — Harrow West",           "status": "OUR_TURN",          "rounds": 2, "lastActivityAt": "2026-01-09T13:00:00Z", "openThreads": 4, "ourTurn": True,  "counterparty": "Harrow West Holdings"},
]

APPROVALS = [
    {"id": "a1", "instanceId": "a1", "contractId": "c_001", "contractTitle": "MSA — Zenith Labs, Inc.",    "step": "Legal review",   "assigneeId": "u1", "assigneeName": "Maya Goldberg",   "requestedBy": "David Chen",     "status": "PENDING", "priority": "HIGH",   "requestedAt": "2026-01-10T08:00:00Z", "sla": "2026-01-13T08:00:00Z"},
    {"id": "a2", "instanceId": "a2", "contractId": "c_002", "contractTitle": "DPA — Nova Systems Ltd.",    "step": "Privacy sign-off","assigneeId": "u7", "assigneeName": "Priya Sharma",    "requestedBy": "Amara Devi",    "status": "PENDING", "priority": "HIGH",   "requestedAt": "2026-01-09T15:30:00Z", "sla": "2026-01-12T15:30:00Z"},
    {"id": "a3", "instanceId": "a3", "contractId": "c_003", "contractTitle": "Vendor SLA — Aegis Cloud",   "step": "Finance approval","assigneeId": "u11","assigneeName": "Ethan Blackwell", "requestedBy": "Olivia Brooks", "status": "PENDING", "priority": "MEDIUM", "requestedAt": "2026-01-08T11:00:00Z", "sla": "2026-01-15T11:00:00Z"},
    {"id": "a4", "instanceId": "a4", "contractId": "c_005", "contractTitle": "SOW #4 — Palladian & Co.",   "step": "Legal review",   "assigneeId": "u3", "assigneeName": "Amara Devi",      "requestedBy": "James Whitfield","status": "PENDING", "priority": "LOW",    "requestedAt": "2026-01-07T09:45:00Z", "sla": "2026-01-17T09:45:00Z"},
    {"id": "a5", "instanceId": "a5", "contractId": "c_009", "contractTitle": "MSA — Ironcrown LLP",        "step": "Exec approval",  "assigneeId": "u12","assigneeName": "Lila Weiss",      "requestedBy": "Maya Goldberg", "status": "PENDING", "priority": "HIGH",   "requestedAt": "2026-01-11T07:20:00Z", "sla": "2026-01-14T07:20:00Z"},
    {"id": "a6", "instanceId": "a6", "contractId": "c_013", "contractTitle": "MSA — Nova Systems Renewal", "step": "Legal review",   "assigneeId": "u1", "assigneeName": "Maya Goldberg",   "requestedBy": "David Chen",     "status": "APPROVED","priority": "MEDIUM", "requestedAt": "2026-01-05T14:00:00Z", "sla": "2026-01-08T14:00:00Z", "decidedAt": "2026-01-07T09:00:00Z"},
    {"id": "a7", "instanceId": "a7", "contractId": "c_016", "contractTitle": "Employment — S. Rodriguez", "step": "HR approval",    "assigneeId": "u5", "assigneeName": "Sofia Rodriguez","requestedBy": "Kenji Nakamura","status": "REJECTED","priority": "MEDIUM","requestedAt": "2026-01-04T10:00:00Z", "sla": "2026-01-07T10:00:00Z", "decidedAt": "2026-01-06T11:30:00Z", "reason": "Salary band mismatch"},
]

REQUESTS = [
    {"id": "r1", "title": "New MSA — Zenith Labs partnership",       "type": "NEW_CONTRACT",   "status": "IN_REVIEW",    "requesterId": "u8",  "requesterName": "David Chen",     "assigneeId": "u1",  "assigneeName": "Maya Goldberg",  "priority": "HIGH",   "createdAt": "2026-01-10T09:00:00Z", "dueAt": "2026-01-15T17:00:00Z"},
    {"id": "r2", "title": "Renew DPA — Nova Systems",                "type": "RENEWAL",        "status": "OPEN",         "requesterId": "u9",  "requesterName": "Olivia Brooks",  "assigneeId": "u7",  "assigneeName": "Priya Sharma",   "priority": "HIGH",   "createdAt": "2026-01-11T08:00:00Z", "dueAt": "2026-01-14T17:00:00Z"},
    {"id": "r3", "title": "NDA — Meridian Financial evaluation",     "type": "NDA",            "status": "OPEN",         "requesterId": "u8",  "requesterName": "David Chen",     "assigneeId": "u3",  "assigneeName": "Amara Devi",     "priority": "MEDIUM", "createdAt": "2026-01-11T10:30:00Z", "dueAt": "2026-01-13T17:00:00Z"},
    {"id": "r4", "title": "Employment amendment — J. Chen promotion","type": "AMENDMENT",      "status": "IN_PROGRESS",  "requesterId": "u9",  "requesterName": "Olivia Brooks",  "assigneeId": "u5",  "assigneeName": "Sofia Rodriguez","priority": "MEDIUM", "createdAt": "2026-01-08T14:00:00Z", "dueAt": "2026-01-16T17:00:00Z"},
    {"id": "r5", "title": "New SOW — Palladian advisory Q1",         "type": "NEW_CONTRACT",   "status": "OPEN",         "requesterId": "u8",  "requesterName": "David Chen",     "assigneeId": "u4",  "assigneeName": "James Whitfield","priority": "LOW",    "createdAt": "2026-01-09T11:15:00Z", "dueAt": "2026-01-20T17:00:00Z"},
    {"id": "r6", "title": "IP assignment — Nakamura patent",         "type": "IP",             "status": "COMPLETED",    "requesterId": "u9",  "requesterName": "Olivia Brooks",  "assigneeId": "u10", "assigneeName": "Nadia Al-Farsi", "priority": "MEDIUM", "createdAt": "2025-12-20T10:00:00Z", "dueAt": "2025-12-30T17:00:00Z", "completedAt": "2025-12-28T15:00:00Z"},
]

OBLIGATIONS = [
    {"id": "o1", "contractId": "c_001", "contractTitle": "MSA — Zenith Labs, Inc.",  "title": "Quarterly service review",       "type": "REPORTING",    "assigneeId": "u3", "assigneeName": "Amara Devi",     "status": "PENDING",   "dueAt": "2026-01-15T00:00:00Z", "daysOverdue": None,  "priority": "MEDIUM"},
    {"id": "o2", "contractId": "c_003", "contractTitle": "Vendor SLA — Aegis Cloud", "title": "99.9% uptime attestation",       "type": "SLA",          "assigneeId": "u3", "assigneeName": "Amara Devi",     "status": "OVERDUE",   "dueAt": "2026-01-05T00:00:00Z", "daysOverdue": 6,     "priority": "HIGH"},
    {"id": "o3", "contractId": "c_002", "contractTitle": "DPA — Nova Systems Ltd.",  "title": "Annual privacy audit",           "type": "COMPLIANCE",   "assigneeId": "u7", "assigneeName": "Priya Sharma",   "status": "PENDING",   "dueAt": "2026-02-01T00:00:00Z", "daysOverdue": None,  "priority": "HIGH"},
    {"id": "o4", "contractId": "c_007", "contractTitle": "License — Harrow West",    "title": "Royalty report Q4 2025",         "type": "PAYMENT",      "assigneeId": "u4", "assigneeName": "James Whitfield","status": "COMPLETED", "dueAt": "2025-12-31T00:00:00Z", "daysOverdue": None,  "priority": "MEDIUM", "completedAt": "2025-12-28T00:00:00Z"},
    {"id": "o5", "contractId": "c_005", "contractTitle": "SOW #4 — Palladian & Co.", "title": "Deliverable checkpoint",         "type": "DELIVERABLE",  "assigneeId": "u5", "assigneeName": "Sofia Rodriguez","status": "PENDING",   "dueAt": "2026-01-20T00:00:00Z", "daysOverdue": None,  "priority": "LOW"},
    {"id": "o6", "contractId": "c_008", "contractTitle": "Partnership — Rosewood",   "title": "Joint quarterly business review","type": "REPORTING",    "assigneeId": "u3", "assigneeName": "Amara Devi",     "status": "PENDING",   "dueAt": "2026-01-18T00:00:00Z", "daysOverdue": None,  "priority": "MEDIUM"},
    {"id": "o7", "contractId": "c_010", "contractTitle": "SOW — Brunswick Bar",      "title": "Milestone 2 delivery",           "type": "DELIVERABLE",  "assigneeId": "u5", "assigneeName": "Sofia Rodriguez","status": "OVERDUE",   "dueAt": "2026-01-08T00:00:00Z", "daysOverdue": 3,     "priority": "HIGH"},
    {"id": "o8", "contractId": "c_014", "contractTitle": "DPA — Meridian Financial", "title": "Sub-processor list update",      "type": "COMPLIANCE",   "assigneeId": "u7", "assigneeName": "Priya Sharma",   "status": "PENDING",   "dueAt": "2026-01-25T00:00:00Z", "daysOverdue": None,  "priority": "LOW"},
]

RENEWALS = [
    {"id": "rn1", "contractId": "c_001", "contractTitle": "MSA — Zenith Labs, Inc.",    "counterparty": "Zenith Labs, Inc.",      "value": 480000,  "currency": "USD", "expiresAt": "2026-02-15T00:00:00Z", "daysToExpiry": 35,  "autoRenew": False, "noticePeriodDays": 60, "action": "NOTIFY",   "assigneeName": "Maya Goldberg"},
    {"id": "rn2", "contractId": "c_003", "contractTitle": "Vendor SLA — Aegis Cloud",   "counterparty": "Aegis Cloud Services",   "value": 240000,  "currency": "USD", "expiresAt": "2026-01-25T00:00:00Z", "daysToExpiry": 14,  "autoRenew": True,  "noticePeriodDays": 30, "action": "REVIEW",   "assigneeName": "Amara Devi"},
    {"id": "rn3", "contractId": "c_007", "contractTitle": "License — Harrow West",      "counterparty": "Harrow West Holdings",   "value": 1200000, "currency": "USD", "expiresAt": "2026-03-01T00:00:00Z", "daysToExpiry": 49,  "autoRenew": False, "noticePeriodDays": 90, "action": "NEGOTIATE","assigneeName": "James Whitfield"},
    {"id": "rn4", "contractId": "c_009", "contractTitle": "MSA — Ironcrown LLP",        "counterparty": "Ironcrown LLP",          "value": 320000,  "currency": "USD", "expiresAt": "2026-02-28T00:00:00Z", "daysToExpiry": 48,  "autoRenew": False, "noticePeriodDays": 45, "action": "NOTIFY",   "assigneeName": "James Whitfield"},
    {"id": "rn5", "contractId": "c_018", "contractTitle": "Vendor SLA — Brunswick Bar", "counterparty": "Brunswick Bar Ltd.",     "value": 180000,  "currency": "USD", "expiresAt": "2026-04-15T00:00:00Z", "daysToExpiry": 94,  "autoRenew": True,  "noticePeriodDays": 60, "action": "REVIEW",   "assigneeName": "Sofia Rodriguez"},
]

TEMPLATES = [
    {"id": "t1",  "name": "Master Services Agreement (v3)", "category": "MSA",              "language": "en-US", "usageCount": 42, "lastUsedAt": "2026-01-09T00:00:00Z", "owner": "Amara Devi",    "status": "PUBLISHED"},
    {"id": "t2",  "name": "Mutual NDA",                     "category": "NDA",              "language": "en-US", "usageCount": 128,"lastUsedAt": "2026-01-11T00:00:00Z", "owner": "James Whitfield","status": "PUBLISHED"},
    {"id": "t3",  "name": "Data Processing Agreement",      "category": "DPA",              "language": "en-US", "usageCount": 35, "lastUsedAt": "2026-01-08T00:00:00Z", "owner": "Priya Sharma",  "status": "PUBLISHED"},
    {"id": "t4",  "name": "Statement of Work — Consulting", "category": "SOW",              "language": "en-US", "usageCount": 76, "lastUsedAt": "2026-01-10T00:00:00Z", "owner": "Sofia Rodriguez","status": "PUBLISHED"},
    {"id": "t5",  "name": "Service Level Agreement",        "category": "SLA",              "language": "en-US", "usageCount": 18, "lastUsedAt": "2026-01-05T00:00:00Z", "owner": "Amara Devi",    "status": "PUBLISHED"},
    {"id": "t6",  "name": "Employment Offer Letter",        "category": "EMPLOYMENT",       "language": "en-US", "usageCount": 92, "lastUsedAt": "2026-01-11T00:00:00Z", "owner": "Sofia Rodriguez","status": "PUBLISHED"},
    {"id": "t7",  "name": "Software License (Perpetual)",   "category": "LICENSE",          "language": "en-US", "usageCount": 24, "lastUsedAt": "2025-12-20T00:00:00Z", "owner": "Nadia Al-Farsi","status": "PUBLISHED"},
    {"id": "t8",  "name": "Vendor Agreement — Standard",    "category": "VENDOR_AGREEMENT", "language": "en-US", "usageCount": 61, "lastUsedAt": "2026-01-07T00:00:00Z", "owner": "James Whitfield","status": "PUBLISHED"},
    {"id": "t9",  "name": "Partnership Agreement",          "category": "PARTNERSHIP",      "language": "en-US", "usageCount": 12, "lastUsedAt": "2025-11-15T00:00:00Z", "owner": "Maya Goldberg", "status": "DRAFT"},
    {"id": "t10", "name": "MSA — India Local (v1)",         "category": "MSA",              "language": "en-IN", "usageCount": 8,  "lastUsedAt": "2025-12-01T00:00:00Z", "owner": "Amara Devi",    "status": "PUBLISHED"},
]

CLAUSES = [
    {"id": "cl1",  "title": "Standard Limitation of Liability", "category": "LIABILITY",       "usageCount": 156, "lastUsedAt": "2026-01-11T00:00:00Z", "status": "APPROVED"},
    {"id": "cl2",  "title": "Force Majeure — Standard",         "category": "FORCE_MAJEURE",   "usageCount": 189, "lastUsedAt": "2026-01-10T00:00:00Z", "status": "APPROVED"},
    {"id": "cl3",  "title": "Change of Control — Assignment",   "category": "ASSIGNMENT",      "usageCount": 87,  "lastUsedAt": "2026-01-09T00:00:00Z", "status": "APPROVED"},
    {"id": "cl4",  "title": "MFN Clause — Preferred Customer",  "category": "COMMERCIAL",      "usageCount": 34,  "lastUsedAt": "2026-01-05T00:00:00Z", "status": "APPROVED"},
    {"id": "cl5",  "title": "Audit Rights — Annual",            "category": "COMPLIANCE",      "usageCount": 92,  "lastUsedAt": "2026-01-08T00:00:00Z", "status": "APPROVED"},
    {"id": "cl6",  "title": "Data Processing — GDPR",           "category": "PRIVACY",         "usageCount": 145, "lastUsedAt": "2026-01-11T00:00:00Z", "status": "APPROVED"},
    {"id": "cl7",  "title": "IP Assignment — Work for Hire",    "category": "IP",              "usageCount": 78,  "lastUsedAt": "2026-01-07T00:00:00Z", "status": "APPROVED"},
    {"id": "cl8",  "title": "Confidentiality — Mutual 5-year",  "category": "CONFIDENTIALITY", "usageCount": 234, "lastUsedAt": "2026-01-11T00:00:00Z", "status": "APPROVED"},
    {"id": "cl9",  "title": "Indemnification — Standard",       "category": "LIABILITY",       "usageCount": 132, "lastUsedAt": "2026-01-10T00:00:00Z", "status": "APPROVED"},
    {"id": "cl10", "title": "Termination for Convenience",      "category": "TERMINATION",     "usageCount": 118, "lastUsedAt": "2026-01-09T00:00:00Z", "status": "APPROVED"},
    {"id": "cl11", "title": "Arbitration — ICC London",         "category": "DISPUTE",         "usageCount": 45,  "lastUsedAt": "2025-12-28T00:00:00Z", "status": "APPROVED"},
    {"id": "cl12", "title": "Non-Solicitation — 12 month",      "category": "EMPLOYMENT",      "usageCount": 67,  "lastUsedAt": "2026-01-06T00:00:00Z", "status": "DRAFT"},
]

PLAYBOOK_POSITIONS = [
    {"id": "p1", "clauseCategory": "LIABILITY",       "issue": "Liability cap under 12 months fees",      "position": "PREFERRED", "guidance": "Push for cap of 24 months fees. Accept 12 months if strategic.",                                    "escalation": "None if ≥12m; escalate to GC if <12m", "createdBy": "Maya Goldberg",    "updatedAt": "2025-11-15T00:00:00Z"},
    {"id": "p2", "clauseCategory": "PRIVACY",         "issue": "Sub-processor consent — general",         "position": "REQUIRED",  "guidance": "General consent with 30-day objection window. Never accept prior consent per sub-processor.",     "escalation": "Auto-approve if standard; escalate to DPO otherwise", "createdBy": "Priya Sharma",     "updatedAt": "2025-12-01T00:00:00Z"},
    {"id": "p3", "clauseCategory": "ASSIGNMENT",      "issue": "Change of control assignment restriction","position": "REJECTED",  "guidance": "Never accept full restriction. Carve-out for affiliates and successor entities is mandatory.",   "escalation": "Escalate to GC if counterparty resists",                "createdBy": "Amara Devi",       "updatedAt": "2025-10-20T00:00:00Z"},
    {"id": "p4", "clauseCategory": "TERMINATION",     "issue": "Termination for convenience — notice",    "position": "PREFERRED", "guidance": "30-day notice for services, 60-day for enterprise deals.",                                          "escalation": "None",                                                   "createdBy": "James Whitfield",  "updatedAt": "2025-11-30T00:00:00Z"},
    {"id": "p5", "clauseCategory": "DISPUTE",         "issue": "Jurisdiction and venue",                  "position": "REQUIRED",  "guidance": "Delaware for US deals, England for EU/UK, Singapore for APAC.",                                    "escalation": "Escalate to GC for exceptions",                          "createdBy": "Maya Goldberg",    "updatedAt": "2025-09-15T00:00:00Z"},
    {"id": "p6", "clauseCategory": "COMMERCIAL",      "issue": "Price adjustment cadence",                "position": "PREFERRED", "guidance": "Annual adjustment tied to CPI, minimum 3%.",                                                        "escalation": "Escalate to CFO if flat renewal requested",              "createdBy": "Ethan Blackwell",  "updatedAt": "2025-12-10T00:00:00Z"},
    {"id": "p7", "clauseCategory": "IP",              "issue": "Background IP ownership",                 "position": "REQUIRED",  "guidance": "Client retains background IP; foreground jointly owned per SOW.",                                   "escalation": "Escalate to IP counsel",                                 "createdBy": "Nadia Al-Farsi",   "updatedAt": "2025-11-05T00:00:00Z"},
    {"id": "p8", "clauseCategory": "COMPLIANCE",      "issue": "Audit rights — frequency",                "position": "PREFERRED", "guidance": "Annual audit rights with 30-day notice; SOC 2 report acceptable for annual.",                       "escalation": "None",                                                   "createdBy": "Amara Devi",       "updatedAt": "2025-12-20T00:00:00Z"},
]

DILIGENCE_ROOMS = [
    {"id": "d1", "name": "Project Atlas — Zenith Diligence",   "status": "ACTIVE", "matterId": "m1", "documentsCount": 342, "openRequests": 12, "createdAt": "2025-12-15T00:00:00Z", "ownerName": "Maya Goldberg"},
    {"id": "d2", "name": "Nova Systems — Vendor Due Diligence","status": "ACTIVE", "matterId": "m2", "documentsCount": 89,  "openRequests": 4,  "createdAt": "2025-11-20T00:00:00Z", "ownerName": "Amara Devi"},
    {"id": "d3", "name": "Meridian — Q4 Compliance Review",    "status": "CLOSED", "matterId": "m3", "documentsCount": 156, "openRequests": 0,  "createdAt": "2025-10-01T00:00:00Z", "ownerName": "Priya Sharma"},
    {"id": "d4", "name": "IP Portfolio — Aegis Inventions",    "status": "ACTIVE", "matterId": "m5", "documentsCount": 245, "openRequests": 7,  "createdAt": "2025-08-15T00:00:00Z", "ownerName": "Nadia Al-Farsi"},
]

SIGNATURES = [
    {"id": "s1", "contractId": "c_001", "contractTitle": "MSA — Zenith Labs, Inc.",     "signers": 3, "signed": 2, "status": "IN_PROGRESS", "sentAt": "2026-01-08T14:00:00Z", "lastSignedAt": "2026-01-10T10:30:00Z"},
    {"id": "s2", "contractId": "c_005", "contractTitle": "SOW #4 — Palladian & Co.",    "signers": 2, "signed": 2, "status": "COMPLETED",   "sentAt": "2026-01-05T09:00:00Z", "lastSignedAt": "2026-01-06T16:45:00Z"},
    {"id": "s3", "contractId": "c_006", "contractTitle": "Employment — J. Chen",        "signers": 2, "signed": 2, "status": "COMPLETED",   "sentAt": "2026-01-02T11:00:00Z", "lastSignedAt": "2026-01-03T14:20:00Z"},
    {"id": "s4", "contractId": "c_016", "contractTitle": "Employment — S. Rodriguez",   "signers": 2, "signed": 1, "status": "IN_PROGRESS", "sentAt": "2026-01-10T15:00:00Z", "lastSignedAt": "2026-01-11T09:15:00Z"},
    {"id": "s5", "contractId": "c_011", "contractTitle": "Vendor Agreement — Heron",    "signers": 3, "signed": 0, "status": "AWAITING",    "sentAt": "2026-01-11T08:00:00Z", "lastSignedAt": None},
]

SKILLS = [
    {"id": "sk1", "name": "MSA drafting",           "category": "DRAFTING",  "level": "EXPERT",     "usageCount": 340, "lastUsedAt": "2026-01-11T00:00:00Z"},
    {"id": "sk2", "name": "Redline enforcement",    "category": "REDLINE",   "level": "EXPERT",     "usageCount": 892, "lastUsedAt": "2026-01-11T00:00:00Z"},
    {"id": "sk3", "name": "Statutory research",     "category": "RESEARCH",  "level": "EXPERT",     "usageCount": 234, "lastUsedAt": "2026-01-10T00:00:00Z"},
    {"id": "sk4", "name": "Obligation extraction",  "category": "EXTRACTION","level": "PROFICIENT", "usageCount": 156, "lastUsedAt": "2026-01-09T00:00:00Z"},
    {"id": "sk5", "name": "Risk scoring",           "category": "ANALYSIS",  "level": "PROFICIENT", "usageCount": 445, "lastUsedAt": "2026-01-11T00:00:00Z"},
    {"id": "sk6", "name": "Precedent citation",     "category": "RESEARCH",  "level": "EXPERT",     "usageCount": 89,  "lastUsedAt": "2026-01-08T00:00:00Z"},
]

NOTIFICATIONS = [
    {"id": "nt1", "type": "APPROVAL_REQUEST",   "title": "David Chen submitted MSA — Zenith Labs for legal review",           "read": False, "createdAt": "2026-01-11T09:20:00Z", "linkTo": "/approvals"},
    {"id": "nt2", "type": "OBLIGATION_OVERDUE", "title": "Uptime attestation for Vendor SLA — Aegis Cloud is 6 days overdue", "read": False, "createdAt": "2026-01-11T08:00:00Z", "linkTo": "/obligations"},
    {"id": "nt3", "type": "SIGNATURE",          "title": "Employment — S. Rodriguez was signed by S. Rodriguez",              "read": False, "createdAt": "2026-01-11T09:15:00Z", "linkTo": "/signatures"},
    {"id": "nt4", "type": "NEGOTIATION",        "title": "Meridian Financial replied on NDA — round 2",                        "read": True,  "createdAt": "2026-01-10T16:45:00Z", "linkTo": "/negotiations"},
    {"id": "nt5", "type": "RENEWAL",            "title": "Vendor SLA — Aegis Cloud expires in 14 days",                        "read": True,  "createdAt": "2026-01-10T10:00:00Z", "linkTo": "/renewals"},
]

ACTIVITY_FEED = [
    {"id": "ev1", "actorId": "u4", "actorName": "James Whitfield", "actorInitials": "JW", "verb": "signed",          "entityType": "CONTRACT",  "entityId": "c_006", "entityTitle": "Employment — J. Chen",       "secondary": None,                          "createdAt": "2026-01-11T09:45:00Z"},
    {"id": "ev2", "actorId": "u1", "actorName": "Maya Goldberg",   "actorInitials": "MG", "verb": "approved",        "entityType": "APPROVAL",  "entityId": "a6",    "entityTitle": "MSA — Nova Systems Renewal", "secondary": "2 days ahead of SLA",         "createdAt": "2026-01-11T08:30:00Z"},
    {"id": "ev3", "actorId": "u3", "actorName": "Amara Devi",      "actorInitials": "AD", "verb": "commented on",    "entityType": "CONTRACT",  "entityId": "c_001", "entityTitle": "MSA — Zenith Labs, Inc.",    "secondary": "3 new redlines on Section 8",  "createdAt": "2026-01-11T07:15:00Z"},
    {"id": "ev4", "actorId": "u7", "actorName": "Priya Sharma",    "actorInitials": "PS", "verb": "uploaded",        "entityType": "CONTRACT",  "entityId": "c_014", "entityTitle": "DPA — Meridian Financial",   "secondary": "GDPR sub-processor annex",     "createdAt": "2026-01-10T18:20:00Z"},
    {"id": "ev5", "actorId": "u5", "actorName": "Sofia Rodriguez", "actorInitials": "SR", "verb": "requested review","entityType": "REQUEST",   "entityId": "r4",    "entityTitle": "Employment amendment",       "secondary": None,                          "createdAt": "2026-01-10T14:00:00Z"},
    {"id": "ev6", "actorId": "u1", "actorName": "Maya Goldberg",   "actorInitials": "MG", "verb": "created matter",  "entityType": "MATTER",    "entityId": "m3",    "entityTitle": "GDPR Response — Meridian",   "secondary": "High priority · 6 obligations", "createdAt": "2026-01-10T10:00:00Z"},
    {"id": "ev7", "actorId": "u10","actorName": "Nadia Al-Farsi",  "actorInitials": "NA", "verb": "published",       "entityType": "TEMPLATE",  "entityId": "t7",    "entityTitle": "Software License (Perpetual)","secondary": "v3.1 · replaces v3.0",         "createdAt": "2026-01-09T16:00:00Z"},
    {"id": "ev8", "actorId": "u3", "actorName": "Amara Devi",      "actorInitials": "AD", "verb": "updated playbook","entityType": "PLAYBOOK",  "entityId": "p1",    "entityTitle": "Liability cap position",     "secondary": None,                          "createdAt": "2026-01-09T11:30:00Z"},
]

INTEGRATIONS = [
    {"id": "int1", "provider": "SLACK",           "name": "Slack",              "status": "CONNECTED",    "connectedAt": "2025-11-01T00:00:00Z", "connectedBy": "Maya Goldberg"},
    {"id": "int2", "provider": "GOOGLE_DRIVE",    "name": "Google Drive",       "status": "CONNECTED",    "connectedAt": "2025-11-15T00:00:00Z", "connectedBy": "Amara Devi"},
    {"id": "int3", "provider": "MICROSOFT_365",   "name": "Microsoft 365",      "status": "NOT_CONNECTED","connectedAt": None,                   "connectedBy": None},
    {"id": "int4", "provider": "SALESFORCE",      "name": "Salesforce",         "status": "CONNECTED",    "connectedAt": "2025-12-01T00:00:00Z", "connectedBy": "Maya Goldberg"},
    {"id": "int5", "provider": "DOCUSIGN",        "name": "DocuSign (import)",  "status": "NOT_CONNECTED","connectedAt": None,                   "connectedBy": None},
    {"id": "int6", "provider": "NETSUITE",        "name": "NetSuite",           "status": "PENDING",      "connectedAt": None,                   "connectedBy": "Ethan Blackwell"},
]

# ─── Auth helpers ─────────────────────────────────────────────────────────────

DEMO_TOKEN = "demo-lawyeros-jwt-token"

def make_jwt(user_id: str) -> str:
    """Return an opaque token that includes the user id (base64-encoded)."""
    payload = {"sub": user_id, "exp": int(time.time()) + 3600, "iat": int(time.time())}
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")

# ─── Pydantic models ─────────────────────────────────────────────────────────

class LoginBody(BaseModel):
    email: str
    password: str

class RegisterBody(BaseModel):
    email: str
    password: str
    name: str
    orgName: str

class ResetBody(BaseModel):
    email: str

class RefreshBody(BaseModel):
    refreshToken: str

# ─── Root health check ───────────────────────────────────────────────────────

@app.get("/api/")
@app.get("/api")
def root_health() -> dict[str, Any]:
    return {"service": "LawyerOS Mock API", "version": "0.1.0", "status": "healthy"}

@app.get("/api/health")
@app.get("/api/v1/health")
def health() -> dict[str, Any]:
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}

# ─── Auth ─────────────────────────────────────────────────────────────────────

@app.post("/api/v1/auth/login")
def auth_login(body: LoginBody) -> dict[str, Any]:
    """Any credentials that look like an email work — this is a demo."""
    if "@" not in body.email:
        raise HTTPException(status_code=400, detail="Invalid email")
    user = {**DEMO_USER, "email": body.email, "name": body.email.split("@")[0].replace(".", " ").title()}
    return {
        "user": user,
        "accessToken": make_jwt(user["id"]),
        "refreshToken": make_jwt(user["id"] + "_r"),
    }

@app.post("/api/v1/auth/register")
def auth_register(body: RegisterBody) -> dict[str, Any]:
    if "@" not in body.email:
        raise HTTPException(status_code=400, detail="Invalid email")
    user = {**DEMO_USER, "email": body.email, "name": body.name}
    return {
        "user": user,
        "accessToken": make_jwt(user["id"]),
        "refreshToken": make_jwt(user["id"] + "_r"),
    }

@app.post("/api/v1/auth/refresh")
def auth_refresh(body: RefreshBody) -> dict[str, Any]:
    return {"accessToken": make_jwt(DEMO_USER["id"]), "refreshToken": make_jwt(DEMO_USER["id"] + "_r")}

@app.post("/api/v1/auth/logout")
def auth_logout() -> dict[str, Any]:
    return {"ok": True}

@app.get("/api/v1/auth/me")
@app.get("/api/v1/users/me")
def me() -> dict[str, Any]:
    return DEMO_USER

@app.post("/api/v1/auth/request-password-reset")
def request_password_reset(body: ResetBody) -> dict[str, Any]:
    return {"ok": True}

# ─── Dashboard ───────────────────────────────────────────────────────────────

@app.get("/api/v1/dashboard")
def dashboard() -> dict[str, Any]:
    active = [c for c in CONTRACTS if c["status"] in ("APPROVED", "PENDING_SIGNATURE", "EXECUTED")]
    expiring = [c for c in CONTRACTS if c.get("daysToExpiry") is not None and 0 <= (c["daysToExpiry"] or 999) <= 30]
    return {
        "activeContracts": len(active),
        "openRequests": len([r for r in REQUESTS if r["status"] in ("OPEN", "IN_REVIEW", "IN_PROGRESS")]),
        "pendingApprovals": len([a for a in APPROVALS if a["status"] == "PENDING" and a["assigneeId"] == DEMO_USER["id"]]),
        "orgPendingApprovals": len([a for a in APPROVALS if a["status"] == "PENDING"]),
        "expiringSoon": len(expiring),
        "recentActivity": ACTIVITY_FEED,
        "yourDay": {
            "total": 3,
            "draftsInProgress": 2,
            "chips": [
                {"key": "approvals",    "count": 1, "label": "approval",    "accent": "amber", "verb": "awaits your decision",  "to": "/approvals",   "icon": "check-square"},
                {"key": "requests",     "count": 1, "label": "request",     "accent": "blue",  "verb": "needs triage",           "to": "/requests",    "icon": "clipboard"},
                {"key": "obligations",  "count": 1, "label": "obligation",  "accent": "red",   "verb": "is overdue",             "to": "/obligations", "icon": "clock"},
            ],
        },
    }

# ─── Contracts ───────────────────────────────────────────────────────────────

def _paged(items: list, limit: int, offset: int = 0) -> dict[str, Any]:
    return {"items": items[offset:offset + limit], "total": len(items), "limit": limit, "offset": offset}

@app.get("/api/v1/contracts")
def contracts_list(limit: int = 50, offset: int = 0, status: Optional[str] = None, type: Optional[str] = None, counterpartyId: Optional[str] = None, expiringWithinDays: Optional[int] = None) -> dict[str, Any]:
    items = list(CONTRACTS)
    if status:
        items = [c for c in items if c["status"] == status]
    if type:
        items = [c for c in items if c["type"] == type]
    if counterpartyId:
        items = [c for c in items if c["counterpartyId"] == counterpartyId]
    if expiringWithinDays is not None:
        items = [c for c in items if c.get("daysToExpiry") is not None and 0 <= (c["daysToExpiry"] or 999) <= expiringWithinDays]
    # ContractsPage reads either `data.data` (from /search/advanced) or the
    # top-level list. Return the array directly for the plain-list case.
    return {"data": items[offset:offset + limit], "items": items[offset:offset + limit], "total": len(items), "limit": limit, "offset": offset}

@app.get("/api/v1/contracts/{cid}")
def contract_detail(cid: str) -> dict[str, Any]:
    c = next((x for x in CONTRACTS if x["id"] == cid), None)
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {**c, "clauses": [{"id": f"cl_{i}", "title": t, "text": f"Clause text placeholder for {t}"} for i, t in enumerate(["Confidentiality", "Term", "Liability", "Indemnification", "Termination"])]}

# ─── Matters ─────────────────────────────────────────────────────────────────

@app.get("/api/v1/matters")
def matters_list(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    return _paged(MATTERS, limit, offset)

@app.get("/api/v1/matters/{mid}")
def matter_detail(mid: str) -> dict[str, Any]:
    m = next((x for x in MATTERS if x["id"] == mid), None)
    if not m:
        raise HTTPException(status_code=404, detail="Matter not found")
    return {**m, "contracts": [c for c in CONTRACTS[:m["contractsCount"]]], "obligations": OBLIGATIONS[:m["obligationsCount"]]}

# ─── Negotiations ────────────────────────────────────────────────────────────

@app.get("/api/v1/negotiations")
def negotiations_list(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    return _paged(NEGOTIATIONS, limit, offset)

# ─── Approvals ───────────────────────────────────────────────────────────────

@app.get("/api/v1/approvals")
@app.get("/api/v1/approvals/all")
def approvals_list(limit: int = 50, offset: int = 0, status: Optional[str] = None) -> dict[str, Any]:
    items = list(APPROVALS)
    if status:
        items = [a for a in items if a["status"] == status]
    return _paged(items, limit, offset)

@app.get("/api/v1/approvals/my-queue")
def approvals_my_queue(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    items = [a for a in APPROVALS if a["assigneeId"] == DEMO_USER["id"] and a["status"] == "PENDING"]
    return _paged(items, limit, offset)

@app.get("/api/v1/approvals/notifications")
def approvals_notifications(limit: int = 10) -> dict[str, Any]:
    return {"items": NOTIFICATIONS[:limit], "total": len(NOTIFICATIONS)}

@app.get("/api/v1/approvals/workflows")
def approvals_workflows() -> dict[str, Any]:
    return {"items": [
        {"id": "w1", "name": "Standard MSA workflow", "steps": ["Legal review", "Finance approval", "Exec approval"], "activeInstances": 12},
        {"id": "w2", "name": "NDA fast-track",         "steps": ["Legal review"],                                       "activeInstances": 34},
        {"id": "w3", "name": "DPA privacy workflow",   "steps": ["Legal review", "Privacy sign-off", "DPO review"],     "activeInstances": 7},
    ]}

# ─── Requests ────────────────────────────────────────────────────────────────

@app.get("/api/v1/requests")
def requests_list(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    return _paged(REQUESTS, limit, offset)

@app.get("/api/v1/requests/counts")
def requests_counts() -> dict[str, Any]:
    return {
        "open":       len([r for r in REQUESTS if r["status"] == "OPEN"]),
        "inReview":   len([r for r in REQUESTS if r["status"] == "IN_REVIEW"]),
        "inProgress": len([r for r in REQUESTS if r["status"] == "IN_PROGRESS"]),
        "completed":  len([r for r in REQUESTS if r["status"] == "COMPLETED"]),
    }

# ─── Obligations ─────────────────────────────────────────────────────────────

@app.get("/api/v1/obligations")
def obligations_list(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    return _paged(OBLIGATIONS, limit, offset)

@app.get("/api/v1/obligations/stats")
def obligations_stats() -> dict[str, Any]:
    return {
        "total":     len(OBLIGATIONS),
        "pending":   len([o for o in OBLIGATIONS if o["status"] == "PENDING"]),
        "overdue":   len([o for o in OBLIGATIONS if o["status"] == "OVERDUE"]),
        "completed": len([o for o in OBLIGATIONS if o["status"] == "COMPLETED"]),
    }

# ─── Renewals ────────────────────────────────────────────────────────────────

@app.get("/api/v1/renewals")
def renewals_list(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    return _paged(RENEWALS, limit, offset)

@app.get("/api/v1/renewals/stats")
def renewals_stats() -> dict[str, Any]:
    return {
        "total":     len(RENEWALS),
        "next30d":   len([r for r in RENEWALS if r["daysToExpiry"] <= 30]),
        "next60d":   len([r for r in RENEWALS if 30 < r["daysToExpiry"] <= 60]),
        "next90d":   len([r for r in RENEWALS if 60 < r["daysToExpiry"] <= 90]),
        "totalValue": sum(r["value"] for r in RENEWALS),
    }

# ─── Counterparties ──────────────────────────────────────────────────────────

@app.get("/api/v1/counterparties")
def counterparties_list(limit: int = 50, offset: int = 0, orderBy: Optional[str] = None) -> dict[str, Any]:
    items = list(COUNTERPARTIES)
    if orderBy == "contractCount":
        items = sorted(items, key=lambda x: -x["contractCount"])
    return _paged(items, limit, offset)

@app.get("/api/v1/counterparties/{cid}")
def counterparty_detail(cid: str) -> dict[str, Any]:
    c = next((x for x in COUNTERPARTIES if x["id"] == cid), None)
    if not c:
        raise HTTPException(status_code=404, detail="Counterparty not found")
    contracts_for = [x for x in CONTRACTS if x["counterpartyId"] == cid]
    return {**c, "contracts": contracts_for}

# ─── Templates + Clauses + Playbook ──────────────────────────────────────────

@app.get("/api/v1/templates")
def templates_list(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    return _paged(TEMPLATES, limit, offset)

@app.get("/api/v1/clauses")
def clauses_list(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    # Return the raw list — the ClausesPage consumer expects an array,
    # not the {items,total} envelope.
    return {"items": CLAUSES, "clauses": CLAUSES, "total": len(CLAUSES), "limit": limit, "offset": offset}

@app.get("/api/v1/clauses/categories")
def clauses_categories() -> dict[str, Any]:
    cats = sorted(set(c["category"] for c in CLAUSES))
    return {"items": [{"category": cat, "count": len([c for c in CLAUSES if c["category"] == cat])} for cat in cats]}

@app.get("/api/v1/playbook/positions")
def playbook_positions_list(limit: int = 100, offset: int = 0) -> dict[str, Any]:
    return _paged(PLAYBOOK_POSITIONS, limit, offset)

# ─── Diligence + Signatures ──────────────────────────────────────────────────

@app.get("/api/v1/diligence")
def diligence_list(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    return _paged(DILIGENCE_ROOMS, limit, offset)

@app.get("/api/v1/diligence/{did}")
def diligence_detail(did: str) -> dict[str, Any]:
    d = next((x for x in DILIGENCE_ROOMS if x["id"] == did), None)
    if not d:
        raise HTTPException(status_code=404, detail="Diligence room not found")
    return d

@app.get("/api/v1/signatures")
@app.get("/api/v1/signature-requests")
def signatures_list(limit: int = 50, offset: int = 0, status: Optional[str] = None) -> dict[str, Any]:
    items = []
    signer_names = [
        [("Alex Kaur", "alex@zenith.io"), ("Maya Goldberg", "maya@lawyeros.ai"), ("Legal Ops", "legal@zenith.io")],
        [("Sofia Rodriguez", "sofia@aegiscloud.com"), ("James Whitfield", "james@aegiscloud.com")],
        [("J. Chen", "jchen@aegiscloud.com"), ("Sofia Rodriguez", "sofia@aegiscloud.com")],
        [("S. Rodriguez", "sr@aegiscloud.com"), ("Maya Goldberg", "maya@lawyeros.ai")],
        [("Heron Ops", "ops@heron.com"), ("Amara Devi", "amara@aegiscloud.com"), ("Ethan Blackwell", "ethan@aegiscloud.com")],
    ]
    status_map = {"IN_PROGRESS": "PENDING", "COMPLETED": "COMPLETED", "AWAITING": "PENDING"}
    for i, s in enumerate(SIGNATURES):
        api_status = status_map.get(s["status"], "PENDING")
        signers_data = signer_names[i % len(signer_names)]
        signers = []
        for j, (name, email) in enumerate(signers_data):
            sig_status = "SIGNED" if j < s["signed"] else "PENDING"
            signers.append({
                "id": f"sg_{s['id']}_{j}",
                "name": name,
                "email": email,
                "role": None,
                "status": sig_status,
                "signedAt": s.get("lastSignedAt") if sig_status == "SIGNED" else None,
                "signOrder": j,
            })
        items.append({
            "id": s["id"],
            "status": api_status,
            "signOrder": "ANY",
            "createdAt": s["sentAt"],
            "completedAt": s.get("lastSignedAt") if api_status == "COMPLETED" else None,
            "voidedAt": None,
            "expiresAt": None,
            "signedCount": s["signed"],
            "totalSigners": s["signers"],
            "signers": signers,
            "contract": {"id": s["contractId"], "title": s["contractTitle"], "type": "MSA", "counterpartyName": None},
        })
    if status and status != "ALL":
        items = [x for x in items if x["status"] == status]
    return _paged(items, limit, offset)

@app.get("/api/v1/contracts/{cid}/signature-requests")
def contract_signature_requests(cid: str) -> dict[str, Any]:
    return {"items": []}

# ─── Analytics ───────────────────────────────────────────────────────────────

@app.get("/api/v1/analytics/summary")
def analytics_summary(days: int = 30) -> dict[str, Any]:
    active = [c for c in CONTRACTS if c["status"] in ("APPROVED", "PENDING_SIGNATURE", "EXECUTED")]
    executed = [c for c in CONTRACTS if c["status"] == "EXECUTED"]
    return {
        "totalContracts":       len(CONTRACTS),
        "executedContracts":    len(executed),
        "pendingApprovals":     len([a for a in APPROVALS if a["status"] == "PENDING"]),
        "expiringSoon":         len([c for c in CONTRACTS if c.get("daysToExpiry") is not None and 0 <= (c["daysToExpiry"] or 999) <= 30]),
        "highRiskOpen":         len([c for c in CONTRACTS if c.get("riskScore", 0) > 0.7]),
        "executedTotalValue":   sum(c["value"] for c in executed),
        "executedTotalCurrency":"USD",
        "cycleTimeAvgDays":     8.3,
        "cycleTimeMedianDays":  6.0,
        "approvalAcceptanceRate": 0.94,
        "onTimeExecutionRate":    0.87,
        "withinTargetDays":       10,
        "windowDays":             days,
    }

@app.get("/api/v1/analytics/timeseries")
def analytics_timeseries(metric: str = "contractsSigned", days: int = 30) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    rng = random.Random(metric)
    # AnalyticsPage expects series items with `month`, `label`, `created`, `executed`.
    months = 6
    series = []
    for i in range(months, -1, -1):
        month_date = now.replace(day=1) - timedelta(days=i * 30)
        series.append({
            "month": month_date.strftime("%Y-%m"),
            "label": month_date.strftime("%b"),
            "created":  rng.randint(6, 22),
            "executed": rng.randint(4, 18),
        })
    return {"series": series}

@app.get("/api/v1/analytics/distributions")
def analytics_distributions() -> dict[str, Any]:
    # AnalyticsPage expects `byStatus`/`byType`/`byRisk` with `{ key, count }` and byRisk with label.
    return {
        "byType": [
            {"key": "MSA",              "count": 18},
            {"key": "NDA",              "count": 42},
            {"key": "SOW",              "count": 28},
            {"key": "DPA",              "count": 12},
            {"key": "SLA",              "count": 8},
            {"key": "EMPLOYMENT",       "count": 15},
            {"key": "LICENSE",          "count": 6},
            {"key": "VENDOR_AGREEMENT", "count": 22},
        ],
        "byStatus": [
            {"key": "DRAFT",             "count": 8},
            {"key": "PENDING_REVIEW",    "count": 14},
            {"key": "UNDER_NEGOTIATION", "count": 6},
            {"key": "PENDING_APPROVAL",  "count": 9},
            {"key": "APPROVED",          "count": 12},
            {"key": "PENDING_SIGNATURE", "count": 7},
            {"key": "EXECUTED",          "count": 94},
            {"key": "EXPIRED",           "count": 3},
        ],
        "byRisk": [
            {"key": "LOW",    "label": "Low",    "count": 78},
            {"key": "MEDIUM", "label": "Medium", "count": 32},
            {"key": "HIGH",   "label": "High",   "count": 8},
        ],
    }

@app.get("/api/v1/analytics/top-counterparties")
def analytics_top_counterparties(limit: int = 10) -> dict[str, Any]:
    items = sorted(COUNTERPARTIES, key=lambda x: -x["totalValue"])[:limit]
    # AnalyticsPage expects `data` array with counterparty/count/value/currency.
    return {"data": [
        {"counterparty": c["name"], "counterpartyId": c["id"], "count": c["contractCount"], "value": c["totalValue"], "currency": "USD"}
        for c in items
    ]}

# ─── Team + Users + Admin ────────────────────────────────────────────────────

@app.get("/api/v1/team/workload")
def team_workload() -> dict[str, Any]:
    return {"items": [
        {**m, "openApprovals": random.Random(m["id"]).randint(0, 6), "openRequests": random.Random(m["id"]).randint(0, 4), "activeContracts": random.Random(m["id"]).randint(2, 20)}
        for m in TEAM_MEMBERS[:8]
    ]}

@app.get("/api/v1/users")
def users_list(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    return _paged(TEAM_MEMBERS, limit, offset)

@app.get("/api/v1/admin/users/roles")
def admin_users_roles() -> dict[str, Any]:
    return {"items": ["ADMIN", "LEGAL_OPS", "COUNSEL", "REVIEWER", "REQUESTER", "APPROVER", "VIEWER"]}

@app.get("/api/v1/organization")
def organization() -> dict[str, Any]:
    return DEMO_ORG

@app.get("/api/v1/skills")
def skills_list() -> dict[str, Any]:
    return {"items": SKILLS, "total": len(SKILLS)}

# ─── Admin — integrations, AI, webhooks ──────────────────────────────────────

@app.get("/api/v1/admin/integrations/health")
def admin_int_health() -> dict[str, Any]:
    return {"items": INTEGRATIONS}

@app.get("/api/v1/admin/integrations/slack")
def admin_int_slack() -> dict[str, Any]:
    return {"connected": True, "workspaceName": "Aegis Cloud", "connectedAt": "2025-11-01T00:00:00Z"}

@app.get("/api/v1/admin/integrations/api-keys")
def admin_int_keys() -> dict[str, Any]:
    return {"items": [
        {"id": "k1", "name": "Salesforce sync", "prefix": "lo_live_a1b2", "createdAt": "2025-11-01T00:00:00Z", "lastUsedAt": "2026-01-11T00:00:00Z"},
        {"id": "k2", "name": "NetSuite import", "prefix": "lo_live_c3d4", "createdAt": "2025-12-01T00:00:00Z", "lastUsedAt": "2026-01-10T00:00:00Z"},
    ]}

@app.get("/api/v1/admin/integrations/webhooks")
def admin_int_webhooks() -> dict[str, Any]:
    return {"items": [
        {"id": "wh1", "url": "https://api.aegiscloud.com/lawyeros/webhook", "events": ["contract.signed", "obligation.overdue"], "status": "ACTIVE",   "createdAt": "2025-11-01T00:00:00Z", "lastDeliveryAt": "2026-01-11T09:20:00Z"},
        {"id": "wh2", "url": "https://slack.com/api/incoming/aegis",         "events": ["approval.requested"],                     "status": "ACTIVE",   "createdAt": "2025-11-15T00:00:00Z", "lastDeliveryAt": "2026-01-11T09:20:00Z"},
    ]}

@app.get("/api/v1/admin/integrations/events")
def admin_int_events() -> dict[str, Any]:
    return {"items": [
        {"event": "contract.signed",   "count": 47},
        {"event": "obligation.overdue","count": 12},
        {"event": "approval.requested","count": 89},
        {"event": "approval.decided",  "count": 76},
        {"event": "renewal.due",       "count": 23},
    ]}

@app.get("/api/v1/admin/ai/settings")
def admin_ai_settings() -> dict[str, Any]:
    return {"defaultProvider": "anthropic", "monthlyCapUsd": 500.0, "usageMtdUsd": 187.42}

@app.get("/api/v1/admin/ai/keys")
def admin_ai_keys() -> dict[str, Any]:
    return {"items": [
        {"provider": "anthropic", "connected": True,  "keyPrefix": "sk-ant-a1b2", "connectedAt": "2025-11-01T00:00:00Z"},
        {"provider": "openai",    "connected": True,  "keyPrefix": "sk-a3c4",     "connectedAt": "2025-11-01T00:00:00Z"},
        {"provider": "google",    "connected": False, "keyPrefix": None,          "connectedAt": None},
    ]}

@app.get("/api/v1/admin/ai/usage")
def admin_ai_usage() -> dict[str, Any]:
    return {"items": [
        {"date": "2026-01-05", "usd": 12.4},
        {"date": "2026-01-06", "usd": 18.7},
        {"date": "2026-01-07", "usd": 24.1},
        {"date": "2026-01-08", "usd": 21.3},
        {"date": "2026-01-09", "usd": 28.9},
        {"date": "2026-01-10", "usd": 31.6},
        {"date": "2026-01-11", "usd": 22.8},
    ], "total": 159.8}

@app.get("/api/v1/admin/ai/cap-status")
def admin_ai_cap_status() -> dict[str, Any]:
    return {"capUsd": 500.0, "usedUsd": 187.42, "percent": 37.5, "willTrigger": False}

@app.get("/api/v1/admin/ai/audit")
def admin_ai_audit() -> dict[str, Any]:
    return {"items": [
        {"id": "au1", "actor": "Maya Goldberg", "action": "AI redline", "provider": "anthropic", "model": "claude-sonnet-4", "tokensIn": 4210, "tokensOut": 1820, "costUsd": 0.42, "createdAt": "2026-01-11T09:15:00Z"},
        {"id": "au2", "actor": "Amara Devi",    "action": "Clause extraction", "provider": "openai", "model": "gpt-5", "tokensIn": 3120, "tokensOut": 950, "costUsd": 0.28, "createdAt": "2026-01-11T08:30:00Z"},
    ]}

# ─── Webhooks + Search + Field defs ──────────────────────────────────────────

@app.get("/api/v1/webhooks")
def webhooks() -> dict[str, Any]:
    return {"items": []}

@app.get("/api/v1/webhooks/api-keys")
def webhooks_keys() -> dict[str, Any]:
    return {"items": []}

@app.get("/api/v1/field-definitions")
@app.get("/api/v1/settings/field-definitions")
def field_defs() -> dict[str, Any]:
    return {"items": [
        {"id": "fd1", "key": "renewalNoticeDays", "label": "Renewal notice (days)", "type": "NUMBER", "required": True},
        {"id": "fd2", "key": "governingLaw",      "label": "Governing law",         "type": "STRING", "required": True},
        {"id": "fd3", "key": "liabilityCap",      "label": "Liability cap",         "type": "MONEY",  "required": False},
    ]}

@app.get("/api/v1/search/facets")
def search_facets() -> dict[str, Any]:
    return {
        "types":         [{"key": t, "count": random.Random(t).randint(1, 40)} for t in ["MSA", "NDA", "SOW", "DPA", "SLA", "EMPLOYMENT", "LICENSE", "PARTNERSHIP", "VENDOR_AGREEMENT", "OTHER"]],
        "statuses":      [{"key": s, "count": random.Random(s).randint(1, 30)} for s in ["DRAFT", "PENDING_REVIEW", "UNDER_NEGOTIATION", "PENDING_APPROVAL", "APPROVED", "PENDING_SIGNATURE", "EXECUTED", "EXPIRED"]],
        "counterparties":[{"key": c["name"], "count": c["contractCount"]} for c in COUNTERPARTIES],
    }

@app.get("/api/v1/graph/overview")
def graph_overview() -> dict[str, Any]:
    return {
        "nodes": [
            *[{"id": c["id"], "label": c["name"], "type": "PARTY",    "size": c["contractCount"]} for c in COUNTERPARTIES[:8]],
            *[{"id": c["id"], "label": c["title"], "type": "CONTRACT", "size": 3} for c in CONTRACTS[:14]],
            *[{"id": m["id"], "label": m["name"], "type": "MATTER",   "size": 5} for m in MATTERS[:5]],
        ],
        "edges": [
            *[{"source": c["counterpartyId"], "target": c["id"], "type": "IS_PARTY_TO"} for c in CONTRACTS[:14]],
            *[{"source": MATTERS[0]["id"], "target": c["id"], "type": "PART_OF"} for c in CONTRACTS[:4]],
        ],
    }

# ─── Invoices ────────────────────────────────────────────────────────────────

@app.get("/api/v1/invoices/stats")
def invoices_stats() -> dict[str, Any]:
    return {"totalIssued": 4, "totalPaid": 3, "totalPending": 1, "totalOverdue": 0, "totalValue": 12800, "currency": "USD"}

# ─── Agent threads ───────────────────────────────────────────────────────────

@app.get("/api/v1/agent/threads")
def agent_threads(limit: int = 30) -> dict[str, Any]:
    return {"items": [
        {"id": "th1", "title": "Draft MSA against Zenith redline", "createdAt": "2026-01-11T09:00:00Z", "messagesCount": 12, "lastMessageAt": "2026-01-11T09:45:00Z"},
        {"id": "th2", "title": "Research: MFN clause enforcement", "createdAt": "2026-01-10T14:00:00Z", "messagesCount": 8,  "lastMessageAt": "2026-01-10T15:30:00Z"},
        {"id": "th3", "title": "Explain the Nova DPA amendment",   "createdAt": "2026-01-09T11:00:00Z", "messagesCount": 6,  "lastMessageAt": "2026-01-09T11:45:00Z"},
    ]}

# ─── Catch-all fallback ──────────────────────────────────────────────────────

@app.middleware("http")
async def catch_all(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        # Return empty successful shape for anything we don't handle — keeps
        # the demo UI from erroring out on missing endpoints while we're
        # still filling in the mock.
        if request.url.path.startswith("/api/"):
            return JSONResponse(content={"items": [], "total": 0, "message": str(e)}, status_code=200)
        raise
