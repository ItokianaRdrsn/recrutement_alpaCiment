# 🛠️ Guide de Résolution des Problèmes & Dépannage Technique
## Projet : Plateforme de Recrutement Alpha Ciment

Ce document consigne les diagnostics, explications d'architecture et solutions aux problèmes techniques fréquents rencontrés lors du développement, du renommage de dossier ou du déploiement sur une nouvelle machine.

---

## Sommaire
1. [Gestion des Documents & Liens de Stockage (`public/storage`)](#1-gestion-des-documents--liens-de-stockage-publicstorage)
2. [Erreurs d'Autoloading Composer après Renommage (`ClassLoader.php`)](#2-erreurs-dautoloading-composer-après-renommage-classloaderphp)
3. [Principe d'Idempotence & Anti-Doublons (API & n8n)](#3-principe-didempotence--anti-doublons-api--n8n)
4. [Commandes Rapides de Réparation Système](#4-commandes-rapides-de-réparation-système)

---

## 1. Gestion des Documents & Liens de Stockage (`public/storage`)

### A. Architecture du Stockage des CVs et Photos
Dans Laravel, pour des raisons de sécurité strictes :
- Les fichiers téléversés par les candidats ou le RH (**CVs, photos, annexes**) ne sont **jamais stockés directement** dans le dossier public web (`public/`).
- Ils sont enregistrés physiquement dans le répertoire protégé :
  ```text
  code_source/recrutement/storage/app/public/
  ├── documents/
  │   └── cv/          <- Fichiers PDF/DOCX (ex: documents/cv/uuid.pdf)
  └── candidatures/
      └── photos/      <- Photos d'identité des candidats
  ```
- **En Base de Données (PostgreSQL)** : La colonne `chemin_fichier` de la table `document` stocke **exclusivement un chemin relatif** (ex: `documents/cv/550e8400-e29b-41d4-a716-446655440000.pdf`). Elle ne contient aucun chemin absolu Windows (`C:\Users\...`), ce qui rend la base 100% portable.

### B. Le Rôle du Lien Symbolique (`storage:link`)
Pour que le navigateur web et l'interface React puissent afficher les photos et télécharger les CVs sans compromettre les fichiers système du serveur, Laravel crée un **lien symbolique** (une jonction de dossier NTFS sous Windows) :
```text
code_source/recrutement/public/storage  ──(Lien Symbolique)──>  code_source/recrutement/storage/app/public
```

Lorsqu'un recruteur clique sur *« Consulter / Télécharger »* dans la fiche candidat :
1. React génère l'URL : `http://127.0.0.1:8000/storage/documents/cv/uuid.pdf`
2. Le serveur web passe par le dossier virtuel `public/storage`
3. Le système d'exploitation résout instantanément le fichier physique dans `storage/app/public/documents/cv/uuid.pdf`.

### C. Le Problème lors du Renommage de Dossier (ex: `alpha` -> `alpha`)
Sous Windows, un lien symbolique / jonction mémorise le **chemin absolu cible en dur** lors de sa création.
Si le projet est déplacé ou que son dossier parent est renommé :
- Le raccourci `public/storage` pointe toujours vers l'ancien chemin (qui n'existe plus).
- **Symptôme** : Clic sur un CV ou affichage d'une photo -> **Erreur 404 Not Found** (alors que le fichier est bien présent sur le disque).

### D. Solution & Commandes
Dans le terminal du backend (`code_source/recrutement`) :
```powershell
# 1. Supprimer l'ancien lien symbolique orphelin (ne supprime AUCUN fichier de document)
php artisan storage:unlink

# 2. Recréer le lien symbolique pointant vers le nouveau chemin actuel
php artisan storage:link
```
> **Garantie** : `php artisan storage:unlink` ne supprime **que le raccourci**. L'intégralité de vos CVs et photos situés dans `storage/app/public` est totalement préservée.

---

## 2. Erreurs d'Autoloading Composer après Renommage (`ClassLoader.php`)

### A. Symptôme
Lors de l'exécution de `php artisan serve` ou d'une commande Artisan après renommage du projet :
```text
In ClassLoader.php line 576:
include(.../recrutement_ancien/code_source/recrutement/app/Providers/AppServiceProvider.php): 
Failed to open stream: No such file or directory
```

### B. Cause Racine
Composer génère des fichiers de cache statiques lors de `composer install` (`autoload_psr4.php`, `autoload_classmap.php`, `autoload_static.php`). Ces fichiers contiennent des chemins relatifs ou absolus calculés au moment de la génération.

### C. Solution
Dans le terminal du backend (`code_source/recrutement`) :
```powershell
# Régénérer l'ensemble des tables d'autoloading Composer avec le chemin actuel
composer dump-autoload
```

---

## 3. Principe d'Idempotence & Anti-Doublons (API & n8n)

### A. Objectif
Garantir qu'une même candidature (ou un même e-mail retraité par n8n en cas de redémarrage ou de coupure réseau) ne soit **jamais insérée en double** dans la base PostgreSQL.

### B. Fonctionnement
1. **Clé d'Idempotence** : Calculée à partir du hash SHA-256 de `(email_candidat + id_offre + hash_fichier_cv)`.
2. **Contrôle d'Ingestion** : Avant toute insertion, l'endpoint vérifie si un dossier similaire a été reçu dans un intervalle de temps court.
3. Si un doublon est détecté, le système renvoie la ressource existante avec un code HTTP `200 OK` sans dupliquer la ligne en base de données ni relancer l'OCR.

---

## 4. Commandes Rapides de Réparation Système

| Problème Rencontré | Commande de Résolution | Effet |
| :--- | :--- | :--- |
| **Documents / CVs introuvables (404)** | `php artisan storage:unlink`<br>`php artisan storage:link` | Recrée la passerelle `public/storage` vers `storage/app/public`. |
| **Erreur ClassLoader / classes manquantes** | `composer dump-autoload` | Reconstruit la cartographie des classes PHP du projet. |
| **Erreur de vues Blade en cache** | `php artisan view:clear` | Purge les gabarits HTML compilés dans `storage/framework/views`. |
| **Erreur de configuration .env en cache** | `php artisan config:clear` | Réinitialise la lecture directe du fichier `.env`. |
| **Erreur de cache applicatif** | `php artisan cache:clear` | Vide le cache applicatif PostgreSQL / Redis. |
| **Erreur cache Vite frontend** | `npm run dev -- --force` | Force la recompilation des modules optimisés dans `node_modules/.vite`. |
