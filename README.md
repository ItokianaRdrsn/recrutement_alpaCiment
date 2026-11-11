# 🏗️ Plateforme de Recrutement ALPHA CIMENT

> 📘 **Guides de Déploiement :**
> - [**`GUIDE_DEPLOIEMENT_NOUVELLE_MACHINE.md`**](GUIDE_DEPLOIEMENT_NOUVELLE_MACHINE.md) : Guide pas-à-pas pour installer le projet sur un autre PC.
> - [**`GUIDE_DEPLOIEMENT_SERVEUR_PRODUCTION.md`**](GUIDE_DEPLOIEMENT_SERVEUR_PRODUCTION.md) : Mise en ligne sur serveur de production (VPS Ubuntu, Nginx, HTTPS).
> - [**`PREREQUIS.md`**](PREREQUIS.md) : Pré-requis détaillés logiciels et configuration système (`php.ini`, PostgreSQL, etc.).

---

## 🗑️ Nettoyage avant partage (Dossiers à supprimer)

```bash
# Backend Laravel
rm -rf code_source/recrutement/vendor
rm -rf code_source/recrutement/node_modules
rm -rf code_source/recrutement/public/storage
rm -rf code_source/recrutement/bootstrap/cache/*.php
rm -f code_source/recrutement/.env

# Frontend React
rm -rf code_source/recrutement-react/node_modules
rm -rf code_source/recrutement-react/dist

# Service OCR Python
rm -rf code_source/ocr/venv
rm -rf code_source/ocr/__pycache__

# Automatisation n8n (si conteneur déjà lancé)
rm -rf automatisation/.n8n
```

---

## 1. 🗄️ Base de Données (PostgreSQL)

Création de la base, des tables, triggers et données initiales :

```bash
psql -U postgres -f sql/gestion_recrutement.sql
```

---

## 2. 🐘 Backend (Laravel 13 - PHP 8.3+)

> ⚠️ **PHP 8.3 minimum obligatoire** avec extensions : `pdo_pgsql`, `pgsql`, `mbstring`, `fileinfo`, `gd`, `zip`.

```bash
cd code_source/recrutement
cp .env.example .env
composer install
php artisan key:generate
php artisan storage:link
php artisan serve
```

---

## 3. ⚛️ Frontend (React 19 Vite)

```bash
cd code_source/recrutement-react
npm install
npm run dev
```

---

## 4. 🐍 Service OCR & IA (FastAPI & PaddleOCR)

```bash
cd code_source/ocr
python -m venv venv

# Windows :
.\venv\Scripts\activate

# Linux / MacOS :
# source venv/bin/activate

pip install -r requirements.txt

# Démarrer le service (Windows) :
.\venv\Scripts\python.exe main.py

# Démarrer le service (Linux / MacOS) :
# ./venv/bin/python main.py
```

---

## 5. 🦙 Moteur IA / LLM Local (Ollama)

```bash
# 1. Télécharger Ollama sur https://ollama.com
# 2. Télécharger le modèle IA de parsing & classification :
ollama pull qwen2.5:7b

# 3. Démarrer le serveur Ollama (port 11434) :
ollama serve
```

---

## 6. ⚡ Automatisation & Pipeline Email (n8n Docker - Optionnel)

```bash
cd automatisation
docker compose up -d
```

---

## 🌐 URLs d'accès

| Application | URL |
|---|---|
| **Portail Candidat (Front-Office)** | http://localhost:5173/candidat/offres |
| **Espace Recruteur RH (Back-Office)** | http://localhost:5173/backoffice/dashboard |
| **API Backend (Laravel)** | http://localhost:8000 |
| **Documentation API OCR (FastAPI)** | http://localhost:8001/docs |
| **Serveur LLM Local (Ollama)** | http://localhost:11434 |
| **Pipeline d'Automatisation (n8n)** | http://localhost:5678 |

---

## 🔑 Compte Administrateur RH

| Champ | Valeur |
|---|---|
| **Email** | `admin@alphaciment.local` |
| **Mot de passe** | `password` |
