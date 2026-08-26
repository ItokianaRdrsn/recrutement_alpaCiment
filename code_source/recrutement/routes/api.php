<?php

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\OffreController;
use App\Http\Controllers\Api\ReferentielController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'role:rh,admin'])->group(function (): void {
    Route::get('/me', MeController::class)->name('api.me');
    Route::get('/dashboard', DashboardController::class)->name('api.dashboard');
    Route::get('/referentiels/recrutement', ReferentielController::class)->name('api.referentiels.recrutement');
    Route::get('/offres', [OffreController::class, 'index'])->name('api.offres.index');
    Route::get('/offres/{offre}', [OffreController::class, 'show'])->name('api.offres.show');
});
