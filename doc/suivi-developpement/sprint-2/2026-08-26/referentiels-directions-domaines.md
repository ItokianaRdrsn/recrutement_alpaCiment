# 2026-08-26 - Référentiels directions et domaines

## Date

2026-08-26

## Tâche

Démarrer le Sprint 2 avec le CRUD des directions, le CRUD des domaines et la validation des domaines en attente.

## Pourquoi faire cela

Les offres d'emploi dépendent directement des directions et des domaines.
Avant de créer des offres complètes, il faut permettre au back-office de gérer ces référentiels.

Ces données servent ensuite :

- aux filtres des offres ;
- au classement des candidatures spontanées ;
- à la navigation Direction -> Offre -> Candidats ;
- à la navigation Direction -> Domaine -> Candidatures spontanées.

## Actions réalisées

- Ajout d'un middleware `permission`.
- Ajout d'une permission `manage_referentiels` utilisée pour protéger l'écriture sur les référentiels.
- Création de l'API CRUD des directions.
- Création de l'API CRUD des domaines.
- Ajout d'une route de validation d'un domaine en attente.
- Création des resources JSON `DirectionResource` et `DomaineResource`.
- Ajout d'une route web `/referentiels` qui redirige vers l'interface React.
- Ajout d'un écran React `Référentiels`.
- Ajout des formulaires de création/modification des directions et domaines.
- Ajout des actions modifier, supprimer et valider.
- Ajout d'un test de permission : un RH ne peut pas créer une direction.

## Fichiers créés

- `code_source/recrutement/app/Http/Middleware/EnsureUserCanPerform.php`
- `code_source/recrutement/app/Http/Controllers/Api/DirectionController.php`
- `code_source/recrutement/app/Http/Controllers/Api/DomaineController.php`
- `code_source/recrutement/app/Http/Resources/DirectionResource.php`
- `code_source/recrutement/app/Http/Resources/DomaineResource.php`
- `doc/suivi-developpement/sprint-2/2026-08-26/referentiels-directions-domaines.md`

## Fichiers modifiés

- `code_source/recrutement/bootstrap/app.php`
- `code_source/recrutement/routes/api.php`
- `code_source/recrutement/routes/web.php`
- `code_source/recrutement/tests/Feature/BackOffice/RoleAccessTest.php`
- `code_source/recrutement-react/src/main.jsx`
- `code_source/recrutement-react/src/styles.css`
- `doc/suivi-developpement/sprint-2/README.md`
- `doc/suivi-developpement/sprint-2/taches.md`

## Explication du code

### Middleware `permission`

Le middleware `EnsureUserCanPerform` vérifie une permission précise :

```php
if (! $user || ! $user->canPerform($permission)) {
    abort(403, 'Permission insuffisante.');
}
```

Il est enregistré dans `bootstrap/app.php` avec l'alias `permission`.

### Routes directions

Les routes de lecture sont accessibles aux utilisateurs back-office connectés :

```text
GET /api/directions
GET /api/directions/{direction}
```

Les routes d'écriture sont protégées par `permission:manage_referentiels` :

```text
POST /api/directions
PUT /api/directions/{direction}
DELETE /api/directions/{direction}
```

La suppression d'une direction déjà utilisée est refusée avec une erreur `422`.

### Routes domaines

Les domaines ont les routes CRUD classiques :

```text
GET /api/domaines
POST /api/domaines
GET /api/domaines/{domaine}
PUT /api/domaines/{domaine}
DELETE /api/domaines/{domaine}
```

Une route spécifique permet de valider un domaine en attente :

```text
PATCH /api/domaines/{domaine}/valider
```

La validation renseigne :

- `valide = true` ;
- `date_validation = now()` ;
- `valide_par = utilisateur connecté`.

### Interface React

L'écran `/referentiels` affiche deux zones :

- directions ;
- domaines.

Si l'utilisateur possède `manage_referentiels`, il voit les formulaires et les boutons d'action.
Sinon, l'écran reste consultable en lecture seule.

## Explication simple

On a commencé le Sprint 2 par les données de base.
Avant de créer une offre, le système doit savoir dans quelle direction et dans quel domaine elle se trouve.

L'admin peut maintenant gérer ces données depuis l'écran `Référentiels`.

## Justification technique

Les middlewares Laravel permettent de protéger certaines routes avant l'exécution des contrôleurs. `[LARAVEL-MIDDLEWARE]`

La validation Laravel vérifie les champs reçus avant de créer ou modifier les modèles. `[LARAVEL-VALIDATION]`

Les resources Eloquent centralisent le format JSON retourné au frontend. `[LARAVEL-RESOURCES]`

React permet d'ajouter un écran back-office dynamique qui consomme les API Laravel. `[REACT-COMPONENTS]`

## Sources

- `[LARAVEL-MIDDLEWARE]` Laravel 13.x - Middleware : https://laravel.com/docs/13.x/middleware
- `[LARAVEL-VALIDATION]` Laravel 13.x - Validation : https://laravel.com/docs/13.x/validation
- `[LARAVEL-RESOURCES]` Laravel 13.x - Eloquent API Resources : https://laravel.com/docs/13.x/eloquent-resources
- `[REACT-COMPONENTS]` React - Learn / Components and Hooks : https://react.dev/learn

## Vérifications

- `php -l` sur les contrôleurs, middlewares et resources : aucune erreur de syntaxe.
- `php artisan route:list --path=api` : 17 routes API enregistrées.
- `php artisan test` : 13 tests réussis.
- `npm install` dans `code_source/recrutement-react` : dépendances installées.
- `npm run build` dans `code_source/recrutement-react` : build React réussi.

## Suite logique

Continuer le Sprint 2 avec le CRUD des offres d'emploi, puis la gestion de leur statut : brouillon, publiée, clôturée.
