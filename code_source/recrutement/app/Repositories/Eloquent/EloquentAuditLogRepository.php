<?php

namespace App\Repositories\Eloquent;

use App\Models\AuditLog;
use App\Repositories\Contracts\AuditLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentAuditLogRepository implements AuditLogRepositoryInterface
{
    public function create(array $attributes): AuditLog
    {
        return AuditLog::create($attributes);
    }

    public function paginate(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = AuditLog::with('utilisateur')
            ->orderByDesc('created_at')
            ->orderByDesc('id_audit_log');

        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['entite'])) {
            $query->where('entite', $filters['entite']);
        }

        if (!empty($filters['id_utilisateur'])) {
            $query->where('id_utilisateur', $filters['id_utilisateur']);
        }

        if (!empty($filters['date_debut'])) {
            $query->whereDate('created_at', '>=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $query->whereDate('created_at', '<=', $filters['date_fin']);
        }

        return $query->paginate($perPage);
    }
}
