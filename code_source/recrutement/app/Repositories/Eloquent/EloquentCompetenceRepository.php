<?php

namespace App\Repositories\Eloquent;

use App\Models\Competence;
use App\Models\TypeCompetence;
use App\Repositories\Contracts\CompetenceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentCompetenceRepository implements CompetenceRepositoryInterface
{
    public function getAllWithTypes(): Collection
    {
        return Competence::with('type')->orderBy('nom_competence')->get();
    }

    public function getAllTypes(): Collection
    {
        return TypeCompetence::orderBy('libelle')->get();
    }

    public function create(array $attributes): Competence
    {
        return Competence::create($attributes);
    }

    public function firstOrCreate(array $matchAttributes, array $values = []): Competence
    {
        return Competence::firstOrCreate($matchAttributes, $values);
    }
}
