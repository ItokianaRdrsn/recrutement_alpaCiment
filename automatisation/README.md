# Automatisation avec n8n (Recrutement AlpaCiment)

Ce répertoire contient l'infrastructure Docker pour exécuter l'instance **n8n** dédiée à l'automatisation des processus de recrutement.

## 🚀 Démarrage rapide

### 1. Démarrer n8n
Dans ce répertoire (`automatisation`), exécutez :
```bash
docker compose up -d
```

### 2. Accéder à l'interface
Ouvrez votre navigateur sur :
👉 [http://localhost:5678](http://localhost:5678)

Lors de la première connexion, créez votre compte propriétaire/administrateur local.

---

## 🛠️ Commandes utiles

- **Voir les logs en temps réel** :
  ```bash
  docker compose logs -f
  ```

- **Vérifier l'état du conteneur** :
  ```bash
  docker compose ps
  ```

- **Arrêter le conteneur** :
  ```bash
  docker compose down
  ```

- **Redémarrer le conteneur** :
  ```bash
  docker compose restart
  ```

- **Mettre à jour n8n vers la dernière version** :
  ```bash
  docker compose pull
  docker compose up -d
  ```

---

## 💾 Persistance des données

Les workflows, identifiants et configurations n8n sont stockés dans le volume persistant Docker `n8n_data`.
Vos données restent intactes même après un redémarrage ou un arrêt (`docker compose down`).

---

## 🎓 Projet de Test & Guide d'apprentissage (100% Hors Connexion)

Un projet complet d'apprentissage avec API locale **FastAPI** et un workflow n8n prêt à l'emploi est disponible dans le dossier :
👉 [`projet_test_fastapi/`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/automatisation/projet_test_fastapi)

Consultez le guide détaillé : [DOCUMENTATION_N8N_COMPLETE.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/automatisation/projet_test_fastapi/DOCUMENTATION_N8N_COMPLETE.md)
