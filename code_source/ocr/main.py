# -*- coding: utf-8 -*-
"""
main.py
=======
Microservice FastAPI pour Alpha Ciment :
- Orchestration du pipeline OCR (PaddleOCR, PyPDF, python-docx)
- Structuration sémantique NER (LLM local qwen2.5:7b via Ollama)
- Classification intelligente et filtrage déterministe d'emails (n8n)
"""

import base64
import json
import logging
import secrets
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Union

import uvicorn
from fastapi import APIRouter, Depends, FastAPI, File, Form, Header, HTTPException, Request, Response, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from config import (
    ENV,
    MAX_UPLOAD_BYTES,
    OLLAMA_MODEL,
    PIPELINE_API_KEY,
    RELOAD_APP,
)
from cv_llm_parser import DEFAULT_MODEL, parse_cv_with_llm
from cv_ocr_extractor import (
    PADDLE_AVAILABLE,
    PYPDF_AVAILABLE,
    extract_raw_text_from_bytes,
    extract_text,
)
from document_classifier import classify_document, select_best_cv
from email_classifier import classify_email_intent
from ollama_client import (
    InvalidModelOutput,
    OllamaBusy,
    OllamaException,
    OllamaTimeout,
    OllamaUnavailable,
    is_available as is_ollama_available,
    warmup,
)

# -----------------------------------------------------------------------------
# CONFIGURATION DES LOGS & TRACABILITÉ
# -----------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("AlphaCimentOCR")


# -----------------------------------------------------------------------------
# GESTION DU CYCLE DE VIE (LIFESPAN & WARMUP EN TÂCHE DE FOND)
# -----------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialisation au démarrage et nettoyage à l'arrêt."""
    logger.info(f"Démarrage du microservice Alpha Ciment OCR & NER (Modèle: {OLLAMA_MODEL}, Env: {ENV}).")
    # Lancement du préchargement en arrière-plan sans bloquer le démarrage de l'app
    warmup()
    yield
    logger.info("Arrêt du microservice OCR & NER.")


# -----------------------------------------------------------------------------
# APPLICATION FASTAPI & SÉCURISATION OPENAPI
# -----------------------------------------------------------------------------
app = FastAPI(
    title="Alpha Ciment - Microservice OCR & NER (PaddleOCR + Qwen 2.5 7B)",
    description="Microservice d'extraction optique (OCR) et de structuration intelligente (NER Qwen 2.5) de CVs.",
    version="2.1.0",
    lifespan=lifespan,
    docs_url=None if ENV == "production" else "/docs",
    redoc_url=None if ENV == "production" else "/redoc",
    openapi_url=None if ENV == "production" else "/openapi.json",
)


# -----------------------------------------------------------------------------
# MIDDLEWARE X-REQUEST-ID & TRAÇABILITÉ SÉCURISÉE
# -----------------------------------------------------------------------------
@app.middleware("http")
async def request_id_and_audit_middleware(request: Request, call_next):
    """
    Associe un identifiant unique X-Request-ID à chaque transaction.
    Garantit l'absence d'informations sensibles (sujets, contenu CV, noms) dans les logs INFO.
    """
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    t0 = time.perf_counter()

    response: Response = await call_next(request)

    duration_ms = round((time.perf_counter() - t0) * 1000, 2)
    response.headers["X-Request-ID"] = request_id

    # Journalisation sécurisée (méthode, chemin, statut, durée et request_id uniquement)
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)"
    )
    return response


