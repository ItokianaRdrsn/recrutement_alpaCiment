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
5. **Mise à jour des tâches du sprint (`taches.md`)** :
   - Si la tâche est terminée, passer son statut à **[FAIT]** - **100%** dans le fichier `taches.md` du sprint concerné, et recalculer le pourcentage d'avancement global du sprint.
6. **Justification des Technologies & Librairies Sélectionnées (`justification-technologique.md`)** :
   - Peu importe la tâche (sprint ou rectification), dès qu'une technologie, un framework, une librairie ou un algorithme est introduit ou modifié (ex: PaddleOCR, FastAPI, Laravel, PostgreSQL, spaCy NLP), expliciter systématiquement les motifs du choix, les alternatives comparées (ex: Spring Boot vs Laravel, Tesseract vs PaddleOCR), le tableau pour/contre et les liens vers les documentations officielles.

---

### 🟡 Cas B : Rectification / Correction / Refactorisation

Lorsqu'une demande concerne un ajustement mineur, un correctif de bug ou un alignement visuel :

1. **Mise à jour directe du document de suivi (`doc-suivi-etape.md`)** :
   - Ne pas créer de nouveau dossier de sprint.
   - Ajouter le prompt utilisateur exact et l'explication du correctif apporté dans le journal chronologique du document central.
2. **Mise à jour du fichier des règles de gestion (`regles-de-gestion.md`)** :
   - Si la rectification touche une règle de gestion, mettre à jour le registre des règles en conséquence.
3. **Mise à jour de la documentation d'architecture (`justification-technologique.md`)** :
   - Si la rectification introduit un choix technique ou ajustement d'outils, documenter le comparatif pour/contre et les ressources associées.

---

## 🔬 Règle Systématique de Justification Technologique (Architectural Decision Record)

Pour **TOUTE** décision technique ou sélection de librairie / framework / outil :

1. **Explicitation du Choix** : Expliquer clairement pourquoi la solution a été choisie.
2. **Comparatif avec les Alternatives** : Présenter au moins 1 à 2 alternatives viables et expliquer pourquoi elles n'ont pas été retenues (Pour / Contre).
3. **Ressources & Sources de Recherche** : Fournir les liens vers la documentation officielle, articles d'analyse ou benchmarks exploités.
4. **Mise à jour du document central** : Documenter la décision dans [justification-technologique.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/justification-technologique.md).

---

## ✅ Checklist Obligatoire avant de Terminer un Prompt
- [ ] Code backend & frontend modifié et vérifié.
- [ ] Compilation frontend effectuée (`npm run build`).
- [ ] Suite de tests backend validée (`php artisan test`).
- [ ] Fichiers de documentation générés ou mis à jour selon la méthodologie (Sprint vs Rectification).
- [ ] Registre de justification technologique (`justification-technologique.md`) renseigné si une technologie/librairie est concernée.
