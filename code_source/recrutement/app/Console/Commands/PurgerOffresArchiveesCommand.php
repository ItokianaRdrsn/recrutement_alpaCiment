<?php

namespace App\Console\Commands;

use App\Services\ArchiveOffresService;
use Illuminate\Console\Command;

class PurgerOffresArchiveesCommand extends Command
{
    protected $signature = 'offres:purger-archives {--dry-run : Affiche le nombre d\'offres concernées sans rien supprimer} {--mois= : Durée de conservation en mois (défaut : config recrutement.retention_offres_archivees_mois)}';

    protected $description = 'Supprime les offres archivées (clôturées) dont la durée de conservation est dépassée';

    public function handle(ArchiveOffresService $service): int
    {
        $mois = $this->option('mois') !== null ? (int) $this->option('mois') : null;
        $simulation = (bool) $this->option('dry-run');

        $nb = $service->purger($simulation, $mois);

        $this->info($simulation
            ? "{$nb} offre(s) seraient supprimée(s) (simulation)."
            : "{$nb} offre(s) archivée(s) supprimée(s).");

        return self::SUCCESS;
    }
}
