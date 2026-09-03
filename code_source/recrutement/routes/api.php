<?php

use App\Enums\UserRole;
use App\Http\Controllers\Api\CompetenceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DirectionController;
use App\Http\Controllers\Api\DomaineController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\OffreController;
use App\Http\Controllers\Api\ReferentielController;
use App\Http\Controllers\Api\CandidatureController;
use App\Http\Controllers\Api\VivierController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Plateforme Recrutement AlpA Ciment
|--------------------------------------------------------------------------
| Convention RESTful :
|  - Pluriel (/offres, /candidatures, /directions) pour les collections/listes.
|  - Singulier (/offre/{id}, /candidature/{id}, /direction/{id}) pour les ressources uniques.
|--------------------------------------------------------------------------
*/

// Public routes for candidates
Route::get('/public/offres', [OffreController::class, 'publicIndex'])->name('api.public.offres.index');
Route::get('/public/offre/{offre}', [OffreController::class, 'publicShow'])->name('api.public.offre.show');
Route::get('/public/offres/{offre}', [OffreController::class, 'publicShow']); // Alias

Route::post('/public/offre/{id}/postuler', [CandidatureController::class, 'postulerOffre'])->name('api.public.offre.postuler');
Route::post('/public/offres/{id}/postuler', [CandidatureController::class, 'postulerOffre']); // Alias

