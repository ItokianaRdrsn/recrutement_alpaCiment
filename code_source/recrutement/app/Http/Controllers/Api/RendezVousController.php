<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RendezVousResource;
use App\Models\RendezVous;
use App\Services\RendezVousService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class RendezVousController extends Controller
{
    public function __construct(
        protected RendezVousService $rendezVousService
    ) {}

    /**
     * Référentiels pour le formulaire de planification.
     */
    public function referentiels(): JsonResponse
    {
        return response()->json([
            'data' => $this->rendezVousService->getReferentiels(),
        ]);
    }

    /**
     * Liste des rendez-vous avec filtres calendaires (Mois, Semaine, Candidature, etc.).
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'date_debut',
            'date_fin',
            'id_candidature',
            'id_utilisateur',
            'id_type_rendez_vous',
            'id_statut_rendez_vous',
            'id_mode_realisation',
        ]);

        $rendezVous = $this->rendezVousService->getRendezVous($filters, paginate: false);

        return response()->json([
            'data' => RendezVousResource::collection($rendezVous),
        ]);
    }

    /**
     * Planifier un rendez-vous (Test ou Entretien).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_candidature' => 'required|integer|exists:candidature,id_candidature',
            'id_utilisateur' => 'nullable|integer|exists:utilisateur,id_utilisateur',
            'id_type_rendez_vous' => 'required|integer|exists:type_rendez_vous,id_type_rendez_vous',
            'id_statut_rendez_vous' => 'nullable|integer|exists:statut_rendez_vous,id_statut_rendez_vous',
            'id_mode_realisation' => 'required|integer|exists:mode_realisation,id_mode_realisation',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'details_lieu' => 'nullable|string|max:500',
            'commentaire' => 'nullable|string|max:2000',
            'id_statut_candidature_cible' => 'nullable|integer|exists:statut_candidature,id_statut_candidature',
        ]);

        try {
            $rdv = $this->rendezVousService->planifier($validated);

            return response()->json([
                'message' => 'Rendez-vous planifié avec succès.',
                'data' => new RendezVousResource($rdv),
            ], 201);
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['date_fin' => $e->getMessage()]);
        }
    }

    /**
     * Détails d'un rendez-vous.
     */
    public function show(RendezVous $rendezVous): JsonResponse
    {
        $rendezVous->load([
            'candidature.candidat',
            'candidature.offre',
            'utilisateur',
            'typeRendezVous',
            'statutRendezVous',
            'modeRealisation',
        ]);

        return response()->json([
            'data' => new RendezVousResource($rendezVous),
        ]);
    }

    /**
     * Modifier un rendez-vous (reprogrammation date/heure, statut, lieu).
     */
    public function update(Request $request, RendezVous $rendezVous): JsonResponse
    {
        $validated = $request->validate([
            'id_utilisateur' => 'nullable|integer|exists:utilisateur,id_utilisateur',
            'id_type_rendez_vous' => 'nullable|integer|exists:type_rendez_vous,id_type_rendez_vous',
            'id_statut_rendez_vous' => 'nullable|integer|exists:statut_rendez_vous,id_statut_rendez_vous',
            'id_mode_realisation' => 'nullable|integer|exists:mode_realisation,id_mode_realisation',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'details_lieu' => 'nullable|string|max:500',
            'commentaire' => 'nullable|string|max:2000',
        ]);

        try {
            $rdv = $this->rendezVousService->modifier($rendezVous, $validated);

            return response()->json([
                'message' => 'Rendez-vous mis à jour avec succès.',
                'data' => new RendezVousResource($rdv),
            ]);
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['date_fin' => $e->getMessage()]);
        }
    }

    /**
     * Annuler un rendez-vous (changement statut vers Annulé).
     */
    public function cancel(Request $request, RendezVous $rendezVous): JsonResponse
    {
        $motif = $request->input('motif');
        $rdv = $this->rendezVousService->annuler($rendezVous, $motif);

        return response()->json([
            'message' => 'Rendez-vous annulé.',
            'data' => new RendezVousResource($rdv),
        ]);
    }

    /**
     * Suppression définitive.
     */
    public function destroy(RendezVous $rendezVous): JsonResponse
    {
        $this->rendezVousService->supprimer($rendezVous);

        return response()->json([
            'message' => 'Rendez-vous supprimé avec succès.',
        ]);
    }
}
