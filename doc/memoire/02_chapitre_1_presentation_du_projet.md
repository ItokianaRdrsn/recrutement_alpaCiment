# Chapitre 1 : Présentation du Projet

Ce premier chapitre pose les fondations théoriques, méthodologiques et techniques du projet. Il expose le contexte opérationnel d'AlpA Ciment, définit les objectifs assignés à la plateforme, détaille le calendrier d'exécution selon la méthodologie Agile, et justifie de manière comparative l'ensemble des choix technologiques et architecturaux retenus.

---

## 1.1 Contexte et Objectifs du Projet

### 1.1.1 Contexte d'accueil : AlpA Ciment Madagascar
AlpA Ciment Madagascar est une entreprise industrielle opérant sur deux sites d'activité complémentaires :
* **Le site d'Usine / Carrière** : Environnement de production lourde nécessitant une main-d'œuvre technique pointue (opérateurs de broyage, techniciens chimistes, mécaniciens industriels, électriciens haute tension, magasiniers pièces de rechange).
* **Le siège administratif et commercial** : Environnement tertiaire regroupant les fonctions supports (direction des ressources humaines, comptabilité et finances, achats, logistique et commerciale).

Cette dualité géographique et organisationnelle impose au service RH de gérer simultanément deux profils de recrutement radicalement distincts : des postes administratifs (forte affluence de candidatures spontanées) et des postes industriels spécialisés (pénurie de compétences locales, nécessitant la sollicitation proactive d'un vivier qualifié).

### 1.1.2 Objectif Principal
> **Concevoir, développer et déployer une plateforme unifiée et collaborative de gestion du recrutement et du vivier de talents pour AlpA Ciment, intégrant la reconnaissance automatique de documents (OCR/NLP), un moteur de recherche multicritère ultra-rapide et un suivi digitalisé de l'intégralité du cycle de vie des candidatures.**

### 1.1.3 Objectifs Secondaires
Pour atteindre cette finalité, le projet se décompose en six objectifs opérationnels :
1. **Centralisation et dédoublonnage multicanal** : Regrouper au sein d'une base de données unique les candidatures spontanées, les réponses aux offres publiées et les dépôts manuels (guichet RH), tout en détectant automatiquement les candidats récurrents par leur identifiant unique (adresse e-mail).
2. **Automatisation de l'extraction documentaire (OCR & NLP)** : Extraire automatiquement le texte brut et les entités structurées (compétences, intitulés de formation, diplômes, années d'expérience) depuis les CVs (PDF ou images numérisées) pour réduire la saisie manuelle de 80%.
3. **Recherche sémantique et plein texte haute performance** : Offrir aux recruteurs un moteur d'interrogation instantané capable de filtrer simultanément sur les compétences clés, les niveaux d'études, les postes souhaités et le texte brut des CVs, avec insensibilité totale aux accents et tolérance aux fautes d'orthographe.
4. **Gestion collaborative du Vivier de Talents** : Permettre l'archivage qualifié et le repêchage proactif des profils à fort potentiel pour anticiper les futurs besoins d'embauche de l'usine et du siège.
5. **Fluidification des interactions et traçabilité des échanges** : Gérer les étapes de sélection (tests techniques, entretiens) via un agenda interactif, automatiser l'envoi d'accusés de réception et d'invitations personnalisées grâce à des modèles dynamiques d'e-mails, et journaliser chaque action dans un journal d'audit immuable.
6. **Valorisation de la marque employeur** : Intégrer un studio graphique interactif permettant de composer des affiches d'offres d'emploi prêtes pour l'affichage en usine et la diffusion sur les réseaux professionnels.

---

## 1.2 Planning de Réalisation et Méthodologie

Le projet a été conduit selon une méthodologie **Agile / Scrum adaptée**, rythmée par **8 Sprints itératifs et incrémentaux** (Sprint 0 à Sprint 7) s'étalant sur une durée globale calibrée à **71,0 jours ouvrés** (du 12 Août 2026 au 17 Novembre 2026).

