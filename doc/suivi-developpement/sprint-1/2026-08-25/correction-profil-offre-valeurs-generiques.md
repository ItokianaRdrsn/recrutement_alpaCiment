# 2026-08-25 - Correction du profil d'offre avec valeurs génériques

## Date

2026-08-25

## Tâche

Corriger la refonte du profil d'offre.

La table `profil_offre` est conservée, mais les colonnes trop spécifiques à l'expérience sont remplacées par des champs génériques.

## Pourquoi faire cela

Le besoin n'était pas de créer une table séparée pour tous les critères.
Le besoin était surtout de ne pas limiter le profil d'une offre à l'expérience professionnelle.

Dans une offre, les valeurs minimum et maximum peuvent représenter :

- une expérience ;
- un âge ;
- une date ;
- une contrainte de permis ;
- une autre condition du profil recherché.

## Actions réalisées

- Suppression de la table `critere_offre` dans les migrations Laravel.
- Suppression du modèle `CritereOffre`.
- Conservation de la table `profil_offre`.
- Ajout de champs génériques dans `profil_offre` :
  - `type_valeur` ;
  - `valeur_min` ;
  - `valeur_max` ;
  - `valeur_attendue` ;
  - `unite_valeur`.
- Mise à jour du modèle `ProfilOffre`.
- Conservation de `profil_formation.id_offre`, car les formations requises sont liées directement à une offre.
- Alignement du script SQL `sql/gestion_recrutement.sql`.

## Fichiers créés ou modifiés

### Fichiers supprimés

- `code_source/recrutement/app/Models/CritereOffre.php` : supprimé, car la table séparée `critere_offre` n'est pas conservée.

### Fichiers modifiés

- `code_source/recrutement/database/migrations/2026_08_24_000200_create_offres_tables.php` : suppression de `critere_offre`, ajout des champs génériques dans `profil_offre`, rattachement de `profil_formation` à `offre`.
- `code_source/recrutement/app/Models/ProfilOffre.php` : ajout des champs génériques dans `$fillable`.
- `code_source/recrutement/app/Models/ProfilFormation.php` : remplacement de la relation vers `ProfilOffre` par une relation directe vers `Offre`.
- `code_source/recrutement/app/Models/Offre.php` : ajout de la relation `formations()`.
- `sql/gestion_recrutement.sql` : même correction côté script SQL complet.
- `doc/suivi-developpement/sprint-1/2026-08-25/refonte-profil-offre-criteres.md` : l'ancienne piste est marquée comme abandonnée.

## Explication du code

### Table `profil_offre`

La table `profil_offre` reste liée à une seule offre grâce à `id_offre` unique.

```php
$table->foreignId('id_offre')
    ->unique()
    ->constrained('offre', 'id_offre')
    ->cascadeOnDelete();
```

`unique()` signifie qu'une offre possède une seule fiche de profil général.
`cascadeOnDelete()` supprime le profil si l'offre est supprimée.

Les anciens champs d'expérience sont remplacés par :

```php
$table->string('type_valeur', 50)->nullable();
$table->string('valeur_min', 100)->nullable();
$table->string('valeur_max', 100)->nullable();
$table->string('valeur_attendue', 200)->nullable();
$table->string('unite_valeur', 50)->nullable();
```

Ces champs restent volontairement en texte pour accepter plusieurs types de valeurs : nombre d'années, âge, date ou permis.

### Modèle `ProfilOffre`

Le modèle `ProfilOffre` autorise l'écriture des nouveaux champs via `$fillable`.

```php
protected $fillable = [
    'id_offre',
    'description',
    'type_valeur',
    'valeur_min',
    'valeur_max',
    'valeur_attendue',
    'unite_valeur',
];
```

La relation `offre()` garde le lien inverse vers l'offre.

### Table `profil_formation`

`profil_formation` utilise maintenant `id_offre` :

```php
$table->foreignId('id_offre')
    ->constrained('offre', 'id_offre')
    ->cascadeOnDelete();
```

Cela évite de passer par `profil_offre` pour retrouver les formations d'une offre.
Ce choix est cohérent avec `mission` et `profil_competence`, qui sont déjà liés directement à `offre`.

### Modèle `ProfilFormation`

La relation devient :

```php
return $this->belongsTo(Offre::class, 'id_offre', 'id_offre');
```

Donc une formation requise appartient directement à une offre.

### Modèle `Offre`

La relation suivante permet de récupérer les formations d'une offre :

```php
return $this->hasMany(ProfilFormation::class, 'id_offre', 'id_offre');
```

L'application pourra ensuite afficher les formations requises depuis `$offre->formations`.

## Explication simple

Avant, `profil_offre` parlait seulement d'expérience :

```text
experience_min_annees
experience_max_annees
```

Maintenant, la table reste la même, mais les champs sont plus génériques :

```text
type_valeur
valeur_min
valeur_max
valeur_attendue
unite_valeur
```

Exemples possibles :

```text
type_valeur = age
valeur_min = 21
valeur_max = 45
unite_valeur = ans
```

```text
type_valeur = permis
valeur_attendue = B
```

```text
type_valeur = experience
valeur_min = 2
unite_valeur = annees
```

## Justification technique

Cette solution garde le modèle simple pour la V1.
Elle évite une table supplémentaire tout en supprimant le vocabulaire trop limité à l'expérience.

La relation `profil_offre.id_offre` reste unique, donc une offre possède toujours une seule fiche de profil global.
Les formations restent dans `profil_formation` et les compétences dans `profil_competence`, ce qui permet de gérer les informations détaillées sans surcharger `profil_offre`.

Les migrations Laravel permettent de garder cette structure versionnée et reproductible. `[LARAVEL-MIGRATIONS]`

Les clés étrangères PostgreSQL gardent la cohérence entre `profil_offre`, `profil_formation` et `offre`. `[POSTGRES-CONSTRAINTS]`

## Sources

- `[LARAVEL-MIGRATIONS]` Laravel - Database Migrations : https://laravel.com/framework/docs/migrations
- `[POSTGRES-CONSTRAINTS]` PostgreSQL - Constraints : https://www.postgresql.org/docs/current/ddl-constraints.html

## Vérifications

- Vérification que `critere_offre` n'est plus présent dans les migrations ni dans le script SQL.
- Vérification que `profil_offre` contient les champs génériques.
- Vérification que `profil_formation` contient toujours `id_offre`.

## Suite logique

Lors du CRUD des offres, prévoir une section "Profil recherché" qui permet de remplir les valeurs génériques du profil.
Les champs affichés pourront être adaptés selon `type_valeur`.
