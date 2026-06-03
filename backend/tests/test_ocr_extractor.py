import os
import io
import pytest
import tempfile
import sys
from unittest.mock import MagicMock, patch
from PIL import Image, ImageDraw
from fpdf import FPDF

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from config import settings
from services.ocr_extractor import OCRExtractor, LowConfidenceException, OCRException, SuRakshaException

# ─────────────────────────────────────────────────────────────
#  Fixtures Generation Helpers
# ─────────────────────────────────────────────────────────────

def create_text_pdf() -> str:
    """Generate a temporary text-selectable PDF"""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", size=12)
    pdf.cell(200, 10, txt="Reserve Bank of India - Cyber Security Directives")
    pdf.ln(10)
    pdf.multi_cell(190, 10, txt="All regulated entities shall implement robust multi-factor authentication.")
    
    fd, path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    pdf.output(path)
    return path


def create_scanned_pdf(pages_count: int = 1) -> str:
    """Generate a temporary image-based scanned PDF"""
    pdf = FPDF()
    
    # Create temp image
    img = Image.new("RGB", (200, 200), color="white")
    d = ImageDraw.Draw(img)
    d.text((10, 10), "Scanned Regulatory Circular Text", fill=(0, 0, 0))
    
    fd_img, img_path = tempfile.mkstemp(suffix=".png")
    os.close(fd_img)
    img.save(img_path)
    
    for _ in range(pages_count):
        pdf.add_page()
        pdf.image(img_path, x=10, y=10, w=180)
        
    fd_pdf, pdf_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd_pdf)
    pdf.output(pdf_path)
    
    try:
        os.remove(img_path)
    except OSError:
        pass
        
    return pdf_path


# ─────────────────────────────────────────────────────────────
#  Tests
# ─────────────────────────────────────────────────────────────

def test_skips_text_pdf():
    """Verify that a native text-selectable PDF is NOT identified as scanned"""
    pdf_path = create_text_pdf()
    try:
        ocr = OCRExtractor(engine="tesseract")
        is_scanned = ocr.is_scanned_pdf(pdf_path)
        assert is_scanned is False
    finally:
        os.remove(pdf_path)


def test_detects_scanned_pdf():
    """Verify that an image-only PDF is identified as scanned"""
    pdf_path = create_scanned_pdf()
    try:
        ocr = OCRExtractor(engine="tesseract")
        is_scanned = ocr.is_scanned_pdf(pdf_path)
        assert is_scanned is True
    finally:
        os.remove(pdf_path)


@patch("pdf2image.convert_from_bytes")
@patch("pytesseract.image_to_string")
@patch("pytesseract.image_to_data")
def test_low_confidence_triggers_flag(mock_image_to_data, mock_image_to_string, mock_convert):
    """Verify that low confidence OCR raises LowConfidenceException"""
    mock_convert.return_value = [Image.new("RGB", (10, 10), color="white")]
    mock_image_to_string.return_value = "Blurry bank document text"
    # Return confidence values that average to < 0.60 (e.g. 40%)
    mock_image_to_data.return_value = {
        "conf": [40, 40, 40, -1, 40]
    }
    
    pdf_path = create_scanned_pdf()
    try:
        ocr = OCRExtractor(engine="tesseract")
        with pytest.raises(LowConfidenceException) as excinfo:
            ocr.extract_text(pdf_path)
        
        # Verify custom exception carries partial ocr metadata
        exc = excinfo.value
        assert exc.ocr_result["is_scanned"] is True
        assert exc.ocr_result["confidence"] == 0.40
        assert exc.ocr_result["engine_used"] == "tesseract"
        assert "Blurry" in exc.ocr_result["text"]
    finally:
        os.remove(pdf_path)


@patch("pdf2image.convert_from_bytes")
@patch("pytesseract.image_to_string")
@patch("pytesseract.image_to_data")
def test_large_document_sampling(mock_image_to_data, mock_image_to_string, mock_convert):
    """Verify that scanned PDFs > 50 pages sample every 5th page"""
    mock_convert.return_value = [Image.new("RGB", (10, 10), color="white")] * 55
    mock_image_to_string.return_value = "Page processed text"
    mock_image_to_data.return_value = {
        "conf": [95, 95, -1]
    }
    
    # Create scanned PDF with 55 pages
    pdf_path = create_scanned_pdf(pages_count=55)
    try:
        ocr = OCRExtractor(engine="tesseract")
        result = ocr.extract_text(pdf_path)
        
        assert len(result["pages"]) == 55
        
        # Verify page 1 is processed (index 0)
        assert "Page processed text" in result["pages"][0]
        # Verify page 2 is skipped (index 1)
        assert "[Page 2 skipped due to selective sampling of large document]" in result["pages"][1]
        # Verify page 6 is processed (index 5)
        assert "Page processed text" in result["pages"][5]
        
    finally:
        os.remove(pdf_path)


def test_structured_table_extraction():
    """Verify that AWS Textract raw block relationships are successfully parsed into structured JSON tables"""
    ocr = OCRExtractor(engine="cloud")
    
    # Mock Textract table block structure
    mock_response = {
        "Blocks": [
            {
                "Id": "TABLE_1",
                "BlockType": "TABLE",
                "Relationships": [{"Type": "CHILD", "Ids": ["CELL_1_1", "CELL_1_2", "CELL_2_1", "CELL_2_2"]}]
            },
            {
                "Id": "CELL_1_1",
                "BlockType": "CELL",
                "RowIndex": 1,
                "ColumnIndex": 1,
                "Confidence": 90.0,
                "Relationships": [{"Type": "CHILD", "Ids": ["WORD_1"]}]
            },
            {
                "Id": "CELL_1_2",
                "BlockType": "CELL",
                "RowIndex": 1,
                "ColumnIndex": 2,
                "Confidence": 85.0,
                "Relationships": [{"Type": "CHILD", "Ids": ["WORD_2"]}]
            },
            {
                "Id": "CELL_2_1",
                "BlockType": "CELL",
                "RowIndex": 2,
                "ColumnIndex": 1,
                "Confidence": 95.0,
                "Relationships": [{"Type": "CHILD", "Ids": ["WORD_3"]}]
            },
            {
                "Id": "CELL_2_2",
                "BlockType": "CELL",
                "RowIndex": 2,
                "ColumnIndex": 2,
                "Confidence": 80.0,
                "Relationships": [{"Type": "CHILD", "Ids": ["WORD_4"]}]
            },
            {"Id": "WORD_1", "BlockType": "WORD", "Text": "Date", "Confidence": 99.0},
            {"Id": "WORD_2", "BlockType": "WORD", "Text": "Deadline", "Confidence": 99.0},
            {"Id": "WORD_3", "BlockType": "WORD", "Text": "June 30", "Confidence": 99.0},
            {"Id": "WORD_4", "BlockType": "WORD", "Text": "Complied", "Confidence": 99.0}
        ]
    }
    
    # Parse tables
    text, confidence, tables = ocr._parse_textract_response(mock_response, page_index=2)
    
    assert len(tables) == 1
    table = tables[0]
    assert table["page"] == 3
    assert table["rows"] == 2
    assert table["columns"] == 2
    assert table["data"] == [
        ["Date", "Deadline"],
        ["June 30", "Complied"]
    ]
    # Avg confidence = (90 + 85 + 95 + 80) / 4 / 100 = 0.875
    assert table["confidence"] == 0.875
