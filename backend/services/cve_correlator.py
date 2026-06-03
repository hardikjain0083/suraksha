import hashlib
from typing import List, Dict, Optional

# Mock NVD / EPSS database feed
MOCK_CVE_FEED = {
    "CVE-2023-3519": {
        "cve_id": "CVE-2023-3519",
        "title": "Citrix NetScaler ADC RCE",
        "cvss": 9.8,
        "epss": 0.95,
        "severity": "critical",
        "summary": "Unauthenticated remote code execution vulnerability in Citrix NetScaler ADC and Gateway.",
        "affected_software": ["Citrix Gateway", "NetScaler ADC"],
        "publish_date": "2023-07-18"
    },
    "CVE-2023-38646": {
        "cve_id": "CVE-2023-38646",
        "title": "Metabase RCE",
        "cvss": 9.8,
        "epss": 0.88,
        "severity": "critical",
        "summary": "Pre-authentication remote code execution vulnerability in Metabase open-source edition.",
        "affected_software": ["Metabase"],
        "publish_date": "2023-07-22"
    },
    "CVE-2024-21626": {
        "cve_id": "CVE-2024-21626",
        "title": "runc Container Breakout",
        "cvss": 8.6,
        "epss": 0.74,
        "severity": "high",
        "summary": "File descriptor leak enabling container breakout and host system compromise in runc.",
        "affected_software": ["Docker", "runc", "containerd"],
        "publish_date": "2024-01-31"
    },
    "CVE-2024-3400": {
        "cve_id": "CVE-2024-3400",
        "title": "Palo Alto Networks PAN-OS Command Injection",
        "cvss": 10.0,
        "epss": 0.96,
        "severity": "critical",
        "summary": "Command injection vulnerability in the GlobalProtect feature of Palo Alto Networks PAN-OS software.",
        "affected_software": ["PAN-OS Firewall", "Palo Alto GlobalProtect"],
        "publish_date": "2024-04-12"
    },
    "CVE-2026-1001": {
        "cve_id": "CVE-2026-1001",
        "title": "Oracle Database Privilege Escalation",
        "cvss": 9.8,
        "epss": 0.90,
        "severity": "critical",
        "summary": "Vulnerability in Oracle Database Server's Java Virtual Machine component allowing remote takeover.",
        "affected_software": ["Oracle DB 19c", "Oracle Database"],
        "publish_date": "2026-01-15"
    },
    "CVE-2026-2002": {
        "cve_id": "CVE-2026-2002",
        "title": "Apache Tomcat Request Smuggling & RCE",
        "cvss": 8.8,
        "epss": 0.65,
        "severity": "high",
        "summary": "HTTP Request Smuggling leading to Remote Code Execution in Apache Tomcat server instances.",
        "affected_software": ["Apache Tomcat 9.0.41", "Apache Tomcat"],
        "publish_date": "2026-02-10"
    }
}

def get_cve_details(cve_id: str) -> Dict:
    """Retrieve details of a CVE. Returns fallback values for unknown CVEs."""
    cve_id = cve_id.upper().strip()
    if cve_id in MOCK_CVE_FEED:
        return MOCK_CVE_FEED[cve_id]
    
    # Generate deterministic values based on CVE string hash for mock demonstration
    h = hashlib.sha256(cve_id.encode("utf-8")).digest()
    cvss = round(5.0 + (h[0] % 50) / 10.0, 1)  # 5.0 to 10.0
    epss = round((h[1] % 100) / 100.0, 3)     # 0.00 to 1.00
    
    severity = "medium"
    if cvss >= 9.0:
        severity = "critical"
    elif cvss >= 7.0:
        severity = "high"
    elif cvss >= 4.0:
        severity = "medium"
    else:
        severity = "low"
        
    year = "2026"
    match = re.search(r"CVE-(\d{4})-", cve_id)
    if match:
        year = match.group(1)
        
    return {
        "cve_id": cve_id,
        "title": f"Vulnerability in software stack ({cve_id})",
        "cvss": cvss,
        "epss": epss,
        "severity": severity,
        "summary": f"Automatically correlated threat profile for {cve_id}. Exploitation likelihood tracked by EPSS.",
        "affected_software": ["General Enterprise System"],
        "publish_date": f"{year}-01-01"
    }

def get_recent_cves(limit: int = 10) -> List[Dict]:
    """Retrieve a list of recent CVEs in the feed."""
    return list(MOCK_CVE_FEED.values())[:limit]
import re
