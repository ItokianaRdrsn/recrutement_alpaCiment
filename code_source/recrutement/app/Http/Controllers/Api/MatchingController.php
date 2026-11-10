<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidature;
use App\Models\Offre;
use App\Services\MatchingService;
use Illuminate\Http\JsonResponse;

class MatchingController extends Controller
{
    public function __construct(protected MatchingService $matching) {}

    /**
     * Score détaillé d'une candidature par rapport à son offre.
     */
    public function candidature(int $id): JsonResponse
    {
        $candidature = Candidature::findOrFail($id);
        $evaluation = $this->matching->evaluer($candidature);

        if ($evaluation === null) {
            return response()->json(['message' => 'Candidature non rattachée à une offre : pas de matching.'], 422);
        }

        return response()->json(['data' => $evaluation]);
    }

    /**
     * Classement des candidatures d'une offre par score décroissant.
     */
    public function offre(int $id): JsonResponse
    {
        Offre::findOrFail($id);

        return response()->json(['data' => $this->matching->classement($id)]);
    }

    /**
     * Recalcule et enregistre le score de toutes les candidatures de l'offre.
     */
    public function recalculer(int $id): JsonResponse
    {
        Offre::findOrFail($id);
        $nb = $this->matching->recalculer($id);

        return response()->json(['message' => "{$nb} candidature(s) évaluée(s).", 'data' => ['mises_a_jour' => $nb]]);
    }
}
