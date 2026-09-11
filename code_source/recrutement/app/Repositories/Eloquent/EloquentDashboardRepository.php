<?php

namespace App\Repositories\Eloquent;

use App\Models\Offre;
use App\Repositories\Contracts\DashboardRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EloquentDashboardRepository implements DashboardRepositoryInterface
{
    public function getKpis(): array
    {
        $kpis = [
            'candidatures_sur_offre' => 0,
            'candidatures_spontanees' => 0,
            'offres_total' => 0,
            'offres_publiees' => 0,
            'domaines_en_attente' => 0,
        ];

        try {
            if (Schema::hasTable('offre')) {
                $kpis['offres_total'] = DB::table('offre')->count();
            }
        } catch (\Throwable $e) {}

        try {
            if (Schema::hasTable('offre') && Schema::hasTable('statut_offre')) {
                $kpis['offres_publiees'] = DB::table('offre')
                    ->join('statut_offre', 'statut_offre.id_statut_offre', '=', 'offre.id_statut_offre')
                    ->where('statut_offre.libelle', 'Publiee')
                    ->count();
            }
        } catch (\Throwable $e) {}

        try {
            if (Schema::hasTable('domaine')) {
                $kpis['domaines_en_attente'] = DB::table('domaine')
                    ->where('valide', false)
                    ->count();
            }
        } catch (\Throwable $e) {}

        try {
            if (Schema::hasTable('candidature')) {
                $kpis['candidatures_sur_offre'] = DB::table('candidature')
                    ->whereNotNull('id_offre')
                    ->where('id_type_demande', '!=', 2)
                    ->count();

                $kpis['candidatures_spontanees'] = DB::table('candidature')
                    ->where(function ($q) {
                        $q->whereNull('id_offre')->orWhere('id_type_demande', 2);
                    })
                    ->count();
            }
        } catch (\Throwable $e) {}

        return $kpis;
    }

    public function getRecentOffers(int $limit = 5): Collection
    {
        if (Schema::hasTable('offre') && Schema::hasTable('direction') && Schema::hasTable('statut_offre') && Schema::hasTable('type_contrat')) {
            return Offre::query()
                ->with(['direction', 'statut', 'typeContrat'])
                ->orderByDesc('date_publication')
                ->orderBy('titre_poste')
                ->limit($limit)
                ->get();
        }

        return new Collection();
    }
}
