# 2026-08-27 - Règle de progression des statuts d'offre, tri trié et clic direct Tableau de bord

## Date

2026-08-27

## Tâche

- **Tableau de bord** : supprimer le menu déroulant accordéon sur la liste des offres récentes du tableau de bord. Au clic sur une ligne/offre, réutiliser directement le formulaire complet d'édition/modification.
- **Règle de gestion du Workflow de statut** : interdire strictement tout changement vers un statut dont l'ordre de workflow (`ordre_workflow`) est inférieur ou égal au statut actuel (`target_order > current_order`). Par exemple, impossible de passer de *Clôturée* (3) à *Brouillon* (1) ou *Publiée* (2), ni de *Publiée* (2) à *Brouillon* (1), ni de conserver le même statut (40 -> 40).
- **Tri des offres** : trier systématiquement les offres par statut dans l'ordre : **Publiée → Brouillon → Clôturée**, suivi de la date de publication / mise à jour.
- **Pagination** : maintenir la pagination réactive sur `/offres`.

## Pourquoi faire cela

1. Garantir l'intégrité du cycle de vie d'une offre RH : une offre publiée ou clôturée ne doit pas pouvoir revenir en arrière en brouillon.
2. Donner un accès direct et immédiat aux détails d'une offre depuis le tableau de bord en réutilisant le formulaire d'édition existant.
3. Prioriser la lisibilité en affichant d'abord les offres actives et publiées sur le marché.

## Actions réalisées

- **Laravel (`OffreController.php`)** :
  - Méthode `validateWorkflowProgression(Offre $offre, int $targetStatusId)` : vérification en base que `target_ordre > current_ordre`, renvoie un code HTTP 422 avec message explicite en cas de tentative de régression.
  - Méthode `index()` : ajout de `orderByRaw` avec `CASE` SQL ordonnant `Publiee` (1), `Brouillon` (2), `Cloturee` (3).
  - Contrôles intégrés dans `update`, `publish` et `close`.
- **React (`main.jsx`)** :
  - `DashboardView` & `OffersTable` : suppression des chevrons de détails accordéon en mode compact. Le clic sur n'importe quelle ligne d'offre du tableau de bord redirige vers `/offres` et ouvre directement le formulaire complet de modification.
  - `renderOfferActions` : désactivation / masquage dynamique des boutons *Publier* ou *Clôturer* si le statut cible n'a pas un ordre supérieur au statut actuel.
  - Formulaire d'édition : désactivation des options du `<select>` de statut dont l'ordre de workflow est inférieur ou égal au statut actuel.

## Fichiers créés ou modifiés

### Fichiers modifiés

- `app/Http/Controllers/Api/OffreController.php` : validation workflow progression et tri personnalisé SQL par statut.
- `recrutement-react/src/main.jsx` : clic d'édition direct depuis le tableau de bord et désactivation des régressions de statut dans les composants React.

## Explication du code

```php
private function validateWorkflowProgression(Offre $offre, int $targetStatusId): void
{
    $currentStatusId = (int) $offre->id_statut_offre;
    if ($currentStatusId === $targetStatusId) {
        abort(422, "L'offre est deja dans ce statut.");
    }

    $currentOrder = StatutOffre::where('id_statut_offre', $currentStatusId)->value('ordre_workflow') ?? 0;
    $targetOrder = StatutOffre::where('id_statut_offre', $targetStatusId)->value('ordre_workflow') ?? 0;

    if ($targetOrder <= $currentOrder) {
        abort(422, "Regression de statut interdite : le nouveau statut (ordre {$targetOrder}) doit avoir un ordre d'avancement strictly superieur au statut actuel (ordre {$currentOrder}).");
    }
}
```

## Explication simple

Les offres ne peuvent plus être remises en brouillon après avoir été publiées ou clôturées. Les offres affichées dans la liste apparaissent dans l'ordre de leur pertinence (Publiées en premier, puis Brouillons, puis Clôturées). Depuis le tableau de bord, un clic sur une offre ouvre directement son formulaire d'édition complet.

## Justification technique

La validation côté backend (API HTTP 422) empêche les régressions même si les requêtes sont forgées hors interface web. Côté front-end, la désactivation des options rend la contrainte évidente pour l'utilisateur.

## Sources

- `[S1]` Laravel Query Builder Ordering, https://laravel.com/docs/11.x/queries#ordering-grouping-limit-and-offset

## Vérifications

- `npm run build` : compilation Vite OK (1.98s).
- `php artisan test` : tests validés.
