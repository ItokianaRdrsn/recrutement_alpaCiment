<?php

namespace App\Services;

use App\Models\Competence;
use App\Repositories\Contracts\CompetenceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class CompetenceService
{
    public function __construct(
        protected CompetenceRepositoryInterface $competenceRepository
    ) {}

    public function getAllWithTypes(): Collection
    {
        return $this->competenceRepository->getAllWithTypes();
    }

    public function getAllTypes(): Collection
    {
        return $this->competenceRepository->getAllTypes();
    }

    public function create(array $data): Competence
    {
        return $this->competenceRepository->create($data);
    }
}