# -----------------------------------------------------------------------------
# DÉPENDANCE DE SÉCURITÉ : VÉRIFICATION CLÉ API (X-API-KEY)
# -----------------------------------------------------------------------------
def verify_pipeline_api_key(
    request: Request,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    """
    Valide l'en-tête X-API-Key en temps constant pour prévenir les attaques temporelles.
    Tolère la casse et élimine les espaces parasites pour un couplage robuste avec n8n.
    """
    token = x_api_key
    if not token:
        token = request.headers.get("x-api-key") or request.headers.get("X-API-Key")

    if not token or not isinstance(token, str):
        headers_info = list(request.headers.keys())
        logger.warning(
            f"Tentative d'accès non autorisée : en-tête X-API-Key absent. "
            f"En-têtes reçus par le microservice : {headers_info}"
        )
        raise HTTPException(
            status_code=401,
            detail="En-tête X-API-Key manquant. Authentification requise pour le pipeline."
        )

    # Nettoyage préventif des espaces et retours à la ligne
    token_clean = token.strip()
    expected_clean = PIPELINE_API_KEY.strip()

    # Comparaison en temps constant sur octets UTF-8
    if not secrets.compare_digest(token_clean.encode("utf-8"), expected_clean.encode("utf-8")):
        logger.warning(
            f"Tentative d'accès non autorisée : clé API invalide "
            f"(longueur reçue={len(token_clean)}, attendue={len(expected_clean)})."
        )
        raise HTTPException(
            status_code=401,
            detail="Clé API invalide. Accès refusé."
        )

    return token_clean


# Routeur sécurisé appliquant la clé API à toutes les routes métier
secured_router = APIRouter(dependencies=[Depends(verify_pipeline_api_key)])


# -----------------------------------------------------------------------------
# ROUTES PUBLIQUES D'ÉTAT DE SANTÉ (SANS CLÉ API)
# -----------------------------------------------------------------------------
@app.get("/")
@app.get("/health")
def health_check():
    """
    Vérification de santé minimale publique (statut & readiness) sans divulgation d'infrastructure.
    """
    ollama_ok = is_ollama_available()
    return {
        "status": "ok",
        "ready": ollama_ok,
    }


@secured_router.get("/health/details")
def health_check_details():
    """
    Diagnostic d'état approfondi de l'infrastructure réservé aux administrateurs (X-API-Key requise).
    """
    ollama_ok = is_ollama_available()
    return {
        "status": "ok",
        "ready": ollama_ok,
        "service": "Alpha Ciment - Microservice OCR & NER",
        "paddle_ocr_installed": PADDLE_AVAILABLE,
        "pypdf_installed": PYPDF_AVAILABLE,
        "ollama_connected": ollama_ok,
        "llm_model": DEFAULT_MODEL,
        "version": "2.1.0"
    }


def _parse_optional_int(val: Any) -> Optional[int]:
    """Convertit en toute sécurité une valeur issue de n8n en Optional[int]."""
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


# =============================================================================
# 1. NOEUD 1 : OCR PUR (Extraction de texte brut + transport base64)
# =============================================================================
@secured_router.post("/ocr")
def extract_ocr_only(
    file: UploadFile = File(...),
    candidature_id: Optional[Union[int, str]] = Form(None),
    id_offre: Optional[Union[int, str]] = Form(None)
):
    """
    Étape 1 du pipeline :
    - Synchrone (def) pour éviter les blocages de thread pool FastAPI
    - Plafonne la taille du fichier (HTTP 413 si > MAX_UPLOAD_BYTES)
    - Rejette les types non supportés en HTTP 415
    - Réponse HTTP 200 avec success=false si ocr_status vaut 'vide' ou 'echec'
    """
    clean_id_offre = _parse_optional_int(id_offre)
    clean_candidature_id = _parse_optional_int(candidature_id)

    # 1. Lecture plafonnée pour protéger la mémoire
    file_bytes = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        max_mb = MAX_UPLOAD_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux. La taille maximale autorisée est de {max_mb} Mo."
        )

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Fichier CV vide ou corrompu.")

    t0 = time.perf_counter()
    ocr_result = extract_text(file_bytes, file.filename or "document")
    t_ocr = round(time.perf_counter() - t0, 3)

    # Rejet immédiat en 415 si format binaire non supporté
    if ocr_result.get("reason") in ("type_non_supporte", "format_non_supporte"):
        raise HTTPException(
            status_code=415,
            detail=f"Format de fichier non supporté. Raison : {ocr_result.get('reason')}"
        )

    ocr_status = ocr_result.get("ocr_status", "echec")
    raw_text = ocr_result.get("text", "")
    is_success = (ocr_status == "ok")

    cv_b64 = base64.b64encode(file_bytes).decode("utf-8")
    mime_type = file.content_type or "application/pdf"

    msg = f"Extraction OCR effectuée en {t_ocr}s." if is_success else f"Extraction OCR non concluante ({ocr_status})."

    return {
        "success": is_success,
        "ocr_status": ocr_status,
        "method": ocr_result.get("method"),
        "pages": ocr_result.get("pages", 1),
        "warnings": ocr_result.get("warnings", []),
        "message": msg,
        "candidature_id": clean_candidature_id,
        "id_offre": clean_id_offre,
        "filename": file.filename,
        "cv_nom": file.filename or "cv.pdf",
        "cv_mime": mime_type,
        "cv_base64": cv_b64,
        "texte_brut_ocr": raw_text,
        "duree_secondes": {"ocr": t_ocr}
    }


