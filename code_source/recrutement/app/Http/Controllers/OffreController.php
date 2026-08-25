<?php

namespace App\Http\Controllers;

use App\Models\Direction;
use App\Models\Offre;
use App\Models\StatutOffre;
use Illuminate\Http\Request;
use Illuminate\View\View;

class OffreController extends Controller
{
    public function index(Request $request): View
    {
        $filters = $request->validate([
            'direction' => ['nullable', 'integer'],
            'statut' => ['nullable', 'integer'],
        ]);

        $offres = Offre::query()
            ->with(['direction', 'statut', 'typeContrat'])
            ->when($filters['direction'] ?? null, function ($query, int $direction): void {
                $query->where('id_direction', $direction);
            })
            ->when($filters['statut'] ?? null, function ($query, int $statut): void {
                $query->where('id_statut_offre', $statut);
            })
            ->orderByDesc('date_publication')
            ->orderBy('titre_poste')
            ->paginate(10)
            ->withQueryString();

        return view('offres.index', [
            'offres' => $offres,
            'directions' => Direction::query()->orderBy('nom_direction')->get(),
            'statuts' => StatutOffre::query()->orderBy('ordre_workflow')->get(),
            'filters' => $filters,
        ]);
    }
}
