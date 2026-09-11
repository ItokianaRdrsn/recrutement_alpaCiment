<?php

namespace App\Repositories\Contracts;

use App\Models\Offre;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface OffreRepositoryInterface
{
    public function paginateFiltered(array $filters, int $perPage = 15): LengthAwarePaginator;
    public function paginatePublished(int $perPage = 100): LengthAwarePaginator;
    public function findById(int $id, array $relations = []): Offre;
    public function findPublishedBySlugOrId(string $identifier, array $relations = []): ?Offre;
    public function create(array $attributes): Offre;
    public function update(Offre $offre, array $attributes): bool;
    public function delete(Offre $offre): bool;
    public function syncNestedRelations(Offre $offre, array $relationsData): void;
    public function getStatusId(string $libelle): ?int;
}
