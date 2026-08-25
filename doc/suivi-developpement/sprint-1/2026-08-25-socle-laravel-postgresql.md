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

