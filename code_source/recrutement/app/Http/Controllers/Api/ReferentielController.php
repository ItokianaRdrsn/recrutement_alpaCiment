<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReferentielService;
use Illuminate\Http\JsonResponse;

class ReferentielController extends Controller
{
    public function __construct(
        protected ReferentielService $referentielService
    ) {}

    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => $this->referentielService->getAllReferentiels(),
        ]);
    }
}
