<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $data = $this->dashboardService->getDashboardData($request);

        return response()->json([
            'data' => $data,
        ]);
    }
}
