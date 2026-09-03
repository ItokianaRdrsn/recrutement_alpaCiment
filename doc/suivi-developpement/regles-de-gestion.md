# Registre Central des Règles de Gestion Métier (Business Rules)

Ce document répertorie l'ensemble des règles de gestion métier appliquées sur la plateforme de recrutement *recrutement_alpaCiment*.

---

## 📌 1. Règles de Gestion sur les Offres d'Emploi
- **RG-OFF-01 : Validation des Offres par Statut** : Seules les offres ayant le statut `Publiée` (statut 2) sont visibles sur le portail public candidat et ouvertes au dépôt de candidatures.
- **RG-OFF-02 : Saisie Manuelle RH sur Offres** : Une candidature saisie manuellement par un agent RH pour une offre exige également que l'offre soit au statut `Publiée`.
- **RG-OFF-03 : Unicité des Statuts d'Offre** : Les statuts d'offre suivent l'ordre de workflow : `Brouillon` (1), `Publiée` (2), `Clôturée` (3).
- **RG-OFF-04 : Référentiel des Lieux d'Affectation** : Toute offre d'emploi est obligatoirement rattachée à un lieu d'affectation officiel (`id_lieu NOT NULL`) issu de la table `lieu`.
- **RG-OFF-05 : Référentiel des Niveaux d'Étude** : Les exigences de formation du profil d'une offre reposent sur les clés étrangères `id_niveau_min` et `id_niveau_max` référençant la table `niveau`.
- **RG-UI-01 : Astérisques Rouges sur Formulaires** : Tout champ obligatoire dans les formulaires d'édition (ex: création d'offre) comporte un astérisque rouge `*` à côté de son libelle.

---

## 📌 2. Règles de Gestion sur le Workflow des Candidatures & Statuts RH
- **RG-CND-01 : Ordres de Workflow des Statuts Candidature** :
  - `10` : Reçue (statut initial par défaut)
  - `20` : Présélectionnée
  - `30` : Test
  - `40` : Entretien
  - `50` : Retenue (statut final positif)
  - `50` : Non retenue (statut final négatif)
- **RG-CND-02 : Règle de Non-Retour Workflow** : Il est strictement interdit de faire régresser ou basculer une candidature vers un statut ayant un `ordre_workflow` inférieur ou égal (`<=`) à son statut actuel.
- **RG-CND-03 : Déduplication des Candidats** : L'identification d'un candidat se fait sur son adresse e-mail unique (`candidat.email`). Plusieurs candidatures déposées avec la même adresse e-mail sont rattachées au même profil candidat.

---

## 📌 3. Règles de Gestion du Vivier RH (`dans_vivier`)
- **RG-VIV-01 : Portée du Vivier** : Le vivier RH s'applique à l'entité **Candidature** (`candidature.dans_vivier`), et non au candidat dans son ensemble.
- **RG-VIV-02 : Candidatures Spontanées** : Toute candidature spontanée (sans offre rattachée) est placée automatiquement dans le vivier RH (`dans_vivier = true`).
- **RG-VIV-03 : Verrouillage du Statut RH en Vivier** : Lorsqu'une candidature est enregistrée dans le vivier RH (`dans_vivier = true`), son statut RH est **verrouillé**. Aucun changement de statut RH ne peut être effectué tant que la candidature reste en vivier.
- **RG-VIV-04 : Exclusion des Candidatures Retenues** : Une candidature ayant le statut `Retenue` (ordre 50) **ne peut pas être placée dans le vivier RH**.

---

## 📌 4. Règles de Gestion sur les Référentiels & Domaines
- **RG-REF-01 : Validation des Domaines d'Expertise** : Les candidats peuvent saisir un poste souhaité libre lors d'une candidature spontanée. Cela crée un domaine au statut `valide = false`. Les administrateurs RH doivent valider ou rattacher ce domaine à une direction officielle avant exploitation complète.
- **RG-REF-02 : Droits d'Accès Référentiels** : La création, modification et suppression des directions, domaines et compétences sont réservées aux utilisateurs possédant la permission `manage_referentiels`.

---

## 📌 5. Règles de Gestion sur le Profil Candidat & Pièces Jointes
- **RG-CMP-01 : Rattachement des Données de Profil à la Candidature** : Les compétences (`candidat_competence`), expériences professionnelles (`candidat_experience_professionnelle`) et formations diplômantes (`candidat_formation`) sont directement rattachées à la **candidature** (`id_candidature`) pour préserver l'intégrité et la spécificité des pièces de chaque dossier.

---

## 📌 6. Règles de Nomenclatures d'Endpoints API & Routage RESTful
- **RG-END-01 : Harmonisation des Endpoints (Singulier vs Pluriel)** :
  - **Pluriel avec `s`** (`/offres`, `/candidatures`, `/directions`, `/domaines`, `/competences`) pour toutes les routes d'API renvoyant une collection ou liste de ressources.
  - **Singulier sans `s`** (`/offre/{id}`, `/candidature/{id}`, `/direction/{id}`, `/domaine/{id}`, `/competence/{id}`) pour toutes les routes ciblant une ressource spécifique identifiée par son `{id}`.
