<?php

namespace App\Repositories\Eloquent;

use App\Models\Candidat;
use App\Repositories\Contracts\CandidatRepositoryInterface;

class EloquentCandidatRepository implements CandidatRepositoryInterface
{
    public function firstOrCreate(array $matchAttributes, array $values = []): Candidat
    {
        return Candidat::firstOrCreate($matchAttributes, $values);
    }

    public function findById(int $id): ?Candidat
    {
        return Candidat::find($id);
    }
}
