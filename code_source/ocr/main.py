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


def _parse_optional_int(val: Any) -> Optional[int]:
    """Convertit en toute sécurité une valeur issue de n8n ('', 'undefined', 'null', int) en Optional[int]."""
    if val is None or isinstance(val, bool):
        return None
    if isinstance(val, int):
        return val if val > 0 else None
    s = str(val).strip().lower()
    if not s or s in ("null", "none", "undefined", "nan", "0"):
        return None
    try:
        v = int(float(s))
        return v if v > 0 else None
    except Exception:
        return None


# =====================================================================
# 1. NOEUD 1 : OCR PUR (Extraction de texte brut + transport base64)
# =====================================================================
@app.post("/ocr")
async def extract_ocr_only(
    file: UploadFile = File(...),
    candidature_id: Optional[Union[int, str]] = Form(None),
    id_offre: Optional[Union[int, str]] = Form(None)
):
    """
    Étape 1 du pipeline :
    - Extrait le texte brut du CV via pypdf / PaddleOCR
    - Encode le fichier en Base64 pour le stockage final
    - Propage et retourne systématiquement l'id_offre reçu (ou null si spontanée)
    """
    try:
        clean_id_offre = _parse_optional_int(id_offre)
        clean_candidature_id = _parse_optional_int(candidature_id)
        logger.info(f"[OCR] Traitement fichier : {file.filename} (id_offre: {clean_id_offre})")
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
            "candidature_id": clean_candidature_id,
            "id_offre": clean_id_offre,
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
    id_offre: Optional[Union[int, str]] = None
    cv_base64: Optional[str] = None
    cv_nom: Optional[str] = None
    cv_mime: Optional[str] = None
    candidature_id: Optional[Union[int, str]] = None
    timeout: Optional[int] = 45


@app.post("/ner")
def parse_ner_only(req: NerParseRequest):
    """
    Étape 2 du pipeline :
    - Prend le texte brut OCR en JSON
    - Extrait les entités (contact, compétences, expériences, projets, formations) via Qwen 2.5 (7B)
    - Propage et retourne systématiquement l'id_offre et cv_base64
    - Timeout configurable pour éviter tout blocage indéfini
    """
    try:
        clean_id_offre = _parse_optional_int(req.id_offre)
        clean_candidature_id = _parse_optional_int(req.candidature_id)
        logger.info(f"[NER] Structuration du texte (id_offre: {clean_id_offre}, timeout: {req.timeout}s)")
        t0 = time.time()
        timeout_val = req.timeout or 45
        structured_data = parse_cv_with_llm(req.texte_brut_ocr, timeout=timeout_val)
        t_llm = round(time.time() - t0, 3)

        return {
            "success": True,
            "message": f"Structuration NER effectuée en {t_llm}s.",
            "id_offre": clean_id_offre,
            "candidature_id": clean_candidature_id,
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
    candidature_id: Optional[Union[int, str]] = Form(None),
    id_offre: Optional[Union[int, str]] = Form(None)
):
    """Pipeline combiné OCR + NER en un seul appel."""
    try:
        id_offre = _parse_optional_int(id_offre)
        candidature_id = _parse_optional_int(candidature_id)
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
    subject: Optional[str] = ""
    body: Optional[str] = ""
    content: Optional[str] = None
    sender: Optional[str] = None
    active_offers: Optional[Union[List[Any], str]] = None


@app.post("/classify-email")
@app.post("/api/classifier-intention")
@app.post("/classifier-intention")
def classify_email(req: EmailClassifyRequest):
    """
    Analyse l'intention d'un email (demande_emploi, information, spam)
    via le modèle local Qwen 2.5 (7B).
    Supporte à la fois { subject, body } et { sender, subject, content }.
    """
    try:
        subject_val = req.subject or ""
        body_val = req.body or req.content or ""
        offers = req.active_offers
        if isinstance(offers, str):
            try:
                offers = json.loads(offers) if offers.strip() else []
            except Exception:
                offers = []
        if not isinstance(offers, list):
            offers = []

        classification = classify_email_intent(
            subject=subject_val,
            body=body_val,
            active_offers=offers
        )
        
        # Mapping et harmonisation pour n8n
        raw_type = classification.get("type", "demande_information")
        # Normalisation vers les 3 clés standardisées: demande_emploi, information, spam
        if "offre" in raw_type or "spontan" in raw_type or raw_type == "demande_emploi":
            intention_standard = "demande_emploi"
        elif "info" in raw_type or raw_type == "information":
            intention_standard = "information"
        else:
            intention_standard = "spam"

        return {
            "success": True,
            "type": intention_standard,
            "intention": intention_standard,
            "id_offre": classification.get("id_offre"),
            "code_offre": classification.get("reference_offre"),
            "reference_offre": classification.get("reference_offre"),
            "offre_ciblee": classification.get("offre_ciblee"),
            "confiance": classification.get("confiance", 0.9),
            "email_expediteur": req.sender or classification.get("email_expediteur"),
            "sujet": subject_val,
            "details": classification
        }
    except Exception as e:
        logger.error(f"Erreur lors de la classification de l'email : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur classification IA : {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
