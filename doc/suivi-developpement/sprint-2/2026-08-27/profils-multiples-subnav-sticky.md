# 2026-08-27 - Profils multiples par offre, sous-menu Référentiels et Sidebar Sticky

## Date

2026-08-27

## Tâche

- Permettre de spécifier plusieurs critères de profil (`profil_offre`) par offre au lieu d'un seul.
- Organiser l'écran Référentiels avec des sous-onglets / sous-menu (Tous les référentiels, Directions, Domaines, Compétences).
- Rendre la barre latérale (Sidebar) fixe en mode `sticky` (`top: 0`, `height: 100vh`).
- Préparer l'architecture et les préfixes des tables candidats pour le futur algorithme de matching.

## Pourquoi faire cela

1. Une offre requiert souvent plusieurs exigences mesurables (ex : 3 ans d'expérience + score de 80% au test + diplôme spécifique).
2. L'empilement vertical des tableaux de référentiels rendait la navigation confuse. Les sous-onglets permettent de filtrer directement la vue désirée.
3. La sidebar fixe garantit que la navigation principale reste accessible même lors du défilement des longs tableaux.

## Actions réalisées

- **Migration database** : création de `2026_08_27_000400_allow_multiple_profils_per_offre.php` pour supprimer la contrainte `UNIQUE` sur `profil_offre.id_offre`.
- **Modèle Eloquent `Offre`** : ajout de la relation `profils(): HasMany`.
- **OffreResource & OffreController** : support du tableau `profils` en entrée et sortie.
- **Front-end React (`main.jsx`)** :
  - Formulaire d'offre : ajout d'un tableau dynamique avec bouton « Ajouter un critère de profil » et suppression unitaire.
  - Section Référentiels : sous-menu onglets `Tous`, `Directions`, `Domaines`, `Compétences`.
  - CSS (`styles.css`) : ajout de `position: sticky; top: 0; height: 100vh; overflow-y: auto;` sur `.sidebar` et création des styles de sous-onglets `.sub-nav-tabs`.

## Fichiers créés ou modifiés

### Fichiers créés

- `database/migrations/2026_08_27_000400_allow_multiple_profils_per_offre.php` : suppression contrainte unique `id_offre`.

### Fichiers modifiés

- `app/Models/Offre.php` : relation `profils(): HasMany`.
- `app/Http/Resources/OffreResource.php` : champ `profils`.
- `app/Http/Controllers/Api/OffreController.php` : boucle de création/mise à jour sur `profils`.
- `recrutement-react/src/main.jsx` : gestion d'état des critères multiples et sous-onglets Référentiels.
- `recrutement-react/src/styles.css` : sidebar sticky et styles `.sub-nav-tabs`.

## Explication du code

- **Migration `dropUnique`** : `Schema::table('profil_offre', fn($t) => $t->dropUnique('profil_offre_id_offre_unique'));` transforme la relation 1:1 en 1:N.
- **Sub-tabs React** : state `subTab` (`'all' | 'directions' | 'domaines' | 'competences'`) conditionne l'affichage des sections de référentiels.

## Explication simple

Les recruteurs peuvent désormais ajouter plusieurs critères de profil pour une même offre. L'écran Référentiels dispose d'un sous-menu ergonomique pour filtrer la vue souhaitée, et le menu latéral ne disparaît plus lors du défilement.

## Justification technique

La suppression de la contrainte unique sur `profil_offre.id_offre` préserve l'existant tout en permettant à l'algorithme de matching d'évaluer une liste de critères d'exigence face au dossier d'un candidat.

## Sources

- `[S1]` CSS Position Sticky - MDN Web Docs, https://developer.mozilla.org/en-US/docs/Web/CSS/position#sticky

## Vérifications

- `php artisan migrate` : migration exécutée avec succès.
- `npm run build` : compilation Vite OK (2.46s).
- `php artisan test` : tests passés (13/13).
