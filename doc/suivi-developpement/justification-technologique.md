# Register d'Architecture & Justification Technologique (ADR)

Ce document répertorie l'ensemble des choix technologiques, frameworks, bases de données, librairies et algorithmes retenus pour la plateforme de recrutement *recrutement_alpaCiment*. 

Pour chaque choix, il présente les **motifs de sélection**, les **alternatives comparées avec leurs Pour/Contre**, et les **sources & documentations de référence**.

---

## 🏛️ 1. Écosystème Backend Web : Laravel (PHP 8.2+)

### 📌 Pourquoi Laravel ?
- **Productivité & Vélocité** : Syntaxe expressive, écosystème ultra-complet out-of-the-box (Eloquent ORM, validation, authentification session/Sanctum, routage REST, Blade).
- **Eloquent ORM** : Gestion d'une fluidité inégalée des relations complexes (`BelongsTo`, `HasMany`, `BelongsToMany` avec pivot et attributs personnalisés).
- **Architecture Modulaire** : Facilité d'interconnexion via HTTP Client (`Illuminate\Support\Facades\Http`) avec des microservices externes (FastAPI).

### ⚖️ Comparatif & Alternatives Évaluées

| Framework / Techno | Avantages (Pour) | Inconvénients (Contre) | Décision |
| --- | --- | --- | --- |
| **Laravel (PHP 8.2+)** | • Vélocité de développement maximale<br>• ORM Eloquent très puissant<br>• Authentication Session & Blade natives out-of-the-box | • Consommation mémoire plus élevée que Golang sous très forte charge | **Retenu ✅** |
| **Spring Boot (Java 17+)** | • Excellentes performances de pointe<br>• Robustesse de l'écosystème Java entreprise | • Verbosité extrême du code (boilerplate)<br>• Démarrage/compilation lourds (JVM)<br>• Ralentissement de la vélocité sur les sprints courts | **Écarté ❌** |
| **NestJS / Express (Node.js)** | • Unification du langage JS/TS avec le Frontend<br>• Modèle d'I/O non bloquant | • Moins de conventions strictes de structure<br>• TypeORM/Prisma moins intégrés qu'Eloquent pour les pivots et relations complexes | **Écarté ❌** |

### 🌐 Standard de Routage API RESTful (Singulier vs Pluriel)
- **Règle de Collection (Pluriel)** : `/offres`, `/candidatures`, `/directions`, `/domaines`, `/competences` désignent les ensembles et collections de ressources.
- **Règle d'Entité Unique (Singulier)** : `/offre/{id}`, `/candidature/{id}`, `/direction/{id}`, `/domaine/{id}`, `/competence/{id}` désignent une ressource spécifique et unique accédée par son identifiant `{id}`.

