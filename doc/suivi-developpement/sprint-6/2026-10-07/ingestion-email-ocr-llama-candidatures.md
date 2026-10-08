# Documentation Technique - Pipeline Ingestion Emails, OCR & Parsing Local (Llama 3.2), et Intégration Candidatures (1,5 j)

**Date :** 07 Octobre 2026  
**Sprint :** Sprint 6 (Communication, Réception & Ingestion des Candidatures par E-mail)  
**Auteurs :** Équipe Recrutement AlpA Ciment  

---

## 📌 1. Contexte & Objectifs

L'objectif de cette tâche est d'automatiser entièrement le cycle d'ingestion et d'analyse des candidatures reçues par e-mail via **n8n**, un microservice **FastAPI OCR / NER**, et la plateforme **Laravel + React** :
1. **Classification automatique des e-mails** : Détection intelligente de l'intention (candidature spontanée vs candidature sur offre existante) en croisant les références d'offres réelles.
2. **Accélération critique de l'OCR & de l'extraction d'entités (NER)** :
   - Éviter l'OCR lourd sur CPU pour les PDF textuels en utilisant `pypdf`.
   - Remplacer les modèles NER lents par le modèle local **Llama 3.2 (3B)** via **Ollama** tournant sur GPU (NVIDIA RTX 2070), réduisant le temps de réponse de ~50 secondes à moins de 3 secondes.
   - Suppression du traitement d'angle PaddleOCR (`cls=False`) pour gagner en réactivité.
3. **Persistance complète des candidatures et documents** :
   - Insertion directe dans les tables de profil candidat : `candidat_competence`, `candidat_experience_professionnelle`, `candidat_formation`.
   - Enregistrement du fichier binaire CV décodé en Base64 dans `storage/app/public/documents/cv/` et inscription dans la table `document`.
4. **Interface Back-Office RH (React)** :
   - Affichage côte à côte au format A4 du CV original et des données extraites (Contact NER, Profil, Compétences, Expériences, Formations) avec possibilité de validation en un clic.

---

## 🛠️ 2. Architecture & Étapes de Résolution

### Étape 1 : Optimisation de l'Extraction OCR & Parsing Local (FastAPI + Ollama)
- **Fichiers modifiés / créés :**
  - [`code_source/ocr/cv_llm_parser.py`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/ocr/cv_llm_parser.py)
  - [`code_source/ocr/cv_ocr_extractor.py`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/ocr/cv_ocr_extractor.py)
  - [`code_source/ocr/email_classifier.py`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/ocr/email_classifier.py)
  - [`code_source/ocr/main.py`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/ocr/main.py)
- **Actions réalisées :**
  - Détection PDF universelle basée sur les octets magiques `b"%PDF"` : même si le nom de fichier temporaire n8n n'a pas d'extension `.pdf`, `pypdf` extrait le texte instantanément (~0.05s).
  - Désactivation de l'angle classification (`cls=False`, `use_angle_cls=False`) sur PaddleOCR pour alléger le traitement CPU si une image scannée est soumise.
  - Utilisation de `ollama` avec `llama3.2` en format `json` contraint par prompt système optimisé, garantissant une extraction en ~2-3s sur carte RTX 2070.
  - Endpoint `POST /classify-email` permettant de récupérer automatiquement les offres actives depuis Laravel (`GET /api/public/offres`), dispensant n8n de gérer le paramètre `active_offers`.

---

### Étape 2 : Référentiel des Offres & Directions (Alias & Références)
- **Fichier migration :**
  - [`database/migrations/2026_10_07_000000_add_alias_to_direction_and_reference_to_offre.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/database/migrations/2026_10_07_000000_add_alias_to_direction_and_reference_to_offre.php)
- **Actions réalisées :**
  - Ajout de la colonne `alias` sur la table `direction` (IT, RH, FIN, MKT, COMM, etc.).
  - Ajout de la colonne `reference` sur la table `offre` (ex: `IT-1`, `RH-3`).
  - Hook Eloquent sur [`Offre.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Models/Offre.php) générant automatiquement la référence lors de la création d'une offre si non renseignée.
  - Affichage de badges bleus de référence dans la liste des offres React ([`OffersTable.jsx`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement-react/src/components/tables/OffersTable.jsx)).

