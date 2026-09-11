<?php

namespace App\Repositories\Contracts;

use App\Models\Candidat;

interface CandidatRepositoryInterface
{
    public function firstOrCreate(array $matchAttributes, array $values = []): Candidat;
    public function findById(int $id): ?Candidat;
}
