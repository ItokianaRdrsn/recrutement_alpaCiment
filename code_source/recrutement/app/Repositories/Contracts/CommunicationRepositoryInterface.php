<?php

namespace App\Repositories\Contracts;

use App\Models\Communication;
use App\Models\ModeleMessage;
use Illuminate\Database\Eloquent\Collection;

interface CommunicationRepositoryInterface
{
    public function create(array $attributes): Communication;
    public function findModeleById(int $id): ?ModeleMessage;
    public function findModeleByTypeMessage(int $idTypeMessage): ?ModeleMessage;
    public function findModeleConvocation(?int $statutCible = null): ?ModeleMessage;
    public function findModeleAccuseReception(): ?ModeleMessage;
    public function getByCandidature(int $idCandidature): Collection;
}
