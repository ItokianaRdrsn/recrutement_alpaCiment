# -*- coding: utf-8 -*-
import json
from cv_nlp_parser import parse_cv_text_to_json

SAMPLE_CV_TEXT = """
Jean RAKOTONIRINA
Antananarivo, Madagascar
jean.rakoto@example.com
034 12 345 67

PROFIL
Développeur Fullstack avec 4 ans d'expérience en gestion RH digitale.

COMPETENCES TECHNIQUES
PHP / Laravel (avancé), React.js, PostgreSQL
Gestion de la paie - niveau expert
Docker, notions de DevOps
Anglais intermédiaire

EXPERIENCES PROFESSIONNELLES
Janvier 2023 - Aujourd'hui
Développeur Fullstack Web - Alpha Ciment Services
Développement et maintenance des applications web de gestion RH et paie.

Juin 2021 - Décembre 2022
Assistant Gestionnaire de Projets SI chez AlpA Tech Consult
Analyse des besoins utilisateurs, rédaction des spécifications.

FORMATIONS
2022
Master 2 en Génie Logiciel - Institut Supérieur de Technologie d'Antananarivo

2020
Licence Professionnelle Informatique, Université d'Antananarivo

LANGUES
Français, Anglais, Malagasy
"""

if __name__ == "__main__":
    result = parse_cv_text_to_json(SAMPLE_CV_TEXT, "cv_test.pdf")
    print(json.dumps(result, indent=2, ensure_ascii=False))
