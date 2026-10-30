<?php

namespace App\Services;

use App\Enums\CanalDepot;
use App\Enums\ModeEnvoiCommunication;
use App\Enums\StatutCandidatureEnum;
use App\Enums\StatutOffreEnum;
use App\Enums\TypeDemandeEnum;
use App\Enums\TypeDocumentEnum;
use App\Models\Candidature;
use App\Repositories\Contracts\CandidatRepositoryInterface;
use App\Repositories\Contracts\CandidatureRepositoryInterface;
use App\Repositories\Contracts\CommunicationRepositoryInterface;
use App\Repositories\Contracts\DomaineRepositoryInterface;
use App\Repositories\Contracts\OffreRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CandidatureService
{
    public function __construct(
        protected CandidatureRepositoryInterface $candidatureRepository,
        protected CandidatRepositoryInterface $candidatRepository,
        protected OffreRepositoryInterface $offreRepository,
        protected DomaineRepositoryInterface $domaineRepository,
        protected DocumentService $documentService,
        protected CvExtractionService $cvExtractionService,
        protected PipelineMetricService $metricService,
        protected CommunicationService $communicationService,
        protected CommunicationRepositoryInterface $communicationRepository,
        protected AuditLogService $auditLogService
    ) {}

    // =========================================================================
    // 1. CONSULTATION (LECTURE SEULE / CQS)
    // =========================================================================

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->candidatureRepository->paginateFiltered($filters, $perPage);
    }

    public function find(int $id): Candidature
    {
        return $this->candidatureRepository->findById($id);
    }

    public function markAsViewed(int $id): Candidature
    {
        $candidature = $this->candidatureRepository->findById($id);
        $this->candidatureRepository->markAsViewed($candidature);
        return $candidature;
    }

    public function getStatuts(): Collection
    {
        return $this->candidatureRepository->getStatuts();
    }

    // =========================================================================
    // 2. ENTRÉES MÉTIER (LES 4 CANAUX DE DÉPÔT)
    // =========================================================================

    /**
     * Canal 1 : Postuler sur une offre d'emploi publiée (portail public)
     */
    public function postulerOffre(string $idOffre, array $data, ?UploadedFile $cvFile = null, ?UploadedFile $photoFile = null): Candidature
    {
        $offre = $this->offreRepository->findPublishedBySlugOrId($idOffre);
        if (!$offre) {
            throw new ModelNotFoundException("L'offre demandée n'existe pas ou n'est plus publiée.");
        }

        $recueId = $this->candidatureRepository->getStatusIdByLibelle(StatutCandidatureEnum::Recue);
        $typeDemandeId = $this->candidatureRepository->getTypeDemandeIdByLibelle(TypeDemandeEnum::Offre);

        $data['id_offre'] = $offre->id_offre;
        $data['id_type_demande'] = $typeDemandeId;
        $data['id_statut_candidature'] = $recueId;
        $data['dans_vivier'] = false;
        $data['canal_depot'] = CanalDepot::SiteExterne->value;
        $data['commentaire_historique'] = "Candidature déposée sur l'offre : {$offre->titre_poste}";
        $data['envoyer_accuse'] = true;

        return $this->enregistrer($data, $cvFile, $photoFile);
    }

    /**
     * Canal 2 : Dépôt d'une candidature spontanée (portail public)
     */
    public function candidatureSpontanee(array $data, ?UploadedFile $cvFile = null, ?UploadedFile $photoFile = null): Candidature
    {
        $domaineId = null;
        if (!empty($data['poste_souhaite'])) {
            $domaine = $this->domaineRepository->firstOrCreate(
                ['nom_domaine' => trim($data['poste_souhaite'])],
                ['valide' => false]
            );
            $domaineId = $domaine->id_domaine;
        }

        $recueId = $this->candidatureRepository->getStatusIdByLibelle(StatutCandidatureEnum::Recue);
        $typeDemandeId = $this->candidatureRepository->getTypeDemandeIdByLibelle(TypeDemandeEnum::Spontanee);

        $data['id_domaine'] = $domaineId;
        $data['id_type_demande'] = $typeDemandeId;
        $data['id_statut_candidature'] = $recueId;
        $data['dans_vivier'] = true;
        $data['canal_depot'] = CanalDepot::SiteExterne->value;
        $data['commentaire_historique'] = 'Dépôt de candidature spontanée' . (!empty($data['poste_souhaite']) ? " ({$data['poste_souhaite']})" : '');
        $data['envoyer_accuse'] = true;

        return $this->enregistrer($data, $cvFile, $photoFile);
    }

    /**
     * Canal 3 : Import automatique externe (webhook n8n, email parser)
     */
    public function importExternalCandidature(array $data, ?UploadedFile $cvFile = null): Candidature
    {
        $hasOffre = !empty($data['id_offre']);
        $recueId = $this->candidatureRepository->getStatusIdByLibelle(StatutCandidatureEnum::Recue);
        $typeDemandeId = $this->candidatureRepository->getTypeDemandeIdByLibelle(
            $hasOffre ? TypeDemandeEnum::Offre : TypeDemandeEnum::Spontanee
        );

        $data['id_type_demande'] = $typeDemandeId;
        $data['id_statut_candidature'] = $recueId;
        $data['dans_vivier'] = !$hasOffre;
        $data['canal_depot'] = CanalDepot::ImportExterne->value;
        $data['commentaire_historique'] = 'Importation automatique depuis ' . ($data['source'] ?? 'n8n / email');
        $data['envoyer_accuse'] = true;
        $data['cle_idempotence'] = !empty($data['cle_idempotence'])
            ? trim($data['cle_idempotence'])
            : (!empty($data['email_message_id']) ? trim($data['email_message_id']) : null);

        return $this->enregistrer($data, $cvFile, null);
    }

    /**
     * Canal 4 : Saisie manuelle par un agent RH (Back-Office)
     */
    public function saisirRh(array $data, ?UploadedFile $cvFile = null, ?UploadedFile $photoFile = null, ?int $userId = null): Candidature
    {
        $hasOffre = !empty($data['id_offre']);
        if ($hasOffre) {
            $offre = $this->offreRepository->findById((int) $data['id_offre']);
            if (!$offre) {
                throw ValidationException::withMessages(['id_offre' => ['L\'offre sélectionnée est introuvable.']]);
            }
            $publieeId = $this->offreRepository->getStatusId(StatutOffreEnum::Publiee);
            if ($publieeId && (int) $offre->id_statut_offre !== (int) $publieeId) {
                throw ValidationException::withMessages(['id_offre' => ['L\'offre doit avoir le statut Publiée.']]);
            }
        }

        $recueId = $this->candidatureRepository->getStatusIdByLibelle(StatutCandidatureEnum::Recue);
        $typeDemandeId = $this->candidatureRepository->getTypeDemandeIdByLibelle(
            $hasOffre ? TypeDemandeEnum::Offre : TypeDemandeEnum::Spontanee
        );

        $data['id_type_demande'] = $typeDemandeId;
        $data['id_statut_candidature'] = $recueId;
        $data['dans_vivier'] = !$hasOffre;
        $data['canal_depot'] = CanalDepot::RhManuel->value;
        $data['id_utilisateur_depot'] = $userId;
        $data['commentaire_historique'] = 'Candidature saisie manuellement par l\'agent RH';
        $data['envoyer_accuse'] = false;

        return $this->enregistrer($data, $cvFile, $photoFile);
    }

    // =========================================================================
    // 3. MOTEUR D'ENREGISTREMENT CENTRAL (TRANSACTIONNEL ET SÉCURISÉ)
    // =========================================================================

    protected function enregistrer(array $data, ?UploadedFile $cvFile = null, ?UploadedFile $photoFile = null): Candidature
    {
        $cle = $data['cle_idempotence'] ?? null;

        // 1. Idempotence préventive (si déjà traitée)
        if ($cle && ($existante = $this->candidatureRepository->findByCleIdempotence($cle))) {
            $this->metricService->enregistrerDoublon($existante, $cle, $data);
            return $existante->load(['candidat', 'offre', 'domaine', 'statut']);
        }

        $fichiersCrees = [];

        // 2. Transaction SQL principale (catch extérieur pour protéger PostgreSQL du 25P02)
        try {
            $candidature = DB::transaction(function () use ($data, $cvFile, $photoFile, $cle, &$fichiersCrees) {
                // A. Résolution défensive du nom/prénom et création du candidat via repository
                $nom = $data['nom'] ?? null;
                $prenom = $data['prenom'] ?? null;
                if (empty($nom) && !empty($data['nom_complet'])) {
                    $parts = preg_split('/\s+/', trim((string) $data['nom_complet']), 2);
                    $nom = $parts[0] ?? 'Candidat';
                    $prenom = $prenom ?: ($parts[1] ?? '-');
                }
                if (empty($nom) && !empty($data['email'])) {
                    $nom = explode('@', $data['email'])[0];
                }
                $nom = !empty($nom) ? trim((string) $nom) : 'Candidat';
                $prenom = !empty($prenom) ? trim((string) $prenom) : '-';

                $candidat = $this->candidatRepository->firstOrCreate(
                    ['email' => $data['email']],
                    [
                        'nom' => $nom,
                        'prenom' => $prenom,
                        'telephone' => $data['telephone'] ?? null,
                        'ville' => $data['ville'] ?? null,
                    ]
                );

                // B. Création de la candidature via repository
                $candidature = $this->candidatureRepository->create([
                    'id_candidat' => $candidat->id_candidat,
                    'id_type_demande' => $data['id_type_demande'],
                    'id_offre' => $data['id_offre'] ?? null,
                    'id_domaine' => $data['id_domaine'] ?? null,
                    'id_statut_candidature' => $data['id_statut_candidature'],
                    'dans_vivier' => $data['dans_vivier'] ?? false,
                    'poste_souhaite' => $data['poste_souhaite'] ?? null,
                    'message' => $data['message_motivation'] ?? $data['message'] ?? null,
                    'canal_depot' => $data['canal_depot'],
                    'id_utilisateur_depot' => $data['id_utilisateur_depot'] ?? null,
                    'cle_idempotence' => $cle,
                ]);

                // C. Premier statut dans l'historique via repository
                $this->candidatureRepository->createHistorique([
                    'id_candidature' => $candidature->id_candidature,
                    'id_statut_candidature' => $data['id_statut_candidature'],
                    'date_changement' => now(),
                    'commentaire' => $data['commentaire_historique'] ?? 'Candidature enregistrée',
                    'id_utilisateur' => $data['id_utilisateur_depot'] ?? auth()->id(),
                ]);

                // D. Stockage des pièces jointes (délégué à DocumentService qui utilise CandidatureRepository)
                if ($cvFile) {
                    $this->documentService->stockerDocument($candidature->id_candidature, $cvFile, TypeDocumentEnum::Cv, 'documents/cv', $fichiersCrees);
                } elseif (!empty($data['cv_base64'])) {
                    $this->documentService->stockerCvBase64($candidature->id_candidature, $data['cv_base64'], $data['cv_nom'] ?? 'cv.pdf', $fichiersCrees);
                }
                if ($photoFile) {
                    $this->documentService->stockerDocument($candidature->id_candidature, $photoFile, TypeDocumentEnum::Photo, 'documents/photos', $fichiersCrees);
                }

                // E. Profil structuré & extraction OCR (délégué à CvExtractionService qui utilise CvExtractionRepository)
                if (!empty($data['donnees_json']) || !empty($data['texte_brut_ocr'])) {
                    $this->cvExtractionService->importerProfilOcr($candidature->id_candidature, $data);
                }

                // F. Archivage de l'e-mail reçu (RG-COM-03 via CommunicationRepository)
                if (!empty($data['sujet_email']) || !empty($data['corps_email'])) {
                    $this->communicationRepository->create([
                        'id_candidature' => $candidature->id_candidature,
                        'id_type_message' => 6, // Autre
                        'objet' => $data['sujet_email'] ?? 'Candidature reçue par e-mail',
                        'contenu' => $data['corps_email'] ?? 'Import automatique',
                        'mode_envoi' => ModeEnvoiCommunication::Auto->value,
                        'date_envoi' => now(),
                    ]);
                }

                // G. POST-COMMIT : Accusé de réception et métriques
                DB::afterCommit(function () use ($candidature, $data, $cle) {
                    if (!empty($data['envoyer_accuse'])) {
                        try {
                            $this->communicationService->envoyerAccuseReception($candidature);
                        } catch (\Throwable $e) {
                            Log::warning("Erreur accusé #{$candidature->id_candidature}: " . $e->getMessage());
                        }
                    }

                    if (!empty($data['metrics']) || !empty($data['duree_totale_s'])) {
                        $this->metricService->enregistrerSucces($candidature, $cle, $data);
                    }
                });

                return $candidature;
            });
        } catch (UniqueConstraintViolationException $e) {
            $this->documentService->supprimerFichiers($fichiersCrees);
            if ($cle && ($existante = $this->candidatureRepository->findByCleIdempotence($cle))) {
                $this->metricService->enregistrerDoublon($existante, $cle, $data);
                return $existante->load(['candidat', 'offre', 'domaine', 'statut']);
            }
            throw $e;
        } catch (\Throwable $e) {
            $this->documentService->supprimerFichiers($fichiersCrees);
            throw $e;
        }

        return $candidature->load(['candidat', 'offre', 'domaine', 'statut']);
    }

    // =========================================================================
    // 4. GESTION DU WORKFLOW & VIVIER RH (AVEC VERROUILLAGE LIGNE)
    // =========================================================================

    public function updateStatut(int $id, int $newStatusId, ?string $commentaire, ?int $userId): Candidature
    {
        return DB::transaction(function () use ($id, $newStatusId, $commentaire, $userId) {
            $candidature = $this->candidatureRepository->findByIdForUpdate($id);

            if ($candidature->dans_vivier) {
                throw ValidationException::withMessages([
                    'dans_vivier' => ['Impossible de modifier le statut d\'une candidature enregistrée dans le vivier RH.'],
                ]);
            }

            $oldStatusId = (int) $candidature->id_statut_candidature;
            if ($oldStatusId === $newStatusId) {
                throw ValidationException::withMessages([
                    'id_statut_candidature' => ['La candidature est déjà dans ce statut.'],
                ]);
            }

            $currentStatut = $this->candidatureRepository->findStatutById($oldStatusId);
            $newStatut = $this->candidatureRepository->findStatutById($newStatusId);

            if (!$newStatut) {
                throw ValidationException::withMessages([
                    'id_statut_candidature' => ['Le statut cible est introuvable.'],
                ]);
            }

            if ($currentStatut && (int) $newStatut->ordre_workflow <= (int) $currentStatut->ordre_workflow) {
                throw ValidationException::withMessages([
                    'id_statut_candidature' => ['Impossible de basculer vers un statut ayant un ordre de workflow inférieur ou égal à l\'actuel.'],
                ]);
            }

            $this->candidatureRepository->update($candidature, ['id_statut_candidature' => $newStatusId]);

            $this->candidatureRepository->createHistorique([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $newStatusId,
                'date_changement' => now(),
                'commentaire' => $commentaire ?? 'Changement de statut',
                'id_utilisateur' => $userId,
            ]);

            $nom = $candidature->candidat ? "{$candidature->candidat->nom} {$candidature->candidat->prenom}" : "#{$candidature->id_candidature}";
            $this->auditLogService->log(
                action: 'CHANGEMENT_STATUT_CANDIDAT',
                entite: 'Candidature',
                idEntite: $candidature->id_candidature,
                description: "Changement de statut pour {$nom} : {$currentStatut?->libelle} -> {$newStatut?->libelle}",
                anciennesValeurs: ['id_statut_candidature' => $oldStatusId, 'statut' => $currentStatut?->libelle],
                nouvellesValeurs: ['id_statut_candidature' => $newStatusId, 'statut' => $newStatut?->libelle],
                idUtilisateur: $userId
            );

            return $candidature->fresh(['statut', 'historique']);
        });
    }

    public function updateVivierStatus(int $id, bool $dansVivier): Candidature
    {
        return DB::transaction(function () use ($id, $dansVivier) {
            $candidature = $this->candidatureRepository->findByIdForUpdate($id);

            // Garde-fou "valeur déjà identique"
            if ((bool) $candidature->dans_vivier === $dansVivier) {
                return $candidature;
            }

            if ($dansVivier) {
                $statusLibelle = trim($candidature->statut?->libelle ?? '');
                if (StatutCandidatureEnum::Retenue->matches($statusLibelle)) {
                    throw ValidationException::withMessages([
                        'dans_vivier' => ['Une candidature avec le statut "Retenue" ne peut pas être placée dans le vivier.'],
                    ]);
                }
            }

            $oldDansVivier = (bool) $candidature->dans_vivier;
            $this->candidatureRepository->update($candidature, ['dans_vivier' => $dansVivier]);

            $nom = $candidature->candidat ? "{$candidature->candidat->nom} {$candidature->candidat->prenom}" : "#{$candidature->id_candidature}";
            $this->auditLogService->log(
                action: $dansVivier ? 'AJOUT_VIVIER' : 'RETRAIT_VIVIER',
                entite: 'Candidature',
                idEntite: $candidature->id_candidature,
                description: ($dansVivier ? "Placement vivier : " : "Retrait vivier : ") . $nom,
                anciennesValeurs: ['dans_vivier' => $oldDansVivier],
                nouvellesValeurs: ['dans_vivier' => $dansVivier]
            );

            return $candidature->fresh(['statut', 'candidat']);
        });
    }
}
