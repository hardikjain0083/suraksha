import re

def clean_and_group_paragraphs(text: str) -> list[str]:
    # Replace single newlines with a space, but keep double newlines
    # Also handle some noise
    paragraphs = re.split(r'\n\s*\n', text)
    cleaned = []
    for p in paragraphs:
        p = p.replace('\n', ' ').strip()
        p = re.sub(r'\s+', ' ', p)
        if len(p) > 20:
            cleaned.append(p)
    return cleaned

def parse_clauses_v2(text: str):
    clauses = []
    # Match: 1., 1.1, 1.1.1, or (a), (b), (i), (ii)
    # But let's keep it simple: any number followed by dot
    clause_pattern = re.compile(r"^((?:\d+\.)+(?:\d+)?|\d+\.|\([a-z0-9]+\))\s+")
    
    paragraphs = clean_and_group_paragraphs(text)
    
    for para in paragraphs:
        match = clause_pattern.search(para)
        clause_num = match.group(1) if match else None
        
        lower = para.lower()
        obligation = None
        severity = None
        
        if "shall " in lower:
            obligation, severity = "shall", "critical"
        elif "must " in lower:
            obligation, severity = "must", "critical"
        elif "should " in lower:
            obligation, severity = "should", "high"
        elif "may " in lower:
            obligation, severity = "may", "medium"
        elif "mandatory" in lower or "required" in lower:
            obligation, severity = "must", "critical"
            
        penalty_ref = None
        if re.search(r"\b(penalty|section|fine|liable|contravention)\b", lower):
            penalty_ref = "Detected potential penalty reference"
            
        if clause_num or obligation:
            clauses.append({
                "clause_number": clause_num,
                "text": para,
                "obligation_type": obligation,
                "severity": severity,
                "penalty_reference": penalty_ref
            })
            
    return clauses

with open('c:/Users/hardi/Desktop/suraksha/suraksha-maps-v4/rbi_circular_demo.txt', 'r') as f:
    text = f.read()

print(parse_clauses_v2(text))
