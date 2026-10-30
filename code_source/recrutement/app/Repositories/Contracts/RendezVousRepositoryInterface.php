<?php

namespace App\Repositories\Contracts;

use App\Models\HistoriqueStatut;
use App\Models\RendezVous;
use App\Models\StatutCandidature;
use App\Models\TypeRendezVous;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface RendezVousRepositoryInterface
{
    public function getReferentiels(): array;
    public function getRendezVous(array $filters = [], bool $paginate = false, int $perPage = 50): Collection|LengthAwarePaginator;
    public function findById(int $id, array $relations = []): RendezVous;
    public function create(array $attributes): RendezVous;
    public function update(RendezVous $rendezVous, array $attributes): bool;
    public function delete(RendezVous $rendezVous): bool;
    public function findTypeById(int $id): ?TypeRendezVous;
    public function findStatutCandidatureById(int $id): ?StatutCandidature;
    public function createHistoriqueStatut(array $attributes): HistoriqueStatut;
}
