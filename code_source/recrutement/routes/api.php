<?php

use App\Enums\UserRole;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DirectionController;
use App\Http\Controllers\Api\DomaineController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\OffreController;
use App\Http\Controllers\Api\ReferentielController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'role:'.implode(',', UserRole::backOfficeValues())])->group(function (): void {
    Route::get('/csrf-token', fn () => response()->json([
        'data' => [
            'token' => csrf_token(),
        ],
    ]))->name('api.csrf-token');
    Route::get('/me', MeController::class)->name('api.me');
    Route::get('/dashboard', DashboardController::class)->name('api.dashboard');
    Route::get('/referentiels/recrutement', ReferentielController::class)->name('api.referentiels.recrutement');

    Route::get('/directions', [DirectionController::class, 'index'])->name('api.directions.index');
    Route::get('/directions/{direction}', [DirectionController::class, 'show'])->name('api.directions.show');
    Route::get('/domaines', [DomaineController::class, 'index'])->name('api.domaines.index');
    Route::get('/domaines/{domaine}', [DomaineController::class, 'show'])->name('api.domaines.show');

    Route::middleware('permission:manage_referentiels')->group(function (): void {
        Route::post('/directions', [DirectionController::class, 'store'])->name('api.directions.store');
        Route::put('/directions/{direction}', [DirectionController::class, 'update'])->name('api.directions.update');
        Route::delete('/directions/{direction}', [DirectionController::class, 'destroy'])->name('api.directions.destroy');

        Route::post('/domaines', [DomaineController::class, 'store'])->name('api.domaines.store');
        Route::put('/domaines/{domaine}', [DomaineController::class, 'update'])->name('api.domaines.update');
        Route::patch('/domaines/{domaine}/valider', [DomaineController::class, 'validateDomain'])->name('api.domaines.validate');
        Route::delete('/domaines/{domaine}', [DomaineController::class, 'destroy'])->name('api.domaines.destroy');
    });

    Route::get('/offres', [OffreController::class, 'index'])->name('api.offres.index');
    Route::get('/offres/{offre}', [OffreController::class, 'show'])->name('api.offres.show');

    Route::middleware('permission:manage_offres')->group(function (): void {
        Route::post('/offres', [OffreController::class, 'store'])->name('api.offres.store');
        Route::put('/offres/{offre}', [OffreController::class, 'update'])->name('api.offres.update');
        Route::patch('/offres/{offre}/publier', [OffreController::class, 'publish'])->name('api.offres.publish');
        Route::patch('/offres/{offre}/cloturer', [OffreController::class, 'close'])->name('api.offres.close');
        Route::delete('/offres/{offre}', [OffreController::class, 'destroy'])->name('api.offres.destroy');
    });
});
