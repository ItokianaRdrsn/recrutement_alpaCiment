# 2026-08-25 - Socle Laravel, PostgreSQL et environnement de test

## Date

2026-08-25

## Tâche

Préparer le socle technique du projet Laravel pour pouvoir commencer le développement du module de recrutement :

- installation et réparation des dépendances Composer ;
- configuration Laravel avec PostgreSQL ;
- génération de la clé applicative ;
- création des premières migrations et données de départ ;
- validation par tests ;
- lancement du serveur local.

## Pourquoi faire cela

Le projet doit avoir une base stable avant d'ajouter les écrans métier : offres, candidatures, statuts, vivier, communication, OCR et matching.
Sans socle technique fiable, chaque nouvelle fonctionnalité risque d'être bloquée par des problèmes d'environnement, de base de données ou d'autoload PHP.

## Actions réalisées

- Vérification de PHP et Composer.
- Déplacement du dossier `vendor` hors OneDrive via une jonction Windows afin de réduire les erreurs de fichiers verrouillés pendant `composer install`.
- Réinstallation des dépendances Laravel.
- Correction de fichiers `vendor` tronqués après extraction Composer sur Windows.
- Configuration du fichier `.env` pour utiliser PostgreSQL :
  - base : `gestion_recrutement` ;
  - utilisateur : `postgres` ;
  - mot de passe local : `root`.
- Génération de `APP_KEY` avec Artisan.
- Sauvegarde de l'ancienne base PostgreSQL avant recréation.
- Exécution de `php artisan migrate:fresh --seed`.
- Correction du bootstrap des tests dans `tests/TestCase.php`, car le `vendor` externe faisait mal inférer le chemin racine du projet.
- Lancement du serveur local Laravel sur `http://127.0.0.1:8000/login`.

## Fichiers créés ou modifiés

### Configuration et dépendances

- `code_source/recrutement/.env` : configuration locale de Laravel, avec PostgreSQL comme base de données, le nom de l'application et la locale française.
- `code_source/recrutement/composer.json` : verrouillage de PHPUnit sur une version utilisable dans l'environnement Windows local.
- `code_source/recrutement/composer.lock` : mise à jour automatique des versions installées après correction Composer.
- `code_source/recrutement/vendor` : remplacé par une jonction Windows vers `AppData/Local` pour éviter les problèmes de verrouillage OneDrive.

### Routes et contrôleurs

- `code_source/recrutement/routes/web.php` : déclaration des routes `/`, `/login`, `/logout`, `/dashboard` et `/offres`.
- `code_source/recrutement/app/Http/Controllers/Auth/SessionController.php` : contrôleur de connexion et déconnexion.
- `code_source/recrutement/app/Http/Controllers/DashboardController.php` : contrôleur du tableau de bord.
- `code_source/recrutement/app/Http/Controllers/OffreController.php` : contrôleur de la liste des offres avec filtres.

### Base de données

- `code_source/recrutement/database/migrations/0001_01_01_000000_create_users_table.php` : ajout du rôle utilisateur.
- `code_source/recrutement/database/migrations/2026_08_20_132539_create_directions_table.php` : table `direction`.
- `code_source/recrutement/database/migrations/2026_08_24_000000_create_recruitment_reference_tables.php` : tables de référence comme `type_demande`, `statut_offre`, `type_contrat` et `statut_candidature`.
- `code_source/recrutement/database/migrations/2026_08_24_000100_create_domaines_table.php` : table `domaine`.
- `code_source/recrutement/database/migrations/2026_08_24_000200_create_offres_tables.php` : tables liées aux offres.
- `code_source/recrutement/database/seeders/DatabaseSeeder.php` : données de démarrage pour tester l'application.

### Modèles Eloquent

- `code_source/recrutement/app/Models/User.php` : utilisateur Laravel avec rôle.
- `code_source/recrutement/app/Models/Direction.php` : modèle de direction.
- `code_source/recrutement/app/Models/Domaine.php` : modèle de domaine.
- `code_source/recrutement/app/Models/Offre.php` : modèle principal d'offre.
- `code_source/recrutement/app/Models/Mission.php` : missions liées à une offre.
- `code_source/recrutement/app/Models/ProfilOffre.php` : profil recherché d'une offre.
- `code_source/recrutement/app/Models/ProfilFormation.php` : formations requises par une offre.
- `code_source/recrutement/app/Models/StatutOffre.php` : statut d'une offre.
- `code_source/recrutement/app/Models/StatutCandidature.php` : statut d'une candidature.
- `code_source/recrutement/app/Models/TypeDemande.php` : type de candidature.

### Vues et tests

- `code_source/recrutement/resources/views/auth/login.blade.php` : page de connexion.
- `code_source/recrutement/resources/views/dashboard.blade.php` : tableau de bord minimal.
- `code_source/recrutement/resources/views/offres/index.blade.php` : liste des offres.
- `code_source/recrutement/tests/TestCase.php` : correction du bootstrap pour charger le bon projet malgré le `vendor` externe.
- `code_source/recrutement/tests/Feature/ExampleTest.php` : tests de base sur login, dashboard et offres.

## Explication du code

### Routes web

Le fichier `routes/web.php` sépare les routes publiques et les routes protégées.

```php
Route::get('/login', [SessionController::class, 'create'])->name('login');
Route::post('/login', [SessionController::class, 'store'])->name('login.store');
```

Ces routes servent à afficher le formulaire de connexion et à traiter les identifiants.

```php
Route::middleware('auth')->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/offres', [OffreController::class, 'index'])->name('offres.index');
});
```

