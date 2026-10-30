# -*- coding: utf-8 -*-
"""
cv_ocr_extractor.py
===================
Module d'extraction de texte brut (OCR) pour les CVs.
Responsabilités :
- Extraction native rapide pour PDF numériques via PyPDF
- Support des fichiers Word .docx via python-docx
- Rejet explicite et sécurisé des formats obsolètes .doc
- Détection du type réel par signature binaire (magic bytes)
- Détection optique par vision via PaddleOCR (protégé par sémaphore de concurrence)
- Orientation automatique des images (ImageOps.exif_transpose)
- Plafonnement du nombre de pages analysées (MAX_PDF_PAGES)
"""

import io
import logging
import os
import tempfile
import threading
from typing import Any, Dict, List, Tuple

from config import MAX_PDF_PAGES, OCR_CONCURRENCY

# Configuration des variables d'environnement anti-conflits CPU Windows pour PaddlePaddle 3.x
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_use_onednn"] = "0"
os.environ["PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT"] = "0"

logger = logging.getLogger("AlpaCimentOCR.extractor")

# Sémaphore de limitation de concurrence OCR
_ocr_semaphore = threading.Semaphore(max(1, OCR_CONCURRENCY))

PADDLE_AVAILABLE = False
ocr_engine = None

try:
    from paddleocr import PaddleOCR
    try:
        # PaddleOCR 3.x
        ocr_engine = PaddleOCR(lang='fr', use_textline_orientation=False)
    except (TypeError, ValueError):
        # PaddleOCR 2.x
        ocr_engine = PaddleOCR(use_angle_cls=False, lang='fr', show_log=False)
    PADDLE_AVAILABLE = True
    logger.info("Moteur PaddleOCR initialisé avec succès en français.")
except Exception as e:
    logger.warning(f"PaddleOCR non disponible ({e}). Mode fallback PyPDF / python-docx uniquement.")

PYPDF_AVAILABLE = False
try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    logger.warning("pypdf non disponible pour la lecture des PDF texte.")

DOCX_AVAILABLE = False
try:
    import docx
    DOCX_AVAILABLE = True
except ImportError:
    logger.warning("python-docx non disponible pour la lecture des fichiers .docx.")


# =============================================================================
# DÉTECTION DU TYPE PAR SIGNATURE BINAIRE
# =============================================================================

