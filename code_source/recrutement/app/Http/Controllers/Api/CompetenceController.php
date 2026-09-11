<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Competence\StoreCompetenceRequest;
use App\Http\Resources\CompetenceResource;
use App\Services\CompetenceService;
use Illuminate\Http\JsonResponse;

class CompetenceController extends Controller
{
    public function __construct(
        protected CompetenceService $competenceService
    ) {}

    public function index(): JsonResponse
    {
        $competences = $this->competenceService->getAllWithTypes();
        $types = $this->competenceService->getAllTypes();

        return response()->json([
            'data' => [
                'competences' => CompetenceResource::collection($competences),
                'types' => $types,
            ],
        ]);
    }

    public function store(StoreCompetenceRequest $request): JsonResponse
    {
        $competence = $this->competenceService->create($request->validated());

        return response()->json([
            'data' => new CompetenceResource($competence->load('type')),
        ], 201);
    }
}
