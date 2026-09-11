<?php

namespace App\Repositories\Eloquent;

use App\Models\Domaine;
use App\Repositories\Contracts\DomaineRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class EloquentDomaineRepository implements DomaineRepositoryInterface
{
    public function paginateFiltered(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return Domaine::query()
            ->with(['direction:id_direction,nom_direction', 'validateur:id,name'])
            ->when($filters['direction'] ?? null, fn ($query, int $direction) => $query->where('id_direction', $direction))
            ->when(array_key_exists('valide', $filters), fn ($query) => $query->where('valide', (bool) $filters['valide']))
            ->when($filters['q'] ?? null, fn ($query, string $search) => $query->where('nom_domaine', 'like', "%{$search}%"))
            ->orderBy('valide')
            ->orderBy('nom_domaine')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function all(): Collection
    {
        return Domaine::with('direction:id_direction,nom_direction')->orderBy('nom_domaine')->get();
    }

    public function findById(int $id): Domaine
    {
        return Domaine::findOrFail($id);
    }

    public function firstOrCreate(array $matchAttributes, array $values = []): Domaine
    {
        return Domaine::firstOrCreate($matchAttributes, $values);
    }

    public function create(array $attributes): Domaine
    {
        return Domaine::create($attributes);
    }

    public function update(Domaine $domaine, array $attributes): bool
    {
        return $domaine->update($attributes);
    }

    public function delete(Domaine $domaine): bool
    {
        return $domaine->delete();
    }
}
