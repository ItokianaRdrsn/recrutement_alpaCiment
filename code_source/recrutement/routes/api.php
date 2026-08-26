<?php

use App\Enums\UserRole;
use App\Http\Controllers\Api\DashboardController;
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
    Route::get('/offres', [OffreController::class, 'index'])->name('api.offres.index');
    Route::get('/offres/{offre}', [OffreController::class, 'show'])->name('api.offres.show');
});
