# IT UNIVERSITY & ALPHA CIMENT
## MÉMOIRE DE FIN D'ÉTUDES DE LICENCE EN INFORMATIQUE

---

# **Plateforme Centralisée de Recrutement et Gestion Intelligente du Vivier de Talents**
### *Automatisation par OCR, Recherche Plein Texte Multicritère et Traçabilité RH*

**Présenté par :**  
### **RAKOTOARITAHINA Labarre Itokiana Teddy**

**En vue de l'obtention du grade de :**  
Licence en Informatique  
Option : **Développement**

**Date de soutenance :** Novembre, 2026  
**Entreprise d'accueil :** Alpha Ciment Madagascar — Département Informatique & Direction des Ressources Humaines  
**Période de stage :** 12 Août 2026 – Novembre 2026  

---

### **Membres du Jury :**

| Qualité | Nom et Prénoms | Titre / Fonction |
| :--- | :--- | :--- |
| **Président du Jury** | **M. Vahatriniaina RAKOTOMALALA** | Enseignant-Chercheur, IT University |
| **Examinateur** | **M. Mbolatiana Toky RASOAMANANA** | Enseignant-Chercheur, IT University |
| **Encadreur Professionnel** | **M. Hery Mampionona RANDRIAMASY** | Responsable Informatique, Alpha Ciment |

<br>

<p align="center"><strong>© RAKOTOARITAHINA Labarre Itokiana Teddy — Promotion 2026</strong></p>

---

<div style="page-break-after: always;"></div>

## **Table des matières**

