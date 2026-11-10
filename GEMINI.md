# Directives d'Espace de Travail & Méthodologie Obligatoire (Alpha Ciment)

> **RÈGLE PERMANENTE & PRIORITAIRE** : Ces instructions sont automatiquement chargées par Antigravity à chaque prompt et session. Elles doivent être appliquées strictement sans omission.

---

## 1. Référence Méthodologique Fondamentale
Avant toute intervention, l'assistant doit impérativement respecter les règles définies dans :
👉 [`doc/suivi-developpement/methodologie.md`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/doc/suivi-developpement/methodologie.md)

---

## 2. Structure Standardisée des Réponses (Format d'Output Obligatoire)
À la fin de **chaque** intervention ou tâche, la réponse doit impérativement respecter la structure suivante en 5 blocs distincts :

1. **Résumé Exécutif & Contexte de l'Intervention** :
   - Rappel de l'objectif de l'utilisateur, de la branche Git active (ex: `harden-fastapi-microservice`) et du contexte d'exécution.
2. **Inventaire Exhaustif des Fichiers Créés et Modifiés** :
   - Distinction claire entre *Fichiers Créés* et *Fichiers Modifiés*.
   - Liens Markdown cliquables vers chaque fichier (`[NomDuFichier](file:///chemin/complet)`).
   - Synthèse des responsabilités, des choix architecturaux et des garanties techniques (sécurité, non-discrimination).
3. **Validation & Résultats Réels des Tests Automatisés** :
   - Commandes réelles exécutées (`pytest`, `php artisan test`, `npm run build`).
   - Métriques concrètes : nombre de tests passés (100% PASS), durée en secondes, gestion des avertissements.
4. **Recommandations & Impacts Systèmes Tiers (Contrats d'Interface)** :
   - Détail des impacts sur n8n, Laravel, bases de données ou frontend.
   - En-têtes requis (ex: `X-API-Key`), codes HTTP particuliers (503 avec `Retry-After`), drapeaux et rétrocompatibilité des contrats JSON existants.
5. **Clôture Méthodologique & Recommandation du Prochain Prompt Prêt à l'Emploi** :
   - Prochaine action logique dans le cadre du sprint ou du projet.
   - Suggestion de la commande Slash appropriée (`/plan`, `/boost`, `/goal`, etc.).
   - Bloc de code copiable contenant la formulation exacte du prochain prompt prêt à l'emploi.

---

## 3. Règles Techniques Impératives

1. **Non-Discrimination** :
   - Aucun algorithme, schéma ou filtre ne doit utiliser, déduire ou stocker l'âge, le genre, la nationalité ou l'apparence physique.
2. **Architecture Backend & Repository Pattern** :
   - 100% des accès aux données passent par les Repositories (`app/Repositories/`).
   - Zéro appel direct aux tables ou modèles Eloquent dans les Services.
   - Utilisation systématique des PHP Enums typés (`app/Enums/`) à la place des chaînes de caractères magiques.
3. **Microservices (FastAPI / OCR & LLM)** :
   - Configuration centralisée dans `config.py`.
   - Modèle local Ollama standardisé : `qwen2.5:7b`.
   - Concurrence maîtrisée (sémaphores), gestion des timeouts et détection de troncature de tokens.
   - Validation stricte des formats et typage Pydantic (`schemas.py`).
4. **Intégrité de la Base de Données & Documentation** :
   - Toute modification de schéma SQL doit être répercutée immédiatement dans [`sql/gestion_recrutement.sql`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/sql/gestion_recrutement.sql).
   - Tenue à jour cumulative du document de suivi [`doc/suivi-developpement/doc-suivi-etape.md`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/doc/suivi-developpement/doc-suivi-etape.md).
   - Mise à jour du catalogue des services [`doc/suivi-developpement/catalogue-services.md`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/doc/suivi-developpement/catalogue-services.md).
