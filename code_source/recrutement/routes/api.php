<?php

use App\Enums\UserRole;
use App\Http\Controllers\Api\CompetenceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DirectionController;
use App\Http\Controllers\Api\DomaineController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\OffreController;
use App\Http\Controllers\Api\ReferentielController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\CandidatureController;

// Public routes for candidates
Route::get('/public/offres', [OffreController::class, 'publicIndex'])->name('api.public.offres.index');
Route::get('/public/offres/{offre}', [OffreController::class, 'publicShow'])->name('api.public.offres.show');
Route::post('/public/offres/{id}/postuler', [CandidatureController::class, 'postulerOffre'])->name('api.public.offres.postuler');
Route::post('/public/candidature-spontanee', [CandidatureController::class, 'candidatureSpontanee'])->name('api.public.candidature-spontanee');
Route::post('/public/import-candidature', [CandidatureController::class, 'importExternalCandidature'])->name('api.public.import-candidature');

// Protected Back-Office routes
Route::middleware(['web', 'auth', 'role:'.implode(',', UserRole::backOfficeValues())])->group(function (): void {
    Route::get('/csrf-token', fn () => response()->json([
        'data' => [
            'token' => csrf_token(),
        ],
    ]))->name('api.csrf-token');
    Route::get('/me', MeController::class)->name('api.me');
    Route::get('/dashboard', DashboardController::class)->name('api.dashboard');
    Route::get('/referentiels/recrutement', ReferentielController::class)->name('api.referentiels.recrutement');
    Route::get('/referentiels/statuts-candidature', [CandidatureController::class, 'statuts'])->name('api.referentiels.statuts-candidature');

    Route::get('/directions', [DirectionController::class, 'index'])->name('api.directions.index');
    Route::get('/directions/{direction}', [DirectionController::class, 'show'])->name('api.directions.show');
    Route::get('/domaines', [DomaineController::class, 'index'])->name('api.domaines.index');
    Route::get('/domaines/{domaine}', [DomaineController::class, 'show'])->name('api.domaines.show');
    Route::get('/competences', [CompetenceController::class, 'index'])->name('api.competences.index');

    Route::middleware('permission:manage_referentiels')->group(function (): void {
        Route::post('/directions', [DirectionController::class, 'store'])->name('api.directions.store');
        Route::put('/directions/{direction}', [DirectionController::class, 'update'])->name('api.directions.update');
        Route::delete('/directions/{direction}', [DirectionController::class, 'destroy'])->name('api.directions.destroy');

        Route::post('/domaines', [DomaineController::class, 'store'])->name('api.domaines.store');
        Route::put('/domaines/{domaine}', [DomaineController::class, 'update'])->name('api.domaines.update');
        Route::patch('/domaines/{domaine}/valider', [DomaineController::class, 'validateDomain'])->name('api.domaines.validate');
        Route::delete('/domaines/{domaine}', [DomaineController::class, 'destroy'])->name('api.domaines.destroy');

        Route::post('/competences', [CompetenceController::class, 'store'])->name('api.competences.store');
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

    Route::get('/candidatures', [CandidatureController::class, 'index'])->name('api.candidatures.index');
    Route::get('/candidatures/{id}', [CandidatureController::class, 'show'])->name('api.candidatures.show');
    Route::patch('/candidatures/{id}/statut', [CandidatureController::class, 'updateStatut'])->name('api.candidatures.update-statut');
    Route::post('/candidatures/{id}/extract-ocr', [\App\Http\Controllers\Api\VivierController::class, 'extractOcr'])->name('api.candidatures.extract-ocr');
    Route::post('/candidatures/{id}/validate-ocr', [\App\Http\Controllers\Api\VivierController::class, 'validateOcrData'])->name('api.candidatures.validate-ocr');

    // Vivier & Compétences Candidats
    Route::get('/vivier', [\App\Http\Controllers\Api\VivierController::class, 'index'])->name('api.vivier.index');
    Route::post('/vivier', [\App\Http\Controllers\Api\VivierController::class, 'store'])->name('api.vivier.store');
    Route::delete('/vivier/{id}', [\App\Http\Controllers\Api\VivierController::class, 'destroy'])->name('api.vivier.destroy');
    Route::get('/vivier/candidat/{idCandidat}/profile', [\App\Http\Controllers\Api\VivierController::class, 'getCandidatProfile'])->name('api.vivier.candidat-profile');
    Route::post('/vivier/candidat/{idCandidat}/competences', [\App\Http\Controllers\Api\VivierController::class, 'addCompetence'])->name('api.vivier.add-competence');
    Route::post('/vivier/candidat/{idCandidat}/experiences', [\App\Http\Controllers\Api\VivierController::class, 'addExperience'])->name('api.vivier.add-experience');
    Route::post('/vivier/candidat/{idCandidat}/formations', [\App\Http\Controllers\Api\VivierController::class, 'addFormation'])->name('api.vivier.add-formation');
});