---

### Étape 3 : Ingestion Automatique dans Laravel (Candidature, Profils & Documents)
- **Fichiers modifiés :**
  - [`app/Http/Requests/Candidature/ImportExternalCandidatureRequest.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Http/Requests/Candidature/ImportExternalCandidatureRequest.php)
  - [`app/Services/CandidatureService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Services/CandidatureService.php)
  - [`app/Models/Candidature.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Models/Candidature.php)
  - [`app/Repositories/Eloquent/EloquentCandidatureRepository.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Repositories/Eloquent/EloquentCandidatureRepository.php)
  - [`app/Http/Resources/CandidatureResource.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Http/Resources/CandidatureResource.php)
- **Actions réalisées :**
  - **Support du payload JSON n8n** : Prise en charge des requêtes JSON brutes avec les champs `cv_base64`, `cv_nom`, `cv_mime`.
  - **Décodage Base64 et stockage fichier** : La méthode `storeFiles()` vérifie le tableau `$data` et l'objet `$request`, supprime les en-têtes Data-URI si présents, écrit le fichier dans `storage/app/public/documents/cv/` et crée une ligne dans `document`.
  - **Insertion directe du profil** : La méthode `insertExtractedProfileData()` insère automatiquement :
    - `candidat_competence` (création/liaison de la compétence, statut validé, source `cv_ocr`).
    - `candidat_experience_professionnelle` (poste, entreprise, dates, détection du poste actuel si mention "En cours" ou "Présent").
    - `candidat_formation` (diplôme, établissement, année d'obtention).
    - `cv_extraction_ocr` (conservation du JSON brut et texte pour traçabilité et révision).
  - Relation Eloquent `cvExtractionOcr` exposée dans `CandidatureResource` pour que le front-office la charge immédiatement.

---

### Étape 4 : Configuration du Flux n8n
- **Problème identifié avec le binaire :**
  Dans n8n, `$binary` fait référence aux données binaires du nœud immédiatement précédent. Lorsque le nœud précédent est le microservice OCR HTTP, il ne sort que du JSON sans binaire. Dès lors, `$binary.attachment_0.data` était vide.
- **Solution appliquée :**
  Cibler directement le nœud email initial ayant téléchargé la pièce jointe :
  - `cv_base64` : `{{ $('Get a message').item.binary.attachment_0.data }}`
  - `cv_nom` : `{{ $('Get a message').item.binary.attachment_0.fileName }}`
  - `cv_mime` : `{{ $('Get a message').item.binary.attachment_0.mimeType }}`

---

### Étape 5 : Interface RH - Fiche Candidat & Visualisation Double Colonne
- **Fichier modifié :**
  - [`code_source/recrutement-react/src/pages/CandidatureDetailView.jsx`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement-react/src/pages/CandidatureDetailView.jsx)
- **Actions réalisées :**
  - **Chargement automatique** : Les données OCR existantes sont chargées dès l'ouverture de la vue depuis la ressource API.
  - **Onglet "Extraction CV" côte à côte** :
    - **Colonne gauche (Format A4)** : Visualiseur direct du CV (iframe pour PDF, visionneuse d'image ou lien de téléchargement direct).
    - **Colonne droite (Données extraites)** :
      - Bloc récapitulatif des coordonnées NER (Nom, Email, Téléphone, Ville).
      - Bloc Profil / Résumé.
      - Liste des compétences avec niveaux en badges colorés.
      - Cartes détaillées des expériences professionnelles.
      - Cartes détaillées des formations et diplômes.
      - Bouton de validation rapide RH.

---

## 📊 3. Résultats & Vérification

- ✅ **Extraction OCR/NER ultra-rapide** : Ingestion fluide en moins de 3 secondes par candidature.
- ✅ **Base de données cohérente** : Candidature #102 vérifiée avec succès avec 18 compétences, 2 expériences, 2 formations et le document CV associé.
- ✅ **Build React validé** : `npm run build` réussi sans aucune erreur de syntaxe ou de bundle.
