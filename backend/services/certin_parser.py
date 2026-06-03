import re
from typing import Dict, List, Optional
from models.circular import Clause

class CERTInParser:
    """Specialized parser for CERT-In (Indian Computer Emergency Response Team) advisories."""

    @staticmethod
    def detect_certin_content(text: str) -> bool:
        """Content-based detection of CERT-In advisories."""
        text_upper = text.upper()
        indicators = [
            "CERT-IN ADVISORY",
            "INDIAN COMPUTER EMERGENCY RESPONSE TEAM",
            "WWW.CERT-IN.ORG.IN",
            "CIAD-",
            "CIVN-",
            "VULNERABILITY NOTE",
            "SUBJECT: VULNERABILITIES IN",
            "COMPUTING ENVIRONMENT OF CERT-IN"
        ]
        score = sum(1 for ind in indicators if ind in text_upper)
        return score >= 2

    @staticmethod
    def parse_certin_advisory(text: str) -> Dict:
        """Parse a CERT-In advisory text and extract structured threat metrics."""
        lines = text.split("\n")
        
        # 1. CIAD / Advisory ID Extraction
        advisory_id = None
        id_match = re.search(r"\b(CIAD-\d{4}-\d{4,6}|CIVN-\d{4}-\d{4,6})\b", text, re.IGNORECASE)
        if id_match:
            advisory_id = id_match.group(1).upper()
        else:
            # Fallback regex search
            id_match = re.search(r"Advisory\s+ID\s*:\s*([\w\-]+)", text, re.IGNORECASE)
            if id_match:
                advisory_id = id_match.group(1).strip()
            else:
                advisory_id = "CERTIN-ADVISORY-GENERIC"

        # 2. CVE ID Extraction
        cves = sorted(list(set(re.findall(r"\b(CVE-\d{4}-\d{4,7})\b", text, re.IGNORECASE))))
        cves = [c.upper() for c in cves]

        # 3. Severity Extraction
        severity = "medium"
        severity_match = re.search(r"Severity\s*:\s*(\w+)", text, re.IGNORECASE)
        if severity_match:
            val = severity_match.group(1).lower()
            if val in ("critical", "high", "medium", "low"):
                severity = val
        else:
            # Check for generic keywords in the text
            text_lower = text.lower()
            if "critical severity" in text_lower or "severity: critical" in text_lower:
                severity = "critical"
            elif "high severity" in text_lower or "severity: high" in text_lower:
                severity = "high"
            elif "low severity" in text_lower or "severity: low" in text_lower:
                severity = "low"

        # 4. Extract Affected Systems
        systems_affected = []
        systems_pattern = re.compile(
            r"(?:Systems Affected|Software Affected|Affected Systems|Affected Products|Affected Software)(.*?)(?=(?:Description|Summary|Technical Details|Solution|Workaround|Vendor|Vulnerability Note|\Z))",
            re.DOTALL | re.IGNORECASE
        )
        sys_match = systems_pattern.search(text)
        if sys_match:
            sys_block = sys_match.group(1).strip()
            # Split by bullet points or newlines
            items = re.split(r"[\n\r•\-\*]+", sys_block)
            for item in items:
                cleaned = item.strip()
                if cleaned and len(cleaned) > 2 and len(cleaned) < 150:
                    systems_affected.append(cleaned)
        
        if not systems_affected:
            # Heuristic scan: look for product names and versions
            products = re.findall(r"\b(Apache Tomcat|Windows Server|Oracle|MySQL|PostgreSQL|Linux|Cisco|Kubernetes|Docker|Python|Node\.js|Java|Spring Boot)\b[\s\w\.\-]*", text, re.IGNORECASE)
            systems_affected = sorted(list(set([p.strip() for p in products])))[:5]

        # 5. Extract Solution
        solution = ""
        solution_pattern = re.compile(
            r"(?:Solution|Workaround|Remediation|Mitigation)(.*?)(?=(?:Feedback|Disclaimer|Advisory ID|References|\Z))",
            re.DOTALL | re.IGNORECASE
        )
        sol_match = solution_pattern.search(text)
        if sol_match:
            solution = sol_match.group(1).strip()
        else:
            # Fallback: find lines mentioning "upgrade", "update", "patch", "apply"
            sol_lines = []
            for line in lines:
                if any(w in line.lower() for w in ("upgrade", "update", "patch", "mitigate", "recommend")):
                    sol_lines.append(line.strip())
            solution = " ".join(sol_lines[:3])

        # 6. Extract Description
        description = ""
        desc_pattern = re.compile(
            r"(?:Description|Summary|Technical Details|Overview)(.*?)(?=(?:Systems Affected|Software Affected|Solution|Workaround|\Z))",
            re.DOTALL | re.IGNORECASE
        )
        desc_match = desc_pattern.search(text)
        if desc_match:
            description = desc_match.group(1).strip()
        else:
            # Fallback
            description = text[:500] + "..."

        # 7. Construct Clauses
        clauses: List[Clause] = []
        
        # Primary clause for the entire advisory
        primary_text = f"CERT-In Advisory {advisory_id} ({severity.upper()}): {description[:300]}... Action: {solution[:300]}"
        clauses.append(
            Clause(
                clause_number=f"{advisory_id}-00",
                text=primary_text,
                obligation_type="must",
                severity=severity,
                penalty_reference=f"CERT-In Advisory {advisory_id}",
                gap_status="pending"
            )
        )

        # Generate sub-clauses for individual CVEs if present
        for idx, cve in enumerate(cves):
            cve_text = f"Remediate security vulnerability {cve} affecting systems: {', '.join(systems_affected) if systems_affected else 'various software stacks'}. Ref: {solution[:300]}"
            clauses.append(
                Clause(
                    clause_number=f"{advisory_id}-{idx+1:02d}",
                    text=cve_text,
                    obligation_type="must",
                    severity=severity,
                    penalty_reference=cve,
                    gap_status="pending"
                )
            )

        return {
            "advisory_id": advisory_id,
            "cves": cves,
            "severity": severity,
            "systems_affected": systems_affected,
            "description": description,
            "solution": solution,
            "clauses": clauses
        }
