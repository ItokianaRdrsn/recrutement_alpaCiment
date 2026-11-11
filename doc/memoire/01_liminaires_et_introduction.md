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
