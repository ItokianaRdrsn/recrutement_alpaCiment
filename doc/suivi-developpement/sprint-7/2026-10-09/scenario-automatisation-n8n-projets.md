# Scénario d'Automatisation n8n, Extraction OCR/LLM & Section Projets/Réalisations

## 1. Contexte & Problématique
Dans le pipeline d'ingestion des candidatures par e-mail et de parsing automatique de CV via OCR et LLM, une difficulté récurrente a été mise en évidence :
- Les modèles de langage (LLM) ont une propension à **confondre les projets académiques, personnels ou open-source avec de réelles expériences professionnelles en entreprise**.
- Sans séparation explicite, les projets étudiants sont souvent soit faussement qualifiés de contrats de travail, soit perdus lors de l'extraction.
- D'autre part, la classification des e-mails entrants doit distinguer 3 intentions franches :
  1. `demande_emploi` (qu'elle soit sur offre ciblée ou spontanée)
  2. `information` (renseignements généraux, contact accueil)
  3. `spam` (démarchage, publicités sans action)
- Enfin, toute candidature par e-mail doit archiver l'e-mail source dans la table `communication` et déclencher un accusé de réception automatique (**RG-COM-02**). Si `id_offre` est absent, la candidature est considérée comme spontanée et bascule automatiquement dans le vivier (**RG-VIV-02**).

---

## 2. Architecture & Réalisations

### A. Base de Données PostgreSQL & Modèle Clean Architecture
- **Table `candidat_projet`** créée et synchronisée dans [`sql/gestion_recrutement.sql`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/sql/gestion_recrutement.sql) et migration Laravel `2026_10_09_000100_create_candidat_projet_table.php` :
  - `id_projet` (BIGINT PK)
  - `id_candidature` (BIGINT FK ON DELETE CASCADE)
  - `titre_projet` (VARCHAR 200)
  - `role` (VARCHAR 150)
  - `technologies` (VARCHAR 255)
  - `url_projet` (VARCHAR 255)
  - `date_debut` / `date_fin` (DATE)
  - `description` (TEXT)
  - `source` ('manuel', 'cv_ocr')
  - `valide` (BOOLEAN)
- **Modèle Eloquent** : [`CandidatProjet.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Models/CandidatProjet.php).
- **Couche Repository** :
  - `VivierRepositoryInterface` enrichi de `getProjetsByCandidature()` et `createProjet()`.
  - `EloquentVivierRepository` implémente les méthodes requises.
- **Couche Service** :
  - `VivierService` inclut `addProjet()` et gère les projets dans `validateOcrData()`.
  - `CandidatureService` insère directement les projets extraits dans `insertExtractedProfileData()`.
  - `CandidatureService::importExternalCandidature()` archive l'e-mail dans la table `communication` et envoie l'accusé de réception automatique.
- **Contrôleur API** :
  - `VivierController::addProjet()` accessible via `POST /candidature/{idCandidature}/projets`.

### B. Microservice FastAPI (`automatisation/projet_test_fastapi/app.py`)
- Nouvel endpoint `POST /api/classifier-intention` classifiant en :
  - `demande_emploi` (avec détection de l'`id_offre` si présent)
  - `information`
  - `spam`
- Nouvel endpoint `POST /api/extraire-cv-ocr` qui extrait de façon dissociée :
  - `contact`
  - `competences`
  - `experiences` (postes en entreprise)
  - `projets` (titre, technologies, rôle, lien, dates, description)
  - `formations`

### C. Workflow n8n (`automatisation/workflow_candidature_email_final.json`)
Workflow officiel complet importable dans n8n contenant :
1. Trigger Webhook (`/webhook/email-inbox`)
2. Appel IA FastAPI pour classification de l'intention
3. Nœud Switch à 3 branches (`demande_emploi`, `information`, `spam`)
4. Branche `demande_emploi` : extraction du CV, formatage du payload avec les sections séparées, puis synchronisation avec `/api/public/import-candidature` (avec trace `communication` et accusé de réception).
5. Branches `information` et `spam` : réponses adaptées sans polluer la base de données.

### D. Frontend React (`CandidatureDetailView.jsx`)
- **Onglet Informations** :
  - Bloc d'affichage des projets avec titre, rôle, badges des technologies utilisées, URL cliquable et description.
  - Formulaire de saisie manuelle d'un nouveau projet (`handleAddProjet`).
- **Onglet Extraction OCR & IA** :
  - Bloc des **Projets & Réalisations identifiés** dans le résultat du parsing CV.
  - Bouton de suppression individuelle d'un projet extrait avant validation par le recruteur.
  - Sauvegarde et importation automatique au profil lors du clic sur *Valider & Importer au profil*.
- **Export PDF A4** : La section Projets s'intègre automatiquement dans la mise en page d'impression.

---

## 3. Validation & Tests
- **PHPUnit** : `php artisan test` $\rightarrow$ **26/26 tests réussis (103 assertions)**, incluant `ImportCandidatureN8nTest`.
- **Vite Build** : `npm run build` exécuté avec succès en 2.29s (0 erreur).
- **SQL Maître** : [`sql/gestion_recrutement.sql`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/sql/gestion_recrutement.sql) mis à jour avec `candidat_projet` et `cv_extraction_ocr`.
