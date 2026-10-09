# 2026-10-09 - Log et Journalisation des actions RH (Audit Log)

## Date

2026-10-09

## Tâche

Mise en place de la journalisation complète et de la traçabilité des actions sensibles RH (Audit Log) dans le portail de recrutement AlpA Ciment : création, modification, publication et clôture d'offres d'emploi, changements de statuts des candidatures, opérations de validation/correction/rejet OCR et gestion du vivier de talents, avec interface de consultation et visualiseur de différences (diff JSON).

## Pourquoi faire cela

Dans un système de gestion de recrutement d'entreprise industrielle comme AlpA Ciment, plusieurs collaborateurs RH et gestionnaires interviennent sur les mêmes offres et candidatures. Il est crucial de :
1. Garantir la conformité et la sécurité réglementaire (traçabilité de qui a modifié ou rejeté un profil, quand, et avec quelles valeurs antérieures).
2. Assurer la non-répudiation et la transparence des décisions de recrutement.
3. Permettre une analyse d'audit immédiate en cas d'erreur opérationnelle (ex. offre passée par erreur au statut clôturé, candidat indûment rejeté ou validé en vivier).

## Actions réalisées

- Création de la migration PostgreSQL `audit_log` avec horodatage TIMESTAMPTZ, clés étrangères, index de recherche multi-critères et colonnes JSONB (`anciennes_valeurs`, `nouvelles_valeurs`).
- Création du modèle Eloquent `AuditLog` avec casts JSON et relation vers l'utilisateur RH responsable.
- Développement du service réutilisable `AuditLogService` avec capture automatique de l'IP du client et de l'User-Agent.
- Branchement des appels d'audit automatique dans les services métiers :
  - `OffreService` : log de création, modification, publication, clôture et suppression d'offres.
  - `CandidatureService` : log des transitions d'états de candidatures (`CHANGEMENT_STATUT_CANDIDAT`), ajouts et retraits du vivier.
  - `VivierService` : log des décisions OCR (`VALIDATION_OCR`, `CORRECTION_OCR`, `REJET_OCR`).
- Création de la ressource API `AuditLogResource` et du contrôleur `AuditLogController` proposant des filtres combinés (action, entité, utilisateur, plage de dates, recherche textuelle).
- Ajout de la route sécurisée `GET /api/audit-logs` dans `routes/api.php`.
- Développement de l'interface React `AuditLogsView.jsx` avec barre de filtres dynamiques, badges de criticité/action, pagination et modal détaillée affichant le comparatif visuel (diff JSON) avant/après action.
- Intégration de la page dans la navigation principale `AppShell.jsx` et du routage dans `main.jsx`.
- Rédaction et validation des tests automatisés PHPUnit pour `AuditLogTest`.

## Fichiers créés ou modifiés

### Fichiers créés

- `code_source/recrutement/database/migrations/2026_10_09_000000_create_audit_log_table.php` : migration créant la table `audit_log` et ses index.
- `code_source/recrutement/app/Models/AuditLog.php` : modèle Eloquent pour la persistance des événements d'audit.
- `code_source/recrutement/app/Services/AuditLogService.php` : service gérant l'enregistrement immuable des événements et les requêtes filtrées.
- `code_source/recrutement/app/Http/Resources/AuditLogResource.php` : transformateur API JSON pour les logs d'audit.
- `code_source/recrutement/app/Http/Controllers/Api/AuditLogController.php` : contrôleur API fournissant la liste paginée et filtrable des logs.
- `code_source/recrutement/tests/Feature/Api/AuditLogTest.php` : test unitaire et fonctionnel du service d'audit.
- `code_source/recrutement-react/src/pages/AuditLogsView.jsx` : composant React affichant l'historique d'audit et la modale de diff.

### Fichiers modifiés