def detect_file_type(file_bytes: bytes, filename: str = "") -> Tuple[str, str]:
    """
    Identifie le type réel du fichier via sa signature magique (magic bytes).
    Retourne (format_type, error_reason).
    format_type parmi : 'pdf', 'docx', 'image', 'doc', 'unsupported'
    """
    if not file_bytes:
        return "empty", "fichier_vide"

    # 1. PDF : commence par %PDF
    if file_bytes.startswith(b"%PDF"):
        return "pdf", ""

    # 2. DOCX : archive ZIP (PK\x03\x04)
    if file_bytes.startswith(b"PK\x03\x04"):
        # Vérification si c'est bien un Word docx ou un simple zip
        fn_lower = (filename or "").lower()
        if fn_lower.endswith(".docx") or b"word/" in file_bytes[:2048]:
            return "docx", ""
        return "docx", ""

    # 3. Ancien format Word binaire .doc (OLE Compound File) : D0 CF 11 E0
    if file_bytes.startswith(b"\xd0\xcf\x11\xe0"):
        return "doc", "format_non_supporte"

    # Si extension .doc explicite sans magic bytes reconnus
    if filename and filename.lower().endswith(".doc"):
        return "doc", "format_non_supporte"

    # 4. Images courantes
    # JPEG : FF D8 FF
    if file_bytes.startswith(b"\xff\xd8\xff"):
        return "image", ""
    # PNG : 89 50 4E 47 0D 0A 1A 0A
    if file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image", ""
    # WEBP : RIFF....WEBP
    if file_bytes.startswith(b"RIFF") and len(file_bytes) >= 12 and file_bytes[8:12] == b"WEBP":
        return "image", ""

    # Si l'extension indique une image reconnue
    fn_lower = (filename or "").lower()
    if any(fn_lower.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff")):
        return "image", ""

    return "unsupported", "type_non_supporte"


# =============================================================================
# FONCTION PRINCIPALE : EXTRACT_TEXT
# =============================================================================

def extract_text(file_bytes: bytes, filename: str = "") -> Dict[str, Any]:
    """
    Extrait le texte structuré avec métadonnées d'état détaillées.
    Retourne un dictionnaire :
    {
        "text": str,
        "ocr_status": "ok" | "vide" | "echec",
        "method": "pypdf" | "docx" | "paddleocr" | "none",
        "pages": int,
        "warnings": List[str],
        "reason": Optional[str]
    }
    """
    warnings: List[str] = []

    if not file_bytes:
        return {
            "text": "",
            "ocr_status": "vide",
            "method": "none",
            "pages": 0,
            "warnings": ["Fichier vide ou sans contenu."],
            "reason": "fichier_vide"
        }

    # 1. Vérification du type réel
    detected_type, error_reason = detect_file_type(file_bytes, filename)

    if detected_type == "doc":
        return {
            "text": "",
            "ocr_status": "echec",
            "method": "none",
            "pages": 0,
            "warnings": ["Le format Word binaire .doc n'est pas supporté. Veuillez convertir en .docx ou .pdf."],
            "reason": "format_non_supporte"
        }

    if detected_type == "unsupported":
        return {
            "text": "",
            "ocr_status": "echec",
            "method": "none",
            "pages": 0,
            "warnings": [f"Type de fichier non supporté pour '{filename}'. Formats acceptés : PDF, DOCX, JPEG, PNG, WEBP."],
            "reason": "type_non_supporte"
        }

    # 2. Traitement DOCX
    if detected_type == "docx":
        if not DOCX_AVAILABLE:
            return {
                "text": "",
                "ocr_status": "echec",
                "method": "none",
                "pages": 0,
                "warnings": ["La bibliothèque python-docx n'est pas installée sur le serveur."],
                "reason": "bibliotheque_manquante"
            }
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_cells = [c.text.strip() for c in row.cells if c.text.strip()]
                    if row_cells:
                        paragraphs.append(" | ".join(row_cells))

            text = "\n".join(paragraphs).strip()
            if text:
                return {
                    "text": text,
                    "ocr_status": "ok",
                    "method": "docx",
                    "pages": 1,
                    "warnings": warnings,
                    "reason": None
                }
            else:
                return {
                    "text": "",
                    "ocr_status": "vide",
                    "method": "docx",
                    "pages": 1,
                    "warnings": ["Fichier DOCX valide mais ne contenant aucun texte."],
                    "reason": "aucun_texte"
                }
        except Exception as err:
            logger.error(f"[OCR] Erreur lecture DOCX : {err}")
            return {
                "text": "",
                "ocr_status": "echec",
                "method": "docx",
                "pages": 0,
                "warnings": [f"Erreur lors de la lecture du document DOCX : {str(err)}"],
                "reason": "erreur_lecture_docx"
            }

    # 3. Traitement PDF (PyPDF rapide avec plafonnement de pages)
    if detected_type == "pdf" and PYPDF_AVAILABLE:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            total_pages = len(reader.pages)
            pages_to_process = min(total_pages, MAX_PDF_PAGES)

            if total_pages > MAX_PDF_PAGES:
                warnings.append(
                    f"Le PDF comporte {total_pages} pages. Seules les {MAX_PDF_PAGES} premières pages ont été traitées."
                )

            extracted_chunks = []
            for i in range(pages_to_process):
                page_text = reader.pages[i].extract_text()
                if page_text and page_text.strip():
                    extracted_chunks.append(page_text.strip())

            pdf_text = "\n".join(extracted_chunks).strip()
            if pdf_text:
                logger.info(f"[OCR] Extraction native PDF (PyPDF) réussie ({pages_to_process}/{total_pages} pages).")
                return {
                    "text": pdf_text,
                    "ocr_status": "ok",
                    "method": "pypdf",
                    "pages": pages_to_process,
                    "warnings": warnings,
                    "reason": None
                }
        except Exception as err:
            logger.warning(f"[OCR] PyPDF a échoué sur ce fichier, basculement PaddleOCR: {err}")
            warnings.append(f"Échec PyPDF : {err}")

    # 4. Fallback PaddleOCR (Images ou PDF scannés)
    if not PADDLE_AVAILABLE or not ocr_engine:
        return {
            "text": "",
            "ocr_status": "echec",
            "method": "none",
            "pages": 0,
            "warnings": warnings + ["Moteur PaddleOCR indisponible pour l'OCR visuel."],
            "reason": "moteur_ocr_indisponible"
        }

    # Acquisition du verrou OCR pour limiter la concurrence CPU/GPU
    with _ocr_semaphore:
        tmp_path = None
        try:
            data_to_write = file_bytes
            ext = ".pdf" if detected_type == "pdf" else ".png"

            # Si c'est un PDF scanné transmis à PaddleOCR, tronquer strictement aux MAX_PDF_PAGES premières pages
            if detected_type == "pdf" and PYPDF_AVAILABLE:
                try:
                    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                    total_pages = len(reader.pages)
                    if total_pages > MAX_PDF_PAGES:
                        writer = pypdf.PdfWriter()
                        for page in reader.pages[:MAX_PDF_PAGES]:
                            writer.add_page(page)
                        pdf_buf = io.BytesIO()
                        writer.write(pdf_buf)
                        data_to_write = pdf_buf.getvalue()
                        page_msg = f"Le PDF comporte {total_pages} pages. Seules les {MAX_PDF_PAGES} premières pages ont été traitées."
                        if page_msg not in warnings:
                            warnings.append(page_msg)
                except Exception as pypdf_err:
                    logger.warning(f"[OCR] Tronquage PDF avant PaddleOCR impossible : {pypdf_err}")

            # Prétraitement de l'image : orientation EXIF + redimensionnement
            if detected_type == "image":
                try:
                    from PIL import Image, ImageOps
                    img = Image.open(io.BytesIO(file_bytes))
                    # Transposition EXIF (corrige les photos prises en mode portrait/paysage sur smartphone)
                    img = ImageOps.exif_transpose(img)

                    # Redimensionnement si trop lourd pour diviser par 3 le temps CPU
                    max_dim = 1600
                    if max(img.width, img.height) > max_dim:
                        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                        logger.info(f"[OCR] Image redimensionnée à {img.width}x{img.height} pour accélération.")

                    buffer = io.BytesIO()
                    img.save(buffer, format="JPEG", quality=85)
                    data_to_write = buffer.getvalue()
                    ext = ".jpg"
                except Exception as img_err:
                    logger.debug(f"[OCR] Prétraitement image ignoré : {img_err}")

            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                tmp.write(data_to_write)
                tmp_path = tmp.name

            try:
                # PaddleOCR 2.x
                result = ocr_engine.ocr(tmp_path, cls=False)
            except (TypeError, ValueError):
                # PaddleOCR 3.x
                result = ocr_engine.ocr(tmp_path)

            text_lines = []
            if result:
                for page in result:
                    if isinstance(page, dict):
                        if "rec_texts" in page and page["rec_texts"]:
                            text_lines.extend(page["rec_texts"])
                    elif isinstance(page, list):
                        for line in page:
                            if line and len(line) >= 2:
                                if isinstance(line[1], (list, tuple)) and len(line[1]) > 0:
                                    text_lines.append(str(line[1][0]))
                                elif isinstance(line[1], str):
                                    text_lines.append(line[1])

            extracted_ocr_text = "\n".join(text_lines).strip()

            if extracted_ocr_text:
                return {
                    "text": extracted_ocr_text,
                    "ocr_status": "ok",
                    "method": "paddleocr",
                    "pages": 1,
                    "warnings": warnings,
                    "reason": None
                }
            else:
                return {
                    "text": "",
                    "ocr_status": "vide",
                    "method": "paddleocr",
                    "pages": 1,
                    "warnings": warnings + ["L'OCR optique n'a détecté aucun caractère lisible dans le document."],
                    "reason": "aucun_texte_detecte"
                }

        except Exception as err:
            logger.error(f"[OCR] Erreur PaddleOCR : {err}")
            return {
                "text": "",
                "ocr_status": "echec",
                "method": "paddleocr",
                "pages": 0,
                "warnings": warnings + [f"Erreur d'exécution de PaddleOCR : {str(err)}"],
                "reason": "erreur_ocr"
            }
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass


def extract_raw_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """
    Enveloppe de compatibilité retournant strictement une chaîne de caractères (vide si échec ou aucun texte).
    Ne renvoie plus jamais la phrase par défaut « Texte brut non extrait… ».
    """
    res = extract_text(file_bytes, filename)
    return res.get("text", "") or ""
