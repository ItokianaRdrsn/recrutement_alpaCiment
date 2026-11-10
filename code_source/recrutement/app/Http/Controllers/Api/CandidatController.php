<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidat;
use App\Services\CandidatDoublonService;
use App\Services\DonneesPersonnellesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CandidatController extends Controller
{
    /**
     * Liste consolidée des candidats uniques (annuaire RH) avec pagination et filtres
     */
    public function index(Request $request): JsonResponse
    {
        $query = Candidat::query()
            ->withCount('candidatures')
            ->with([
                'candidatures' => function ($q) {
                    $q->with(['offre.direction', 'domaine', 'statut'])->latest();
                }
            ]);

        if ($search = $request->input('q')) {
            $search = trim($search);
            $likeOp = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $likeOp) {
                $q->where('nom', $likeOp, "%{$search}%")
                  ->orWhere('prenom', $likeOp, "%{$search}%")
                  ->orWhere('email', $likeOp, "%{$search}%")
                  ->orWhere('telephone', $likeOp, "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        $candidats = $query->orderBy('nom', 'asc')->paginate($perPage);

        return response()->json($candidats);
    }

    /**
     * Détails complets d'un candidat avec l'ensemble de ses candidatures et historiques
     */
    public function show(int $id): JsonResponse
    {
        $candidat = Candidat::with([
            'candidatures.offre.direction',
            'candidatures.domaine',
            'candidatures.statut',
            'candidatures.documents',
            'candidatures.historique.statut',
        ])->findOrFail($id);

        return response()->json(['data' => $candidat]);
    }

    /**
     * Groupes de doublons probables (téléphone / e-mail normalisés, nom + prénom).
     * Le système signale ; c'est le RH qui décide de fusionner.
     */
    public function doublons(CandidatDoublonService $service): JsonResponse
    {
        return response()->json(['data' => $service->groupes()]);
    }

    /**
     * Doublons probables d'un candidat précis.
     */
    public function doublonsDuCandidat(int $id, CandidatDoublonService $service): JsonResponse
    {
        Candidat::findOrFail($id);

        return response()->json(['data' => $service->probablesPour($id)]);
    }

    /**
     * Fusionne un doublon dans le candidat principal : {"id_doublon": 12}
     */
    public function fusionner(int $id, Request $request, CandidatDoublonService $service): JsonResponse
    {
        $data = $request->validate([
            'id_doublon' => ['required', 'integer', 'exists:candidat,id_candidat'],
        ]);

        if ((int) $data['id_doublon'] === $id) {
            return response()->json(['message' => 'Impossible de fusionner un candidat avec lui-même.'], 422);
        }

        $candidat = $service->fusionner($id, (int) $data['id_doublon']);

        return response()->json(['data' => $candidat, 'message' => 'Candidats fusionnés.']);
    }

    /**
     * Droit à l'effacement : supprime définitivement le candidat, ses candidatures et ses fichiers.
     */
    public function effacer(int $id, DonneesPersonnellesService $service): JsonResponse
    {
        $service->effacerCandidat($id);

        return response()->json(['message' => 'Données personnelles du candidat effacées.']);
    }
}
