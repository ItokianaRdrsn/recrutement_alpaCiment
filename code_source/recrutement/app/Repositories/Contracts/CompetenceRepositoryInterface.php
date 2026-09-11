<?php

namespace App\Repositories\Contracts;

use App\Models\Competence;
use Illuminate\Database\Eloquent\Collection;

interface CompetenceRepositoryInterface
{
    public function getAllWithTypes(): Collection;
    public function getAllTypes(): Collection;
    public function create(array $attributes): Competence;
    public function firstOrCreate(array $matchAttributes, array $values = []): Competence;
}
