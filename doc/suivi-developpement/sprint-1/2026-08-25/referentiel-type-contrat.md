# 2026-08-25 - Référentiel des types de contrat

## Date

2026-08-25

## Tâche

Remplacer le champ texte `type_contrat` de la table `offre` par une clé étrangère vers une nouvelle table `type_contrat`.

## Pourquoi faire cela

Le type de contrat est une donnée de référence.
Le laisser en texte libre dans la table `offre` peut produire des incohérences :

- `CDI` ;
- `cdi` ;
- `C.D.I` ;
- `Contrat CDI`.

Avec une table dédiée, les offres pointent vers une valeur contrôlée.
Cela rend les filtres, statistiques et futures interfaces plus fiables.

## Actions réalisées

- Création de la table `type_contrat` dans les migrations Laravel.
- Ajout de `id_type_contrat` dans la table `offre`.
- Ajout d'une clé étrangère entre `offre.id_type_contrat` et `type_contrat.id_type_contrat`.
- Ajout d'un index `idx_offre_type_contrat`.
- Création du modèle Eloquent `TypeContrat`.
- Ajout de la relation `Offre::typeContrat()`.
- Mise à jour du seeder avec les valeurs :
  - `CDI` ;
  - `CDD` ;
  - `Stage` ;
  - `Interim` ;
  - `Consultance`.
- Mise à jour de la liste des offres pour afficher `typeContrat.libelle`.
- Alignement du script SQL `sql/gestion_recrutement.sql` avec la même structure.

## Fichiers créés ou modifiés

### Fichier créé

- `code_source/recrutement/app/Models/TypeContrat.php` : modèle Eloquent du référentiel des types de contrat.

### Fichiers modifiés

- `code_source/recrutement/database/migrations/2026_08_24_000000_create_recruitment_reference_tables.php` : création de la table `type_contrat`.
- `code_source/recrutement/database/migrations/2026_08_24_000200_create_offres_tables.php` : remplacement du champ texte `type_contrat` par `id_type_contrat`.
- `code_source/recrutement/app/Models/Offre.php` : ajout de `id_type_contrat` dans `$fillable` et de la relation `typeContrat()`.
- `code_source/recrutement/database/seeders/DatabaseSeeder.php` : insertion des types de contrat et liaison des offres seedées au bon contrat.
- `code_source/recrutement/app/Http/Controllers/OffreController.php` : chargement de la relation `typeContrat` dans la liste des offres.
- `code_source/recrutement/resources/views/offres/index.blade.php` : affichage du libellé du contrat depuis la relation.
- `sql/gestion_recrutement.sql` : alignement du script SQL complet avec la même structure.

## Explication du code

### Migration du référentiel

Dans la migration des tables de référence, la table `type_contrat` contient seulement :

```php
$table->id('id_type_contrat');
$table->string('libelle', 50)->unique();
```

Le champ `libelle` est unique pour empêcher deux lignes identiques comme `CDI` et `CDI`.

### Clé étrangère dans `offre`

Dans la migration des offres, le contrat devient une clé étrangère :

```php
$table->foreignId('id_type_contrat')
    ->nullable()
    ->constrained('type_contrat', 'id_type_contrat')
    ->restrictOnDelete();
```

`nullable()` permet de créer une offre même si le type de contrat n'est pas encore renseigné.
`restrictOnDelete()` empêche de supprimer un type de contrat encore utilisé par une offre.

### Modèle `TypeContrat`

Le modèle `TypeContrat` pointe vers la table `type_contrat` et désactive les timestamps, car cette table est un référentiel simple.

```php
protected $table = 'type_contrat';
protected $primaryKey = 'id_type_contrat';
public $timestamps = false;
```

La relation `offres()` permet de retrouver toutes les offres liées à un type de contrat.

### Relation dans `Offre`

Dans `Offre`, la méthode `typeContrat()` indique qu'une offre appartient à un type de contrat.

```php
return $this->belongsTo(TypeContrat::class, 'id_type_contrat', 'id_type_contrat');
```

Grâce à cette relation, l'affichage peut utiliser :

```php
$offre->typeContrat?->libelle
```

Le `?->` évite une erreur si le contrat est absent.

### Seeder

Le seeder ajoute les valeurs de référence :

```php
CDI, CDD, Stage, Interim, Consultance
```

Ensuite, chaque offre seedée reçoit `id_type_contrat` au lieu d'un texte libre.

## Explication simple

Avant, chaque offre écrivait directement son contrat dans une colonne texte.
Maintenant, les contrats sont stockés une seule fois dans une table spécialisée.

La table `offre` garde seulement l'identifiant du contrat.

Exemple :

```text
offre.id_type_contrat = 1
type_contrat.id_type_contrat = 1
type_contrat.libelle = CDI
```

Cette méthode évite les doublons et prépare mieux les filtres comme "afficher uniquement les offres CDI".

## Justification technique

Une clé étrangère permet à PostgreSQL de garantir qu'une offre ne référence pas un type de contrat inexistant.
C'est le rôle de l'intégrité référentielle. `[POSTGRES-CONSTRAINTS]`

Laravel permet de déclarer ce lien directement dans les migrations avec `foreignId()` et `constrained()`, ce qui garde la structure de base versionnée dans le projet. `[LARAVEL-MIGRATIONS]`

Le choix d'une table de référence est préférable à un champ texte libre, car les valeurs sont limitées, réutilisées et utiles pour les filtres ou statistiques.

## Sources

- `[LARAVEL-MIGRATIONS]` Laravel - Database Migrations : https://laravel.com/framework/docs/migrations
- `[POSTGRES-CONSTRAINTS]` PostgreSQL - Constraints : https://www.postgresql.org/docs/current/ddl-constraints.html

## Vérifications

- `php -l` sur les fichiers PHP modifiés : aucune erreur de syntaxe.
- `php artisan migrate:fresh --seed` : migrations et seeders exécutés avec succès.
- Vérification PostgreSQL :
  - la colonne `offre.id_type_contrat` existe ;
  - l'ancienne colonne `offre.type_contrat` n'existe plus.
- Vérification des données :
  - `type_contrat` contient `CDI`, `CDD`, `Stage`, `Interim`, `Consultance` ;
  - les offres seedées sont liées à `CDI` ou `CDD`.
- `php artisan test` : 4 tests réussis.

## Suite logique

Utiliser ce référentiel dans les futurs formulaires de création et modification d'offre.
Quand l'interface React sera mise en place, le champ contrat devra être un menu de sélection alimenté par la table `type_contrat`.
