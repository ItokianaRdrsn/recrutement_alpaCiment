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
