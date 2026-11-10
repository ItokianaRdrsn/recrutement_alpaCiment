# Chapitre 1 : Présentation du Projet

Ce premier chapitre pose les fondations théoriques, méthodologiques et techniques du projet. Il expose le contexte opérationnel d'Alpha Ciment Madagascar, formalise les objectifs assignés à la plateforme, détaille le calendrier d'exécution selon la méthodologie Agile / Scrum, et justifie de manière comparative l'ensemble des choix technologiques et architecturaux retenus.

---

## 1.1 Contexte et Objectifs du Projet

### 1.1.1 Contexte d'accueil : Alpha Ciment Madagascar

Alpha Ciment Madagascar est une entreprise industrielle majeure dont les activités s'étendent sur plusieurs implantations complémentaires :
* **Le site du Siège Social (Antananarivo - Tsaralalàna)** : Regroupe la Direction Générale, le Département Informatique et la Direction des Ressources Humaines. C’est le centre décisionnel pilotant la stratégie commerciale, financière et organisationnelle.
* **Les complexes industriels d'Usine (Ibity - Antsirabe et Tamatave)** : Environnements de production lourde nécessitant une main-d'œuvre technique pointue (opérateurs de broyage, techniciens de laboratoire de chimie, électromécaniciens haute tension, contremaîtres, conducteurs d'engins, magasiniers).

Cette dualité géographique et organisationnelle impose au service RH de gérer simultanément deux profils de recrutement radicalement distincts : des postes administratifs (forte affluence de candidatures spontanées) et des postes industriels spécialisés (pénurie de compétences locales, nécessitant la sollicitation proactive d'un vivier qualifié et la gestion des dépôts physiques à l'usine).

### 1.1.2 Objectif Principal

> **Concevoir, développer et déployer une plateforme unifiée et collaborative de recrutement et de gestion intelligente du vivier de talents pour Alpha Ciment, intégrant la reconnaissance automatique de documents (OCR/NLP), un moteur de recherche plein texte multicritère ultra-rapide et un suivi digitalisé de l'intégralité du cycle de vie des candidatures.**

### 1.1.3 Objectifs Spécifiques

Pour atteindre cette finalité, le projet se décompose en six objectifs opérationnels :
1. **Centralisation et dédoublonnage multicanal** : Regrouper au sein d'une base de données unique les candidatures spontanées, les réponses aux offres publiées et les dépôts manuels (guichet RH d'usine), tout en détectant automatiquement les candidats récurrents par leur identifiant unique (adresse e-mail).
2. **Automatisation de l'extraction documentaire (OCR & NLP)** : Extraire automatiquement le texte brut et les entités structurées (compétences, intitulés de formation, diplômes, années d'expérience) depuis les CVs (PDF ou images numérisées) pour réduire la saisie manuelle de plus de 80%.
3. **Recherche sémantique et plein texte haute performance** : Offrir aux recruteurs un moteur d'interrogation instantané capable de filtrer simultanément sur les compétences clés, les niveaux d'études, les postes souhaités et le texte intégral des CVs, avec insensibilité totale aux accents et tolérance aux fautes de numérisation.
4. **Gestion collaborative du Vivier de Talents** : Permettre l'archivage qualifié et le repêchage proactif des profils à fort potentiel pour anticiper les futurs besoins d'embauche de l'usine et du siège sans surcoût de republication d'offres.
5. **Fluidification des interactions et traçabilité des échanges** : Gérer les étapes de sélection (tests techniques, entretiens) via un agenda interactif, automatiser l'envoi d'accusés de réception et d'invitations personnalisées grâce à des modèles dynamiques d'e-mails, et journaliser chaque action dans un journal d'audit immuable.
6. **Valorisation de la marque employeur** : Intégrer un studio graphique interactif permettant de composer des affiches d'offres d'emploi prêtes pour l'affichage en usine et la diffusion sur les réseaux professionnels.