# =============================================================================
# 1B. IDENTIFICATEUR ET SÉLECTEUR DE CV MULTI-PIÈCES JOINTES
# =============================================================================
class DocumentPayload(BaseModel):
    key: Optional[str] = None
    filename: str
    base64: Optional[str] = None
    text: Optional[str] = None
    size: Optional[int] = 0

class IdentifyCvRequest(BaseModel):
    documents: List[DocumentPayload]

@secured_router.post("/identify-cv")
def identify_cv_endpoint(req: IdentifyCvRequest):
    """
    Analyse une liste de pièces jointes (en base64 ou texte extrait) et identifie
    avec certitude laquelle correspond au véritable CV en comparant scores lexicaux,
    densité de rubriques de CV, format et exclusions (LM, diplômes).
    """
    classified_list = []
    for doc in req.documents:
        text = doc.text or ""
        file_size = doc.size or 0
        if not text and doc.base64:
            try:
                b64 = doc.base64
                if ";base64," in b64:
                    b64 = b64.split(";base64,")[-1]
                file_bytes = base64.b64decode(b64)
                file_size = len(file_bytes)
                ocr_res = extract_text(file_bytes, doc.filename)
                text = ocr_res.get("text", "")
            except Exception as e:
                logger.warning(f"[Identify-CV] Échec extraction pour {doc.filename}: {e}")
                text = ""

        classification = classify_document(text=text, filename=doc.filename, file_size=file_size)
        classification["key"] = doc.key
        classification["extracted_text"] = text[:300] if text else ""
        classified_list.append(classification)

    result = select_best_cv(classified_list)
    return {
        "success": True,
        **result
    }


@secured_router.post("/identify-cv-upload")
async def identify_cv_upload(files: List[UploadFile] = File(...)):
    """
    Reçoit plusieurs fichiers en multipart/form-data et identifie lequel est le CV.
    """
    classified_list = []
    for file in files:
        file_bytes = await file.read()
        ocr_res = extract_text(file_bytes, file.filename or "document")
        text = ocr_res.get("text", "")
        classification = classify_document(text=text, filename=file.filename or "", file_size=len(file_bytes))
        classified_list.append(classification)

    result = select_best_cv(classified_list)
    return {
        "success": True,
        **result
    }



# =============================================================================
# 2. NOEUD 2 : NER PUR (Structuration sémantique via Qwen 2.5 7B)
# =============================================================================
class NerParseRequest(BaseModel):
    texte_brut_ocr: str
    id_offre: Optional[Union[int, str]] = None
    cv_base64: Optional[str] = None
    cv_nom: Optional[str] = None
    cv_mime: Optional[str] = None
    candidature_id: Optional[Union[int, str]] = None
    timeout: Optional[int] = 120


