# 2026-08-26 - Architecture API REST et middleware de rôles

## Date

2026-08-26

## Tâche

Mettre en place une première architecture API REST interne pour le back-office, avec protection par authentification et rôles `rh` / `admin`.

## Pourquoi faire cela

Le projet utilisera React pour l'interface.
React aura besoin de récupérer les données Laravel sous forme JSON.

Avant de créer les écrans React, il faut donc définir :

- où seront les routes API ;
- comment les réponses JSON seront structurées ;
- comment les routes seront protégées ;
- comment les rôles RH/admin seront contrôlés.

## Actions réalisées

- Activation du fichier `routes/api.php` dans `bootstrap/app.php`.
- Création d'un middleware `role`.
- Protection des routes back-office web par `auth` + `role:rh,admin`.
- Création des routes API :
  - `GET /api/me` ;
  - `GET /api/dashboard` ;
  - `GET /api/referentiels/recrutement` ;
  - `GET /api/offres` ;
  - `GET /api/offres/{offre}`.
- Création de contrôleurs API.
- Création d'une resource JSON pour les offres.
- Ajout de tests d'accès API.

## Fichiers créés ou modifiés

### Fichiers créés

- `code_source/recrutement/routes/api.php` : routes API internes du back-office.
- `code_source/recrutement/app/Http/Controllers/Api/DashboardController.php` : endpoint API qui fournit les premiers KPI du dashboard.
- `code_source/recrutement/app/Http/Middleware/EnsureUserHasRole.php` : middleware qui vérifie le rôle de l'utilisateur connecté.
- `code_source/recrutement/app/Http/Controllers/Api/MeController.php` : endpoint qui retourne l'utilisateur connecté.
- `code_source/recrutement/app/Http/Controllers/Api/ReferentielController.php` : endpoint qui retourne les référentiels utiles au recrutement.
- `code_source/recrutement/app/Http/Controllers/Api/OffreController.php` : endpoints API de lecture des offres.
- `code_source/recrutement/app/Http/Resources/OffreResource.php` : format JSON standard d'une offre.
- `code_source/recrutement/tests/Feature/Api/ApiAccessTest.php` : tests d'authentification et de rôles sur l'API.

### Fichiers modifiés

- `code_source/recrutement/bootstrap/app.php` : enregistrement de `routes/api.php` et de l'alias middleware `role`.
- `code_source/recrutement/routes/web.php` : protection du dashboard et des offres avec `role:rh,admin`.
- `doc/suivi-developpement/sources.md` : ajout des sources Laravel sur routing, middleware, authentification, resources et validation.
- `doc/suivi-developpement/sprint-1/taches.md` : mise à jour de l'état d'avancement.
- `doc/suivi-developpement/sprint-1/README.md` : ajout de cette fiche.

## Explication du code

### Enregistrement des routes API

Dans `bootstrap/app.php`, le fichier API est déclaré avec :

```php
api: __DIR__.'/../routes/api.php',
```

Laravel charge alors les routes de `routes/api.php` avec le préfixe `/api`.
Une route définie comme `/me` devient donc accessible via `/api/me`.

### Alias du middleware `role`

Toujours dans `bootstrap/app.php`, l'alias est déclaré :

```php
$middleware->alias([
    'role' => \App\Http\Middleware\EnsureUserHasRole::class,
]);
```

Cela permet ensuite d'écrire simplement `role:rh,admin` dans les routes.

### Middleware de rôle

Le middleware `EnsureUserHasRole` récupère l'utilisateur connecté avec `$request->user()`.
Il compare ensuite son rôle avec la liste autorisée.

```php
if (! $user || ! in_array($user->role, $roles, true)) {
    abort(403, 'Acces non autorise pour ce role.');
}
```

Si l'utilisateur n'est pas connecté ou n'a pas le bon rôle, la requête est refusée.
Sinon, elle continue vers le contrôleur.

### Routes API

Dans `routes/api.php`, les routes sont groupées avec :

```php
Route::middleware(['web', 'auth', 'role:rh,admin'])->group(function (): void {
    ...
});
```

