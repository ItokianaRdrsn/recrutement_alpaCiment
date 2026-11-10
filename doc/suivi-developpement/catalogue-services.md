# 📚 Catalogue Central des Services Backend (Laravel)

> **Règle Méthodologique Impérative** :
> Avant de concevoir ou d'ajouter une nouvelle fonction métier dans l'application, l'assistant et le développeur doivent **obligatoirement consulter ce catalogue** pour :
> 1. Vérifier si la fonction (ou une fonction similaire) n'existe pas déjà.
> 2. Déterminer dans quel Service la fonction doit naturellement résider (Respect strict du principe de responsabilité unique - SRP).
> 3. Mettre à jour ce catalogue immédiatement après l'ajout ou la modification d'une méthode.

---

## 📑 Sommaire des Services

| Service | Domaine / Responsabilité principale |
| :--- | :--- |
| [`AuditLogService`](#1-auditlogservice) | Traçabilité légale et journalisation d'audit des actions utilisateurs |
| [`CandidatureService`](#2-candidatureservice) | Cycle de vie des candidatures, dépôts (4 canaux), workflow et consultation |
| [`CommunicationService`](#3-communicationservice) | Envoi d'e-mails, accusés de réception, convocations et remplacement de variables |
| [`CompetenceService`](#4-competenceservice) | Référentiel des compétences et types de compétences |
| [`CvExtractionService`](#5-cvextractionservice) | Intégration de l'extraction OCR/NLP (compétences, expériences, formations, projets) |
| [`DashboardService`](#6-dashboardservice) | Statistiques de pilotage RH, métriques de recrutement et graphiques |
| [`DirectionService`](#7-directionservice) | Gestion du référentiel des directions d'Alpha Ciment |
| [`DocumentService`](#8-documentservice) | Gestion physique des fichiers (CV, photos), contrôle MIME serveur, nommage UUID et rollback |
| [`DomaineService`](#9-domaineservice) | Référentiel des domaines d'activité et validation des nouveaux domaines |
| [`EmailClassificationService`](#10-emailclassificationservice) | Classification sémantique des e-mails n8n / IA (intention offre vs spontanée) |
| [`OffreService`](#11-offreservice) | Cycle de vie des offres d'emploi, publication, clôture et workflow |
| [`PipelineMetricService`](#12-pipelinemetricservice) | Traçabilité des métriques d'exécution du pipeline n8n et gestion des doublons |
| [`ReferentielService`](#13-referentielservice) | Regroupement des tables de référentiels transverses |
| [`RendezVousService`](#14-rendezvousservice) | Agenda RH, planification, modification et annulation d'entretiens |
| [`VivierService`](#15-vivierservice) | Vivier de talents, profils candidats détaillés, compétences et historique |

---

## 1. `AuditLogService`
**Fichier** : [`app/Services/AuditLogService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/AuditLogService.php)  
**Rôle** : Enregistrement immuable des actions sensibles réalisées par les utilisateurs RH ou le système.

- `log(string $action, string $entite, ?int $idEntite = null, ?string $description = null, ?array $anciennesValeurs = null, ?array $nouvellesValeurs = null, ?int $idUtilisateur = null): AuditLog`
  - *Description* : Enregistre une entrée d'audit avec capture avant/après, IP et User-Agent.
- `getLogs(array $filters = [], int $perPage = 20): LengthAwarePaginator`
  - *Description* : Récupère la liste paginée et filtrée des journaux d'audit pour le Back-Office.

---

## 2. `CandidatureService`
**Fichier** : [`app/Services/CandidatureService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/CandidatureService.php)  
**Rôle** : Cœur de métier des candidatures (les 4 canaux d'entrée, transition de statuts, vivier RH).

- `paginate(array $filters, int $perPage = 15): LengthAwarePaginator`
  - *Description* : Recherche multicritère et pagination des candidatures.
- `find(int $id): Candidature`
  - *Description* : Lecture pure d'une candidature avec toutes ses relations (CQS sans effet de bord).
- `markAsViewed(int $id): Candidature`
  - *Description* : Marque explicitement la candidature comme consultée par le RH.
- `getStatuts(): Collection`
  - *Description* : Récupère la liste des statuts de candidature existants.
- `postulerOffre(string $idOffre, array $data, ?UploadedFile $cvFile = null, ?UploadedFile $photoFile = null): Candidature`
  - *Description* : Dépôt public de candidature rattachée à une offre d'emploi publiée.
- `candidatureSpontanee(array $data, ?UploadedFile $cvFile = null, ?UploadedFile $photoFile = null): Candidature`
  - *Description* : Dépôt public de candidature spontanée (orientée vivier).
- `importExternalCandidature(array $data, ?UploadedFile $cvFile = null): Candidature`
  - *Description* : Point d'entrée pour l'automatisation n8n et les imports d'emails parsés avec clé d'idempotence.
- `saisirRh(array $data, ?UploadedFile $cvFile = null, ?UploadedFile $photoFile = null, ?int $userId = null): Candidature`
  - *Description* : Saisie manuelle d'une candidature par un utilisateur RH connecté.
- `updateStatut(int $id, int $newStatusId, ?string $commentaire, ?int $userId): Candidature`
  - *Description* : Fait évoluer le statut d'une candidature sous verrou transactionnel (`findByIdForUpdate`).
- `updateVivierStatus(int $id, bool $dansVivier): Candidature`
  - *Description* : Place ou retire une candidature du vivier RH (avec garde-fou sur statut 'Retenue').

---

## 3. `CommunicationService`
**Fichier** : [`app/Services/CommunicationService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/CommunicationService.php)  
**Rôle** : Génération et transmission de messages aux candidats et archivage des communications.

- `remplacerVariables(string $texte, Candidature $candidature, ?RendezVous $rdv = null, array $extraVariables = []): string`
  - *Description* : Remplace les balises dynamiques (`{prenom}`, `{poste}`, `{date_rdv}`, etc.) dans les modèles.
- `envoyerMessage(int $idCandidature, array $data, ?int $idUtilisateur = null): Communication`
  - *Description* : Envoie un message manuel ou automatique par email à un candidat et l'archive en base.
- `envoyerConvocation(RendezVous $rdv, ?int $idModele = null, ?int $idUtilisateur = null): ?Communication`
  - *Description* : Envoie l'email formel de convocation à un entretien suite à une planification d'agenda.
- `envoyerAccuseReception(Candidature $candidature): ?Communication`
  - *Description* : Déclenche l'envoi de l'accusé de réception automatique post-commit.

---

## 4. `CompetenceService`
**Fichier** : [`app/Services/CompetenceService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/CompetenceService.php)  
**Rôle** : Gestion du référentiel des compétences techniques, fonctionnelles et comportementales.

- `getAllWithTypes(): Collection`
  - *Description* : Récupère toutes les compétences groupées par type de compétence.
- `getAllTypes(): Collection`
  - *Description* : Récupère la liste des types de compétences (Hard skills, Soft skills, etc.).
- `create(array $data): Competence`
  - *Description* : Crée une nouvelle compétence dans le référentiel.

---

## 5. `CvExtractionService`
**Fichier** : [`app/Services/CvExtractionService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/CvExtractionService.php)  
**Rôle** : Ingestion et structuration des données extraites des CV par OCR et LLaMA/FastAPI.

- `importerProfilOcr(int $candidatureId, array $data): ?CvExtractionOcr`
  - *Description* : Enregistre le dump OCR brut et insère les compétences, expériences, formations et projets.
- `parseDateSafely(?string $value): ?string`
  - *Description* : Parse et normalise les dates textuelles ou partielles (ex: 2024 -> 2024-01-01).

---

## 6. `DashboardService`
**Fichier** : [`app/Services/DashboardService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/DashboardService.php)  
**Rôle** : Calcul des indicateurs clés (KPIs) pour le tableau de bord RH exécutif.

- `getDashboardData(Request $request): array`
  - *Description* : Calcule les totaux, ratios vivier, taux de conversion et répartitions par offre et direction.

---

## 7. `DirectionService`
**Fichier** : [`app/Services/DirectionService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/DirectionService.php)  
**Rôle** : Gestion des directions opérationnelles d'Alpha Ciment (Usine, Finance, RH, etc.).

- `paginate(array $filters, int $perPage = 15): LengthAwarePaginator`
- `find(int $id): Direction`
- `create(array $data): Direction`
- `update(Direction $direction, array $data): Direction`
- `delete(Direction $direction): void`

---

## 8. `DocumentService`
**Fichier** : [`app/Services/DocumentService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/DocumentService.php)  
**Rôle** : Sécurité physique des fichiers, validation MIME réelle, renommage UUID serveur et nettoyage rollback.

- `stockerDocument(int $candidatureId, UploadedFile $file, string $type, string $dossier, array &$fichiersCrees = []): Document`
  - *Description* : Stocke un fichier UploadedFile sur disque avec vérification de taille (<10Mo) et MIME `finfo`.
- `stockerCvBase64(int $candidatureId, string $base64, string $clientNom = 'cv.pdf', array &$fichiersCrees = []): Document`
  - *Description* : Décode strictement en Base64, contrôle le MIME réel et écrit le CV sur le disque.
- `supprimerFichiers(array $paths): void`
  - *Description* : Supprime physiquement les fichiers orphelins en cas d'annulation de transaction.
- `resoudreExtension(string $mime, string $clientNom, bool $isPhoto): string`
  - *Description* : Vérifie l'appartenance à la whitelist (PDF, Word DOCX/DOC, ODT, Images) et résout l'extension sûre.

---

## 9. `DomaineService`
**Fichier** : [`app/Services/DomaineService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/DomaineService.php)  
**Rôle** : Référentiel des domaines professionnels et processus de validation RH des domaines suggérés.

- `paginate(array $filters, int $perPage = 15): LengthAwarePaginator`
- `find(int $id): Domaine`
- `create(array $data, bool $validated = false, ?int $userId = null): Domaine`
- `update(Domaine $domaine, array $data, ?bool $validated = null, ?int $userId = null): Domaine`
- `validateDomain(Domaine $domaine, ?int $userId): Domaine`
- `delete(Domaine $domaine): void`

---

## 10. `EmailClassificationService`
**Fichier** : [`app/Services/EmailClassificationService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/EmailClassificationService.php)  
**Rôle** : Intelligence artificielle et heuristique de catégorisation d'emails entrants.

- `classify(string $subject, string $body): array`
  - *Description* : Analyse le sujet et le contenu pour déterminer si c'est une candidature à une offre ou spontanée.

---

## 11. `OffreService`
**Fichier** : [`app/Services/OffreService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/OffreService.php)  
**Rôle** : Cycle de vie complet des offres d'emploi (brouillon, validation, publication, clôture).

- `paginate(array $filters, int $perPage = 15): LengthAwarePaginator`
- `paginatePublished(int $perPage = 100): LengthAwarePaginator`
- `find(int $id): Offre`
- `findPublished(string $identifier): Offre`
- `create(array $data, array $relationsData): Offre`
- `update(Offre $offre, array $data, array $relationsData): Offre`
- `publish(Offre $offre): Offre`
- `close(Offre $offre): Offre`
- `delete(Offre $offre): void`
- `validateWorkflowProgression(Offre $offre, int $targetStatusId): void`

---

## 12. `PipelineMetricService`
**Fichier** : [`app/Services/PipelineMetricService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/PipelineMetricService.php)  
**Rôle** : Journalisation isolée des métriques du pipeline d'ingestion automatique n8n.

- `enregistrerSucces(Candidature $candidature, ?string $cle, array $data): void`
  - *Description* : Enregistre les durées de traitement OCR/NER et les compteurs d'entités extraites.
- `enregistrerDoublon(Candidature $candidature, string $cle, array $data): void`
  - *Description* : Enregistre la trace d'un doublon évité lors d'un retry réseau sur `cle_idempotence`.

---

## 13. `ReferentielService`
**Fichier** : [`app/Services/ReferentielService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/ReferentielService.php)  
**Rôle** : Récupération globale et synchronisée de l'ensemble des référentiels pour le frontend.

- `getAllReferentiels(): array`
  - *Description* : Retourne statuts d'offre, statuts de candidature, types de contrat, types de messages.

---

## 14. `RendezVousService`
**Fichier** : [`app/Services/RendezVousService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/RendezVousService.php)  
**Rôle** : Gestion de l'agenda RH, synchronisation FullCalendar et statuts d'entretiens.

- `getReferentiels(): array`
- `getRendezVous(array $filters = [], bool $paginate = false, int $perPage = 50): Collection|LengthAwarePaginator`
- `planifier(array $data, ?int $idUtilisateurConnecte = null): RendezVous`
- `modifier(RendezVous $rendezVous, array $data, ?int $idUtilisateurConnecte = null): RendezVous`
- `annuler(RendezVous $rendezVous, ?string $motif = null, ?int $idUtilisateurConnecte = null): RendezVous`
- `supprimer(RendezVous $rendezVous, ?int $idUtilisateurConnecte = null): bool`

---

## 15. `VivierService`
**Fichier** : [`app/Services/VivierService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alphaCiment/code_source/recrutement/app/Services/VivierService.php)  
**Rôle** : Consultation et enrichissement du vivier de talents, gestion manuelle des profils candidats.

- `listVivier(array $filters): Collection`
- `addToVivier(array $data): VivierCandidat`
- `removeFromVivier(int $id): void`
- `getCandidatProfile(int $id): array`
- `addCompetence(int $id, int $idCompetence, ?string $niveau): void`
- `addExperience(int $id, array $data)`
- `addProjet(int $id, array $data)`
- `addFormation(int $id, array $data)`
- `extractOcr(int $idCandidature): CvExtractionOcr`
- `validateOcrData(int $idCandidature, array $data): CvExtractionOcr`
