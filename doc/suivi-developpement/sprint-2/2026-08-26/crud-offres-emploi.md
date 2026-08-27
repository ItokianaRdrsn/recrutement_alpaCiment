# 2026-08-26 - CRUD des offres d'emploi

## Date

2026-08-26

## Tâche

Créer l'API REST et l'interface React pour la gestion complète des offres d'emploi (création, lecture, modification, suppression).

## Pourquoi faire cela

Le module de recrutement doit permettre aux utilisateurs RH de gérer les offres d'emploi depuis le back-office. Chaque offre est rattachée à une direction et possède un statut, un type de contrat, des dates de publication et de limite, un lieu et une description.

## Actions réalisées

- Création du contrôleur API `OffreController` avec les actions `index`, `store`, `show`, `update` et `destroy`.
- Mise en place de la validation des données (titre, direction, dates cohérentes).
- Ajout du filtrage côté API : par direction, statut, type de contrat et recherche textuelle (titre, description, lieu).
- Pagination côté serveur avec `per_page` configurable.
- Création de l'interface React `OffersView` avec formulaire de création/modification, barre de filtres, tableau paginé et actions en ligne.
- Ajout du bouton « Nouvelle offre » dans la section liste.
- Ajout d'un pop-up de confirmation avant suppression (`window.confirm`).

## Fichiers créés ou modifiés

### Fichiers créés

- `app/Http/Controllers/Api/OffreController.php` : contrôleur API REST pour les offres.
- `app/Http/Resources/OffreResource.php` : ressource JSON pour formater les offres en sortie.

### Fichiers modifiés

- `routes/api.php` : ajout des routes CRUD offres (`GET /offres`, `POST /offres`, `PUT /offres/{offre}`, `DELETE /offres/{offre}`), protégées par la permission `manage_offres`.
- `recrutement-react/src/main.jsx` : ajout du composant `OffersView` avec formulaire, filtres, tableau et pagination.
- `recrutement-react/src/styles.css` : styles pour le formulaire d'offre (`.offer-form`, `.full-span`), le filtre (`.filter-bar`), et le tableau.

## Explication du code

- **Contrôleur `OffreController`** : utilise `Validator::make` avec une règle `after` pour vérifier que `date_limite >= date_publication`. Le statut par défaut est « Brouillon » récupéré dynamiquement depuis le référentiel `statut_offre`.
- **Routes** : les routes de lecture (`index`, `show`) sont accessibles à tout utilisateur authentifié du back-office. Les routes d'écriture (`store`, `update`, `destroy`) sont protégées par le middleware `permission:manage_offres`.
- **Interface React** : le composant `OffersView` gère l'état du formulaire (`offerForm`), les filtres (`filters`) et la réponse paginée (`offersResponse`). Les fonctions `saveOffer`, `deleteOffer`, `editOffer` et `resetOfferForm` pilotent le cycle de vie du formulaire. Le composant `OffersTable` est réutilisé dans le tableau de bord pour afficher les offres récentes en mode compact.

## Explication simple

Les utilisateurs RH peuvent maintenant créer, modifier, consulter et supprimer des offres d'emploi depuis le back-office React. Ils peuvent aussi filtrer la liste par direction, statut ou type de contrat, et rechercher par mots-clés.

## Justification technique

L'API REST suit les conventions Laravel (resource controller) et utilise les Resource classes pour un formatage JSON propre. La validation côté serveur garantit la cohérence des données. Le filtrage et la pagination côté serveur évitent de charger toutes les offres en mémoire côté client.

## Sources

- `[S1]` Documentation Laravel - Eloquent Resources, https://laravel.com/docs/eloquent-resources
- `[S2]` Documentation Laravel - Validation, https://laravel.com/docs/validation

## Vérifications

- `php artisan test` : 13 tests passent.
- `npm run build` : compilation React sans erreur.
- Test manuel : création, modification, suppression et filtrage d'offres via l'interface.

## Suite logique

Implémenter la gestion du profil, des missions et des formations requises par offre, puis la gestion des compétences requises.
