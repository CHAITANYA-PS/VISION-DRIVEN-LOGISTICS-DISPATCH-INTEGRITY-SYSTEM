import uvicorn
import numpy as np
import cv2
import re
from fastapi import FastAPI, UploadFile, File, Form
from paddleocr import PaddleOCR
from PIL import Image
from io import BytesIO

app = FastAPI(title="Logistics Verification API")

# ---------------- OCR SETUP ----------------
ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', enable_mkldnn=True, show_log=False)

# Warm-up
ocr_engine.ocr(np.zeros((100, 100, 3), dtype=np.uint8))

# ---------------- HELPERS ----------------
def normalize_id(text):
    if not text:
        return ""
    return re.sub(r"^(PID|P|SKU|S|CODE)[-:\s]*", "", text.upper()).strip()

def normalize_dimensions(text):
    if not text:
        return ""
    return re.sub(r"[^0-9X]", "", text.upper())

def get_weight_in_kg(text):
    if not text:
        return 0.0

    match = re.search(r"(\d+(\.\d+)?)\s*(kg|g|lb|lbs|oz)?", text.lower())
    if not match:
        return 0.0

    value = float(match.group(1))
    unit = match.group(3)

    if not unit:
        # FRONTEND sends "100.0" → assume grams
        return value / 1000.0

    if unit == "g":
        return value / 1000.0
    if unit in ["lb", "lbs"]:
        return value * 0.453592
    if unit == "oz":
        return value * 0.0283495

    return value  # kg

def extract_weight_value(text):
    """
    Extracts only the numeric value from weight text.
    Returns the number as a string (e.g., "200" or "100.5").
    """
    if not text:
        return None
    
    match = re.search(r"(\d+(\.\d+)?)", text)
    if match:
        return match.group(1)
    return None

# ---------------- PARSER ----------------
def parse_logistics_data(texts, scores):
    data = {
        "sku": None,
        "pid": None,
        "weight": None,
        "color": None,
        "dimensions": None,
        "confidence_score": round(sum(scores) / len(scores), 2) if scores else 0.95,
        "raw_lines": texts
    }

    for i, line in enumerate(texts):
        line_u = line.upper()

        # PID (ROBUST)
        if not data["pid"]:
            pid_match = re.search(r"(PID|P)[- ]?\d+", line_u)
            if pid_match:
                data["pid"] = pid_match.group(0)

        # SKU
        if not data["sku"]:
            sku_match = re.search(r"(SKU|ELEC)[-:\s]?[A-Z0-9-]+", line_u)
            if sku_match:
                data["sku"] = sku_match.group(0)

        # WEIGHT
        if not data["weight"]:
            weight_match = re.search(r"\d+(\.\d+)?\s*(kg|g|lb|oz)", line.lower())
            if weight_match:
                extracted_value = extract_weight_value(line)
                if extracted_value:
                    data["weight"] = extracted_value

        # COLOR
        if not data["color"]:
            if "COLOR" in line_u:
                parts = line.split(":")
                if len(parts) > 1:
                    data["color"] = parts[1].strip()
            elif line_u in ["RED", "BLUE", "BLACK", "WHITE"]:
                data["color"] = line.strip()

        # DIMENSIONS
        if not data["dimensions"]:
            dim_match = re.search(r"\d+\s*[xX]\s*\d+\s*[xX]\s*\d+", line)
            if dim_match:
                data["dimensions"] = dim_match.group(0)

    return data

# ---------------- API ----------------
@app.post("/verify-label")
async def verify_label(
    expected_sku: str = Form(None),
    expected_pid: str = Form(None),
    expected_weight: str = Form(None),
    expected_color: str = Form(None),
    expected_dimensions: str = Form(None),
    file: UploadFile = File(...)
):
    # Read image
    image = Image.open(BytesIO(await file.read())).convert("RGB")
    img = np.array(image)

    # Resize for speed
    h, w = img.shape[:2]
    if max(h, w) > 1024:
        scale = 1024 / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))

    # OCR
    result = ocr_engine.ocr(img)
    texts = [l[1][0] for l in result[0]]
    scores = [l[1][1] for l in result[0]]

    extracted = parse_logistics_data(texts, scores)

    status = "MATCH"
    issues = []

    # SKU
    if expected_sku:
        if normalize_id(expected_sku) != normalize_id(extracted["sku"]):
            status = "MISMATCH"
            issues.append("SKU mismatch")

    # PID
    if expected_pid:
        if normalize_id(expected_pid) != normalize_id(extracted["pid"]):
            status = "MISMATCH"
            issues.append("Product Code mismatch")

    # COLOR
    if expected_color:
        if expected_color.upper() != (extracted["color"] or "").upper():
            status = "MISMATCH"
            issues.append("Color mismatch")

    # WEIGHT
    if expected_weight:
        if abs(
            get_weight_in_kg(expected_weight)
            - get_weight_in_kg(extracted["weight"])
        ) > 0.02:
            status = "MISMATCH"
            issues.append(
                f"Weight mismatch: Found {extracted['weight']}, Expected {expected_weight}"
            )

    # DIMENSIONS
    if expected_dimensions:
        if normalize_dimensions(expected_dimensions) != normalize_dimensions(extracted["dimensions"]):
            status = "MISMATCH"
            issues.append("Dimensions mismatch")

    return {
        "status": "success",
        "verification_result": status,
        "issues": issues,
        "data": extracted
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)