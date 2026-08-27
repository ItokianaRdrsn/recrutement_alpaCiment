# 2026-08-27 - Séparation de la création/modification d'une offre dans une vue dédiée

## Date

2026-08-27

## Tâche

Séparer le formulaire de création et de modification d'une offre d'emploi de la page de liste des offres, pour que l'écran d'accueil des offres ne contienne que la liste et que le formulaire soit accessible sur une vue/page dédiée via le bouton « Nouvelle offre » ou « Modifier ».

## Pourquoi faire cela

L'affichage simultané du formulaire complet d'offre et de la liste sur la même vue surchargeait l'écran et obligeait l'utilisateur à faire défiler la page pour accéder aux filtres et au tableau. Séparer le formulaire dans une vue dédiée offre une meilleure ergonomie (UX) et aère l'interface.

## Actions réalisées

- Ajout de l'état `viewMode` (`'list'` | `'form'`) dans le composant React `OffersView`.
- Mode `'list'` : l'écran affiche uniquement la barre de recherche/filtres, le compteur d'offres et le tableau des offres avec le bouton « Nouvelle offre ».
- Mode `'form'` : l'écran affiche la vue de formulaire complète avec un bouton de navigation `<ArrowLeft /> Retour à la liste des offres` en haut.
- Clic sur « Nouvelle offre » : réinitialise le formulaire et bascule en mode `'form'`.
- Clic sur le bouton d'édition (`Edit3`) d'une offre : remplit le formulaire et bascule en mode `'form'`.
- Clic sur « Enregistrer l'offre » ou « Annuler / Retour » : réinitialise le formulaire et bascule automatiquement vers le mode `'list'`.

## Fichiers créés ou modifiés

### Fichiers créés

Aucun fichier supplémentaire.

### Fichiers modifiés

- `recrutement-react/src/main.jsx` : gestion de l'état `viewMode`, bouton de retour `<ArrowLeft />`, basculement entre la vue de liste et la vue de formulaire dédiée.

## Explication du code

- **Gestion d'état `viewMode`** :
  ```javascript
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  ```
- **Navigation** : `openNewOfferForm()` bascule `viewMode` à `'form'`. La soumission réussie `saveOffer()` rappelle `setViewMode('list')` et recharge la liste.

## Explication simple

La page des offres affiche maintenant uniquement la liste des offres d'emploi pour une meilleure lisibilité. Pour créer ou modifier une offre, le recruteur clique sur « Nouvelle offre » ou l'icône d'édition, ce qui ouvre la page de saisie dédiée. Un bouton « Retour à la liste » permet de revenir en arrière à tout moment.

## Justification technique

Ce pattern d'interface Master-Detail avec navigation par vue préserve la réactivité de la SPA React sans rechargement de page tout en séparant proprement les contextes d'affichage et de saisie.

## Sources

- `[S1]` React Documentation - Conditional Rendering, https://react.dev/learn/conditional-rendering

## Vérifications

- `npm run build` : compilation Vite OK en 1.57s.
- `php artisan test` : 13/13 tests passés.
- Test visuel : clic sur « Nouvelle offre » ouvre le formulaire dédié, clic sur « Retour à la liste » revient sur le tableau.

## Suite logique

Poursuivre les évolutions du Sprint 3 (gestion des candidatures et du matching).
