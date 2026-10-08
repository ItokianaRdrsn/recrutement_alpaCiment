# -*- coding: utf-8 -*-
"""
cv_ocr_extractor.py
===================
Module d'extraction de texte brut (OCR) pour les CVs.
Responsabilités :
- Extraction native rapide pour PDF numériques via PyPDF
- Détection optique de texte par vision par ordinateur via PaddleOCR (images, scans)
- Compatibilité multi-version PaddleOCR (v2 et v3) avec désactivation oneDNN
"""

import os
import io
import logging
import tempfile

# Configuration des variables d'environnement anti-conflits CPU Windows pour PaddlePaddle 3.x
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_use_onednn"] = "0"
os.environ["PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT"] = "0"

logger = logging.getLogger("AlpaCimentOCR.extractor")

PADDLE_AVAILABLE = False
ocr_engine = None

try:
    from paddleocr import PaddleOCR
    try:
        # PaddleOCR 3.x
        ocr_engine = PaddleOCR(lang='fr', use_angle_cls=False)
    except (TypeError, ValueError):
        # PaddleOCR 2.x
        ocr_engine = PaddleOCR(use_angle_cls=False, lang='fr', show_log=False)
    PADDLE_AVAILABLE = True
    logger.info("Moteur PaddleOCR initialisé avec succès en français (angle_cls désactivé pour la vitesse).")
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

    # 1. Détection universelle de format PDF :
    # Que filename soit 'cv.pdf', 'attachment_0' ou vide, on vérifie la signature binaire b'%PDF'
    is_pdf = (filename and filename.lower().endswith(".pdf")) or file_bytes.startswith(b"%PDF")

    if is_pdf and PYPDF_AVAILABLE:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted and extracted.strip():
                    text_chunks.append(extracted.strip())
            if text_chunks:
                logger.info(f"Extraction native PDF (pypdf) réussie en quelques millisecondes ({len(text_chunks)} pages).")
        except Exception as err:
            logger.warning(f"Erreur extraction directe pypdf: {err}")

    # 2. Si aucun texte extrait (image ou PDF scanné), fallback sur PaddleOCR
    if not text_chunks and PADDLE_AVAILABLE and ocr_engine:
        tmp_path = None
        try:
            # Si le fichier est un PDF scanné sans texte vectoriel
            ext = ".pdf" if is_pdf else (os.path.splitext(filename)[1] if filename and "." in filename else ".png")

            # Prétraitement image si applicable pour réduire le temps CPU
            data_to_write = file_bytes
            if not is_pdf:
                try:
                    from PIL import Image
                    img = Image.open(io.BytesIO(file_bytes))
                    # Si l'image est immense (> 1600px), on redimensionne pour diviser le temps CPU par 3
                    max_dim = 1600
                    if max(img.width, img.height) > max_dim:
                        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                        buffer = io.BytesIO()
                        img.save(buffer, format="JPEG", quality=85)
                        data_to_write = buffer.getvalue()
                        ext = ".jpg"
                        logger.info(f"Image redimensionnée à {img.width}x{img.height} pour accélération OCR.")
                except Exception as img_err:
                    logger.debug(f"Pas de redimensionnement image : {img_err}")

            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                tmp.write(data_to_write)
                tmp_path = tmp.name

            try:
                # PaddleOCR 2.x (cls=False pour vitesse maximale)
                result = ocr_engine.ocr(tmp_path, cls=False)
            except (TypeError, ValueError):
                # PaddleOCR 3.x
                result = ocr_engine.ocr(tmp_path)

            if result:
                for page in result:
                    if isinstance(page, dict):
                        # Format PaddleOCR 3.x
                        if "rec_texts" in page and page["rec_texts"]:
                            text_chunks.extend(page["rec_texts"])
                    elif isinstance(page, list):
                        # Format PaddleOCR 2.x: [[box, [text, score]], ...]
                        for line in page:
                            if line and len(line) >= 2:
                                if isinstance(line[1], (list, tuple)) and len(line[1]) > 0:
                                    text_chunks.append(str(line[1][0]))
                                elif isinstance(line[1], str):
                                    text_chunks.append(line[1])
        except Exception as err:
            logger.warning(f"Erreur exécution PaddleOCR: {err}")
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

    raw_text = "\n".join(text_chunks).strip()
    return raw_text if raw_text else "Texte brut non extrait ou document image scanné sans OCR texte."
