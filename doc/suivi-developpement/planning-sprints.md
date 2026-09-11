# Planning global des sprints (Scope Général - 68,0 j)

Ce document contient la découpe officielle et exacte du projet *recrutement_alpaCiment* sur **68,0 jours** avec la planification calendaire théorique (jours ouvrés hors week-ends à partir du **Mercredi 12 Août 2026**) et le suivi des dates réelles constatées dans l'historique du projet.

## 📅 Règles de Calcul du Planning
- **Date de début du projet** : Mercredi 12 Août 2026 (Réception du Cahier des Charges).
- **Rythme prévisionnel** : Jours ouvrés uniquement (Lundi au Vendredi - Hors Samedi & Dimanche).
- **Suivi des dates réelles** : Basé directement sur l'horodatage effectif des fiches de développement du projet (`sprint-0` au 12/08-24/08, `sprint-1` au 25/08-26/08, `sprint-2` au 26/08-27/08, `sprint-3` au 28/08-en cours, etc.).

---

## 📊 Tableau Général du Planning Calendaire des Sprints (Scope 68,0 j)

| Sprint | Intitulé | Estimation | Début Prévu | Fin Prévue | Début Réel | Fin Réelle | Progression (%) | Statut |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| **Sprint 0** | Analyse, cadrage et conception | 9,0 j | 12/08/2026 | 24/08/2026 | 12/08/2026 | 24/08/2026 | **100.0%** | **[FAIT]** |
| **Sprint 1** | Socle technique, sécurité et référentiels de base | 6,0 j | 25/08/2026 | 01/09/2026 | 25/08/2026 | 26/08/2026 | **100.0%** | **[FAIT]** |
| **Sprint 2** | Gestion des offres, directions et domaines | 7,0 j | 02/09/2026 | 10/09/2026 | 26/08/2026 | 27/08/2026 | **100.0%** | **[FAIT]** |
| **Sprint 3** | Dépôt et réception des candidatures (Web, Saisie RH & Import) | 7,5 j | 11/09/2026 | 21/09/2026 | 28/08/2026 | 28/08/2026 | **100.0%** | **[FAIT]** |
| **Sprint 4** | Gestion RH des candidatures et fiche candidat | 7,0 j | 22/09/2026 | 30/09/2026 | 28/08/2026 | 28/08/2026 | **100.0%** | **[FAIT]** |
| **Sprint 5** | Vivier, compétences et validation CV (OCR / IA) | 11,5 j | 01/10/2026 | 15/10/2026 | 28/08/2026 | *En cours* | **73.9%** (8,5/11,5j) | **[EN COURS]** |
| **Sprint 6** | Rendez-vous, communications et modèles | 10,0 j | 16/10/2026 | 29/10/2026 | *A venir* | *A venir* | **0.0%** | **[A FAIRE]** |
| **Sprint 7** | Dashboard, recherche avancée, matching et finalisation | 10,0 j | 30/10/2026 | 12/11/2026 | *A venir* | *A venir* | **0.0%** | **[A FAIRE]** |
| **Total** | **Total Scope Général** | **68,0 j** | **12/08/2026** | **12/11/2026** | **12/08/2026** | *En cours* | **66.2%** (45,0/68,0j) | |

---

## 📌 Détail Complet des Sprints, Catégories, Dates et Tâches

### Sprint 0 : Analyse, cadrage et conception (9,0 j - 100.0% FAIT)
- 📅 **Dates Prévisionnelles (Jours ouvrés)** : Du **12/08/2026** au **24/08/2026** (9,0 j)
- ⏱️ **Dates Réelles** : Du **12/08/2026** au **24/08/2026**
- Analyse du cahier des charges et définition du périmètre V1 (2,0 j)
- Identification des modules fonctionnels du recrutement (1,5 j)
- Analyse des parcours candidat / RH / admin (1,5 j)
- Conception du MCD / MLD et des règles métier (2,0 j)
- Conception de l'architecture Laravel / React / PostgreSQL / FastAPI (0,5 j)
- Planification du projet et préparation de l'environnement (1,5 j)
- **Sous-total : 9,0 j (100.0% FAIT)**

