# Microservice FastAPI OCR & Parsing CV (PaddleOCR)

Ce microservice Python autonome est dédié à l'extraction OCR de texte brut et au parsing structuré de CVs pour le système de recrutement AlpA Ciment.

---

## 🚀 Démarrage du Microservice

### 1. Installation des dépendances Python
```bash
pip install -r requirements.txt
```

### 2. Lancement du serveur Uvicorn (Port 8001)
```bash
 python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

---

## 📌 Endpoints API

- `GET /health` : Vérification du statut du microservice et des moteurs OCR installés.
- `POST /extract-cv` : Téléversement du fichier CV et extraction du texte brut et du JSON structuré (`competences`, `experiences`, `formations`).


### pour les test 
python .\test_cv_nlp_parser.py 
