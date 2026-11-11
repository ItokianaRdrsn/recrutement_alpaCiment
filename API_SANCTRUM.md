1. Mode API Tokens / Bearer Tokens (Notre architecture actuelle)

Dans ce mode, la protection CSRF est totalement inutile et désactivée.

Pourquoi ?
Le risque de CSRF n'existe que lorsque l'authentification repose sur des cookies, car le navigateur envoie automatiquement les cookies lors d'une requête intersite (ex. un lien pirate qui déclenche un POST vers votre API).
Avec les Bearer Tokens :
Le jeton est stocké dans le localStorage de React et transmis explicitement dans un en-tête HTTP :
Authorization: Bearer 1|xyz...
Un site malveillant tiers ne peut jamais forcer le navigateur à ajouter cet en-tête personnalisé. L'API est donc immunisée contre le CSRF par nature.