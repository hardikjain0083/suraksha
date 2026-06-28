import sys
import os
import json

from services.derecha_engine import GapDetector, ExtractedGuideline, ExtractedClause
from config import MATCH_THRESHOLD, PARTIAL_THRESHOLD

def run_evaluation():
    detector = GapDetector()
    results = []
    
    # Robust test cases covering various scenarios
    test_cases = [
        {
            "id": "TC1",
            "desc": "Exact match",
            "circular": "Banks must maintain a minimum capital adequacy ratio of 9%.",
            "policy": "The bank shall maintain a minimum capital adequacy ratio of 9% at all times.",
            "expected_gap": "covered"
        },
        {
            "id": "TC2",
            "desc": "Directive mismatch (weaker policy)",
            "circular": "Banks shall implement multi-factor authentication for all customer logins.",
            "policy": "The bank may consider implementing multi-factor authentication for customer logins if deemed necessary by the IT committee.",
            "expected_gap": "insufficient_clause"
        },
        {
            "id": "TC3",
            "desc": "Missing clause",
            "circular": "All banks must report suspicious transactions to FIU-IND within 7 days.",
            "policy": "The bank will monitor accounts for unusual activity.",
            "expected_gap": "missing_clause"
        },
        {
            "id": "TC4",
            "desc": "Similar domain but different requirement",
            "circular": "Regulated entities must ensure robust cyber security framework.",
            "policy": "The bank shall ensure physical security of all branches.",
            "expected_gap": "missing_clause"
        }
    ]

    correct_predictions = 0
    failed_cases = []

    for tc in test_cases:
        c_text = tc["circular"]
        p_text = tc["policy"]
        
        frame_c = detector.frame_extractor.extract_frame(c_text)
        kws_c = [kw for kw, score in detector.rake.extract(c_text, top_k=10)]
        dir_c = detector._classify_directive_type(c_text)
        guideline = ExtractedGuideline("G1", c_text, 1, frame_c, kws_c, dir_c)
        
        frame_p = detector.frame_extractor.extract_frame(p_text)
        kws_p = [kw for kw, score in detector.rake.extract(p_text, top_k=10)]
        clause = ExtractedClause("P1", p_text, 1, semantic_frame=frame_p, keywords=kws_p)
        
        signals = detector.compute_similarity_signals(guideline, clause)
        score = detector.compute_final_score(signals)
        
        gap_status = "confirmed"
        gap_type = "missing_clause"
        
        if score >= MATCH_THRESHOLD:
            # Directive check
            directive_mismatch = False
            if ("shall" in c_text.lower() or "must" in c_text.lower()) and ("may" in p_text.lower() or "consider" in p_text.lower()):
                directive_mismatch = True
                
            if directive_mismatch:
                gap_status = "confirmed"
                gap_type = "insufficient_clause"
            else:
                gap_status = "covered"
                gap_type = "none"
        elif score >= PARTIAL_THRESHOLD:
            gap_status = "confirmed"
            gap_type = "insufficient_clause"
        else:
            gap_status = "confirmed"
            gap_type = "missing_clause"
            
        is_correct = (gap_type == tc["expected_gap"] or (gap_status == tc["expected_gap"]))
        if is_correct:
            correct_predictions += 1
        else:
            failed_cases.append({
                "id": tc["id"],
                "desc": tc["desc"],
                "expected": tc["expected_gap"],
                "predicted": gap_type if gap_status == "confirmed" else gap_status,
                "score": score
            })
            
        results.append({
            "id": tc["id"],
            "desc": tc["desc"],
            "score": score,
            "predicted_gap": gap_type if gap_status == "confirmed" else gap_status,
            "expected_gap": tc["expected_gap"],
            "is_correct": is_correct
        })
        
    accuracy = correct_predictions / len(test_cases)
    
    print("\n--- EVALUATION RESULTS ---")
    print(f"Accuracy: {accuracy*100}%")
    print(f"Total Test Cases: {len(test_cases)}")
    print(f"Correct: {correct_predictions}")
    if failed_cases:
        print("\nFailed Cases:")
        for fc in failed_cases:
            print(f"- [{fc['id']}] {fc['desc']}: Expected '{fc['expected']}', Got '{fc['predicted']}' (Score: {fc['score']:.2f})")
    else:
        print("\nAll test cases passed!")

if __name__ == "__main__":
    run_evaluation()