---

## 1.2 Planning de Réalisation et Méthodologie Agile / Sprints

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
*Figure 1 : Planning de réalisation global du projet sous forme de diagramme temporel*

### Tableau 8 : Planning récapitulatif des 8 Sprints de développement

| Sprint | Intitulé Fonctionnel & Technique | Estimation | Début Prévu | Fin Prévue | Début Réel | Fin Réelle | Progression | Statut |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Sprint 0** | Analyse du CDC, cadrage, MCD/MLD, règles de gestion | 9,0 j | 12/08/2026 | 24/08/2026 | 12/08/2026 | 24/08/2026 | 100% | **[VALIDÉ]** |
| **Sprint 1** | Socle technique, sécurité Sanctum, rôles RH/Admin, navigation | 6,0 j | 25/08/2026 | 01/09/2026 | 25/08/2026 | 26/08/2026 | 100% | **[VALIDÉ]** |
| **Sprint 2** | Référentiels (Directions, Domaines), Gestion des Offres | 7,0 j | 02/09/2026 | 10/09/2026 | 26/08/2026 | 27/08/2026 | 100% | **[VALIDÉ]** |
| **Sprint 3** | Dépôt candidatures (Portail public, Spontanée, Guichet RH) | 7,5 j | 11/09/2026 | 21/09/2026 | 28/08/2026 | 28/08/2026 | 100% | **[VALIDÉ]** |
| **Sprint 4** | Pipeline RH, Workflow de statuts, Fiche Candidat 360° | 7,0 j | 22/09/2026 | 30/09/2026 | 28/08/2026 | 28/08/2026 | 100% | **[VALIDÉ]** |
| **Sprint 5** | Vivier, Référentiel compétences, Microservice OCR & NLP | 11,5 j | 01/10/2026 | 15/10/2026 | 28/08/2026 | 08/10/2026 | 100% | **[VALIDÉ]** |
| **Sprint 6** | Agenda RDV (FullCalendar), Mailing dynamique, Audit Logs | 12,0 j | 16/10/2026 | 31/10/2026 | 07/10/2026 | 13/10/2026 | 100% | **[VALIDÉ]** |
| **Sprint 7** | Dashboard décisionnel, Recherche plein texte FTS, Affiches | 11,0 j | 03/11/2026 | 17/11/2026 | 13/10/2026 | 17/11/2026 | 100% | **[FINALISÉ]** |
| **TOTAL** | **Ensemble du Cycle de Développement Logiciel** | **71,0 j** | **12/08/2026** | **17/11/2026** | **12/08/2026** | **17/11/2026** | **100%** | **OPÉRATIONNEL** |

La rigueur de cette planification a permis de maintenir une cadence soutenue, libérant le temps d'ingénierie nécessaire pour peaufiner l'optimisation des index PostgreSQL, la résolution des subtilités d'accentuation en plein texte, et l'ergonomie du studio d'affiches.

---

## 1.3 Choix Technologiques et Étude Comparative

Conformément à la démarche d'ingénierie logicielle enseignée à l'IT University, aucun outil n'a été choisi arbitrairement. Chaque brique de l'architecture fait l'objet d'un comparatif méthodique et argumenté.

### 1.3.1 Système de Gestion de Base de Données (PostgreSQL vs MySQL)

La base de données constitue le cœur névralgique du système. Elle doit gérer à la fois des relations d'intégrité strictes (candidats, statuts, entretiens) et des volumes textuels massifs issus de l'extraction OCR des CVs.

### Tableau 1 : Tableau comparatif PostgreSQL et MySQL

