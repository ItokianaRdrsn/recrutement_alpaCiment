# Sprint 6 - Tâches & Suivi (Rendez-vous, communications, automatisation et modèles - 12,0 j)

## Avancement du Sprint

- **[FAIT]** 1 tâche (1,5 j)
- **[EN COURS]** 1 tâche (1,0 j)
- **[À FAIRE]** 9 tâches (9,5 j)
- **Sous-total : 12,0 j (Avancement : 20.8% - 2,5 j / 12,0 j)**

---

## 📋 Detail des Tâches

### BACK-OFFICE

#### **[À FAIRE]** CRUD des rendez-vous : test, entretien, statut, mode, responsable
- **Estimation :** 2,0 j
- **Notes :** Planification des entretiens et tests.

#### **[À FAIRE]** Vue agenda par utilisateur, candidature et période
- **Estimation :** 1,0 j
- **Notes :** Agenda interactif des entretiens.

#### **[À FAIRE]** Communication liée aux rendez-vous
- **Estimation :** 1,0 j
- **Notes :** Convocations et rappels automatiques.

#### **[À FAIRE]** CRUD des modèles de communication
- **Estimation :** 1,0 j
- **Notes :** Modèles d'emails personnalisables.

#### **[À FAIRE]** Accusé de réception et première communication automatique
- **Estimation :** 0,5 j
- **Notes :** Confirmation automatique de réception de candidature.

#### **[À FAIRE]** Activation, désactivation et configuration de l'envoi automatique
- **Estimation :** 1,0 j
- **Notes :** Paramétrage des déclencheurs automatiques.

---

### API / SERVICES & AUTOMATISATION

#### **[FAIT]** Récupération et ingestion des candidatures par E-mail via n8n & FastAPI OCR/LLM
- **Estimation :** 1,5 j
- **Notes :** Pipeline n8n, microservice FastAPI OCR & NER local (Llama 3.2), auto-ingestion des compétences, expériences, formations, documents et vue RH côte à côte.
- **Documentation :** [ingestion-email-ocr-llama-candidatures.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-6/2026-10-07/ingestion-email-ocr-llama-candidatures.md)

#### **[EN COURS]** Automatisation n8n : classification, routage, switch offre/spontanée et synchronisation
- **Estimation :** 1,0 j
- **Notes :** Scénario n8n complet liant la boîte e-mail, la classification IA d'intention, l'extraction de profil et l'import direct.

#### **[À FAIRE]** Envoi manuel, historique des communications et préparation des rappels
- **Estimation :** 1,5 j
- **Notes :** Historique complet des échanges candidats.

#### **[À FAIRE]** Log et Journalisation des actions RH (Audit Log)
- **Estimation :** 1,5 j
- **Notes :** Traçabilité globale : création/modification/clôture d'offre, changement de statut candidat, suppression, action utilisateur avec horodatage, utilisateur responsable et détails JSON des modifications (diff avant/après).

#### **[À FAIRE]** Tests et debug
- **Estimation :** 0,5 j
- **Notes :** Validation des flux d'envoi, réception, automatisation et journalisation.

---

## Sous-total Sprint 6 : 12,0 j
