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
        protected OffreRepositoryInterface $offreRepository
    ) {}

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
            return $this->offreRepository->findById($offre->id_offre);
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

        unset($data['profil'], $data['profils'], $data['missions'], $data['formations'], $data['competences']);

        return DB::transaction(function () use ($offre, $data, $relationsData) {
            $this->offreRepository->update($offre, $data);
            $this->offreRepository->syncNestedRelations($offre, $relationsData);
            return $this->offreRepository->findById($offre->id_offre);
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

        return $this->offreRepository->findById($offre->id_offre);
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

        return $this->offreRepository->findById($offre->id_offre);
    }

    public function delete(Offre $offre): void
    {
        $brouillonId = $this->offreRepository->getStatusId('Brouillon');

        if ($brouillonId && (int) $offre->id_statut_offre !== $brouillonId) {
            throw ValidationException::withMessages([
                'offre' => ['Seule une offre au statut Brouillon peut etre supprimee.'],
            ]);
        }

        $this->offreRepository->delete($offre);
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