### 📚 Sources & Documentations
- [Documentation Officielle Laravel 11.x](https://laravel.com/docs)
- [Benchmark & Comparison Laravel vs Spring Boot (Medium / JetBrains)](https://blog.jetbrains.com/idea/)
- [Laravel Eloquent ORM Guide](https://laravel.com/docs/eloquent)
- [RESTful API Design Best Practices (Mozilla / Microsoft Azure API Guidelines)](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)

---

## 🗄️ 2. Système de Gestion de Base de Données : PostgreSQL 15+

### 📌 Pourquoi PostgreSQL ?
- **Indexation & Manipulation JSONB Native** : Indispensable pour stocker les résultats complexes d'extraction OCR (`donnees_json` dans `cv_extraction_ocr`).
- **Recherche Plein Texte (Full-Text Search)** : Prise en charge native de `tsvector` / `tsquery` avec dictionnaire français pour la recherche rapide dans le texte brut des CVs.
- **Contraintes d'Intégrité Avancées** : Support complet des `CHECK constraints`, requêtes récursives (CTE) et clés étrangères cascades.

### ⚖️ Comparatif & Alternatives Évaluées

| SGBD | Avantages (Pour) | Inconvénients (Contre) | Décision |
| --- | --- | --- | --- |
| **PostgreSQL 15+** | • Gestion JSONB et index GIN ultra-performants<br>• Full-Text Search natif en français (`tsvector`)<br>• Respect strict de la norme SQL & ACID | • Légèrement plus gourmand en configuration initiale que SQLite | **Retenu ✅** |
| **MySQL 8.0 / MariaDB** | • Très répandu et simple d'accès | • Manipulation JSON et indexation texte brut nettement moins évoluées que Postgres<br>• Pas d'index GIN sur le JSON | **Écarté ❌** |
| **MongoDB (NoSQL)** | • Flexibilité des schémas JSON | • Absence de garanties relationnelles ACID fortes pour les candidatures, offres et directions<br>• Jointures complexes inefficaces | **Écarté ❌** |

### 📚 Sources & Documentations
- [Documentation Officielle PostgreSQL 15](https://www.postgresql.org/docs/15/index.html)
- [PostgreSQL Full-Text Search vs MySQL FTS](https://www.postgresql.org/docs/current/textsearch.html)
- [PostgreSQL JSON Types and Functions](https://www.postgresql.org/docs/current/datatype-json.html)

---

## ⚡ 3. Microservice d'IA & OCR : FastAPI (Python 3.10+)

### 📌 Pourquoi FastAPI ?
- **Intégration Native de l'Écosystème IA Python** : Python est le langage de référence pour les bibliothèques d'OCR (PaddleOCR) et de NLP (spaCy, Transformers).
- **Hautes Performances Asynchrones** : Basé sur Starlette et Pydantic, avec une vitesse d'exécution proche de Node.js et Go.
- **Documentation OpenAPI / Swagger Générée Automatiquement** : Accès direct à l'interface interactive `/docs`.

### ⚖️ Comparatif & Alternatives Évaluées

| Framework Microservice | Avantages (Pour) | Inconvénients (Contre) | Décision |
| --- | --- | --- | --- |
| **FastAPI (Python)** | • Validation de type Pydantic native<br>• Rapidité d'exécution asynchrone (ASGI)<br>• Swagger UI automatique | • Nécessite d'exécuter un serveur Uvicorn séparé (Port 8001) | **Retenu ✅** |
| **Flask (Python)** | • Ultra léger et minimaliste | • Pas de validation de types automatique<br>• Synchronie par défaut (WSGI plus lent) | **Écarté ❌** |
| **Django REST Framework** | • Écosystème très complet | • Trop lourd, monolithique et inutilement complexe pour un microservice OCR | **Écarté ❌** |

### 📚 Sources & Documentations
- [Documentation Officielle FastAPI](https://fastapi.tiangolo.com/)
- [Uvicorn ASGI Server](https://www.uvicorn.org/)

---

## 👁️ 4. Moteur de Reconnaissance Optique de Caractères : PaddleOCR

### 📌 Pourquoi PaddleOCR ?
- **Précision Exceptionnelle sur le Français & les CV Multi-Colonnes** : Détection des blocs de texte orientés (`use_angle_cls=True`) et reconnaissance précise des mises en page complexes (layout multi-colonnes des CVs modernes).
- **Algorithmes Récents (PP-OCRv4)** : Modèles de deep learning ultra-légers et optimisés pour le CPU sans nécessiter obligatoirement un GPU CUDA.

### ⚖️ Comparatif & Alternatives Évaluées

| Moteur OCR | Avantages (Pour) | Inconvénients (Contre) | Décision |
| --- | --- | --- | --- |
| **PaddleOCR (PaddlePaddle)** | • Précision sur les mises en page multi-colonnes<br>• Modèles légers pré-entraînés pour le français<br>• Détection automatique de la rotation du texte | • Dépendance au framework PaddlePaddle (~300 Mo) | **Retenu ✅** |
| **Tesseract OCR (Google)** | • Open-source historique très connu | • Échecs fréquents sur les CVs modernes à colonnes multiples<br>• Nécessite un prétraitement complexe (ImageMagick/OpenCV) | **Écarté ❌** |
| **EasyOCR (PyTorch)** | • Bon support multilingue avec PyTorch | • Plus lent en temps d'inférence CPU par rapport à PaddleOCR PP-OCRv4 | **Écarté ❌** |

### 📚 Sources & Documentations
- [Dépôt GitHub Officiel PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
- [PaddleOCR French Language Model Guide](https://github.com/PaddlePaddle/PaddleOCR/blob/main/doc/doc_en/multi_languages_en.md)
- [Tesseract OCR vs PaddleOCR Benchmark](https://arxiv.org/abs/2109.03144)

---

## 🧠 5. Moteur de Parsing NLP des CVs : Approche Hybride Heuristique + spaCy (CamemBERT)

### 📌 Pourquoi l'Approche Hybride (`spaCy` + `rapidfuzz` + `dateparser` + Regex) ?
- **Segmentation Heuristique & Découpage de Section** : Découpage intelligent par analyse des en-têtes (Profil, Compétences, Expériences, Formations, Langues).
- **spaCy (`fr_core_news_md`)** : Reconnaissance d'Entités Nommées (NER - Named Entity Recognition) pour extraire avec précision les noms de personnes (`PER`) et les entreprises/organisations (`ORG`).
- **rapidfuzz** : Matching flou par calcul de distance Levenshtein / ratio partiel, permettant de tolérer les coquilles ou erreurs mineures d'OCR dans la reconnaissance des compétences du référentiel.
- **dateparser & Regex Temporal** : Parsing polyvalent des plages de dates francophones (ex: "Janvier 2023 - Aujourd'hui", "2021-2022") converties automatiquement au format ISO `YYYY-MM-DD`.

### ⚖️ Comparatif & Alternatives Évaluées

| Outil NLP / Approche | Avantages (Pour) | Inconvénients (Contre) | Décision |
| --- | --- | --- | --- |
| **Hybride spaCy + rapidfuzz + dateparser** | • Exécution ultra-rapide (<50ms)<br>• 100% Hors-ligne & Respect du RGPD<br>• Tolérance aux fautes d'OCR (rapidfuzz)<br>• Scores de confiance probabilistes | • Exige le téléchargement du modèle linguistique spaCy (`fr_core_news_md`) | **Retenu ✅** |
| **Parsing Regex Pur (Sans NLP)** | • Aucune dépendance externe requise | • Très rigide : échecs fréquents sur les variantes de libellés et fautes d'OCR<br>• Incapable d'isoler dynamiquement les noms d'entreprises inconnues | **Mode Fallback Uniquement 🔄** |
| **LLMs Cloud (OpenAI GPT-4 / Claude)** | • Compréhension sémantique quasi-parfaite | • Coût financier récurrent par appel API<br>• Latence réseau élevée (>2s)<br>• Risques de fuite de données personnelles | **Écarté ❌** |

### 📚 Sources & Documentations
- [Documentation Officielle spaCy French Models](https://spacy.io/models/fr#fr_core_news_md)
- [Documentation RapidFuzz (C++ accelerated fuzzy matching)](https://github.com/rapidfuzz/RapidFuzz)
- [Documentation dateparser Python Library](https://dateparser.readthedocs.io/)

---

## ⚛️ 6. Framework Frontend SPA : React.js 18+ (Vite)

### 📌 Pourquoi React avec Vite ?
- **Vitesse de Compilation Vite** : Démarrage du serveur dev en instantané et temps de build de production **< 1 seconde** (977ms).
- **Écosystème Déclaratif SPA** : Utilisation de `react-router-dom` v7 pour une navigation fluide sans rechargement de page.

### ⚖️ Comparatif & Alternatives Évaluées

| Framework Frontend | Avantages (Pour) | Inconvénients (Contre) | Décision |
| --- | --- | --- | --- |
| **React.js + Vite** | • Bundle léger (~200 Ko gzippé)<br>• Large communauté de composants UI<br>• Build Vite ultra-rapide (<1s) | • Nécessite la gestion manuelle du state global | **Retenu ✅** |
| **Angular** | • Framework très structuré out-of-the-box | • Lourd, verbeux et courbe d'apprentissage élevée | **Écarté ❌** |
| **Vue.js 3** | • Syntaxe très propre et réactive | • Moins de librairies tierces spécialisées | **Alternative Évolutive** |

### 📚 Sources & Documentations
- [Documentation Officielle Vite](https://vite.dev/)
- [Documentation Officielle React.js](https://react.dev/)