| Critères | PostgreSQL (Version 16) | MySQL (Version 8.0) |
| :--- | :--- | :--- |
| **Conformité SQL** | **Très conforme aux standards SQL (respect strict ACID)** | Conformité partielle aux standards SQL |
| **Types de données** | **Large variété (JSONB binaire, tsvector, UUID, Arrays)** | Moins riche et plus limité |
| **Fonctions & Procédures** | **Fonctions stockées puissantes et extensibles (PL/pgSQL)** | Fonctions plus simples |
| **Performances sur les requêtes** | **Très performant même avec des requêtes complexes et jointures lourdes** | Performant principalement sur requêtes simples en lecture |
| **Open-source** | **Totalement libre et ouvert (Licence PostgreSQL)** | Propriétaire sous licence Oracle (double licence) |
| **Sécurité** | **Gestion fine des rôles, droits et politiques de sécurité (RLS)** | Plus basique |
| **Extensibilité** | **Très extensible via extensions natives (`unaccent`, `pg_trgm`, `pgvector`)** | Limitée aux plugins natifs |
| **Décision** | **RETENU ✅** | Écarté ❌ |

> **Justification** : PostgreSQL 16 s'est imposé grâce à sa gestion native de l'indexation plein texte (`tsvector` avec index `GIN`), son support des documents semi-structurés `JSONB` pour stocker les métadonnées d'extraction OCR, et son extension `unaccent` qui permet de rechercher un mot sans accent dans un corpus de texte français tout en renvoyant les correspondances exactes en moins de 5 millisecondes.

---

### 1.3.2 Backend Web (Laravel vs Symfony)

Le backend assure la gestion des règles métier, la sécurisation des accès par tokens, la persistance transactionnelle des données et la mise à disposition d'une API RESTful normalisée.

### Tableau 2 : Tableau comparatif Laravel et Symfony

| Critères | Laravel (Version 11 / PHP 8.2+) | Symfony (Version 7) |
| :--- | :--- | :--- |
| **Prise en main** | **Rapide et intuitive, conventions claires** | Plus complexe, courbe d'apprentissage abrupte |
| **Architecture** | **MVC modulaire, Clean Architecture élégante** | Très rigoureuse mais très verbeuse |
| **Documentation** | **Excellente, claire et accessible (Laracasts, docs officielles)** | Très complète mais plus technique et austère |
| **Développement rapide** | **Excellent pour projets métiers (CLI Artisan, migrations, seeders)** | Plus lent à mettre en place |
| **Maintenance** | **Facile grâce aux conventions de codage standardisées** | Excellente pour très grands systèmes distribués |
| **Sécurité** | **Sécurité intégrée facile à utiliser (Sanctum, CSRF, Eloquent contre SQLi)** | Sécurité très robuste mais configuration complexe |
| **Productivité** | **Grâce aux outils fournis, permet de coder très rapidement** | Un peu lent à cause des multiples étapes de configuration |
| **Décision** | **RETENU ✅** | Écarté ❌ |

> **Justification** : Laravel 11 associé à PHP 8.2+ offre un compromis idéal entre vitesse de développement et robustesse architecturale. Son ORM Eloquent permet d'implémenter le patron *Repository Pattern*, isolant la couche d'accès aux données tout en garantissant des transactions strictes via `DB::transaction()`.

---

### 1.3.3 Frontend Web (React JS vs Vue.js)

Pour offrir aux recruteurs et aux candidats une expérience utilisateur fluide sans rechargement de page, une Single Page Application (SPA) s'est avérée indispensable.

### Tableau 3 : Tableau comparatif React JS et Vue.js

| Critères | React JS (Version 18/19 avec Vite) | Vue.js (Version 3) |
| :--- | :--- | :--- |
| **Écosystème** | **Vaste avec des dizaines de milliers de bibliothèques éprouvées** | Écosystème plus restreint |
| **Flexibilité** | **Très flexible avec choix libre des outils et gestion fine de l'état** | Moins flexible (conventions plus rigides) |
| **Popularité** | **Le plus populaire des frameworks frontend en entreprise** | Moins utilisé dans les grands groupes industriels |
| **Documentation** | **Quantité massive de cours, tutoriels, articles et retours d'expérience** | Moins de ressources spécialisées |
| **Communauté** | **Très grande communauté mondiale active** | Communauté plus réduite |
| **Opportunités d'emploi** | **Très forte demande sur le marché malgache et international** | Demande plus modérée |
| **Déclinaison Mobile** | **React Native permet de créer des applications mobiles avec les mêmes compétences** | Pas d'équivalent direct aussi puissant (Capacitor/Weex) |
| **Décision** | **RETENU ✅** | Écarté ❌ |

