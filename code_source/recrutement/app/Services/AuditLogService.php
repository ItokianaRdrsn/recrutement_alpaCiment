<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    /**
     * Enregistre un événement d'audit dans la table audit_log.
     *
     * @param string $action CREATION, MODIFICATION, SUPPRESSION, CHANGEMENT_STATUT, VALIDATION_OCR, etc.
     * @param string $entite Offre, Candidature, Domaine, Direction, etc.
     * @param int|string|null $idEntite
     * @param string|null $description
     * @param array|null $anciennesValeurs
     * @param array|null $nouvellesValeurs
     * @param int|null $idUtilisateur Si null, prend l'utilisateur connecté s'il existe
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

        // Récupération de l'IP et du User-Agent de la requête courante si disponible
        $ip = Request::ip();
        $userAgent = Request::header('User-Agent');

        return AuditLog::create([
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
     * Récupère la liste paginée ou filtrée des logs d'audit pour le back-office RH.
     */
    public function getLogs(array $filters = [], int $perPage = 20)
    {
        $query = AuditLog::with('utilisateur')
            ->orderByDesc('created_at')
            ->orderByDesc('id_audit_log');

        if (!empty($filters['action'])) {
            $query->where('action', strtoupper($filters['action']));
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

        if (!empty($filters['q'])) {
            $q = trim($filters['q']);
            $query->where(function ($sub) use ($q) {
                $sub->where('description', 'ilike', "%{$q}%")
                    ->orWhere('action', 'ilike', "%{$q}%")
                    ->orWhere('entite', 'ilike', "%{$q}%");
            });
        }

        return $query->paginate($perPage);
    }
}
