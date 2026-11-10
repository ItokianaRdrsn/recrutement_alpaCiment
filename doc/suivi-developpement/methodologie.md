# Guide Méthodologique de Traitement des Demandes (Prompts)

Ce document définit la méthode de travail standardisée que l'assistant AI doit obligatoirement respecter à chaque intervention pour le projet *recrutement_alphaCiment*.

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
   - Si la tâche introduit ou modifie une règle métier, l'ajouter immédiatement dans [regles-de-gestion.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/doc/suivi-developpement/regles-de-gestion.md).
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

## 📖 Règle de Non-Redondance et Consultation du Catalogue des Services (`catalogue-services.md`)

Pour **TOUTE** modification, refactorisation ou ajout de méthode backend dans les Services :
1. **Consultation préalable obligatoire** :
   - Consulter systématiquement [`doc/suivi-developpement/catalogue-services.md`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/doc/suivi-developpement/catalogue-services.md).
   - Vérifier si la méthode n'existe pas déjà sous un autre nom ou dans un autre service pour éliminer la duplication de code.
2. **Respect de la responsabilité unique (SRP)** :
   - Ne jamais polluer un service avec des responsabilités étrangères.
   - Par exemple : le stockage physique des fichiers et le MIME sniffing appartiennent à `DocumentService`, le parsing OCR appartient à `CvExtractionService`, les métriques à `PipelineMetricService`, et `CandidatureService` ne s'occupe que de l'entité Candidature.
3. **Mise à jour du catalogue** :
   - Dès qu'une fonction est créée, renommée, déplacée ou supprimée, mettre à jour immédiatement le tableau et la fiche correspondante dans [`doc/suivi-developpement/catalogue-services.md`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/doc/suivi-developpement/catalogue-services.md).

---

## 🔬 Règle Systématique de Justification Technologique (Architectural Decision Record)

Pour **TOUTE** décision technique ou sélection de librairie / framework / outil :

1. **Explicitation du Choix** : Expliquer clairement pourquoi la solution a été choisie.
2. **Comparatif avec les Alternatives** : Présenter au moins 1 à 2 alternatives viables et expliquer pourquoi elles n'ont pas été retenues (Pour / Contre).
3. **Ressources & Sources de Recherche** : Fournir les liens vers la documentation officielle, articles d'analyse ou benchmarks exploités.
4. **Mise à jour du document central** : Documenter la décision dans [justification-technologique.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/doc/suivi-developpement/justification-technologique.md).

---

## 🗄️ Règle Impérative de Synchronisation de la Base de Données (`gestion_recrutement.sql`)

Dès qu'une modification de structure de base de données est réalisée (nouvelle table, ajout ou renommage de colonne, index, contrainte `CHECK` ou clé étrangère) via une migration Laravel ou directement :

1. **Mise à jour obligatoire du script maître** :
   - Reporter **systématiquement et immédiatement** le script SQL correspondant dans le fichier maître [`sql/gestion_recrutement.sql`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/sql/gestion_recrutement.sql).
2. **Garantie d'intégrité** :
   - Le fichier [`sql/gestion_recrutement.sql`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/sql/gestion_recrutement.sql) doit impérativement rester le reflet exact à 100% de la structure de base de données du projet, directement ré-exécutable de bout en bout pour reconstruire la base PostgreSQL complète.

---

## 📑 Format Standardisé des Outputs (Structure Obligatoire à Chaque Clôture de Tâche)

À chaque fin d'intervention, l'assistant doit impérativement structurer sa restitution finale selon les 5 sections normalisées suivantes :

1. **Résumé Exécutif & Contexte de l'Intervention** :
   - Rappel clair de l'objectif initial formulé par l'utilisateur.
   - Mention du statut de la tâche, de la branche Git active (ex: `harden-fastapi-microservice`) et de l'environnement d'exécution.
2. **Inventaire Exhaustif des Fichiers Créés et Modifiés** :
   - Répartition ordonnée : *Fichiers Créés* puis *Fichiers Modifiés*.
   - Utilisation systématique de liens Markdown cliquables avec schéma `file:///` ([`NomFichier.ext`](file:///chemin/absolu/ou/relatif)).
   - Synthèse technique des responsabilités et des choix architecturaux pour chaque fichier (patterns de conception, sécurité, non-discrimination).
3. **Validation & Résultats Réels des Tests Automatisés** :
   - Commandes réelles exécutées pour valider la non-régression (ex: `pytest`, `php artisan test`, `npm run build`).
   - Rapport factuel des résultats : nombre de tests collectés et passés (100% PASS), durée d'exécution en secondes, détail des avertissements résolus.
4. **Recommandations & Impacts Systèmes Tiers (Contrats d'Interface)** :
   - Présentation claire des répercussions sur les systèmes communicants (API Laravel, workflows n8n, frontend React).
   - Détail des en-têtes obligatoires (ex: `X-API-Key`), des codes d'état HTTP gérés (ex: 503 avec `Retry-After`), et des drapeaux de qualification enrichis.
   - Confirmation de la rétrocompatibilité 100% des routes et des clés JSON historiques.
5. **Clôture Méthodologique & Recommandation du Prochain Prompt Prêt à l'Emploi** :
   - Prochaine action prioritaire selon le calendrier et l'avancement du projet.
   - Commande slash idoine recommandée (`/plan`, `/boost`, `/goal`, etc.).
   - Bloc de code copiable contenant le prompt exact formulé de façon optimale pour l'utilisateur.

---

## 💡 Règle de Clôture : Recommandation Systématique du Bon Prompt et des Commandes Slash (`/`)

À la fin de chaque réponse, l'assistant doit obligatoirement :
1. **Identifier la ou les prochaines étapes concrètes** à réaliser selon l'ordre du sprint en cours.
2. **Fournir à l'utilisateur le texte exact du prochain prompt prêt à copier-coller**, formulé de façon optimale et précise.
3. **Associer la commande slash (`/`) appropriée** si la tâche s'y prête :
   - `/plan` : pour structurer une tâche complexe touchant plusieurs couches avant de coder.
   - `/grill-me` : pour affiner des exigences ou arbitrages fonctionnels/UX par un questionnement interactif.
   - `/goal` : pour exécuter un sous-ensemble complet de bout en bout de façon autonome.
   - `/boost` : pour les algorithmes complexes, le matching sémantique ou les calculs de scoring critiques.
   - `/learn` : lorsqu'une correction méthodologique ou règle persistante doit être ancrée définitivement.

---

## ✅ Checklist Obligatoire avant de Terminer un Prompt
- [ ] Code backend & frontend modifié et vérifié.
- [ ] Compilation frontend effectuée (`npm run build`).
- [ ] Suite de tests backend / microservices validée (`php artisan test`, `pytest`).
- [ ] **Mise à jour du fichier maître [`sql/gestion_recrutement.sql`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/sql/gestion_recrutement.sql)** si une modification ou un ajout touche la base de données.
- [ ] **Catalogue des Services vérifié et synchronisé** ([`catalogue-services.md`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/doc/suivi-developpement/catalogue-services.md)).
- [ ] Fichiers de documentation générés ou mis à jour selon la méthodologie (Sprint vs Rectification).
- [ ] Registre de justification technologique (`justification-technologique.md`) renseigné si une technologie/librairie est concernée.
- [ ] **Restitution finale conforme aux 5 blocs du Format Standardisé des Outputs**.
- [ ] **Recommandation du prompt exact optimal et de la commande slash (`/`) idoine** fournie à la fin de la réponse.
