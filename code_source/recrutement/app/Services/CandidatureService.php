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
        protected DomaineRepositoryInterface $domaineRepository
    ) {}

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

            return $candidature->load(['candidat', 'domaine', 'statut']);
        });
    }

    public function importExternalCandidature(array $data, $request): Candidature
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
                'canal_depot' => 'site_externe',
                'id_utilisateur_depot' => null,
            ]);

            $this->candidatureRepository->createHistorique([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $recueStatusId,
                'date_changement' => now(),
                'commentaire' => 'Réception et importation automatique depuis ' . ($data['source'] ?? 'e-mail / site externe'),
                'id_utilisateur' => null,
            ]);

            $this->storeFiles($candidature, $request, 'import_externe');

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

        DB::transaction(function () use ($candidature, $newStatusId, $commentaire, $userId) {
            $this->candidatureRepository->update($candidature, ['id_statut_candidature' => $newStatusId]);

            $this->candidatureRepository->createHistorique([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $newStatusId,
                'date_changement' => now(),
                'commentaire' => $commentaire ?? 'Changement de statut',
                'id_utilisateur' => $userId,
            ]);
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

        return $candidature;
    }

    public function getStatuts(): Collection
    {
        return $this->candidatureRepository->getStatuts();
    }

    protected function storeFiles(Candidature $candidature, $request, string $sourceSuffix): void
    {
        if ($request->hasFile('cv')) {
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
}
