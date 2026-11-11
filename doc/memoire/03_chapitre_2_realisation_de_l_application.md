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
