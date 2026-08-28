# Planning global des sprints (Scope Général Offert - 66,5 j)

Ce document contient la découpe officielle et exacte du projet *recrutement_alpaCiment* sur 66,5 jours.

| Sprint | Intitulé | Estimation |
| --- | --- | ---: |
| **Sprint 0** | Analyse, cadrage et conception | 9,0 j |
| **Sprint 1** | Socle technique, sécurité et référentiels de base | 6,0 j |
| **Sprint 2** | Gestion des offres, directions et domaines | 7,0 j |
| **Sprint 3** | Dépôt et réception des candidatures | 7,5 j |
| **Sprint 4** | Gestion RH des candidatures et fiche candidat | 7,0 j |
| **Sprint 5** | Vivier, compétences et validation CV | 11,5 j |
| **Sprint 6** | Rendez-vous, communications et modèles | 10,0 j |
| **Sprint 7** | Dashboard, recherche avancée, matching et finalisation | 8,5 j |
| **Total** | **Total Scope** | **66,5 j** |

---

## 📌 Détail Complet des Sprints et des Tâches

### Sprint 0 : Analyse, cadrage et conception (9,0 j)
- Analyse du cahier des charges et définition du périmètre V1 (2,0 j)
- Identification des modules fonctionnels du recrutement (1,5 j)
- Analyse des parcours candidat / RH / admin (1,5 j)
- Conception du MCD / MLD et des règles métier (2,0 j)
- Conception de l'architecture Laravel / React / PostgreSQL / FastAPI (0,5 j)
- Planification du projet et préparation de l'environnement (1,5 j)
- **Sous-total : 9,0 j**

---

### Sprint 1 : Socle technique, sécurité et référentiels de base (6,0 j)
- **BACK-OFFICE / API** :
  - Configuration du projet Laravel et de l'environnement PostgreSQL (1,0 j)
  - Mise en place des migrations principales et des seeders (1,0 j)
  - Mise en place de l'architecture API REST (1,0 j)
  - Authentification et gestion des rôles RH / admin (1,0 j)
- **FRONT-OFFICE / INTERFACE** :
  - Installation de React avec Vite et structure de navigation (0,5 j)
  - Intégration de la mise en page générale du back-office (1,0 j)
  - Tests et debug (0,5 j)
- **Sous-total : 6,0 j**

---

### Sprint 2 : Gestion des offres, directions et domaines (7,0 j)
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
- **Sous-total : 7,0 j**

---

### Sprint 3 : Dépôt et réception des candidatures (7,5 j)
- **FRONT-OFFICE** :
  - Formulaire de candidature sur offre (temporaire) (0,5 j)
  - Formulaire de candidature spontanée avec domaine (temporaire) (0,5 j)
  - Upload des CV, photos et documents (1,0 j)
- **BACK-OFFICE** :
  - Saisie manuelle d'une candidature par un RH (1,0 j)
- **API / SERVICES** :
  - Détection d'un candidat existant et dédoublonnage par email (1,0 j)
  - Création transactionnelle : candidat, candidature, statut initial, historique (2,0 j)
  - Préparation de la réception/import depuis le site externe (0,5 j)
  - Tests et debug (1,0 j)
- **Sous-total : 7,5 j**

---

### Sprint 4 : Gestion RH des candidatures et fiche candidat (7,0 j)
- **BACK-OFFICE** :
  - Liste générale des candidatures avec pagination (0,5 j)
  - Recherche et filtres : statut, direction, période, canal, type (0,5 j)
  - Gestion des candidatures sur offre : Direction -> Offre -> Candidats (0,5 j)
  - Gestion des candidatures spontanées : Direction -> Domaine -> Candidatures (0,5 j)
  - Fiche candidat : informations, documents, statut, historique statuts et communications (2,0 j)
  - Changement de statut avec commentaire et historique (1,5 j)
  - Export PDF de la fiche candidat (0,5 j)
  - Tests et debug (1,0 j)
- **Sous-total : 7,0 j**

---

### Sprint 5 : Vivier, compétences et validation CV (11,5 j)
- **BACK-OFFICE** :
  - Gestion du vivier : ajout, retrait, consultation (1,0 j)
  - Recherche dans le vivier par compétence, domaine et direction (1,0 j)
  - CRUD du référentiel des compétences (1,0 j)
  - Gestion manuelle des compétences, expériences et formations candidat (1,5 j)
- **OCR / IA** :
  - Intégration FastAPI et extraction OCR avec PaddleOCR (2,0 j)
  - Extraction des compétences, expériences et formations depuis le CV (2,0 j)
  - Validation, correction et rejet des données extraites (2,0 j)
  - Tests et debug (1,0 j)
- **Sous-total : 11,5 j**

---

### Sprint 6 : Rendez-vous, communications et modèles (10,0 j)
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
- **Sous-total : 10,0 j**

---

### Sprint 7 : Dashboard, recherche avancée, matching et finalisation (8,5 j)
- **BACK-OFFICE** :
  - Tableau de bord et indicateurs principaux (1,0 j)
  - Statistiques mensuelles, répartition par statut et taux de transformation (1,5 j)
  - Délai moyen de traitement et filtres du dashboard (1,0 j)
  - Recherche avancée par mots-clés CV et compétences (1,0 j)
  - Matching candidat -> offre avec score simple (2,0 j)
  - Tests fonctionnels globaux, corrections et optimisation (1,5 j)
  - Documentation et préparation du déploiement (0,5 j)
- **Sous-total : 8,5 j**

---

## **Total Scope General : 66,5 j**
