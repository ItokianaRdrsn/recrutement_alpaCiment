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
        $domaine = new Domaine($data);
        $this->applyValidationState($domaine, $validated, $userId);
        $domaine->save();

        return $this->domaineRepository->findById($domaine->id_domaine);
    }

    public function update(Domaine $domaine, array $data, ?bool $validated = null, ?int $userId = null): Domaine
    {
        $domaine->fill($data);

        if ($validated !== null) {
            $this->applyValidationState($domaine, $validated, $userId);
        }

        $domaine->save();

        return $this->domaineRepository->findById($domaine->id_domaine);
    }

    public function validateDomain(Domaine $domaine, ?int $userId): Domaine
    {
        $this->applyValidationState($domaine, true, $userId);
        $domaine->save();

        return $this->domaineRepository->findById($domaine->id_domaine);
    }

    public function delete(Domaine $domaine): void
    {
        $this->domaineRepository->delete($domaine);
    }

    protected function applyValidationState(Domaine $domaine, bool $validated, ?int $userId): void
    {
        $domaine->valide = $validated;
        $domaine->date_validation = $validated ? now() : null;
        $domaine->valide_par = $validated ? $userId : null;
    }
}
