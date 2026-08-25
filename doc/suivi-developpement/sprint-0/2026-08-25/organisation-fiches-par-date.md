# 2026-08-25 - Organisation des fiches par date

## Date

2026-08-25

## Tâche

Réorganiser les fiches de suivi datées dans des dossiers portant uniquement la date.

## Pourquoi faire cela

Les anciens noms comme `2026-08-25-socle-laravel-postgresql` mélangeaient deux informations dans le même nom :

- la date ;
- la description de la tâche.

Pour mieux lire les dossiers de sprint, il est plus clair de séparer ces deux éléments :

```text
sprint-1/2026-08-25/socle-laravel-postgresql.md
```

## Actions réalisées

- Création du dossier `2026-08-25` dans `sprint-0`.
- Création du dossier `2026-08-25` dans `sprint-1`.
- Déplacement des fiches datées dans le dossier correspondant.
- Suppression de la date dans le nom des fichiers déplacés.
- Mise à jour des références dans les README.
- Mise à jour de la convention dans le README principal du suivi.

## Explication simple

Chaque sprint contient maintenant :

```text
README.md
taches.md
2026-08-25/
```

Dans le dossier de date, les fichiers gardent seulement leur sujet :

```text
socle-laravel-postgresql.md
referentiel-type-contrat.md
```

Cela rend le suivi plus propre et plus facile à parcourir.

## Justification technique

Cette organisation évite les noms de fichiers trop longs.
Elle permet aussi de regrouper naturellement les décisions prises le même jour.

Le format Markdown reste inchangé : seules l'arborescence et la convention de nommage changent.
La documentation reste donc lisible dans VS Code, GitHub et dans un futur export de rapport.

## Sources

- `[GITHUB-MARKDOWN-TASKS]` GitHub Docs - Basic writing and formatting syntax : https://docs.github.com/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax

## Vérifications

- Vérification que les fiches datées sont dans `sprint-0/2026-08-25/` et `sprint-1/2026-08-25/`.
- Vérification qu'il ne reste plus de référence active à l'ancien format avec date et description dans le même nom de fichier.
- Vérification que les fichiers `README.md` et `taches.md` restent à la racine de chaque sprint.

## Suite logique

Pour les prochaines interventions, créer ou réutiliser le dossier de la date du jour dans le sprint concerné, puis ajouter un fichier nommé seulement avec la description de la tâche.
