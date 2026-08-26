<?php

namespace Tests\Unit;

use App\Http\Controllers\Api\DashboardController;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    public function test_recent_offers_are_not_loaded_when_a_related_table_is_missing(): void
    {
        Schema::shouldReceive('hasTable')
            ->once()
            ->with('offre')
            ->andReturnTrue();
        Schema::shouldReceive('hasTable')
            ->once()
            ->with('direction')
            ->andReturnFalse();

        $controller = new class extends DashboardController
        {
            public function canLoadRecentOffersForTest(): bool
            {
                return $this->canLoadRecentOffers();
            }
        };

        $this->assertFalse($controller->canLoadRecentOffersForTest());
    }

    public function test_recent_offers_can_be_loaded_when_all_required_tables_exist(): void
    {
        foreach (['offre', 'direction', 'statut_offre', 'type_contrat'] as $table) {
            Schema::shouldReceive('hasTable')
                ->once()
                ->with($table)
                ->andReturnTrue();
        }

        $controller = new class extends DashboardController
        {
            public function canLoadRecentOffersForTest(): bool
            {
                return $this->canLoadRecentOffers();
            }
        };

        $this->assertTrue($controller->canLoadRecentOffersForTest());
    }
}
