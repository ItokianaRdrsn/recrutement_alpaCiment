# 2026-08-26 - Installation React/Vite et première navigation back-office

## Date

2026-08-26

## Tâche

Installer React dans le projet Laravel, configurer Vite pour compiler l'interface, puis créer une première navigation back-office pour le dashboard et les offres.

## Pourquoi faire cela

Le projet doit utiliser Laravel pour le backend/API et React pour l'interface.

Avant de développer les modules métier détaillés, il faut avoir une base front stable :

- un point d'entrée React ;
- une page Blade qui charge React ;
- une navigation interne ;
- des appels API vers Laravel ;
- une mise en page de back-office réutilisable.

## Actions réalisées

- Installation des dépendances `react`, `react-dom`, `lucide-react` et `@vitejs/plugin-react`.
- Création du fichier `resources/js/app.jsx`.
- Configuration de Vite pour compiler React.
- Création d'une vue Blade `backoffice.blade.php` qui sert de conteneur à React.
- Remplacement des anciennes vues Blade isolées du dashboard et des offres par le conteneur React.
- Création d'un premier dashboard React avec KPI et offres récentes.
- Création d'une page offres React avec recherche, filtres et pagination.
- Ajout d'un endpoint API `/api/dashboard`.
- Mise à jour du CSS global pour une interface back-office responsive.

## Fichiers créés ou modifiés

### Fichiers créés

- `code_source/recrutement/resources/views/backoffice.blade.php` : conteneur HTML principal de l'application React.
- `code_source/recrutement/resources/js/app.jsx` : point d'entrée React et composants du back-office.
- `code_source/recrutement/app/Http/Controllers/Api/DashboardController.php` : endpoint JSON du dashboard.
- `code_source/recrutement/package-lock.json` : verrouillage des versions npm installées.

### Fichiers modifiés

- `code_source/recrutement/package.json` : ajout des dépendances React, ReactDOM, Lucide React et du plugin React pour Vite.
- `code_source/recrutement/vite.config.js` : ajout du plugin React et remplacement de l'entrée JS par `resources/js/app.jsx`.
- `code_source/recrutement/resources/css/app.css` : styles de la sidebar, du dashboard, des filtres, des tableaux et des états responsive.
- `code_source/recrutement/routes/api.php` : ajout de la route `/api/dashboard`.
- `code_source/recrutement/app/Http/Controllers/DashboardController.php` : retour de la vue React `backoffice`.
- `code_source/recrutement/app/Http/Controllers/OffreController.php` : retour de la vue React `backoffice`.
- `doc/suivi-developpement/sources.md` : ajout des sources React/Vite/Lucide.
- `doc/suivi-developpement/sprint-1/taches.md` : mise à jour de l'avancement.
- `doc/suivi-developpement/sprint-1/README.md` : ajout de cette fiche.

### Fichier supprimé

- `code_source/recrutement/resources/js/app.js` : ancien fichier vide remplacé par `app.jsx`.
- `code_source/recrutement/resources/views/dashboard.blade.php` : ancienne vue Blade remplacée par l'interface React.
- `code_source/recrutement/resources/views/offres/index.blade.php` : ancienne vue Blade remplacée par l'interface React.

## Explication du code

### Configuration Vite

Dans `vite.config.js`, le plugin React a été ajouté :

```js
import react from '@vitejs/plugin-react';
```

Puis l'entrée JavaScript devient :

```js
input: ['resources/css/app.css', 'resources/js/app.jsx'],
```

Cela indique à Vite de compiler le CSS global et le point d'entrée React.

### Vue Blade conteneur

`backoffice.blade.php` garde le lien entre Laravel et React.

Elle contient :

- le token CSRF Laravel ;
- le formulaire de déconnexion Laravel ;
- la directive `@viteReactRefresh` pour le développement ;
- la directive `@vite(...)` pour charger le CSS et le JavaScript compilés ;
- la div `#recrutement-app` dans laquelle React est monté.

### Point d'entrée React

