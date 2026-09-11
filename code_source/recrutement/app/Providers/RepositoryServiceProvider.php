<?php

namespace App\Providers;

use App\Repositories\Contracts\CandidatRepositoryInterface;
use App\Repositories\Contracts\CandidatureRepositoryInterface;
use App\Repositories\Contracts\CompetenceRepositoryInterface;
use App\Repositories\Contracts\DashboardRepositoryInterface;
use App\Repositories\Contracts\DirectionRepositoryInterface;
use App\Repositories\Contracts\DomaineRepositoryInterface;
use App\Repositories\Contracts\OffreRepositoryInterface;
use App\Repositories\Contracts\ReferentielRepositoryInterface;
use App\Repositories\Contracts\VivierRepositoryInterface;
use App\Repositories\Eloquent\EloquentCandidatRepository;
use App\Repositories\Eloquent\EloquentCandidatureRepository;
use App\Repositories\Eloquent\EloquentCompetenceRepository;
use App\Repositories\Eloquent\EloquentDashboardRepository;
use App\Repositories\Eloquent\EloquentDirectionRepository;
use App\Repositories\Eloquent\EloquentDomaineRepository;
use App\Repositories\Eloquent\EloquentOffreRepository;
use App\Repositories\Eloquent\EloquentReferentielRepository;
use App\Repositories\Eloquent\EloquentVivierRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * All repository interface to implementation bindings.
     */
    public array $bindings = [
        CandidatRepositoryInterface::class => EloquentCandidatRepository::class,
        CandidatureRepositoryInterface::class => EloquentCandidatureRepository::class,
        OffreRepositoryInterface::class => EloquentOffreRepository::class,
        DirectionRepositoryInterface::class => EloquentDirectionRepository::class,
        DomaineRepositoryInterface::class => EloquentDomaineRepository::class,
        CompetenceRepositoryInterface::class => EloquentCompetenceRepository::class,
        VivierRepositoryInterface::class => EloquentVivierRepository::class,
        ReferentielRepositoryInterface::class => EloquentReferentielRepository::class,
        DashboardRepositoryInterface::class => EloquentDashboardRepository::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}