```
                      CALENDRIER GÉNÉRAL DU PROJET (71 JOURS OUVRÉS)
 12 Août 2026                                                                    17 Nov 2026
┌─────────┬─────────┬─────────┬─────────┬─────────┬──────────┬──────────┬──────────┐
│Sprint 0 │Sprint 1 │Sprint 2 │Sprint 3 │Sprint 4 │ Sprint 5 │ Sprint 6 │ Sprint 7 │
│Cadrage  │Socle/Sec│ Offres  │ Dépôt   │Pipeline │Vivier/OCR│RDV/Mails │Dashboard │
│  (9 j)  │  (6 j)  │  (7 j)  │ (7,5 j) │  (7 j)  │ (11,5 j) │  (12 j)  │  (11 j)  │
└─────────┴─────────┴─────────┴─────────┴─────────┴──────────┴──────────┴──────────┘
```

### 1.2.1 Tableau de Bord Récapitulatif des Sprints

| Sprint | Intitulé Fonctionnel & Technique | Estimation | Début Prévu | Fin Prévue | Début Réel | Fin Réelle | Progression | Statut |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Sprint 0** | Analyse du CDC, cadrage, MCD/MLD, règles de gestion | 9,0 j | 12/08/2026 | 24/08/2026 | 12/08/2026 | 24/08/2026 | 100% | **[VALIDÉ]** |
| **Sprint 1** | Socle technique, sécurité, rôles RH/Admin, navigation | 6,0 j | 25/08/2026 | 01/09/2026 | 25/08/2026 | 26/08/2026 | 100% | **[VALIDÉ]** |
| **Sprint 2** | Référentiels (Directions, Domaines), Gestion des Offres | 7,0 j | 02/09/2026 | 10/09/2026 | 26/08/2026 | 27/08/2026 | 100% | **[VALIDÉ]** |
| **Sprint 3** | Dépôt candidatures (Portail public, Spontanée, Saisie RH) | 7,5 j | 11/09/2026 | 21/09/2026 | 28/08/2026 | 28/08/2026 | 100% | **[VALIDÉ]** |
| **Sprint 4** | Pipeline RH, Workflow de statuts, Fiche Candidat 360° | 7,0 j | 22/09/2026 | 30/09/2026 | 28/08/2026 | 28/08/2026 | 100% | **[VALIDÉ]** |
| **Sprint 5** | Vivier, Référentiel compétences, Microservice OCR & NLP | 11,5 j | 01/10/2026 | 15/10/2026 | 28/08/2026 | 08/10/2026 | 100% | **[VALIDÉ]** |
| **Sprint 6** | Agenda RDV (FullCalendar), Mailing dynamique, Audit Logs | 12,0 j | 16/10/2026 | 31/10/2026 | 07/10/2026 | 13/10/2026 | 100% | **[VALIDÉ]** |
| **Sprint 7** | Dashboard décisionnel, Recherche plein texte FTS, Affiches | 11,0 j | 03/11/2026 | 17/11/2026 | 13/10/2026 | En cours | 95% | **[FINALISÉ]** |
| **TOTAL** | **Ensemble du Cycle de Développement Logiciel** | **71,0 j** | **12/08/2026** | **17/11/2026** | **12/08/2026** | **En cours** | **98%** | **OPÉRATIONNEL** |

La rigueur de cette planification a permis une avance substantielle sur les sprints intermédiaires, libérant du temps d'ingénierie pour peaufiner l'optimisation des index PostgreSQL, la résolution des subtilités d'accentuation en plein texte, et l'ergonomie du studio d'affiches.

---

## 1.3 Choix Technologiques et Étude Comparative

Conformément à la démarche d'ingénierie logicielle enseignée à l'IT University, aucun outil n'a été choisi par simple habitude. Chaque composant de l'architecture fait l'objet d'un Registre de Décision d'Architecture (ADR - *Architecture Decision Record*) analysant les bénéfices, les limites et les alternatives concurrentes.

### 1.3.1 Écosystème Backend Web : Laravel 11 (PHP 8.2+)

