<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Competence\StoreCompetenceRequest;
use App\Http\Resources\CompetenceResource;
use App\Models\Competence;
use App\Support\CompetenceMatcher;
use Illuminate\Http\Request;
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

    /**
     * Recherche, pour une liste de compétences extraites d'un CV, celles qui existent déjà au référentiel.
     * Un seul appel par CV (utilisé par le NER). Aucune donnée personnelle, aucune création.
     *
     * Entrée : {"noms": ["python", "Node JS"]}
     * Sortie : {"data": [{"recherche": "python", "existe": true, "competence": "Python", "methode": "exact"}, ...]}
     */
    public function rapprocher(Request $request): JsonResponse
    {
        $data = $request->validate([
            'noms' => ['required', 'array', 'min:1', 'max:100'],
            'noms.*' => ['required', 'string', 'max:150'],
        ]);

        $index = CompetenceMatcher::indexer(Competence::query()->pluck('nom_competence')->all());

        $lignes = array_map(function (string $nom) use ($index) {
            $trouve = CompetenceMatcher::trouver($nom, $index);

            return [
                'recherche' => $nom,
                'existe' => $trouve !== null,
                'competence' => $trouve['nom'] ?? null,
                'methode' => $trouve['methode'] ?? 'aucune',
            ];
        }, $data['noms']);

        return response()->json(['data' => $lignes]);
    }

    public function store(StoreCompetenceRequest $request): JsonResponse
    {
        $competence = $this->competenceService->create($request->validated());

        return response()->json([
            'data' => new CompetenceResource($competence->load('type')),
        ], 201);
    }
}
