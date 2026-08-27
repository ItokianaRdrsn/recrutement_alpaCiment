# 2026-08-27 - Gestion des compétences requises par offre

## Date

2026-08-27

## Tâche

Créer le référentiel des compétences (`type_competence`, `competence`) et permettre l'association de compétences requises avec niveau d'exigence à une offre d'emploi (`profil_competence`).

## Pourquoi faire cela

Le matching automatique entre candidatures et offres d'emploi repose sur les compétences. Il est indispensable de structurer un référentiel global de compétences (technique, langue, logiciel, etc.) et de permettre d'associer ces compétences à chaque offre avec un niveau requis (Débutant, Intermédiaire, Avancé, Expert).

## Actions réalisées

- Création de la migration `2026_08_27_000300_create_competence_tables.php` pour instancier les tables `type_competence`, `competence` et `profil_competence`.
- Insertion des données initiales du référentiel (Technique, Langue, Logiciel, Méthodologie, Autre) et compétences courantes (PHP/Laravel, React.js, PostgreSQL, etc.).
- Création des modèles Eloquent `TypeCompetence` et `Competence`.
- Ajout de la relation `competences()` dans le modèle `Offre`.
- Création du contrôleur `CompetenceController` et des routes `GET /api/competences` / `POST /api/competences`.
- Support de la synchronisation des compétences dans `OffreController::syncNestedRelations()`.
- Enrichissement de `ReferentialsView` avec une section de gestion des compétences.
- Enrichissement de `OffersView` avec un sélecteur de compétences interactif et choix du niveau requis.
- Affichage des badges de compétences requises dans la vue détaillée de chaque offre.

## Fichiers créés ou modifiés

### Fichiers créés

- `database/migrations/2026_08_27_000300_create_competence_tables.php` : migration des tables de compétences.
- `app/Models/TypeCompetence.php` : modèle pour les catégories de compétences.
- `app/Models/Competence.php` : modèle pour les compétences.
- `app/Http/Controllers/Api/CompetenceController.php` : contrôleur API pour lire et alimenter le référentiel.

### Fichiers modifiés

- `app/Models/Offre.php` : relation `belongsToMany` vers `Competence` via `profil_competence`.
- `app/Http/Resources/OffreResource.php` : inclusion des compétences rattachées dans la sortie JSON.
- `app/Http/Controllers/Api/OffreController.php` : synchronisation `$offre->competences()->sync($syncData)`.
- `routes/api.php` : déclaration des routes `/competences`.
- `recrutement-react/src/main.jsx` & `styles.css` : sélecteur de compétences, badges et gestion dans l'écran Référentiels.

## Explication du code

- **Table de liaison `profil_competence`** : contient la clé primaire composée `(id_offre, id_competence)` et la colonne `niveau_requis`.
- **Synchronisation Eloquent** : `sync()` réinitialise et associe les compétences sélectionnées avec leurs attributs pivot (`niveau_requis`).

## Explication simple

Les recruteurs peuvent désormais consulter le référentiel de compétences, en ajouter de nouvelles, et sélectionner les compétences indispensables pour chaque offre avec le niveau exigé.

## Justification technique

La table pivot `profil_competence` avec la méthode Eloquent `sync()` permet d'effectuer des mises à jour atomiques très rapides de la liste des compétences d'une offre sans laisser de données orphelines.

## Sources

- `[S1]` Laravel Eloquent - Many To Many Relationships & Sync, https://laravel.com/docs/eloquent-relationships#attaching-detaching

## Vérifications

- `php artisan migrate` : migration exécutée avec succès.
- `php artisan test` : suite de tests validée (13/13).
- `npm run build` : compilation React sans avertissement.

## Suite logique

Mise à disposition des offres publiées pour les candidats et génération de liens directs de candidature.