Le middleware `web` permet de réutiliser l'authentification par session déjà utilisée par le back-office.
Le middleware `auth` impose la connexion.
Le middleware `role:rh,admin` limite l'accès aux utilisateurs RH ou admin.

### Endpoint `/api/me`

`MeController` retourne l'utilisateur connecté :

```json
{
  "data": {
    "id": 1,
    "name": "Responsable RH",
    "email": "rh@example.test",
    "role": "rh"
  }
}
```

Ce endpoint sera utile côté React pour connaître l'utilisateur courant.

### Endpoint `/api/dashboard`

`Api\DashboardController` retourne les premiers indicateurs du tableau de bord :

- nombre total d'offres ;
- nombre d'offres publiées ;
- nombre de domaines en attente ;
- compteurs de candidatures préparés pour les prochains modules ;
- liste des offres récentes.

Le contrôleur vérifie l'existence des tables avec `Schema::hasTable()` afin de garder le dashboard stable pendant la construction progressive de la base.

### Endpoint des référentiels

`ReferentielController` retourne les données nécessaires aux formulaires et filtres :

- directions ;
- domaines ;
- statuts d'offre ;
- types de contrat.

Ces données alimenteront par exemple les listes déroulantes React.

### Endpoints des offres

`Api\OffreController@index` accepte des filtres :

- `direction` ;
- `statut` ;
- `type_contrat` ;
- `q` pour une recherche texte ;
- `per_page` pour la pagination.

Les filtres sont validés avec `$request->validate()`, puis appliqués à la requête Eloquent avec `when()`.

### Resource JSON `OffreResource`

`OffreResource` centralise la forme JSON d'une offre.
Cela évite d'écrire le format de réponse directement dans le contrôleur.

Elle retourne notamment :

- les informations principales de l'offre ;
- la direction ;
- le statut ;
- le type de contrat ;
- le profil ;
- les missions ;
- les formations.

### Tests API

`ApiAccessTest` vérifie trois cas :

- un visiteur non connecté reçoit `401` ;
- un utilisateur avec rôle `manager` reçoit `403` ;
- un utilisateur `rh` reçoit bien les informations de `/api/me`.

## Explication simple

On a créé une première porte d'entrée JSON pour React.
Pour l'instant, elle permet surtout de lire les données et de vérifier que seuls les RH/admin peuvent accéder au back-office API.

## Justification technique

Laravel sépare naturellement les routes web et les routes API. `[LARAVEL-ROUTING]`

Les middlewares sont adaptés pour filtrer les requêtes avant d'arriver aux contrôleurs. `[LARAVEL-MIDDLEWARE]`

L'authentification Laravel fournit l'utilisateur courant via `$request->user()`. `[LARAVEL-AUTHENTICATION]`

Les resources Eloquent permettent de centraliser la transformation des modèles en JSON. `[LARAVEL-RESOURCES]`

La validation des filtres avec `$request->validate()` évite d'utiliser directement des paramètres non contrôlés dans les requêtes. `[LARAVEL-VALIDATION]`

## Sources

- `[LARAVEL-ROUTING]` Laravel 13.x - Routing : https://laravel.com/docs/13.x/routing
- `[LARAVEL-MIDDLEWARE]` Laravel 13.x - Middleware : https://laravel.com/docs/13.x/middleware
- `[LARAVEL-AUTHENTICATION]` Laravel 13.x - Authentication : https://laravel.com/docs/13.x/authentication
- `[LARAVEL-RESOURCES]` Laravel 13.x - Eloquent API Resources : https://laravel.com/docs/13.x/eloquent-resources
- `[LARAVEL-VALIDATION]` Laravel 13.x - Validation : https://laravel.com/docs/13.x/validation

## Vérifications

- `php -l` sur les fichiers PHP ajoutés ou modifiés : aucune erreur de syntaxe.
- `php artisan route:list --path=api` : 5 routes API enregistrées.
- `php artisan test` : 7 tests réussis.

## Suite logique

Continuer le Sprint 1 avec l'installation de React/Vite et une première structure de navigation back-office qui consomme progressivement cette API.
