<?php

namespace App\Console\Commands;

use App\Services\DonneesPersonnellesService;
use Illuminate\Console\Command;

class PurgerVivierCommand extends Command
{
    protected $signature = 'candidats:purger-vivier {--dry-run : Affiche le nombre de candidats concernés sans rien effacer} {--mois= : Durée de conservation en mois (défaut : config recrutement.retention_vivier_mois)}';

    protected $description = 'Efface les candidats du vivier dont la durée de conservation est dépassée (hors candidats retenus)';

    public function handle(DonneesPersonnellesService $service): int
    {
        $mois = $this->option('mois') !== null ? (int) $this->option('mois') : null;
        $simulation = (bool) $this->option('dry-run');

        $nb = $service->purgerVivier($simulation, $mois);

        $this->info($simulation
            ? "{$nb} candidat(s) seraient effacé(s) (simulation)."
            : "{$nb} candidat(s) effacé(s).");

        return self::SUCCESS;
    }
}
