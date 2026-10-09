# Sprint 6 - Tâches & Suivi (Rendez-vous, communications, automatisation et modèles - 12,0 j)

## Avancement du Sprint

- **[FAIT]** 10 tâches (11,0 j)
- **[EN COURS]** 1 tâche (1,0 j)
- **[À FAIRE]** 0 tâche (0,0 j)
- **Sous-total : 12,0 j (Avancement : 91.7% - 11,0 j / 12,0 j)**

---

## 📋 Detail des Tâches

### BACK-OFFICE

#### **[FAIT]** CRUD des rendez-vous : test, entretien, statut, mode, responsable
- **Estimation :** 2,0 j
- **Notes :** Planification des entretiens et tests, contrôles des dates, synchronisation du statut candidat et audit logs.
- **Documentation :** [planification-rendez-vous-agenda-fullcalendar.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-6/2026-10-09/planification-rendez-vous-agenda-fullcalendar.md)

#### **[FAIT]** Vue agenda par utilisateur, candidature et période
- **Estimation :** 1,0 j
- **Notes :** Agenda interactif FullCalendar (Mois, Semaine, Jour), glisser-déposer, filtres par recruteur, type et mode, et onglet rendez-vous dans la fiche candidature.
- **Documentation :** [planification-rendez-vous-agenda-fullcalendar.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-6/2026-10-09/planification-rendez-vous-agenda-fullcalendar.md)

#### **[FAIT]** Communication liée aux rendez-vous
- **Estimation :** 1,0 j
- **Notes :** Convocations automatiques par email lors de la création de créneau dans l'agenda RH.
- **Documentation :** [module-communication-modeles-emails.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-6/2026-10-09/module-communication-modeles-emails.md)

#### **[FAIT]** CRUD des modèles de communication
- **Estimation :** 1,0 j
- **Notes :** Modèles d'emails personnalisables avec variables dynamiques ({nom}, {prenom}, {poste}, {date_rdv}, etc.) et simulateur d'aperçu en direct.
- **Documentation :** [module-communication-modeles-emails.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-6/2026-10-09/module-communication-modeles-emails.md)

#### **[FAIT]** Accusé de réception et première communication automatique
- **Estimation :** 0,5 j
- **Notes :** Confirmation automatique de réception de candidature (dépôt sur offre ou spontané).
- **Documentation :** [module-communication-modeles-emails.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-6/2026-10-09/module-communication-modeles-emails.md)

#### **[FAIT]** Activation, désactivation et configuration de l'envoi automatique
- **Estimation :** 1,0 j
- **Notes :** Paramétrage des déclencheurs automatiques sur les modèles de messages.
- **Documentation :** [module-communication-modeles-emails.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-6/2026-10-09/module-communication-modeles-emails.md)

---

### API / SERVICES & AUTOMATISATION

#### **[FAIT]** Récupération et ingestion des candidatures par E-mail via n8n & FastAPI OCR/LLM
- **Estimation :** 1,5 j
- **Notes :** Pipeline n8n, microservice FastAPI OCR & NER local (Llama 3.2), auto-ingestion des compétences, expériences, formations, documents et vue RH côte à côte.
- **Documentation :** [ingestion-email-ocr-llama-candidatures.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-6/2026-10-07/ingestion-email-ocr-llama-candidatures.md)

#### **[EN COURS]** Automatisation n8n : classification, routage, switch offre/spontanée et synchronisation
- **Estimation :** 1,0 j
- **Notes :** Scénario n8n complet liant la boîte e-mail, la classification IA d'intention, l'extraction de profil et l'import direct.

#### **[FAIT]** Log et Journalisation des actions RH (Audit Log)
- **Estimation :** 1,5 j
- **Notes :** Traçabilité globale : création/modification/clôture d'offre, changement de statut candidat, suppression, action utilisateur avec horodatage, utilisateur responsable et détails JSON des modifications (diff avant/après).
- **Documentation :** [journal-audit-actions-rh.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-6/2026-10-09/journal-audit-actions-rh.md)

#### **[FAIT]** Envoi manuel, historique des communications et préparation des rappels
- **Estimation :** 1,5 j
- **Notes :** Historique complet des échanges candidats dans la table communication et modal d'envoi manuel personnalisé depuis le dossier candidat.
- **Documentation :** [module-communication-modeles-emails.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-6/2026-10-09/module-communication-modeles-emails.md)

#### **[FAIT]** Tests et debug
- **Estimation :** 0,5 j
- **Notes :** Validation des flux d'envoi, réception, automatisation et journalisation (25/25 tests unitaires passés).
- **Documentation :** [module-communication-modeles-emails.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-6/2026-10-09/module-communication-modeles-emails.md)

---

## Sous-total Sprint 6 : 12,0 j
