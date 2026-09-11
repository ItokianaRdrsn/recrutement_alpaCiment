<?php

namespace App\Repositories\Contracts;

use App\Models\Direction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface DirectionRepositoryInterface
{
    public function paginateFiltered(array $filters, int $perPage = 15): LengthAwarePaginator;
    public function all(): Collection;
    public function findById(int $id): Direction;
    public function create(array $attributes): Direction;
    public function update(Direction $direction, array $attributes): bool;
    public function delete(Direction $direction): bool;
    public function isUsed(Direction $direction): bool;
}
