<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Direction;
use App\Models\Domaine;
use App\Models\StatutOffre;
use App\Models\TypeContrat;
use Illuminate\Http\JsonResponse;

class ReferentielController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => [
                'directions' => Direction::query()
                    ->orderBy('nom_direction')
                    ->get(['id_direction', 'nom_direction']),
                'domaines' => Domaine::query()
                    ->with('direction:id_direction,nom_direction')
                    ->orderBy('nom_domaine')
                    ->get(['id_domaine', 'id_direction', 'nom_domaine', 'valide']),
                'statuts_offre' => StatutOffre::query()
                    ->orderBy('ordre_workflow')
                    ->get(['id_statut_offre', 'libelle', 'ordre_workflow']),
                'types_contrat' => TypeContrat::query()
                    ->orderBy('libelle')
                    ->get(['id_type_contrat', 'libelle']),
            ],
        ]);
    }
}
