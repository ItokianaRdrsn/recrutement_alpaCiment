<?php

namespace App\Services;

use App\Models\Offre;
use Illuminate\Support\Facades\DB;

/**
 * Archive = offres clôturées. Elles sont supprimées automatiquement une fois la durée de conservation
 * dépassée (config recrutement.retention_offres_archivees_mois, 12 mois par défaut).
 *
 * Les candidatures liées ne sont jamais supprimées : elles sont détachées de l'offre (id_offre = null)
 * et restent consultables avec leur candidat.
 */
class ArchiveOffresService
{
    public function __construct(protected AuditLogService $auditLogService) {}

    public function offresAPurger(?int $mois = null): \Illuminate\Database\Eloquent\Collection
    {
        $mois ??= (int) config('recrutement.retention_offres_archivees_mois', 12);
        $limite = now()->subMonths(max(1, $mois));

        $clotureeId = DB::table('statut_offre')->where('libelle', 'Cloturee')->value('id_statut_offre');
        if (!$clotureeId) {
            return new \Illuminate\Database\Eloquent\Collection();
        }

        return Offre::query()
            ->where('id_statut_offre', $clotureeId)
            ->whereNotNull('date_cloture')
            ->where('date_cloture', '<', $limite)
            ->get();
    }

    public function purger(bool $simulation = false, ?int $mois = null): int
    {
        $offres = $this->offresAPurger($mois);

        if ($simulation) {
            return $offres->count();
        }

        foreach ($offres as $offre) {
            DB::transaction(function () use ($offre): void {
                $detachees = DB::table('candidature')
                    ->where('id_offre', $offre->id_offre)
                    ->update(['id_offre' => null]);

                $infos = [
                    'id_offre' => $offre->id_offre,
                    'reference' => $offre->reference,
                    'titre_poste' => $offre->titre_poste,
                    'date_cloture' => $offre->date_cloture?->toDateString(),
                    'candidatures_detachees' => $detachees,
                ];

                $offre->delete();

                $this->auditLogService->log(
                    action: 'PURGE_OFFRE_ARCHIVEE',
                    entite: 'Offre',
                    idEntite: $infos['id_offre'],
                    description: "Suppression automatique de l'offre archivée : {$infos['titre_poste']} ({$infos['reference']})",
                    anciennesValeurs: $infos,
                    nouvellesValeurs: null
                );
            });
        }

        return $offres->count();
    }
}
