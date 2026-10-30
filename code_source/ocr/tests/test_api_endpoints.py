# -*- coding: utf-8 -*-
"""
Tests d'intégration des endpoints FastAPI via starlette TestClient.
"""

from unittest.mock import patch
import pytest
from starlette.testclient import TestClient

from config import MAX_UPLOAD_BYTES, PIPELINE_API_KEY
from main import app
from ollama_client import OllamaBusy, OllamaUnavailable

client = TestClient(app)


def test_health_endpoint_public_no_auth():
    """Vérifie que /health est public, minimal et inclut la clé 'ready' sans fuite d'infrastructure."""
    with patch("main.is_ollama_available", return_value=True):
        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["ready"] is True
        assert "llm_model" not in data  # Informations protégées déplacées sur /health/details


def test_health_details_endpoint_requires_auth():
    """Vérifie que /health/details requiert l'en-tête X-API-Key."""
    res = client.get("/health/details")
    assert res.status_code == 401

    headers = {"X-API-Key": PIPELINE_API_KEY}
    with patch("main.is_ollama_available", return_value=True):
        res_auth = client.get("/health/details", headers=headers)
        assert res_auth.status_code == 200
        details = res_auth.json()
        assert "llm_model" in details
        assert "paddle_ocr_installed" in details


def test_secured_routes_reject_missing_api_key():
    """Vérifie que les routes sécurisées retournent 401 sans clé API."""
    res = client.post("/ner", json={"texte_brut_ocr": "test"})
    assert res.status_code == 401
    assert "X-API-Key" in res.json()["detail"]


def test_secured_routes_reject_invalid_api_key():
    """Vérifie que les routes sécurisées retournent 401 avec une fausse clé API."""
    headers = {"X-API-Key": "mauvaise-cle-pirate"}
    res = client.post("/ner", json={"texte_brut_ocr": "test"}, headers=headers)
    assert res.status_code == 401


def test_upload_file_too_large_413():
    """Vérifie qu'un upload dépassant MAX_UPLOAD_BYTES retourne une erreur HTTP 413."""
    headers = {"X-API-Key": PIPELINE_API_KEY}
    huge_payload = b"A" * (MAX_UPLOAD_BYTES + 50)
    files = {"file": ("grand_fichier.pdf", huge_payload, "application/pdf")}

    res = client.post("/ocr", files=files, headers=headers)
    assert res.status_code == 413
    assert "trop volumineux" in res.json()["detail"]


def test_upload_unsupported_file_type_415():
    """Vérifie qu'un format binaire non supporté (.exe, .bin) retourne une erreur HTTP 415."""
    headers = {"X-API-Key": PIPELINE_API_KEY}
    fake_exe = b"\x4d\x5a\x90\x00\x03\x00\x00\x00"
    files = {"file": ("programme.exe", fake_exe, "application/octet-stream")}

    res = client.post("/ocr", files=files, headers=headers)
    assert res.status_code == 415


def test_ocr_endpoint_empty_file_success_false():
    """Vérifie qu'un PDF blanc ou vide retourne HTTP 200 avec success=false et ocr_status."""
    headers = {"X-API-Key": PIPELINE_API_KEY}
    # Simulation d'un fichier valide mais ne produisant aucun texte
    with patch("main.extract_text", return_value={"text": "", "ocr_status": "vide", "warnings": ["aucun texte"], "reason": None}):
        fake_pdf = b"%PDF-1.4\n%test\n"
        files = {"file": ("cv_blanc.pdf", fake_pdf, "application/pdf")}
        res = client.post("/ocr", files=files, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is False
        assert data["ocr_status"] == "vide"


def test_ner_endpoint_returns_503_when_ollama_unavailable():
    """Vérifie que l'indisponibilité d'Ollama est traduite en HTTP 503 avec Retry-After: 5."""
    headers = {"X-API-Key": PIPELINE_API_KEY}
    with patch("main.parse_cv_with_llm", side_effect=OllamaUnavailable("Ollama injoignable")):
        res = client.post("/ner", json={"texte_brut_ocr": "CV de test"}, headers=headers)
        assert res.status_code == 503
        assert res.headers.get("retry-after") == "5"


def test_ner_endpoint_returns_503_retry_after_10_when_ollama_busy():
    """Vérifie que la saturation Ollama (OllamaBusy) retourne HTTP 503 avec Retry-After: 10."""
    headers = {"X-API-Key": PIPELINE_API_KEY}
    with patch("main.parse_cv_with_llm", side_effect=OllamaBusy("Queue full")):
        res = client.post("/ner", json={"texte_brut_ocr": "CV de test"}, headers=headers)
        assert res.status_code == 503
        assert res.headers.get("retry-after") == "10"


def test_classify_email_returns_503_retry_after_10_when_ollama_busy():
    """Vérifie que /classify-email renvoie 503 Retry-After: 10 quand Ollama est occupé."""
    headers = {"X-API-Key": PIPELINE_API_KEY}
    with patch("main.classify_email_intent", side_effect=OllamaBusy("Queue full")):
        res = client.post("/classify-email", json={"subject": "Candidature", "body": "CV"}, headers=headers)
        assert res.status_code == 503
        assert res.headers.get("retry-after") == "10"


def test_verify_pipeline_api_key_byte_comparison_safety():
    """Vérifie que des clés invalides renvoient 401 sans lever d'erreur serveur 500."""
    res_bad = client.post("/ner", json={"texte_brut_ocr": "test"}, headers={"X-API-Key": "mauvaise_cle_ordinaire"})
    assert res_bad.status_code == 401

    res_none = client.post("/ner", json={"texte_brut_ocr": "test"})
    assert res_none.status_code == 401
