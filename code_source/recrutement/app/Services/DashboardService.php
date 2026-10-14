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
        $filters = [
            'direction_id' => $request->filled('direction_id') ? (int) $request->input('direction_id') : null,
            'periode' => $request->input('periode', 'all'),
            'date_debut' => $request->input('date_debut'),
            'date_fin' => $request->input('date_fin'),
        ];

        $kpis = $this->dashboardRepository->getKpis($filters);
        $funnel = $this->dashboardRepository->getFunnel($filters);
        $evolution = $this->dashboardRepository->getMonthlyEvolution($filters, 6);
        $directions = $this->dashboardRepository->getDirectionBreakdown();
        $canaux = $this->dashboardRepository->getChannelBreakdown($filters);
        $pending = $this->dashboardRepository->getPendingCandidatures(5);
        $offresRecentes = $this->dashboardRepository->getRecentOffers(5);

        return [
            'kpis' => $kpis,
            'entonnoir' => $funnel,
            'evolution_mensuelle' => $evolution,
            'repartition_directions' => $directions,
            'repartition_canaux' => $canaux,
            'candidatures_a_traiter' => $pending,
            'offres_recentes' => OffreResource::collection($offresRecentes)->resolve($request),
        ];
    }
}
