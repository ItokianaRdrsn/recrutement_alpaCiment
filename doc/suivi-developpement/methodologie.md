# Guide Méthodologique de Traitement des Demandes (Prompts)

Ce document définit la méthode de travail standardisée que l'assistant AI doit obligatoirement respecter à chaque intervention pour le projet *recrutement_alpaCiment*.

---

## ⚙️ Processus par Étape à Chaque Prompt

Pour chaque demande utilisateur, l'assistant doit évaluer la nature de la tâche : **Nouvelle Tâche de Sprint** OU **Rectification / Correction**.

---

### 🟢 Cas A : Tâche / Fonctionnalité d'un Sprint

Lorsqu'une demande concerne le développement d'une nouvelle tâche ou fonctionnalité rattachée à un Sprint :

1. **Création du dossier horodaté du jour** :
   - Créer le sous-dossier de la date actuelle dans le dossier du sprint concerné : `doc/suivi-developpement/sprint-X/YYYY-MM-DD/`.
2. **Création du fichier de documentation de la tâche** :
   - Rédiger un fichier Markdown dans le dossier créé (ex: `vivier-talents-competences.md`).
   - Y inclure : l'intitulé de la tâche, les explications détaillées du code, les extraits de code clés et les liens vers les fichiers sources backend/frontend.
3. **Mise à jour du document central de suivi (`doc-suivi-etape.md`)** :
   - Conserver impérativement tout l'historique antérieur (approche **cumulative**, aucune suppression).
   - Ajouter la nouvelle entrée avec le prompt exact de l'utilisateur et sa résolution.
4. **Mise à jour du fichier des règles de gestion (`regles-de-gestion.md`)** :
   - Si la tâche introduit ou modifie une règle métier, l'ajouter immédiatement dans [regles-de-gestion.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/regles-de-gestion.md).

---

### 🟡 Cas B : Rectification / Correction / Refactorisation

Lorsqu'une demande concerne un ajustement mineur, un correctif de bug ou un alignement visuel :

1. **Mise à jour directe du document de suivi (`doc-suivi-etape.md`)** :
   - Ne pas créer de nouveau dossier de sprint.
   - Ajouter le prompt utilisateur exact et l'explication du correctif apporté dans le journal chronologique du document central.
2. **Mise à jour du fichier des règles de gestion (`regles-de-gestion.md`)** :
   - Si la rectification touche une règle de gestion, mettre à jour le registre des règles en conséquence.

---

## ✅ Checklist Obligatoire avant de Terminer un Prompt
- [ ] Code backend & frontend modifié et vérifié.
- [ ] Compilation frontend effectuée (`npm run build`).
- [ ] Suite de tests backend validée (`php artisan test`).
- [ ] Fichiers de documentation générés ou mis à jour selon la méthodologie (Sprint vs Rectification).
