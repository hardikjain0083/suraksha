"""Unit tests: partially_parsed / failed circulars blocked from gap detection."""
import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock

from services.gap_detector import detect_gaps_for_circular


@pytest.mark.asyncio
async def test_partially_parsed_returns_blocked():
    db = MagicMock()
    db.circulars.find_one = AsyncMock(
        return_value={
            "circular_id": "RBI/2026-001",
            "ingestion_status": "partially_parsed",
            "clauses": [{"text": "shall encrypt", "obligation_type": "shall"}],
        }
    )
    db.gap_queue = MagicMock()
    db.gap_queue.insert_many = AsyncMock()

    result = await detect_gaps_for_circular("RBI/2026-001", db)

    assert result.status == "blocked"
    assert "partially_parsed" in (result.reason or "")
    assert result.total_clauses_analyzed == 0
    assert len(result.gaps) == 0
    db.gap_queue.insert_many.assert_not_called()


@pytest.mark.asyncio
async def test_failed_returns_blocked():
    db = MagicMock()
    db.circulars.find_one = AsyncMock(
        return_value={
            "circular_id": "RBI/2026-002",
            "ingestion_status": "failed",
            "clauses": [],
        }
    )

    result = await detect_gaps_for_circular("RBI/2026-002", db)

    assert result.status == "blocked"
    assert result.confirmed == 0
