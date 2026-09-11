<?php

namespace App\Services;

use App\Http\Resources\OffreResource;
use App\Repositories\Contracts\DashboardRepositoryInterface;
use Illuminate\Http\Request;

class DashboardService
{
    public function __construct(
        protected DashboardRepositoryInterface $dashboardRepository
    ) {}

    public function getDashboardData(Request $request): array
    {
        $kpis = $this->dashboardRepository->getKpis();
        $offresRecentes = $this->dashboardRepository->getRecentOffers(5);

        return [
            'kpis' => $kpis,
            'offres_recentes' => OffreResource::collection($offresRecentes)->resolve($request),
        ];
    }
}