Route::post('/public/candidature/spontanee', [CandidatureController::class, 'candidatureSpontanee'])->name('api.public.candidature.spontanee');
Route::post('/public/candidature-spontanee', [CandidatureController::class, 'candidatureSpontanee']); // Alias
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
    
    Route::get('/lieux', [\App\Http\Controllers\Api\LieuController::class, 'index'])->name('api.lieux.index');
    Route::get('/niveaux', [\App\Http\Controllers\Api\NiveauController::class, 'index'])->name('api.niveaux.index');

    // --- DIRECTIONS ---
    Route::get('/directions', [DirectionController::class, 'index'])->name('api.directions.index');
    Route::get('/direction/{direction}', [DirectionController::class, 'show'])->name('api.direction.show');
    Route::get('/directions/{direction}', [DirectionController::class, 'show']); // Alias

    // --- DOMAINES ---
    Route::get('/domaines', [DomaineController::class, 'index'])->name('api.domaines.index');
    Route::get('/domaine/{domaine}', [DomaineController::class, 'show'])->name('api.domaine.show');
    Route::get('/domaines/{domaine}', [DomaineController::class, 'show']); // Alias

    // --- COMPETENCES ---
    Route::get('/competences', [CompetenceController::class, 'index'])->name('api.competences.index');
    Route::get('/competence/{competence}', [CompetenceController::class, 'show'])->name('api.competence.show');

    // --- ADMINISTRATION REFERENTIELS ---
    Route::middleware('permission:manage_referentiels')->group(function (): void {
        Route::post('/directions', [DirectionController::class, 'store'])->name('api.directions.store');
        Route::put('/direction/{direction}', [DirectionController::class, 'update'])->name('api.direction.update');
        Route::put('/directions/{direction}', [DirectionController::class, 'update']); // Alias
        Route::delete('/direction/{direction}', [DirectionController::class, 'destroy'])->name('api.direction.destroy');
        Route::delete('/directions/{direction}', [DirectionController::class, 'destroy']); // Alias

        Route::post('/domaines', [DomaineController::class, 'store'])->name('api.domaines.store');
        Route::put('/domaine/{domaine}', [DomaineController::class, 'update'])->name('api.domaine.update');
        Route::put('/domaines/{domaine}', [DomaineController::class, 'update']); // Alias
        Route::patch('/domaine/{domaine}/valider', [DomaineController::class, 'validateDomain'])->name('api.domaine.validate');
        Route::patch('/domaines/{domaine}/valider', [DomaineController::class, 'validateDomain']); // Alias
        Route::delete('/domaine/{domaine}', [DomaineController::class, 'destroy'])->name('api.domaine.destroy');
        Route::delete('/domaines/{domaine}', [DomaineController::class, 'destroy']); // Alias

        Route::post('/competences', [CompetenceController::class, 'store'])->name('api.competences.store');
    });

    // --- OFFRES D'EMPLOI ---
    Route::get('/offres', [OffreController::class, 'index'])->name('api.offres.index');
    Route::get('/offre/{offre}', [OffreController::class, 'show'])->name('api.offre.show');
    Route::get('/offres/{offre}', [OffreController::class, 'show']); // Alias

    Route::middleware('permission:manage_offres')->group(function (): void {
        Route::post('/offres', [OffreController::class, 'store'])->name('api.offres.store');
        Route::put('/offre/{offre}', [OffreController::class, 'update'])->name('api.offre.update');
        Route::put('/offres/{offre}', [OffreController::class, 'update']); // Alias
        Route::patch('/offre/{offre}/publier', [OffreController::class, 'publish'])->name('api.offre.publish');
        Route::patch('/offres/{offre}/publier', [OffreController::class, 'publish']); // Alias
        Route::patch('/offre/{offre}/cloturer', [OffreController::class, 'close'])->name('api.offre.close');
        Route::patch('/offres/{offre}/cloturer', [OffreController::class, 'close']); // Alias
        Route::delete('/offre/{offre}', [OffreController::class, 'destroy'])->name('api.offre.destroy');
        Route::delete('/offres/{offre}', [OffreController::class, 'destroy']); // Alias
    });

    // --- CANDIDATURES ---
    Route::get('/candidatures', [CandidatureController::class, 'index'])->name('api.candidatures.index');
    Route::post('/candidatures/saisir-rh', [CandidatureController::class, 'saisirRh'])->name('api.candidatures.saisir-rh');
    
    // Singular Candidature routes
    Route::get('/candidature/{id}', [CandidatureController::class, 'show'])->name('api.candidature.show');
    Route::get('/candidatures/{id}', [CandidatureController::class, 'show']); // Alias

    Route::patch('/candidature/{id}/marquer-vue', [CandidatureController::class, 'marquerVue'])->name('api.candidature.marquer-vue');
    Route::patch('/candidatures/{id}/marquer-vue', [CandidatureController::class, 'marquerVue']); // Alias

    Route::patch('/candidature/{id}/statut', [CandidatureController::class, 'updateStatut'])->name('api.candidature.update-statut');
    Route::patch('/candidatures/{id}/statut', [CandidatureController::class, 'updateStatut']); // Alias

    Route::patch('/candidature/{id}/vivier', [CandidatureController::class, 'updateVivierStatus'])->name('api.candidature.update-vivier');
    Route::patch('/candidatures/{id}/vivier', [CandidatureController::class, 'updateVivierStatus']); // Alias

    // OCR & Profile routes for candidature
    Route::post('/candidature/{id}/ocr/extract', [VivierController::class, 'extractOcr'])->name('api.candidature.ocr.extract');
    Route::post('/candidatures/{id}/extract-ocr', [VivierController::class, 'extractOcr']); // Alias

    Route::post('/candidature/{id}/ocr/validate', [VivierController::class, 'validateOcrData'])->name('api.candidature.ocr.validate');
    Route::post('/candidatures/{id}/validate-ocr', [VivierController::class, 'validateOcrData']); // Alias

    Route::get('/candidature/{idCandidature}/profile', [VivierController::class, 'getCandidatProfile'])->name('api.candidature.profile');
    Route::get('/candidatures/{idCandidature}/profile', [VivierController::class, 'getCandidatProfile']); // Alias

    Route::post('/candidature/{idCandidature}/competences', [VivierController::class, 'addCompetence'])->name('api.candidature.add-competence');
    Route::post('/candidatures/{idCandidature}/competences', [VivierController::class, 'addCompetence']); // Alias

    Route::post('/candidature/{idCandidature}/experiences', [VivierController::class, 'addExperience'])->name('api.candidature.add-experience');
    Route::post('/candidatures/{idCandidature}/experiences', [VivierController::class, 'addExperience']); // Alias

    Route::post('/candidature/{idCandidature}/formations', [VivierController::class, 'addFormation'])->name('api.candidature.add-formation');
    Route::post('/candidatures/{idCandidature}/formations', [VivierController::class, 'addFormation']); // Alias

    // --- VIVIER RH ---
    Route::get('/vivier', [VivierController::class, 'index'])->name('api.vivier.index');
    Route::post('/vivier', [VivierController::class, 'store'])->name('api.vivier.store');
    Route::delete('/vivier/{id}', [VivierController::class, 'destroy'])->name('api.vivier.destroy');
});
