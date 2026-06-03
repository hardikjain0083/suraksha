import logging
from datetime import datetime
from typing import List, Dict, Any
from database import db
from services.compliance_graph import run_compliance_pipeline

logger = logging.getLogger(__name__)

# Mock RSS/JSON feed data source
MOCK_FEEDS = [
    {
        "guid": "feed_certin_2026_001",
        "title": "CERT-In Advisory CIAD-2026-0012: Critical Vulnerability in Tomcat and Oracle",
        "issuer": "CERT-In",
        "content": """
INDIAN COMPUTER EMERGENCY RESPONSE TEAM (CERT-In)
Advisory ID: CIAD-2026-0012
Subject: Vulnerabilities in Apache Tomcat Server and Oracle Database Server
Severity: Critical

Systems Affected:
- Apache Tomcat versions 9.0.0 through 9.0.40
- Oracle Database Server version 19c

Description:
A remote code execution vulnerability (CVE-2026-2002) has been detected in Apache Tomcat server instances. Remote attackers can exploit this by sending crafted HTTP requests, bypassing authentication and running arbitrary commands.
A privilege escalation vulnerability (CVE-2026-1001) affects Oracle Database Server, allowing authenticated local users to run database processes with elevated permissions.

Solution:
1. Upgrade Apache Tomcat to version 9.0.41 or higher immediately.
2. Apply the Oracle Critical Patch Update (CPU) for January 2026 on all database servers.
3. Update firewall rules to restrict access to port 8080 and 1521.
4. Perform an internal vendor audit on third-party security components.
""",
        "pub_date": "2026-06-03T10:00:00Z"
    },
    {
        "guid": "feed_rbi_2026_002",
        "title": "RBI Notification: Master Direction on MFA remote session validation controls",
        "issuer": "RBI",
        "content": """
RESERVE BANK OF INDIA
DEPARTMENT OF REGULATION

RBI/2026-27/45
Ref.No.DoR.ORG.REC.12/21.04.018/2026-27

June 03, 2026

The Chairman / Managing Director / CEO
All Scheduled Commercial Banks

Subject: Master Direction on Cyber Security Controls and Remote Access Systems

1. In exercise of powers conferred under Section 35A of the Banking Regulation Act, 1949, the RBI hereby issues this Master Direction.
2. All Scheduled Commercial Banks shall implement Multi-Factor Authentication (MFA) for all remote access sessions.
3. Banks must perform security audits of firewall rules and access logs every quarter.
4. Compliance evidence must be uploaded to the central validation engine before the due date.
""",
        "pub_date": "2026-06-03T11:00:00Z"
    }
]

async def poll_advisory_feeds(database: Any) -> Dict[str, Any]:
    """Poll external feeds and automatically ingest new advisories."""
    logger.info("Polling external regulatory & advisory feeds...")
    ingested_count = 0
    errors = []
    
    for item in MOCK_FEEDS:
        guid = item["guid"]
        
        # Check if already ingested (we can query by title or a feed guid metadata)
        existing = await database.circulars.find_one({"feed_guid": guid})
        if existing:
            continue
            
        logger.info(f"New advisory found: {item['title']}")
        
        try:
            # Process using custom compliance graph pipeline
            result = await run_compliance_pipeline(
                database=database,
                file_bytes=item["content"].encode("utf-8"),
                filename=f"{guid}.txt",
                uploaded_by="feed_fetcher_daemon"
            )
            
            # Save feed guid to prevent double ingestion
            await database.circulars.update_one(
                {"circular_id": result["circular_id"]},
                {"$set": {"feed_guid": guid, "date_issued": datetime.utcnow()}}
            )
            
            ingested_count += 1
            logger.info(f"Successfully ingested advisory: {result['circular_id']}")
            
        except Exception as e:
            logger.error(f"Error ingesting advisory from feed {guid}: {e}")
            errors.append(f"{guid}: {str(e)}")
            
    return {
        "status": "success",
        "checked_at": datetime.utcnow().isoformat(),
        "ingested": ingested_count,
        "errors": errors
    }
