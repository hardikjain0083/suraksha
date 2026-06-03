import re
from typing import Any, List, Dict

async def correlate_advisory_to_assets(
    database: Any,
    cves: List[str],
    systems_affected: List[str],
    full_text: str = ""
) -> List[Dict]:
    """
    Correlates a CERT-In advisory's threat parameters (CVEs and affected software) 
    with the internal bank asset database.
    """
    correlated_assets = []
    
    # Retrieve all assets from the database
    cursor = database.assets.find({})
    assets = await cursor.to_list(length=1000)
    
    # Lowercase lists for search convenience
    systems_affected_lower = [s.lower() for s in systems_affected]
    full_text_lower = (full_text or "").lower()
    
    for asset in assets:
        matched = False
        matched_reasons = []
        
        # Check if asset's software components match the affected systems or the full advisory text
        for software in asset.get("software_stack", []):
            software_lower = software.lower()
            
            # 1. Exact or partial match in systems_affected
            for aff_sys in systems_affected_lower:
                # Remove version numbers from software for keyword matching (e.g., "Apache Tomcat 9.0" -> "Apache Tomcat")
                base_software = re.sub(r'[\d\.]+', '', software_lower).strip()
                if base_software in aff_sys or aff_sys in base_software:
                    matched = True
                    matched_reasons.append(f"Software '{software}' matches affected system '{aff_sys}'")
                    break
            
            # 2. Check if software is explicitly mentioned in the full text of the advisory
            if not matched:
                # Build regex boundary for software keyword (e.g., \bapache\s+tomcat\b)
                keyword = re.escape(re.sub(r'[\d\.]+', '', software_lower).strip())
                if keyword and len(keyword) > 3 and re.search(r'\b' + keyword + r'\b', full_text_lower):
                    matched = True
                    matched_reasons.append(f"Software keyword '{software}' mentioned in advisory text")
        
        # 3. CVE specific correlation (if any assets had specific known vulnerability logs)
        # For simplicity, we can also check if the asset has a CVE log match
        # in the asset's active/known vulnerabilities list
        asset_cves = asset.get("vulnerabilities", [])
        for cve in cves:
            if cve in asset_cves:
                matched = True
                matched_reasons.append(f"Asset has active vulnerability {cve}")
        
        if matched:
            correlated_assets.append({
                "asset_id": asset.get("asset_id"),
                "name": asset.get("name"),
                "category": asset.get("category"),
                "sensitivity": asset.get("sensitivity"),
                "software_stack": asset.get("software_stack"),
                "reasons": matched_reasons,
                "owner_department_id": asset.get("owner_department_id")
            })
            
    return correlated_assets
