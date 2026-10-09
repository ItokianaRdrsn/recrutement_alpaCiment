<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommunicationResource;
use App\Models\Communication;
use App\Services\CommunicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommunicationController extends Controller
{
    public function __construct(
        protected CommunicationService $communicationService
    ) {}

    /**
     * Liste des communications d'une candidature.
     */
    public function indexCandidature(int $idCandidature): JsonResponse
    {
        $communications = Communication::with(['typeMessage', 'modeleMessage', 'utilisateur'])
            ->where('id_candidature', $idCandidature)
            ->orderBy('date_envoi', 'desc')
            ->get();

        return response()->json([
            'data' => CommunicationResource::collection($communications),
        ]);
    }

    /**
     * Envoi manuel d'un message à un candidat.
     */
    public function envoyer(Request $request, int $idCandidature): JsonResponse
    {
        $validated = $request->validate([
            'id_modele_message' => 'nullable|exists:modele_message,id_modele_message',
            'id_type_message' => 'nullable|exists:type_message,id_type_message',
            'objet' => 'required|string|max:255',
            'contenu' => 'required|string',
            'mode_envoi' => 'nullable|in:manuel,auto',
        ]);

        $userId = Auth::id() ?? 1;

        $communication = $this->communicationService->envoyerMessage(
            $idCandidature,
            $validated,
            $userId
        );

        $communication->load(['typeMessage', 'modeleMessage', 'utilisateur']);

        return response()->json([
            'message' => 'E-mail envoyé avec succès au candidat.',
            'data' => new CommunicationResource($communication),
        ], 201);
    }
}
