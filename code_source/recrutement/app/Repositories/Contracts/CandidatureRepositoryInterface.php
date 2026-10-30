<?php

namespace App\Repositories\Contracts;

use App\Enums\StatutCandidatureEnum;
use App\Enums\TypeDemandeEnum;
use App\Models\Candidature;
use App\Models\Document;
use App\Models\HistoriqueStatut;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface CandidatureRepositoryInterface
{
    public function paginateFiltered(array $filters, int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id, array $relations = []): Candidature;
    public function findByIdForUpdate(int $id, array $relations = []): Candidature;
    public function findByCleIdempotence(string $cle, array $relations = []): ?Candidature;
    public function create(array $attributes): Candidature;
    public function update(Candidature $candidature, array $attributes): bool;
    public function markAsViewed(Candidature $candidature): bool;
    public function createHistorique(array $attributes): HistoriqueStatut;
    public function createDocument(array $attributes): Document;
    public function getStatusIdByLibelle(array|string|StatutCandidatureEnum $libelles): ?int;
    public function findStatutById(int $id): ?\App\Models\StatutCandidature;
    public function getTypeDemandeIdByLibelle(string|TypeDemandeEnum $libelle): ?int;
    public function getStatuts(): Collection;
}
