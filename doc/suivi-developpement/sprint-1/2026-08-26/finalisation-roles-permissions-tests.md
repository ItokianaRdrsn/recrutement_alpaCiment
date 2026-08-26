# 2026-08-26 - Finalisation des rôles, permissions et tests

## Date

2026-08-26

## Tâche

Finaliser la gestion des rôles RH/admin, stabiliser les permissions et clôturer les tests techniques du Sprint 1.

## Pourquoi faire cela

Le back-office ne doit pas seulement vérifier qu'un utilisateur est connecté.
Il doit aussi savoir quel type d'utilisateur est connecté et quelles actions il peut réaliser.

Pour le projet, les deux rôles de départ sont :

- `admin` : accès back-office complet, gestion des référentiels et futurs utilisateurs ;
- `rh` : accès back-office RH et gestion opérationnelle des offres/candidatures.

Centraliser ces rôles évite de recopier les chaînes `admin` et `rh` dans tout le code.

## Actions réalisées

- Création d'un enum PHP `UserRole`.
- Centralisation des rôles `admin` et `rh`.
- Ajout des libellés lisibles des rôles.
- Ajout des permissions de base.
- Mise à jour du modèle `User` avec des méthodes de contrôle de rôle.
- Mise à jour du middleware `EnsureUserHasRole`.
- Mise à jour de `/api/me` pour retourner le rôle, le libellé et les permissions.
- Ajout des rôles au référentiel API de recrutement.
- Mise à jour de la factory `UserFactory` avec les états `admin()` et `rh()`.
- Mise à jour du seeder admin avec l'enum `UserRole`.
- Ajout de tests d'accès back-office et API.

## Fichiers créés

- `code_source/recrutement/app/Enums/UserRole.php`
- `code_source/recrutement/tests/Feature/BackOffice/RoleAccessTest.php`

## Fichiers modifiés

- `code_source/recrutement/app/Models/User.php`
- `code_source/recrutement/app/Http/Middleware/EnsureUserHasRole.php`
- `code_source/recrutement/app/Http/Controllers/Api/MeController.php`
- `code_source/recrutement/app/Http/Controllers/Api/ReferentielController.php`
- `code_source/recrutement/database/factories/UserFactory.php`
- `code_source/recrutement/database/seeders/DatabaseSeeder.php`
- `code_source/recrutement/routes/web.php`
- `code_source/recrutement/routes/api.php`
- `code_source/recrutement/tests/Feature/Api/ApiAccessTest.php`
- `doc/suivi-developpement/sources.md`
- `doc/suivi-developpement/sprint-1/taches.md`
- `doc/suivi-developpement/sprint-1/README.md`

## Explication du code

### Enum `UserRole`

`UserRole` définit les rôles autorisés :

```php
case Admin = 'admin';
case Rh = 'rh';
```

Il fournit aussi :

- `backOfficeValues()` pour les rôles qui peuvent entrer dans le back-office ;
- `label()` pour afficher un libellé lisible ;
- `permissions()` pour connaître les actions autorisées ;
- `allows()` pour vérifier une permission.

### Modèle `User`

Le modèle `User` possède maintenant :

```php
roleEnum()
hasRole()
canPerform()
permissions()
```

Cela permet d'écrire la logique de rôle dans le modèle au lieu de faire des comparaisons manuelles partout.

### Middleware `EnsureUserHasRole`

Avant, le middleware comparait directement la chaîne `$user->role`.
Maintenant il utilise :

```php
$user->hasRole(...$roles)
```

Le contrôle reste simple, mais il s'appuie sur une logique centralisée.

### Endpoint `/api/me`

L'endpoint retourne maintenant :

- l'identité de l'utilisateur ;
- le code du rôle ;
- le libellé du rôle ;
- la liste des permissions.

React pourra donc adapter progressivement l'interface selon les droits de l'utilisateur.

### Tests ajoutés

Les tests vérifient :

- qu'un visiteur non connecté ne peut pas utiliser l'API ;
- qu'un rôle non autorisé reçoit `403` ;
- qu'un RH reçoit ses informations et permissions ;
- qu'un RH peut accéder au dashboard ;
- qu'un admin peut accéder aux offres ;
- qu'un rôle non back-office est refusé ;
- que les permissions attendues existent.

## Explication simple

On a rendu les rôles plus propres.
Au lieu d'éparpiller `admin` et `rh` partout, le projet a maintenant un fichier central qui dit :

- quels rôles existent ;
- ce qu'ils veulent dire ;
- ce qu'ils ont le droit de faire.

## Justification technique

Les enums PHP permettent de représenter un ensemble fermé de valeurs possibles, ce qui convient aux rôles de départ. `[PHP-ENUMERATIONS]`

Les middlewares Laravel sont faits pour filtrer les requêtes avant l'exécution des contrôleurs. `[LARAVEL-MIDDLEWARE]`

L'authentification Laravel permet de récupérer l'utilisateur courant avec `$request->user()`. `[LARAVEL-AUTHENTICATION]`

Les tests HTTP Laravel permettent de vérifier les statuts `401`, `403` et les redirections. `[LARAVEL-HTTP-TESTS]`

## Sources

- `[PHP-ENUMERATIONS]` PHP Manual - Enumerations : https://www.php.net/manual/en/language.enumerations.php
- `[LARAVEL-MIDDLEWARE]` Laravel 13.x - Middleware : https://laravel.com/docs/13.x/middleware
- `[LARAVEL-AUTHENTICATION]` Laravel 13.x - Authentication : https://laravel.com/docs/13.x/authentication
- `[LARAVEL-HTTP-TESTS]` Laravel 13.x - HTTP Tests : https://laravel.com/docs/13.x/http-tests

## Vérifications

- `php -l` sur les fichiers PHP modifiés : aucune erreur de syntaxe.
- `php artisan route:list --path=api` : 6 routes API enregistrées.
- `php artisan migrate:status` : les 7 migrations principales sont exécutées.
- `php artisan test` : 12 tests réussis.
- `npm run build` dans `code_source/recrutement-react` : build React réussi.

## Suite logique

Le Sprint 1 peut servir de socle pour le Sprint 2 : CRUD directions, domaines, offres et statuts d'offre.
