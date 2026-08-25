# Suivi de développement

Ce dossier sert de journal technique pour le projet de recrutement AlpA Ciment.
Il permettra de reconstruire le cheminement du projet au moment de rédiger le livre ou le rapport final.

## Organisation

- `modele-entree.md` : modèle à réutiliser pour chaque nouvelle tâche.
- `sources.md` : sources officielles et références techniques utilisées pour justifier les choix.
- `planning-sprints.md` : vue globale des sprints et du total de charge.
- `sprint-0/` à `sprint-7/` : dossiers de suivi par sprint.

Dans chaque dossier de sprint :

- `README.md` : objectif du sprint et documents associés.
- `taches.md` : liste des tâches, estimation et statut.
- Les dossiers datés `YYYY-MM-DD/` : fiches de suivi du jour, avec des noms descriptifs.

## Règle de documentation

À chaque intervention importante, ajouter une fiche avec :

- la date ;
- la tâche réalisée ;
- le problème ou besoin de départ ;
- les actions effectuées ;
- les fichiers créés ou modifiés ;
- l'explication du code important ;
- l'explication simple pour comprendre ;
- la justification technique ;
- les sources utilisées ;
- les tests ou vérifications réalisés ;
- la suite logique.

## Convention de nommage

Format recommandé :

```text
YYYY-MM-DD/nom-court-de-la-tache.md
```

Exemple :

```text
sprint-1/2026-08-25/socle-laravel-postgresql.md
```
