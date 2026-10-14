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
}
