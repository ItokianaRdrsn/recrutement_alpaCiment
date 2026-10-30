<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface DashboardRepositoryInterface
{
    public function getKpis(array $filters = []): array;
    public function getRecentOffers(int $limit = 5): Collection;
    public function getFunnel(array $filters = []): array;
    public function getMonthlyEvolution(array $filters = [], int $months = 6): array;
    public function getDirectionBreakdown(): array;
    public function getChannelBreakdown(array $filters = []): array;
    public function getPendingCandidatures(int $limit = 5): array;

    // Métriques avancées du tableau de bord
    public function getWorkflowDurations(array $filters = []): array;
    public function getDetailedFunnel(array $filters = []): array;
    public function getStagnantCandidatures(array $filters = [], int $days = 7, int $limit = 10): array;
    public function getUnreadBacklog(array $filters = [], int $limit = 10): array;
    public function getFirstResponseMetrics(array $filters = []): array;
    public function getChannelYield(array $filters = []): array;
    public function getOfferHealth(): array;
    public function getRecurringCandidates(int $limit = 10): array;
    public function getReactivableVivier(int $limit = 6): array;
    public function getSkillsSupplyDemand(): array;
    public function getPipelineHealth(int $days = 14): array;
    public function getComplianceAndSla(array $filters = []): array;
}
