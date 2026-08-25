# 2026-08-25 - Organisation de la documentation par sprint

## Date

2026-08-25

## Tâche

Organiser le suivi de développement dans des dossiers séparés par sprint, avec une liste de tâches pour chaque sprint.

## Pourquoi faire cela

Le projet doit être documenté au fur et à mesure afin de faciliter la rédaction du livre ou rapport final.
Une organisation par sprint permet de retrouver rapidement :

- ce qui était prévu ;
- ce qui a été réalisé ;
- pourquoi les choix ont été faits ;
- quelles sources justifient les décisions techniques ;
- quelles vérifications ont été effectuées.

## Actions réalisées

- Création des dossiers `sprint-0` à `sprint-7`.
- Création d'un `README.md` dans chaque sprint pour expliquer l'objectif du sprint.
- Création d'un `taches.md` dans chaque sprint avec les tâches, estimations, statuts et notes.
- Création de `planning-sprints.md` pour garder une vue globale du scope de 70 jours.
- Déplacement de la fiche `2026-08-25-socle-laravel-postgresql.md` dans `sprint-1`, car elle concerne le socle technique.
- Mise à jour du `README.md` principal du suivi de développement.

## Explication simple

Au lieu d'avoir tous les documents mélangés dans un seul dossier, chaque sprint possède maintenant son propre espace.
Quand une fonctionnalité sera développée, sa fiche de suivi sera ajoutée dans le dossier du sprint correspondant.

Exemple :

```text
doc/suivi-developpement/sprint-2/2026-08-XX-crud-offres.md
```

Cette méthode rendra le rapport final plus facile à construire, car chaque sprint aura déjà son historique.

## Justification technique

Le découpage par sprint suit la logique de gestion de projet : analyser, construire le socle, développer les fonctionnalités métier, tester, puis finaliser.

Les sources techniques sont centralisées dans `sources.md` pour éviter de répéter les mêmes liens dans tous les fichiers.
Les fiches datées peuvent ensuite citer ces sources par référence, par exemple `[LARAVEL-MIGRATIONS]` ou `[POSTGRES-PGDUMP]`.

Cette organisation est aussi cohérente avec l'utilisation de Laravel et des migrations : les changements sont documentés étape par étape, comme la structure de la base est versionnée étape par étape.

## Sources

- `[LARAVEL-MIGRATIONS]` Laravel - Database Migrations : https://laravel.com/framework/docs/migrations
- `[COMPOSER-AUTOLOAD]` Composer - Basic usage / Autoloading : https://getcomposer.org/doc/01-basic-usage.md
- `[POSTGRES-PGDUMP]` PostgreSQL - `pg_dump` : https://www.postgresql.org/docs/current/app-pgdump.html

## Vérifications

- Vérification de l'existence des dossiers `sprint-0` à `sprint-7`.
- Vérification de la présence des fichiers `README.md` et `taches.md` dans chaque sprint.
- Vérification que la fiche du socle Laravel/PostgreSQL est bien placée dans `sprint-1`.

## Suite logique

Continuer le Sprint 1 en documentant chaque étape dans `doc/suivi-developpement/sprint-1/`.

