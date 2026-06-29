import time
import concurrent.futures
from services.derecha_engine import GapDetector, ExtractedGuideline, ExtractedClause
from services.gap_detector import compute_substance_hash

# Base paragraph for creating a large mock circular
BASE_TEXT = """
Banks and regulated entities must ensure strict compliance with all provisions mentioned in this section. 
The Board of Directors shall review the IT security policy at least once a year and submit a compliance 
report to the RBI. Furthermore, multi-factor authentication (MFA) is mandatory for all internal employee 
access to core banking systems. All critical incidents must be reported to CERT-In within 6 hours of 
identification. Regulated entities must appoint a Chief Information Security Officer (CISO) responsible 
for these matters. Data at rest must be encrypted using AES-256 or equivalent strong encryption standards.
"""

def generate_large_circular(pages: int) -> str:
    # A standard page is ~500 words. BASE_TEXT is ~80 words.
    # So 1 page = ~6 copies of BASE_TEXT.
    copies_per_page = 6
    total_copies = pages * copies_per_page
    return "\n\n".join([BASE_TEXT.strip()] * total_copies)

def test_single_large_circular(detector: GapDetector, pages: int = 50):
    print(f"Generating a {pages}-page mock circular...")
    large_text = generate_large_circular(pages)
    
    print(f"Starting end-to-end processing of {pages} pages ({len(large_text.split())} words)...")
    
    t0 = time.time()
    
    # 1. Parsing phase (simulate extraction of guidelines - one per paragraph)
    paragraphs = large_text.split("\n\n")
    guidelines = []
    for i, p_text in enumerate(paragraphs):
        frame_c = detector.frame_extractor.extract_frame(p_text)
        kws_c = [kw for kw, score in detector.rake.extract(p_text, top_k=10)]
        dir_c = detector._classify_directive_type(p_text)
        g = ExtractedGuideline(f"G_{i}", p_text, i//6 + 1, frame_c, kws_c, dir_c)
        guidelines.append(g)
        
    t1 = time.time()
    parsing_time = t1 - t0
    
    # 2. Scoring phase (against a mock policy)
    mock_policy_text = "The bank will ensure that the IT security policy is reviewed annually. MFA is implemented for all employees."
    frame_p = detector.frame_extractor.extract_frame(mock_policy_text)
    kws_p = [kw for kw, score in detector.rake.extract(mock_policy_text, top_k=10)]
    clause = ExtractedClause("P_1", mock_policy_text, 1, semantic_frame=frame_p, keywords=kws_p)
    
    for g in guidelines:
        signals = detector.compute_similarity_signals(g, clause)
        score = detector.compute_final_score(signals)
        
    t2 = time.time()
    scoring_time = t2 - t1
    total_time = t2 - t0
    
    print(f"--- Pipeline Performance ({pages} pages) ---")
    print(f"Total Guidelines Extracted: {len(guidelines)}")
    print(f"Parsing Time: {parsing_time:.2f} seconds")
    print(f"Scoring Time: {scoring_time:.2f} seconds")
    print(f"Total Time: {total_time:.2f} seconds")
    
    return total_time

def process_request(detector: GapDetector, req_id: int):
    # Simulate a standard request processing a 2-page document
    text = generate_large_circular(2)
    p_text = "The bank will ensure that the IT security policy is reviewed annually."
    
    frame_c = detector.frame_extractor.extract_frame(text)
    kws_c = [kw for kw, score in detector.rake.extract(text, top_k=10)]
    dir_c = detector._classify_directive_type(text)
    g = ExtractedGuideline(f"Req_{req_id}", text, 1, frame_c, kws_c, dir_c)
    
    frame_p = detector.frame_extractor.extract_frame(p_text)
    kws_p = [kw for kw, score in detector.rake.extract(p_text, top_k=10)]
    clause = ExtractedClause(f"Pol_{req_id}", p_text, 1, semantic_frame=frame_p, keywords=kws_p)
    
    signals = detector.compute_similarity_signals(g, clause)
    score = detector.compute_final_score(signals)
    return score

def test_concurrency(detector: GapDetector, num_requests: int = 10):
    print(f"\nTesting concurrency with {num_requests} simultaneous requests...")
    
    t0 = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_requests) as executor:
        futures = [executor.submit(process_request, detector, i) for i in range(num_requests)]
        concurrent.futures.wait(futures)
        
    t1 = time.time()
    total_time = t1 - t0
    
    print(f"Processed {num_requests} concurrent requests in {total_time:.2f} seconds.")
    print(f"Average time per request under load: {(total_time/num_requests):.2f} seconds")
    return total_time

if __name__ == "__main__":
    print("Initializing detector...")
    detector = GapDetector()
    
    # Test full 50-page processing
    test_single_large_circular(detector, 50)
    
    # Test concurrency (10 requests)
    test_concurrency(detector, 10)
    
    print("Pipeline evaluation complete.")
