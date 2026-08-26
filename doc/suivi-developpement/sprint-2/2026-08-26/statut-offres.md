# 2026-08-26 - Gestion du statut des offres : brouillon, publiée, clôturée

## Date

2026-08-26

## Tâche

Implémenter le cycle de vie des offres d'emploi avec trois statuts : brouillon, publiée et clôturée, pilotés par des actions dédiées.

## Pourquoi faire cela

Une offre d'emploi passe par plusieurs étapes : elle est d'abord rédigée en brouillon, puis publiée pour être visible aux candidats, et enfin clôturée quand le recrutement est terminé. Ce mécanisme de statut permet de contrôler la visibilité et le cycle de vie de chaque offre.

## Actions réalisées

- Ajout des endpoints PATCH `/api/offres/{offre}/publier` et `/api/offres/{offre}/cloturer` dans le contrôleur `OffreController`.
- Le statut par défaut à la création d'une offre est « Brouillon ».
- La publication met automatiquement la `date_publication` à la date du jour si elle n'est pas déjà renseignée.
- Ajout des boutons d'action « Publier » et « Clôturer » dans le tableau des offres côté React.
- Désactivation contextuelle des boutons : le bouton « Publier » est désactivé si l'offre est déjà publiée, le bouton « Clôturer » est désactivé si l'offre est déjà clôturée.
- Le sélecteur de statut dans le formulaire de création/modification permet de choisir un statut manuellement.

## Fichiers créés ou modifiés

### Fichiers créés

Aucun fichier supplémentaire créé. Les actions ont été ajoutées dans les fichiers existants.

### Fichiers modifiés

- `app/Http/Controllers/Api/OffreController.php` : ajout des méthodes `publish()` et `close()`, utilisant `forceFill` pour forcer la mise à jour du statut indépendamment des règles de mass assignment.
- `routes/api.php` : ajout des routes `PATCH /offres/{offre}/publier` et `PATCH /offres/{offre}/cloturer`, protégées par la permission `manage_offres`.
- `recrutement-react/src/main.jsx` : ajout de la fonction `changeOfferStatus` et des boutons d'action dans `renderOfferActions` avec les icônes `CheckCircle2` (publier) et `X` (clôturer).

## Explication du code

- **Méthode `publish()`** : utilise `forceFill` pour mettre à jour le champ `id_statut_offre` avec l'identifiant du statut « Publiee » et fixe `date_publication` à la date du jour si elle est vide. Cela garantit qu'une offre publiée a toujours une date de publication.
- **Méthode `close()`** : utilise `forceFill` pour passer le statut à « Cloturee ». Une offre clôturée ne peut plus être modifiée par le cycle de statut (bouton désactivé côté React).
- **Résolution du statut** : la méthode privée `statusId()` recherche l'identifiant du statut par son libellé dans la table `statut_offre`. Si le statut n'existe pas, une erreur 422 est levée.
- **React** : la fonction `changeOfferStatus(offre, action)` appelle l'endpoint PATCH correspondant et recharge la liste des offres. Les boutons sont conditionnellement désactivés en comparant `offre.statut?.libelle` avec le statut cible.

## Explication simple

Les offres suivent maintenant un cycle de vie clair : elles sont créées en brouillon, puis un responsable RH peut les publier (ce qui les rend visibles) ou les clôturer (ce qui met fin au recrutement). Les boutons dans le tableau changent d'état en fonction du statut actuel de l'offre.

## Justification technique

L'utilisation de `forceFill` au lieu de `update` est volontaire : elle permet de contourner la protection `$fillable` du modèle pour les actions de changement de statut qui sont des opérations métier spécifiques, pas des mises à jour de formulaire. Les endpoints PATCH sont appropriés car ils modifient partiellement la ressource (uniquement le statut).

## Sources

- `[S1]` Documentation Laravel - forceFill, https://laravel.com/docs/eloquent#mass-assignment
- `[S2]` Convention REST - PATCH pour modification partielle, https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH

## Vérifications

- `php artisan test` : 13 tests passent.
- `npm run build` : compilation React sans erreur.
- Test manuel : publication et clôture d'offres depuis le tableau avec vérification du changement de statut et de la désactivation des boutons.

## Suite logique

Les offres publiées devront être affichées côté front-office pour permettre aux candidats de postuler. Il faudra aussi gérer les profils, missions, formations et compétences requises par offre.