@secured_router.post("/ner")
def parse_ner_only(req: NerParseRequest):
    """
    Étape 2 du pipeline :
    - Prend le texte brut OCR en JSON
    - Extrait les entités (contact, compétences, expériences, projets, formations)
    - Retourne 'ner_status' ('ok', 'partiel', 'vide')
    - Traduit l'indisponibilité Ollama en HTTP 503 (Retry-After) et sortie invalide en 502
    """
    clean_id_offre = _parse_optional_int(req.id_offre)
    clean_candidature_id = _parse_optional_int(req.candidature_id)
    timeout_val = req.timeout or 120

    t0 = time.perf_counter()

    try:
        structured_data = parse_cv_with_llm(req.texte_brut_ocr, timeout=timeout_val)
    except OllamaBusy as ob:
        logger.warning(f"[NER] File d'attente Ollama saturée : {ob}")
        raise HTTPException(
            status_code=503,
            detail=f"Service IA temporairement saturé : {str(ob)}",
            headers={"Retry-After": "10"}
        )
    except (OllamaUnavailable, OllamaTimeout) as oe:
        logger.error(f"[NER] Service Ollama indisponible ou expiré : {oe}")
        raise HTTPException(
            status_code=503,
            detail=f"Moteur IA indisponible : {str(oe)}",
            headers={"Retry-After": "5"}
        )
    except InvalidModelOutput as imo:
        logger.error(f"[NER] Sortie modèle invalide : {imo}")
        raise HTTPException(
            status_code=502,
            detail=f"Sortie du modèle IA invalide après validation : {str(imo)}"
        )
    except Exception as e:
        logger.error(f"[NER] Erreur inattendue : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur NER : {str(e)}")

    t_llm = round(time.perf_counter() - t0, 3)
    ner_status = structured_data.get("ner_status", "ok")

    return {
        "success": True,
        "ner_status": ner_status,
        "warnings": structured_data.get("warnings", []),
        "message": f"Structuration NER effectuée en {t_llm}s (statut: {ner_status}).",
        "id_offre": clean_id_offre,
        "candidature_id": clean_candidature_id,
        # DEPRECATED: conservé pour compatibilité existante avec les anciens workflows n8n
        "cv_base64": req.cv_base64,
        "cv_nom": req.cv_nom,
        "cv_mime": req.cv_mime,
        "texte_brut_ocr": req.texte_brut_ocr,
        "donnees_json": structured_data,
        "duree_secondes": {"llm": t_llm}
    }


