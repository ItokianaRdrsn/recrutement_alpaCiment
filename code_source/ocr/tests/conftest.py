# -*- coding: utf-8 -*-
import os
import sys

# Définition des variables d'environnement obligatoires avant l'import de l'application
os.environ.setdefault("PIPELINE_API_KEY", "test_secret_pipeline_key_alpa_ciment_minimum_32chars_long!")
os.environ.setdefault("ENV", "development")

# Ajout du dossier parent (code_source/ocr) au sys.path
ocr_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ocr_dir not in sys.path:
    sys.path.insert(0, ocr_dir)
