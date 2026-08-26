# 2026-08-25 - Piste abandonnée : table de critères d'offre

## Note de correction

Cette fiche garde la trace d'une piste de modélisation qui a été corrigée ensuite.
La table séparée `critere_offre` n'a finalement pas été conservée.

La décision retenue est documentée dans `correction-profil-offre-valeurs-generiques.md` :

- conserver la table `profil_offre` ;
- remplacer les libellés trop spécifiques à l'expérience par des champs génériques ;
- garder `profil_formation` rattachée directement à `offre`.

Les sections ci-dessous décrivent donc une réflexion intermédiaire, pas l'état final de la base.

## Date

2026-08-25

## Tâche

Revoir la modélisation du profil recherché d'une offre.

Les colonnes `experience_min_annees` et `experience_max_annees` ont été retirées de `profil_offre`.
Une nouvelle table `critere_offre` a été ajoutée pour gérer les critères variables.
La table `profil_formation` référence maintenant directement `offre` avec `id_offre`.

## Pourquoi faire cela

Le profil recherché d'une offre ne se limite pas toujours à l'expérience professionnelle.
Selon le poste, les critères peuvent être différents :

- âge minimum ou maximum ;
- expérience minimum ;
- permis obligatoire ;
- disponibilité avant une date ;
- niveau ou domaine de formation ;
- autre critère spécifique au poste.

Mettre uniquement `experience_min_annees` et `experience_max_annees` dans `profil_offre` rendait le modèle trop rigide.

## Actions réalisées

- Suppression de `experience_min_annees` et `experience_max_annees` dans `profil_offre`.
- Création de la table `critere_offre`.
- Ajout des colonnes de critères :
  - `libelle` ;
  - `type_critere` ;
  - `valeur_min` ;
  - `valeur_max` ;
  - `valeur_attendue` ;
  - `unite` ;
  - `obligatoire` ;
  - `ordre`.
- Ajout de contraintes pour limiter les types de critères et imposer au moins une valeur.
- Modification de `profil_formation` pour utiliser `id_offre` au lieu de `id_profil_offre`.
- Création du modèle Eloquent `CritereOffre`.
- Mise à jour des relations Eloquent :
  - `Offre::criteres()` ;
  - `Offre::formations()` ;
  - `ProfilFormation::offre()`.
- Ajout de `ordre_workflow` dans `statut_offre`.
- Alignement du script SQL `sql/gestion_recrutement.sql`.

## Fichiers concernés pendant cette piste

Cette piste a temporairement concerné les fichiers suivants :

- `code_source/recrutement/database/migrations/2026_08_24_000200_create_offres_tables.php` : ajout temporaire d'une table `critere_offre`.
- `code_source/recrutement/app/Models/CritereOffre.php` : modèle temporaire supprimé ensuite.
- `code_source/recrutement/app/Models/Offre.php` : relation temporaire `criteres()` supprimée ensuite.
- `sql/gestion_recrutement.sql` : ajout temporaire de `critere_offre`, retiré ensuite.

Ces modifications ne représentent pas l'état final.
La version conservée est décrite dans `correction-profil-offre-valeurs-generiques.md`.

## Explication du code abandonné

L'idée était de créer une table fille `critere_offre` avec plusieurs lignes par offre.
Chaque ligne aurait représenté un critère : âge, expérience, permis, date ou autre.

Cette solution était plus flexible, mais elle ajoutait une couche de complexité trop tôt pour la V1.
Après correction, les valeurs génériques ont été replacées directement dans `profil_offre`.

## Explication simple

Avant, le profil d'une offre contenait directement deux champs :

```text
experience_min_annees
experience_max_annees
```

Mais tous les critères ne sont pas de l'expérience.
Le nouveau modèle permet d'écrire plusieurs critères pour une même offre.

Exemples :

```text
Critère : Age
Min : 21
Max : 45
Unité : ans
```

```text
Critère : Permis
Valeur attendue : B
```

```text
Critère : Disponibilité
Max : 2026-03-01
Type : date
```

## Justification technique

La séparation dans une table `critere_offre` évite de multiplier les colonnes dans `profil_offre` pour chaque nouveau besoin.
Elle rend le modèle plus extensible : ajouter un nouveau critère ne nécessite pas forcément une modification de la structure de `profil_offre`.

La clé étrangère `critere_offre.id_offre` garantit qu'un critère appartient toujours à une offre existante. `[POSTGRES-CONSTRAINTS]`

La modification de `profil_formation.id_offre` est cohérente avec les autres éléments d'une offre :

- `mission` référence déjà directement `offre` ;
- `profil_competence` référence déjà directement `offre` ;
- les formations requises sont aussi des exigences de l'offre.

Laravel permet de versionner ces changements dans les migrations, ce qui rend la structure de base reproductible. `[LARAVEL-MIGRATIONS]`

## Sources

- `[LARAVEL-MIGRATIONS]` Laravel - Database Migrations : https://laravel.com/framework/docs/migrations
- `[POSTGRES-CONSTRAINTS]` PostgreSQL - Constraints : https://www.postgresql.org/docs/current/ddl-constraints.html

## Vérifications

- `php -l` sur les fichiers PHP modifiés : aucune erreur de syntaxe.
- `php artisan migrate:fresh --seed` : migrations et seeders exécutés avec succès.
- Vérification PostgreSQL :
  - `profil_offre` ne contient plus `experience_min_annees` ni `experience_max_annees` ;
  - `profil_formation` contient `id_offre` ;
  - `critere_offre` existe avec ses colonnes de critères ;
  - `statut_offre` contient `ordre_workflow`.
- `php artisan test` : 4 tests réussis.

## Suite logique

Lors du CRUD des offres, prévoir une interface permettant d'ajouter plusieurs critères à une offre.
Chaque critère devra pouvoir être typé : âge, expérience, permis, date, formation ou autre.