Dans `app.jsx`, React est monté avec :

```jsx
createRoot(document.getElementById('recrutement-app')).render(<App />);
```

Le composant `App` charge les données de base :

- `/api/me` pour l'utilisateur connecté ;
- `/api/referentiels/recrutement` pour les directions, statuts et types de contrat.

### Navigation

Le composant `AppShell` crée la structure générale :

- sidebar ;
- navigation dashboard/offres ;
- barre supérieure ;
- zone de contenu.

La navigation utilise l'URL du navigateur avec `history.pushState`.
Cela permet de garder les routes `/dashboard` et `/offres` côté Laravel, tout en changeant la vue affichée côté React.

### Dashboard

`DashboardView` appelle `/api/dashboard`.

Il affiche :

- les offres publiées ;
- le total des offres ;
- les candidatures sur offre ;
- les domaines en attente ;
- les offres récentes.

Les candidatures restent à `0` pour le moment, car les tables de candidature seront traitées dans les sprints suivants.

### Page offres

`OffersView` appelle `/api/offres`.

Elle permet déjà :

- la recherche texte ;
- le filtre par direction ;
- le filtre par statut ;
- le filtre par type de contrat ;
- la pagination.

Les filtres sont envoyés à Laravel sous forme de query string.
Laravel valide ensuite ces paramètres dans le contrôleur API.

### Interface et responsive

`app.css` définit une interface de back-office :

- sidebar sombre ;
- barre supérieure claire ;
- cartes KPI ;
- barre de filtres ;
- tableau de données ;
- états de chargement et d'erreur ;
- adaptation mobile.

L'objectif n'est pas de faire une page marketing, mais une interface de travail RH simple à lire et à enrichir.

## Explication simple

Avant, le dashboard et la page offres étaient des vues Blade séparées.
Maintenant, Laravel sert une seule base HTML, et React construit l'interface du back-office en récupérant les données depuis l'API Laravel.

Cela prépare le projet pour les prochains écrans : candidatures, vivier, rendez-vous, communications et matching.

## Justification technique

Laravel recommande Vite pour compiler les ressources frontend modernes. `[LARAVEL-VITE]`

Vite permet d'utiliser React avec un plugin officiel dédié. `[VITE-PLUGIN-REACT]`

React sépare l'interface en composants réutilisables, ce qui convient aux écrans back-office qui vont grossir progressivement. `[REACT-COMPONENTS]`

`createRoot` est l'API React DOM utilisée pour monter une application React moderne dans une page HTML. `[REACT-CREATE-ROOT]`

Les hooks React permettent de gérer l'état local, les chargements API et les effets de bord. `[REACT-HOOKS]`

Lucide React fournit des icônes SVG sous forme de composants React, pratiques pour les boutons et la navigation. `[LUCIDE-REACT]`

## Sources

- `[LARAVEL-VITE]` Laravel 13.x - Vite : https://laravel.com/docs/13.x/vite
- `[VITE-GUIDE]` Vite - Guide : https://vite.dev/guide/
- `[VITE-PLUGIN-REACT]` Vite React plugin - Documentation : https://github.com/vitejs/vite-plugin-react
- `[REACT-COMPONENTS]` React - Learn / Components and Hooks : https://react.dev/learn
- `[REACT-CREATE-ROOT]` React DOM - `createRoot` : https://react.dev/reference/react-dom/client/createRoot
- `[REACT-HOOKS]` React - Built-in Hooks : https://react.dev/reference/react/hooks
- `[LUCIDE-REACT]` Lucide React - Guide : https://lucide.dev/guide/packages/lucide-react

## Vérifications

- `php -l` sur les contrôleurs et routes modifiés : aucune erreur de syntaxe.
- `php artisan route:list --path=api` : 5 routes API enregistrées.
- `npm run build` : build Vite réussi.
- `php artisan test` : 7 tests réussis.

## Suite logique

Continuer le Sprint 1 avec les permissions plus fines, puis préparer le passage au Sprint 2 : CRUD directions, domaines et offres.
