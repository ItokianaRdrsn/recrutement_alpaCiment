<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Candidature\CandidatureSpontaneeRequest;
use App\Http\Requests\Candidature\ImportExternalCandidatureRequest;
use App\Http\Requests\Candidature\PostulerOffreRequest;
use App\Http\Requests\Candidature\SaisirRhCandidatureRequest;
use App\Http\Requests\Candidature\UpdateStatutRequest;
use App\Http\Requests\Candidature\UpdateVivierStatusRequest;
use App\Http\Resources\CandidatureResource;
use App\Http\Resources\StatutCandidatureResource;
use App\Services\CandidatureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidatureController extends Controller
{
    public function __construct(
        protected CandidatureService $candidatureService
    ) {}

    /**
     * Submit application for a specific published offer (Public candidate portal)
     */
    public function postulerOffre(PostulerOffreRequest $request, string $idOffre): JsonResponse
    {
        $candidature = $this->candidatureService->postulerOffre(
            $idOffre,
            $request->validated(),
            $request->file('cv') ?? $request->file('cv_file'),
            $request->file('photo')
        );

        return response()->json([
            'message' => 'Votre candidature a bien été enregistrée. Merci !',
            'data' => [
                'id_candidature' => $candidature->id_candidature,
                'candidat' => $candidature->candidat?->only(['nom', 'prenom', 'email']),
            ],
        ], 201);
    }

    /**
     * Submit spontaneous application (Public candidate portal)
     */
    public function candidatureSpontanee(CandidatureSpontaneeRequest $request): JsonResponse
    {
        $candidature = $this->candidatureService->candidatureSpontanee(
            $request->validated(),
            $request->file('cv') ?? $request->file('cv_file'),
            $request->file('photo')
        );

        return response()->json([
            'message' => 'Votre candidature spontanée a bien été enregistrée. Merci !',
            'data' => [
                'id_candidature' => $candidature->id_candidature,
                'candidat' => $candidature->candidat?->only(['nom', 'prenom', 'email']),
            ],
        ], 201);
    }

    /**
     * Import candidature from external site / email parser webhook
     */
    public function importExternalCandidature(ImportExternalCandidatureRequest $request): JsonResponse
    {
        $candidature = $this->candidatureService->importExternalCandidature(
            $request->validated(),
            $request->file('cv') ?? $request->file('cv_file')
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Candidature importée avec succès depuis la source externe.',
            'data' => [
                'id_candidature' => $candidature->id_candidature,
                'candidat' => $candidature->candidat?->only(['nom', 'prenom', 'email']),
                'source' => $candidature->canal_depot,
            ],
        ], 201);
    }

    /**
     * Saisie manuelle d'une candidature par un utilisateur RH
     */
    public function saisirRh(SaisirRhCandidatureRequest $request): JsonResponse
    {
        $candidature = $this->candidatureService->saisirRh(
            $request->validated(),
            $request->file('cv') ?? $request->file('cv_file'),
            $request->file('photo'),
            auth()->id()
        );

        return response()->json([
            'message' => 'Candidature saisie manuellement avec succès par le service RH.',
            'data' => [
                'id_candidature' => $candidature->id_candidature,
                'candidat' => $candidature->candidat?->only(['nom', 'prenom', 'email']),
            ],
        ], 201);
    }

    /**
     * List all candidatures for Back-Office RH
     */
    public function index(Request $request): JsonResponse
    {
        $candidatures = $this->candidatureService->paginate(
            $request->all(),
            (int) $request->input('per_page', 15)
        );

        return response()->json($candidatures);
    }

    /**
     * Show single candidature details for Back-Office RH
     */
    public function show(int $id): JsonResponse
    {
        $candidature = $this->candidatureService->find($id);
        $this->candidatureService->markAsViewed($id);

        return response()->json(['data' => new CandidatureResource($candidature)]);
    }

    /**
     * Marquer une candidature comme vue par le RH
     */
    public function marquerVue(int $id): JsonResponse
    {
        $candidature = $this->candidatureService->markAsViewed($id);

        return response()->json([
            'message' => 'Candidature marquée comme vue.',
            'data' => new CandidatureResource($candidature),
        ]);
    }

    /**
     * Update candidature status (RH workflow transition)
     */
    public function updateStatut(UpdateStatutRequest $request, int $id): JsonResponse
    {
        $candidature = $this->candidatureService->updateStatut(
            $id,
            (int) $request->validated('id_statut_candidature'),
            $request->validated('commentaire'),
            auth()->id()
        );

        return response()->json([
            'message' => 'Statut mis à jour avec succès.',
            'data' => new CandidatureResource($candidature),
        ]);
    }

    /**
     * Get referentiel of candidature statuses
     */
    public function statuts(): JsonResponse
    {
        $statuts = $this->candidatureService->getStatuts();
        return response()->json(['data' => StatutCandidatureResource::collection($statuts)]);
    }

    /**
     * Toggle dans_vivier boolean on candidature
     */
    public function updateVivierStatus(UpdateVivierStatusRequest $request, int $id): JsonResponse
    {
        $candidature = $this->candidatureService->updateVivierStatus($id, (bool) $request->validated('dans_vivier'));

        return response()->json([
            'message' => $candidature->dans_vivier ? 'Candidature marquée comme étant dans le vivier.' : 'Candidature retirée du vivier.',
            'data' => new CandidatureResource($candidature),
        ]);
    }

    /**
     * Rattacher une candidature (spontanée ou en vivier) à une offre d'emploi active
     */
    public function relierOffre(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'id_offre' => 'required|integer|exists:offre,id_offre',
            'commentaire' => 'nullable|string|max:500',
        ], [
            'id_offre.required' => 'Veuillez sélectionner une offre d\'emploi.',
            'id_offre.integer' => 'L\'identifiant de l\'offre est invalide.',
            'id_offre.exists' => 'L\'offre d\'emploi sélectionnée n\'existe pas ou a été supprimée.',
            'commentaire.max' => 'Le commentaire ne peut pas dépasser 500 caractères.',
        ]);

        $candidature = $this->candidatureService->relierOffre(
            $id,
            (int) $validated['id_offre'],
            $validated['commentaire'] ?? null,
            auth()->id()
        );

        return response()->json([
            'message' => 'La candidature a été reliée avec succès à l\'offre.',
            'data' => new CandidatureResource($candidature),
        ]);
    }
}
