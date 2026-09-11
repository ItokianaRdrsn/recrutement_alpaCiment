<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Vivier\AddCompetenceRequest;
use App\Http\Requests\Vivier\AddExperienceRequest;
use App\Http\Requests\Vivier\AddFormationRequest;
use App\Http\Requests\Vivier\StoreVivierRequest;
use App\Http\Requests\Vivier\ValidateOcrRequest;
use App\Http\Resources\CvExtractionOcrResource;
use App\Http\Resources\VivierResource;
use App\Services\VivierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VivierController extends Controller
{
    public function __construct(
        protected VivierService $vivierService
    ) {}

    /**
     * Display Vivier listing with search, filtering by Direction, Domaine & Statut
     */
    public function index(Request $request): JsonResponse
    {
        $items = $this->vivierService->listVivier($request->all());

        return response()->json([
            'data' => VivierResource::collection($items),
        ]);
    }

    /**
     * Add candidate to Vivier
     */
    public function store(StoreVivierRequest $request): JsonResponse
    {
        $vivier = $this->vivierService->addToVivier($request->validated());

        return response()->json([
            'message' => 'Candidat ajouté au vivier avec succès.',
            'data' => new VivierResource($vivier->load(['candidat', 'direction', 'domaine'])),
        ], 201);
    }

    /**
     * Remove candidate from Vivier
     */
    public function destroy(int $id): JsonResponse
    {
        $this->vivierService->removeFromVivier($id);

        return response()->json([
            'message' => 'Candidat retiré du vivier avec succès.',
        ]);
    }

    /**
     * Get candidate profile details (Competencies, Experiences, Formations linked to Candidature)
     */
    public function getCandidatProfile(int $idCandidature): JsonResponse
    {
        $profile = $this->vivierService->getCandidatProfile($idCandidature);

        return response()->json([
            'data' => $profile,
        ]);
    }

    /**
     * Add or update candidate competence on Candidature
     */
    public function addCompetence(AddCompetenceRequest $request, int $idCandidature): JsonResponse
    {
        $this->vivierService->addCompetence(
            $idCandidature,
            (int) $request->validated('id_competence'),
            $request->validated('niveau')
        );

        return response()->json(['message' => 'Compétence candidature mise à jour.']);
    }

    /**
     * Add candidate experience on Candidature
     */
    public function addExperience(AddExperienceRequest $request, int $idCandidature): JsonResponse
    {
        $exp = $this->vivierService->addExperience($idCandidature, $request->validated());

        return response()->json(['message' => 'Expérience ajoutée.', 'data' => $exp], 201);
    }

    /**
     * Add candidate formation on Candidature
     */
    public function addFormation(AddFormationRequest $request, int $idCandidature): JsonResponse
    {
        $form = $this->vivierService->addFormation($idCandidature, $request->validated());

        return response()->json(['message' => 'Formation ajoutée.', 'data' => $form], 201);
    }

    /**
     * FastAPI / PaddleOCR Extraction endpoint & Store
     */
    public function extractOcr(int $idCandidature): JsonResponse
    {
        $extraction = $this->vivierService->extractOcr($idCandidature);

        return response()->json([
            'message' => 'Extraction OCR & IA PaddleOCR effectuée avec succès.',
            'data' => new CvExtractionOcrResource($extraction),
        ]);
    }

    /**
     * Validate, correct or reject extracted OCR CV data by RH
     */
    public function validateOcrData(ValidateOcrRequest $request, int $idCandidature): JsonResponse
    {
        $extraction = $this->vivierService->validateOcrData($idCandidature, $request->validated());

        return response()->json([
            'message' => 'Validation et enregistrement des données du CV effectués avec succès.',
            'data' => new CvExtractionOcrResource($extraction),
        ]);
    }
}
