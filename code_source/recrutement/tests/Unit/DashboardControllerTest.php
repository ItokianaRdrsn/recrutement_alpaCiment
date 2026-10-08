<?php

namespace Tests\Unit;

use App\Http\Controllers\Api\DashboardController;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    public function test_dashboard_controller_returns_service_data(): void
    {
        $service = $this->createMock(DashboardService::class);
        $service->expects($this->once())
            ->method('getDashboardData')
            ->willReturn([
                'kpis' => [
                    'candidatures_sur_offre' => 5,
                    'candidatures_spontanees' => 2,
                    'offres_total' => 10,
                    'offres_publiees' => 7,
                    'domaines_en_attente' => 1,
                ],
                'offres_recentes' => [],
            ]);

        $controller = new DashboardController($service);
        $response = $controller(new Request());

        $this->assertEquals(200, $response->getStatusCode());
        $data = $response->getData(true);
        $this->assertEquals(5, $data['data']['kpis']['candidatures_sur_offre']);
    }
}
