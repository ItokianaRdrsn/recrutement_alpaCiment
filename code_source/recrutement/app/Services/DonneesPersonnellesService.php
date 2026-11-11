<?php

namespace App\Services;

use App\Models\Candidat;
use App\Models\Document;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Droit à l'effacement et durée de conservation des données des candidats.
 */
class DonneesPersonnellesService
{
    /** Libellés de statut « Retenue » : ces candidats ne sont jamais purgés automatiquement. */
    private const STATUTS_RETENUS = ['Retenue', 'Retenu', 'retenue', 'retenu'];

    public function __construct(protected AuditLogService $auditLogService) {}

    /**
     * Efface définitivement un candidat : fichiers physiques (CV, photo, annexes) puis fiche.
     * Les candidatures, documents, expériences, formations, etc. sont supprimés en cascade (BD).
     * L'audit ne garde que l'identifiant, jamais de donnée personnelle.
     */
    public function effacerCandidat(int $idCandidat, string $motif = 'Demande du candidat'): void
    {
        DB::transaction(function () use ($idCandidat, $motif) {
            $candidat = Candidat::findOrFail($idCandidat);

            $chemins = Document::query()
                ->whereIn('id_candidature', $candidat->candidatures()->pluck('id_candidature'))
                ->pluck('chemin_fichier')
                ->filter()
                ->all();

            $nbCandidatures = $candidat->candidatures()->count();
            $candidat->delete();

            $disk = Storage::disk(DocumentService::DISK);
            foreach ($chemins as $chemin) {
                $disk->delete($chemin);
            }

            $this->auditLogService->log(
                'EFFACEMENT',
                'candidat',
                $idCandidat,
                "Effacement des données personnelles ({$motif}) : {$nbCandidatures} candidature(s), " . count($chemins) . ' fichier(s).'
            );
        });
    }

    /**
     * Identifiants des candidats éligibles à la purge : toutes leurs candidatures sont plus
     * anciennes que la durée de conservation, au moins une est en vivier, aucune n'est « Retenue ».
     *
     * @return list<int>
     */
    public function candidatsAPurger(?int $moisRetention = null): array
    {
        $mois = $moisRetention ?? (int) config('recrutement.retention_vivier_mois', 24);
        $limite = now()->subMonths($mois);

        return Candidat::query()
            ->whereHas('candidatures', fn ($q) => $q->where('dans_vivier', true))
            ->whereDoesntHave('candidatures', fn ($q) => $q->where('created_at', '>=', $limite))
            ->whereDoesntHave('candidatures.statut', fn ($q) => $q->whereIn('libelle', self::STATUTS_RETENUS))
            ->pluck('id_candidat')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * @return int nombre de candidats effacés (ou éligibles si $simulation)
     */
    public function purgerVivier(bool $simulation = false, ?int $moisRetention = null): int
    {
        $ids = $this->candidatsAPurger($moisRetention);

        if (! $simulation) {
            foreach ($ids as $id) {
                $this->effacerCandidat($id, 'Durée de conservation du vivier dépassée');
            }
        }

        return count($ids);
    }
}
