# Module Recrutement — Documentation fonctionnelle & MLD

## 1. Contexte

Le site public de candidature (externe) permet :
- une **candidature sur offre** (nom, email, tél, dossiers)
- une **candidature spontanée** (nom, email, tél, poste souhaité, message, dossiers)

Le module à construire est un **back-office de gestion** de ces candidatures. Il reçoit/importe les candidatures issues du site externe et permet à l'équipe RH de les traiter : suivi du pipeline de recrutement, vivier, communication avec les candidats, rendez-vous (tests/entretiens).

**Évolution actée avec le site externe** : le champ "domaine" du formulaire spontané passe (ou passera) d'un texte libre à une liste déroulante synchronisée avec notre référentiel `domaine`, avec une option "Autre, précisez" pour les métiers pas encore répertoriés.

**Choix d'architecture assumé : aucun trigger.** La base ne fait aucune vérification automatique ni aucun calcul dérivé — tout est de la responsabilité du code applicatif (API/back-office). Ce choix est délibéré (simplicité, prévisibilité, un seul endroit — le code — où se trouve la logique métier) mais implique une vigilance particulière côté développement : voir section 7 pour le détail des points qui ne sont plus protégés par la base.

---

## 2. Architecture fonctionnelle du module

```
Module Recrutement
├── Vue générale (toutes les candidatures, tous types confondus)
│   └── Détail / recherche / filtres transverses
├── Candidatures sur offre
│   ├── Bouton "Vivier" (voir tous les profils en vivier)
│   ├── Recherche avancée sur compétences
│   ├── Matching automatique candidat ↔ offre (via competence)
│   ├── Navigation par Direction
│   │   ├── Tous
│   │   ├── Offres publiées (nom + date)
│   │   └── Voir plus → offres clôturées
│   └── Liste candidats (par direction + offre choisie)
│       └── Fiche candidat
├── Candidatures spontanées
│   ├── Statut "vivier" par défaut à la création
│   ├── Recherche avancée sur compétences
│   ├── Navigation par Direction (via domaine, extensible dynamiquement)
│   └── Liste candidats (par direction)
│       └── Fiche candidat
└── Rendez-vous (tests / entretiens)
    └── Planification, suivi (à venir / réalisé / annulé), mode (présentiel/visio/tél)
```

**Fiche candidat (commune aux deux types)**
- Informations : nom, prénom, email, tél, adresse, date de naissance, statut actuel
- Documents : consultation / téléchargement (liés à la candidature)
- Rendez-vous : tests et entretiens planifiés, réalisés ou annulés
- Changement de statut : Reçue → Présélectionnée → Test → Entretien → (Retenue / Non retenue)
- Communication : modèles prédéfinis personnalisables, historique des échanges

---

## 3. Entités

| Entité | Rôle |
|---|---|
| `direction` | Directions de l'entreprise (Informatique, RH, Finance...) |
| `utilisateur` | Compte RH/admin/manager qui agit dans le back-office |
| `domaine` | Classification du spontané (ex: "Développement Web"), rattachée à une seule `direction`. Peut être en attente de validation (`valide = false`) |
| `type_demande` | Référentiel : "Offre" / "Spontanee" |
| `statut_offre` | Référentiel : Brouillon / Publiee / Cloturee |
| `offre` | Une offre d'emploi, rattachée à une direction |
| `candidat` | Identité de la personne (indépendante du nombre de candidatures) |
| `competence` | Référentiel des compétences |
| `competence_alias` | Rattachements texte brut → compétence déjà validés par un RH (accélère le matching futur) |
| `candidat_competence` | Compétences déclarées par un candidat, avec traçabilité (`source`, `score_confiance`) et validation RH si extraites d'un CV |
| `offre_competence` | Compétences requises par une offre (liaison N:N), pour le matching |
| `experience_professionnelle` | Expériences pro d'un candidat — même pattern source/validation |
| `formation` | Formations/diplômes d'un candidat — même pattern source/validation |
| `statut_candidature` | Référentiel du workflow : Recue → Preselectionnee → Test → Entretien → Retenue / Non retenue |
| `candidature` | Un acte de candidature (sur offre OU spontanée) |
| `historique_statut` | Traçabilité des changements de statut d'une candidature |
| `document` | CV, lettre de motivation... liés à une candidature |
| `type_rendez_vous` | Référentiel : Test / Entretien |
| `statut_rendez_vous` | Référentiel : A venir / Realise / Annule |
| `mode_realisation` | Référentiel : Presentiel / Visioconference / Telephone |
| `rendez_vous` | Un test ou un entretien planifié pour une candidature, avec un responsable (`utilisateur`) |
| `type_message` | Référentiel : Accusé de réception / Convocation / Demande information / Demande document / Issue recrutement / Autre |
| `modele_message` | Modèles de message prédéfinis, réutilisables, personnalisables avant envoi |
| `communication` | Historique des messages effectivement envoyés à un candidat |

