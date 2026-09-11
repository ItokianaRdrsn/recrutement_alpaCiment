<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface ReferentielRepositoryInterface
{
    public function getDirections(): Collection;
    public function getDomaines(): Collection;
    public function getStatutsOffre(): Collection;
    public function getTypesContrat(): Collection;
    public function getLieux(): Collection;
    public function getNiveaux(): Collection;
}