---

### Sprint 1 : Socle technique, sécurité et référentiels de base (6,0 j - 100.0% FAIT)
- 📅 **Dates Prévisionnelles (Jours ouvrés)** : Du **25/08/2026** au **01/09/2026** (6,0 j)
- ⏱️ **Dates Réelles** : Du **25/08/2026** au **26/08/2026**
- **BACK-OFFICE / API** :
  - Configuration du projet Laravel et de l'environnement PostgreSQL (1,0 j)
  - Mise en place des migrations principales et des seeders (1,0 j)
  - Mise en place de l'architecture API REST (1,0 j)
  - Authentification et gestion des rôles RH / admin (1,0 j)
- **FRONT-OFFICE / INTERFACE** :
  - Installation de React avec Vite et structure de navigation (0,5 j)
  - Intégration de la mise en page générale du back-office (1,0 j)
  - Tests et debug (0,5 j)
- **Sous-total : 6,0 j (100.0% FAIT)**

---

### Sprint 2 : Gestion des offres, directions et domaines (7,0 j - 100.0% FAIT)
- 📅 **Dates Prévisionnelles (Jours ouvrés)** : Du **02/09/2026** au **10/09/2026** (7,0 j)
- ⏱️ **Dates Réelles** : Du **26/08/2026** au **27/08/2026**
- **BACK-OFFICE** :
  - CRUD des directions (0,5 j)
  - CRUD des domaines et validation des domaines en attente (0,5 j)
  - CRUD des offres d'emploi (1,0 j)
  - Gestion du statut des offres : brouillon, publiée, clôturée (0,5 j)
  - Gestion du profil, des missions et des formations requises (1,5 j)
  - Gestion des compétences requises par offre (1,0 j)
- **FRONT-OFFICE / API** :
  - Affichage des offres publiées et génération du lien de candidature (1,0 j)
  - Tests et debug (1,0 j)
- **Sous-total : 7,0 j (100.0% FAIT)**

---

### Sprint 3 : Dépôt et réception des candidatures (7,5 j - 100.0% FAIT)
- 📅 **Dates Prévisionnelles (Jours ouvrés)** : Du **11/09/2026** au **21/09/2026** (7,5 j)
- ⏱️ **Dates Réelles** : Du **28/08/2026** au **28/08/2026**
- **FRONT-OFFICE** :
  - Formulaire de candidature sur offre (temporaire) (0,5 j) - **[FAIT]**
  - Formulaire de candidature spontanée avec domaine (temporaire) (0,5 j) - **[FAIT]**
  - Upload des CV, photos et documents (1,0 j) - **[FAIT]**
- **BACK-OFFICE** :
  - Saisie manuelle d'une candidature par un RH (1,0 j) - **[FAIT]**
- **API / SERVICES** :
  - Détection d'un candidat existant et dédoublonnage par email (1,0 j) - **[FAIT]**
  - Création transactionnelle : candidat, candidature, statut initial, historique (2,0 j) - **[FAIT]**
  - Préparation de la réception/import depuis le site externe (0,5 j) - **[FAIT]**
  - Tests et debug (1,0 j) - **[FAIT]**
- **Sous-total : 7,5 j (100.0% FAIT)**

---

### Sprint 4 : Gestion RH des candidatures et fiche candidat (7,0 j - 71.4% EN COURS)
- 📅 **Dates Prévisionnelles (Jours ouvrés)** : Du **22/09/2026** au **30/09/2026** (7,0 j)
- ⏱️ **Dates Réelles** : Du **28/08/2026** au *En cours*
- **BACK-OFFICE** :
  - Liste générale des candidatures avec pagination (0,5 j) - **[FAIT]**
  - Recherche et filtres : statut, direction, période, canal, type (0,5 j) - **[FAIT]**
  - Gestion des candidatures sur offre : Direction -> Offre -> Candidats (0,5 j) - **[FAIT]**
  - Gestion des candidatures spontanées : Direction -> Domaine -> Candidatures (0,5 j) - **[FAIT]**
  - Fiche candidat : informations, documents, historique statuts et communications (2,0 j) - **[FAIT]**
  - Changement de statut avec commentaire et historique (1,5 j) - **[EN COURS]**
  - Export PDF de la fiche candidat (0,5 j) - **[FAIT]**
  - Tests et debug (1,0 j) - **[EN COURS]**
