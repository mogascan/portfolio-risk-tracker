
import os
from pathlib import Path
from PyPDF2 import PdfReader

def load_pdf_text(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    except Exception as e:
        return f"[Error loading {pdf_path.name}: {e}]"

def load_all_research(base_dir="app/data/research"):
    base_path = Path(base_dir)
    research_data = {}

    if not base_path.exists():
        return {"error": f"Directory {base_path} does not exist."}

    for pdf_file in base_path.glob("*.pdf"):
        research_data[pdf_file.stem] = load_pdf_text(pdf_file)

    return research_data
