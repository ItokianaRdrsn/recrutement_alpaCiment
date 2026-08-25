# 2026-08-25 - Lisibilité des statuts de tâches

## Date

2026-08-25

## Tâche

Améliorer la lisibilité des statuts dans les fichiers `taches.md` de chaque sprint.

## Pourquoi faire cela

Les statuts écrits simplement comme `Fait`, `En cours` ou `A faire` étaient corrects, mais pas assez visibles lors d'une lecture rapide.
Pour le suivi quotidien et pour la rédaction du rapport final, il est préférable de voir immédiatement l'état d'avancement d'un sprint.

## Actions réalisées

- Ajout d'une section `Avancement` en haut de chaque fichier `taches.md`.
- Ajout d'une section `Légende` pour expliquer les statuts.
- Remplacement des statuts simples par des badges textuels :
  - `**[FAIT]**` ;
  - `**[EN COURS]**` ;
  - `**[A FAIRE]**`.
- Mise à jour du Sprint 1 pour distinguer les tâches déjà faites, en cours et encore à faire.

## Explication simple

Chaque sprint commence maintenant par un petit tableau récapitulatif.
Cela permet de voir rapidement combien de tâches sont terminées, commencées ou non commencées.

Les badges textuels sont volontairement simples pour rester lisibles dans VS Code, GitHub ou dans un export Markdown.

## Justification technique

Le format Markdown en tableau est adapté au suivi de tâches, car il permet d'aligner les informations importantes : tâche, estimation, statut et notes.
GitHub documente l'utilisation des tableaux Markdown pour organiser l'information. `[GITHUB-MARKDOWN-TABLES]`

Le choix de badges textuels plutôt que de cases à cocher vient du besoin de gérer trois états, pas seulement deux.
Les task lists Markdown sont utiles pour `fait / non fait`, mais notre suivi a aussi besoin de l'état intermédiaire `en cours`. `[GITHUB-MARKDOWN-TASKS]`

## Sources

- `[GITHUB-MARKDOWN-TASKS]` GitHub Docs - Basic writing and formatting syntax / task lists : https://docs.github.com/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
- `[GITHUB-MARKDOWN-TABLES]` GitHub Docs - Organizing information with tables : https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-tables
- `[GFM-SPEC]` GitHub Flavored Markdown Spec : https://github.github.com/gfm/

## Vérifications

- Vérification des fichiers `taches.md` de `sprint-0` à `sprint-7`.
- Vérification que chaque fichier possède une section `Avancement`.
- Vérification que les statuts utilisent le même format dans tous les sprints.

## Suite logique

Mettre à jour le tableau d'avancement dès qu'une tâche change de statut.

