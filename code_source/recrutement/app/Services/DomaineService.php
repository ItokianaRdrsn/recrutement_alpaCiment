<?php

namespace App\Services;

use App\Models\Domaine;
use App\Repositories\Contracts\DomaineRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DomaineService
{
    public function __construct(
        protected DomaineRepositoryInterface $domaineRepository
    ) {}

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->domaineRepository->paginateFiltered($filters, $perPage);
    }

    public function find(int $id): Domaine
    {
        return $this->domaineRepository->findById($id);
    }

    public function create(array $data, bool $validated = false, ?int $userId = null): Domaine
    {
        $attributes = $data;
        $attributes['valide'] = $validated;
        $attributes['date_validation'] = $validated ? now() : null;
        $attributes['valide_par'] = $validated ? $userId : null;

        $domaine = $this->domaineRepository->create($attributes);

        return $this->domaineRepository->findById($domaine->id_domaine);
    }

    public function update(Domaine $domaine, array $data, ?bool $validated = null, ?int $userId = null): Domaine
    {
        $attributes = $data;

        if ($validated !== null) {
            $attributes['valide'] = $validated;
            $attributes['date_validation'] = $validated ? now() : null;
            $attributes['valide_par'] = $validated ? $userId : null;
        }

        $this->domaineRepository->update($domaine, $attributes);

        return $this->domaineRepository->findById($domaine->id_domaine);
    }

    public function validateDomain(Domaine $domaine, ?int $userId): Domaine
    {
        $this->domaineRepository->update($domaine, [
            'valide' => true,
            'date_validation' => now(),
            'valide_par' => $userId,
        ]);

        return $this->domaineRepository->findById($domaine->id_domaine);
    }

    public function delete(Domaine $domaine): void
    {
        $this->domaineRepository->delete($domaine);
    }
}
