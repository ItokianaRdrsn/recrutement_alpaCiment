# -*- coding: utf-8 -*-
"""
config.py
=========
Configuration centralisée du microservice FastAPI OCR & NER d'AlpA Ciment.
Toutes les variables sont surchargeables par variables d'environnement.
"""

import os

# -----------------------------------------------------------------------------
# CHARGEMENT DU FICHIER LOCAL .ENV (IGNORÉ PAR GIT)
# -----------------------------------------------------------------------------
env_file = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_file):
    try:
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    val = v.strip().strip('"').strip("'")
                    key_name = k.strip()
                    curr = os.environ.get(key_name, "")
                    if not curr or "SetEnvironmentVariable" in curr or len(curr) < 32:
                        os.environ[key_name] = val
                    else:
                        os.environ.setdefault(key_name, val)
    except Exception:
        pass

# -----------------------------------------------------------------------------
# ENVIRONNEMENT & SÉCURITÉ
# -----------------------------------------------------------------------------
ENV = os.getenv("ENV", "production").lower()
PIPELINE_API_KEY = os.getenv("PIPELINE_API_KEY", "")

if len(PIPELINE_API_KEY) < 32:
    raise RuntimeError(
        "PIPELINE_API_KEY absente ou trop courte (minimum 32 caractères requis). "
        "Génère-la avec : python -c \"import secrets; print(secrets.token_urlsafe(32))\""
    )

RELOAD_APP = os.getenv("RELOAD_APP", "false").lower() in ("true", "1", "yes")

# -----------------------------------------------------------------------------
# OLLAMA & MODÈLE LOCAL
# -----------------------------------------------------------------------------
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/api/chat")
OLLAMA_TAGS_URL = os.getenv("OLLAMA_TAGS_URL", "http://127.0.0.1:11434/api/tags")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
OLLAMA_CONCURRENCY = int(os.getenv("OLLAMA_CONCURRENCY", "1"))
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "8192"))

# -----------------------------------------------------------------------------
# LIMITES D'INGESTION & OCR
# -----------------------------------------------------------------------------
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))  # 10 Mo
MAX_PDF_PAGES = int(os.getenv("MAX_PDF_PAGES", "10"))
OCR_CONCURRENCY = int(os.getenv("OCR_CONCURRENCY", "1"))
MAX_CV_CHARS = int(os.getenv("MAX_CV_CHARS", "12000"))
MAX_EMAIL_BODY_CHARS = int(os.getenv("MAX_EMAIL_BODY_CHARS", "2000"))

# -----------------------------------------------------------------------------
# INTÉGRATION LARAVEL
# -----------------------------------------------------------------------------
LARAVEL_BASE_URL = os.getenv("LARAVEL_BASE_URL", "http://127.0.0.1:8000")
LARAVEL_PUBLIC_OFFERS_URL = f"{LARAVEL_BASE_URL.rstrip('/')}/api/offres/publiques"
OFFERS_CACHE_TTL_S = int(os.getenv("OFFERS_CACHE_TTL_S", "300"))
