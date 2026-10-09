<?php

namespace App\Services;

use App\Models\Candidature;
use App\Models\StatutCandidature;
use App\Repositories\Contracts\CandidatRepositoryInterface;
use App\Repositories\Contracts\CandidatureRepositoryInterface;
use App\Repositories\Contracts\DomaineRepositoryInterface;
use App\Repositories\Contracts\OffreRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CandidatureService
{
    public function __construct(
        protected CandidatureRepositoryInterface $candidatureRepository,
        protected CandidatRepositoryInterface $candidatRepository,
        protected OffreRepositoryInterface $offreRepository,
        protected DomaineRepositoryInterface $domaineRepository,
        protected ?AuditLogService $auditLogService = null,
        protected ?CommunicationService $communicationService = null
    ) {
        $this->auditLogService = $auditLogService ?? app(AuditLogService::class);
        $this->communicationService = $communicationService ?? app(CommunicationService::class);
    }

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->candidatureRepository->paginateFiltered($filters, $perPage);
    }

    public function find(int $id): Candidature
    {
        $candidature = $this->candidatureRepository->findById($id);
        $this->candidatureRepository->markAsViewed($candidature);
        return $candidature;
    }

    public function markAsViewed(int $id): Candidature
    {
        $candidature = $this->candidatureRepository->findById($id);
        $this->candidatureRepository->markAsViewed($candidature);
        return $candidature;
    }

    public function postulerOffre(string $idOffre, array $data, $request): Candidature
    {
        $offre = $this->offreRepository->findPublishedBySlugOrId($idOffre);

        if (!$offre) {
            // Check if offer exists at all
            if (is_numeric($idOffre)) {
                $rawOffre = $this->offreRepository->findById((int) $idOffre);
                if ($rawOffre) {
                    throw ValidationException::withMessages([
                        'id_offre' => ['Cette offre n\'est pas ouverte aux candidatures (statut non publié).'],
                    ]);
                }
            }
            abort(404, 'Offre introuvable ou non disponible.');
        }

        return DB::transaction(function () use ($data, $request, $offre) {
            // 1. Deduplication candidat
            $candidat = $this->candidatRepository->firstOrCreate(
                ['email' => strtolower(trim($data['email']))],
                [
                    'nom' => trim($data['nom']),
                    'prenom' => trim($data['prenom']),
                    'telephone' => $data['telephone'] ?? null,
                ]
            );

            // 2. Initial status: Reçue
            $recueStatusId = $this->candidatureRepository->getStatusIdByLibelle(['Reçue', 'Recue']);
            $typeDemandeId = $this->candidatureRepository->getTypeDemandeIdByLibelle('Offre');

            // 3. Create Candidature
            $candidature = $this->candidatureRepository->create([
                'id_candidat' => $candidat->id_candidat,
                'id_type_demande' => $typeDemandeId,
                'id_offre' => $offre->id_offre,
                'id_domaine' => null,
                'id_statut_candidature' => $recueStatusId,
                'dans_vivier' => false,
                'poste_souhaite' => null,
                'message' => $data['message_motivation'] ?? null,
                'canal_depot' => 'site_externe',
                'id_utilisateur_depot' => null,
            ]);

            // 4. Historique
            $this->candidatureRepository->createHistorique([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $recueStatusId,
                'date_changement' => now(),
                'commentaire' => 'Candidature déposée sur l\'offre: ' . $offre->titre_poste,
                'id_utilisateur' => auth()->id() ?? null,
            ]);

            // 5. Store files
            $this->storeFiles($candidature, $request, 'site_externe');

            // 6. Accusé de réception automatique par email
            try {
                $this->communicationService->envoyerAccuseReception($candidature);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Erreur envoi accusé de réception candidature #{$candidature->id_candidature}: " . $e->getMessage());
            }

            return $candidature->load(['candidat', 'offre', 'statut']);
        });
    }

    public function candidatureSpontanee(array $data, $request): Candidature
    {
        return DB::transaction(function () use ($data, $request) {
            $candidat = $this->candidatRepository->firstOrCreate(
                ['email' => strtolower(trim($data['email']))],
                [
                    'nom' => trim($data['nom']),
                    'prenom' => trim($data['prenom']),
                    'telephone' => $data['telephone'] ?? null,
                ]
            );

            $domaineId = null;
            if (!empty($data['poste_souhaite'])) {
                $domaine = $this->domaineRepository->firstOrCreate(
                    ['nom_domaine' => trim($data['poste_souhaite'])],
                    ['id_direction' => null, 'valide' => false]
                );
                $domaineId = $domaine->id_domaine;
            }

            $recueStatusId = $this->candidatureRepository->getStatusIdByLibelle(['Reçue', 'Recue']);
            $typeDemandeId = $this->candidatureRepository->getTypeDemandeIdByLibelle('Spontanee');

            $candidature = $this->candidatureRepository->create([
                'id_candidat' => $candidat->id_candidat,
                'id_type_demande' => $typeDemandeId,
                'id_offre' => null,
                'id_domaine' => $domaineId,
                'id_statut_candidature' => $recueStatusId,
                'dans_vivier' => true,
                'poste_souhaite' => $data['poste_souhaite'] ?? null,
                'message' => $data['message_motivation'] ?? null,
                'canal_depot' => 'site_externe',
                'id_utilisateur_depot' => null,
            ]);

            $this->candidatureRepository->createHistorique([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $recueStatusId,
                'date_changement' => now(),
                'commentaire' => 'Dépôt de candidature spontanée' . (!empty($data['poste_souhaite']) ? ' (Poste souhaité: ' . $data['poste_souhaite'] . ')' : ''),
                'id_utilisateur' => auth()->id() ?? null,
            ]);

            $this->storeFiles($candidature, $request, 'site_externe');

            // Accusé de réception automatique par email
            try {
                $this->communicationService->envoyerAccuseReception($candidature);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Erreur envoi accusé de réception candidature spontanée #{$candidature->id_candidature}: " . $e->getMessage());
            }

            return $candidature->load(['candidat', 'domaine', 'statut']);
        });
    }

    public function importExternalCandidature(array $data, $request): Candidature
    {
        return DB::transaction(function () use ($data, $request) {
            // Extraction robuste du nom et prénom (soit fournis, soit déduits de nom_complet, soit de l'email)
            $nom = trim($data['nom'] ?? '');
            $prenom = trim($data['prenom'] ?? '');
            if (empty($nom) && !empty($data['nom_complet'])) {
                $parts = explode(' ', trim($data['nom_complet']), 2);
                $nom = $parts[0] ?? 'Candidat';
                $prenom = $parts[1] ?? '';
            }
            if (empty($nom)) {
                $nom = explode('@', $data['email'])[0];
            }

            $candidat = $this->candidatRepository->firstOrCreate(
                ['email' => strtolower(trim($data['email']))],
                [
                    'nom' => $nom,
                    'prenom' => $prenom ?: null,
                    'telephone' => $data['telephone'] ?? null,
                ]
            );

            $recueStatusId = $this->candidatureRepository->getStatusIdByLibelle(['Reçue', 'Recue']);
            
            // Résolution du type de demande (priorité à ce qui est envoyé par le switch n8n ou déduit de l'offre)
            if (!empty($data['id_type_demande'])) {
                $typeDemandeId = (int) $data['id_type_demande'];
            } elseif (!empty($data['type_demande'])) {
                $tdLower = strtolower(trim($data['type_demande']));
                if (str_contains($tdLower, 'offre') || $tdLower === '1') {
                    $typeDemandeId = $this->candidatureRepository->getTypeDemandeIdByLibelle('Offre');
                } else {
                    $typeDemandeId = $this->candidatureRepository->getTypeDemandeIdByLibelle('Spontanee');
                }
            } else {
                $typeDemandeId = !empty($data['id_offre'])
                    ? $this->candidatureRepository->getTypeDemandeIdByLibelle('Offre')
                    : $this->candidatureRepository->getTypeDemandeIdByLibelle('Spontanee');
            }

            $offreIdTypeDemande = $this->candidatureRepository->getTypeDemandeIdByLibelle('Offre');
            $isOffre = ($typeDemandeId === $offreIdTypeDemande) || !empty($data['id_offre']);

            $candidature = $this->candidatureRepository->create([
                'id_candidat' => $candidat->id_candidat,
                'id_type_demande' => $typeDemandeId,
                'id_offre' => $data['id_offre'] ?? null,
                'id_domaine' => $data['id_domaine'] ?? null,
                'id_statut_candidature' => $recueStatusId,
                'dans_vivier' => empty($data['id_offre']) && !$isOffre,
                'poste_souhaite' => $data['poste_souhaite'] ?? null,
                'message' => $data['message_motivation'] ?? null,
                'canal_depot' => 'site_externe',
                'id_utilisateur_depot' => null,
            ]);

            $this->candidatureRepository->createHistorique([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $recueStatusId,
                'date_changement' => now(),
                'commentaire' => 'Réception et importation automatique depuis ' . ($data['source'] ?? 'e-mail / n8n'),
                'id_utilisateur' => null,
            ]);

            $this->storeFiles($candidature, $request, 'import_externe', $data);

            // Enregistrement direct des données OCR & NER extraites si transmises
            if (!empty($data['donnees_json']) || !empty($data['texte_brut_ocr'])) {
                $donneesJson = $data['donnees_json'];
                if (is_string($donneesJson)) {
                    $donneesJson = json_decode($donneesJson, true);
                }

                // 1. Sauvegarde dans cv_extraction_ocr
                \App\Models\CvExtractionOcr::create([
                    'id_candidature' => $candidature->id_candidature,
                    'texte_brut_ocr' => $data['texte_brut_ocr'] ?? null,
                    'donnees_json' => $donneesJson,
                    'statut_validation' => 'valide',
                ]);

                // 2. Insertion directe dans les tables de profil (compétences, expériences, formations)
                if (is_array($donneesJson)) {
                    $this->insertExtractedProfileData($candidature->id_candidature, $donneesJson);
                }
            }

            return $candidature->load(['candidat', 'offre', 'statut']);
        });
    }

    public function saisirRh(array $data, $request, ?int $userId): Candidature
    {
        if (!empty($data['id_offre'])) {
            $offre = $this->offreRepository->findById($data['id_offre']);
            $publieeId = $this->offreRepository->getStatusId('Publiee');
            if ($publieeId && (int) $offre->id_statut_offre !== $publieeId) {
                throw ValidationException::withMessages([
                    'id_offre' => ['Une candidature RH ne peut être enregistrée que sur une offre avec le statut Publiée.'],
                ]);
            }
        }

        return DB::transaction(function () use ($data, $request, $userId) {
            $candidat = $this->candidatRepository->firstOrCreate(
                ['email' => strtolower(trim($data['email']))],
                [
                    'nom' => trim($data['nom']),
                    'prenom' => trim($data['prenom']),
                    'telephone' => $data['telephone'] ?? null,
                ]
            );

            $recueStatusId = $this->candidatureRepository->getStatusIdByLibelle(['Reçue', 'Recue']);
            $typeDemandeId = !empty($data['id_offre'])
                ? $this->candidatureRepository->getTypeDemandeIdByLibelle('Offre')
                : $this->candidatureRepository->getTypeDemandeIdByLibelle('Spontanee');

            $candidature = $this->candidatureRepository->create([
                'id_candidat' => $candidat->id_candidat,
                'id_type_demande' => $typeDemandeId,
                'id_offre' => $data['id_offre'] ?? null,
                'id_domaine' => $data['id_domaine'] ?? null,
                'id_statut_candidature' => $recueStatusId,
                'dans_vivier' => empty($data['id_offre']),
                'poste_souhaite' => $data['poste_souhaite'] ?? null,
                'message' => $data['message_motivation'] ?? null,
                'canal_depot' => 'rh_manuel',
                'id_utilisateur_depot' => $userId,
            ]);

            $this->candidatureRepository->createHistorique([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $recueStatusId,
                'date_changement' => now(),
                'commentaire' => 'Candidature saisie manuellement par l\'agent RH',
                'id_utilisateur' => $userId,
            ]);

            $this->storeFiles($candidature, $request, 'rh_manuel');

            return $candidature->load(['candidat', 'offre', 'statut']);
        });
    }

    public function updateStatut(int $id, int $newStatusId, ?string $commentaire, ?int $userId): Candidature
    {
        $candidature = $this->candidatureRepository->findById($id);

        if ($candidature->dans_vivier) {
            throw ValidationException::withMessages([
                'dans_vivier' => ['Impossible de modifier le statut d\'une candidature enregistrée dans le vivier RH. Retirez-la du vivier pour changer son statut.'],
            ]);
        }

        $oldStatusId = (int) $candidature->id_statut_candidature;

        if ($oldStatusId === $newStatusId) {
            throw ValidationException::withMessages([
                'id_statut_candidature' => ['La candidature est déjà dans ce statut.'],
            ]);
        }

        $currentStatut = StatutCandidature::find($oldStatusId);
        $newStatut = StatutCandidature::find($newStatusId);

        if ($currentStatut && $newStatut && (int) $newStatut->ordre_workflow <= (int) $currentStatut->ordre_workflow) {
            throw ValidationException::withMessages([
                'id_statut_candidature' => ['Impossible de basculer vers un statut ayant un ordre de workflow inférieur ou égal à l\'actuel.'],
            ]);
        }

        DB::transaction(function () use ($candidature, $newStatusId, $commentaire, $userId, $currentStatut, $newStatut) {
            $this->candidatureRepository->update($candidature, ['id_statut_candidature' => $newStatusId]);

            $this->candidatureRepository->createHistorique([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $newStatusId,
                'date_changement' => now(),
                'commentaire' => $commentaire ?? 'Changement de statut',
                'id_utilisateur' => $userId,
            ]);

            $nomCandidat = $candidature->candidat ? "{$candidature->candidat->nom} {$candidature->candidat->prenom}" : "Candidature #{$candidature->id_candidature}";
            $this->auditLogService->log(
                action: 'CHANGEMENT_STATUT_CANDIDAT',
                entite: 'Candidature',
                idEntite: $candidature->id_candidature,
                description: "Changement de statut pour {$nomCandidat} : {$currentStatut?->libelle} -> {$newStatut?->libelle}",
                anciennesValeurs: ['id_statut_candidature' => $candidature->id_statut_candidature, 'statut' => $currentStatut?->libelle],
                nouvellesValeurs: ['id_statut_candidature' => $newStatusId, 'statut' => $newStatut?->libelle, 'commentaire' => $commentaire],
                idUtilisateur: $userId
            );
        });

        return $candidature->fresh(['statut', 'historique']);
    }

    public function updateVivierStatus(int $id, bool $dansVivier): Candidature
    {
        $candidature = $this->candidatureRepository->findById($id);

        if ($dansVivier) {
            $statusLibelle = strtolower(trim($candidature->statut?->libelle ?? ''));
            if ($statusLibelle === 'retenue' || $statusLibelle === 'retenu') {
                throw ValidationException::withMessages([
                    'dans_vivier' => ['Une candidature ayant le statut "Retenue" ne peut pas être placée dans le vivier RH.'],
                ]);
            }
        }

        $this->candidatureRepository->update($candidature, ['dans_vivier' => $dansVivier]);

        $nomCandidat = $candidature->candidat ? "{$candidature->candidat->nom} {$candidature->candidat->prenom}" : "Candidature #{$candidature->id_candidature}";
        $this->auditLogService->log(
            action: $dansVivier ? 'AJOUT_VIVIER' : 'RETRAIT_VIVIER',
            entite: 'Candidature',
            idEntite: $candidature->id_candidature,
            description: ($dansVivier ? "Placement dans le vivier RH : " : "Retrait du vivier RH : ") . $nomCandidat,
            anciennesValeurs: ['dans_vivier' => $candidature->dans_vivier],
            nouvellesValeurs: ['dans_vivier' => $dansVivier]
        );

        return $candidature;
    }

    public function getStatuts(): Collection
    {
        return $this->candidatureRepository->getStatuts();
    }

    protected function storeFiles(Candidature $candidature, $request, string $sourceSuffix, array $data = []): void
    {
        // 1. Upload de fichier binaire classique (Multipart Form-Data)
        if ($request && method_exists($request, 'hasFile') && $request->hasFile('cv')) {
            $file = $request->file('cv');
            $path = $file->store('documents/cv', 'public');
            $this->candidatureRepository->createDocument([
                'id_candidature' => $candidature->id_candidature,
                'type_document' => 'CV',
                'nom_fichier' => $file->getClientOriginalName(),
                'chemin_fichier' => $path,
                'taille_octets' => $file->getSize(),
                'mime_type' => $file->getClientMimeType(),
                'description' => 'Curriculum Vitae' . ($sourceSuffix !== 'site_externe' ? " ($sourceSuffix)" : ''),
            ]);
        }
        // 2. Upload Base64 (idéal pour n8n en mode JSON 'Using fields below')
        else {
            $base64 = ($request && method_exists($request, 'input')) ? $request->input('cv_base64') : null;
            if (!$base64 && !empty($data['cv_base64'])) {
                $base64 = $data['cv_base64'];
            }

            if (!empty($base64)) {
                try {
                    // Supprimer un préfixe data:application/pdf;base64,... éventuel
                    if (str_contains($base64, ';base64,')) {
                        $parts = explode(';base64,', $base64);
                        $base64 = end($parts);
                    }

                    $nomFichier = ($request && method_exists($request, 'input')) ? $request->input('cv_nom') : null;
                    if (!$nomFichier && !empty($data['cv_nom'])) {
                        $nomFichier = $data['cv_nom'];
                    }
                    $filename = $nomFichier ?: ('cv_' . $candidature->id_candidature . '.pdf');

                    $mimeType = ($request && method_exists($request, 'input')) ? $request->input('cv_mime') : null;
                    if (!$mimeType && !empty($data['cv_mime'])) {
                        $mimeType = $data['cv_mime'];
                    }
                    $mimeType = $mimeType ?: 'application/pdf';

                    $decoded = base64_decode($base64);
                    $path = 'documents/cv/' . uniqid() . '_' . $filename;
                    \Illuminate\Support\Facades\Storage::disk('public')->put($path, $decoded);

                    $this->candidatureRepository->createDocument([
                        'id_candidature' => $candidature->id_candidature,
                        'type_document' => 'CV',
                        'nom_fichier' => $filename,
                        'chemin_fichier' => $path,
                        'taille_octets' => strlen($decoded),
                        'mime_type' => $mimeType,
                        'description' => 'Curriculum Vitae (Import JSON n8n)',
                    ]);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning("Erreur stockage cv_base64 : " . $e->getMessage());
                }
            }
        }

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $path = $file->store('documents/photos', 'public');
            $this->candidatureRepository->createDocument([
                'id_candidature' => $candidature->id_candidature,
                'type_document' => 'Photo',
                'nom_fichier' => $file->getClientOriginalName(),
                'chemin_fichier' => $path,
                'taille_octets' => $file->getSize(),
                'mime_type' => $file->getClientMimeType(),
                'description' => 'Photo de profil' . ($sourceSuffix !== 'site_externe' ? " ($sourceSuffix)" : ''),
            ]);
        }

        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                $path = $file->store('documents/annexes', 'public');
                $this->candidatureRepository->createDocument([
                    'id_candidature' => $candidature->id_candidature,
                    'type_document' => 'Autre',
                    'nom_fichier' => $file->getClientOriginalName(),
                    'chemin_fichier' => $path,
                    'taille_octets' => $file->getSize(),
                    'mime_type' => $file->getClientMimeType(),
                    'description' => 'Pièce jointe complémentaire',
                ]);
            }
        }
    }

    /**
     * Insère directement les compétences, expériences et formations extraites dans le profil du candidat.
     */
    protected function insertExtractedProfileData(int $idCandidature, array $donneesJson): void
    {
        // 1. Compétences
        if (!empty($donneesJson['competences']) && is_array($donneesJson['competences'])) {
            foreach ($donneesJson['competences'] as $comp) {
                if (empty($comp['nom'])) continue;
                $compModel = \App\Models\Competence::firstOrCreate(
                    ['nom_competence' => trim($comp['nom'])],
                    ['id_type_competence' => 1]
                );

                \Illuminate\Support\Facades\DB::table('candidat_competence')->updateOrInsert(
                    [
                        'id_candidature' => $idCandidature,
                        'id_competence' => $compModel->id_competence,
                    ],
                    [
                        'niveau' => $comp['niveau'] ?? 'Intermédiaire',
                        'valide' => true,
                        'source' => 'cv_ocr',
                        'score_confiance' => 0.95,
                    ]
                );
            }
        }

        // 2. Expériences
        if (!empty($donneesJson['experiences']) && is_array($donneesJson['experiences'])) {
            foreach ($donneesJson['experiences'] as $exp) {
                $posteTitle = trim($exp['poste'] ?? $exp['intitule_poste'] ?? 'Poste non spécifié');
                $dateDebut = $this->parseDateSafely($exp['date_debut'] ?? null);
                $dateFin = $this->parseDateSafely($exp['date_fin'] ?? null);
                $posteActuel = false;

                if (!empty($exp['date_fin'])) {
                    $dfLower = strtolower(trim($exp['date_fin']));
                    if (str_contains($dfLower, 'présent') || str_contains($dfLower, 'present') || str_contains($dfLower, 'cours')) {
                        $posteActuel = true;
                    }
                }

                \App\Models\CandidatExperience::create([
                    'id_candidature' => $idCandidature,
                    'poste' => $posteTitle,
                    'entreprise' => $exp['entreprise'] ?? null,
                    'date_debut' => $dateDebut,
                    'date_fin' => $dateFin,
                    'poste_actuel' => $posteActuel,
                    'description' => $exp['description'] ?? null,
                    'valide' => true,
                    'source' => 'cv_ocr',
                ]);
            }
        }

        // 3. Formations
        if (!empty($donneesJson['formations']) && is_array($donneesJson['formations'])) {
            foreach ($donneesJson['formations'] as $form) {
                if (empty($form['diplome'])) continue;
                $dateObt = $this->parseDateSafely($form['date_obtention'] ?? $form['annee_obtention'] ?? null);

                \App\Models\CandidatFormation::create([
                    'id_candidature' => $idCandidature,
                    'diplome' => $form['diplome'],
                    'etablissement' => $form['etablissement'] ?? null,
                    'domaine_etude' => $form['domaine_etude'] ?? null,
                    'date_obtention' => $dateObt,
                    'valide' => true,
                    'source' => 'cv_ocr',
                ]);
            }
        }
    }

    /**
     * Analyse et convertit une chaîne de date en format ISO Y-m-d sécurisé pour PostgreSQL.
     */
    protected function parseDateSafely(?string $val): ?string
    {
        if (empty($val)) return null;
        $val = trim($val);
        $lower = strtolower($val);
        if (str_contains($lower, 'présent') || str_contains($lower, 'present') || str_contains($lower, 'cours')) {
            return null;
        }
        if (preg_match('/^\d{4}$/', $val)) {
            return $val . '-01-01';
        }
        if (preg_match('/^\d{4}-\d{2}$/', $val)) {
            return $val . '-01';
        }
        $ts = strtotime($val);
        if ($ts && $ts > 0) {
            return date('Y-m-d', $ts);
        }
        return null;
    }
}
