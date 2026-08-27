<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DomaineResource;
use App\Models\Domaine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class DomaineController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'direction' => ['nullable', 'integer', 'exists:direction,id_direction'],
            'valide' => ['nullable', 'boolean'],
            'q' => ['nullable', 'string', 'max:150'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $domaines = Domaine::query()
            ->with(['direction:id_direction,nom_direction', 'validateur:id,name'])
            ->when($filters['direction'] ?? null, fn ($query, int $direction) => $query->where('id_direction', $direction))
            ->when(array_key_exists('valide', $filters), fn ($query) => $query->where('valide', (bool) $filters['valide']))
            ->when($filters['q'] ?? null, fn ($query, string $search) => $query->where('nom_domaine', 'like', "%{$search}%"))
            ->orderBy('valide')
            ->orderBy('nom_domaine')
            ->paginate((int) ($filters['per_page'] ?? 15))
            ->withQueryString();

        return DomaineResource::collection($domaines);
    }

    public function store(Request $request): DomaineResource
    {
        $data = $request->validate([
            'nom_domaine' => ['required', 'string', 'max:150', 'unique:domaine,nom_domaine'],
            'id_direction' => ['required', 'integer', 'exists:direction,id_direction'],
            'valide' => ['sometimes', 'boolean'],
        ]);

        $domaine = new Domaine($data);
        $this->applyValidationState($domaine, (bool) ($data['valide'] ?? false), $request);
        $domaine->save();

        return new DomaineResource($domaine->load(['direction:id_direction,nom_direction', 'validateur:id,name']));
    }

    public function show(Domaine $domaine): DomaineResource
    {
        return new DomaineResource($domaine->load(['direction:id_direction,nom_direction', 'validateur:id,name']));
    }

    public function update(Request $request, Domaine $domaine): DomaineResource
    {
        $data = $request->validate([
            'nom_domaine' => [
                'required',
                'string',
                'max:150',
                Rule::unique('domaine', 'nom_domaine')->ignore($domaine->id_domaine, 'id_domaine'),
            ],
            'id_direction' => ['required', 'integer', 'exists:direction,id_direction'],
            'valide' => ['sometimes', 'boolean'],
        ]);

        $domaine->fill($data);

        if (array_key_exists('valide', $data)) {
            $this->applyValidationState($domaine, (bool) $data['valide'], $request);
        }

        $domaine->save();

        return new DomaineResource($domaine->load(['direction:id_direction,nom_direction', 'validateur:id,name']));
    }

    public function validateDomain(Request $request, Domaine $domaine): DomaineResource
    {
        $this->applyValidationState($domaine, true, $request);
        $domaine->save();

        return new DomaineResource($domaine->load(['direction:id_direction,nom_direction', 'validateur:id,name']));
    }

    public function destroy(Domaine $domaine): Response
    {
        $domaine->delete();

        return response()->noContent();
    }

    private function applyValidationState(Domaine $domaine, bool $validated, Request $request): void
    {
        $domaine->valide = $validated;
        $domaine->date_validation = $validated ? now() : null;
        $domaine->valide_par = $validated ? $request->user()->id : null;
    }
}
