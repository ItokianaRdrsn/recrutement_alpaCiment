# 2026-08-27 - Affichage des offres publiées et génération du lien de candidature

## Date

2026-08-27

## Tâche

Exposer les offres publiées sur des endpoints publics non authentifiés et fournir une fonctionnalité de génération/copie du lien direct de candidature.

## Pourquoi faire cela

Les candidats doivent pouvoir consulter les offres publiées sans nécessiter de compte RH back-office. De plus, les responsables RH doivent pouvoir copier facilement le lien d'une offre ouverte pour le diffuser sur des job boards ou réseaux sociaux.

## Actions réalisées

- Création des méthodes `publicIndex` et `publicShow` dans `OffreController`.
- Déclaration des routes ouvertes dans `routes/api.php` : `GET /api/public/offres` et `GET /api/public/offres/{id}`.
- Filtrage strict pour ne retourner que les offres dont le statut est « Publiée » (`id_statut_offre = Publiee`) et dont la date limite n'est pas dépassée.
- Ajout d'une action dans le tableau des offres React (`Share2`) pour les offres publiées, permettant de copier l'URL directe de candidature dans le presse-papier avec confirmation visuelle.

## Fichiers créés ou modifiés

### Fichiers créés

Aucun fichier supplémentaire.

### Fichiers modifiés

- `app/Http/Controllers/Api/OffreController.php` : méthodes `publicIndex()` et `publicShow()`.
- `routes/api.php` : routes sous le préfixe `/public/offres` en dehors des middlewares de rôle/auth.
- `recrutement-react/src/main.jsx` : bouton d'action de partage/copie de lien `copyCandidateLink` sur les offres publiées.

## Explication du code

- **Filtre de statut** : `where('id_statut_offre', $publieeStatusId)` s'assure que les brouillons et offres clôturées restent invisibles pour le public.
- **Vérification date limite** : `whereNull('date_limite')->orWhere('date_limite', '>=', today())` masque automatiquement les offres expirées.
- **Presse-papier React** : `navigator.clipboard.writeText()` copie l'URL de candidature directement dans le presse-papier de l'utilisateur.

## Explication simple

Les offres publiées sont désormais accessibles publiquement via l'API. Un bouton d'action dans le back-office permet en un clic de récupérer le lien direct vers une offre publiée.

## Justification technique

La séparation des endpoints publics (`/public/offres`) et d'administration (`/offres`) permet d'appliquer des filtres d'accès distincts sans risque de fuite de données d'offres en mode brouillon.

## Sources

- `[S1]` MDN Web Docs - Clipboard API, https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API

## Vérifications

- Test API public : `GET /api/public/offres` retourne la liste des offres publiées.
- Test React : clic sur le bouton de partage copie l'URL du backend.
- `npm run build` OK, `php artisan test` OK (13/13).

## Suite logique

Préparer l'interface de dépôt de candidature côté candidat et l'extraction automatique des CV.
