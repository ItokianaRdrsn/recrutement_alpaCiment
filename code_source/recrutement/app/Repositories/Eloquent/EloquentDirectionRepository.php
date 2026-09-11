<?php

namespace App\Repositories\Eloquent;

use App\Models\Direction;
use App\Repositories\Contracts\DirectionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class EloquentDirectionRepository implements DirectionRepositoryInterface
{
    public function paginateFiltered(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return Direction::query()
            ->withCount(['domaines', 'offres'])
            ->when($filters['q'] ?? null, fn ($query, string $search) => $query->where('nom_direction', 'like', "%{$search}%"))
            ->orderBy('nom_direction')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function all(): Collection
    {
        return Direction::orderBy('nom_direction')->get();
    }

    public function findById(int $id): Direction
    {
        return Direction::findOrFail($id);
    }

    public function create(array $attributes): Direction
    {
        return Direction::create($attributes);
    }

    public function update(Direction $direction, array $attributes): bool
    {
        return $direction->update($attributes);
    }

    public function delete(Direction $direction): bool
    {
        return $direction->delete();
    }

    public function isUsed(Direction $direction): bool
    {
        return $direction->domaines()->exists() || $direction->offres()->exists();
    }
}
