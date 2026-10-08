# 🏗️ Plateforme de Recrutement ALPHA CIMENT

---

## 🗑️ Nettoyage avant partage (Dossiers à supprimer)

```bash
# Backend Laravel
rm -rf code_source/recrutement/vendor
rm -rf code_source/recrutement/node_modules
rm -rf code_source/recrutement/public/storage
rm -f code_source/recrutement/.env

# Frontend React
rm -rf code_source/recrutement-react/node_modules
rm -rf code_source/recrutement-react/dist

# Service OCR Python
rm -rf code_source/ocr/venv
rm -rf code_source/ocr/__pycache__
```

---

## 1. 🐘 Backend (Laravel 11)

```bash
cd code_source/recrutement
cp .env.example .env
composer install
php artisan key:generate
php artisan storage:link
php artisan migrate --seed
php artisan serve
```

---

## 2. ⚛️ Frontend (React Vite)

```bash
cd code_source/recrutement-react
npm install
npm run dev
```

---

## 3. 🐍 Service OCR (FastAPI)

```bash
cd code_source/ocr
python -m venv venv

# Windows :
.\venv\Scripts\activate

# Linux / MacOS :
# source venv/bin/activate

pip install -r requirements.txt
python -m spacy download fr_core_news_md
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

---

## 🌐 URLs d'accès

| Application | URL |
|---|---|
| **Portail Candidat (Front-Office)** | http://localhost:5173/candidat/offres |
| **Espace Recruteur RH (Back-Office)** | http://localhost:5173/backoffice/dashboard |
| **API Backend (Laravel)** | http://localhost:8000 |
| **Documentation API OCR (FastAPI)** | http://localhost:8001/docs |

---

## 🔑 Compte Administrateur RH

| Champ | Valeur |
|---|---|
| **Email** | `admin@alphaciment.local` |
| **Mot de passe** | `password` |