> **Justification** : React JS a été retenu pour sa modularité en composants réutilisables, sa rapidité d'exécution propulsée par le serveur de build Vite, et la richesse de ses composants tiers comme FullCalendar pour l'agenda des entretiens et Lucide pour la signalétique visuelle.

---

### 1.3.4 Outil de Conception Graphique et Wireframing (Pencil vs Balsamiq)

Avant la phase de codage, la conception ergonomique des écrans a été réalisée via un outil de maquettage pour valider les flux utilisateurs avec la direction des ressources humaines.

### Tableau 4 : Tableau comparatif Pencil et Balsamiq

| Critères | Pencil (Version 3.1+) | Balsamiq Mockups |
| :--- | :--- | :--- |
| **Interface Utilisateur** | **Offre une interface personnalisable permettant de créer des wireframes variés** | Permet de créer facilement des wireframes simples en glisser-déposer |
| **Fonctionnalités de prototypage** | **Propose des fonctionnalités avancées, export multi-formats (PNG, SVG, PDF)** | Se focalise sur le wireframing simple avec maquettes basiques |
| **Modèle de tarification** | **Gratuit et Open-source, sans aucune licence payante** | Payant après essai gratuit, formules avec abonnements croissants |
| **Fonctionnalités collaboratives** | Fonctionne en local sans dépendance réseau | Offre la collaboration en temps réel sur le cloud (payant) |
| **Décision** | **RETENU ✅** | Écarté ❌ |

> **Justification** : Pencil se distingue par sa gratuité totale, sa légèreté d'exécution et sa capacité à concevoir des écrans structurés hors-ligne, ce qui s'adapte parfaitement aux contraintes de connectivité locales.

---

### 1.3.5 Microservice d'IA et OCR (FastAPI vs Flask)

L'ingestion et l'analyse documentaire des CVs nécessitent un service dédié au calcul algorithmique intensif. Python s'est naturellement imposé comme le langage de référence pour la vision par ordinateur et le NLP.

### Tableau 5 : Tableau comparatif FastAPI et Flask

| Critères | FastAPI (Python 3.11+) | Flask |
| :--- | :--- | :--- |
| **Performance** | **Parmi les frameworks Python les plus rapides (moteur asynchrone ASGI/Starlette)** | Modérée (architecture WSGI synchrone par défaut) |
| **Validation des données** | **Automatique et stricte, basée sur les schémas Pydantic** | Manuelle, nécessite des bibliothèques tierces |
| **Documentation API** | **Auto-générée interactive avec Swagger UI et ReDoc natifs** | Manuelle, requiert des extensions comme Flask-RESTX ou Flasgger |
| **Cas d'usage idéaux** | **APIs REST modernes haute performance, services de Machine Learning** | Prototypes rapides, applications web traditionnelles légères |
| **Scalabilité** | **Excellente gestion de la concurrence asynchrone** | Moyenne |
| **Sécurité des données** | **Validation stricte des types d'entrée à la compilation d'exécution** | Dépend de la rigueur du développeur |
| **Décision** | **RETENU ✅** | Écarté ❌ |

> **Justification** : FastAPI a été sélectionné pour sa rapidité d'exécution asynchrone et sa validation Pydantic native, garantissant que les charges utiles de fichiers de CV soient strictement contrôlées avant d'être transmises au moteur de reconnaissance optique.

---

### 1.3.6 Moteur de Vision Documentaire (PaddleOCR vs Tesseract)

