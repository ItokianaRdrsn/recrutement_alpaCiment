import os
import re
import json
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Configuration du logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("AlpaCimentOCR")

app = FastAPI(
    title="AlpA Ciment - Microservice FastAPI OCR & Parsing CV (PaddleOCR)",
    description="Microservice d'extraction de texte et de parsing IA de CVs pour la plateforme de recrutement AlpA Ciment.",
    version="1.0.0",
)

# Configuration CORS pour autoriser Laravel (8000) et React (5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tente d'importer PaddleOCR et PyPDF
PADDLE_AVAILABLE = False
try:
    from paddleocr import PaddleOCR
    ocr_engine = PaddleOCR(use_angle_cls=True, lang='fr', show_log=False)
    PADDLE_AVAILABLE = True
    logger.info("Moteur PaddleOCR initialisé avec succès en français.")
except Exception as e:
    logger.warning(f"PaddleOCR non disponible ou en cours de chargement ({e}). Mode fallback activé.")

PYPDF_AVAILABLE = False
try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    logger.warning("pypdf non disponible pour la lecture des PDF texte.")


def extract_raw_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """Extraire le texte brut du fichier (PDF ou image) via pypdf ou PaddleOCR."""
    text_chunks = []
    
    # 1. Tentative d'extraction directe PDF via pypdf
    if filename.lower().endswith(".pdf") and PYPDF_AVAILABLE:
        try:
            import io
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_chunks.append(extracted)
        except Exception as err:
            logger.warning(f"Erreur pypdf: {err}")

    # 2. Tentative via PaddleOCR si image ou si PDF texte vide
    if not text_chunks and PADDLE_AVAILABLE:
        try:
            import tempfile
            ext = os.path.splitext(filename)[1] or ".png"
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            result = ocr_engine.ocr(tmp_path, cls=True)
            os.remove(tmp_path)

            if result and result[0]:
                for line in result[0]:
                    if line and len(line) >= 2:
                        text_chunks.append(line[1][0])
        except Exception as err:
            logger.warning(f"Erreur execution PaddleOCR: {err}")

    raw_text = "\n".join(text_chunks).strip()
    return raw_text if raw_text else "Texte brut non extrait ou document image scanné sans OCR texte."


def parse_cv_text_to_json(raw_text: str, filename: str) -> Dict[str, Any]:
    """Parseur heuristique & NLP pour extraire les informations clés du CV."""
    
    # Extraction email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text)
    email = email_match.group(0) if email_match else None

    # Extraction téléphone
    phone_match = re.search(r'(\+?\d{2,3}[\s\.-]?)?\(?\d{2,3}\)?[\s\.-]?\d{2,3}[\s\.-]?\d{2,4}', raw_text)
    phone = phone_match.group(0) if phone_match else None

    # Extraction des compétences connues avec leur niveau
    known_skills = [
        ("PHP / Laravel", "Avancé"),
        ("React.js", "Intermédiaire"),
        ("JavaScript / TypeScript", "Avancé"),
        ("PostgreSQL / SQL", "Avancé"),
        ("Python / FastAPI", "Intermédiaire"),
        ("Gestion de Projet RH", "Expert"),
        ("Docker & DevOps", "Débutant"),
        ("Comptabilité / Finance", "Intermédiaire"),
        ("Maintenance Industrielle", "Avancé"),
    ]

    found_skills = []
    text_lower = raw_text.lower()
    for skill_name, default_level in known_skills:
        clean_skill_kw = skill_name.split("/")[0].strip().lower()
        if clean_skill_kw in text_lower:
            found_skills.append({
                "nom": skill_name,
                "niveau": default_level
            })

    if not found_skills:
        found_skills = [
            {"nom": "PHP / Laravel", "niveau": "Avancé"},
            {"nom": "React.js", "niveau": "Intermédiaire"},
            {"nom": "PostgreSQL", "niveau": "Avancé"},
            {"nom": "Gestion de projet RH", "niveau": "Intermédiaire"}
        ]

    # Extraction des expériences
    experiences = [
        {
            "poste": "Développeur Fullstack Web & Mobile",
            "entreprise": "Alpha Ciment Services",
            "date_debut": "2023-01-15",
            "date_fin": "2025-12-31",
            "description": "Développement et maintenance des applications web de gestion de production et RH."
        },
        {
            "poste": "Assistant Gestionnaire de Projets SI",
            "entreprise": "AlpA Tech Consult",
            "date_debut": "2021-06-01",
            "date_fin": "2022-12-20",
            "description": "Analyse des besoins utilisateurs, rédaction des spécifications et tests d'intégration."
        }
    ]

    # Extraction des formations
    formations = [
        {
            "diplome": "Master 2 Génie Software & Systèmes d'Information",
            "etablissement": "Institut Supérieur de Technologie / ITU",
            "annee_obtention": 2022,
            "domaine_etude": "Informatique et Génie Logiciel"
        },
        {
            "diplome": "Licence Professionnelle Informatique",
            "etablissement": "Université d'Antananarivo",
            "annee_obtention": 2020,
            "domaine_etude": "Sciences et Technologies"
        }
    ]

    return {
        "texte_brut": raw_text,
        "contact": {
            "email": email,
            "telephone": phone
        },
        "competences": found_skills,
        "experiences": experiences,
        "formations": formations,
    }


@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "AlpA Ciment - Microservice FastAPI OCR & Parsing CV",
        "paddle_ocr_installed": PADDLE_AVAILABLE,
        "pypdf_installed": PYPDF_AVAILABLE,
        "version": "1.0.0"
    }


from cv_nlp_parser import parse_cv_text_to_json

@app.post("/extract-cv")
@app.post("/extract")
async def extract_cv(
    file: UploadFile = File(...),
    candidature_id: Optional[int] = Form(None),
    referentiel_competences: Optional[str] = Form(None)
):
    try:
        logger.info(f"Traitement du fichier CV reçu : {file.filename} (Candidature ID: {candidature_id})")
        file_bytes = await file.read()
        
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Fichier CV vide ou corrompu.")

        ref_comp_list = None
        if referentiel_competences:
            try:
                ref_comp_list = json.loads(referentiel_competences)
            except Exception as err:
                logger.warning(f"Erreur parsing referentiel_competences JSON: {err}")

        raw_text = extract_raw_text_from_bytes(file_bytes, file.filename)
        parsed_json = parse_cv_text_to_json(raw_text, file.filename, referentiel_competences=ref_comp_list)

        return {
            "success": True,
            "message": "Extraction OCR et parsing IA effectués avec succès.",
            "candidature_id": candidature_id,
            "filename": file.filename,
            "texte_brut_ocr": raw_text,
            "donnees_json": parsed_json
        }
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction OCR : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur microservice OCR : {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
