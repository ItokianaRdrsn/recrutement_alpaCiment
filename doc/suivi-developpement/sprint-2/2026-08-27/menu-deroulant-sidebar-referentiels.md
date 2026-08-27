# 2026-08-27 - Menu déroulant accordéon Référentiels dans la Sidebar

## Date

2026-08-27

## Tâche

Intégrer un sous-menu déroulant accordéon sous l'élément « Référentiels » dans la barre de navigation latérale (Sidebar), permettant d'accéder directement à :
- Tous les référentiels (`/referentiels`) ;
- Directions (`/referentiels/directions`) ;
- Domaines (`/referentiels/domaines`) ;
- Compétences (`/referentiels/competences`).

## Pourquoi faire cela

Permettre au recruteur de naviguer instantanément vers une catégorie de référentiel précise depuis la barre latérale fixe, sans passer par des clics supplémentaires.

## Actions réalisées

- Évolution du composant React `AppShell` pour gérer le pliage/dépliage du menu déroulant `Référentiels` (`referentielsOpen`).
- Ajout d'une flèche indicateur d'état (`ChevronDown` / `ChevronUp`).
- Déclaration des sous-onglets `.sub-nav-link` avec puce et mise en évidence de l'élément actif (`activePath`).
- Ajout des règles de style CSS dans `styles.css` (`.sidebar-sub-menu`, `.sub-nav-link`).

## Fichiers créés ou modifiés

### Fichiers créés

Aucun fichier supplémentaire.

### Fichiers modifiés

- `recrutement-react/src/main.jsx` : gestion du menu déroulant et des sous-routes dans la sidebar.
- `recrutement-react/src/styles.css` : styles du sous-menu latéral `.sidebar-sub-menu` et `.sub-nav-link`.

## Explication du code

- **Accordéon Sidebar** : le clic sur « Référentiels » bascule `referentielsOpen` tout en redirigeant sur la vue globale s'il n'était pas actif.
- **Routage imbriqué** : `App` identifie la sous-route demandée (`/referentiels/directions`, `/referentiels/domaines`, `/referentiels/competences`) pour activer directement l'onglet correspondant dans `ReferentialsView`.

## Explication simple

Dans le menu de gauche, un clic sur « Référentiels » déroule un sous-menu affichant **Tous**, **Directions**, **Domaines** et **Compétences**. Un clic sur l'un d'eux amène directement sur le référentiel souhaité.

## Justification technique

La navigation par sous-menu dans la sidebar offre une hiérarchie visuelle claire et réduit le nombre de clics pour administrer les référentiels.

## Sources

- `[S1]` React State and Lifecycle, https://react.dev/learn/state-a-components-memory

## Vérifications

- `npm run build` : compilation Vite OK en 1.57s.
- Test visuel : clic sur Référentiels déroule le sous-menu, clic sur « Compétences » affiche uniquement le tableau des compétences.