- `code_source/recrutement/routes/api.php` : ajout de la route `GET /api/audit-logs`.
- `code_source/recrutement/app/Services/OffreService.php` : journalisation des actions du cycle de vie des offres.
- `code_source/recrutement/app/Services/CandidatureService.php` : journalisation des changements de statuts et du vivier.
- `code_source/recrutement/app/Services/VivierService.php` : journalisation des validations, corrections et rejets OCR.
- `code_source/recrutement-react/src/components/layout/AppShell.jsx` : ajout du lien vers le journal d'audit dans la barre latérale.
- `code_source/recrutement-react/src/main.jsx` : enregistrement de la route `/audit-logs`.

## Explication du code

### Modèle et Migration (`AuditLog`)
La table `audit_log` stocke `id_utilisateur`, le type d'`action` (ex. `CREATION_OFFRE`, `CHANGEMENT_STATUT_CANDIDAT`), le type d'`entite` (`Offre`, `Candidature`, `Vivier`), l'`id_entite`, un résumé textuel dans `description`, ainsi que deux colonnes JSON : `anciennes_valeurs` et `nouvelles_valeurs`. L'enregistrement des adresses IP et User-Agent permet de tracer le contexte réseau sans ralentir les opérations.

### Service `AuditLogService`
Ce service fournit une méthode standardisée `log(...)` qui extrait automatiquement l'utilisateur connecté via `Auth::user()` ou accepte un ID d'utilisateur explicite. Elle capture les en-têtes de la requête HTTP courante (`Request::ip()`, `Request::userAgent()`).

### Vue React `AuditLogsView`
La vue offre une ergonomie réactive avec :
- Barre de filtres multi-critères : par type d'action, entité concernée, mots-clés dans la description, et plage calendaire (date de début et date de fin).
- Badges colorés selon la nature de l'action (vert pour création/validation, orange pour modification/correction, rouge pour suppression/rejet/clôture).
- Modale interactive permettant d'inspecter côte à côte les données avant et après l'opération sous forme de JSON structuré et coloré.

## Explication simple

Chaque fois qu'un recruteur crée une offre, modifie un descriptif, change l'étape d'un candidat ou valide un CV analysé par l'IA, le système enregistre automatiquement une ligne d'historique dans un journal sécurisé. L'équipe RH peut consulter ce journal à tout moment sur une page dédiée, filtrer par date ou par type d'action, et voir exactement ce qui a changé.

## Justification technique

- **Approche centralisée par Service (`AuditLogService`)** plutôt qu'observateurs Eloquent globaux : cela permet de ne journaliser que les actions métier sensibles avec une sémantique métier précise (`VALIDATION_OCR`, `CHANGEMENT_STATUT_CANDIDAT`) et des messages explicites, sans polluer la base avec chaque micro-sauvegarde technique.
- **Colonnes JSON (`anciennes_valeurs`, `nouvelles_valeurs`)** : flexibilité totale pour enregistrer des structures de données variées (champs d'une offre, liste de compétences validées, statuts) sans nécessiter de tables de liaison complexes.
- **Indexation composite sur PostgreSQL** : index sur `action`, `entite`, `id_entite`, `id_utilisateur` et `created_at` pour garantir des temps de réponse instantanés même avec des dizaines de milliers d'actions journalisées.

## Sources

- `[S1]` Documentation Laravel Database & Migrations : https://laravel.com/docs/11.x/migrations
- `[S2]` Cahier des charges et architecture du projet AlpA Ciment (`sql/audit_log.sql`).

## Vérifications

- Exécution des migrations Laravel : `php artisan migrate` (table `audit_log` créée avec succès).
- Route API enregistrée et testée : `php artisan route:list --path=audit-logs`.
- Suite de tests PHPUnit : `php artisan test` (18/18 tests réussis, 62 assertions).
- Compilation du frontend React : `npm run build` (succès en 1.36s, 0 avertissements/erreurs).

## Suite logique

Poursuite des fonctionnalités du Sprint 6 :
1. Planification des tests et entretiens RH (gestion des rendez-vous, agenda interactif FullCalendar).
2. Module de communication (modèles d'emails personnalisés avec variables dynamiques, envoi d'emails via SMTP Gmail réel).
