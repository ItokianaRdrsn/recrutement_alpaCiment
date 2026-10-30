# -*- coding: utf-8 -*-
"""
Tests unitaires pour cv_llm_parser.py
"""

from unittest.mock import patch
import pytest

from cv_llm_parser import parse_cv_with_llm
from ollama_client import OllamaTimeout, OllamaUnavailable, OutputTruncated


def test_cv_llm_parser_empty_text():
    """Vérifie qu'un texte vide retourne un schéma vide avec ner_status='vide'."""
    res = parse_cv_with_llm("")
    assert res["ner_status"] == "vide"
    assert res["texte_brut"] == ""
    assert res["competences"] == []


def test_cv_llm_parser_raises_on_ollama_unavailable():
    """Vérifie que l'indisponibilité d'Ollama n'est plus masquée mais lève OllamaUnavailable."""
    with patch("cv_llm_parser.chat_json", side_effect=OllamaUnavailable("Serveur éteint")):
        with pytest.raises(OllamaUnavailable):
            parse_cv_with_llm("Texte du CV de test")


def test_cv_llm_parser_raises_on_ollama_timeout():
    """Vérifie qu'un timeout d'Ollama lève OllamaTimeout."""
    with patch("cv_llm_parser.chat_json", side_effect=OllamaTimeout("Timeout dépassé")):
        with pytest.raises(OllamaTimeout):
            parse_cv_with_llm("Texte du CV de test")


def test_cv_llm_parser_anti_hallucination_coordonnees():
    """
    Vérifie que si le modèle invente une adresse email ou un numéro de téléphone
    absent du texte OCR, ils sont réinitialisés à null avec un avertissement.
    """
    mock_llm_return = {
        "contact": {
            "nom_complet": "Marc Ravelo",
            "email": "hallucination@fake.com",  # N'est pas dans le CV
            "telephone": "0349999999",         # N'est pas dans le CV
            "ville": "Tamatave"
        },
        "profil": "Technicien supérieur",
        "competences": [{"nom": "Électromécanique", "niveau": "Avancé"}],
        "experiences": [],
        "projets": [],
        "formations": []
    }

    real_ocr_text = "Marc Ravelo habite à Tamatave. Technicien en électromécanique avec 5 ans de pratique."

    with patch("cv_llm_parser.chat_json", return_value=mock_llm_return):
        res = parse_cv_with_llm(real_ocr_text)
        assert res["contact"]["nom_complet"] == "Marc Ravelo"
        assert res["contact"]["email"] is None
        assert res["contact"]["telephone"] is None
        assert any("hallucination" in w for w in res["warnings"])


def test_cv_llm_parser_output_truncated_handling():
    """Vérifie la gestion gracieuse de OutputTruncated avec passage en ner_status='partiel'."""
    partial_json = '{"contact": {"nom_complet": "Sarah Rakoto"}, "competences": [{"nom": "Python"}'

    with patch("cv_llm_parser.chat_json", side_effect=OutputTruncated("Tronqué", partial_content=partial_json)):
        res = parse_cv_with_llm("Sarah Rakoto Développeuse Python à Antananarivo")
        assert res["ner_status"] == "partiel"
        assert res["contact"]["nom_complet"] == "Sarah Rakoto"
        assert any("tronquée" in w.lower() or "tokens" in w.lower() for w in res["warnings"])
