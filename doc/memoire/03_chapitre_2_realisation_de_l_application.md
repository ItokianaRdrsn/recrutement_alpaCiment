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
