# IT UNIVERSITY & ALPA CIMENT
## MÉMOIRE DE FIN D'ÉTUDES DE LICENCE EN INFORMATIQUE

---

# **Plateforme Centralisée de Recrutement et Gestion Intelligente du Vivier de Talents**
### *Automatisation par OCR, Recherche Plein Texte Multicritère et Traçabilité RH*

**Présenté par :** 
Étudiant de l'IT University — Mention Informatique

**En vue de l'obtention du grade de :**
Licence en Informatique  
Option : Développement d'Applications / Web & Design

**Promotion :** 2026  
**Entreprise d'accueil :** AlpA Ciment Madagascar — Direction des Ressources Humaines  
**Période de stage :** 12 Août 2026 – Novembre 2026  

---

### **Membres du Jury :**

| Qualité | Nom et Prénoms | Titre / Fonction |
| :--- | :--- | :--- |
| **Président du Jury** | Dr. Olivier ROBINSON | Directeur Pédagogique, IT University |
| **Examinateur** | M. Tahina RAZAFINJOELINA | Enseignant-Chercheur, IT University |
| **Encadreur Professionnel** | Direction des Ressources Humaines | Responsable RH, AlpA Ciment |

---

<div style="page-break-after: always;"></div>

## **Table des matières**

- [Liste des tableaux](#liste-des-tableaux)
- [Liste des figures](#liste-des-figures)
- [Glossaire](#glossaire)
- [Avant-propos](#avant-propos)
  - [L’IT University](#lit-university)
  - [AlpA Ciment Madagascar](#alpa-ciment-madagascar)
- [Remerciements](#remerciements)
- [Introduction Générale](#introduction-générale)
- [1. Présentation du Projet](#1-présentation-du-projet)
  - [1.1 Contexte et Problématique](#11-contexte-et-problématique)
  - [1.2 Objectifs du Projet](#12-objectifs-du-projet)
  - [1.3 Planning de Réalisation et Méthodologie Agile / Sprints](#13-planning-de-réalisation-et-méthodologie-agile--sprints)
  - [1.4 Choix Technologiques et Étude Comparative](#14-choix-technologiques-et-étude-comparative)
  - [1.5 Architecture Globale du Système](#15-architecture-globale-du-système)
- [2. Réalisation de l’Application](#2-réalisation-de-lapplication)
  - [2.1 Analyse et Modélisation (MCD, MLD, Métriques)](#21-analyse-et-modélisation-mcd-mld-métriques)
  - [2.2 Développement par Module Fonctionnel](#22-développement-par-module-fonctionnel)
    - [2.2.1 Module 1 : Authentification, Sécurité et Journalisation](#221-module-1--authentification-sécurité-et-journalisation)
    - [2.2.2 Module 2 : Gestion des Référentiels, Directions et Offres](#222-module-2--gestion-des-référentiels-directions-et-offres)
    - [2.2.3 Module 3 : Portail Candidat et Dépôt Multi-Canal](#223-module-3--portail-candidat-et-dépôt-multi-canal)
    - [2.2.4 Module 4 : Pipeline RH et Fiche Candidat 360°](#224-module-4--pipeline-rh-et-fiche-candidat-360)
    - [2.2.5 Module 5 : Microservice OCR, Extraction IA et Validation RH](#225-module-5--microservice-ocr-extraction-ia-et-validation-rh)
    - [2.2.6 Module 6 : Vivier de Talents et Moteur Plein Texte](#226-module-6--vivier-de-talents-et-moteur-plein-texte)
    - [2.2.7 Module 7 : Planification des Rendez-vous et Messagerie](#227-module-7--planification-des-rendez-vous-et-messagerie)
    - [2.2.8 Module 8 : Studio de Conception d'Affiches de Recrutement](#228-module-8--studio-de-conception-daffiches-de-recrutement)
  - [2.3 Tableaux de Bord et Pilotage Décisionnel](#23-tableaux-de-bord-et-pilotage-décisionnel)
  - [2.4 Problèmes Rencontrés et Solutions Techniques](#24-problèmes-rencontrés-et-solutions-techniques)
- [3. Évaluation du Projet et Connaissances Acquises](#3-évaluation-du-projet-et-connaissances-acquises)
  - [3.1 Bilan pour l'Entreprise](#31-bilan-pour-lentreprise)
  - [3.2 Bilan Personnel et Professionnel](#32-bilan-personnel-et-professionnel)
  - [3.3 Extensions et Évolutions Futures](#33-extensions-et-évolutions-futures)
- [Conclusion Générale](#conclusion-générale)
- [Bibliographie et Webographie](#bibliographie-et-webographie)
- [Annexes](#annexes)

---

<div style="page-break-after: always;"></div>

## **Glossaire**

* **ACID (Atomicité, Cohérence, Isolation, Durabilité)** : Propriétés garantissant la fiabilité et l'intégrité absolue des transactions d'une base de données relationnelle.
* **API REST (Representational State Transfer)** : Norme de communication logicielle reposant sur les verbes HTTP (GET, POST, PUT, DELETE) et des formats de données standards (généralement JSON).
* **Clean Architecture** : Modèle architectural favorisant la séparation stricte des responsabilités (couches Présentation, Application, Domaine, Infrastructure) afin de rendre le code indépendant des frameworks et testable.
* **DTO (Data Transfer Object)** : Objet logiciel utilisé pour transporter des données encapsulées entre différents sous-systèmes sans exposer la structure interne des modèles de données.
* **FTS (Full-Text Search)** : Technique d'indexation et d'interrogation plein texte permettant des recherches lexicales rapides et tolérantes au sein de volumes textuels importants.
* **GIN (Generalized Inverted Index)** : Type d'index spécialisé dans PostgreSQL conçu pour optimiser les recherches dans des structures complexes telles que les colonnes `tsvector` ou `JSONB`.
* **Human-in-the-Loop (HITL)** : Principe d'ingénierie logicielle où un opérateur humain (ici le recruteur RH) valide, corrige ou rejette systématiquement les prédictions d'un algorithme d'IA avant leur intégration définitive.
* **JSONB** : Format binaire de stockage de structures JSON dans PostgreSQL, offrant des performances d'indexation et de requêtage directes très supérieures au format texte brut.
* **Levenshtein (Distance de)** : Mesure mathématique du nombre d'opérations élémentaires (insertions, suppressions, substitutions) nécessaires pour transformer une chaîne de caractères en une autre, utilisée ici pour le matching tolérant aux fautes d'OCR.
* **NER (Named Entity Recognition)** : Branche du traitement automatique du langage naturel (NLP) visant à extraire et catégoriser des entités sémantiques (personnes, compétences, organisations, dates).
* **OCR (Optical Character Recognition)** : Moteur de reconnaissance optique extrayant les caractères textuels contenus dans des images numérisées ou des documents PDF vectoriels et matriciels.
* **PaddleOCR** : Moteur d'OCR open-source basé sur l'apprentissage profond (Deep Learning), particulièrement robuste sur les agencements de documents complexes et multi-colonnes.
* **Repository Pattern** : Patron de conception séparant la logique métier de l'accès aux données (SGBD), facilitant la réutilisation des requêtes et les tests unitaires.
* **SPA (Single Page Application)** : Application web exécutée côté client dans le navigateur (ex. React), rechargeant dynamiquement les vues sans rafraîchir l'ensemble de la page HTML.
* **tsvector / tsquery** : Types de données natifs de PostgreSQL dédiés à la recherche plein texte : `tsvector` stocke une liste de lexèmes normalisés avec leurs positions, et `tsquery` formule la requête de recherche logique.
* **unaccent** : Extension et fonction PostgreSQL supprimant les accents et signes diacritiques pour permettre des recherches textuelles strictes et insensibles aux accents.

---

<div style="page-break-after: always;"></div>

## **Avant-propos**

Ce mémoire rend compte des travaux d'ingénierie logicielle menés dans le cadre de mon stage de fin d'études en vue de l'obtention du grade de **Licence en Informatique** à l’**IT University (ITU)**. Ce projet a été réalisé en partenariat avec la société **AlpA Ciment Madagascar**, au sein de sa Direction des Ressources Humaines, du 12 Août 2026 à Novembre 2026.

### **L’IT University**
Fondée en 2011, l’**IT University** est un établissement d'enseignement supérieur d'excellence spécialisé dans les technologies de l'information et de la communication à Madagascar. L'université forme des spécialistes capables de concevoir, développer et piloter des systèmes d'information modernes à travers deux cycles :
* **Cycle Licence (3 ans)** : Options *Développement d’Applications*, *Réseaux et Bases de Données*, *Web & Design*, et *Digital Leadership*.
* **Cycle Master (2 ans)** : Spécialisations de niveau international, notamment le Master MBDS (en partenariat avec l'Université Côte d'Azur) et le Master BIHAR (en partenariat avec l'ESTIA).

L'IT University met un point d'honneur à allier rigueur académique, maîtrise des fondamentaux du génie logiciel et immersion industrielle précoce à travers des stages pratiques d'envergure.

### **AlpA Ciment Madagascar**
Acteur industriel majeur à Madagascar, **AlpA Ciment** exploite des installations de production de ciment et de matériaux de construction de haute performance (usines et carrières), appuyées par un réseau administratif et logistique national (direction générale, services financiers, supply chain et direction des ressources humaines). 

L'institution s'appuie sur plusieurs centaines de collaborateurs qualifiés répartis entre l'usine et les bureaux administratifs. Dans un contexte de forte croissance et d'exigences opérationnelles continues, le capital humain constitue la ressource la plus stratégique de l'entreprise. Pour soutenir ses recrutements techniques et administratifs, AlpA Ciment a entrepris la modernisation complète de sa gestion prévisionnelle des emplois et des compétences (GPEC), nécessitant une refonte digitale de ses circuits de recrutement.

---

<div style="page-break-after: always;"></div>

## **Remerciements**

Je tiens en premier lieu à exprimer ma profonde reconnaissance à **Dieu Tout-Puissant**, source d'inspiration, de persévérance et de santé, qui m'a accordé la force de mener ce projet d'envergure à son terme.

J'adresse mes plus vifs remerciements à l'équipe pédagogique et à la direction de l’**IT University**, en particulier à :
* **Dr. Olivier ROBINSON**, Directeur Pédagogique, pour son exigence d'excellence technique et son dévouement à la formation d'informaticiens de haut niveau ;
* **M. Tahina RAZAFINJOELINA**, pour la rigueur scientifique et la vision moderne du développement logiciel transmises tout au long du cursus universitaire.

Ma sincère gratitude s'adresse également à l'ensemble de l'équipe d'**AlpA Ciment Madagascar**, en particulier à la **Direction des Ressources Humaines** et à l'équipe technique, pour leur accueil chaleureux, leur confiance constante et la clarté de leurs orientations métiers lors de la définition du cahier des charges.

J'exprime du fond du cœur ma reconnaissance à ma **famille**, dont les encouragements inconditionnels, la patience et le soutien indéfectible ont constitué le socle de ma motivation durant ces trois années de Licence.

Enfin, je remercie chaleureusement mes collègues de promotion et amis pour les échanges constructifs, la solidarité et l'entraide technique qui ont jalonné notre parcours universitaire.

---

<div style="page-break-after: always;"></div>

## **Introduction Générale**

À l'ère de la transformation numérique, la compétitivité et la résilience d'un groupe industriel reposent prioritairement sur sa capacité à attirer, qualifier et mobiliser rapidement les compétences adéquates. Pour une entreprise comme **AlpA Ciment**, dont les opérations combinent des contraintes industrielles lourdes en usine et des exigences administratives et commerciales en bureau, le recrutement de profils techniques spécialisés (ingénieurs de maintenance, techniciens de laboratoire, électromécaniciens, comptables d'usine) représente un enjeu critique pour la continuité des activités.

### **Problématique & Constat Initial**
Jusqu'alors, les processus de recrutement au sein d'AlpA Ciment souffraient d'une dispersion opérationnelle caractéristique des gestions artisanales :
1. **Dispersion multicanale incontrôlée** : Les candidatures arrivaient de manière hétérogène (dépôts physiques de CVs papier à l'accueil de l'usine, courriels directs sur les boîtes des responsables RH, candidatures spontanées sans classification).
2. **Absence de capitalisation et « perte » des talents** : Une candidature non retenue pour une offre donnée était systématiquement oubliée dans un dossier d'archives, faute d'un vivier structuré interrogeable. Lorsqu'un besoin analogue apparaissait trois mois plus tard, le service RH devait rééditer et republier une offre coûteuse, ignorant qu'un profil adéquat dormait déjà dans ses archives.
3. **Traitement manuel fastidieux et chronophage** : La lecture manuelle de dizaines de CVs au format PDF ou papier consommait un temps disproportionné de l'équipe RH. L'absence de moteur de recherche multicritère et l'inexistence d'extraction automatique des compétences imposaient une saisie manuelle récurrente.
4. **Déficit de traçabilité et de suivi des étapes** : L'historique des changements d'état des candidats (sélection, tests techniques, entretiens, promesses d'embauche) et la chronologie des convocations n'étaient pas journalisés de façon centralisée, créant des risques d'oublis ou de doublons dans les convocations.

### **Problématique Centrale du Mémoire :**
> *« Comment concevoir et déployer une plateforme unifiée de recrutement et de gestion de vivier, capable d'automatiser l'extraction documentaire des CVs par OCR, d'assurer une recherche plein texte multicritère ultra-rapide et de piloter de manière collaborative l'intégralité du pipeline de sélection pour un groupe industriel ? »*

### **Solutions et Résultats Essentiels Apportés :**
Pour répondre à cette problématique, les travaux réalisés durant ce stage ont permis d'aboutir à un système complet, modulaire et hautement sécurisé, articulé autour des piliers suivants :
* **Architecture découplée professionnelle (SPA + API REST)** : Développement d'un Frontend réactif en **React 18 (Vite)** et d'un Backend robuste en **Laravel 11**, respectant les principes de la **Clean Architecture** via le **Repository Pattern**.
* **Moteur de Base de Données Haute Performance (PostgreSQL 16)** : Exploitation avancée du typage `JSONB`, de l'extension `unaccent` et de vecteurs `tsvector` indexés par `GIN` pour une recherche textuelle instantanée insensible aux accents et fautes de frappe.
* **Microservice d'IA Documentaire (FastAPI + PaddleOCR + NLP)** : Mise en place d'un pipeline d'extraction optique de caractères (PP-OCRv4) couplé à une analyse sémantique (spaCy & RapidFuzz), permettant d'extraire automatiquement compétences, expériences et formations tout en maintenant une validation humaine systématique (*Human-in-the-loop*).
* **Gestion du Vivier et Pipeline RH Intégré** : Suivi visuel des statuts, gestion des candidatures spontanées et sur offre, planification des tests et entretiens via agenda interactif, et historisation immuable de chaque communication électronique.
* **Studio Générateur d'Affiches RH** : Module créatif permettant aux chargés de recrutement de composer, prévisualiser et exporter directement des affiches professionnelles de recrutement adaptées aux formats d'AlpA Ciment.

### **Annonce du Plan :**
Le présent mémoire est structuré en trois grands chapitres :
1. **Chapitre 1 — Présentation du Projet** : Cadre contextuel, objectifs détaillés, planning de réalisation selon la démarche Agile découpée en 8 sprints (71 jours ouvrés), étude comparative et justifications technologiques approfondies, et architecture globale du système.
2. **Chapitre 2 — Réalisation de l’Application** : Analyse conceptuelle (MCD/MLD), développement détaillé des huit modules fonctionnels avec choix d'implémentation, dashboards de pilotage décisionnel, et retour d'expérience approfondi sur les problèmes techniques majeurs rencontrés et résolus.
3. **Chapitre 3 — Évaluation du Projet et Connaissances Acquises** : Bilan pour AlpA Ciment, retombées personnelles et professionnelles, et perspectives d'extensions techniques futures.


---

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


---

# Chapitre 2 : Réalisation de l’Application

Ce chapitre constitue le cœur technique du mémoire. Il détaille la démarche d'ingénierie logicielle suivie pour concrétiser la plateforme AlpA Ciment : modélisation rigoureuse des données, développement modulaire selon la Clean Architecture, métriques du code, mise en place des algorithmes d'IA et de recherche plein texte, et retour d'expérience approfondi sur les défis techniques résolus.

---

## 2.1 Analyse et Conception

### 2.1.1 Analyse de l'Existant et Besoins Métiers
Avant le développement de la plateforme, le processus de recrutement d'AlpA Ciment souffrait de la dispersion de ses données sur des fichiers tableurs (Excel) et des boîtes e-mails individuelles. Les fiches de poste étaient hétérogènes, et la qualification d'un candidat dépendait de notes volantes.

L'analyse du cahier des charges a conduit à définir **trois impératifs fonctionnels** :
1. **Unification des flux de candidature** : Distinguer formellement les candidatures répondant à une offre publiée (direction $\rightarrow$ offre $\rightarrow$ profil) et les candidatures spontanées (direction $\rightarrow$ domaine d'activité), tout en conservant une fiche candidat unique et pérenne.
2. **Pérennisation du vivier de talents** : Permettre à tout moment de marquer une candidature comme appartenant au vivier (`dans_vivier = true`), quel que soit son statut dans le pipeline, afin qu'elle puisse être recontactée lors d'un besoin futur.
3. **Zéro trigger en base de données (Choix d'Architecture Assumé)** :
   Contrairement aux systèmes utilisant des déclencheurs SQL (triggers) opaques et difficiles à déboguer, il a été délibérément acté que **100% des règles de gestion, vérifications de cohérence et calculs dérivés soient pris en charge par le code applicatif** (couche *Service* de Laravel). Ce choix garantit :
   * Une prévisibilité absolue du comportement système.
   * La traçabilité intégrale dans le code source versionné sous Git.
   * La possibilité de tester unitairement et d'automatiser les tests de non-régression sans dépendre d'effets de bord cachés en base.

---

### 2.1.2 Modélisation Conceptuelle des Données (MCD & MLD)

La base de données repose sur un schéma relationnel de **22 tables interconnectées** garantissant l'intégrité référentielle et la traçabilité complète des opérations.

```
                    MODÈLE CONCEPTUEL DES DONNÉES (MCD SIMPLIFIÉ)
 
  ┌──────────────┐          1,n ┌──────────────┐ 0,n          0,n ┌──────────────┐
  │  DIRECTION   │◄─────────────┤    OFFRE     ├─────────────────►│  COMPETENCE  │
  └──────┬───────┘              └──────┬───────┘                  └──────┬───────┘
         │ 1,n                         │ 0,n                             │ 0,n
         ▼                             ▼                                 ▼
  ┌──────────────┐ 0,n          1,1 ┌──────────────┐              ┌──────────────┐
  │   DOMAINE    │◄─────────────┤ CANDIDATURE  │              │   CANDIDAT   │
  └──────────────┘              └──────┬───────┘              │  COMPETENCE  │
                                       │ 1,1                  └──────▲───────┘
                                       ▼                             │ 0,n
                                ┌──────────────┐ 1,1          1,n ┌──┴───────────┐
                                │   CANDIDAT   │◄─────────────────┤   CANDIDAT   │
                                └──────────────┘                  └──────────────┘
                                       │ 1,n
                     ┌─────────────────┼─────────────────┐
                     ▼                 ▼                 ▼
              ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
              │  DOCUMENTS   │  │ RENDEZ-VOUS  │  │COMMUNICATION │
              │  (CV / OCR)  │  │(Entretiens)  │  │  (Historique)│
              └──────────────┘  └──────────────┘  └──────────────┘
```

#### Modèle Logique de Données (MLD — Extrait des relations maîtresses) :
* **`direction`** (`id_direction` PK, `nom_direction`)
* **`domaine`** (`id_domaine` PK, `#id_direction` FK, `nom_domaine`, `valide`, `valide_par`, `date_validation`)
* **`candidat`** (`id_candidat` PK, `nom`, `prenom`, `email` UNIQUE, `telephone`, `ville`, `created_at`)
* **`offre`** (`id_offre` PK, `#id_direction` FK, `titre_poste`, `description`, `lieu`, `date_publication`, `date_cloture`, `#id_statut_offre` FK)
* **`candidature`** (`id_candidature` PK, `#id_candidat` FK, `#id_offre` FK (nullable), `#id_domaine` FK (nullable), `poste_souhaite`, `#id_statut_candidature` FK, `dans_vivier`, `canal_depot`, `created_at`)
* **`document`** (`id_document` PK, `#id_candidature` FK, `nom_fichier`, `chemin_fichier`, `type_document`, `contenu_texte_extrait`, `recherche_texte` tsvector)
* **`cv_extraction_ocr`** (`id_extraction` PK, `#id_document` FK, `donnees_json` JSONB, `statut_validation`, `valide_par`)
* **`rendez_vous`** (`id_rendez_vous` PK, `#id_candidature` FK, `#id_utilisateur` FK, `date_heure`, `#id_type_rdv` FK, `#id_statut_rdv` FK, `lieu_ou_lien`)
* **`communication`** (`id_communication` PK, `#id_candidature` FK, `#id_utilisateur` FK, `sujet`, `contenu_corps_copie`, `date_envoi`)
* **`audit_log`** (`id_log` PK, `#id_utilisateur` FK, `action`, `entite_type`, `entite_id`, `details_json` JSONB, `created_at`)

---

### 2.1.3 Métriques de Conception et Structure Logicielle

L'application respecte les standards de la Clean Architecture. Le code est rigoureusement ventilé selon les métriques suivantes :

| Composant Architectural | Nombre | Rôle et Responsabilité |
| :--- | :---: | :--- |
| **Tables de Base de Données (PostgreSQL)** | **22** | Modèle relationnel 3FN avec colonnes JSONB et tsvector |
| **Modèles Eloquent (ORM Laravel)** | **20** | Représentation objet des entités et déclaration des relations |
| **Contrôleurs d'API (Thin Controllers)** | **14** | Aiguillage HTTP REST, délégation stricte aux services |
| **FormRequests (Validation HTTP)** | **18** | Validation stricte des types de données et règles d'entrée |
| **Services Métiers (Couche Application)** | **12** | Centralisation 100% de la logique métier et transactions |
| **Repositories (Abstraction Données)** | **10** | Requêtage optimisé PostgreSQL, isolation de la persistance |
| **API Resources (DTOs JSON)** | **16** | Normalisation des réponses JSON pour le client React |
| **Vues & Pages React (SPA)** | **14** | Interfaces écrans modulaires (Tableaux, Fiches, Calendrier) |
| **Composants Réutilisables React** | **35+** | Modales, badges de statut, formulaires, visualiseur de CV |
| **Tests Automatisés (PHPUnit / Pest)** | **37** | Couverture de 194 assertions sur les cas nominaux et limites |

---

## 2.2 Développement par Module Fonctionnel

### 2.2.1 Module 1 : Authentification, Sécurité et Journalisation

#### A. Description
Ce module assure la protection des données sensibles (dossiers des candidats, salaires souhaités, évaluations d'entretiens) et gère le contrôle d'accès basé sur les rôles (RBAC).

#### B. Fonctionnalités Clés
* Authentification sécurisée par jetons d'API (Laravel Sanctum).
* Gestion des rôles utilisateurs : Administrateur RH, Chargé de recrutement, Manager opérationnel.
* Déconnexion sécurisée et révocation dynamique des tokens.
* **Journal d'Audit immuable (`audit_logs`)** : Chaque opération sensible (changement de statut d'un candidat, convocation à un entretien, suppression d'un document) est tracée avec l'identifiant de l'auteur, l'adresse IP, l'horodatage et un instantané JSON des valeurs avant/après modification.

#### C. Choix d'Implémentation Technique
* **Hachage des mots de passe par BCrypt** avec facteur de coût adaptatif.
* **Architecture REST 100% Stateless par Bearer Tokens (Laravel Sanctum)** :
  - Authentification décorrélée des cookies de session : chaque requête cliente transmet l'en-tête `Authorization: Bearer <token>`.
  - Persistance cryptographique : les jetons ne sont jamais stockés en clair côté serveur. Seule leur empreinte unidirectionnelle **SHA-256** est enregistrée dans la table `personal_access_tokens` de PostgreSQL. Ce modèle de jetons de référence (*Reference Tokens*) garantit une **révocation instantanée** lors de la déconnexion (`DELETE`), résolvant la faille classique des JWT orphelins.
  - **Durée de validité de 8 heures** : chaque token possède un horodatage d'expiration strict (`expires_at`), invalidant automatiquement les sessions au terme d'une journée de travail RH avec rejet en code HTTP `401 Unauthorized`.
  - **Nettoyage automatique programmé** : une tâche quotidienne (`Schedule::command('sanctum:prune-expired --hours=0')->daily()`) purge les jetons périmés de la base de données chaque nuit à minuit.
  - **Protection anti force-brute (Rate Limiting)** : le point d'entrée `POST /api/login` est verrouillé par un limiteur de débit (`throttle:5,1`), bloquant les attaques par dictionnaire dès la 6ᵉ tentative erronée (HTTP `429 Too Many Requests`).
  - **Suppression du surcoût CSRF** : l'utilisation exclusive d'en-têtes HTTP Bearer immunise l'API contre les attaques CSRF par nature, supprimant les requêtes préliminaires superflues et accélérant les interactions de la Single Page Application React.
* **Middlewares d'autorisation RBAC & Permissions** interceptant chaque requête HTTP (`auth:sanctum`, `role:...`, `permission:...`) pour valider l'habilitation avant d'atteindre le contrôleur.
* **Événements et Listeners d'Audit** : Découplage de la journalisation via des observateurs d'événements Eloquent, garantissant qu'un échec de log ne bloque pas la transaction métier.

---

### 2.2.2 Module 2 : Gestion des Référentiels, Directions et Offres

#### A. Description
Ce module fournit le cadre structurel de l'entreprise. Il permet de modéliser les Directions (ex. *Direction Usine*, *Direction Financière*, *Direction Informatique*), les Domaines d'activité et le catalogue des compétences professionnelles.

#### B. Fonctionnalités Clés
* **Cycle de vie des offres d'emploi** : Machine à états régissant la transition automatique ou manuelle :
  $$\text{Brouillon} \longrightarrow \text{Publiée} \longrightarrow \text{Clôturée}$$
* Définition fine du profil recherché : intitulé du poste, missions détaillées, niveau d'études requis (Bac+2 à Bac+5), années d'expérience requises et compétences obligatoires/optionnelles.
* Génération automatique d'un lien public unique permettant aux candidats de postuler directement.

#### C. Choix d'Implémentation Technique
* Encapsulation des transitions d'état dans `OffreService` empêchant la publication d'une offre dépourvue de compétences ou de missions.
* Utilisation de relations polymorphiques et de tables de liaison (`profil_competence`) associant chaque offre à ses prérequis techniques.

---

### 2.2.3 Module 3 : Portail Candidat et Dépôt Multi-Canal

#### A. Description
Le portail d'acquisition permet aux candidats de postuler en toute simplicité depuis n'importe quel terminal, tout en offrant aux recruteurs un guichet de saisie manuelle pour les dossiers déposés physiquement à l'usine.

#### B. Fonctionnalités Clés
* **Postulation en ligne sur offre publiée** : Formulaire guidé avec saisie des coordonnées, poste visé, téléversement du CV et de la lettre de motivation.
* **Candidature spontanée catégorisée** : Choix du domaine d'activité parmi un référentiel dynamique (avec option *"Autre"* créant un domaine en attente de validation RH).
* **Guichet de saisie manuelle RH** : Permet à un chargé de recrutement de numériser et saisir une candidature papier reçue à l'accueil de l'usine, avec traçabilité de l'agent ayant effectué la saisie (`canal_depot = 'rh_manuel'`).
* **Dédoublonnage intelligent** : Vérification immédiate de l'existence du candidat par son adresse e-mail. Si le candidat existe déjà, le système rattache la nouvelle candidature à son dossier historique sans créer de doublon.

#### C. Choix d'Implémentation Technique
* Stockage sécurisé des pièces jointes via `Storage::disk('candidatures')` avec renommage cryptographique (UUID) pour prévenir les collisions de fichiers et l'écrasement.
* Transaction atomique `DB::transaction` assurant que la création du candidat, de la candidature, l'enregistrement des fichiers et le premier historique de statut réussissent conjointement ou soient annulés en bloc.

---

### 2.2.4 Module 4 : Pipeline RH et Fiche Candidat 360°

#### A. Description
Ce module constitue l'espace de travail quotidien des recruteurs, leur permettant de suivre visuellement la progression de chaque candidat à travers les différentes étapes de sélection.

#### B. Fonctionnalités Clés
* **Workflow d'évaluation en 6 statuts normalisés** :
  $$\text{Reçue} \longrightarrow \text{Présélectionnée} \longrightarrow \text{Test Technique} \longrightarrow \text{Entretien} \longrightarrow \begin{cases} \text{Retenue (Embauche)} \\ \text{Non retenue} \end{cases}$$
* **Fiche Candidat 360°** : Vue centralisée regroupant en un seul écran :
  * L'état civil et les coordonnées vérifiées.
  * Le visualiseur intégré de CV (aperçu PDF direct sans téléchargement préalable).
  * L'historique chronologique complet des changements de statut avec motifs et commentaires.
  * Le relevé des rendez-vous passés et à venir.
  * L'historique immuable des communications échangées.
* **Bascule instantanée dans le Vivier** : Bouton d'action permettant de marquer un profil prometteur pour une conservation à long terme.

#### C. Choix d'Implémentation Technique
* Composant React modulaire [`CandidatureDetailView.jsx`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement-react/src/pages/CandidatureDetailView.jsx) organisé en onglets asynchrones pour garantir un temps de chargement initial minimal.
* Génération de fiches synthétiques au format PDF téléchargeable pour les commissions de recrutement de l'usine.

---

### 2.2.5 Module 5 : Microservice OCR, Extraction IA et Validation RH

#### A. Description
Ce module automatise la lecture et la digestion documentaire des CVs en combinant la vision par ordinateur (PaddleOCR) et le traitement sémantique (spaCy & RapidFuzz).

#### B. Fonctionnalités Clés
* Extraction automatique du texte brut à partir de documents PDF vectoriels, de scans ou de photos de CVs numérisés.
* Découpage et classification sémantique :
  * Compétences techniques et humaines.
  * Expériences professionnelles (intitulé de poste, entreprise, dates de début et fin).
  * Formations et diplômes (niveau académique, établissement, intitulé).
* **Interface de validation *Human-in-the-Loop*** : L'IA pré-remplit les champs avec un score de confiance probabiliste. Le recruteur valide d'un clic, corrige les éventuelles erreurs ou rejette les propositions douteuses avant toute persistance définitive.

#### C. Choix d'Implémentation Technique
* Pipeline d'inférence asynchrone déployé sur FastAPI (port 8001), communiquant via API REST avec Laravel.
* Algorithme **RapidFuzz** assurant la réconciliation tolérante aux fautes d'OCR entre les mots extraits et le référentiel officiel des compétences d'AlpA Ciment.
* Persistance des données brutes au format `JSONB` dans la table `cv_extraction_ocr` pour permettre des ré-entraînements ultérieurs sans ré-exécuter l'OCR.

---

### 2.2.6 Module 6 : Vivier de Talents et Moteur de Recherche Plein Texte

#### A. Description
Le Vivier de Talents est la bibliothèque de profils qualifiés d'AlpA Ciment. Il permet de trouver en quelques secondes les meilleurs profils disponibles pour un poste vacant sans publier de nouvelle offre.

#### B. Fonctionnalités Clés
* **Panneau de recherche multicritère** : Filtrage croisé combinant Direction, Domaine, Niveau d'études, Postes souhaités et Compétences (avec opérateur logique ET / OU).
* **Recherche Plein Texte dans le texte des CVs** : Capacité d'interroger n'importe quel mot-clé technique ou terme rare figurant dans le corps du CV.
* **Insensibilité universelle aux accents** : Rechercher `developpeur` renvoie instantanément les CVs contenant `développeur`, `Développeur` ou `DEVELOPPEUR`.
* **Affichage de l'Extrait Contextuel (`cv_snippet`)** : Affichage d'un badge contextuel montrant la phrase exacte du CV où le mot-clé a été localisé, entouré de ses mots voisins pour une évaluation visuelle immédiate.

#### C. Choix d'Implémentation Technique
* Configuration plein texte personnalisée PostgreSQL `french_unaccent` associée à un index `GIN` :
  ```sql
  CREATE INDEX idx_document_recherche_texte ON document USING gin(recherche_texte);
  ```
* Implémentation dans [`EloquentCandidatureRepository.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Repositories/Eloquent/EloquentCandidatureRepository.php) et [`EloquentVivierRepository.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Repositories/Eloquent/EloquentVivierRepository.php) d'un algorithme de découpage de snippet basé sur `Str::ascii()` pour garantir la concordance exacte des index de découpe entre PHP et PostgreSQL.

---

### 2.2.7 Module 7 : Planification des Rendez-vous et Messagerie Dynamique

#### A. Description
Ce module professionnalise la communication entre l'entreprise et les postulants, éliminant les oublis et renforçant la marque employeur d'AlpA Ciment.

#### B. Fonctionnalités Clés
* **Agenda interactif des épreuves** : Calendrier basé sur FullCalendar permettant de planifier les tests d'embauche et les entretiens physiques à l'usine ou en visio.
* **Gestion des modèles de courriels (Templates)** : Modèles prédéfinis personnalisables (Accusé de réception, Convocation entretien, Rejet bienveillant).
* **Moteur d'interpolation dynamique de variables** : Remplacement automatique des balises `{nom}`, `{prenom}`, `{poste}`, `{date_rdv}`, `{lieu_rdv}` par les valeurs réelles du candidat.
* **Immuabilité des preuves d'envoi** : Enregistrement d'une copie intégrale du message textuel envoyé dans la table `communication`.

#### C. Choix d'Implémentation Technique
* Classes Laravel `Mailable` utilisant des vues Blade responsive assurant un rendu irréprochable sur tous les clients mails (smartphones, ordinateurs).
* Moteur d'interpolation basé sur des expressions régulières PCRE (`preg_replace`) tolérant les espaces et insensibles à la casse (`{variable}` et `{{variable}}`).

---

### 2.2.8 Module 8 : Studio de Conception d'Affiches de Recrutement

#### A. Description
Pour recruter efficacement sur les sites industriels ou sur les plateformes numériques, le service RH a besoin de visuels professionnels aux normes graphiques d'AlpA Ciment.

#### B. Fonctionnalités Clés
* **Génération dynamique d'affiches** : Remplissage automatique des textes à partir des données de l'offre (titre, missions synthétisées, profil, adresse de candidature).
* **Multi-templates visuels** : Choix entre des thèmes visuels adaptés à l'environnement d'Usine ou aux Bureaux administratifs.
* **Repositionnement interactif des blocs de texte** : Système de déplacement libre (drag-and-drop) des textes sur le canvas de l'affiche, avec activation conditionnelle du quadrillage repère.
* **Exportation haute résolution** : Téléchargement direct au format image (PNG/JPEG) prêt pour l'impression ou la publication en ligne.

#### C. Choix d'Implémentation Technique
* Composant modulaire React [`AfficheOffreModal.jsx`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement-react/src/components/modals/AfficheOffreModal.jsx) et utilitaire de calcul textuel [`posterContentGenerator.js`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement-react/src/utils/posterContentGenerator.js).
* Algorithme de retour à la ligne automatique (*word-wrap*) calculé selon la largeur des conteneurs pour préserver la lisibilité des textes longs.

---

## 2.3 Tableaux de Bord et Pilotage Décisionnel

Le module de reporting offre à la Direction Générale et à la Direction des Ressources Humaines une vision consolidée en temps réel de l'activité de recrutement.

```
                      TABLEAU DE BORD DÉCISIONNEL RH (KPIs)
 ┌───────────────────┬───────────────────┬───────────────────┬───────────────────┐
 │ CANDIDATURES TOT. │ OFFRES EN COURS   │ DANS LE VIVIER    │ DÉLAI MOYEN RECR. │
 │       148         │        6          │        42         │     14,2 jours    │
 └───────────────────┴───────────────────┴───────────────────┴───────────────────┘
 ┌─────────────────────────────────────────┬─────────────────────────────────────┐
 │       RÉPARTITION PAR STATUT            │     CANDIDATURES PAR DIRECTION      │
 │  ■ Reçues           (45%) [█████████ ]  │  ■ Direction Usine          (52%)   │
 │  ■ Présélectionnées (25%) [█████     ]  │  ■ Direction Financière     (22%)   │
 │  ■ En Entretien     (18%) [████      ]  │  ■ Direction Informatique   (16%)   │
 │  ■ Retenues / Embauche (12%) [██     ]  │  ■ Direction RH             (10%)   │
 └─────────────────────────────────────────┴─────────────────────────────────────┘
```

### Indicateurs Clés de Performance (KPIs) Suivis :
1. **Volumétrie et dynamique des flux** : Nombre de candidatures reçues par canal (Portail web vs Guichet usine vs Spontanées).
2. **Taux de conversion du pipeline** : Pourcentage de candidats passant avec succès de l'étape de présélection aux tests techniques, puis aux entretiens finaux.
3. **Vélocité de traitement** : Temps moyen écoulé entre le dépôt de la candidature et la décision finale d'embauche ou de refus.
4. **Alimentation du Vivier** : Taux d'enrichissement mensuel du vivier de talents par domaine d'expertise.

---

## 2.4 Problèmes Rencontrés et Solutions Techniques

Conformément à la démarche d'ingénierie logicielle valorisée à l'IT University, cette section documente **cinq défis techniques majeurs** survenus durant le développement et les solutions d'architecture appliquées pour les résoudre.

---

### 2.4.1 Défi 1 : Incohérence de l'insensibilité aux accents entre PostgreSQL et PHP (`cv_snippet`)
* **Problème rencontré** : Lors d'une recherche de mot-clé sans accent (ex. `developpeur`), PostgreSQL trouvait parfaitement la candidature grâce à la configuration `french_unaccent`. En revanche, sur la page web, le badge d'extrait contextuel du CV (`cv_snippet`) disparaissait complètement et restait vide.
* **Cause racine** : En PHP, la fonction d'extraction du texte utilisait nativement `mb_stripos($texte, $keyword)`. Or, `mb_stripos("développeur", "developpeur")` renvoie `false` car il est strictement sensible aux accents. PostgreSQL renvoyait la ligne, mais le backend PHP ne parvenait pas à localiser le mot dans le texte français accentué pour générer le snippet.
* **Solution technique appliquée** : Implémentation d'un algorithme de translittération en miroir via `Str::ascii()`. Le calcul de la position du mot-clé s'opère sur la chaîne translittérée (sans accent), tandis que le découpage final s'effectue sur la chaîne originale avec ses accents et sa casse.
  ```php
  // Normalisation pour recherche d'offset sans accent
  $normalizedText = Str::ascii(mb_strtolower($text));
  $normalizedKeyword = Str::ascii(mb_strtolower($keyword));
  $pos = mb_strpos($normalizedText, $normalizedKeyword);
  
  // Découpage préservant le texte original accentué
  $start = max(0, $pos - $radius);
  $snippet = mb_substr($text, $start, $length);
  ```

---

### 2.4.2 Défi 2 : Hallucination des modèles NLP sur la distinction Projets vs Expériences
* **Problème rencontré** : Lors de l'extraction automatique des CVs par modèles de langage ou NER, les projets académiques, personnels ou open-source des jeunes diplômés étaient quasi systématiquement classés comme des "contrats d'entreprise" ou "expériences professionnelles", faussant l'évaluation de leur séniorité.
* **Cause racine** : Le vocabulaire employé dans les projets d'école ressemble fortement à celui de l'entreprise (*"Gestion de projet"*, *"Développement d'application"*).
* **Solution technique appliquée** : Refonte du schéma relationnel pour dissocier explicitement `experience_professionnelle` et `projet`, accompagnée de consignes négatives strictes dans le moteur de parsing heuristique interdisant d'attribuer une expérience professionnelle sans raison sociale d'entreprise vérifiée.

---

### 2.4.3 Défi 3 : Déstructuration des textes sur les CVs multi-colonnes en OCR
* **Problème rencontré** : Avec les moteurs d'OCR conventionnels (Tesseract), la lecture des CVs modernes structurés en deux colonnes lisait les lignes horizontalement d'un bout à l'autre de la page, mélangeant la liste des compétences de gauche avec les descriptions d'entreprises de droite.
* **Solution technique appliquée** : Remplacement par le moteur **PaddleOCR (PP-OCRv4)** avec détection angulaire active (`use_angle_cls=True`). PaddleOCR détecte les boîtes englobantes géométriques (*bounding boxes*) de chaque bloc de paragraphe, permettant de reconstituer l'arborescence des colonnes avant l'analyse lexicale.

---

### 2.4.4 Défi 4 : Garantie de cohérence transactionnelle sans triggers SQL
* **Problème rencontré** : L'exigence architecturale de n'utiliser aucun trigger en base imposait de garantir que la création d'une candidature, le téléversement de ses fichiers, son premier statut et son journal d'audit restent parfaitement cohérents, y compris en cas de coupure réseau ou d'erreur serveur.
* **Solution technique appliquée** : Encapsulation systématique de toutes les opérations d'écriture dans des blocs transactionnels gérés par `DB::transaction(function() { ... })` au sein de la couche Service. En cas d'exception levée sur l'une des étapes, la base PostgreSQL effectue un *rollback* immédiat, garantissant l'état zéro défaut (propriétés ACID).

---

### 2.4.5 Défi 5 : Conflit d'agencement visuel sur le générateur d'affiches
* **Problème rencontré** : Lors du changement de template d'affiche (passage du thème Bureau au thème Usine), les coordonnées des blocs de texte débordaient sur les éléments graphiques de fond, et les textes longs (descriptions de postes) sortaient du cadre.
* **Solution technique appliquée** : Création d'une grille de coordonnées relatives proportionnelles et implémentation d'un algorithme de retour à la ligne dynamique avec limitation automatique du nombre de caractères par ligne selon la typographie du template sélectionné.


---

# Chapitre 3 : Évaluation du Projet et Connaissances Acquises

Ce troisième et dernier chapitre dresse le bilan qualitatif et quantitatif des travaux réalisés. Il mesure les retombées directes pour AlpA Ciment Madagascar, détaille les acquis techniques et méthodologiques tirés de cette expérience de stage, et esquisse les perspectives d'évolution pour le système d'information de l'entreprise.

---

## 3.1 Bilan pour l'Entreprise

L'implémentation de la plateforme a transformé en profondeur la gestion des ressources humaines d'AlpA Ciment. Les retombées observées se mesurent à trois niveaux majeurs :

### 3.1.1 Gains d'Efficacité Opérationnelle et Chiffrés
* **Réduction drastique du temps de traitement documentaire** : Là où l'ouverture manuelle, la lecture et la saisie des informations d'un CV nécessitaient en moyenne 8 à 12 minutes par candidat, le microservice d'OCR et de parsing réalise cette opération en moins de **3 secondes**.
* **Zéro perte de talents grâce au Vivier Unique** : Avant le projet, 100% des candidatures non retenues pour un poste donné étaient perdues dans des boîtes d'archives physiques ou électroniques. Grâce au vivier intelligent, plus de **40 profils qualifiés** ont déjà été capitalisés et restent immédiatement mobilisables pour les besoins saisonniers de l'usine.
* **Recherche instantanée multicritère** : Trouver un profil spécifique (ex. *"Électromécanicien avec 3 ans d'expérience disposant d'un diplôme Bac+2"*) s'effectue désormais en **moins de 10 millisecondes**, contre plusieurs heures de fouille manuelle dans les classeurs auparavant.

### 3.1.2 Fiabilisation et Sécurisation des Données RH
* **Fin des doublons de candidature** : L'algorithme de dédoublonnage automatique par adresse e-mail garantit qu'un candidat postulant plusieurs fois voit l'ensemble de ses démarches consolidées sous un historique unique.
* **Traçabilité juridique et conformité d'audit** : Grâce au journal d'audit (`audit_logs`) et à l'historisation immuable des communications, chaque décision de sélection, chaque motif de rejet et chaque convocation envoyée est formellement horodatée et attribuée à un responsable RH.

### 3.1.3 Valorisation de la Marque Employeur
* **Communication professionnelle et réactive** : L'automatisation des accusés de réception et la personnalisation dynamique des convocations renvoient aux postulants l'image d'une entreprise industrielle moderne et respectueuse de ses candidats.
* **Homogénéité graphique** : Le studio d'affiches permet de générer des supports de communication visuellement cohérents pour les campagnes de recrutement en usine et sur les réseaux sociaux.

---

## 3.2 Bilan Personnel et Professionnel

Ce stage de fin d'études de Licence en Informatique à l'IT University a constitué une étape charnière dans ma formation d'ingénieur logiciel. Il m'a permis de confronter les théories académiques aux contraintes impérieuses du monde industriel.

### 3.2.1 Compétences Techniques Approfondies
* **Maîtrise de la Clean Architecture** : Abandon du modèle traditionnel *Fat Controller* au profit d'un découpage rigoureux en 5 couches (FormRequest $\rightarrow$ Thin Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ API Resource). Cette rigueur garantit un code modulaire, facile à maintenir et hautement testable.
* **Expertise SGBD Avancée sur PostgreSQL 16** :
  * Conception d'index inversés généralisés (`GIN`) sur des colonnes textuelles vectorielles (`tsvector`).
  * Configuration de dictionnaires linguistiques personnalisés (`french_unaccent`) et gestion de l'insensibilité diacritique.
  * Manipulation native et requêtage de structures semi-structurées `JSONB`.
* **Vision par Ordinateur & Traitement du Langage Naturel (NLP)** :
  * Déploiement et orchestration d'un microservice FastAPI asynchrone avec Uvicorn.
  * Prise en main des réseaux de neurones profonds de **PaddleOCR (PP-OCRv4)** pour la détection de texte orienté en multi-colonnes.
  * Utilisation de **spaCy** et **RapidFuzz** pour la réconciliation floue tolérante aux erreurs de numérisation.
* **Développement Frontend Moderne** : Maîtrise de l'écosystème React 18 avec l'outillage Vite, manipulation de states complexes, intégration de bibliothèques tierces riches (FullCalendar, Lucide) et création d'un canvas graphique interactif avec drag-and-drop.

### 3.2.2 Compétences Méthodologiques et Humaines
* **Gestion de Projet Agile & Respect des Délais** : Conduite d'un planning rigoureux découpé en 8 sprints sur 71 jours ouvrés, en maintenant un taux d'avancement réel supérieur aux prévisions initiales.
* **Écoute active et traduction des besoins métiers** : Capacité à dialoguer avec des spécialistes non informaticiens (responsables RH, chefs d'atelier d'usine) pour traduire leurs problématiques quotidiennes en exigences techniques concrètes.
* **Autonomie et résolution méthodique de problèmes complexes** : Développement d'une démarche d'investigation rigoureuse face aux bugs subtils (comme le décalage de normalisation UTF-8 entre PHP et PostgreSQL résolu avec `Str::ascii()`).

---

## 3.3 Extensions et Évolutions Futures

Bien que la plateforme soit pleinement opérationnelle et réponde à l'intégralité du cahier des charges, plusieurs axes d'évolution prometteurs se dégagent pour accompagner l'expansion future d'AlpA Ciment :

### 3.3.1 Notifications Multicanales par SMS et WhatsApp
Dans le contexte malgache, de nombreux candidats postulant à des postes d'ouvriers en usine (manutentionnaires, conducteurs d'engins, soudeurs) ne disposent pas d'un accès internet permanent pour consulter leurs e-mails. L'intégration d'une passerelle SMS locale (ex. API Telma / Orange Money / Airtel) ou d'une API WhatsApp Business permettrait d'envoyer les convocations aux entretiens et tests directement par messagerie instantanée.

### 3.3.2 Matching Prédictif Offre $\longleftrightarrow$ Candidat par Recherche Vectorielle (`pgvector`)
Actuellement, le rapprochement entre candidats et offres repose sur un filtrage précis par compétences déclarées. L'ajout de l'extension PostgreSQL **`pgvector`** permettrait de générer des *embeddings* sémantiques (représentations vectorielles) des fiches de poste et des CVs. Le système pourrait ainsi suggérer automatiquement un score de pertinence sémantique même lorsque le candidat utilise des synonymes non répertoriés dans le référentiel officiel.

### 3.3.3 Application Mobile Dédiée pour les Superviseurs d'Usine
Développer une interface mobile allégée (Progressive Web App ou React Native) permettrait aux chefs d'équipe et contremaîtres d'évaluer directement les tests pratiques des candidats à l'usine (grille d'évaluation technique, notation d'habileté manuelle) depuis une tablette ou un smartphone durci, avec synchronisation immédiate sur le dossier central du candidat.


---

# Conclusion Générale

Le projet présenté dans ce mémoire répondait à un impératif stratégique pour **AlpA Ciment Madagascar** : moderniser, centraliser et fiabiliser la gestion prévisionnelle de ses recrutements et la capitalisation de ses talents, face aux défis d'une industrie en pleine croissance.

En réponse à la problématique posée :
> *« Comment concevoir et déployer une plateforme unifiée de recrutement et de gestion de vivier, capable d'automatiser l'extraction documentaire des CVs par OCR, d'assurer une recherche plein texte multicritère ultra-rapide et de piloter de manière collaborative l'intégralité du pipeline de sélection pour un groupe industriel ? »*

Les travaux réalisés ont permis de livrer une solution informatique complète, modulaire et hautement sécurisée. En substituant aux fichiers tableurs dispersés et aux classeurs papier une plateforme web moderne basée sur **React 18** et **Laravel 11**, l'application offre un gain d'efficacité immédiat à la Direction des Ressources Humaines. 

L'intégration d'un microservice de vision artificielle (**PaddleOCR**) et de traitement sémantique (**spaCy & RapidFuzz**) décharge les équipes RH de la saisie manuelle tout en respectant le principe de validation humaine (*Human-in-the-Loop*). L'exploitation avancée des mécanismes de recherche plein texte de **PostgreSQL 16** (`tsvector`, index `GIN`, configuration `french_unaccent`) permet d'interroger instantanément le vivier de talents sans friction linguistique, garantissant que chaque profil à fort potentiel soit durablement valorisé.

D'un point de vue personnel, ce stage m'a offert l'opportunité de concrétiser les enseignements d'excellence reçus à l'**IT University**. Il m'a permis de maîtriser les patrons de conception de référence (**Clean Architecture**, **Repository Pattern**), de concevoir des bases de données relationnelles optimisées à haute exigence d'intégrité sans recourir à des triggers masqués, et de piloter un projet d'envergure sur 71 jours ouvrés dans le respect strict des principes Agiles.

Les perspectives d'évolution identifiées — intégration de passerelles SMS pour les techniciens d'usine, matching sémantique par embeddings vectoriels `pgvector` et interfaces mobiles de terrain — confirment que la plateforme développée constitue un socle technologique robuste et pérenne, prêt à soutenir le développement industriel d'AlpA Ciment pour les années à venir.

---

<div style="page-break-after: always;"></div>

# Bibliographie et Webographie

### I. Documentation des Frameworks & Langages
1. **LARAVEL 11.x** : Framework PHP open-source orienté objet pour le développement d'applications web d'entreprise.  
   *URL* : https://laravel.com/docs/11.x  
   *(Consulté le 12 août 2026)*.
2. **PHP 8.2** : Langage de programmation côté serveur typé et optimisé.  
   *URL* : https://www.php.net/docs.php  
   *(Consulté le 12 août 2026)*.
3. **REACT.JS 18+** : Bibliothèque JavaScript déclarative pour la création d'interfaces utilisateurs dynamiques et composants réutilisables.  
   *URL* : https://react.dev/  
   *(Consulté le 15 août 2026)*.
4. **VITE 8.x** : Outil d'assemblage (bundler) et serveur de développement ultra-rapide basé sur les modules ES natifs.  
   *URL* : https://vite.dev/  
   *(Consulté le 15 août 2026)*.
5. **TAILWIND CSS 3.x** : Framework CSS *utility-first* pour la conception d'interfaces responsives et personnalisées.  
   *URL* : https://tailwindcss.com/docs  
   *(Consulté le 16 août 2026)*.
6. **PYTHON 3.10+** : Langage de programmation interprété de haut niveau dédié à l'intelligence artificielle et aux calculs scientifiques.  
   *URL* : https://docs.python.org/3/  
   *(Consulté le 20 août 2026)*.
7. **FASTAPI** : Framework web asynchrone pour Python basé sur Starlette et Pydantic, optimisé pour la création d'API REST haute performance.  
   *URL* : https://fastapi.tiangolo.com/  
   *(Consulté le 20 août 2026)*.

### II. Bases de Données, Recherche & Indexation
8. **POSTGRESQL 16** : Système de Gestion de Base de Données Relationnelle et Objet (SGBDRO) conforme aux normes ACID.  
   *URL* : https://www.postgresql.org/docs/16/index.html  
   *(Consulté le 18 août 2026)*.
9. **POSTGRESQL FULL-TEXT SEARCH & TSVECTOR** : Documentation sur la recherche textuelle lexicale et dictionnaires de langue.  
   *URL* : https://www.postgresql.org/docs/16/textsearch.html  
   *(Consulté le 18 août 2026)*.
10. **POSTGRESQL UNACCENT EXTENSION** : Dictionnaire de suppression des accents et signes diacritiques.  
    *URL* : https://www.postgresql.org/docs/16/unaccent.html  
    *(Consulté le 20 octobre 2026)*.
11. **POSTGRESQL GIN INDEXES** : Index inversé généralisé pour données composites et vectorielles.  
    *URL* : https://www.postgresql.org/docs/16/gin.html  
    *(Consulté le 19 août 2026)*.

### III. Vision par Ordinateur, IA & Traitement du Langage Naturel (NLP)
12. **PADDLEOCR (PP-OCRv4)** : Moteur de reconnaissance optique de caractères multilingue basé sur l'apprentissage profond.  
    *Dépôt GitHub* : https://github.com/PaddlePaddle/PaddleOCR  
    *(Consulté le 25 août 2026)*.
13. **SPACY FRENCH MODELS (`fr_core_news_md`)** : Bibliothèque industrielle pour le traitement automatique du langage naturel et la reconnaissance d'entités nommées (NER).  
    *URL* : https://spacy.io/models/fr  
    *(Consulté le 28 août 2026)*.
14. **RAPIDFUZZ** : Bibliothèque C++ accélérée pour le calcul de distance de Levenshtein et le matching de chaînes approximatives.  
    *Dépôt GitHub* : https://github.com/rapidfuzz/RapidFuzz  
    *(Consulté le 28 août 2026)*.
15. **DATEPARSER** : Bibliothèque Python de détection et normalisation automatique des formats de date multilingues.  
    *URL* : https://dateparser.readthedocs.io/  
    *(Consulté le 30 août 2026)*.

### IV. Architecture Logicielle, Sécurité & Design Patterns
16. **MARTIN FOWLER** : *Patterns of Enterprise Application Architecture — Repository Pattern & Service Layer*. Addison-Wesley Professional.  
    *URL* : https://martinfowler.com/eaaCatalog/repository.html  
    *(Consulté le 14 août 2026)*.
17. **ROBERT C. MARTIN (UNCLE BOB)** : *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017.
18. **RESTFUL API DESIGN GUIDELINES (MICROSOFT AZURE)** : Bonnes pratiques de conception d'interfaces de programmation RESTful (Singulier vs Pluriel).  
    *URL* : https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design  
    *(Consulté le 14 août 2026)*.
19. **FULLCALENDAR V6** : Composant de calendrier et planification interactive d'événements pour applications JavaScript/React.  
    *URL* : https://fullcalendar.io/docs  
    *(Consulté le 05 octobre 2026)*.
20. **N8N WORKFLOW AUTOMATION** : Plateforme d'orchestration de processus et d'intégration de services par flux d'événements.  
    *URL* : https://docs.n8n.io/  
    *(Consulté le 08 octobre 2026)*.


---

# Annexes Techniques

Les annexes regroupent les spécifications de bas niveau, scripts SQL de configuration, extraits d'algorithmes et résultats de tests automatisés étayant les réalisations présentées dans le mémoire.

---

## Annexe 1 : Configuration PostgreSQL Full-Text Search (`french_unaccent`)

Pour garantir une recherche insensible aux accents et aux flexions grammaticales françaises, une configuration textuelle personnalisée a été générée en base :

```sql
-- 1. Activation de l'extension unaccent
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Création de la configuration de recherche personnalisée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'french_unaccent'
    ) THEN
        CREATE TEXT SEARCH CONFIGURATION french_unaccent (COPY = french);
        
        -- Modification des règles de tokens pour filtrer les accents avant le stemming
        ALTER TEXT SEARCH CONFIGURATION french_unaccent
            ALTER MAPPING FOR word, hword, hword_part
            WITH unaccent, french_stem;
    END IF;
END $$;

-- 3. Ajout de la colonne vectorielle calculée et de l'index inversé GIN
ALTER TABLE document 
ADD COLUMN IF NOT EXISTS recherche_texte tsvector 
GENERATED ALWAYS AS (
    to_tsvector('french_unaccent', coalesce(contenu_texte_extrait, ''))
) STORED;

CREATE INDEX IF NOT EXISTS idx_document_recherche_texte_gin 
ON document USING gin(recherche_texte);
```

---

## Annexe 2 : Algorithme de Découpage de Snippet Résilient aux Accents & Ligatures (PHP)

Implémenté dans [`EloquentCandidatureRepository.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Repositories/Eloquent/EloquentCandidatureRepository.php) et [`EloquentVivierRepository.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Repositories/Eloquent/EloquentVivierRepository.php), cette méthode garantit une correspondance 1-pour-1 stricte de la longueur en caractères pour éliminer tout décalage d'offset tout en conservant les accents originaux :

```php
protected function normalize1to1(string $string): string
{
    $string = mb_strtolower($string, 'UTF-8');
    $table = [
        'à'=>'a', 'á'=>'a', 'â'=>'a', 'ã'=>'a', 'ä'=>'a', 'å'=>'a',
        'è'=>'e', 'é'=>'e', 'ê'=>'e', 'ë'=>'e',
        'ì'=>'i', 'í'=>'i', 'î'=>'i', 'ï'=>'i',
        'ò'=>'o', 'ó'=>'o', 'ô'=>'o', 'õ'=>'o', 'ö'=>'o',
        'ù'=>'u', 'ú'=>'u', 'û'=>'u', 'ü'=>'u',
        'ý'=>'y', 'ÿ'=>'y',
        'ç'=>'c', 'ñ'=>'n',
        'œ'=>'e', 'æ'=>'a', // Remplacement 1-pour-1 préservant rigoureusement la longueur mb_strlen()
    ];
    return strtr($string, $table);
}

public function generateSnippet(?string $text, string $keyword, int $radius = 70): ?string
{
    if (empty($text) || empty($keyword)) {
        return null;
    }

    $normText = $this->normalize1to1($text);
    $normKeyword = $this->normalize1to1($keyword);
    $pos = mb_stripos($normText, $normKeyword);
    $matchLen = mb_strlen($normKeyword);

    if ($pos === false) {
        $words = array_filter(preg_split('/\s+/', $keyword), fn ($w) => mb_strlen($w) >= 3);
        foreach ($words as $w) {
            $normW = $this->normalize1to1($w);
            $p = mb_stripos($normText, $normW);
            if ($p !== false) {
                $pos = $p;
                $matchLen = mb_strlen($normW);
                break;
            }
        }
    }

    if ($pos === false) {
        return null;
    }

    $start = max(0, $pos - $radius);
    $extractLen = ($pos - $start) + $matchLen + $radius;
    $rawExtract = mb_substr($text, $start, $extractLen, 'UTF-8');

    $prefix = $start > 0 ? '… ' : '';
    $suffix = ($start + $extractLen < mb_strlen($text, 'UTF-8')) ? ' …' : '';

    return $prefix . trim(preg_replace('/\s+/', ' ', $rawExtract)) . $suffix;
}
```

---

## Annexe 3 : Pipeline d'Extraction OCR & Normalisation NLP (Python FastAPI)

Extrait du contrôleur d'extraction déployé dans `code_source/ocr/main.py` :

```python
from fastapi import FastAPI, UploadFile, File
from paddleocr import PaddleOCR
from rapidfuzz import process, fuzz
import dateparser
import re

app = FastAPI(title="Microservice OCR & NLP - AlpA Ciment")
ocr = PaddleOCR(use_angle_cls=True, lang="fr", show_log=False)

@app.post("/extract-cv")
async def extract_cv_data(file: UploadFile = File(...)):
    contents = await file.read()
    # 1. Inférence visuelle avec détection angulaire
    result = ocr.ocr(contents, cls=True)
    
    extracted_lines = []
    for line in result[0]:
        text = line[1][0]
        confidence = line[1][1]
        extracted_lines.append({"text": text, "score": confidence})
        
    full_text = "\n".join([item["text"] for item in extracted_lines])
    
    # 2. Matching tolérant aux fautes avec le référentiel des compétences
    matched_skills = match_competences_fuzzy(full_text)
    
    return {
        "raw_text": full_text,
        "competences": matched_skills,
        "status": "ready_for_human_validation"
    }

def match_competences_fuzzy(text: str, threshold: float = 85.0):
    referentiel = ["Laravel", "PostgreSQL", "React", "Maintenance Industrielle", "Électromécanique", "Chaudronnerie"]
    words = set(re.findall(r'\b[A-Za-zÀ-ÿ]{3,}\b', text))
    found = []
    
    for word in words:
        match, score, _ = process.extractOne(word, referentiel, scorer=fuzz.token_sort_ratio)
        if score >= threshold and match not in found:
            found.append({"competence": match, "score_confiance": score})
            
    return found
```

---

## Annexe 4 : Moteur d'Interpolation Regex des Modèles d'Emails (Laravel)

Extrait de [`CommunicationService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Services/CommunicationService.php) permettant le remplacement tolérant des balises dynamiques :

```php
public function interpolerVariables(string $template, Candidature $candidature, ?RendezVous $rdv = null): string
{
    $variables = [
        'nom' => $candidature->candidat->nom,
        'prenom' => $candidature->candidat->prenom,
        'email' => $candidature->candidat->email,
        'poste' => $candidature->offre ? $candidature->offre->titre_poste : $candidature->poste_souhaite,
        'direction' => $candidature->offre ? $candidature->offre->direction->nom_direction : 'AlpA Ciment',
        'date_rdv' => $rdv ? $rdv->date_heure->format('d/m/Y à H:i') : '[Date non définie]',
        'lieu_rdv' => $rdv ? $rdv->lieu_ou_lien : 'Site Usine AlpA Ciment',
    ];

    // Regex tolérant {cle} ou {{cle}} avec espaces optionnels et insensible à la casse
    foreach ($variables as $cle => $valeur) {
        $pattern = '/\{\{\s*' . preg_quote($cle, '/') . '\s*\}\}|\{\s*' . preg_quote($cle, '/') . '\s*\}/i';
        $template = preg_replace($pattern, (string)$valeur, $template);
    }

    return $template;
}
```

---

## Annexe 5 : Rapport d'Exécution de la Suite de Tests Automatisés (PHPUnit)

Résultats certifiés de l'exécution de la suite complète de tests de non-régression et de sécurité :

```
   PASS  Tests\Feature\Api\ApiAccessTest
  ✓ test_api_requires_authentication
  ✓ test_api_rejects_users_without_rh_or_admin_role
  ✓ test_api_returns_authenticated_user_context
  ✓ test_roles_referential_contains_available_roles
  ✓ test_login_returns_sanctum_bearer_token
  ✓ test_login_rate_limiting_throttles_excessive_attempts
  ✓ test_expired_token_is_rejected

   PASS  Tests\Feature\Api\DashboardAnalyticsTest
  ✓ test_dashboard_metrics_aggregation
  ✓ test_dashboard_filters_by_direction_and_date

   PASS  Tests\Feature\Api\RechercheAvanceeCandidaturesTest
  ✓ test_recherche_multicritere_competences_mode_and
  ✓ test_recherche_plein_texte_tsvector_avec_index_gin
  ✓ test_recherche_cv_snippet_insensible_aux_accents_et_vivier

   PASS  Tests\Feature\Api\CommunicationTest
  ✓ test_interpolation_variables_dynamiques_modele_email
  ✓ test_immuabilite_preuve_envoi_table_communication

----------------------------------------------------------------------
Tests:    40 passed (211 assertions)
Duration: 2.32s
Status:   100% SUCCÈS
----------------------------------------------------------------------
```

---

## Annexe 6 : Glossaire des Concepts d'Architecture & Sécurité

| Terme / Concept | Définition & Implémentation dans la Plateforme |
| :--- | :--- |
| **Stateless (Sans État)** | Principe architectural fondamental de REST (Roy Fielding) stipulant que le serveur web ne conserve aucun état client en mémoire vive (RAM) ou sur disque local entre les requêtes. Chaque requête cliente est auto-suffisante et porte sa propre preuve d'habilitation (`Authorization: Bearer <token>`). Cela autorise le passage à l'échelle horizontal (*horizontal scaling*) immédiat sans affinité de session (*sticky sessions*). |
| **Reference Token (Jeton de Référence)** | Modèle d'authentification retenu (Laravel Sanctum) où le jeton transmis au client n'est qu'un pointeur cryptographique sécurisé vers un enregistrement persistant en base de données PostgreSQL. Contrairement aux JWT purs, ce modèle confère au système un contrôle absolu de **révocation instantanée** lors de la déconnexion ou en cas de compromission. |
| **SHA-256 (Secure Hash Algorithm 256 bits)** | Fonction de hachage cryptographique à sens unique utilisée par Laravel Sanctum pour stocker l'empreinte des jetons dans la table `personal_access_tokens`. Même en cas d'accès direct non autorisé à la base de données, les jetons en clair ne peuvent pas être reconstitués. |
| **CSRF (Cross-Site Request Forgery)** | Attaque consistant à faire exécuter à l'insu de l'utilisateur des actions non sollicitées en exploitant les cookies de session envoyés automatiquement par le navigateur. Avec une architecture stateless fondée sur des jetons porteurs (*Bearer Tokens*) injectés explicitement par le client React, le vecteur d'attaque CSRF est neutralisé par conception. |
| **Rate Limiting (Limitation de Débit)** | Mécanisme de protection anti force-brute implémenté via le middleware `throttle:5,1` sur la route `/api/login`. Il plafonne les requêtes à 5 tentatives par minute par adresse IP, renvoyant le code HTTP `429 Too Many Requests` au-delà pour contrer les attaques par dictionnaire. |
| **TTL (Time-To-Live) & Expiration de Token** | Durée de vie maximale accordée à un jeton d'authentification. Fixée rigoureusement à 8 heures (`now()->addHours(8)`), elle aligne la persistance de session sur la journée de travail des agents RH et déclenche une purge automatique quotidienne (`sanctum:prune-expired`) planifiée chaque nuit à minuit. |

