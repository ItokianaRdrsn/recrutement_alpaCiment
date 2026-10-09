<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Liste paginée des logs d'audit avec filtres multi-critères.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'action',
            'entite',
            'id_utilisateur',
            'date_debut',
            'date_fin',
            'q',
        ]);

        $perPage = (int) $request->input('per_page', 25);
        $logs = $this->auditLogService->getLogs($filters, $perPage);

        return response()->json([
            'data' => AuditLogResource::collection($logs),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
