# Sprint 1 - Socle technique, sécurité et référentiels de base

## Objectif

Installer une base technique stable pour commencer le développement métier : environnement Laravel/PostgreSQL, migrations, authentification, rôles, API et première structure d'interface.

## Estimation

8,0 jours.

## Documents du sprint

- `taches.md` : liste des tâches prévues.
- `2026-08-25/socle-laravel-postgresql.md` : fiche de suivi sur la préparation Laravel, PostgreSQL, Composer, migrations, seeders et tests.
- `2026-08-25/referentiel-type-contrat.md` : création du référentiel des types de contrat et liaison avec les offres.
- `2026-08-25/refonte-profil-offre-criteres.md` : première réflexion sur les critères variables, corrigée ensuite.
- `2026-08-25/correction-profil-offre-valeurs-generiques.md` : conservation de `profil_offre` avec des champs génériques.
- `2026-08-26/architecture-api-rest-roles.md` : mise en place de l'API REST interne et du middleware de rôles.
- `2026-08-26/installation-react-vite-navigation.md` : installation de React/Vite dans un projet séparé et première interface back-office.
- `2026-08-26/finalisation-roles-permissions-tests.md` : finalisation des rôles RH/admin, permissions et tests du sprint.

## Etat actuel

Le socle Laravel/PostgreSQL est lancé et testable.
L'architecture API REST de base est en place.
React/Vite est installé dans `code_source/recrutement-react` et une première interface back-office existe pour le dashboard et les offres.
Laravel reste dans `code_source/recrutement` pour l'API, l'authentification et PostgreSQL.
Les rôles RH/admin sont centralisés et testés.
Le Sprint 1 est prêt pour servir de base au Sprint 2.

## Sources utiles

- `../sources.md` : Laravel, Composer, PostgreSQL, React.
