# 2026-08-26 - Correction du chargement des offres récentes

## Date

2026-08-26

## Tâche

Corriger le chargement des offres récentes du dashboard API après une remarque de revue de code.

## Pourquoi faire cela

Le dashboard API charge les offres récentes avec les relations :

- `direction` ;
- `statut` ;
- `typeContrat`.

Avant la correction, le code vérifiait seulement l'existence de la table `offre`.
Cela pouvait être insuffisant pendant la création progressive du schéma, car Laravel pouvait ensuite essayer de charger des relations dont les tables n'existaient pas encore.

## Problème identifié

Le code faisait :

```php
$offresRecentes = Schema::hasTable('offre')
    ? Offre::query()
        ->with(['direction', 'statut', 'typeContrat'])
        ->limit(5)
        ->get()
    : collect();
```

La condition vérifiait `offre`, mais la requête utilisait aussi `direction`, `statut_offre` et `type_contrat`.

## Correction réalisée

La condition est maintenant centralisée avec deux méthodes :

```php
protected function canLoadRecentOffers(): bool
{
    return $this->hasTables('offre', 'direction', 'statut_offre', 'type_contrat');
}

protected function hasTables(string ...$tables): bool
{
    foreach ($tables as $table) {
        if (! Schema::hasTable($table)) {
            return false;
        }
    }

    return true;
}
```

Le chargement devient :

```php
$offresRecentes = $this->canLoadRecentOffers()
    ? Offre::query()
        ->with(['direction', 'statut', 'typeContrat'])
        ->limit(5)
        ->get()
    : collect();
```

## Fichiers modifiés

- `code_source/recrutement/app/Http/Controllers/Api/DashboardController.php`
- `code_source/recrutement/tests/Unit/DashboardControllerTest.php`
- `doc/suivi-developpement/sprint-1/taches.md`
- `doc/suivi-developpement/sprint-1/README.md`
- `doc/suivi-developpement/sprint-1/2026-08-26/finalisation-roles-permissions-tests.md`

## Tests ajoutés

Deux tests unitaires ont été ajoutés :

- le dashboard ne charge pas les offres récentes si une table liée manque ;
- le dashboard peut charger les offres récentes si toutes les tables nécessaires existent.

## Explication simple

La remarque Copilot était correcte.
Si on charge une offre avec ses relations, il faut vérifier que toutes les tables utilisées par ces relations existent.

La correction évite une erreur SQL pendant les étapes où la base est encore partiellement construite.

## Justification technique

`Schema::hasTable()` permet de vérifier l'existence d'une table avant d'exécuter une requête qui en dépend. `[LARAVEL-MIGRATIONS]`

Les eager-loads Eloquent déclenchent des requêtes supplémentaires vers les tables des relations. Il faut donc tenir compte de ces tables dans les gardes de stabilité. `[LARAVEL-RESOURCES]`

Les tests unitaires permettent de vérifier la logique de garde sans dépendre d'une base de données complète. `[LARAVEL-HTTP-TESTS]`

## Sources

- `[LARAVEL-MIGRATIONS]` Laravel - Database Migrations : https://laravel.com/framework/docs/migrations
- `[LARAVEL-RESOURCES]` Laravel 13.x - Eloquent API Resources : https://laravel.com/docs/13.x/eloquent-resources
- `[LARAVEL-HTTP-TESTS]` Laravel 13.x - HTTP Tests : https://laravel.com/docs/13.x/http-tests

## Vérifications

- `php -l` sur `DashboardController.php` : aucune erreur de syntaxe.
- `php -l` sur `DashboardControllerTest.php` : aucune erreur de syntaxe.
- `php artisan test --filter=DashboardControllerTest` : 2 tests réussis.
- `php artisan test` : 14 tests réussis.
