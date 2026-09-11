<?php

namespace App\Repositories\Eloquent;

use App\Models\Direction;
use App\Models\Domaine;
use App\Models\Lieu;
use App\Models\Niveau;
use App\Models\StatutOffre;
use App\Models\TypeContrat;
use App\Repositories\Contracts\ReferentielRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentReferentielRepository implements ReferentielRepositoryInterface
{
    public function getDirections(): Collection
    {
        return Direction::orderBy('nom_direction')->get(['id_direction', 'nom_direction']);
    }

    public function getDomaines(): Collection
    {
        return Domaine::with('direction:id_direction,nom_direction')
            ->orderBy('nom_domaine')
            ->get(['id_domaine', 'id_direction', 'nom_domaine', 'valide']);
    }

    public function getStatutsOffre(): Collection
    {
        return StatutOffre::orderBy('ordre_workflow')
            ->get(['id_statut_offre', 'libelle', 'ordre_workflow']);
    }

    public function getTypesContrat(): Collection
    {
        return TypeContrat::orderBy('libelle')->get(['id_type_contrat', 'libelle']);
    }

    public function getLieux(): Collection
    {
        return Lieu::orderBy('libelle')->get(['id_lieu', 'libelle']);
    }

    public function getNiveaux(): Collection
    {
        return Niveau::orderBy('id_niveau')->get(['id_niveau', 'libelle']);
    }
}
