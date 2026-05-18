from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class Clause(BaseModel):
    clause_number: Optional[str] = None
    text: str
    obligation_type: Optional[Literal["shall", "must", "should", "may", "recommended"]] = None
    severity: Optional[Literal["critical", "high", "medium", "low"]] = None
    penalty_reference: Optional[str] = None
    gap_status: Literal["covered", "suspected", "confirmed", "error", "pending"] = "pending"
    embedding: Optional[List[float]] = None

class CircularBase(BaseModel):
    circular_id: str
    title: Optional[str] = None
    issuer: str
    date_issued: datetime = Field(default_factory=datetime.utcnow)

class CircularCreate(CircularBase):
    pass

class CircularResponse(CircularBase):
    ingestion_status: Literal["fully_parsed", "partially_parsed", "failed", "pending"]
    clauses_extracted: int
    parser_version: str = "v1.0"
    pages_processed: int = 1
    processing_time_ms: int = 0
    extraction_confidence: float = 1.0
    clauses: List[Clause] = []

    class Config:
        from_attributes = True

class ReparseOptions(BaseModel):
    strict_mode: bool = False
    extract_penalties: bool = True
