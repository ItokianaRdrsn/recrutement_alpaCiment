<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DirectionResource;
use App\Models\Direction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class DirectionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:150'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $directions = Direction::query()
            ->withCount(['domaines', 'offres'])
            ->when($filters['q'] ?? null, fn ($query, string $search) => $query->where('nom_direction', 'like', "%{$search}%"))
            ->orderBy('nom_direction')
            ->paginate((int) ($filters['per_page'] ?? 15))
            ->withQueryString();

        return DirectionResource::collection($directions);
    }

    public function store(Request $request): DirectionResource
    {
        $data = $request->validate([
            'nom_direction' => ['required', 'string', 'max:150', 'unique:direction,nom_direction'],
        ]);

        $direction = Direction::query()->create($data);

        return new DirectionResource($direction->loadCount(['domaines', 'offres']));
    }

    public function show(Direction $direction): DirectionResource
    {
        return new DirectionResource($direction->loadCount(['domaines', 'offres']));
    }

    public function update(Request $request, Direction $direction): DirectionResource
    {
        $data = $request->validate([
            'nom_direction' => [
                'required',
                'string',
                'max:150',
                Rule::unique('direction', 'nom_direction')->ignore($direction->id_direction, 'id_direction'),
            ],
        ]);

        $direction->update($data);

        return new DirectionResource($direction->loadCount(['domaines', 'offres']));
    }

    public function destroy(Direction $direction): Response
    {
        if ($direction->domaines()->exists() || $direction->offres()->exists()) {
            abort(422, 'Impossible de supprimer une direction deja utilisee.');
        }

        $direction->delete();

        return response()->noContent();
    }
}
