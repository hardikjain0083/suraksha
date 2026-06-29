import json
import time
from collections import defaultdict
import os
import sys

from services.derecha_engine import GapDetector, ExtractedGuideline, ExtractedClause
from config import MATCH_THRESHOLD, PARTIAL_THRESHOLD

HOLDOUT_IDS = {"TC08", "TC09", "TC19", "TC20", "TC29", "TC30"}

def classify(score, c_text, p_text, match_thresh=MATCH_THRESHOLD, partial_thresh=PARTIAL_THRESHOLD):
    lower_clause = c_text.lower()
    lower_policy = p_text.lower()
    
    if score >= match_thresh:
        directive_mismatch = False
        if ("shall" in lower_clause or "must" in lower_clause) and ("may" in lower_policy or "consider" in lower_policy):
            directive_mismatch = True
            
        if directive_mismatch:
            return "Suspected Gap"
        else:
            return "Covered"
    elif score >= partial_thresh:
        return "Suspected Gap"
    else:
        return "Confirmed Gap"

def compute_metrics(y_true, y_pred, classes):
    metrics = {}
    cm = defaultdict(lambda: defaultdict(int))
    for t, p in zip(y_true, y_pred):
        cm[t][p] += 1
        
    for cls in classes:
        tp = cm[cls][cls]
        fp = sum(cm[other][cls] for other in classes if other != cls)
        fn = sum(cm[cls][other] for other in classes if other != cls)
        tn = sum(cm[other1][other2] for other1 in classes for other2 in classes if other1 != cls and other2 != cls)
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        metrics[cls] = {
            "Precision": precision,
            "Recall": recall,
            "F1": f1
        }
    
    accuracy = sum(cm[cls][cls] for cls in classes) / len(y_true)
    
    # Format CM for output
    cm_formatted = {}
    for actual in classes:
        cm_formatted[actual] = {}
        for predicted in classes:
            cm_formatted[actual][predicted] = cm[actual][predicted]
            
    return metrics, accuracy, cm_formatted

def threshold_sweep(scores_and_labels, classes):
    best_acc = 0
    best_match = 0.60
    best_partial = 0.30
    
    # Simple grid search
    for m in [0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85]:
        for p in [0.25, 0.30, 0.35, 0.40, 0.45]:
            if p >= m: continue
            
            y_pred = []
            y_true = []
            for score, c_text, p_text, expected in scores_and_labels:
                pred = classify(score, c_text, p_text, match_thresh=m, partial_thresh=p)
                y_pred.append(pred)
                y_true.append(expected)
                
            _, acc, _ = compute_metrics(y_true, y_pred, classes)
            if acc > best_acc:
                best_acc = acc
                best_match = m
                best_partial = p
                
    return best_match, best_partial, best_acc

def run_eval(mode="tuning"):
    with open('test_dataset.json', 'r') as f:
        test_cases = json.load(f)
        
    if mode == "tuning":
        dataset = [tc for tc in test_cases if tc["id"] not in HOLDOUT_IDS]
    else:
        dataset = [tc for tc in test_cases if tc["id"] in HOLDOUT_IDS]
        
    print(f"Running in {mode} mode on {len(dataset)} cases.")
    detector = GapDetector()
    
    classes = ["Covered", "Suspected Gap", "Confirmed Gap"]
    
    y_true = []
    y_pred_ensemble = []
    scores_and_labels = []
    
    for tc in dataset:
        c_text = tc["circular"]
        p_text = tc["policy"]
        expected = tc["expected_label"]
        y_true.append(expected)
        
        frame_c = detector.frame_extractor.extract_frame(c_text)
        kws_c = [kw for kw, score in detector.rake.extract(c_text, top_k=10)]
        dir_c = detector._classify_directive_type(c_text)
        guideline = ExtractedGuideline(tc["id"], c_text, 1, frame_c, kws_c, dir_c)
        
        frame_p = detector.frame_extractor.extract_frame(p_text)
        kws_p = [kw for kw, score in detector.rake.extract(p_text, top_k=10)]
        clause = ExtractedClause(tc["id"]+"_P", p_text, 1, semantic_frame=frame_p, keywords=kws_p)
        
        signals = detector.compute_similarity_signals(guideline, clause)
        ensemble_score = detector.compute_final_score(signals)
        
        scores_and_labels.append((ensemble_score, c_text, p_text, expected))
        
        pred = classify(ensemble_score, c_text, p_text)
        y_pred_ensemble.append(pred)
        
    metrics_ensemble, acc_ensemble, cm_ensemble = compute_metrics(y_true, y_pred_ensemble, classes)
    
    results = {
        "mode": mode,
        "overall_accuracy": acc_ensemble,
        "metrics_per_class": metrics_ensemble,
        "confusion_matrix": cm_ensemble
    }
    
    if mode == "tuning":
        best_m, best_p, best_acc = threshold_sweep(scores_and_labels, classes)
        print(f"Optimal Thresholds Found: MATCH={best_m}, PARTIAL={best_p} -> Tuning Acc: {best_acc:.2f}")
        results["optimal_thresholds"] = {"MATCH": best_m, "PARTIAL": best_p, "sweep_acc": best_acc}
        
    with open(f'eval_results_{mode}.json', 'w') as f:
        json.dump(results, f, indent=4)
        
    print(f"Evaluation complete. Results saved to eval_results_{mode}.json")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "tuning"
    run_eval(mode)