### Tableau 6 : Tableau comparatif PaddleOCR, Tesseract et EasyOCR

| Critères | PaddleOCR (PP-OCRv4) | Tesseract OCR (Google) | EasyOCR (PyTorch) |
| :--- | :--- | :--- | :--- |
| **Algorithme sous-jacent** | **Réseau profond léger (DBNet + SVTR)** | Reconnaissance matricielle et LSTM classique | Convolutionnel + LSTM |
| **Mises en page multi-colonnes** | **Excellente détection des blocs verticaux autonomes** | Échecs fréquents (mélange les colonnes horizontales) | Acceptable mais instable |
| **Détection d'orientation** | **Automatique (`use_angle_cls=True`)** | Requiert un prétraitement externe complexe | Moyenne |
| **Consommation CPU / RAM** | **Faible empreinte mémoire (~300 Mo)** | Faible | Élevée (chargement PyTorch lourd) |
| **Décision** | **RETENU ✅** | Écarté ❌ | Écarté ❌ |

> **Justification** : Les CVs contemporains utilisent presque systématiquement des maquettes à deux colonnes (colonnes de compétences à gauche et expériences à droite). Contrairement à Tesseract qui lit bêtement de gauche à droite sur toute la largeur, PaddleOCR identifie les polygones réels de texte, préservant la cohérence structurelle du document.

---

### 1.3.7 Moteur d'Analyse NLP des CVs (Approche Hybride Souveraine)

### Tableau 7 : Comparatif des approches de parsing RH

| Critères | Regex Pur (Sans IA) | LLM Cloud (GPT-4 / Claude) | Approche Hybride Locale (spaCy + RapidFuzz) |
| :--- | :--- | :--- | :--- |
| **Temps d'exécution** | < 5 ms | > 2 500 ms (latence réseau) | **< 60 ms** |
| **Coût d'exploitation** | Gratuit | Facturé au token (coûteux) | **100% Gratuit et autonome** |
| **Confidentialité RH** | Totale | Risquée (données envoyées hors Madagascar) | **Totale (données restant sur le serveur Alpha Ciment)** |
| **Robustesse aux fautes OCR** | Nulle (échoue si syntaxe varie) | Excellente | **Très bonne grâce à la distance de Levenshtein** |
| **Décision** | Écarté ❌ | Écarté ❌ | **RETENU ✅** |

---

## 1.4 Architecture Globale du Système Multi-Tiers

La plateforme est structurée selon une **architecture multi-tiers découplée** composée de trois niveaux autonomes : la couche de présentation (Frontend SPA), la couche d'application et de logique métier (Backend Laravel), et la couche de persistance et services spécialisés (PostgreSQL et microservice FastAPI).

```
                                ARCHITECTURE SYSTÈME GLOBALE
 
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      COUCHE CLIENT (FRONTEND SPA)                      │
 │                 React 18/19  •  Vite  •  CSS Alpha Ciment              │
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
 │  • Extraction de CV         │             │  • Full-Text Search (GIN)   │
 └─────────────────────────────┘             └─────────────────────────────┘
```
*Figure 2 : Architecture globale multi-tiers du système*

### Le Patron d'Architecture Backend en 5 Couches

Pour garantir une maintenabilité irréprochable et faciliter les tests de non-régression, le backend applique strictement une séparation en cinq niveaux :
1. **FormRequests** : Valident la structure des requêtes HTTP entrantes avant d'accéder au contrôleur.
2. **Thin Controllers** : Se limitent à orchestrer les entrées et délèguent immédiatement le travail aux services.
3. **Services Métiers** : Contiennent l'intégralité des règles de gestion, vérifications d'intégrité et transactions (`DB::transaction`).
4. **Repositories** : Isole la persistance et optimise les requêtes PostgreSQL spécifiques.
5. **API Resources (DTOs)** : Normalisent les réponses JSON renvoyées au client React.
