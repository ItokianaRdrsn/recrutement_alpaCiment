# -*- coding: utf-8 -*-
"""
main.py
=======
Microservice FastAPI pour AlpA Ciment :
- Orchestration du pipeline OCR (PaddleOCR / PyPDF)
- Structuration sémantique NER (LLM local Llama 3.2 via Ollama)
"""

import logging
import json
import time
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Modules séparés
from cv_ocr_extractor import extract_raw_text_from_bytes, PADDLE_AVAILABLE, PYPDF_AVAILABLE
from cv_llm_parser import parse_cv_with_llm, is_ollama_available, DEFAULT_MODEL
from email_classifier import classify_email_intent

# Configuration des logs
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("AlpaCimentOCR")

app = FastAPI(
    title="AlpA Ciment - Microservice OCR & NER (PaddleOCR + Llama 3.2 LLM)",
    description="Microservice d'extraction optique (OCR) et de structuration intelligente (NER Llama 3.2) de CVs.",
    version="2.0.0",
)

# Configuration CORS pour autoriser Laravel (8000) et React (5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
@app.get("/health")
def health_check():
    """Vérifie l'état de santé des moteurs OCR et du LLM local."""
    ollama_ok = is_ollama_available()
    return {
        "status": "ok",
        "service": "AlpA Ciment - Microservice OCR & NER",
        "paddle_ocr_installed": PADDLE_AVAILABLE,
        "pypdf_installed": PYPDF_AVAILABLE,
        "ollama_connected": ollama_ok,
        "llm_model": DEFAULT_MODEL,
        "version": "2.0.0"
    }


# =====================================================================
# 1. NOEUD 1 : OCR PUR (Extraction de texte brut + transport base64)
# =====================================================================
@app.post("/ocr")
async def extract_ocr_only(
    file: UploadFile = File(...),
    candidature_id: Optional[int] = Form(None),
    id_offre: Optional[int] = Form(None)
):
    """
    Étape 1 du pipeline :
    - Extrait le texte brut du CV via pypdf / PaddleOCR
    - Encode le fichier en Base64 pour le stockage final
    - Propage et retourne systématiquement l'id_offre reçu (ou null si spontanée)
    """
    try:
        logger.info(f"[OCR] Traitement fichier : {file.filename} (id_offre: {id_offre})")
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(status_code=400, detail="Fichier CV vide ou corrompu.")

        t0 = time.time()
        raw_text = extract_raw_text_from_bytes(file_bytes, file.filename)
        t_ocr = round(time.time() - t0, 3)

        import base64
        cv_b64 = base64.b64encode(file_bytes).decode('utf-8')
        mime_type = file.content_type or 'application/pdf'

        return {
            "success": True,
            "message": f"Extraction OCR effectuée en {t_ocr}s.",
            "candidature_id": candidature_id,
            "id_offre": id_offre,
            "filename": file.filename,
            "cv_nom": file.filename or "cv.pdf",
            "cv_mime": mime_type,
            "cv_base64": cv_b64,
            "texte_brut_ocr": raw_text,
            "duree_secondes": {"ocr": t_ocr}
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[OCR] Erreur : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur OCR : {str(e)}")


# =====================================================================
# 2. NOEUD 2 : NER PUR (Structuration sémantique via LLM Llama 3.2)
# =====================================================================
class NerParseRequest(BaseModel):
    texte_brut_ocr: str
    id_offre: Optional[int] = None
    cv_base64: Optional[str] = None
    cv_nom: Optional[str] = None
    cv_mime: Optional[str] = None
    candidature_id: Optional[int] = None


@app.post("/ner")
def parse_ner_only(req: NerParseRequest):
    """
    Étape 2 du pipeline :
    - Prend le texte brut OCR en JSON
    - Extrait les entités (contact, compétences, expériences, projets, formations) via Llama 3.2
    - Propage et retourne systématiquement l'id_offre et cv_base64
    """
    try:
        logger.info(f"[NER] Structuration du texte (id_offre: {req.id_offre})")
        t0 = time.time()
        structured_data = parse_cv_with_llm(req.texte_brut_ocr)
        t_llm = round(time.time() - t0, 3)

        return {
            "success": True,
            "message": f"Structuration NER effectuée en {t_llm}s.",
            "id_offre": req.id_offre,
            "candidature_id": req.candidature_id,
            "cv_base64": req.cv_base64,
            "cv_nom": req.cv_nom,
            "cv_mime": req.cv_mime,
            "texte_brut_ocr": req.texte_brut_ocr,
            "donnees_json": structured_data,
            "duree_secondes": {"llm": t_llm}
        }
    except Exception as e:
        logger.error(f"[NER] Erreur : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur NER : {str(e)}")


# =====================================================================
# 3. COMBINÉ (OCR + NER) - Conservé pour compatibilité
# =====================================================================
@app.post("/extract-cv")
@app.post("/extract")
async def extract_cv(
    file: UploadFile = File(...),
    candidature_id: Optional[int] = Form(None),
    id_offre: Optional[int] = Form(None)
):
    """Pipeline combiné OCR + NER en un seul appel."""
    try:
        logger.info(f"Traitement du CV combiné : {file.filename} (id_offre: {id_offre})")
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(status_code=400, detail="Fichier CV vide ou corrompu.")

        t0 = time.time()
        raw_text = extract_raw_text_from_bytes(file_bytes, file.filename)
        t_ocr = round(time.time() - t0, 3)

        t1 = time.time()
        structured_data = parse_cv_with_llm(raw_text)
        t_llm = round(time.time() - t1, 3)
        t_total = round(t_ocr + t_llm, 3)

        import base64
        cv_b64 = base64.b64encode(file_bytes).decode('utf-8')
        mime_type = file.content_type or 'application/pdf'

        return {
            "success": True,
            "message": f"Extraction OCR ({t_ocr}s) et structuration NER ({t_llm}s) effectuées en {t_total}s.",
            "candidature_id": candidature_id,
            "id_offre": id_offre,
            "filename": file.filename,
            "cv_nom": file.filename or "cv.pdf",
            "cv_mime": mime_type,
            "cv_base64": cv_b64,
            "texte_brut_ocr": raw_text,
            "donnees_json": structured_data,
            "duree_secondes": {
                "ocr": t_ocr,
                "llm": t_llm,
                "total": t_total,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du traitement du CV : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur microservice OCR/NER : {str(e)}")


class EmailClassifyRequest(BaseModel):
    subject: str
    body: str
    active_offers: Optional[Union[List[Any], str]] = None


@app.post("/classify-email")
def classify_email(req: EmailClassifyRequest):
    """
    Analyse l'intention d'un email (demande_offre, demande_spontanee, demande_information)
    via le modèle local Llama 3.2.
    """
    try:
        offers = req.active_offers
        if isinstance(offers, str):
            try:
                offers = json.loads(offers) if offers.strip() else []
            except Exception:
                offers = []
        if not isinstance(offers, list):
            offers = []

        classification = classify_email_intent(
            subject=req.subject,
            body=req.body,
            active_offers=offers
        )
        return {
            "success": True,
            "classification": classification
        }
    except Exception as e:
        logger.error(f"Erreur lors de la classification de l'email : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur classification IA : {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
