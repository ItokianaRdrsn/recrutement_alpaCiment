<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competence;
use App\Models\TypeCompetence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompetenceController extends Controller
{
    public function index(): JsonResponse
    {
        $competences = Competence::query()
            ->with('type')
            ->orderBy('nom_competence')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id_competence,
                'nom' => $c->nom_competence,
                'id_type_competence' => $c->id_type_competence,
                'type' => $c->type?->libelle,
            ]);

        $types = TypeCompetence::query()->orderBy('libelle')->get();

        return response()->json([
            'data' => [
                'competences' => $competences,
                'types' => $types,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom_competence' => ['required', 'string', 'max:150', 'unique:competence,nom_competence'],
            'id_type_competence' => ['required', 'integer', 'exists:type_competence,id_type_competence'],
        ]);

        $competence = Competence::create($validated);

        return response()->json([
            'data' => [
                'id' => $competence->id_competence,
                'nom' => $competence->nom_competence,
                'id_type_competence' => $competence->id_type_competence,
                'type' => $competence->type?->libelle,
            ],
        ], 201);
    }
}
