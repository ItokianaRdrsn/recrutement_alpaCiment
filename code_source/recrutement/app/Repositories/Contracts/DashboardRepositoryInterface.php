<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface DashboardRepositoryInterface
{
    public function getKpis(): array;
    public function getRecentOffers(int $limit = 5): Collection;
}
