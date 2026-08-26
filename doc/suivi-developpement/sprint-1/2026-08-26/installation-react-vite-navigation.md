# 2026-08-26 - Installation React/Vite et première navigation back-office

## Date

2026-08-26

## Tâche

Créer un frontend React séparé du projet Laravel, puis y installer la première navigation back-office.

## Pourquoi faire cela

Le projet utilise Laravel pour le backend/API et React pour l'interface.
Pour éviter de mélanger les responsabilités, React est placé dans un dossier séparé :

- `code_source/recrutement` : backend Laravel, authentification, API, PostgreSQL ;
- `code_source/recrutement-react` : frontend React, Vite, interface utilisateur.

Cette séparation rend l'architecture plus claire et prépare mieux l'arrivée éventuelle d'un service FastAPI.

## Actions réalisées

- Création du dossier `code_source/recrutement-react`.
- Déplacement du code React vers `code_source/recrutement-react/src/main.jsx`.
- Déplacement du CSS React vers `code_source/recrutement-react/src/styles.css`.
- Création d'un projet Vite autonome avec `index.html`, `package.json` et `vite.config.js`.
- Installation des dépendances React.
- Configuration d'un proxy Vite vers Laravel pour `/api` et `/logout`.
- Conservation du login côté Laravel.
- Redirection Laravel vers le frontend React après authentification.
- Ajout d'un endpoint `/api/csrf-token` pour permettre la déconnexion depuis React.

## Fichiers créés ou modifiés

### Frontend React

- `code_source/recrutement-react/index.html`
- `code_source/recrutement-react/package.json`
- `code_source/recrutement-react/package-lock.json`
- `code_source/recrutement-react/vite.config.js`
- `code_source/recrutement-react/.env.example`
- `code_source/recrutement-react/.gitignore`
- `code_source/recrutement-react/src/main.jsx`
- `code_source/recrutement-react/src/styles.css`
- `code_source/recrutement-react/README.md`

### Backend Laravel

- `code_source/recrutement/config/app.php`
- `code_source/recrutement/.env`
- `code_source/recrutement/.env.example`
- `code_source/recrutement/app/Http/Controllers/DashboardController.php`
- `code_source/recrutement/app/Http/Controllers/OffreController.php`
- `code_source/recrutement/routes/api.php`
- `code_source/recrutement/composer.json`

### Fichiers supprimés de Laravel

- `code_source/recrutement/package.json`
- `code_source/recrutement/package-lock.json`
- `code_source/recrutement/vite.config.js`
- `code_source/recrutement/resources/js/app.jsx`
- `code_source/recrutement/resources/css/app.css`
- `code_source/recrutement/resources/views/backoffice.blade.php`
- `code_source/recrutement/resources/views/welcome.blade.php`
- `code_source/recrutement/node_modules`
- `code_source/recrutement/public/build`

## Explication du code

### Frontend autonome

Le frontend est lancé depuis `code_source/recrutement-react`.
Son point d'entrée est `src/main.jsx`.

React est monté avec :

```jsx
createRoot(document.getElementById('recrutement-app')).render(<App />);
```

### Proxy Vite

Dans `vite.config.js`, les appels `/api` et `/logout` sont redirigés vers Laravel :

```js
proxy: {
    '/api': {
        target: backendUrl,
        changeOrigin: true,
    },
    '/logout': {
        target: backendUrl,
        changeOrigin: true,
    },
}
```

### Redirection Laravel vers React

Laravel garde les routes `/dashboard` et `/offres`, mais elles redirigent vers le frontend :

```php
return redirect()->away($this->frontendUrl('/dashboard'));
```

Ainsi, après connexion, l'utilisateur arrive sur React.

### Gestion de la déconnexion

Comme la session reste gérée par Laravel, React récupère un token CSRF avec :

```text
GET /api/csrf-token
```

Puis il fait un `POST /logout`.

## Explication simple

Avant, React était dans le dossier Laravel.
Maintenant, il y a deux projets :

- Laravel sert les données, la sécurité et les routes API ;
- React affiche l'interface et consomme ces API.

## Commandes utiles

Backend Laravel :

```bash
cd code_source/recrutement
php artisan serve --host=127.0.0.1 --port=8000
```

Frontend React :

```bash
cd code_source/recrutement-react
npm install
npm run dev
```

Accès :

```text
http://127.0.0.1:8000/login
http://127.0.0.1:5173/dashboard
```

## Justification technique

Laravel reste responsable de l'authentification, des middlewares et des réponses API. `[LARAVEL-AUTHENTICATION]` `[LARAVEL-MIDDLEWARE]`

React est adapté pour construire une interface à composants réutilisables. `[REACT-COMPONENTS]`

Vite permet de lancer un projet React indépendant avec un serveur de développement rapide. `[VITE-GUIDE]`

Le proxy Vite permet de rediriger les requêtes frontend vers le backend Laravel pendant le développement. `[VITE-SERVER]`

La protection CSRF Laravel reste importante pour les requêtes `POST`, comme la déconnexion. `[LARAVEL-CSRF]`

## Sources

- `[LARAVEL-AUTHENTICATION]` Laravel 13.x - Authentication : https://laravel.com/docs/13.x/authentication
- `[LARAVEL-MIDDLEWARE]` Laravel 13.x - Middleware : https://laravel.com/docs/13.x/middleware
- `[LARAVEL-CSRF]` Laravel 13.x - CSRF Protection : https://laravel.com/docs/13.x/csrf
- `[REACT-COMPONENTS]` React - Learn / Components and Hooks : https://react.dev/learn
- `[VITE-GUIDE]` Vite - Guide : https://vite.dev/guide/
- `[VITE-SERVER]` Vite - Server options / proxy : https://vite.dev/config/server-options.html#server-proxy

## Vérifications

- `npm install` dans `code_source/recrutement-react` : dépendances installées.
- `npm run build` dans `code_source/recrutement-react` : build Vite réussi.
- `php -l` sur les contrôleurs Laravel modifiés : aucune erreur de syntaxe.
- `php artisan route:list --path=api` : 6 routes API, dont `/api/csrf-token`.
- `php artisan test` dans `code_source/recrutement` : 7 tests réussis.

## Suite logique

Lancer Laravel et React séparément, puis continuer le Sprint 1 avec la finalisation des rôles et permissions.
