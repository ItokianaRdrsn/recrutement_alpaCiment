<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Repositories\Contracts\ReferentielRepositoryInterface;

class ReferentielService
{
    public function __construct(
        protected ReferentielRepositoryInterface $referentielRepository
    ) {}

    public function getAllReferentiels(): array
    {
        return [
            'directions' => $this->referentielRepository->getDirections(),
            'domaines' => $this->referentielRepository->getDomaines(),
            'statuts_offre' => $this->referentielRepository->getStatutsOffre(),
            'types_contrat' => $this->referentielRepository->getTypesContrat(),
            'lieux' => $this->referentielRepository->getLieux(),
            'niveaux' => $this->referentielRepository->getNiveaux(),
            'roles' => UserRole::toReferentiel(),
        ];
    }
}
