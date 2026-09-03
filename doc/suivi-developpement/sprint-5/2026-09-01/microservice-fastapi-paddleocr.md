# Documentation Sprint 5 - Microservice FastAPI OCR & Parsing CV (PaddleOCR) (2,0 j)

## 📌 Objectif de la Tâche
Création d'un microservice autonome Python FastAPI dans le dossier `code_source/ocr/` (à côté de `recrutement` et `recrutement-react`), permettant l'analyse OCR automatique (PaddleOCR / pypdf) et le parsing structuré IA des CVs des candidats (extraction du texte brut, des compétences avec niveau, des expériences professionnelles et des diplômes).

---

## 🛠️ Structure & Fichiers Créés

### 1. Microservice Python FastAPI (`code_source/ocr/`)
- **[main.py](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/ocr/main.py)** : Serveur d'extraction FastAPI avec endpoints `GET /health` et `POST /extract-cv`.
- **[requirements.txt](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/ocr/requirements.txt)** : Dépendances Python (`fastapi`, `uvicorn`, `paddleocr`, `pypdf`, `python-multipart`).
- **[README.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/ocr/README.md)** : Instructions de déploiement et de lancement uvicorn.

### 2. Connecteur Backend Laravel
- **[VivierController.php](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement/app/Http/Controllers/Api/VivierController.php#L274-L340)** : Méthode `extractOcr($idCandidature)` transmettant le fichier CV du candidat par HTTP POST au microservice FastAPI (`http://127.0.0.1:8001/extract-cv`) avec système de fallback sécurisé.

---

## 🔄 Commandes de Lancement du Microservice FastAPI
```bash
cd code_source/ocr
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```
