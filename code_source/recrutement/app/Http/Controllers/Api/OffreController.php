<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Offre\StoreOffreRequest;
use App\Http\Requests\Offre\UpdateOffreRequest;
use App\Http\Resources\OffreResource;
use App\Models\Offre;
use App\Services\OffreService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class OffreController extends Controller
{
    public function __construct(
        protected OffreService $offreService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $offres = $this->offreService->paginate($request->all(), (int) $request->input('per_page', 15));
        return OffreResource::collection($offres);
    }

    public function publicIndex(Request $request): AnonymousResourceCollection
    {
        $offres = $this->offreService->paginatePublished((int) $request->input('per_page', 100));
        return OffreResource::collection($offres);
    }

    public function publicShow(string $identifier): OffreResource
    {
        $offre = $this->offreService->findPublished($identifier);
        return new OffreResource($offre);
    }

    public function store(StoreOffreRequest $request): OffreResource
    {
        $offre = $this->offreService->create($request->validated(), $request->all());
        return new OffreResource($offre);
    }

    public function show(Offre $offre): OffreResource
    {
        return new OffreResource($this->offreService->find($offre->id_offre));
    }

    public function update(UpdateOffreRequest $request, Offre $offre): OffreResource
    {
        $updated = $this->offreService->update($offre, $request->validated(), $request->all());
        return new OffreResource($updated);
    }

    public function publish(Offre $offre): OffreResource
    {
        $published = $this->offreService->publish($offre);
        return new OffreResource($published);
    }

    public function close(Offre $offre): OffreResource
    {
        $closed = $this->offreService->close($offre);
        return new OffreResource($closed);
    }

    public function destroy(Offre $offre): Response
    {
        $this->offreService->delete($offre);
        return response()->noContent();
    }
}
