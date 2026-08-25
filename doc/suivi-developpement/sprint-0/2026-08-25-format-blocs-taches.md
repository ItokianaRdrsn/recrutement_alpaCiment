# 2026-08-25 - Format en blocs pour les tâches

## Date

2026-08-25

## Tâche

Remplacer les tableaux de tâches par une présentation en blocs séparés dans les fichiers `taches.md`.

## Pourquoi faire cela

Les tableaux donnaient une vue structurée, mais ils devenaient difficiles à lire quand les descriptions étaient longues.
Le suivi doit rester confortable à consulter dans VS Code, surtout pendant le développement.

## Actions réalisées

- Transformation des tâches de `sprint-0` à `sprint-7` en blocs distincts.
- Conservation des statuts visibles :
  - `**[FAIT]**` ;
  - `**[EN COURS]**` ;
  - `**[A FAIRE]**`.
- Ajout de séparateurs `---` entre les tâches.
- Conservation de l'estimation et des notes sous chaque tâche.
- Conservation d'un résumé d'avancement en haut de chaque fichier.

## Explication simple

Chaque tâche ressemble maintenant à une petite fiche.
On voit d'abord le statut, puis le titre, puis les détails importants.

Exemple :

```md
### **[EN COURS]** Authentification et gestion des rôles RH / admin

- **Estimation :** 2,0 j
- **Notes :** Connexion de base créée. Il reste à finaliser les middlewares.
```

Ce format est plus lisible quand on parcourt rapidement le sprint.

## Justification technique

Markdown permet d'organiser un document avec des titres, listes et séparateurs horizontaux.
Ce format est plus adapté ici qu'un tableau, car les notes peuvent être longues et évoluer au fil du projet.

Les tableaux restent utiles pour les synthèses courtes, mais les blocs sont plus lisibles pour un suivi détaillé.
GitHub documente les listes, les titres et la syntaxe Markdown de base, ce qui rend ce format portable dans VS Code, GitHub et un futur export de rapport. `[GITHUB-MARKDOWN-TASKS]`

## Sources

- `[GITHUB-MARKDOWN-TASKS]` GitHub Docs - Basic writing and formatting syntax : https://docs.github.com/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
- `[GFM-SPEC]` GitHub Flavored Markdown Spec : https://github.github.com/gfm/

## Vérifications

- Vérification de la présence du format en blocs dans les 8 fichiers `taches.md`.
- Vérification que chaque tâche conserve un statut visible.
- Vérification que chaque sprint conserve son total d'estimation.

## Suite logique

Utiliser ce format pour toutes les futures listes de tâches de sprint.

