<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Direction\StoreDirectionRequest;
use App\Http\Requests\Direction\UpdateDirectionRequest;
use App\Http\Resources\DirectionResource;
use App\Models\Direction;
use App\Services\DirectionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class DirectionController extends Controller
{
    public function __construct(
        protected DirectionService $directionService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $directions = $this->directionService->paginate($request->all(), (int) $request->input('per_page', 15));
        return DirectionResource::collection($directions);
    }

    public function store(StoreDirectionRequest $request): DirectionResource
    {
        $direction = $this->directionService->create($request->validated());
        return new DirectionResource($direction->loadCount(['domaines', 'offres']));
    }

    public function show(Direction $direction): DirectionResource
    {
        return new DirectionResource($this->directionService->find($direction->id_direction)->loadCount(['domaines', 'offres']));
    }

    public function update(UpdateDirectionRequest $request, Direction $direction): DirectionResource
    {
        $updated = $this->directionService->update($direction, $request->validated());
        return new DirectionResource($updated->loadCount(['domaines', 'offres']));
    }

    public function destroy(Direction $direction): Response
    {
        $this->directionService->delete($direction);
        return response()->noContent();
    }
}
