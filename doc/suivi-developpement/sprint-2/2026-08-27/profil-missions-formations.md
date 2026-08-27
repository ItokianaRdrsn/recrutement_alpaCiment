# 2026-08-27 - Gestion du profil, des missions et des formations requises par offre

## Date

2026-08-27

## Tâche

Étendre la gestion des offres d'emploi pour permettre de spécifier en détail :
- Le profil recherché et ses critères quantitatifs/qualitatifs (`profil_offre`) ;
- La liste ordonnée des missions liées au poste (`mission`) ;
- La liste des formations requises et souhaitables avec leur niveau et domaine (`profil_formation`).

## Pourquoi faire cela

Une offre d'emploi ne se limite pas à un titre et un lieu. Pour permettre un recrutement précis et préparer l'algorithme de matching automatique candidat ↔ offre, le recruteur doit pouvoir décrire les exigences du profil, la liste des missions quotidiennes et les diplômes ou formations requis.

## Actions réalisées

- Mise à jour du contrôleur API `OffreController` (`store`, `update`, `index`, `show`) pour synchroniser en transaction les entités associées (`profil_offre`, `mission`, `profil_formation`).
- Enrichissement de `OffreResource` pour retourner l'ensemble de ces détails.
- Évolution du formulaire React dans `OffersView` :
  - Section **Profil recherché & Critères** : description du profil, valeur cible, min/max, unité de valeur.
  - Section **Missions du poste** : saisie dynamique avec ajout/suppression de missions et gestion automatique de l'ordre.
  - Section **Formations requises** : saisie dynamique des niveaux d'études, du domaine et de la coche « Obligatoire ».
- Évolution du tableau `OffersTable` : ajout d'une ligne extensible (`ChevronDown` / `ChevronUp`) affichant le profil complet, les puces de missions et les formations.

## Fichiers créés ou modifiés

### Fichiers créés

Aucun nouveau fichier PHP.

### Fichiers modifiés

- `app/Http/Controllers/Api/OffreController.php` : ajout de `syncNestedRelations()` pour enregistrer et mettre à jour `profil`, `missions`, et `formations` dans une transaction `DB::transaction`.
- `app/Http/Resources/OffreResource.php` : formatage des structures de données associées.
- `recrutement-react/src/main.jsx` : sous-sections du formulaire d'offre, gestion des tableaux dynamiques d'états (`missions`, `formations`), et affichage accordéon/détails dans le tableau.
- `recrutement-react/src/styles.css` : ajouts CSS pour `.form-sub-header`, `.dynamic-row`, `.expanded-details` et `.detail-block`.

## Explication du code

- **Fonction `syncNestedRelations()`** :
  - `profil()` : utilise `updateOrCreate` sur la relation 1:1 `hasOne`.
  - `missions()` : supprime les anciennes occurrences et recrée les missions avec description non vide et leur ordre.
  - `formations()` : supprime les anciennes occurrences et enregistre les exigences de formation avec le drapeau `obligatoire`.
- **Composant React `OffersView`** : `updateMission` et `updateFormation` effectuent des mutations immutables sur les arrays React.

## Explication simple

Les recruteurs peuvent désormais renseigner en un seul formulaire toutes les informations détaillées d'une offre (missions au quotidien, diplômes exigés, critères du profil). Ces détails s'affichent sous forme de fiche dépliable dans le tableau.

## Justification technique

La synchronisation des relations enfants au sein d'une seule transaction `DB::transaction` garantit qu'en cas d'erreur de validation ou de base de données, l'offre et ses composants ne sont pas enregistrés partiellement (atomicité ACID).

## Sources

- `[S1]` Laravel Eloquent Relationships - One To Many & One To One, https://laravel.com/docs/eloquent-relationships

## Vérifications

- `php artisan test` : 13 tests passent.
- `npm run build` : compilation React validée.
- Test manuel : création et modification d'une offre avec 2 missions et 1 formation, vérification dans la fiche dépliable.

## Suite logique

Associer les compétences du référentiel à l'offre (`profil_competence`).
