<?php

namespace App\Repositories\Contracts;

use App\Models\Candidature;
use App\Models\Document;
use App\Models\HistoriqueStatut;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface CandidatureRepositoryInterface
{
    public function paginateFiltered(array $filters, int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id, array $relations = []): Candidature;
    public function create(array $attributes): Candidature;
    public function update(Candidature $candidature, array $attributes): bool;
    public function markAsViewed(Candidature $candidature): bool;
    public function createHistorique(array $attributes): HistoriqueStatut;
    public function createDocument(array $attributes): Document;
    public function getStatusIdByLibelle(array $libelles): ?int;
    public function getTypeDemandeIdByLibelle(string $libelle): ?int;
    public function getStatuts(): Collection;
}
