#!/usr/bin/env bash
# ==============================================================================
# Script d'installation automatisée de n8n sur Ubuntu Linux (AlpA Ciment)
# Compatible : Ubuntu 22.04 LTS / 24.04 LTS
# ==============================================================================

set -euo pipefail

echo ">>> [3/5] Création de l'arborescence n8n (/opt/alpaciment/n8n)..."
sudo mkdir -p /opt/alpaciment/n8n
sudo chown -R "$USER:$USER" /opt/alpaciment/n8n

cat << 'EOF' > /opt/alpaciment/n8n/docker-compose.yml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n_alpaciment
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_PORT=5678
      - GENERIC_TIMEZONE=Indian/Antananarivo
      - N8N_PROTOCOL=http
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
    volumes:
      - n8n_data:/home/node/.n8n
    extra_hosts:
      - "host.docker.internal:host-gateway"

volumes:
  n8n_data:
    name: alpaciment_n8n_data
EOF

echo ">>> [4/5] Configuration du pare-feu (UFW)..."
sudo ufw allow OpenSSH
sudo ufw allow 5678/tcp comment 'n8n Web UI'
sudo ufw --force enable

echo ">>> [5/5] Démarrage du conteneur n8n via Docker Compose..."
cd /opt/alpaciment/n8n
sudo docker compose up -d

echo ">>> [Test Connectivité SMTP Sortante]..."
if nc -z -w 3 smtp.gmail.com 587 2>/dev/null; then
  echo "✔ Port sortant SMTP 587 accessible : l'envoi d'emails depuis n8n fonctionnera."
else
  echo "⚠ Avertissement : Port SMTP 587 inaccessible. Vérifiez si votre hébergeur cloud bloque les flux SMTP sortants."
fi

echo "=============================================================================="
echo "  Installation terminée avec succès !"
echo "  Accédez à n8n depuis votre navigateur sur : http://$(hostname -I | awk '{print $1}'):5678"
echo "=============================================================================="
