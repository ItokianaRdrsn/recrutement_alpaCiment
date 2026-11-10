# -*- coding: utf-8 -*-
import os
import sys

# Définition des variables d'environnement obligatoires avant l'import de l'application
os.environ.setdefault("PIPELINE_API_KEY", "test_secret_pipeline_key_alpha_ciment_minimum_32chars_long!")
os.environ.setdefault("ENV", "development")

# Ajout du dossier parent (code_source/ocr) au sys.path
ocr_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ocr_dir not in sys.path:
    sys.path.insert(0, ocr_dir)


import pytest


@pytest.fixture(autouse=True)
def _pas_d_appel_laravel(monkeypatch):
    """Les tests ne contactent jamais Laravel : aucun rapprochement de compétences par défaut."""
    import cv_llm_parser

    monkeypatch.setattr(cv_llm_parser, "rapprocher_competences", lambda *a, **k: {})