# =============================================================================
# 3. COMBINÉ (OCR + NER) - Conservé pour compatibilité n8n
# =============================================================================
@secured_router.post("/extract-cv")
@secured_router.post("/extract")  # DEPRECATED: alias conservé pour compatibilité
def extract_cv(
    file: UploadFile = File(...),
    candidature_id: Optional[Union[int, str]] = Form(None),
    id_offre: Optional[Union[int, str]] = Form(None)
):
    """
    Pipeline combiné OCR + NER en un seul appel synchrone (def).
    Plafonne la taille du fichier à MAX_UPLOAD_BYTES (HTTP 413).
    """
    clean_id_offre = _parse_optional_int(id_offre)
    clean_candidature_id = _parse_optional_int(candidature_id)

    file_bytes = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        max_mb = MAX_UPLOAD_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux. La taille maximale autorisée est de {max_mb} Mo."
        )

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Fichier CV vide ou corrompu.")

    t0 = time.perf_counter()
    ocr_result = extract_text(file_bytes, file.filename or "document")
    t_ocr = round(time.perf_counter() - t0, 3)

    if ocr_result.get("reason") in ("type_non_supporte", "format_non_supporte"):
        raise HTTPException(
            status_code=415,
            detail=f"Format de fichier non supporté. Raison : {ocr_result.get('reason')}"
        )

    ocr_status = ocr_result.get("ocr_status", "echec")
    raw_text = ocr_result.get("text", "")
    all_warnings = list(ocr_result.get("warnings", []))

    cv_b64 = base64.b64encode(file_bytes).decode("utf-8")
    mime_type = file.content_type or "application/pdf"

    # Si l'OCR est vide ou en échec, on ne sollicite pas le LLM inutilement
    if ocr_status != "ok" or not raw_text.strip():
        return {
            "success": False,
            "ocr_status": ocr_status,
            "ner_status": "vide",
            "warnings": all_warnings,
            "message": f"Extraction OCR non concluante ({ocr_status}). Traitement interrompu.",
            "candidature_id": clean_candidature_id,
            "id_offre": clean_id_offre,
            "filename": file.filename,
            "cv_nom": file.filename or "cv.pdf",
            "cv_mime": mime_type,
            "cv_base64": cv_b64,
            "texte_brut_ocr": "",
            "donnees_json": {},
            "duree_secondes": {
                "ocr": t_ocr,
                "llm": 0.0,
                "total": t_ocr,
            }
        }

    t1 = time.perf_counter()
    try:
        structured_data = parse_cv_with_llm(raw_text)
    except OllamaBusy as ob:
        logger.warning(f"[ExtractCV] File d'attente Ollama saturée : {ob}")
        raise HTTPException(
            status_code=503,
            detail=f"Service IA temporairement saturé : {str(ob)}",
            headers={"Retry-After": "10"}
        )
    except (OllamaUnavailable, OllamaTimeout) as oe:
        raise HTTPException(
            status_code=503,
            detail=f"Moteur IA indisponible : {str(oe)}",
            headers={"Retry-After": "5"}
        )
    except InvalidModelOutput as imo:
        raise HTTPException(status_code=502, detail=f"Sortie IA invalide : {str(imo)}")

    t_llm = round(time.perf_counter() - t1, 3)
    t_total = round(t_ocr + t_llm, 3)

    ner_status = structured_data.get("ner_status", "ok")
    all_warnings.extend(structured_data.get("warnings", []))

    return {
        "success": True,
        "ocr_status": ocr_status,
        "ner_status": ner_status,
        "warnings": all_warnings,
        "message": f"Extraction OCR ({t_ocr}s) et structuration NER ({t_llm}s) effectuées en {t_total}s.",
        "candidature_id": clean_candidature_id,
        "id_offre": clean_id_offre,
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


# =============================================================================
# 4. CLASSIFICATEUR D'EMAILS
# =============================================================================
class EmailClassifyRequest(BaseModel):
    subject: Optional[str] = ""
    body: Optional[str] = ""
    content: Optional[str] = None
    sender: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    active_offers: Optional[Union[List[Any], str]] = None


@secured_router.post("/classify-email")
# DEPRECATED: alias conservés pour compatibilité avec d'anciens flux n8n
@secured_router.post("/api/classifier-intention")
@secured_router.post("/classifier-intention")
def classify_email(req: EmailClassifyRequest):
    """
    Analyse l'intention d'un email avec pipeline renforcé :
    1. Détection sans IA des rebonds NDR / spams / messages automatiques
    2. Détection déterministe des références d'offres par regex
    3. Classification sémantique Qwen 2.5 7B avec schéma JSON strict
    4. Repli heuristique traçable
    """
    subject_val = req.subject or ""
    body_val = req.body or req.content or ""
    sender_val = req.sender or ""

    offers = req.active_offers
    if isinstance(offers, str):
        try:
            offers = json.loads(offers) if offers.strip() else []
        except Exception:
            offers = []
    if not isinstance(offers, list):
        offers = None

    try:
        classification = classify_email_intent(
            subject=subject_val,
            body=body_val,
            active_offers=offers,
            sender=sender_val,
            headers=req.headers,
        )
    except OllamaBusy as ob:
        logger.warning(f"[ClassifyEmail] Ollama occupé (file d'attente saturée) : {ob}")
        raise HTTPException(
            status_code=503,
            detail=f"Service IA temporairement saturé : {str(ob)}",
            headers={"Retry-After": "10"}
        )

    raw_type = classification.get("type", "demande_information")

    # Normalisation stricte vers les 3 contrats n8n : demande_emploi, information, spam
    if raw_type in ("demande_offre", "demande_spontanee", "demande_emploi"):
        intention_standard = "demande_emploi"
    elif raw_type in ("demande_information", "information"):
        intention_standard = "information"
    else:
        # 'hors_sujet' ou indéterminé -> spam
        intention_standard = "spam"

    confiance_val = float(classification.get("confiance", 0.0) or 0.0)

    return {
        "success": True,
        "type": intention_standard,
        "intention": intention_standard,
        "id_offre": classification.get("id_offre"),
        "code_offre": classification.get("reference_offre"),
        "reference_offre": classification.get("reference_offre"),
        "offre_ciblee": classification.get("offre_ciblee"),
        "confiance": confiance_val,
        "source": classification.get("source", "llm"),
        "a_verifier": classification.get("a_verifier", False),
        "email_expediteur": sender_val or classification.get("email_expediteur"),
        "sujet": subject_val,
        "details": classification
    }


# Inclusion des routes sécurisées
app.include_router(secured_router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=RELOAD_APP)
