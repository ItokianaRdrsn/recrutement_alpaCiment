# Guide de Déploiement n8n sur Serveur Linux Ubuntu via SSH (AlpA Ciment)

Ce guide répond aux questions opérationnelles essentielles pour faire tourner **n8n** sur un serveur distant **Ubuntu (22.04 LTS ou 24.04 LTS)** connecté en **SSH**, avec gestion complète de **l'envoi d'e-mails (SMTP)** et comparaison des modes d'hébergement web (serveur web intégré vs Nginx).

---

## 1. A-t-on vraiment besoin de Nginx & SSL (HTTPS) ?

> **RÉPONSE DIRECTE : NON, Nginx n'est absolument pas obligatoire !**  
> n8n possède son propre **serveur web HTTP natif (Node.js/Express)**. Il est 100% autonome.

### Pourquoi le serveur web intégré de n8n suffit largement pour AlpA Ciment :
Dans le pipeline AlpA Ciment, n8n relève les candidatures via le nœud Gmail / IMAP en **mode scrutation (Polling / Pull)** : c'est n8n qui se connecte périodiquement aux serveurs de messagerie pour récupérer les e-mails. **Aucun service externe n'a besoin d'envoyer de webhook entrant en HTTPS vers n8n.**

Vous avez donc 2 méthodes très simples basées **exclusivement sur le serveur web intégré** :

| Méthode | Nginx requis ? | Nom de domaine requis ? | Comment on y accède | Niveau de sécurité |
| :--- | :---: | :---: | :--- | :--- |
| **Méthode 1 : Direct IP (Recommandée début)** | ❌ Non | ❌ Non | `http://IP_DU_SERVEUR:5678` | Protégé par l'authentification login/mot de passe n8n |
| **Méthode 2 : Tunnel SSH (Ultra-sécurisé)** | ❌ Non | ❌ Non | `http://localhost:5678` sur votre PC | **Chiffrement SSH total**, le port n'est même pas ouvert sur Internet |
| **Méthode 3 : Nginx + SSL Certbot** | ✅ Oui | ✅ Oui | `https://n8n.alpaciment.mg` | Public avec certificat HTTPS (utile uniquement si webhook public externe requis) |

---

## 2. Prérequis Globaux pour le Serveur Ubuntu

