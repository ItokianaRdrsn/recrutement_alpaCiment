# -*- coding: utf-8 -*-
"""
Tests unitaires pour email_classifier.py
"""

from unittest.mock import patch
import pytest

from email_classifier import (
    classify_email_intent,
    fetch_active_offers_from_laravel,
    match_offer_by_reference_in_text,
    pre_filter_automatic_emails,
)
from ollama_client import OllamaBusy


ACTIVE_OFFERS = [
    {"id": 10, "reference": "IT-1", "title": "Développeur Fullstack React / Laravel"},
    {"id": 25, "reference": "IND-42", "title": "Ingénieur Maintenance Industrielle"},
]


def test_pre_filter_sender_robot():
    """Vérifie que les expéditeurs système/no-reply sont interceptés sans IA."""
    res = pre_filter_automatic_emails(sender="mailer-daemon@alphaciment.mg", subject="Test")
    assert res is not None
    assert res["type"] == "hors_sujet"
    assert res["confiance"] == 1.0
    assert res["source"] == "regle"

    res_noreply = pre_filter_automatic_emails(sender="noreply@service.com", subject="Hello")
    assert res_noreply is not None
    assert res_noreply["type"] == "hors_sujet"


def test_pre_filter_auto_submitted_header():
    """Vérifie que l'en-tête Auto-Submitted déclenche immédiatement hors_sujet."""
    hdrs = {"Auto-Submitted": "auto-generated"}
    res = pre_filter_automatic_emails(sender="user@test.com", subject="Info", headers=hdrs)
    assert res is not None
    assert res["type"] == "hors_sujet"


def test_pre_filter_ndr_subject():
    """Vérifie que les sujets de non-distribution (Delivery Status Notification) sont interceptés."""
    res = pre_filter_automatic_emails(sender="user@test.com", subject="Delivery Status Notification (Failure)")
    assert res is not None
    assert res["type"] == "hors_sujet"


def test_match_offer_by_reference_in_subject():
    """Vérifie la détection exacte d'une référence d'offre dans l'objet sans appel IA."""
    res = match_offer_by_reference_in_text(
        subject="Candidature pour le poste réf: IT-1",
        body="Veuillez trouver mon CV ci-joint.",
        active_offers=ACTIVE_OFFERS
    )
    assert res is not None
    assert res["type"] == "demande_offre"
    assert res["id_offre"] == 10
    assert res["reference_offre"] == "IT-1"
    assert res["source"] == "regle"


def test_match_offer_by_reference_word_boundary():
    """Vérifie que la regex utilise les limites de mots (ex: 'IT-10' ne doit pas matcher 'IT-1')."""
    res = match_offer_by_reference_in_text(
        subject="Référence IT-10 non listée",
        body="Corps du message",
        active_offers=ACTIVE_OFFERS
    )
    assert res is None


def test_classify_email_invalid_id_offre_reset_to_null():
    """Vérifie que si le LLM suggère un id_offre inexistant, il est réinitialisé à null."""
    mock_llm_output = {
        "type": "demande_offre",
        "id_offre": 99999,  # N'existe pas dans ACTIVE_OFFERS
        "reference_offre": "INCONNU",
        "offre_ciblee": "Poste Fantôme",
        "confiance": 0.85
    }

    with patch("email_classifier.chat_json", return_value=mock_llm_output):
        res = classify_email_intent(
            subject="Candidature spontanée",
            body="Bonjour je postule à votre entreprise",
            active_offers=ACTIVE_OFFERS
        )
        assert res["id_offre"] is None
        assert res["reference_offre"] is None


def test_classify_email_heuristic_fallback_when_llm_down():
    """Vérifie le repli heuristique traçable en cas d'échec du LLM."""
    with patch("email_classifier.chat_json", side_effect=Exception("Ollama offline")):
        res = classify_email_intent(
            subject="Candidature spontanée pour un poste",
            body="Je cherche un emploi dans votre usine.",
            active_offers=ACTIVE_OFFERS
        )
        assert res["source"] == "heuristique"
        assert res["confiance"] <= 0.5
        assert res["a_verifier"] is True
        assert res["type"] == "demande_spontanee"


def test_classify_email_ollama_busy_propagates():
    """Vérifie que si Ollama est saturé (OllamaBusy), l'exception remonte sans basculer en heuristique."""
    with patch("email_classifier.chat_json", side_effect=OllamaBusy("Queue full")):
        with pytest.raises(OllamaBusy):
            classify_email_intent(
                subject="Candidature Développeur",
                body="Voici mon profil",
                active_offers=ACTIVE_OFFERS
            )


def test_fetch_active_offers_resilience_with_stale_cache():
    """Vérifie que la coupure réseau Laravel restitue le cache périmé plutôt qu'une liste vide."""
    import email_classifier
    # Injection d'un cache existant
    with email_classifier._offers_cache_lock:
        email_classifier._offers_cache["offers"] = [{"id": 42, "reference": "REF-42", "title": "Directeur Usine"}]
        email_classifier._offers_cache["last_fetched"] = 1.0  # Périmé

    with patch("email_classifier.requests.get", side_effect=Exception("Laravel API network down")):
        offers = fetch_active_offers_from_laravel(force_refresh=True)
        assert len(offers) == 1
        assert offers[0]["id"] == 42
        assert offers[0]["reference"] == "REF-42"