---

## 4. Règles de gestion retenues

| Règle | Traduction dans le modèle |
|---|---|
| Une personne peut candidater plusieurs fois | `candidat` et `candidature` sont séparés (1 candidat → n candidatures) |
| Une candidature "sur offre" référence une offre ; une candidature "spontanée" référence un domaine | `candidature.id_offre` et `candidature.id_domaine` sont tous les deux nullable. **Non vérifié par la base** (pas de trigger ni de CHECK inter-tables) — à garantir côté application |
| Le vivier concerne les 2 types de candidature | `candidature.dans_vivier` (booléen), indépendant du statut |
| Le site propose (ou proposera) une liste déroulante de domaines + option "Autre" | `domaine` est une table de référence, rattachée en N:1 à `direction`. Un domaine créé via "Autre" arrive avec `valide = false`, à valider par un admin (`valide_par`, `date_validation`) via la fonction `valider_domaine()` |
| Documents liés à la candidature uniquement | `document.id_candidature`, pas de dossier central par candidat |
| Recherche avancée + matching sur compétences | `competence` + `candidat_competence` + `offre_competence` (liaisons N:N). Fonctionnalité prévue, non prioritaire pour la V1 |
| Rattacher le texte brut d'un CV à une compétence du référentiel, sans NER | `pg_trgm` (extension native, similarité par trigrammes) pour le fuzzy matching sur les nouveaux cas, `competence_alias` pour mémoriser les rattachements déjà validés (même principe que `Domaine_Alias`, abandonné pour les domaines mais pertinent ici) |
| Les informations extraites d'un CV (compétences, expériences, formations) doivent être validées par un RH avant d'être utilisables pour le matching | Pattern répété sur `candidat_competence`, `experience_professionnelle`, `formation` : `source` (`manuel`/`cv_ocr`), `score_confiance`, `id_document` (CV source), `valide`/`date_validation`/`valide_par` — identique au pattern déjà utilisé pour `domaine.valide` |
| Tests et entretiens planifiables, avec responsable, mode et statut | `rendez_vous`, rattaché à une `candidature` et à un `utilisateur` responsable |
| Communication : modèles prédéfinis, personnalisables avant envoi, historisée | `type_message` (référentiel) + `modele_message` (templates) + `communication` (contenu réellement envoyé, **copié**, indépendant du modèle — permet la personnalisation sans jamais altérer l'historique) |
| Un modèle peut déclencher un envoi automatique selon le statut atteint | `modele_message.id_statut_candidature` (nullable) + `envoi_automatique`. Un seul modèle actif+auto par statut (index unique partiel). **Aucun déclenchement automatique implémenté pour l'instant** (pas de trigger) — à faire côté application si/quand le besoin est confirmé |
| Un email peut être envoyé sans modèle ("envoyer un autre email") | `communication.id_modele_message` nullable ; `communication.id_type_message` **obligatoire**, à fournir explicitement par l'application (type "Autre" si message libre) |
| Aucun trigger dans la base (choix assumé) | Voir section 7 pour la liste des vérifications qui deviennent des responsabilités applicatives |
| Le dépôt peut venir du site externe OU d'une saisie manuelle RH (téléphone, salon, email direct) | `candidature.canal_depot` (`site_externe` / `rh_manuel`) + `id_utilisateur_depot` rempli uniquement si saisie manuelle |
| Un candidat qui repostule ne doit pas être dupliqué | `candidat.email` est `UNIQUE` — l'application cherche par email avant de créer une nouvelle fiche |
| Un document peut être un fichier joint ou une photo passée à l'OCR | `document.mode_acquisition` (`fichier` / `photo_ocr`) ; `contenu_texte_extrait` stocke le texte quelle que soit la méthode, avec une colonne calculée `recherche_texte` (tsvector) pour la recherche full-text |

---

## 5. MCD — cardinalités principales

- Un `candidat` (1,n) fait `candidature` (1,1)
- Une `candidature` (0,1) concerne `offre` (0,n) — nul si spontanée
- Une `candidature` (0,1) est classée dans `domaine` (0,n) — nul si sur offre
- Une `offre` (1,1) appartient à `direction` (1,n)
- Un `domaine` (1,1) appartient à `direction` (1,n)
- Une `offre` (0,n) ↔ (0,n) `competence` *(via `offre_competence`)*
- Un `candidat` (0,n) ↔ (0,n) `competence` *(via `candidat_competence`)*
- Une `candidature` (1,1) a un `statut_candidature` (0,n) actuel + un historique (`historique_statut`, 1,n)
- Une `candidature` (0,n) possède `document` (1,1)
- Une `candidature` (0,n) génère `rendez_vous` (1,1), chacun affecté à un `utilisateur` responsable
- Une `candidature` (0,n) génère `communication` (1,1)
- Un `modele_message` (0,n) appartient à `type_message` (1,n)
- Un `modele_message` (0,n) peut déclencher depuis `statut_candidature` (0,n) — nullable
- Une `communication` (0,1) utilise `modele_message` (0,n) — nullable
- Une `communication` (1,1) référence `type_message` (0,n) — toujours renseigné

---

## 6. MLD (Modèle Logique de Données)

> Convention : `PK` = clé primaire, `#FK` = clé étrangère. Reflète exactement le script SQL en vigueur.

```
DIRECTION (
    id_direction        PK,
    nom_direction
)

UTILISATEUR (
    id_utilisateur      PK,
    nom,
    email,
    role,                 -- 'rh' / 'admin' / 'manager'
    created_at,
    updated_at
)

DOMAINE (
    id_domaine          PK,
    nom_domaine,
    id_direction          #FK → DIRECTION,
    valide,               -- booléen
    date_validation,
    valide_par             #FK → UTILISATEUR,
    created_at,
    updated_at
)

TYPE_DEMANDE (
    id_type_demande     PK,
    libelle               -- 'Offre' / 'Spontanee'
)

STATUT_OFFRE (
    id_statut_offre     PK,
    libelle               -- 'Brouillon' / 'Publiee' / 'Cloturee'
)

OFFRE (
    id_offre            PK,
    titre_poste,
    id_direction          #FK → DIRECTION,
    date_publication,
    date_limite,
    id_statut_offre        #FK → STATUT_OFFRE
)

CANDIDAT (
    id_candidat         PK,
    nom,
    prenom,
    email,                -- UNIQUE
    telephone,
    adresse,
    date_naissance,
    created_at,
    updated_at
)

COMPETENCE (
    id_competence       PK,
    nom_competence
)

COMPETENCE_ALIAS (
    id_alias            PK,
    texte_brut,           -- normalisé, UNIQUE
    id_competence          #FK → COMPETENCE,
    id_utilisateur          #FK → UTILISATEUR,
    created_at
)

CANDIDAT_COMPETENCE (
    id_candidat          #FK → CANDIDAT,
    id_competence          #FK → COMPETENCE,
    niveau,
    source,               -- 'manuel' / 'cv_ocr'
    score_confiance,
    id_document             #FK → DOCUMENT,
    valide,
    date_validation,
    valide_par               #FK → UTILISATEUR,
    PK (id_candidat, id_competence)
)

OFFRE_COMPETENCE (
    id_offre              #FK → OFFRE,
    id_competence           #FK → COMPETENCE,
    niveau_requis,
    PK (id_offre, id_competence)
)

EXPERIENCE_PROFESSIONNELLE (
    id_experience        PK,
    id_candidat            #FK → CANDIDAT,
    poste,
    entreprise,
    date_debut,
    date_fin,             -- NULL si poste actuel
    poste_actuel,
    description,
    source, score_confiance, id_document #FK → DOCUMENT,
    valide, date_validation, valide_par #FK → UTILISATEUR,
    created_at, updated_at
)

FORMATION (
    id_formation         PK,
    id_candidat            #FK → CANDIDAT,
    diplome,
    etablissement,
    domaine_etude,
    niveau,               -- Bac+3, Bac+5...
    date_obtention,
    source, score_confiance, id_document #FK → DOCUMENT,
    valide, date_validation, valide_par #FK → UTILISATEUR,
    created_at, updated_at
)

STATUT_CANDIDATURE (
    id_statut_candidature  PK,
    libelle,              -- Recue / Preselectionnee / Test / Entretien / Retenue / Non retenue
    ordre_workflow
)

CANDIDATURE (
    id_candidature       PK,
    id_candidat            #FK → CANDIDAT,
    id_type_demande         #FK → TYPE_DEMANDE,
    id_offre                #FK → OFFRE,             -- NULL si spontanée
    id_domaine               #FK → DOMAINE,          -- NULL si sur offre
    id_statut_candidature      #FK → STATUT_CANDIDATURE,
    dans_vivier,          -- booléen
    poste_souhaite,       -- texte, spontanée uniquement
    message,              -- texte, spontanée uniquement
    canal_depot,          -- 'site_externe' / 'rh_manuel'
    id_utilisateur_depot     #FK → UTILISATEUR,      -- rempli si canal_depot = 'rh_manuel'
    date_candidature,
    date_maj
)

HISTORIQUE_STATUT (
    id_historique         PK,
    id_candidature          #FK → CANDIDATURE,
    id_statut_candidature     #FK → STATUT_CANDIDATURE,
    date_changement,
    commentaire,
    id_utilisateur            #FK → UTILISATEUR
)

DOCUMENT (
    id_document           PK,
    id_candidature          #FK → CANDIDATURE,
    type_document,
    nom_fichier,
    chemin_fichier,
    mime_type,
    taille_octets,
    mode_acquisition,     -- 'fichier' / 'photo_ocr'
    contenu_texte_extrait,  -- texte issu de l'extraction/OCR
    recherche_texte,      -- tsvector calculé (colonne "generated", pas un trigger)
    date_upload
)

TYPE_RENDEZ_VOUS (
    id_type_rendez_vous   PK,
    libelle                -- 'Test' / 'Entretien'
)

STATUT_RENDEZ_VOUS (
    id_statut_rendez_vous PK,
    libelle                -- 'A venir' / 'Realise' / 'Annule'
)

MODE_REALISATION (
    id_mode_realisation   PK,
    libelle                -- 'Presentiel' / 'Visioconference' / 'Telephone'
)

RENDEZ_VOUS (
    id_rendez_vous        PK,
    id_candidature           #FK → CANDIDATURE,
    id_utilisateur            #FK → UTILISATEUR,       -- responsable du RDV
    id_type_rendez_vous        #FK → TYPE_RENDEZ_VOUS,
    id_statut_rendez_vous       #FK → STATUT_RENDEZ_VOUS,
    id_mode_realisation          #FK → MODE_REALISATION,
    date_debut,
    date_fin,
    details_lieu,
    commentaire,
    created_at,
    updated_at
)

TYPE_MESSAGE (
    id_type_message       PK,
    libelle
)

MODELE_MESSAGE (
    id_modele_message     PK,
    id_type_message          #FK → TYPE_MESSAGE,
    id_statut_candidature      #FK → STATUT_CANDIDATURE,  -- nullable, déclenche l'auto-envoi si renseigné
    nom_modele,
    objet,
    contenu,               -- peut contenir des variables, ex: {{nom_candidat}}
    envoi_automatique,     -- booléen — un seul actif+auto par statut (contrainte)
    actif,
    created_at,
    updated_at
)

COMMUNICATION (
    id_communication      PK,
    id_candidature           #FK → CANDIDATURE,
    id_modele_message          #FK → MODELE_MESSAGE,     -- nullable, message libre possible
    id_type_message              #FK → TYPE_MESSAGE,     -- obligatoire, fourni par l'appli
    objet,                 -- copie figée, indépendante du modèle
    contenu,               -- idem — personnalisation sans jamais modifier l'historique
    mode_envoi,           -- 'auto' / 'manuel'
    date_envoi,
    id_utilisateur           #FK → UTILISATEUR            -- NULL si automatique
)
```

---

## 7. Ce que l'absence de trigger implique (à garantir côté application)

Choix assumé : **aucun trigger dans la base**. Ça simplifie le schéma, mais ça déplace toute la logique de cohérence vers le code. Points de vigilance identifiés :

1. **Cohérence type/offre/domaine sur `candidature`** : rien n'empêche une candidature de type "Offre" d'avoir `id_offre` NULL, ou `id_domaine` rempli en même temps, et inversement pour "Spontanee". Filet de sécurité minimal possible sans trigger : un `CHECK` structurel (pas besoin de connaître le libellé du type, juste interdire que `id_offre` et `id_domaine` soient tous les deux remplis ou tous les deux vides) — **proposé, pas encore ajouté** (à trancher).
2. **`updated_at` / `date_maj`** ne se mettent plus à jour automatiquement — chaque `UPDATE` du code doit les fixer explicitement.
3. **Pas de colonne `id_direction` dénormalisée sur `candidature`** (retirée volontairement) : toute requête "candidatures/vivier par direction" doit passer par une jointure vers `offre` ou `domaine` selon le type, à chaque lecture.
4. **`envoi_automatique` sur `modele_message`** : la colonne existe et la contrainte d'unicité (un seul modèle actif+auto par statut) est appliquée, mais **rien ne déclenche réellement l'envoi** quand une candidature change de statut — c'est une fonctionnalité à construire côté application le jour où elle est priorisée.
5. **`id_type_message` sur `communication`** : doit être fourni explicitement à chaque insertion (pas de déduction automatique depuis le modèle) — sinon la colonne `NOT NULL` fera échouer l'insertion.
6. **Validation d'un domaine** : passe par un appel explicite à `valider_domaine(id_domaine, id_utilisateur)` — ce n'est pas automatique non plus, mais ce n'est pas un trigger : c'est une fonction que l'application appelle volontairement (ex: bouton "Valider" dans le back-office).

---

## 7bis. Processus de dépôt d'une candidature (à implémenter côté application)

Sans trigger, c'est l'application qui doit garantir ces étapes, dans une même transaction :

1. **Vérifier que l'offre est publiée** (si "sur offre") : `offre.id_statut_offre` doit correspondre à "Publiee" — refuser sinon (offre en brouillon ou déjà clôturée)
2. **Chercher le candidat existant par email** : `SELECT ... FROM candidat WHERE email = ?`. Trouvé → réutiliser `id_candidat`. Sinon → `INSERT INTO candidat`
3. **Créer la candidature** avec `id_statut_candidature` = celui de "Recue", `canal_depot` approprié (`site_externe` si import, `rh_manuel` + `id_utilisateur_depot` si saisie back-office)
4. **Insérer la première ligne d'historique** : `INSERT INTO historique_statut` avec le statut "Recue"
5. **Enregistrer les documents** : pour chaque fichier/photo — `mode_acquisition` selon la méthode, `contenu_texte_extrait` rempli après extraction/OCR (peut être fait de façon asynchrone après l'insertion initiale, pas forcément dans la même transaction)
6. **Accusé de réception** (si un modèle actif+auto existe pour le statut "Recue") : `INSERT INTO communication` avec `mode_envoi = 'auto'` — cf. section 4, pas de déclenchement automatique par la base, à faire ici explicitement

Chaque étape échouée doit annuler les précédentes (transaction) pour éviter une candidature à moitié enregistrée (ex: candidat créé mais candidature en échec).

---

## 7ter. Vues SQL pour le tableau de bord

Cinq `VIEW` ajoutées en fin de script — des requêtes sauvegardées, recalculées à chaque lecture, pas de précalcul ni d'écriture automatique :

| Vue | Contenu |
|---|---|
| `vue_dashboard_kpis` | Les 3 compteurs "haut de page" : candidatures sur offre, offres en cours, candidatures spontanées |
| `vue_stats_candidatures_par_mois` | Tendance mensuelle du nombre de candidatures |
| `vue_stats_repartition_statut_mois_courant` | Répartition des candidatures par statut, sur le mois en cours |
| `vue_stats_taux_transformation_mensuel` | Taux de transformation (retenues / total) par mois |
| `vue_stats_delai_traitement` | Délai moyen (en jours) entre le statut "Recue" et le statut final, par mois de réception |

---

## 8. Points encore ouverts

- **Format d'intégration avec le site externe** (API / export / webhook) — non tranché.
- **Matching compétences** (`candidat_competence` vs `offre_competence`) — modèle prêt, développement non prioritaire pour la V1.
- **Envoi technique réel des emails** (SMTP, service d'emailing...) — hors périmètre base de données, à prévoir côté application/worker qui surveille les nouvelles lignes `communication.mode_envoi = 'auto'`.
- **CHECK de cohérence type/offre/domaine** (point 1 de la section 7) — à ajouter ou non, en discussion.
- **Qui peut créer/valider un domaine** — la fonction `valider_domaine()` existe, mais les droits d'accès (qui peut l'appeler) sont à définir au niveau de l'application/API, pas de la base.