### A. Spécifications minimales du serveur Ubuntu
* **OS** : Ubuntu 22.04 LTS ou 24.04 LTS
* **RAM** : 2 Go minimum (1 Go pour l'OS et 1 Go pour n8n Docker)
* **Disque** : 15 Go d'espace disque disponible
* **Accès** : Utilisateur `sudo` et accès SSH

### B. Prérequis Indispensables pour l'Envoi d'E-mails (SMTP)
Dans le workflow AlpA Ciment, 4 nœuds envoient des e-mails automatiques :
- `5b. Reponse Info1` (Accusé de demande d'information)
- `5d. Email CV Manquant1` (Alerte pièce jointe manquante au candidat)
- `8b. Email CV Illisible1` (Alerte administrateur CV illisible)
- `12b. Email Erreur Laravel1` (Alerte administrateur échec ingestion)

#### 1. Règle d'or sur les ports SMTP en Cloud / VPS
> ⚠️ **ATTENTION MAJEURE** : Pratiquement tous les hébergeurs Cloud (OVH, DigitalOcean, AWS, Scaleway, Hetzner, Azure, Google Cloud) **BLOQUENT le port 25 sortant par défaut** pour éviter le spam.
> **Il ne faut JAMAIS utiliser le port 25.**

Utilisez toujours l'un des deux ports sécurisés suivants :
* **Port 587 avec STARTTLS** (Recommandé standard)
* **Port 465 avec SSL/TLS direct**

#### 2. Configuration SMTP Gmail pour n8n
Si vous envoyez les e-mails depuis une adresse Gmail (`recrutement@alpacement.mg` ou compte Gmail) :
1. Activez l'**Authentification à deux facteurs (2FA)** sur le compte Google.
2. Allez dans *Sécurité du compte Google* > *Mots de passe des applications*.
3. Générez un mot de passe d'application nommé `n8n-alpaciment` (16 caractères, ex: `abcd efgh ijkl mnop`).
4. Dans le nœud n8n `emailSend` (credential SMTP) :
   * **Host** : `smtp.gmail.com`
   * **Port** : `587`
   * **User** : `votre-email@gmail.com`
   * **Password** : Le mot de passe d'application de 16 caractères (sans espaces)
   * **SSL/TLS** : STARTTLS (décochez SSL direct)

#### 3. Autorisation dans le Pare-feu Ubuntu (UFW)
Par défaut, UFW autorise tout le trafic sortant. Vérifiez simplement que le serveur peut joindre les ports SMTP :
```bash
# Vérification de la connectivité sortante vers le serveur SMTP
nc -zv smtp.gmail.com 587
# Doit répondre : Connection to smtp.gmail.com 587 port [tcp/submission] succeeded!
```

---

## 3. Mise en Œuvre Rapide (100% Serveur Web Intégré - Sans Nginx)

### Étape 1 : Connexion SSH au serveur
```bash
ssh utilisateur@ip_de_votre_serveur
```

### Étape 2 : Installation de Docker et Docker Compose
```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg ufw

# Installation officielle Docker Engine
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### Étape 3 : Création du Dossier n8n
```bash
sudo mkdir -p /opt/alpaciment/n8n && cd /opt/alpaciment/n8n
sudo chown -R $USER:$USER /opt/alpaciment/n8n
```

### Étape 4 : Fichier `docker-compose.yml` (Serveur Web Natif n8n)
Créez le fichier `docker-compose.yml` :
```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n_alpaciment
    restart: always
    ports:
      # Expose directement le serveur web intégré de n8n sur le port 5678
      - "5678:5678"
    environment:
      - N8N_PORT=5678
      - GENERIC_TIMEZONE=Indian/Antananarivo
      - N8N_PROTOCOL=http
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168 # Conservation des logs pendant 7 jours
    volumes:
      - n8n_data:/home/node/.n8n
    extra_hosts:
      - "host.docker.internal:host-gateway"

volumes:
  n8n_data:
    name: alpaciment_n8n_data
```

### Étape 5 : Configuration du Pare-feu (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 5678/tcp comment 'n8n Web UI'
sudo ufw --force enable
sudo ufw status
```

### Étape 6 : Démarrer n8n
```bash
docker compose up -d
docker compose ps
```

Accédez immédiatement à l'interface dans votre navigateur :  
👉 **`http://IP_DE_VOTRE_SERVEUR:5678`**

---

## 4. Alternative : Accès Ultra-Sécurisé par Tunnel SSH (Sans ouvrir aucun port web !)

Si vous ne souhaitez même pas ouvrir le port 5678 sur Internet pour un maximum de sécurité :

1. Dans `docker-compose.yml`, changez les ports par :
   ```yaml
   ports:
     - "127.0.0.1:5678:5678" # n8n n'écoute QUE sur la boucle locale du serveur
   ```
2. Sur le pare-feu du serveur, fermez le port 5678 :
   ```bash
   sudo ufw delete allow 5678/tcp
   ```
3. Depuis votre PC Windows local (PowerShell), lancez la commande suivante :
   ```powershell
   ssh -L 5678:localhost:5678 utilisateur@ip_de_votre_serveur
   ```
4. Ouvrez votre navigateur sur : **`http://localhost:5678`**.
   * Le flux passe à 100% à l'intérieur du tunnel SSH chiffré.
   * Aucune attaque extérieure n'est possible, aucun certificat SSL n'est nécessaire.

---

## 5. Raccordement Réseau vers FastAPI et Laravel

| Configuration | URL FastAPI dans n8n | URL Laravel dans n8n |
| :--- | :--- | :--- |
| **Tout sur le serveur Ubuntu** | `http://127.0.0.1:8001` | `http://127.0.0.1:8000` |
| **n8n sur Ubuntu mais FastAPI/Laravel sur votre PC local** | Depuis votre PC Windows, ouvrez le tunnel inverse :<br>`ssh -R 8001:localhost:8001 -R 8000:localhost:8000 utilisateur@ip_serveur`<br>Puis dans n8n utilisez `http://localhost:8001` et `http://localhost:8000`. |
