<?php

namespace App\Repositories\Contracts;

use App\Models\Domaine;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface DomaineRepositoryInterface
{
    public function paginateFiltered(array $filters, int $perPage = 15): LengthAwarePaginator;
    public function all(): Collection;
    public function findById(int $id): Domaine;
    public function firstOrCreate(array $matchAttributes, array $values = []): Domaine;
    public function create(array $attributes): Domaine;
    public function update(Domaine $domaine, array $attributes): bool;
    public function delete(Domaine $domaine): bool;
}
