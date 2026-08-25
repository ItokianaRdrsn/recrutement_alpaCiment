# Planning global des sprints

Ce document reprend le découpage de projet sur environ 70 jours.
Chaque sprint possède son propre dossier avec les tâches détaillées et les fiches de suivi datées.

| Sprint | Intitulé | Estimation |
| --- | --- | ---: |
| Sprint 0 | Analyse, cadrage et conception | 9,0 j |
| Sprint 1 | Socle technique, sécurité et référentiels de base | 8,0 j |
| Sprint 2 | Gestion des offres, directions et domaines | 9,0 j |
| Sprint 3 | Dépôt et réception des candidatures | 10,0 j |
| Sprint 4 | Gestion RH des candidatures et fiche candidat | 9,0 j |
| Sprint 5 | Vivier, compétences et validation CV | 10,0 j |
| Sprint 6 | Rendez-vous, communications et modèles | 8,0 j |
| Sprint 7 | Dashboard, recherche avancée, matching et finalisation | 7,0 j |
| **Total** | **Scope projet** | **70,0 j** |

## Logique de découpage

Le projet commence par l'analyse et la conception, puis installe le socle technique avant de construire les modules métier dans un ordre progressif :

1. préparer l'environnement, la base et l'authentification ;
2. gérer les offres et référentiels ;
3. recevoir les candidatures ;
4. traiter les candidatures côté RH ;
5. enrichir les profils avec le vivier, les compétences et l'OCR ;
6. organiser les rendez-vous et communications ;
7. terminer par les statistiques, la recherche avancée, le matching et la finalisation.

## Sources principales

Les choix techniques sont justifiés dans `sources.md`, notamment avec les documentations officielles Laravel, Composer, PostgreSQL, React, FastAPI et PaddleOCR.