Le backend assure la gestion des règles métier, la sécurisation des accès, la persistance transactionnelle des données et la mise à disposition d'une API RESTful normalisée.

| Critère | Laravel 11 (PHP 8.2+) | Spring Boot (Java 17+) | NestJS / Express (Node.js) |
| :--- | :--- | :--- | :--- |
| **Architecture** | MVC / Clean Architecture modulaire | Monolithique / Microservices | Modulaire inspiré d'Angular |
| **ORM / Accès Données** | **Eloquent ORM** (Relations fluides, Query Builder, Transactions) | Hibernate / JPA (Verbeux, mapping d'entités lourd) | TypeORM / Prisma (Moins mature sur les relations pivots complexes) |
| **Sécurité Native** | Authentification Sanctum, CSRF, FormRequests, Policies | Spring Security (Très puissant mais configuration austère) | Dépendances externes multiples (Passport, Helmet) |
| **Vélocité de Dév.** | **Très élevée** (CLI Artisan, migrations, seeders) | Moyenne (Temps de compilation et verbeux) | Élevée |
| **Consommation RAM** | Faible à modérée | Élevée (Machine Virtuelle Java JVM) | Faible (Boucle d'événements) |
| **Décision** | **RETENU ✅** | Écarté (Complexité inutile sur le calendrier) | Écarté (Moins adapté aux transactions relationnelles strictes) |

> **Justification** : Laravel 11 associé à PHP 8.2 offre une productivité maximale. Son ORM Eloquent permet de manipuler avec une clarté absolue le schéma relationnel complexe du recrutement (pivots candidats-compétences, offres-profils, historiques de statut), tout en garantissant des transactions financières et RH strictes via `DB::transaction`.

---

### 1.3.2 Système de Gestion de Base de Données : PostgreSQL 16

La base de données constitue le cœur névralgique de la plateforme, devant gérer à la fois des entités relationnelles classiques et des documents textuels massifs issus de l'OCR.

| Critère | PostgreSQL 16 | MySQL 8.0 / MariaDB | MongoDB (NoSQL) |
| :--- | :--- | :--- | :--- |
| **Modèle** | Relationnel Objet Avancé | Relationnel classique | Orienté Document JSON |
| **Recherche Plein Texte** | **Natif (`tsvector`, `tsquery`, dictionnaires, `unaccent`)** | FTS basique, moins flexible sur les déclinaisons françaises | Recherche textuelle basique |
| **Support JSON** | **JSONB binaire natif + Index GIN ultra-rapides** | Type JSON basique (sans indexation inversée globale) | Format natif BSON |
| **Intégrité Référentielle** | Respect strict SQL/ACID, Contraintes `CHECK`, cascades | Support ACID standard | Pas d'intégrité relationnelle native (gestion code) |
| **Extensions Avancées** | `unaccent`, `pg_trgm` (trigrammes flous), `uuid-ossp` | Limitées | Plug-ins externes |
| **Décision** | **RETENU ✅** | Écarté (Faiblesse sur le plein texte et JSONB) | Écarté (Inadapté aux règles RH relationnelles) |

> **Justification** : PostgreSQL 16 est incontournable. Il permet de stocker les résultats bruts et structurés de l'OCR dans une colonne `JSONB`, tout en maintenant une colonne vectorielle `tsvector` indexée par un index inversé généralisé (`GIN`). Cela permet d'effectuer des recherches de mots-clés dans des milliers de pages de CV en moins de 5 millisecondes.

---

### 1.3.3 Microservice d'IA et OCR : FastAPI (Python 3.10+) & PaddleOCR

L'analyse de documents non structurés (CVs au format PDF, scans ou photos de dossiers papier) exige des algorithmes de vision par ordinateur et de traitement automatique du langage naturel (NLP).

#### A. Choix du Framework Microservice : FastAPI vs Alternatives
* **FastAPI (Retenu ✅)** : Développé en Python, le langage standard de l'intelligence artificielle. Il propose un serveur asynchrone (ASGI via Uvicorn), une validation stricte des données d'entrée par schémas Pydantic, et la génération automatique d'une documentation interactive Swagger/OpenAPI (`/docs`).
* **Flask (Écarté ❌)** : Minimaliste mais synchrone par défaut (WSGI plus lent) et dépourvu de validation de typage native.
* **Django REST Framework (Écarté ❌)** : Inutilement lourd et surdimensionné pour un microservice dédié au calcul documentaire.

#### B. Choix du Moteur de Vision (OCR) : PaddleOCR vs Alternatives

| Critère | PaddleOCR (PP-OCRv4) | Tesseract OCR (Google) | EasyOCR (PyTorch) |
| :--- | :--- | :--- | :--- |
| **Algorithme** | Deep Learning léger (DBNet + SVTR) | Reconnaissance par matrices et LSTM | Convolutional + LSTM |
| **Mises en page multi-colonnes** | **Excellente détection des blocs verticaux** | Échecs fréquents (mélange les lignes en vis-à-vis) | Correcte mais instable |
| **Détection d'orientation** | **Automatique (`use_angle_cls=True`)** | Nécessite un script externe de prétraitement | Moyenne |
| **Temps d'inférence CPU** | **Rapide (~0.8s à 1.5s par page)** | Rapide mais bruit important | Plus lourd en mémoire |
| **Décision** | **RETENU ✅** | Écarté (Mauvaise précision sur les CVs modernes) | Écarté (Consommation VRAM excessive) |

> **Justification** : Les CVs modernes utilisent massivement des mises en page en 2 ou 3 colonnes (ex. barre latérale gauche pour les compétences et colonne droite pour les expériences). Alors que Tesseract lit de gauche à droite horizontalement en fusionnant les textes des deux colonnes, **PaddleOCR** isole chaque zone de texte comme un bloc logique indépendant avec ses coordonnées exactes $(x, y, w, h)$.

---

### 1.3.4 Moteur d'Analyse NLP des CVs : Approche Hybride Souveraine

Pour transformer le texte extrait par l'OCR en données exploitables par la base de données (séparer les formations, les expériences et les compétences), trois stratégies ont été confrontées :

```
             COMPARAISON DES STRATÉGIES DE PARSING DE DOCUMENTS RH
┌────────────────────────────┬────────────────────────────┬────────────────────────────┐
│   APPROCHE 1 : REGEX PUR   │ APPROCHE 2 : LLM CLOUD     │ APPROCHE 3 : HYBRIDE LOCAL │
│       (Sans IA/NLP)        │   (OpenAI GPT-4 / Claude)  │ (spaCy + RapidFuzz + Fast) │
├────────────────────────────┼────────────────────────────┼────────────────────────────┤
│ • Très rapide (<5ms)       │ • Très bonne compréhension │ • Ultra-rapide (<50ms)     │
│ • Zéro coût                │ • Coûteux (facturé au token│ • 100% Souverain & RGPD    │
│ ❌ Échoue dès qu'un mot ou │ ❌ Latence réseau (>2s)    │ • Tolérant aux fautes OCR  │
│   une mise en page varie   │ ❌ Violation confidentialité│ • Zéro coût d'infrastructure│
│ (Inadapté aux CV réels)    │    (Données envoyées USA)  │    (Modèle retenu ✅)      │
└────────────────────────────┴────────────────────────────┴────────────────────────────┘
```

> **Solution Retenue** : L'approche hybride combine :
> 1. Une **segmentation heuristique par sections** (détection des en-têtes *Profil*, *Compétences*, *Expériences*, *Formations*).
> 2. Le modèle NLP français **spaCy (`fr_core_news_md`)** pour la reconnaissance d'entités nommées (NER) : noms d'organisations, de villes et de personnes.
> 3. L'algorithme **RapidFuzz** (calcul de distance de Levenshtein optimisé en C++) qui compare le texte extrait au référentiel des compétences de l'entreprise, tolérant ainsi les coquilles de numérisation (ex: *"Pyhton"* ou *"Javascript"* immédiatement rattachés à *Python* ou *JavaScript*).
> 4. Un principe strict de **validation humaine (*Human-in-the-Loop*)** : aucune donnée extraite automatiquement n'est enregistrée comme définitive sans confirmation visuelle d'un recruteur RH.

---

### 1.3.5 Framework Frontend SPA : React.js 18+ & Vite

| Critère | React 18+ (avec Vite) | Livewire (Laravel Blade) | Angular 17+ |
| :--- | :--- | :--- | :--- |
| **Paradigme** | SPA Découplée (Client lourd dynamique) | Hybride fullstack PHP côté serveur | Framework d'entreprise monolithique |
| **Vitesse de Build** | **Ultra-rapide avec Vite (<1.5s)** | N/A (Compilation Blade PHP) | Lente (Compilateur `ngc`) |
| **Expérience Utilisateur** | **Instantanée, zapping sans rechargement** | Latence réseau sur chaque interaction AJAX | Fluide |
| **Composants Riches** | Écosystème immense (FullCalendar, Lucide, Canvas) | Composants limités, dépendance Alpine.js | Écosystème structuré mais rigide |
| **Séparation des Rôles** | Contrat d'interface strict via API JSON | Couplage fort Frontend / Backend | Découplé |
| **Décision** | **RETENU ✅** | Écarté (Moins fluide pour les drag-and-drop) | Écarté (Verbosité excessive) |

---

## 1.4 Architecture Globale du Système

La plateforme adopte une **architecture 3-tiers moderne et découplée**, garantissant la maintenabilité, l'évolutivité et la séparation claire des responsabilités.

```
                               ARCHITECTURE SYSTÈME GLOBALE
 
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      COUCHE CLIENT (FRONTEND SPA)                      │
 │                 React 18  •  Vite  •  Tailwind CSS                     │
 │  [Portail Candidat]   [Back-Office RH]   [Agenda RDV]   [Studio Affiche]│
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ Requêtes REST (JSON / HTTPS)
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                    COUCHE MÉTIER & API (BACKEND)                       │
 │                             Laravel 11                                 │
 │  ┌──────────────────────────────────────────────────────────────────┐  │
 │  │      Architecture 5 Couches (Clean Architecture / SoC)           │  │
 │  │  FormRequests ➔ Thin Controllers ➔ Services ➔ Repositories ➔ Res │  │
 │  └──────────────────┬───────────────────────────────┬───────────────┘  │
 └─────────────────────┼───────────────────────────────┼──────────────────┘
                       │ HTTP Asynchrone               │ Eloquent ORM
                       ▼                               ▼
 ┌─────────────────────────────┐             ┌─────────────────────────────┐
 │    MICROSERVICE IA / OCR    │             │ COUCHE PERSISTANCE & RECH.  │
 │      FastAPI (Python)       │             │        PostgreSQL 16        │
 │  • PaddleOCR (Vision)       │             │  • Tables relationnelles    │
 │  • spaCy / RapidFuzz (NLP)  │             │  • Données JSONB            │
 │  • Validation de CV         │             │  • Full-Text Search (GIN)   │
 └─────────────────────────────┘             └─────────────────────────────┘
```

### Le Patron d'Architecture Backend en 5 Couches
Pour éviter l'écueil classique du *Fat Controller* (où le contrôleur mélange validation, logique métier, requêtes SQL et rendu), le backend applique strictement une séparation en cinq strates :
1. **FormRequest** : Valide rigoureusement le format et la conformité des données HTTP en entrée avant toute exécution.
2. **Thin Controller (Contrôleur Mince)** : Rôle exclusif d'aiguillage entre la requête HTTP et la couche applicative.
3. **Service Métier** : Centralise 100% des règles de gestion, le contrôle des statuts, les transactions `DB::transaction` et l'orchestration des envois d'e-mails.
4. **Repository Pattern** : Encapsule l'accès aux données PostgreSQL (`EloquentCandidatureRepository`, `EloquentOffreRepository`, etc.), isolant les requêtes complexes pour faciliter les tests et la maintenance.
5. **Eloquent Resource (API Resource)** : Transforme les entités du domaine en réponses JSON immuables et normalisées pour l'application React.