- **Sous-total : 5,0 j / 7,0 j (71.4% EN COURS)**

---

### Sprint 5 : Vivier, compétences et validation CV (11,5 j - 73.9% EN COURS)
- 📅 **Dates Prévisionnelles (Jours ouvrés)** : Du **01/10/2026** au **15/10/2026** (11,5 j)
- ⏱️ **Dates Réelles** : Du **28/08/2026** au *En cours*
- **BACK-OFFICE** :
  - Gestion du vivier : ajout, retrait, consultation (1,0 j) - **[FAIT]**
  - Recherche dans le vivier par compétence, domaine et direction (1,0 j) - **[FAIT]**
  - CRUD du référentiel des compétences (1,0 j) - **[FAIT]**
  - Gestion manuelle des compétences, expériences et formations candidat (1,5 j) - **[FAIT]**
- **OCR / IA** :
  - Intégration FastAPI et extraction OCR avec PaddleOCR (2,0 j) - **[FAIT]**
  - Extraction des compétences, expériences et formations depuis le CV (2,0 j) - **[EN COURS]**
  - Validation, correction et rejet des données extraites (2,0 j) - **[EN COURS]**
  - Tests et debug (1,0 j) - **[EN COURS]**
- **Sous-total : 8,5 j / 11,5 j (73.9% EN COURS)**

---

### Sprint 6 : Rendez-vous, communications et modèles (10,0 j - 0.0% A FAIRE)
- 📅 **Dates Prévisionnelles (Jours ouvrés)** : Du **16/10/2026** au **29/10/2026** (10,0 j)
- ⏱️ **Dates Réelles** : *À venir*
- **BACK-OFFICE** :
  - CRUD des rendez-vous : test, entretien, statut, mode, responsable (2,0 j)
  - Vue agenda par utilisateur, candidature et période (1,0 j)
  - Communication liée aux rendez-vous (1,0 j)
  - CRUD des modèles de communication (1,0 j)
  - Accusé de réception et première communication automatique (0,5 j)
  - Activation, désactivation et configuration de l'envoi automatique (1,0 j)
- **API / SERVICES** :
  - Récupération et ingestion des candidatures par E-mail (1,5 j)
  - Envoi manuel, historique des communications et préparation des rappels (1,5 j)
  - Tests et debug (0,5 j)
- **Sous-total : 10,0 j (0.0% A FAIRE)**

---

### Sprint 7 : Dashboard, recherche avancée, matching et finalisation (10,0 j - 0.0% A FAIRE)
- 📅 **Dates Prévisionnelles (Jours ouvrés)** : Du **30/10/2026** au **12/11/2026** (10,0 j)
- ⏱️ **Dates Réelles** : *À venir*
- **BACK-OFFICE** :
  - Tableau de bord et indicateurs principaux (1,0 j)
  - Statistiques mensuelles, répartition par statut et taux de transformation (1,5 j)
  - Délai moyen de traitement et filtres du dashboard (1,0 j)
  - Recherche avancée par mots-clés CV et compétences (1,5 j)
  - Matching candidat -> offre avec score simple (2,0 j)
  - Tests fonctionnels globaux, corrections et optimisation (1,5 j)
  - Documentation et préparation du déploiement (1,5 j)
- **Sous-total : 10,0 j (0.0% A FAIRE)**

---

## 📈 **Total Scope Général : 68,0 j (61.8% Réalisé - 42,0 j achevés sur 68,0 j)**
