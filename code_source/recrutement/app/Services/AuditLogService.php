<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Repositories\Contracts\AuditLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    public function __construct(
        protected AuditLogRepositoryInterface $auditLogRepository
    ) {}

    /**
     * Enregistre un événement d'audit dans la table audit_log via le repository.
     */
    public function log(
        string $action,
        string $entite,
        int|string|null $idEntite = null,
        ?string $description = null,
        ?array $anciennesValeurs = null,
        ?array $nouvellesValeurs = null,
        ?int $idUtilisateur = null
    ): AuditLog {
        $userId = $idUtilisateur ?? Auth::id();

        $ip = Request::ip();
        $userAgent = Request::header('User-Agent');

        return $this->auditLogRepository->create([
            'id_utilisateur' => $userId,
            'action' => strtoupper($action),
            'entite' => $entite,
            'id_entite' => $idEntite ? (int) $idEntite : null,
            'description' => $description,
            'anciennes_valeurs' => $anciennesValeurs,
            'nouvelles_valeurs' => $nouvellesValeurs,
            'ip_adresse' => $ip,
            'user_agent' => $userAgent ? substr($userAgent, 0, 500) : null,
            'created_at' => now(),
        ]);
    }

    /**
     * Récupère la liste paginée des logs d'audit pour le back-office RH.
     */
    public function getLogs(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->auditLogRepository->paginate($filters, $perPage);
    }
}