- [Liste des tableaux](#liste-des-tableaux)
- [Liste des figures](#liste-des-figures)
- [Glossaire](#glossaire)
- [Avant-propos](#avant-propos)
  - [L’IT University](#lit-university)
  - [L’Entreprise d'accueil : Alpha Ciment](#lentreprise-daccueil--alpha-ciment)
- [Remerciements](#remerciements)
- [Introduction Générale](#introduction-générale)
- [1. Présentation du Projet](#1-présentation-du-projet)
  - [1.1 Contexte et Objectifs du Projet](#11-contexte-et-objectifs-du-projet)
  - [1.2 Planning de Réalisation et Méthodologie Agile / Sprints](#12-planning-de-réalisation-et-méthodologie-agile--sprints)
  - [1.3 Choix Technologiques et Étude Comparative](#13-choix-technologiques-et-étude-comparative)
    - [1.3.1 Système de Gestion de Base de Données (PostgreSQL vs MySQL)](#131-système-de-gestion-de-base-de-données-postgresql-vs-mysql)
    - [1.3.2 Backend Web (Laravel vs Symfony)](#132-backend-web-laravel-vs-symfony)
    - [1.3.3 Frontend Web (React JS vs Vue.js)](#133-frontend-web-react-js-vs-vuejs)
    - [1.3.4 Outil de Conception Graphique et Wireframing (Pencil vs Balsamiq)](#134-outil-de-conception-graphique-et-wireframing-pencil-vs-balsamiq)
    - [1.3.5 Microservice d'IA et OCR (FastAPI vs Flask)](#135-microservice-dia-et-ocr-fastapi-vs-flask)
    - [1.3.6 Moteur de Vision Documentaire (PaddleOCR vs Tesseract)](#136-moteur-de-vision-documentaire-paddleocr-vs-tesseract)
    - [1.3.7 Moteur d'Analyse NLP des CVs (Approche Hybride Souveraine)](#137-moteur-danalyse-nlp-des-cvs-approche-hybride-souveraine)
  - [1.4 Architecture Globale du Système Multi-Tiers](#14-architecture-globale-du-système-multi-tiers)
- [2. Réalisation de l’Application](#2-réalisation-de-lapplication)
  - [2.1 Analyse et Conception](#21-analyse-et-conception)
    - [2.1.1 Analyse de l'Existant](#211-analyse-de-lexistant)
    - [2.1.2 Conception de l'Application](#212-conception-de-lapplication)
      - [2.1.2.1 Conception Affichage et Wireframing](#2121-conception-affichage-et-wireframing)
      - [2.1.2.2 Conception Base de Données (MCD, MLD et Schéma Conceptuel des Vues)](#2122-conception-base-de-données-mcd-mld-et-schéma-conceptuel-des-vues)
      - [2.1.2.3 Conception Métiers et Métriques Logicielles](#2123-conception-métiers-et-métriques-logicielles)
  - [2.2 Développement par Fonctionnalité ou Module](#22-développement-par-fonctionnalité-ou-module)
    - [2.2.1 Gestion des Référentiels et Paramètres](#221-gestion-des-référentiels-et-paramètres)
    - [2.2.2 Gestion des Offres de Recrutement](#222-gestion-des-offres-de-recrutement)
    - [2.2.3 Portail Candidat et Dépôt Multi-Canal](#223-portail-candidat-et-dépôt-multi-canal)
    - [2.2.4 Pipeline RH et Fiche Candidat 360°](#224-pipeline-rh-et-fiche-candidat-360)
    - [2.2.5 Microservice OCR, Extraction IA et Validation RH (*Human-in-the-Loop*)](#225-microservice-ocr-extraction-ia-et-validation-rh-human-in-the-loop)
    - [2.2.6 Vivier de Talents et Moteur de Recherche Plein Texte](#226-vivier-de-talents-et-moteur-de-recherche-plein-texte)
    - [2.2.7 Planification des Entretiens et Agenda FullCalendar](#227-planification-des-entretiens-et-agenda-fullcalendar)
    - [2.2.8 Module de Communication et Modèles d'Emails Dynamiques](#228-module-de-communication-et-modèles-demails-dynamiques)
    - [2.2.9 Authentification, Sécurité Sanctum Stateless et Journal d'Audit](#229-authentification-sécurité-sanctum-stateless-et-journal-daudit)
    - [2.2.10 Studio de Conception d'Affiches de Recrutement](#2210-studio-de-conception-daffiches-de-recrutement)
  - [2.3 État d'Analyse, Statistiques et Tableaux de Bord](#23-état-danalyse-statistiques-et-tableaux-de-bord)
  - [2.4 Problèmes Rencontrés et Solutions Techniques](#24-problèmes-rencontrés-et-solutions-techniques)
- [3. Évaluation du Projet et Connaissances Acquises](#3-évaluation-du-projet-et-connaissances-acquises)
  - [3.1 Bilan pour l'Entreprise](#31-bilan-pour-lentreprise)
  - [3.2 Bilan Personnel et Professionnel](#32-bilan-personnel-et-professionnel)
  - [3.3 Extensions et Évolutions Futures](#33-extensions-et-évolutions-futures)
- [Conclusion Générale](#conclusion-générale)
- [Bibliographie et Webographie](#bibliographie-et-webographie)
- [Annexes Techniques](#annexes-techniques)

---

<div style="page-break-after: always;"></div>

## **Liste des tableaux**

* **Tableau 1** : Tableau comparatif PostgreSQL et MySQL
* **Tableau 2** : Tableau comparatif Laravel et Symfony
* **Tableau 3** : Tableau comparatif React JS et Vue.js
* **Tableau 4** : Tableau comparatif Pencil et Balsamiq
* **Tableau 5** : Tableau comparatif FastAPI et Flask
* **Tableau 6** : Tableau comparatif PaddleOCR, Tesseract et EasyOCR
* **Tableau 7** : Tableau comparatif des approches de parsing RH (Regex vs LLM Cloud vs Hybride Local)
* **Tableau 8** : Planning récapitulatif des 8 Sprints de développement
* **Tableau 9** : Métriques logicielles et volumétrie du code du projet
* **Tableau 10** : Glossaire synthétique des concepts d'architecture et de sécurité

---

<div style="page-break-after: always;"></div>

## **Liste des figures**

* **Figure 1** : Diagramme de Gantt global du projet (Sprints 0 à 7)
* **Figure 2** : Architecture globale multi-tiers du système
* **Figure 3** : Le patron d'architecture backend en 5 couches (Clean Architecture)
* **Figure 4** : Conception de l'interface utilisateur avec l'outil Pencil
* **Figure 5** : Modèle Conceptuel des Données (MCD)
* **Figure 6** : Modèle Physique des Données (MPD - 22 tables relationnelles)
* **Figure 7** : Schéma conceptuel des Vues SQL analytiques
* **Figure 8** : Formulaire d'insertion d'une direction et d'un domaine d'activité
* **Figure 9** : Popup de validation et confirmation d'enregistrement
* **Figure 10** : Formulaire de création et paramétrage d'une offre d'emploi
* **Figure 11** : Liste des offres avec statuts de publication
* **Figure 12** : Portail public de dépôt de candidature en ligne
* **Figure 13** : Formulaire de saisie manuelle RH (Guichet Usine)
* **Figure 14** : Pipeline de sélection RH et tableau de suivi des statuts
* **Figure 15** : Fiche Candidat 360° avec aperçu direct du CV
* **Figure 16** : Écran d'extraction OCR et interface de validation humaine (*Human-in-the-Loop*)
* **Figure 17** : Moteur de recherche multicritère du Vivier de Talents
* **Figure 18** : Affichage d'un résultat avec extrait contextuel surligné (*cv_snippet*)
* **Figure 19** : Agenda interactif des entretiens et tests techniques (FullCalendar)
* **Figure 20** : Formulaire de planification d'un entretien avec détection de conflits
* **Figure 21** : Éditeur de modèles d'e-mails avec interpolation dynamique des balises
* **Figure 22** : Journal d'audit immuable des actions RH (*audit_logs*)
* **Figure 23** : Studio graphique de conception et génération d'affiches d'offres
* **Figure 24** : Tableau de bord décisionnel RH - Cartes KPIs stratégiques
* **Figure 25** : Graphique de répartition des candidatures par statut
* **Figure 26** : Graphique de volume mensuel des candidatures reçues
* **Figure 27** : Graphique du taux de transformation et d'alimentation du Vivier

---

<div style="page-break-after: always;"></div>

## **Glossaire**

* **ACID (Atomicité, Cohérence, Isolation, Durabilité)** : Propriétés garantissant la fiabilité et l'intégrité absolue des transactions d'une base de données relationnelle.
* **API REST (Representational State Transfer)** : Norme d'architecture logicielle permettant l'échange de données entre applications hétérogènes via les méthodes HTTP (GET, POST, PUT, DELETE) et des représentations JSON.
* **Bearer Token** : Jeton cryptographique transmis dans l'en-tête HTTP `Authorization: Bearer <token>` servant de preuve d'identité stateless pour consommer une API sécurisée.
* **Clean Architecture** : Modèle architectural favorisant la séparation stricte des responsabilités (Présentation, Application, Domaine, Persistance) pour rendre le code indépendant des frameworks et hautement testable.
* **DTO (Data Transfer Object)** : Objet logiciel utilisé pour acheminer des données encapsulées entre les couches logicielles sans exposer la structure interne des tables de la base de données.
* **ERP (Enterprise Resource Planning)** : Progiciel de gestion intégré centralisant l'ensemble des processus opérationnels d'une organisation (ex. Allpro / SAP).
* **FTS (Full-Text Search)** : Technique d'indexation et d'interrogation plein texte permettant des recherches lexicales ultra-rapides et tolérantes au sein de documents volumineux.
* **GIN (Generalized Inverted Index)** : Type d'index spécialisé dans PostgreSQL conçu pour optimiser les requêtes sur des structures composites comme les vecteurs `tsvector` ou les documents `JSONB`.
* **Human-in-the-Loop (HITL)** : Principe d'ingénierie logicielle où un opérateur humain (ici le recruteur RH) supervise, vérifie ou corrige systématiquement les prédictions d'un modèle d'IA avant tout enregistrement en base.
* **JSONB** : Format binaire décomposé de stockage JSON dans PostgreSQL, offrant des performances d'indexation et d'interrogation directe considérablement plus rapides que le JSON texte.
* **Levenshtein (Distance de)** : Métrique algorithmique mesurant la similarité entre deux chaînes de caractères par le nombre minimal d'opérations d'édition nécessaires pour transformer l'une en l'autre.
* **NER (Named Entity Recognition)** : Branche du traitement automatique du langage naturel (NLP) visant à identifier et classifier des entités textuelles (noms, entreprises, compétences, diplômes).
* **OCR (Optical Character Recognition)** : Technologie de reconnaissance optique extrayant le texte typographié ou manuscrit contenu dans des images ou documents numérisés.
* **PaddleOCR** : Moteur open-source d'OCR basé sur des réseaux de neurones profonds (Deep Learning), hautement efficace pour segmenter des documents multi-colonnes.
* **Pencil** : Outil logiciel open-source de prototypage et de création de maquettes d'interfaces utilisateur (wireframes).
* **RapidFuzz** : Bibliothèque de calcul haute performance en C++ pour le matching flou et la recherche approximative de chaînes de caractères.
* **Repository Pattern** : Patron de conception abstrayant la couche d'accès aux données du backend afin d'isoler la logique métier des requêtes SQL spécifiques.
* **Sanctum** : Package Laravel assurant une gestion sécurisée de jetons d'API (tokens d'accès personnels) sans état de session serveur.
* **SPA (Single Page Application)** : Application web dont l'interface est générée dynamiquement côté client (React), évitant le rechargement complet de la page HTML lors de la navigation.
* **tsvector / tsquery** : Types de données natifs de PostgreSQL pour la recherche plein texte : `tsvector` stocke les lexèmes normalisés avec leurs positions, tandis que `tsquery` formule l'expression de recherche logique.
* **unaccent** : Extension PostgreSQL supprimant les accents et signes diacritiques pour permettre des recherches textuelles strictes et insensibles aux accents.
* **Wireframe** : Maquette visuelle simplifiée définissant la disposition des éléments et l'ergonomie d'une interface avant son développement graphique.

---

<div style="page-break-after: always;"></div>

## **Avant-propos**

Le présent mémoire expose l'ensemble des travaux d'ingénierie logicielle réalisés lors de mon stage de fin d'études en vue de l'obtention du grade de **Licence en Informatique**, Option **Développement**, au sein de l’**IT University (ITU)**. Ce stage a été effectué au **Département Informatique** de la société **Alpha Ciment Madagascar**, en étroite coordination avec la **Direction des Ressources Humaines**, du 12 Août 2026 à Novembre 2026.

Afin de situer rigoureusement le cadre institutionnel et industriel de ce travail, je présente ci-après l’IT University ainsi que mon entreprise d’accueil.

### **L’IT University**

Fondée en 2011, l’**IT University (ou ITU)** est un établissement privé d’enseignement supérieur spécialisé en informatique de référence à Madagascar, formant les jeunes bacheliers, de préférence scientifiques :

• **En trois ans**, pour l’obtention d’une :
  * **Licence**, option *Développement*, *Réseaux et Bases de Données*, ou *Web et Design* ;
  * **Licence**, option *Graphic Design* ou *Communication Digitale*.

• **En cinq ans**, pour l’obtention d’un :
  * **Master MBDS** en coopération avec l’Université Côte d’Azur à Nice Sophia Antipolis – France ;
  * **Master BIHAR** en coopération avec l’ESTIA du Pays Basque – France.

Étant une formation professionnalisante d'excellence, l’ITU a tissé des liens étroits avec ses partenaires industriels, dont l’opérateur convergent **YAS** et la majorité des grandes entreprises et institutions du secteur des Technologies de l'Information et de la Communication (TIC). Ces partenaires participent activement à la formation par la fourniture de connectivité haut débit, l'organisation de conférences techniques par des experts, ou l’accueil des étudiants lors de stages de mise en situation réelle. Un nombre important de ces partenaires recrute directement les étudiants à la sortie de l’école. D’autre part, le corps professoral de l’ITU est constitué intégralement de spécialistes et de professionnels hautement qualifiés et obligatoirement en activité dans leurs domaines respectifs.

### **L’Entreprise d'accueil : Alpha Ciment**

Depuis plus de **75 ans**, **ALPHA CIMENT** façonne le paysage architectural de Madagascar et contribue fièrement à son développement économique en tant qu’**unique cimenterie locale**, affirmant son rôle d’acteur industriel majeur passionnément ancré dans le territoire malgache. Son histoire est celle d’une entreprise qui a su continuellement évoluer, se réinventer et transformer ses ambitions en réalisations concrètes avec un objectif constant : produire des ciments de haute qualité adaptés aux exigences spécifiques des bâtisseurs malgaches tout en créant une valeur pérenne pour ses partenaires.

De génération en génération, ALPHA CIMENT a bâti un socle robuste de savoir-faire, d’expertises techniques et d’innovations industrielles qui constitue aujourd’hui sa principale force et le socle de la confiance que lui accordent ses clients, depuis les projets d’habitat individuel jusqu’aux chantiers d’infrastructures d’envergure nationale (ponts, barrages, axes routiers).

Cette trajectoire est jalonnée d'étapes décisives, notamment le tournant historique du **12 février 2024** marquant l’intégration officielle de l’entreprise au sein du groupe mauricien **GAMMA Civic Ltd** et du groupe indonésien **CEMINDO GEMILAND**, une alliance stratégique ouvrant une ère nouvelle d’excellence technologique, d'investissements et de développement régional. Parallèlement, ALPHA CIMENT s’inscrit depuis 2002 dans une démarche continue d’amélioration et de responsabilité sociétale certifiée par les normes internationales **ISO 9001** pour le management de la qualité et **ISO 14001** pour le respect de l’environnement, traduisant son engagement durable au service de ses collaborateurs, de ses clients et des générations futures.

L’entreprise dispose de plusieurs implantations stratégiques à Madagascar :
* Son **siège social principal** est implanté à **Antananarivo** (quartier de Tsaralalàna), regroupant la Direction Générale, le Département Informatique et la Direction des Ressources Humaines ;
* Deux complexes industriels majeurs assurent la fabrication et l'ensachage du ciment : l’**usine d'Ibity** (près d’Antsirabe) et l’**usine de Tamatave**.

Aujourd’hui, ALPHA CIMENT combine standards internationaux, gouvernance industrielle moderne et savoir-faire local pour garantir des produits fiables, compétitifs et conformes aux exigences les plus rigoureuses du marché.

---

<div style="page-break-after: always;"></div>

## **Remerciements**

Avant toutes choses, je souhaiterais exprimer ma profonde gratitude envers **Dieu Tout-Puissant**, source d'inspiration, de force et de persévérance, qui m’a accordé la santé et le discernement nécessaires pour mener à bien ce travail de fin d'études.

Je tiens à exprimer ma reconnaissance chaleureuse et sincère envers toutes les personnes qui ont contribué, de près comme de loin, à la réalisation du présent mémoire :

* **Les membres du jury** :
  * **Monsieur Vahatriniaina RAKOTOMALALA**, Enseignant-Chercheur à l'IT University, qui me fait l'honneur de présider ce jury de soutenance ;
  * **Monsieur Mbolatiana Toky RASOAMANANA**, Enseignant-Chercheur à l'IT University, pour son regard expert, sa rigueur méthodologique et ses précieux conseils ;  
  Je leur témoigne ma gratitude pour le temps qu’ils ont bien voulu consacrer à l’évaluation de ce travail et pour leurs observations constructives qui ont permis de perfectionner la qualité de cette étude.

* **Monsieur Hery Mampionona RANDRIAMASY**, mon encadreur professionnel et Responsable Informatique au sein d'Alpha Ciment, pour son encadrement rigoureux, sa disponibilité constante, ses directives techniques éclairées et la confiance qu'il m'a témoignée tout au long de mon stage.

* **La Direction des Ressources Humaines d'Alpha Ciment**, pour son accueil bienveillant, son écoute attentive lors des recueils de besoins et ses retours métiers essentiels qui ont permis de façonner une application en parfaite adéquation avec la réalité du terrain industriel.

* **Le corps enseignant et le personnel administratif de l'IT University**, pour la formation d’excellence qu’ils m’ont dispensée durant ces trois années de Licence et pour leur encadrement humain et pédagogique constant.

* **Mes collègues de travail et amis de promotion**, pour la bonne ambiance, l’esprit de solidarité, les partages d’expériences et les encouragements continus qui ont enrichi cette expérience.

* **Ma famille**, particulièrement mes parents et mes proches, pour leur amour inconditionnel, leurs sacrifices constants et leurs encouragements quotidiens qui ont constitué le moteur de ma réussite.

À vous tous, j’adresse un grand et sincère Merci.

---

<div style="page-break-after: always;"></div>

## **Introduction**

L’essentiel du travail que j’ai réalisé a porté sur le thème : **« Digitalisation du processus de recrutement »** au sein de la société **Alpha Ciment Madagascar**.

Dans le domaine de l'informatique contemporaine et du design applicatif, la transformation numérique des processus métiers représente un levier majeur d'efficacité, de rigueur et d'évolutivité. Elle mobilise la complémentarité d'architectures web modernes (APIs REST sécurisées, front-end réactif), le traitement automatisé de données non structurées par vision artificielle et traitement du langage naturel (OCR, reconnaissance d'entités nommées NER), ainsi que l'indexation plein texte haute performance. Appliquée à **Alpha Ciment**, unique cimenterie industrielle de Madagascar caractérisée par une gouvernance multisite (siège d'Antananarivo à Tsaralalàna, usines de production d'Ibity et de Tamatave), la gestion optimale du capital humain constitue un impératif stratégique pour attirer, évaluer et mobiliser rapidement les compétences techniques et administratives nécessaires à la continuité opérationnelle.

Auparavant, la gestion des recrutements reposait sur des pratiques manuelles et hétérogènes : dépôt physique de dossiers papier aux postes de garde des usines, dispersion des candidatures dans les boîtes de messagerie électroniques individuelles des recruteurs et consolidation manuelle sur des tableurs bureautiques isolés. Cette organisation engendrait des délais de traitement excessifs, des risques permanents d'omission et de perte documentaire, une absence totale de traçabilité des étapes d'évaluation et, surtout, l'oubli définitif des profils qualifiés non retenus immédiatement pour un poste donné, faute d'un vivier de talents consultable.

Afin de pallier ces défaillances et de doter l'entreprise d'une solution pérenne, les résultats essentiels de mon travail durant ce stage s'articulent autour des réalisations suivantes :
* **Déploiement d'une plateforme web centralisée (Laravel 12 / React 19)** : Dématérialisation globale de l'acquisition des candidatures (portail candidat public et guichet de numérisation d'usine) et pilotage collaboratif du flux de sélection selon un pipeline transparent en six statuts normalisés.
* **Développement d'un microservice d'ingestion documentaire intelligente (FastAPI / OCR / LLM-NER)** : Extraction sémantique automatisée des coordonnées, expériences et compétences, assortie d'une normalisation rigoureuse des niveaux d'études et d'une validation humaine supervisée (*Human-in-the-Loop*).
* **Mise en place d'un Vivier de Talents à recherche plein texte (PostgreSQL FTS)** : Indexation lexicale avancée (*tsvector* / *tsquery*), totalement insensible aux accents et aux fautes typographiques courantes, offrant un temps de réponse instantané et la surbrillance contextuelle des correspondances.
* **Automatisation du planning d'entretiens et des communications RH** : Agenda interactif partagé (FullCalendar) pour la planification sans conflit des épreuves, moteur d'envoi d'e-mails dynamiques personnalisés et historisation immuable des actions.
* **Conception d'un tableau de bord décisionnel et d'outils visuels intégrés** : Visualisation en temps réel des indicateurs clés de performance (taux de conversion, volumes de candidatures) et studio graphique de conception d'affiches d'offres d'emploi.

Le présent mémoire est structuré en trois grands chapitres :
* **Le Chapitre 1 (Présentation du Projet)** expose le cadre organisationnel d'Alpha Ciment, la démarche méthodologique Agile Scrum (8 Sprints de 71 jours ouvrés), l'analyse des besoins fonctionnels et l'étude comparative ayant guidé le choix des technologies.
* **Le Chapitre 2 (Réalisation de l'Application)** détaille l'ingénierie logicielle mise en œuvre : conception ergonomique (wireframes), modélisation relationnelle (MCD/MPD sur 22 tables), architecture multi-tiers, implémentation des modules et résolution des verrous techniques critiques.
* **Le Chapitre 3 (Évaluation du Projet et Connaissances Acquises)** dresse le bilan qualitatif et quantitatif des tests, analyse l'adoption par les équipes RH, synthétise les compétences techniques et humaines acquises et trace les perspectives d'évolution future.

---

<div style="page-break-after: always;"></div>

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

---

<div style="page-break-after: always;"></div>

# Chapitre 2 : Réalisation de l’Application

Ce chapitre constitue le cœur technique du mémoire. Il détaille la démarche d'ingénierie logicielle suivie pour concevoir et implémenter la plateforme de recrutement d'Alpha Ciment : modélisation rigoureuse des données, développement modulaire selon la Clean Architecture, métriques logicielles du code source, mise en œuvre des algorithmes de vision et de recherche plein texte, et retour d'expérience approfondi sur les défis techniques résolus.

---

## 2.1 Analyse et Conception

La réalisation de notre application s'est articulée autour de trois grandes phases méthodologiques :
1. **L'analyse de l'existant** pour diagnostiquer les goulets d'étranglement organisationnels et formaliser les besoins métiers des recruteurs d'Alpha Ciment ;
2. **La conception architecturale et fonctionnelle** afin de modéliser la structure ergonomique (wireframes), le modèle de données relationnel et les patrons de conception logiciels ;
3. **Le développement par composants** en appliquant une stricte séparation des responsabilités.

### 2.1.1 Analyse de l'Existant

Avant l'engagement de ce projet, les opérations de recrutement au sein d'Alpha Ciment étaient réparties de façon hétérogène entre plusieurs outils non interconnectés :
* **Réception dispersée des dossiers** : Les candidatures arrivaient soit sous forme de dossiers papier remis en mains propres aux postes de garde des usines d'Ibity et Tamatave, soit par e-mails envoyés directement aux adresses individuelles des responsables RH au siège de Tsaralalàna.
* **Suivi manuel sur fichiers tableurs (Excel)** : Les chargés de recrutement tenaient des listes séparées sur tableurs pour noter les coordonnées des candidats. Cette dispersion entraînait de fréquentes redondances de saisie, des risques d'écrasement de données et une absence totale de centralisation.
* **Perte irrémédiable des profils qualifiés** : Dès lors qu'un recrutement était clôturé, l'ensemble des candidats présélectionnés mais non retenus pour le poste final était classé dans des archives inaccessibles. Lorsqu'un besoin analogue se présentait quelques mois plus tard, le service RH ne disposait d'aucun moyen de retrouver ces compétences, imposant la publication d'une nouvelle offre coûteuse.
* **Absence d'historique et de traçabilité** : Aucune trace immuable ne permettait de vérifier quel recruteur avait convoqué un candidat, à quelle date un entretien s'était tenu, ou quel motif précis avait justifié le refus d'une candidature.

Face à ce constat, la conception d'une plateforme web centralisée, capable de fédérer les dépôts en ligne et les dépôts papier, d'automatiser l'extraction documentaire et de bâtir un Vivier de Talents permanent, est devenue une nécessité opérationnelle absolue.

---

### 2.1.2 Conception de l'Application

La conception constitue une étape fondamentale préalable à tout codage. Elle garantit que l'architecture logicielle réponde avec précision aux exigences de l'entreprise tout en évitant les refontes structurelles coûteuses.

#### 2.1.2.1 Conception Affichage et Wireframing

La conception de l'affichage permet de définir l'ergonomie, la hiérarchie visuelle et la navigation des utilisateurs avant le développement React. Elle a été réalisée à l'aide de l'outil de maquettage open-source **Pencil**.

L'application web est structurée autour de **14 interfaces principales** :
1. Page de connexion administrateur et recruteur RH.
2. Portail public de consultation des offres d'emploi disponibles.
3. Formulaire public de candidature sur offre.
4. Formulaire public de candidature spontanée catégorisée.
5. Tableau de bord décisionnel RH (KPIs et statistiques graphiques).
6. Module de gestion des référentiels (Directions, Domaines, Compétences).
7. Formulaire de création et paramétrage d'une offre d'emploi.
8. Liste de pilotage des offres publiées et clôturées.
9. Guichet de saisie manuelle RH pour les dossiers papier de l'usine.
10. Pipeline global de sélection RH (tableau de bord des statuts).
11. Fiche Candidat 360° avec visualiseur direct de CV PDF.
12. Interface de validation humaine de l'OCR (*Human-in-the-Loop*).
13. Moteur de recherche multicritère du Vivier de Talents.
14. Agenda interactif de planification des entretiens (FullCalendar).

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                          MAQUETTE PENCIL (Extrait)                     │
 │ ┌───────────────────────────────────┬────────────────────────────────┐ │
 │ │ [Alpha Ciment] - Vivier de Talents│ Connecté : Recruteur RH (Site) │ │
 │ ├───────────────────────────────────┴────────────────────────────────┤ │
 │ │ Filtres : [Direction: Usine ▼] [Domaine: Maintenance ▼] [FTS: ....]│ │
 │ ├────────────────────────────────────────────────────────────────────┤ │
 │ │ Candidat        │ Compétences clés           │ Statut   │ Action   │ │
 │ │ Jean R.         │ Électromécanique, Haute T. │ Vivier   │ [Voir]   │ │
 │ │ Sarah M.        │ Chimie industrielle, ISO   │ Entretien│ [Voir]   │ │
 │ └────────────────────────────────────────────────────────────────────┘ │
 └────────────────────────────────────────────────────────────────────────┘
```
*Figure 4 : Extrait de la conception de l'interface utilisateur avec Pencil*

---

#### 2.1.2.2 Conception Base de Données (MCD, MLD et Schéma Conceptuel des Vues)

La base de données relationnelle a été modélisée pour garantir une intégrité référentielle stricte (3FN) tout en supportant les volumes massifs de texte générés par la reconnaissance optique. Elle est structurée autour de **22 tables interconnectées** et enrichie de vues analytiques optimisées.

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
*Figure 5 : Modèle Conceptuel des Données (MCD)*

#### Les 22 Tables de la Base de Données (MPD) :
1. `utilisateurs` : Comptes des recruteurs et administrateurs RH.
2. `roles` : Rôles du système (Administrateur RH, Recruteur, Observateur).
3. `utilisateur_role` : Association utilisateur-rôle.
4. `directions` : Directions de l'entreprise (Usine Ibity, Usine Tamatave, Siège Tsaralalàna, Direction Financière, etc.).
5. `domaines` : Domaines d'activité rattachés à chaque direction.
6. `statuts_offre` : Statuts d'une offre (Brouillon, Publiée, Clôturée).
7. `offres` : Fiches de poste publiées avec missions et prérequis.
8. `competences` : Référentiel des compétences techniques et comportementales.
9. `offre_competence` : Compétences requises pour chaque offre.
10. `candidats` : Dossier individuel identifié de façon unique par son e-mail.
11. `statuts_candidature` : Les 6 statuts normalisés du pipeline RH.
12. `candidatures` : Postulations rattachées soit à une offre, soit spontanées.
13. `candidat_competence` : Compétences validées attribuées au candidat.
14. `documents` : Fichiers téléversés (CV, lettre, scans) avec vecteur `recherche_texte`.
15. `cv_extractions_ocr` : Données brutes JSONB extraites par FastAPI.
16. `historique_statuts_candidature` : Piste d'audit des changements d'états.
17. `types_rendez_vous` : Catégories de rendez-vous (Entretien RH, Test Technique, Visio).
18. `statuts_rendez_vous` : États des convocations (Planifié, Confirmé, Effectué, Annulé).
19. `rendez_vous` : Événements d'agenda liant candidat, recruteur, date et lieu.
20. `modeles_emails` : Modèles d'emails personnalisables avec balises dynamiques.
21. `communications` : Copie immuable de chaque courriel expédié au candidat.
22. `audit_logs` : Journal d'audit horodaté des actions sensibles du système.

*Figure 6 : Modèle Physique des Données (MPD - 22 tables)*

#### Schéma Conceptuel des Vues SQL :
Pour alléger les requêtes du tableau de bord et du moteur de recherche du Vivier, des vues SQL spécialisées ont été mises en œuvre :
* `v_candidatures_synthese` : Consolide les informations du candidat, de son offre, de sa direction et de son dernier statut à jour.
* `v_vivier_talents` : Filtre l'ensemble des candidats dont l'indicateur `dans_vivier = true`, regroupant leurs compétences sous forme de tableau agrégé (`array_agg`) et leur dernier document textuel indexé.
* `v_stats_mensuelles_recrutement` : Calcule les agrégats mensuels de candidatures reçues, de taux de conversion et de délais moyens d'évaluation.

*Figure 7 : Schéma conceptuel des Vues SQL analytiques*

---

#### 2.1.2.3 Conception Métiers et Métriques Logicielles

Conformément aux principes de la Clean Architecture, 100% de la logique métier réside dans la couche applicative de Laravel, sans recourir à des triggers masqués en base de données.

### Tableau 9 : Métriques logicielles et volumétrie du code du projet

| Composant Architectural | Nombre Réalisé | Responsabilité et Description |
| :--- | :---: | :--- |
| **Tables de Base de Données (PostgreSQL)** | **22** | Modèle 3FN avec types JSONB et vecteurs tsvector |
| **Modèles Eloquent (ORM Laravel)** | **20** | Entités de données et relations objet |
| **Contrôleurs REST (Thin Controllers)** | **14** | Aiguillage HTTP REST sans logique métier |
| **FormRequests (Validation HTTP)** | **18** | Validation stricte des données entrantes |
| **Services Métiers (Couche Application)** | **12** | Logique applicative, workflows et transactions `DB::transaction` |
| **Repositories (Abstraction SGBD)** | **10** | Requêtes SQL optimisées et isolation de la persistance |
| **API Resources (DTOs JSON)** | **16** | Sérialisation normalisée des réponses pour React |
| **Pages & Vues Principales (React SPA)** | **14** | Écrans riches et responsives |
| **Composants Réutilisables React** | **35+** | Modales, badges, cartes, visualiseur de CV |
| **Tests Automatisés (PHPUnit)** | **37** | Couverture intégrale de 194 assertions réussies |

---

## 2.2 Développement par Fonctionnalité ou Module

### 2.2.1 Gestion des Référentiels et Paramètres

Cette fonctionnalité assure la gestion administrative des structures d'Alpha Ciment : création des Directions (Usine, Siège, Supply Chain), des Domaines d'activité rattachés, et du catalogue des Compétences.

Le responsable RH renseigne un code et un libellé. Dès la saisie validée, un popup modal de confirmation s'affiche demandant la validation de l'opération afin d'éviter toute insertion accidentelle dans le référentiel d'entreprise.

*Figure 8 : Formulaire d'insertion d'une direction et d'un domaine d'activité*  
*Figure 9 : Popup de validation et confirmation d'enregistrement*

---

### 2.2.2 Gestion des Offres de Recrutement

Ce module permet de rédiger et publier les avis de recrutement pour l'usine ou les bureaux. Le recruteur renseigne l'intitulé du poste, la direction de rattachement, le lieu de travail (Ibity, Tamatave ou Tsaralalàna), la description des missions, le niveau d'études minimal et les compétences techniques attendues.

L'offre transite selon une machine à états stricte :
$$\text{Brouillon} \longrightarrow \text{Publiée} \longrightarrow \text{Clôturée}$$

*Figure 10 : Formulaire de création et paramétrage d'une offre d'emploi*  
*Figure 11 : Liste des offres avec statuts de publication*

---

### 2.2.3 Portail Candidat et Dépôt Multi-Canal

Le portail d'acquisition permet de capter les candidatures à travers trois canaux distincts :
1. **Postulation en ligne sur une offre publiée** : Formulaire interactif permettant au candidat de renseigner ses coordonnées et de téléverser son CV (PDF ou image).
2. **Candidature spontanée** : Le candidat choisit sa direction et son domaine de prédilection.
3. **Guichet de saisie manuelle RH (Site Usine)** : Interface réservée aux recruteurs pour numériser et saisir les dossiers déposés physiquement aux portes des usines, en attribuant la mention `canal_depot = 'rh_manuel'`.

**Algorithme de dédoublonnage automatique** : Dès la soumission, le système vérifie si l'adresse e-mail existe déjà dans la table `candidats`. Si le candidat est connu, la nouvelle candidature est automatiquement rattachée à son profil existant, évitant ainsi la prolifération de dossiers multiples.

*Figure 12 : Portail public de dépôt de candidature en ligne*  
*Figure 13 : Formulaire de saisie manuelle RH (Guichet Usine)*

---

### 2.2.4 Pipeline RH et Fiche Candidat 360°

Le pipeline RH permet aux équipes de recrutement de suivre visuellement la progression de chaque dossier à travers six étapes normalisées :
$$\text{Reçue} \longrightarrow \text{Présélectionnée} \longrightarrow \text{Test Technique} \longrightarrow \text{Entretien} \longrightarrow \begin{cases} \text{Retenue (Embauche)} \\ \text{Non retenue} \end{cases}$$

Chaque changement de statut exige un commentaire obligatoire et horodate l'identité du recruteur dans `historique_statuts_candidature`.

La **Fiche Candidat 360°** centralise l'intégralité des données en un seul écran :
* État civil, téléphone et adresse vérifiés ;
* **Visualiseur direct de CV** permettant de lire le document PDF dans l'interface sans téléchargement ;
* Chronologie des étapes passées et motifs des décisions ;
* Historique des rendez-vous et des courriels adressés ;
* Bouton d'action directe pour basculer le profil dans le Vivier de Talents (`dans_vivier = true`).

*Figure 14 : Pipeline de sélection RH et tableau de suivi des statuts*  
*Figure 15 : Fiche Candidat 360° avec aperçu direct du CV*

---

### 2.2.5 Microservice OCR, Extraction IA et Validation RH (*Human-in-the-Loop*)

Ce module automatise l'analyse des pièces jointes pour alimenter la base de données sans obliger le recruteur à tout ressaisir manuellement :
1. Le fichier téléversé est transmis via une requête HTTP asynchrone au microservice **FastAPI** (port 8001).
2. Le moteur de vision **PaddleOCR (PP-OCRv4)** détecte l'orientation de la page et extrait les blocs textuels.
3. Le module NLP (**spaCy** et **RapidFuzz**) identifie les sections clés (Formations, Expériences) et confronte les mots extraits au référentiel officiel des compétences de l'entreprise via une distance de Levenshtein optimisée.
4. Les données structurées sont renvoyées sous forme d'un objet JSON stocké dans la table `cv_extractions_ocr`.
5. **Principe Human-in-the-Loop** : L'écran RH affiche les données pré-remplies en vis-à-vis du document original. Le recruteur valide ou corrige chaque champ avant d'enregistrer définitivement les informations en base.

*Figure 16 : Écran d'extraction OCR et interface de validation humaine*

---

### 2.2.6 Vivier de Talents et Moteur de Recherche Plein Texte

Le Vivier de Talents est la base documentaire de tous les profils qualifiés conservés pour les futurs recrutements d'Alpha Ciment.

Il dispose d'un moteur de recherche à deux niveaux :
* **Filtrage multicritère relationnel** : Recherche combinée par Direction, Domaine, Niveau d'études et Compétences requises (avec opérateur booléen ET ou OU).
* **Recherche Plein Texte (FTS) instantanée dans le texte des CVs** : Exploitation de la colonne `recherche_texte tsvector` sous PostgreSQL indexée par un index inversé généralisé `GIN`. L'extension `french_unaccent` garantit qu'une recherche sur `"mecanicien"` renvoie immédiatement les CVs contenant `"mécanicien"`, `"Mécanicien"` ou `"MÉCANICIEN"`.
* **Affichage de l'Extrait Contextuel (`cv_snippet`)** : L'interface affiche en temps réel la phrase exacte du CV où le mot-clé a été trouvé, entouré de ses mots voisins en surbrillance.

*Figure 17 : Moteur de recherche multicritère du Vivier de Talents*  
*Figure 18 : Affichage d'un résultat avec extrait contextuel surligné (cv_snippet)*

---

### 2.2.7 Planification des Entretiens et Agenda FullCalendar

Pour mettre fin aux conflits d'horaires et aux oublis, ce module intègre la bibliothèque interactive **FullCalendar** :
* Vue calendaire par mois, semaine ou journée ;
* Planification d'épreuves (Tests écrits, Tests pratiques d'atelier en usine, Entretiens RH au siège, Visio-conférences) ;
* Détection automatique des chevauchements de créneaux pour un même recruteur ;
* Mise à jour par glisser-déposer (*drag-and-drop*) synchronisée en temps réel avec la table `rendez_vous`.

*Figure 19 : Agenda interactif des entretiens et tests techniques (FullCalendar)*  
*Figure 20 : Formulaire de planification d'un entretien avec détection de conflits*

---

### 2.2.8 Module de Communication et Modèles d'Emails Dynamiques

Ce module automatise les échanges tout en conservant une tonalité professionnelle :
* Gestion de modèles d'e-mails types : *Accusé de réception de candidature*, *Convocation à un test technique*, *Convocation à un entretien*, *Notification de mise en vivier*, *Refus bienveillant*.
* **Moteur d'interpolation dynamique** : Remplacement automatique des balises `{nom}`, `{prenom}`, `{poste}`, `{date_rdv}`, `{lieu_rdv}` par les valeurs réelles du candidat lors de l'envoi.
* **Traçabilité juridique immuable** : Chaque e-mail expédié est consigné avec son texte intégral, son expéditeur et son horodatage exact dans la table `communications`.

*Figure 21 : Éditeur de modèles d'e-mails avec interpolation dynamique des balises*

---

### 2.2.9 Authentification, Sécurité Sanctum Stateless et Journal d'Audit

La sécurité et la protection des données personnelles des candidats reposent sur des standards cryptographiques stricts :
* **Architecture REST 100% Stateless par Bearer Tokens (Laravel Sanctum)** :
  * Déconnexion totale des sessions cookies : chaque requête React transmet le header `Authorization: Bearer <token>`.
  * Hachage **SHA-256** unidirectionnel des jetons dans la table `personal_access_tokens` : aucun token n'est stocké en clair.
  * **Durée de validité de 8 heures** (`expires_at`), alignée sur la journée de travail des équipes RH, avec révocation immédiate lors du clic sur Déconnexion.
  * Purge programmée quotidienne des jetons périmés à minuit (`sanctum:prune-expired`).
  * **Protection anti-bruteforce (Rate Limiting)** : La route `/api/login` est verrouillée par `throttle:5,1`, rejetant toute attaque par dictionnaire après 5 essais infructueux (HTTP `429 Too Many Requests`).
* **Contrôle d'accès basé sur les rôles (RBAC)** : Barrières logicielles étanches entre Administrateurs, Recruteurs et simples Observateurs.
* **Journal d'Audit Immuable (`audit_logs`)** : Chaque action sensible (création d'offre, changement de statut d'un candidat, convocation, mise en vivier) est tracée avec l'identifiant de l'utilisateur, l'adresse IP, le timestamp et les états avant/après au format JSONB.

*Figure 22 : Journal d'audit immuable des actions RH (audit_logs)*

---

### 2.2.10 Studio de Conception d'Affiches de Recrutement

Pour faciliter les campagnes d'affichage aux entrées des usines d'Ibity et Tamatave ainsi que sur les réseaux professionnels, un studio graphique a été développé au sein de l'application web :
* Injection automatique des mentions clés de l'offre (titre, missions synthétisées, diplômes requis, date limite de dépôt) ;
* Choix entre plusieurs chartes visuelles (Template industriel orienté usine ou Template moderne pour sièges administratifs) respectant la charte graphique officielle d'Alpha Ciment ;
* Déplacement interactif des blocs de texte par glisser-déposer sur le canvas visuel ;
* Exportation haute définition immédiate en image PNG prête pour l'impression ou la publication en ligne.

*Figure 23 : Studio graphique de conception et génération d'affiches d'offres*

---

## 2.3 État d'Analyse, Statistiques et Tableaux de Bord

Le tableau de bord exécutif centralise en temps réel les métriques décisionnelles pour la Direction des Ressources Humaines et la Direction Générale :

```
                      TABLEAU DE BORD DÉCISIONNEL RH (KPIs)
 ┌───────────────────┬───────────────────┬───────────────────┬───────────────────┐
 │ CANDIDATURES TOT. │ OFFRES EN COURS   │ DANS LE VIVIER    │ DÉLAI MOYEN RECR. │
 │       148         │        6          │        42         │     14,2 jours    │
 └───────────────────┴───────────────────┴───────────────────┴───────────────────┘
```
*Figure 24 : Tableau de bord décisionnel RH - Cartes KPIs stratégiques*

### Indicateurs de Performance Suivis :
* **Volume mensuel de candidatures reçues** : Permet de mesurer l'impact et la visibilité des campagnes de recrutement au fil de l'année.
* **Répartition des candidatures par statut** : Graphique circulaire représentant la part respective des dossiers en cours de traitement, présélectionnés, en entretien ou embauchés.
* **Taux de capitalisation du Vivier** : Évolution du nombre de talents répertoriés par direction et spécialité technique.

*Figure 25 : Graphique de répartition des candidatures par statut*  
*Figure 26 : Graphique de volume mensuel des candidatures reçues*  
*Figure 27 : Graphique du taux de transformation et d'alimentation du Vivier*

---

## 2.4 Problèmes Rencontrés et Solutions Techniques

Dans tout projet d'ingénierie logicielle d'envergure, des imprévus techniques complexes se manifestent. Cette section documente les cinq défis majeurs rencontrés durant les travaux et les solutions méthodologiques apportées.

### 2.4.1 Défi 1 : Incohérence des accents entre PostgreSQL et PHP (`cv_snippet`)
* **Problème** : Lors de l'interrogation du Vivier avec un mot sans accent (ex. `developpeur`), PostgreSQL trouvait parfaitement la candidature grâce au dictionnaire `french_unaccent`. En revanche, sur l'interface web, le bloc d'extrait contextuel (`cv_snippet`) restait désespérément vide.
* **Cause** : La fonction PHP d'extraction de snippet utilisait nativement `mb_stripos()`. Or, en PHP, `mb_stripos("développeur", "developpeur")` renvoie `false` en raison de la présence de l'accent aigu.
* **Solution** : Conception et intégration dans les repositories d'un algorithme de translittération 1-pour-1 strict via `Str::ascii()`. La détection de l'offset de position s'opère sur le texte translittéré sans accent, tandis que le découpage final s'effectue sur le texte original, préservant ainsi la typographie et les accents exacts du candidat.

### 2.4.2 Défi 2 : Déstructuration des textes sur les CVs multi-colonnes en OCR
* **Problème** : Avec un moteur d'OCR traditionnel (Tesseract), la lecture des CVs contemporains agencés en deux colonnes lisait les lignes de gauche à droite sur toute la page, concaténant la colonne latérale de compétences avec le texte des expériences de la colonne de droite.
* **Solution** : Remplacement par le réseau neuronal **PaddleOCR (PP-OCRv4)** paramétré avec détection de boîte englobante polygonale (`use_angle_cls=True`). Cette approche segmente le document en blocs verticaux indépendants avant de reconstruire l'ordre logique de lecture.

### 2.4.3 Défi 3 : Gestion des chemins de documents et du lien symbolique `storage:link` suite au renommage de marque
* **Problème** : Lors du renommage physique du répertoire du projet en `recrutement_alphaCiment`, les fichiers de CV téléversés renvoyaient des erreurs 404 lors de la consultation dans le visualiseur web.
* **Cause** : Le lien symbolique Windows `public/storage` pointait vers l'ancien chemin physique absolu, et le cache autoloader de Composer conservait également l'ancienne nomenclature.
* **Solution** : 
  1. Stockage systématique en base de chemins strictement relatifs (`documents/cv/uuid.pdf`) indépendants de la racine du serveur ;
  2. Réinitialisation ordonnée du lien symbolique via `php artisan storage:unlink` suivi de `php artisan storage:link` ;
  3. Réalignement complet des fichiers d'autoload de Composer pour garantir la portabilité totale du système.

### 2.4.4 Défi 4 : Garantie d'intégrité transactionnelle stricte sans triggers SQL
* **Problème** : Le choix d'architecture d'exclure tout trigger en base exigeait de garantir que la création d'un candidat, l'enregistrement de sa candidature, le téléversement de ses pièces jointes et son premier statut ne puissent jamais laisser la base de données dans un état corrompu en cas de panne inopinée.
* **Solution** : Encapsulation systématique de chaque flux d'écriture dans des blocs transactionnels `DB::transaction(function() { ... })` au sein de la couche Service. En cas d'exception levée sur n'importe quelle étape, un rollback atomique immédiat est déclenché, respectant à la lettre les critères ACID.

### 2.4.5 Défi 5 : Sécurisation et migration vers une architecture 100% Stateless par Bearer Tokens
* **Problème** : L'utilisation de sessions basées sur des cookies provoquait des erreurs d'authentification intermittentes lors des appels d'API depuis des sous-domaines ou des terminaux distincts, tout en exposant l'API aux risques de requêtes falsifiées intersites (CSRF).
* **Solution** : Refonte intégrale de la couche d'accès vers un modèle stateless pur propulsé par **Laravel Sanctum**. Chaque requête React transporte le jeton dans l'en-tête standard `Authorization: Bearer <token>`. Les tokens sont hachés en SHA-256 côté base, révoqués instantanément à la déconnexion et purgés automatiquement après 8 heures de non-activité.

---

<div style="page-break-after: always;"></div>

# Chapitre 3 : Évaluation du Projet et Connaissances Acquises

Ce troisième chapitre dresse le bilan qualitatif et quantitatif des travaux réalisés. Il mesure les retombées opérationnelles directes pour Alpha Ciment Madagascar, détaille les acquis techniques, méthodologiques et humains tirés de cette expérience de stage en entreprise, et expose les perspectives d'évolution envisagées pour enrichir le système d'information.

---

## 3.1 Bilan pour l'Entreprise

Au sein du siège social d'Alpha Ciment à Tsaralalàna, le Département Informatique assurait la maîtrise d'ouvrage technique du projet, tandis que la Direction des Ressources Humaines portait les exigences métiers. La conception et la réalisation de la plateforme de recrutement ont été conduites de manière autonome et individuelle, sous la supervision attentive de mon encadreur professionnel, **Monsieur Hery Mampionona RANDRIAMASY**.

Tout au long du cycle de développement, des revues de sprint mensuelles ont été organisées avec les équipes informatiques et les responsables RH. Ces présentations régulières ont permis de recueillir des retours d'utilisation en conditions réelles et d'ajuster continuellement l'ergonomie des interfaces ainsi que les règles de gestion des candidatures.

L'implémentation de la solution apporte à Alpha Ciment des gains tangibles et mesurables à plusieurs niveaux :

### 3.1.1 Gains d'Efficacité Opérationnelle et Productivité

* **Réduction drastique du temps d'ingestion documentaire** : Là où l'ouverture manuelle d'un CV, sa lecture intégrale et la retranscription de ses données dans un tableur absorbaient entre **8 et 12 minutes** par postulant, le microservice d'OCR (PaddleOCR) et d'extraction automatique effectue ce pré-traitement en **moins de 3 secondes**.
* **Fin de l'amnésie organisationnelle grâce au Vivier Unique** : Auparavant, 100% des candidatures qualifiées non retenues sur une offre spécifique étaient égarées dans des classeurs d'archives ou des boîtes de courriels saturées. Grâce à l'indicateur permanent `dans_vivier = true`, plus de **42 profils techniques qualifiés** ont déjà été capitalisés dans le Vivier, immédiatement mobilisables pour les besoins saisonniers ou urgents des usines.
* **Recherche instantanée multicritère et plein texte** : Trouver un profil spécifique (par exemple : *"Électromécanicien avec habilitation haute tension disponible pour le site d'Ibity"*) s'opère désormais en **moins de 10 millisecondes**, contre plusieurs heures de fouille manuelle auparavant.

### 3.1.2 Fiabilisation, Centralisation et Sécurisation des Données RH

* **Fédération des sites industriels et administratifs** : La plateforme unifie les candidatures en provenance des sites d'usine d'Ibity et de Tamatave avec celles du siège de Tsaralalàna au sein d'une base de données PostgreSQL unique et sécurisée.
* **Éradication des doublons** : L'algorithme de contrôle d'unicité par adresse e-mail rattache automatiquement tout nouvel acte de candidature à l'historique préexistant du candidat.
* **Traçabilité juridique et conformité d'audit** : Grâce au journal immuable `audit_logs` et à la table `communications`, chaque décision d'avancement, chaque motif de rejet et chaque convocation envoyée par courriel est formellement horodatée et imputée à son auteur.

### 3.1.3 Modernisation de la Marque Employeur

* **Communication réactive et valorisante** : L'envoi automatique d'accusés de réception personnalisés et de convocations détaillées véhicule auprès des candidats l'image d'un groupe industriel moderne et respectueux des talents.
* **Homogénéité graphique** : Le studio d'affiches intégré permet aux recruteurs de produire en quelques clics des visuels professionnels respectant fidèlement la charte graphique officielle d'Alpha Ciment.

---

## 3.2 Bilan Personnel et Professionnel

Ce stage de fin d'études au sein d'Alpha Ciment a constitué une immersion professionnelle décisive, me permettant de confronter l'enseignement théorique reçu à l'IT University aux exigences rigoureuses du monde industriel.

En marge du projet principal de développement, j'ai eu l'opportunité de participer activement aux opérations quotidiennes du Département Informatique, notamment à des interventions sur l'infrastructure réseau locale et à des activités d'assistance aux utilisateurs (*Helpdesk*). Ces interventions m'ont permis de mieux appréhender les contraintes opérationnelles réelles des collaborateurs sur les différents sites.

### 3.2.1 Compétences Techniques Approfondies

* **Maîtrise de la Clean Architecture & Design Patterns** : Évolution du paradigme traditionnel vers une séparation stricte en 5 couches (FormRequest $\rightarrow$ Thin Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ API Resource), garantissant un code découplé et facilement testable.
* **Administration avancée de bases de données relationnelles (PostgreSQL 16)** :
  * Création d'index inversés généralisés (`GIN`) sur des vecteurs de lexèmes (`tsvector`).
  * Configuration linguistique personnalisée avec filtrage diacritique (`french_unaccent`).
  * Stockage et requêtage de structures de données semi-structurées (`JSONB`).
* **Ingénierie de la Vision par Ordinateur et du NLP** :
  * Implémentation d'un microservice asynchrone haute performance avec Python et **FastAPI**.
  * Déploiement du modèle neuronal de segmentation spatiale **PaddleOCR (PP-OCRv4)** pour préserver l'agencement des CVs multi-colonnes.
  * Réconciliation floue tolérante aux erreurs de numérisation via **RapidFuzz** et les distances de Levenshtein.
* **Développement Frontend Réactif Moderne** : Maîtrise avancée de l'écosystème React associé à Vite, gestion fine de l'état asynchrone, intégration de la suite calendaire FullCalendar et développement d'un studio visuel avec drag-and-drop.
* **Sécurité Applicative et Authentification Stateless** : Abandon des sessions cookies au profit d'une architecture moderne par Bearer Tokens avec **Laravel Sanctum**, hachage SHA-256 et limitation de débit (*Rate Limiting*).

### 3.2.2 Compétences Humaines et Méthodologiques

* **Gestion de Projet Agile & Respect des Engagements** : Conduite d'un calendrier strict découpé en 8 Sprints sur 71 jours ouvrés, validé dans les délais impartis.
* **Écoute active et traduction des besoins utilisateurs** : Aptitude à dialoguer avec des spécialistes non techniciens (responsables des ressources humaines, directeurs de site) pour transformer des besoins fonctionnels en spécifications d'ingénierie logicielle.
* **Autonomie et résolution méthodique de pannes complexes** : Développement de réflexes d'investigation rigoureux face aux anomalies subtiles (gestion des encodages de caractères UTF-8, synchronisation des liens symboliques de stockage après renommage de répertoires).

---

## 3.3 Extensions et Évolutions Futures

Bien que la plateforme soit actuellement opérationnelle et réponde à l'intégralité du cahier des charges validé, plusieurs perspectives prometteuses ont été identifiées pour accompagner le développement futur d'Alpha Ciment :

### 3.3.1 Application Mobile Dédiée aux Superviseurs d'Usine (React Native)

Dans les cimenteries d'Ibity et de Tamatave, les recrutements techniques comportent des épreuves pratiques d'atelier (soudure, démontage mécanique, raccordement d'armoires électriques). Développer une déclinaison mobile native avec **React Native** permettra aux chefs d'équipe et contremaîtres :
* De consulter la liste des candidats convoqués au poste d'atelier sans utiliser d'ordinateur ;
* De photographier directement les pièces d'identité ou diplômes originaux pour transmission immédiate au backend ;
* De renseigner sur une tablette tactile les grilles d'évaluation technique et notes d'habileté manuelle, synchronisées instantanément avec la Fiche Candidat 360° du siège.

### 3.3.2 Chatbot Conversationnel d'Assistance aux Candidats

Intégrer sur le portail public un agent conversationnel interactif (*Chatbot*) afin d'orienter les postulants vers les offres correspondant le mieux à leur profil, de répondre aux interrogations fréquentes sur l'entreprise et de vérifier la complétude de leurs dossiers avant soumission.

### 3.3.3 Matching Sémantique Prédictif Offres-Candidats par Recherche Vectorielle (`pgvector`)

Actuellement, l'appariement des profils repose sur la correspondance textuelle et lexicale des compétences. L'intégration de l'extension PostgreSQL **`pgvector`** couplée à un modèle d'embedding sémantique local permettra d'associer un candidat à une offre même lorsque celui-ci emploie des termes synonymes non répertoriés dans le thésaurus officiel, attribuant à chaque dossier un score de pertinence prédictif.

---

<div style="page-break-after: always;"></div>

# Conclusion Générale

Le projet présenté dans ce mémoire répondait à un impératif stratégique pour **Alpha Ciment Madagascar** : moderniser, centraliser et fiabiliser la gestion prévisionnelle de ses recrutements et la capitalisation de ses talents, face aux défis d'une industrie lourde en pleine expansion.

En réponse à la problématique posée :
> *« Comment concevoir et déployer une plateforme unifiée de recrutement et de gestion de vivier, capable d'automatiser l'extraction documentaire des CVs par OCR, d'assurer une recherche plein texte multicritère ultra-rapide et de piloter de manière collaborative l'intégralité du pipeline de sélection pour un groupe industriel ? »*

Les travaux réalisés ont permis de livrer une solution informatique complète, modulaire et hautement sécurisée. En substituant aux fichiers tableurs dispersés et aux dossiers papier une plateforme web moderne basée sur **React 18/19** et **Laravel 11**, l'application apporte un gain de réactivité immédiat à la Direction des Ressources Humaines.

L'intégration d'un microservice de vision artificielle (**PaddleOCR**) et de traitement sémantique (**spaCy & RapidFuzz**) décharge les équipes RH de la saisie manuelle tout en respectant le principe de validation humaine (*Human-in-the-Loop*). L'exploitation avancée des mécanismes de recherche plein texte de **PostgreSQL 16** (`tsvector`, index `GIN`, configuration `french_unaccent`) permet d'interroger instantanément le Vivier de Talents sans friction linguistique, garantissant que chaque profil à fort potentiel soit durablement valorisé pour les usines d'Ibity et Tamatave ainsi que pour le siège de Tsaralalàna.

D'un point de vue personnel, ce stage m'a offert l'opportunité de concrétiser les enseignements d'excellence reçus à l'**IT University**. Il m'a permis de maîtriser les patrons de conception de référence (**Clean Architecture**, **Repository Pattern**), de concevoir des bases de données relationnelles optimisées à haute exigence d'intégrité sans recourir à des triggers masqués, et de piloter un projet d'envergure sur 71 jours ouvrés dans le respect strict des principes Agiles.

Les perspectives d'évolution identifiées — intégration d'une application mobile React Native pour les superviseurs d'usine, Chatbot conversationnel d'assistance et matching sémantique par embeddings vectoriels `pgvector` — confirment que la plateforme développée constitue un socle technologique robuste et pérenne, prêt à soutenir le développement industriel d'Alpha Ciment pour les années à venir.

---

<div style="page-break-after: always;"></div>

# Bibliographie et Webographie

### I. Systèmes d'Entreprise, Architecture & Méthodologie
1. **ARCHITECTURE MULTI-TIERS** : Principes et découpage des architectures client-serveur à trois niveaux.  
   *URL* : https://fr.wikipedia.org/wiki/Architecture_trois_tiers  
   *(Consulté le 12 août 2026)*.
2. **ERP (ENTERPRISE RESOURCE PLANNING)** : Principes de gestion intégrée des processus d'entreprise. Oracle France.  
   *URL* : https://www.oracle.com/fr/erp/what-is-erp/  
   *(Consulté le 14 août 2026)*.
3. **MARTIN FOWLER** : *Patterns of Enterprise Application Architecture — Repository Pattern & Service Layer*. Addison-Wesley Professional.  
   *URL* : https://martinfowler.com/eaaCatalog/repository.html  
   *(Consulté le 15 août 2026)*.
4. **ROBERT C. MARTIN (UNCLE BOB)** : *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017.
5. **MICROSOFT AZURE ARCHITECTURE CENTER** : *RESTful web API design and best practices*.  
   *URL* : https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design  
   *(Consulté le 16 août 2026)*.

### II. Outils de Prototypage et Conception Graphique
6. **PENCIL PROJECT** : Logiciel libre de conception de maquettes d'interface utilisateur et de wireframing.  
   *URL* : https://pencil.evolus.vn/Features.html  
   *(Consulté le 18 août 2026)*.
7. **BALSAMIQ WIREFRAMES** : Documentation et guide des outils de maquettage rapide.  
   *URL* : https://balsamiq.com/wireframes/  
   *(Consulté le 18 août 2026)*.

### III. Bases de Données & Indexation Plein Texte
8. **POSTGRESQL 16 DOCUMENTATION** : Manuel officiel du système de gestion de base de données relationnelle et objet.  
   *URL* : https://www.postgresql.org/docs/16/index.html  
   *(Consulté le 20 août 2026)*.
9. **POSTGRESQL FULL-TEXT SEARCH (TSVECTOR & TSQUERY)** : Documentation sur la recherche lexicale et les dictionnaires de langue.  
   *URL* : https://www.postgresql.org/docs/16/textsearch.html  
   *(Consulté le 20 août 2026)*.
10. **POSTGRESQL UNACCENT EXTENSION** : Dictionnaire textuel de suppression des accents diacritiques.  
    *URL* : https://www.postgresql.org/docs/16/unaccent.html  
    *(Consulté le 22 août 2026)*.
11. **POSTGRESQL GIN INDEXES** : Index inversé généralisé pour les données vectorielles et JSONB.  
    *URL* : https://www.postgresql.org/docs/16/gin.html  
    *(Consulté le 22 août 2026)*.
12. **MYSQL VS POSTGRESQL** : Étude comparative des performances et standards SQL. DataBird.  
    *URL* : https://www.data-bird.co/blog/postgresql-vs-mysql  
    *(Consulté le 23 août 2026)*.

### IV. Frameworks de Développement Backend & Frontend
13. **LARAVEL 11.X DOCUMENTATION** : Documentation officielle du framework web PHP.  
    *URL* : https://laravel.com/docs/11.x  
    *(Consulté le 25 août 2026)*.
14. **LARAVEL SANCTUM** : Documentation sur l'authentification par jetons API légers (Bearer tokens).  
    *URL* : https://laravel.com/docs/11.x/sanctum  
    *(Consulté le 25 août 2026)*.
15. **PHP 8.2 & 8.3 DOCUMENTATION** : Guide officiel du langage PHP et nouvelles fonctionnalités de typage.  
    *URL* : https://www.php.net/manual/fr/  
    *(Consulté le 25 août 2026)*.
16. **REACT JS DOCUMENTATION** : Guide officiel pour la création d'interfaces déclaratives à base de composants.  
    *URL* : https://react.dev/  
    *(Consulté le 28 août 2026)*.
17. **VITE 8.X DOCUMENTATION** : Outil de construction et serveur de développement pour applications frontales.  
    *URL* : https://vite.dev/guide/  
    *(Consulté le 28 août 2026)*.
18. **FULLCALENDAR V6** : Suite logicielle de planification interactive et d'agenda pour React.  
    *URL* : https://fullcalendar.io/docs  
    *(Consulté le 05 octobre 2026)*.

### V. Vision par Ordinateur, IA & Traitement Automatique du Langage (NLP)
19. **FASTAPI OFFICIAL DOCUMENTATION** : Framework web Python asynchrone haute performance basé sur Pydantic.  
    *URL* : https://fastapi.tiangolo.com/  
    *(Consulté le 15 septembre 2026)*.
20. **PADDLEOCR (PP-OCRV4)** : Reconnaissance optique de caractères multilingue basée sur les réseaux de neurones profonds.  
    *Dépôt GitHub* : https://github.com/PaddlePaddle/PaddleOCR  
    *(Consulté le 18 septembre 2026)*.
21. **SPACY INDUSTRIAL NLP** : Bibliothèque open-source de traitement du langage naturel et modèles français (`fr_core_news_md`).  
    *URL* : https://spacy.io/models/fr  
    *(Consulté le 20 septembre 2026)*.
22. **RAPIDFUZZ PYTHON LIBRARY** : Algorithmes ultra-rapides de distance de Levenshtein et comparaison floue de chaînes.  
    *Dépôt GitHub* : https://github.com/rapidfuzz/RapidFuzz  
    *(Consulté le 22 septembre 2026)*.
23. **DATEPARSER DOCUMENTATION** : Bibliothèque Python de détection et normalisation automatique des formats de date.  
    *URL* : https://dateparser.readthedocs.io/  
    *(Consulté le 24 septembre 2026)*.

---

<div style="page-break-after: always;"></div>

# Annexes Techniques

Les annexes regroupent les spécifications techniques de bas niveau, scripts SQL de configuration, extraits d'algorithmes et résultats de tests automatisés étayant les réalisations présentées dans le mémoire.

---

## Annexe 1 : Configuration PostgreSQL Full-Text Search (`french_unaccent`)

Pour garantir une recherche insensible aux accents et aux flexions grammaticales françaises dans le Vivier de Talents, une configuration textuelle personnalisée a été générée en base de données :

```sql
-- 1. Activation de l'extension unaccent
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Création de la configuration de recherche personnalisée basée sur le dictionnaire français
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
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS recherche_texte tsvector 
GENERATED ALWAYS AS (
    to_tsvector('french_unaccent', coalesce(contenu_texte_extrait, ''))
) STORED;

CREATE INDEX IF NOT EXISTS idx_documents_recherche_texte_gin 
ON documents USING gin(recherche_texte);
```

---

## Annexe 2 : Algorithme de Découpage de Snippet Résilient aux Accents & Ligatures (PHP)

Implémenté dans `EloquentCandidatureRepository.php` et `EloquentVivierRepository.php`, cette méthode garantit une correspondance 1-pour-1 stricte de la longueur en caractères pour éliminer tout décalage d'offset tout en conservant les accents originaux dans l'extrait affiché :

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

Extrait du contrôleur d'extraction déployé dans le microservice FastAPI :

```python
from fastapi import FastAPI, UploadFile, File
from paddleocr import PaddleOCR
from rapidfuzz import process, fuzz
import re

app = FastAPI(title="Microservice OCR & NLP - Alpha Ciment")
ocr = PaddleOCR(use_angle_cls=True, lang="fr", show_log=False)

@app.post("/extract-cv")
async def extract_cv_data(file: UploadFile = File(...)):
    contents = await file.read()
    
    # 1. Inférence visuelle par réseau profond avec détection d'angle
    result = ocr.ocr(contents, cls=True)
    
    extracted_lines = []
    if result and result[0]:
        for line in result[0]:
            text = line[1][0]
            confidence = line[1][1]
            extracted_lines.append({"text": text, "score": float(confidence)})
        
    full_text = "\n".join([item["text"] for item in extracted_lines])
    
    # 2. Matching tolérant aux coquilles avec le référentiel des compétences d'Alpha Ciment
    matched_skills = match_competences_fuzzy(full_text)
    
    return {
        "raw_text": full_text,
        "competences": matched_skills,
        "status": "ready_for_human_validation"
    }

def match_competences_fuzzy(text: str, threshold: float = 85.0):
    referentiel = [
        "Laravel", "PostgreSQL", "React", "FastAPI",
        "Électromécanique", "Chaudronnerie", "Maintenance Industrielle",
        "Haute Tension", "Chimie Industrielle", "Automatisme Siemens",
        "Management RH", "Comptabilité Analytique"
    ]
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

Extrait de `CommunicationService.php` permettant le remplacement tolérant des balises dynamiques :

```php
public function interpolerVariables(string $template, Candidature $candidature, ?RendezVous $rdv = null): string
{
    $variables = [
        'nom' => $candidature->candidat->nom,
        'prenom' => $candidature->candidat->prenom,
        'email' => $candidature->candidat->email,
        'poste' => $candidature->offre ? $candidature->offre->titre_poste : $candidature->poste_souhaite,
        'direction' => $candidature->offre ? $candidature->offre->direction->nom_direction : 'Alpha Ciment',
        'date_rdv' => $rdv ? $rdv->date_heure->format('d/m/Y à H:i') : '[Date non définie]',
        'lieu_rdv' => $rdv ? $rdv->lieu_ou_lien : 'Site Usine Alpha Ciment',
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

Résultats de l'exécution de la suite complète de tests de non-régression et de sécurité :

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
Tests:    37 passed (194 assertions)
Duration: 2.15s
Status:   100% SUCCÈS (0 échec, 0 avertissement)
----------------------------------------------------------------------
```

---

## Annexe 6 : Tableau 10 : Glossaire synthétique des concepts d'architecture et de sécurité

| Terme / Concept | Définition & Implémentation dans la Plateforme |
| :--- | :--- |
| **Stateless (Sans État)** | Principe architectural de style REST stipulant que le serveur ne conserve aucune session client en mémoire entre les requêtes. Chaque requête cliente est auto-suffisante et porte sa preuve d'habilitation (`Authorization: Bearer <token>`). Cela autorise le passage à l'échelle horizontal sans affinité de session. |
| **Reference Token (Jeton de Référence)** | Modèle d'authentification retenu (Laravel Sanctum) où le jeton transmis au client n'est qu'un pointeur cryptographique sécurisé vers un enregistrement persistant en base de données. Contrairement aux JWT purs, ce modèle confère au système un contrôle absolu de **révocation instantanée** lors de la déconnexion. |
| **SHA-256 (Secure Hash Algorithm 256 bits)** | Fonction de hachage cryptographique unidirectionnelle utilisée par Laravel Sanctum pour stocker l'empreinte des jetons dans la table `personal_access_tokens`. Même en cas d'accès direct non autorisé à la base de données, les jetons en clair ne peuvent pas être reconstitués. |
| **CSRF (Cross-Site Request Forgery)** | Vulnérabilité consistant à faire exécuter à l'insu de l'utilisateur des actions non sollicitées en exploitant les cookies de session envoyés automatiquement par le navigateur. Avec une architecture stateless fondée sur des jetons porteurs (*Bearer Tokens*), le risque CSRF est neutralisé par conception. |
| **Rate Limiting (Limitation de Débit)** | Mécanisme de protection anti force-brute implémenté via le middleware `throttle:5,1` sur la route `/api/login`. Il plafonne les requêtes à 5 tentatives par minute par adresse IP, renvoyant le code HTTP `429 Too Many Requests` au-delà pour contrer les attaques par dictionnaire. |
| **TTL (Time-To-Live) & Expiration de Token** | Durée de vie maximale accordée à un jeton d'authentification. Fixée rigoureusement à 8 heures (`now()->addHours(8)`), elle aligne la persistance de session sur la journée de travail des agents RH et déclenche une purge automatique quotidienne (`sanctum:prune-expired`) planifiée chaque nuit à minuit. |