Le groupe `auth` protège le dashboard et la liste des offres.
Un utilisateur non connecté est redirigé vers `/login`.

### Connexion et déconnexion

Dans `SessionController`, la méthode `store()` valide l'email et le mot de passe, puis utilise `Auth::attempt()`.
Si les identifiants sont bons, la session est régénérée avec `$request->session()->regenerate()`.

Cette régénération est importante car elle limite les risques de fixation de session après connexion.

La méthode `destroy()` déconnecte l'utilisateur, invalide la session et régénère le token CSRF.

### Dashboard

`DashboardController` utilise `Schema::hasTable()` avant de compter les offres publiées.
Ce choix évite une erreur si le dashboard est appelé alors que les migrations ne sont pas encore toutes exécutées.

Le KPI `offres_en_cours` est calculé avec une jointure entre `offre` et `statut_offre`, puis un filtre sur le statut `Publiee`.

### Liste des offres

`OffreController` valide les filtres `direction` et `statut`, puis construit une requête Eloquent.

```php
$offres = Offre::query()
    ->with(['direction', 'statut', 'typeContrat'])
    ->when($filters['direction'] ?? null, ...)
    ->when($filters['statut'] ?? null, ...)
    ->paginate(10);
```

`with()` charge les relations nécessaires en avance.
Cela évite de refaire une requête SQL pour chaque offre affichée.

### Migrations

Les migrations créent les tables progressivement.
Par exemple, `2026_08_24_000200_create_offres_tables.php` crée `offre`, puis les tables dépendantes comme `profil_offre`, `mission` et `profil_formation`.

Les contraintes PostgreSQL sont ajoutées avec `DB::statement()` quand elles sont plus précises qu'une simple colonne Laravel.
Exemple : la date limite d'une offre ne doit pas être avant la date de publication.

### Seeders

`DatabaseSeeder` insère des données de test stables :

- un administrateur ;
- les directions ;
- les statuts ;
- les domaines ;
- les offres.

Le seeder utilise `updateOrCreate()` ou `updateOrInsert()` pour éviter de dupliquer les données si le seed est relancé.

### Tests

Les tests vérifient le comportement minimum :

- la page de connexion répond ;
- `/dashboard` redirige vers `/login` si l'utilisateur n'est pas connecté ;
- `/offres` redirige aussi vers `/login`.

Ces tests ne couvrent pas encore tout le métier, mais ils valident le socle de sécurité.

## Explication simple

Laravel a besoin de trois éléments de base pour fonctionner correctement :

- ses dépendances PHP dans `vendor` ;
- une clé secrète `APP_KEY` pour les mécanismes de sécurité ;
- une base de données cohérente avec les migrations.

Dans notre cas, OneDrive perturbait l'installation Composer en verrouillant ou tronquant certains fichiers.
Le fait de placer `vendor` dans `AppData/Local` garde le code du projet dans OneDrive, mais évite que les dépendances soient manipulées directement dans un dossier synchronisé.

Les migrations Laravel servent ensuite à créer les tables attendues par le code.
Les seeders ajoutent des données minimales pour tester rapidement l'application : utilisateur admin, directions, statuts, domaines et offres.

## Justification technique

Laravel recommande l'utilisation d'une clé d'application `APP_KEY` pour l'encryption et fournit la commande `php artisan key:generate` pour la générer de manière sûre. `[LARAVEL-APP-KEY]`

Les migrations sont adaptées au projet parce qu'elles versionnent la structure de la base de données dans le code, au lieu de dépendre uniquement d'un script SQL manuel. `[LARAVEL-MIGRATIONS]`

Les seeders conviennent pour insérer les données de référence nécessaires au démarrage de l'application, comme les statuts ou l'utilisateur administrateur. `[LARAVEL-SEEDING]`

Composer génère un autoload `vendor/autoload.php` pour charger les classes des dépendances PHP. Après réparation ou modification de dépendances, `composer dump-autoload` permet de reconstruire cet autoload. `[COMPOSER-AUTOLOAD]`

Avant de recréer la base avec `migrate:fresh`, une sauvegarde a été réalisée avec `pg_dump`, car PostgreSQL présente cet outil comme l'utilitaire standard d'export d'une base. `[POSTGRES-PGDUMP]`

## Sources

- `[LARAVEL-APP-KEY]` Laravel 13.x - Encryption et `APP_KEY` : https://laravel.com/docs/13.x/encryption
- `[LARAVEL-MIGRATIONS]` Laravel - Database Migrations : https://laravel.com/framework/docs/migrations
- `[LARAVEL-SEEDING]` Laravel 13.x - Database Seeding : https://laravel.com/docs/13.x/seeding
- `[COMPOSER-AUTOLOAD]` Composer - Basic usage / Autoloading : https://getcomposer.org/doc/01-basic-usage.md
- `[POSTGRES-PGDUMP]` PostgreSQL - `pg_dump` : https://www.postgresql.org/docs/current/app-pgdump.html

## Vérifications

- `php artisan migrate:fresh --seed` : migrations exécutées et données de départ insérées.
- `php artisan test` : 4 tests réussis.
- Requête HTTP sur `http://127.0.0.1:8000/login` : réponse `200`.

## Résultat

Le socle Laravel est prêt pour continuer le développement du module de recrutement.
La page de connexion est accessible et la base PostgreSQL correspond aux migrations du projet.

## Suite logique

La prochaine étape logique est de continuer le Sprint 1 :

- finaliser l'authentification et les rôles ;
- nettoyer l'interface de base ;
- préparer les vues de gestion des offres ;
- structurer progressivement la partie API pour le futur frontend React.
