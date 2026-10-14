# 📋 Guide des Pré-requis & Manuel d'Installation Complète
## Projet : Plateforme de Recrutement AlpA Ciment

Ce document répertorie de manière exhaustive **tous les logiciels à télécharger**, les **modèles d'IA locaux (Ollama & PaddleOCR)**, les **extensions et dépendances à activer**, ainsi que les **configurations système pas à pas** nécessaires pour déployer et exécuter le projet sur votre machine (Windows, Linux ou macOS).

---

## 📑 Sommaire
1. [Matrice Générale des Logiciels & Outils](#1-matrice-générale-des-logiciels--outils)
2. [Installation & Configuration Détaillée par Outil](#2-installation--configuration-détaillée-par-outil)
   - [2.1 PHP 8.2+ ou 8.3 & Configuration php.ini](#21-php-82-ou-83--configuration-phpini)
   - [2.2 Composer 2.x](#22-composer-2x)
   - [2.3 Node.js & npm](#23-nodejs--npm)
   - [2.4 PostgreSQL 15+ & pgAdmin 4](#24-postgresql-15--pgadmin-4)
   - [2.5 Python 3.10 / 3.11 & Visual C++ Runtime](#25-python-310--311--visual-c-runtime)
   - [2.6 Ollama & Modèle LLM Local (IA Parsing & Classification)](#26-ollama--modèle-llm-local-ia-parsing--classification)
   - [2.7 Git](#27-git)
   - [2.8 Docker Desktop (Optionnel pour n8n)](#28-docker-desktop-optionnel-pour-n8n)
   - [2.9 Mailpit (Optionnel pour tester l'envoi de mails)](#29-mailpit-optionnel-pour-tester-lenvoi-de-mails)
3. [Configuration des Environnements (.env)](#3-configuration-des-environnements-env)
   - [3.1 Backend Laravel (.env)](#31-backend-laravel-env)
   - [3.2 Microservice OCR & IA Python](#32-microservice-ocr--ia-python)
   - [3.3 Frontend React](#33-frontend-react)
4. [Guide d'Installation & Initialisation Pas à Pas](#4-guide-dinstallation--initialisation-pas-à-pas)
   - [Étape 1 : Création de la Base de Données PostgreSQL](#étape-1--création-de-la-base-de-données-postgresql)
   - [Étape 2 : Configuration du Backend Laravel](#étape-2--configuration-du-backend-laravel)
   - [Étape 3 : Installation et Démarrage d'Ollama](#étape-3--installation-et-démarrage-dollama)
   - [Étape 4 : Installation du Microservice OCR Python](#étape-4--installation-du-microservice-ocr-python)
   - [Étape 5 : Installation du Frontend React](#étape-5--installation-du-frontend-react)
   - [Étape 6 (Optionnel) : Démarrage du conteneur n8n](#étape-6-optionnel--démarrage-du-conteneur-n8n)
5. [Procédure de Démarrage Quotidien (Runbook 4 Terminaux)](#5-procédure-de-démarrage-quotidien-runbook-4-terminaux)
6. [Comptes & URLs d'Accès](#6-comptes--urls-daccès)
7. [Dépannage & Erreurs Fréquentes (Troubleshooting FAQ)](#7-dépannage--erreurs-fréquentes-troubleshooting-faq)

---

## 1. Matrice Générale des Logiciels & Outils

| Logiciel | Version Minimale | Rôle dans le Projet | Lien Officiel de Téléchargement | Vérification CLI |
| :--- | :--- | :--- | :--- | :--- |
| **PHP** | `8.2.0` (8.3+ recommandé) | Moteur d'exécution Backend API Laravel 11 | [php.net/downloads](https://www.php.net/downloads) | `php -v` |
| **Composer** | `2.6+` | Gestionnaire de paquets PHP | [getcomposer.org/download](https://getcomposer.org/download/) | `composer --version` |
| **Node.js & npm** | `Node 18.x LTS` ou `20.x LTS` (npm 9+) | Environnement Frontend React 19 / Vite | [nodejs.org/en/download](https://nodejs.org/en/download/) | `node -v` et `npm -v` |
| **PostgreSQL** | `15.0+` (16 recommandé) | Base de données relationnelle principale | [postgresql.org/download](https://www.postgresql.org/download/) | `psql -V` |
| **pgAdmin 4** | `7.x+` (inclus avec PostgreSQL) | Interface graphique d'administration BDD | [pgadmin.org/download](https://www.pgadmin.org/download/) | IHM Web/Desktop |
| **Python** | `3.10` ou `3.11` | Microservice OCR & extraction (PaddleOCR / FastAPI) | [python.org/downloads](https://www.python.org/downloads/) | `python --version` |
| **Visual C++ Redistributable** | `2015-2022 (x64)` | DLLs C++ indispensables pour PaddlePaddle & Pillow | [learn.microsoft.com (VC++ x64)](https://aka.ms/vs/17/release/vc_redist.x64.exe) | - |
| **Ollama** | `0.3.0+` | **Serveur LLM local & privé** (Parsing CV & Classification emails) | [ollama.com/download](https://ollama.com/download) | `ollama --version` |
| **Git** | `2.40+` | Gestion de versions et clonage du code | [git-scm.com/downloads](https://git-scm.com/downloads) | `git --version` |
| **Docker Desktop** *(Optionnel)* | `4.20+` | Orchestration du pipeline n8n d'automatisation | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) | `docker --version` |
| **Mailpit** *(Optionnel)* | `1.15+` | Serveur SMTP local pour visualiser les emails envoyés | [github.com/axllent/mailpit](https://github.com/axllent/mailpit/releases) | `mailpit version` |

---

## 2. Installation & Configuration Détaillée par Outil

### 2.1 PHP (8.2+ ou 8.3) & Configuration `php.ini`

#### Installation :
- **Windows** : Télécharger la version **VS16 x64 Non Thread Safe** ou **Thread Safe** depuis [windows.php.net/download](https://windows.php.net/download/). Extraire dans `C:\php` et ajouter `C:\php` dans la variable d'environnement système **PATH**. *(Alternative simple : utiliser Laragon ou Scoop `scoop install php`)*.
- **Ubuntu / Debian** :
  ```bash
  sudo apt update
  sudo apt install -y software-properties-common
  sudo add-apt-repository ppa:ondrej/php -y
  sudo apt install -y php8.3 php8.3-cli php8.3-common php8.3-pgsql php8.3-sqlite3 php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-gd php8.3-intl
  ```
- **macOS** :
  ```bash
  brew install php@8.3
  brew link --force --overwrite php@8.3
  ```

#### ⚠️ Configuration OBLIGATOIRE du fichier `php.ini` :
Ouvrez votre fichier `php.ini` (ex: `C:\php\php.ini` sous Windows, ou `/etc/php/8.3/cli/php.ini` sous Linux) et assurez-vous que les extensions suivantes sont **décommentées** (enlever le `;` devant la ligne) :

```ini
; Extensions obligatoires pour Laravel & PostgreSQL & SQLite (tests)
extension=curl
extension=fileinfo
extension=gd
extension=mbstring
extension=openssl
extension=pdo_pgsql
extension=pgsql
extension=pdo_sqlite
extension=sqlite3
extension=zip

; Paramètres d'upload pour la réception des CVs (PDF / Images)
upload_max_filesize = 50M
post_max_size = 55M
memory_limit = 512M
max_execution_time = 120
```

> **Vérification CLI :**
> Exécutez la commande suivante pour confirmer que PostgreSQL et SQLite sont bien reconnus :
> ```bash
> php -m | findstr -i "pgsql sqlite pdo"
> # (Sous Linux/macOS : php -m | grep -E "pgsql|sqlite|pdo")
> ```
> Vous devez voir apparaître : `pdo_pgsql`, `pdo_sqlite`, `pgsql`, `sqlite3`.

---

### 2.2 Composer (2.x)

1. Téléchargez et exécutez le programme d'installation `Composer-Setup.exe` depuis [getcomposer.org/download](https://getcomposer.org/download/).
2. L'installateur détectera automatiquement le chemin de votre binaire `php.exe`.
3. Vérifiez dans un nouveau terminal :
   ```bash
   composer --version
   # Résultat attendu : Composer version 2.7.x ou supérieure
   ```

---

### 2.3 Node.js & npm

1. Téléchargez la version **LTS** (Long Term Support, ex: v20.x ou v22.x) depuis [nodejs.org](https://nodejs.org/).
2. Suivez l'assistant d'installation en conservant les options par défaut (inclut npm).
3. Vérifiez l'installation :
   ```bash
   node -v
   # Résultat attendu : v18.x.x ou v20.x.x
   npm -v
   # Résultat attendu : 9.x.x ou 10.x.x
   ```

---

### 2.4 PostgreSQL (15+) & pgAdmin 4

1. Téléchargez l'installateur officiel PostgreSQL pour Windows/Linux/Mac depuis [postgresql.org/download](https://www.postgresql.org/download/).
2. Lors de l'installation :
   - Définissez le mot de passe pour l'utilisateur superadmin `postgres` (ex: `root` ou `postgres`).
   - Conservez le port standard : `5432`.
   - Laissez la locale par défaut ou `C.UTF-8` / `French_France.1252`.
3. Assurez-vous que le service PostgreSQL est bien démarré :
   - Sous Windows : Ouvrir `Services` et vérifier que `postgresql-x64-16` est en statut **En cours d'exécution**.

---

### 2.5 Python (3.10 ou 3.11) & Visual C++ Runtime

Le microservice d'analyse OCR de CVs utilise **PaddleOCR** et **PaddlePaddle**, qui nécessitent une version de Python 3.10 ou 3.11 (compatibilité native binaire).

1. **Installer Visual C++ Redistributable (Windows)** :
   - Téléchargez et installez impérativement : [Visual C++ 2015-2022 x64](https://aka.ms/vs/17/release/vc_redist.x64.exe).
   - *(Sans ce composant, PaddlePaddle lèvera une erreur `ImportError: DLL load failed`)*.
2. **Installer Python** :
   - Téléchargez l'installateur **Python 3.10.x** ou **3.11.x** depuis [python.org](https://www.python.org/downloads/).
   - ⚠️ **IMPORTANT :** Cochez la case **"Add Python to PATH"** en bas du premier écran d'installation avant de cliquer sur "Install Now".
3. **Vérification** :
   ```bash
   python --version
   pip --version
   ```

---

### 2.6 Ollama & Modèle LLM Local (IA Parsing & Classification)

Ollama est le **moteur d'intelligence artificielle locale** du projet. Il permet d'exécuter des modèles de langage (LLMs) directement sur votre machine sans aucune dépendance cloud, 100% gratuitement et dans le respect total de la confidentialité des données des candidats.

#### Rôles clés d'Ollama dans AlpA Ciment :
1. **Extraction Structurée des CVs (`cv_llm_parser.py`)** : Prend le texte brut extrait par PaddleOCR et dissocie intelligemment les compétences, les expériences en entreprise, les projets académiques/personnels, et les formations sous un format JSON strict.
2. **Classification d'Intention des Emails (`email_classifier.py`)** : Analyse automatiquement les emails entrants reçus par n8n pour les router en `demande_offre` (avec rattachement automatique à l'offre correspondante ex: `IT-1`), `demande_spontanee` (vivier) ou `demande_information`.

#### Installation d'Ollama :
- **Windows** : Télécharger et exécuter l'installateur [OllamaSetup.exe](https://ollama.com/download/windows). Ollama démarre automatiquement dans la barre des tâches.
- **macOS** : Télécharger [Ollama-darwin.zip](https://ollama.com/download/mac) ou via `brew install ollama`.
- **Linux** :
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ```

#### 📥 Téléchargement du Modèle LLM Recommandé :
Ouvrez un terminal et exécutez la commande suivante pour télécharger le modèle utilisé par défaut par le code source :

```bash
ollama pull qwen2.5:7b
```

> 💡 **Alternative pour machines légères (moins de 8 Go de RAM) :**
> Si votre PC dispose de peu de RAM ou n'a pas de carte graphique dédiée, vous pouvez télécharger un modèle plus léger :
> ```bash
> ollama pull qwen2.5:3b
> # ou
> ollama pull llama3.2:3b
> ```
> *(Dans ce cas, adaptez simplement `DEFAULT_MODEL = "qwen2.5:3b"` dans `code_source/ocr/cv_llm_parser.py` et `email_classifier.py`)*.

#### Vérification du Serveur Ollama :
Vérifiez que le serveur Ollama répond bien sur le port local standard `11434` :
```bash
curl http://127.0.0.1:11434/api/tags
```
*(Ou ouvrez `http://127.0.0.1:11434/` dans votre navigateur : le message `"Ollama is running"` doit s'afficher)*.

---

### 2.7 Git

1. Téléchargez Git depuis [git-scm.com/downloads](https://git-scm.com/downloads).
2. Installez avec les réglages recommandés (Git Bash inclus).
3. Vérification :
   ```bash
   git --version
   ```

---

### 2.8 Docker Desktop (Optionnel — Module Automatisation n8n)

Si vous souhaitez exécuter le pipeline n8n de synchronisation IMAP des candidatures par email (`automatisation/docker-compose.yml`) :
1. Téléchargez [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Activez **WSL 2** sous Windows lors de l'installation.
3. Démarrez Docker Desktop.

---

### 2.9 Mailpit (Optionnel — Capture locale des Emails)

Pour visualiser les convocations d'entretiens et accusés de réception générés par Laravel sans envoyer de vrais emails sur internet :
1. Téléchargez [Mailpit](https://github.com/axllent/mailpit/releases).
2. Lancez `mailpit` : interface Web disponible sur `http://localhost:8025` et serveur SMTP sur le port `1025`.

---

## 3. Configuration des Environnements (.env)

### 3.1 Backend Laravel (`code_source/recrutement/.env`)

Rendez-vous dans le dossier `code_source/recrutement`.
Copiez le fichier exemple :
```bash
cp .env.example .env
```

Vérifiez et adaptez les variables principales dans le fichier `.env` :

```env
APP_NAME="AlpA Ciment Recrutement"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:5173

# Configuration Base de données PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=gestion_recrutement
DB_USERNAME=postgres
DB_PASSWORD=root

# Sessions et Files d'attente
SESSION_DRIVER=database
SESSION_LIFETIME=120
QUEUE_CONNECTION=database
CACHE_STORE=database

# Envoi d'emails (local / test)
MAIL_MAILER=log
MAIL_FROM_ADDRESS="recrutement@alphaciment.local"
MAIL_FROM_NAME="AlpA Ciment RH"

# URL du Microservice OCR Python
OCR_SERVICE_URL=http://127.0.0.1:8001
```

> **Note :** Si vous utilisez un utilisateur ou mot de passe PostgreSQL différent de `postgres`/`root`, adaptez `DB_USERNAME` et `DB_PASSWORD`.

---

### 3.2 Microservice OCR & IA Python (`code_source/ocr`)

Le microservice FastAPI s'exécute avec les paramètres par défaut :
- Hôte API : `127.0.0.1:8001`
- Serveur Ollama ciblé : `http://127.0.0.1:11434`
- Modèle LLM : `qwen2.5:7b` (ou fallback dégradé automatique si Ollama est éteint).
- Moteur OCR : PaddleOCR avec détection de texte français/anglais (les poids PaddleOCR sont mis en cache automatiquement au premier run dans `~/.paddleocr/`).

---

### 3.3 Frontend React (`code_source/recrutement-react`)

Le client HTTP du Frontend est configuré pour communiquer nativement avec l'API Laravel sur `http://127.0.0.1:8000`.
Le serveur de développement Vite tourne sur le port `5173`.

---

## 4. Guide d'Installation & Initialisation Pas à Pas

### Étape 1 : Création de la Base de Données PostgreSQL

Ouvrez un terminal ou **pgAdmin 4**, puis connectez-vous à PostgreSQL pour créer la base :

```sql
-- Via psql en ligne de commande :
psql -U postgres -h 127.0.0.1

-- Commande SQL de création :
CREATE DATABASE gestion_recrutement WITH ENCODING 'UTF8';
\q
```

---

### Étape 2 : Configuration du Backend Laravel

Dans un terminal, placez-vous dans le répertoire du backend :

```bash
cd code_source/recrutement

# 1. Installation des dépendances PHP
composer install

# 2. Génération de la clé secrète de chiffrement
php artisan key:generate

# 3. Création du lien symbolique pour le stockage public des CVs
php artisan storage:link

# 4. Exécution des migrations de base de données et des données initiales (Seeders)
php artisan migrate --seed

# 5. Lancement de la suite de tests pour validation
php artisan test
```

> 💡 **Succès attendu :** Les 36 tests PHPUnit doivent s'exécuter avec le résultat `Tests: 36 passed (182 assertions)`.

---

### Étape 3 : Installation et Démarrage d'Ollama

1. Assurez-vous qu'Ollama est démarré :
   ```bash
   ollama serve
   ```
2. Téléchargez le modèle LLM :
   ```bash
   ollama pull qwen2.5:7b
   ```
3. Testez rapidement le modèle :
   ```bash
   ollama run qwen2.5:7b "Bonjour, es-tu prêt pour l'analyse de CV ?"
   ```
   *(Tapez `/bye` pour quitter le prompt interactif)*.

---

### Étape 4 : Installation du Microservice OCR Python

Ouvrez un autre terminal et placez-vous dans `code_source/ocr` :

```bash
cd code_source/ocr

# 1. Création de l'environnement virtuel Python
python -m venv venv

# 2. Activation de l'environnement virtuel
# Sous Windows (PowerShell) :
.\venv\Scripts\Activate.ps1
# Sous Windows (CMD) :
# .\venv\Scripts\activate.bat
# Sous Linux / macOS :
# source venv/bin/activate

# 3. Installation des dépendances IA & OCR
pip install --upgrade pip
pip install -r requirements.txt

# 4. Test unitaire du parser NLP / Ollama
python test_cv_nlp_parser.py
```

---

### Étape 5 : Installation du Frontend React

Dans un nouveau terminal, placez-vous dans `code_source/recrutement-react` :

```bash
cd code_source/recrutement-react

# 1. Installation des dépendances JavaScript / React
npm install

# 2. Validation du build de production Vite
npm run build
```

> 💡 **Succès attendu :** Vite compile en ~3 secondes sans aucune erreur ni avertissement (`dist/` généré).

---

### Étape 6 (Optionnel) : Démarrage du conteneur n8n

Si vous souhaitez lancer l'orchestrateur de workflows n8n :

```bash
cd automatisation
docker compose up -d
```
L'interface de n8n sera accessible sur `http://localhost:5678`.

---

## 5. Procédure de Démarrage Quotidien (Runbook 4 Terminaux)

Pour faire fonctionner l'ensemble de la plateforme en environnement complet, lancez les services suivants :

### 🟢 Service 0 : Ollama (Serveur LLM Local)
```bash
ollama serve
```
*(Sous Windows, si Ollama est déjà actif dans la barre des tâches en icône de notification, cette étape est déjà prête).*

---

### 🟢 Terminal 1 : Microservice OCR Python (FastAPI + PaddleOCR + Ollama)
```bash
cd code_source/ocr
.\venv\Scripts\activate
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```
*(Prêt lorsque `Uvicorn running on http://127.0.0.1:8001` s'affiche)*

---

### 🟢 Terminal 2 : Backend API Laravel 11
```bash
cd code_source/recrutement
php artisan serve --host 127.0.0.1 --port 8000
```
*(Prêt lorsque `Server running on [http://127.0.0.1:8000]` s'affiche)*

---

### 🟢 Terminal 3 : Frontend React (Vite)
```bash
cd code_source/recrutement-react
npm run dev
```
*(Prêt lorsque `Local: http://127.0.0.1:5173/` s'affiche)*

---

## 6. Comptes & URLs d'Accès

### 🌐 Points d'Accès Web

| Application / Module | URL | Description |
| :--- | :--- | :--- |
| **Back-Office RH (Pilotage & Recrutement)** | [http://127.0.0.1:5173/backoffice/dashboard](http://127.0.0.1:5173/backoffice/dashboard) | Tableau de bord RH, gestion des candidatures, vivier, entretiens |
| **Portail Candidat (Portail Public)** | [http://127.0.0.1:5173/candidat/offres](http://127.0.0.1:5173/candidat/offres) | Consultation des offres d'emploi AlpA Ciment et formulaire de candidature |
| **Swagger OCR FastAPI** | [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs) | Test interactif de l'endpoint `/extract-cv` et `/health` |
| **Serveur LLM Ollama** | [http://127.0.0.1:11434](http://127.0.0.1:11434) | API locale du moteur IA (Mistral / Llama / Qwen) |
| **API Backend Laravel** | [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api) | Point d'entrée RESTful |
| **Interface Automatisation n8n** *(Optionnel)* | [http://localhost:5678](http://localhost:5678) | Gestion des workflows IMAP / Emails |

### 🔑 Identifiants Administrateur RH par Défaut

- **Email** : `admin@alphaciment.local`
- **Mot de passe** : `password`
- **Rôle** : `rh` / `admin`

---

## 7. Dépannage & Erreurs Fréquentes (Troubleshooting FAQ)

### ❓ Serveur Ollama inaccessible ou `fallback_ollama_offline` dans les logs OCR
- **Cause :** Ollama n'est pas démarré sur votre machine ou le port `11434` est bloqué.
- **Solution :** Lancez la commande `ollama serve` dans un terminal ou vérifiez que l'icône Ollama est active dans la barre des tâches. Le service OCR fonctionne quand même en mode dégradé mais sans structuration fine des entités.

### ❓ Erreur `model 'qwen2.5:7b' not found`
- **Cause :** Le modèle n'a pas encore été téléchargé localement.
- **Solution :** Exécutez `ollama pull qwen2.5:7b` (ou le modèle configuré dans `cv_llm_parser.py`).

### ❓ Erreur `could not find driver` ou `Call to undefined function pg_connect()`
- **Cause :** L'extension PostgreSQL n'est pas activée dans votre configuration PHP.
- **Solution :** Ouvrez votre fichier `php.ini` actif (vérifiez son emplacement avec `php --ini`), décommentez `extension=pdo_pgsql` et `extension=pgsql`, puis relancez le terminal.

### ❓ Erreur Python `ImportError: DLL load failed while importing _elementpath` ou `paddle`
- **Cause :** Les bibliothèques C++ Runtime de Microsoft ne sont pas présentes sur Windows.
- **Solution :** Téléchargez et installez [VC++ Redistributable x64](https://aka.ms/vs/17/release/vc_redist.x64.exe), puis redémarrez votre machine.

### ❓ Erreur `SQLSTATE[42P01]: Undefined table`
- **Cause :** Les migrations de la base de données n'ont pas été exécutées.
- **Solution :** Exécutez `php artisan migrate --seed` dans `code_source/recrutement`.

### ❓ Erreur `Vite: Failed to fetch / Network Error`
- **Cause :** Le serveur backend Laravel n'est pas démarré sur le port 8000.
- **Solution :** Assurez-vous d'avoir lancé `php artisan serve --port 8000` dans un terminal dédié.

### ❓ Erreur d'exécution de script PowerShell (`Scripts non autorisés`)
- **Cause :** La politique d'exécution de scripts PowerShell bloque l'activation du `venv` (`Activate.ps1`).
- **Solution :** Ouvrez PowerShell en tant qu'administrateur et exécutez :
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

---

*Document maintenu dans le cadre du projet de fin d'études AlpA Ciment — ITU S6.*
