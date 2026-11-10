<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Purge quotidienne des tokens Sanctum expirés
Schedule::command('sanctum:prune-expired --hours=0')
    ->daily()
    ->description('Nettoyer les tokens Sanctum expirés depuis la base de données');

// Durée de conservation du vivier (données personnelles) : purge mensuelle
Schedule::command('candidats:purger-vivier')
    ->monthly()
    ->description('Effacer les candidats du vivier dont la durée de conservation est dépassée');

// Archive des offres (offres clôturées) : suppression automatique après la durée de conservation
Schedule::command('offres:purger-archives')
    ->daily()
    ->description('Supprimer les offres archivées dont la durée de conservation est dépassée');
