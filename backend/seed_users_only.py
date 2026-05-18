"""Seed 20 demo users per spec Section 10 (workload routing via active_maps_count)."""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import sys

sys.path.insert(0, ".")
from config import settings
from core.security import get_password_hash

USERS = [
    {"emp_id": "EMP-INFOSEC-001", "name": "Priya Nair", "email": "priya.nair@canara.bank", "department_id": "DEPT-INFOSEC", "role": "admin", "active_maps_count": 2},
    {"emp_id": "EMP-INFOSEC-002", "name": "Rahul Mehta", "email": "rahul.mehta@canara.bank", "department_id": "DEPT-INFOSEC", "role": "employee", "active_maps_count": 1},
    {"emp_id": "EMP-INFOSEC-003", "name": "Arjun Kumar", "email": "arjun.kumar@canara.bank", "department_id": "DEPT-INFOSEC", "role": "employee", "active_maps_count": 0},
    {"emp_id": "EMP-IT-001", "name": "Rajesh Kumar", "email": "rajesh.kumar@canara.bank", "department_id": "DEPT-IT", "role": "admin", "active_maps_count": 1},
    {"emp_id": "EMP-IT-002", "name": "Ravi Kumar", "email": "ravi.kumar@canara.bank", "department_id": "DEPT-IT", "role": "employee", "active_maps_count": 2},
    {"emp_id": "EMP-COMP-001", "name": "Suresh Iyer", "email": "suresh.iyer@canara.bank", "department_id": "DEPT-COMPLIANCE", "role": "compliance_officer", "active_maps_count": 1},
    {"emp_id": "EMP-COMP-002", "name": "Anita Desai", "email": "anita.desai@canara.bank", "department_id": "DEPT-COMPLIANCE", "role": "employee", "active_maps_count": 0},
    {"emp_id": "EMP-RISK-001", "name": "Deepa Menon", "email": "deepa.menon@canara.bank", "department_id": "DEPT-RISK", "role": "auditor", "active_maps_count": 0},
    {"emp_id": "EMP-RISK-002", "name": "Vikram Singh", "email": "vikram.singh@canara.bank", "department_id": "DEPT-RISK", "role": "employee", "active_maps_count": 1},
    {"emp_id": "EMP-LEGAL-001", "name": "Meera Joshi", "email": "meera.joshi@canara.bank", "department_id": "DEPT-LEGAL", "role": "department_head", "active_maps_count": 1},
    {"emp_id": "EMP-LEGAL-002", "name": "Karan Patel", "email": "karan.patel@canara.bank", "department_id": "DEPT-LEGAL", "role": "employee", "active_maps_count": 0},
    {"emp_id": "EMP-OPS-001", "name": "Sanjay Reddy", "email": "sanjay.reddy@canara.bank", "department_id": "DEPT-OPS", "role": "department_head", "active_maps_count": 2},
    {"emp_id": "EMP-OPS-002", "name": "Priya Sharma", "email": "priya.sharma@canara.bank", "department_id": "DEPT-OPS", "role": "employee", "active_maps_count": 1},
    {"emp_id": "EMP-OPS-003", "name": "Nisha Gupta", "email": "nisha.gupta@canara.bank", "department_id": "DEPT-OPS", "role": "employee", "active_maps_count": 0},
    {"emp_id": "EMP-INFOSEC-004", "name": "Amit Verma", "email": "amit.verma@canara.bank", "department_id": "DEPT-INFOSEC", "role": "employee", "active_maps_count": 3},
    {"emp_id": "EMP-IT-003", "name": "Sneha Rao", "email": "sneha.rao@canara.bank", "department_id": "DEPT-IT", "role": "employee", "active_maps_count": 0},
    {"emp_id": "EMP-COMP-003", "name": "Rohit Nair", "email": "rohit.nair@canara.bank", "department_id": "DEPT-COMPLIANCE", "role": "employee", "active_maps_count": 2},
    {"emp_id": "EMP-LEGAL-003", "name": "Divya Iyer", "email": "divya.iyer@canara.bank", "department_id": "DEPT-LEGAL", "role": "employee", "active_maps_count": 1},
    {"emp_id": "EMP-RISK-003", "name": "Harish Pillai", "email": "harish.pillai@canara.bank", "department_id": "DEPT-RISK", "role": "employee", "active_maps_count": 0},
    {"emp_id": "EMP-INFOSEC-005", "name": "Lakshmi Devi", "email": "lakshmi.devi@canara.bank", "department_id": "DEPT-INFOSEC", "role": "department_head", "active_maps_count": 1},
]

TICKETS = [
    {"ticket_id": "JIRA-2026-0045", "title": "Firewall rule update", "status": "closed", "assignee": "EMP-IT-002", "linked_map": "MAP-2026-012", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
    {"ticket_id": "JIRA-2026-0056", "title": "Vuln scan remediation", "status": "in_progress", "assignee": "EMP-INFOSEC-003", "linked_map": "MAP-2026-013", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
    {"ticket_id": "JIRA-2026-0067", "title": "MFA rollout tracking", "status": "in_progress", "assignee": "EMP-INFOSEC-002", "linked_map": "MAP-2026-011", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
]

DEPARTMENTS = [
    {
        "department_id": "DEPT-INFOSEC",
        "name": "Information Security",
        "auto_assign_enabled": True,
        "head_employee_id": "EMP-INFOSEC-001",
        "escalation_chain": ["EMP-INFOSEC-001", "EMP-COMP-001"],
    },
    {
        "department_id": "DEPT-IT",
        "name": "IT Operations",
        "auto_assign_enabled": True,
        "head_employee_id": "EMP-IT-001",
        "escalation_chain": ["EMP-IT-001", "EMP-INFOSEC-001"],
    },
    {
        "department_id": "DEPT-COMPLIANCE",
        "name": "Compliance",
        "auto_assign_enabled": True,
        "head_employee_id": "EMP-COMP-001",
        "escalation_chain": ["EMP-COMP-001"],
    },
    {
        "department_id": "DEPT-LEGAL",
        "name": "Legal & Regulatory",
        "auto_assign_enabled": True,
        "head_employee_id": "EMP-LEGAL-001",
        "escalation_chain": ["EMP-LEGAL-001", "EMP-COMP-001"],
    },
    {
        "department_id": "DEPT-OPS",
        "name": "Operations",
        "auto_assign_enabled": True,
        "head_employee_id": "EMP-OPS-001",
        "escalation_chain": ["EMP-OPS-001"],
    },
    {
        "department_id": "DEPT-RISK",
        "name": "Risk Management",
        "auto_assign_enabled": False,
        "head_employee_id": "EMP-RISK-001",
        "escalation_chain": ["EMP-RISK-001"],
    },
]


async def main():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.suraksha_maps
    pwd = get_password_hash("Demo@123")

    for d in DEPARTMENTS:
        await db.departments.update_one({"department_id": d["department_id"]}, {"$set": d}, upsert=True)

    for u in USERS:
        doc = {
            **u,
            "hashed_password": pwd,
            "status": "active",
        }
        await db.users.update_one({"emp_id": u["emp_id"]}, {"$set": doc}, upsert=True)

    for t in TICKETS:
        await db.tickets.update_one({"ticket_id": t["ticket_id"]}, {"$set": t}, upsert=True)

    print(f"Upserted {len(USERS)} users, {len(DEPARTMENTS)} departments, {len(TICKETS)} tickets.")


if __name__ == "__main__":
    asyncio.run(main())
