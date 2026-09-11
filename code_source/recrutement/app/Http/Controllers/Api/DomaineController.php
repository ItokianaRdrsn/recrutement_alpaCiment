<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Domaine\StoreDomaineRequest;
use App\Http\Requests\Domaine\UpdateDomaineRequest;
use App\Http\Resources\DomaineResource;
use App\Models\Domaine;
use App\Services\DomaineService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class DomaineController extends Controller
{
    public function __construct(
        protected DomaineService $domaineService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $domaines = $this->domaineService->paginate($request->all(), (int) ($request->input('per_page', 15)));
        return DomaineResource::collection($domaines);
    }

    public function store(StoreDomaineRequest $request): DomaineResource
    {
        $domaine = $this->domaineService->create(
            $request->validated(),
            (bool) ($request->validated('valide') ?? false),
            $request->user()?->id
        );

        return new DomaineResource($domaine->load(['direction:id_direction,nom_direction', 'validateur:id,name']));
    }

    public function show(Domaine $domaine): DomaineResource
    {
        return new DomaineResource($this->domaineService->find($domaine->id_domaine)->load(['direction:id_direction,nom_direction', 'validateur:id,name']));
    }

    public function update(UpdateDomaineRequest $request, Domaine $domaine): DomaineResource
    {
        $updated = $this->domaineService->update(
            $domaine,
            $request->validated(),
            $request->has('valide') ? (bool) $request->validated('valide') : null,
            $request->user()?->id
        );

        return new DomaineResource($updated->load(['direction:id_direction,nom_direction', 'validateur:id,name']));
    }

    public function validateDomain(Request $request, Domaine $domaine): DomaineResource
    {
        $validated = $this->domaineService->validateDomain($domaine, $request->user()?->id);
        return new DomaineResource($validated->load(['direction:id_direction,nom_direction', 'validateur:id,name']));
    }

    public function destroy(Domaine $domaine): Response
    {
        $this->domaineService->delete($domaine);
        return response()->noContent();
    }
}
