<?php

namespace App\Services;

use App\Models\Offre;
use App\Models\StatutOffre;
use App\Repositories\Contracts\OffreRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OffreService
{
    public function __construct(
        protected OffreRepositoryInterface $offreRepository,
        protected ?AuditLogService $auditLogService = null
    ) {
        $this->auditLogService = $auditLogService ?? app(AuditLogService::class);
    }

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->offreRepository->paginateFiltered($filters, $perPage);
    }

    public function paginatePublished(int $perPage = 100): LengthAwarePaginator
    {
        return $this->offreRepository->paginatePublished($perPage);
    }

    public function find(int $id): Offre
    {
        return $this->offreRepository->findById($id);
    }

    public function findPublished(string $identifier): Offre
    {
        $offre = $this->offreRepository->findPublishedBySlugOrId($identifier);
        if (!$offre) {
            abort(404, "L'offre n'est pas disponible ou est cloturee.");
        }
        return $offre;
    }

    public function create(array $data, array $relationsData): Offre
    {
        $data['id_statut_offre'] = $data['id_statut_offre'] ?? $this->offreRepository->getStatusId('Brouillon');
        $data['id_lieu'] = !empty($data['id_lieu']) ? (int) $data['id_lieu'] : 1;

        unset($data['profil'], $data['profils'], $data['missions'], $data['formations'], $data['competences']);

        return DB::transaction(function () use ($data, $relationsData) {
            $offre = $this->offreRepository->create($data);
            $this->offreRepository->syncNestedRelations($offre, $relationsData);
            $createdOffre = $this->offreRepository->findById($offre->id_offre);

            $this->auditLogService->log(
                action: 'CREATION_OFFRE',
                entite: 'Offre',
                idEntite: $createdOffre->id_offre,
                description: "Création de l'offre d'emploi : {$createdOffre->titre_poste} ({$createdOffre->reference_offre})",
                anciennesValeurs: null,
                nouvellesValeurs: [
                    'titre_poste' => $createdOffre->titre_poste,
                    'reference_offre' => $createdOffre->reference_offre,
                    'id_direction' => $createdOffre->id_direction,
                    'id_domaine' => $createdOffre->id_domaine,
                    'id_statut_offre' => $createdOffre->id_statut_offre,
                ]
            );

            return $createdOffre;
        });
    }

    public function update(Offre $offre, array $data, array $relationsData): Offre
    {
        if (isset($data['id_statut_offre']) && (int) $data['id_statut_offre'] !== (int) $offre->id_statut_offre) {
            $this->validateWorkflowProgression($offre, (int) $data['id_statut_offre']);
        }

        if (array_key_exists('id_lieu', $data) && empty($data['id_lieu'])) {
            $data['id_lieu'] = 1;
        }

        $anciennesValeurs = [
            'titre_poste' => $offre->titre_poste,
            'reference_offre' => $offre->reference_offre,
            'id_statut_offre' => $offre->id_statut_offre,
            'id_direction' => $offre->id_direction,
        ];

        unset($data['profil'], $data['profils'], $data['missions'], $data['formations'], $data['competences']);

        return DB::transaction(function () use ($offre, $data, $relationsData, $anciennesValeurs) {
            $this->offreRepository->update($offre, $data);
            $this->offreRepository->syncNestedRelations($offre, $relationsData);
            $updatedOffre = $this->offreRepository->findById($offre->id_offre);

            $this->auditLogService->log(
                action: 'MODIFICATION_OFFRE',
                entite: 'Offre',
                idEntite: $updatedOffre->id_offre,
                description: "Modification de l'offre d'emploi : {$updatedOffre->titre_poste} ({$updatedOffre->reference_offre})",
                anciennesValeurs: $anciennesValeurs,
                nouvellesValeurs: [
                    'titre_poste' => $updatedOffre->titre_poste,
                    'reference_offre' => $updatedOffre->reference_offre,
                    'id_statut_offre' => $updatedOffre->id_statut_offre,
                    'id_direction' => $updatedOffre->id_direction,
                ]
            );

            return $updatedOffre;
        });
    }

    public function publish(Offre $offre): Offre
    {
        $targetId = $this->offreRepository->getStatusId('Publiee');
        if (!$targetId) {
            abort(500, 'Statut Publiee introuvable.');
        }

        $this->validateWorkflowProgression($offre, $targetId);

        $this->offreRepository->update($offre, [
            'id_statut_offre' => $targetId,
            'date_publication' => $offre->date_publication ?? today(),
        ]);

        $published = $this->offreRepository->findById($offre->id_offre);

        $this->auditLogService->log(
            action: 'PUBLICATION_OFFRE',
            entite: 'Offre',
            idEntite: $published->id_offre,
            description: "Publication de l'offre : {$published->titre_poste} ({$published->reference_offre})",
            anciennesValeurs: ['id_statut_offre' => $offre->id_statut_offre],
            nouvellesValeurs: ['id_statut_offre' => $targetId, 'date_publication' => $published->date_publication]
        );

        return $published;
    }

    public function close(Offre $offre): Offre
    {
        $targetId = $this->offreRepository->getStatusId('Cloturee');
        if (!$targetId) {
            abort(500, 'Statut Cloturee introuvable.');
        }

        $this->validateWorkflowProgression($offre, $targetId);

        $this->offreRepository->update($offre, [
            'id_statut_offre' => $targetId,
            'date_limite' => $offre->date_limite ?? today(),
        ]);

        $closed = $this->offreRepository->findById($offre->id_offre);

        $this->auditLogService->log(
            action: 'CLOTURE_OFFRE',
            entite: 'Offre',
            idEntite: $closed->id_offre,
            description: "Clôture de l'offre : {$closed->titre_poste} ({$closed->reference_offre})",
            anciennesValeurs: ['id_statut_offre' => $offre->id_statut_offre],
            nouvellesValeurs: ['id_statut_offre' => $targetId, 'date_limite' => $closed->date_limite]
        );

        return $closed;
    }

    public function delete(Offre $offre): void
    {
        $brouillonId = $this->offreRepository->getStatusId('Brouillon');

        if ($brouillonId && (int) $offre->id_statut_offre !== $brouillonId) {
            throw ValidationException::withMessages([
                'offre' => ['Seule une offre au statut Brouillon peut etre supprimee.'],
            ]);
        }

        $deletedDetails = [
            'id_offre' => $offre->id_offre,
            'titre_poste' => $offre->titre_poste,
            'reference_offre' => $offre->reference_offre,
        ];

        $this->offreRepository->delete($offre);

        $this->auditLogService->log(
            action: 'SUPPRESSION_OFFRE',
            entite: 'Offre',
            idEntite: $deletedDetails['id_offre'],
            description: "Suppression définitive du brouillon de l'offre : {$deletedDetails['titre_poste']}",
            anciennesValeurs: $deletedDetails,
            nouvellesValeurs: null
        );
    }

    public function validateWorkflowProgression(Offre $offre, int $targetStatusId): void
    {
        $current = StatutOffre::find($offre->id_statut_offre);
        $target = StatutOffre::find($targetStatusId);

        if (!$current || !$target) {
            return;
        }

        if ((int) $target->ordre_workflow < (int) $current->ordre_workflow) {
            throw ValidationException::withMessages([
                'id_statut_offre' => ['Impossible de revenir a un statut anterieur dans le cycle de vie de l\'offre.'],
            ]);
        }
    }
}
