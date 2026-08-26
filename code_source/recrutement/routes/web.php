<?php

use App\Http\Controllers\Auth\SessionController;
use App\Enums\UserRole;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OffreController;
use Illuminate\Support\Facades\Route;

Route::get('/', [SessionController::class, 'create'])->name('home');
Route::get('/login', [SessionController::class, 'create'])->name('login');
Route::post('/login', [SessionController::class, 'store'])->name('login.store');
Route::post('/logout', [SessionController::class, 'destroy'])->middleware('auth')->name('logout');

Route::middleware(['auth', 'role:'.implode(',', UserRole::backOfficeValues())])->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/offres', [OffreController::class, 'index'])->name('offres.index');
    Route::get('/referentiels', fn () => redirect()->away(rtrim((string) config('app.frontend_url'), '/').'/referentiels'))
        ->name('referentiels.index');
});
