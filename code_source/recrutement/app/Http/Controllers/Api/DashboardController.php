<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OffreResource;
use App\Models\Offre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $kpis = [
            'candidatures_sur_offre' => 0,
            'candidatures_spontanees' => 0,
            'offres_total' => 0,
            'offres_publiees' => 0,
            'domaines_en_attente' => 0,
        ];

        try {
            if ($this->hasTables('offre')) {
                $kpis['offres_total'] = DB::table('offre')->count();
            }
        } catch (\Throwable $e) {}

        try {
            if ($this->hasTables('offre', 'statut_offre')) {
                $kpis['offres_publiees'] = DB::table('offre')
                    ->join('statut_offre', 'statut_offre.id_statut_offre', '=', 'offre.id_statut_offre')
                    ->where('statut_offre.libelle', 'Publiee')
                    ->count();
            }
        } catch (\Throwable $e) {}

        try {
            if ($this->hasTables('domaine')) {
                $kpis['domaines_en_attente'] = DB::table('domaine')
                    ->where('valide', false)
                    ->count();
            }
        } catch (\Throwable $e) {}

        try {
            if ($this->hasTables('candidature')) {
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

        $offresRecentes = collect();
        try {
            if ($this->canLoadRecentOffers()) {
                $offresRecentes = Offre::query()
                    ->with(['direction', 'statut', 'typeContrat'])
                    ->orderByDesc('date_publication')
                    ->orderBy('titre_poste')
                    ->limit(5)
                    ->get();
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'data' => [
                'kpis' => $kpis,
                'offres_recentes' => OffreResource::collection($offresRecentes)->resolve($request),
            ],
        ]);
    }

    protected function canLoadRecentOffers(): bool
    {
        return $this->hasTables('offre', 'direction', 'statut_offre', 'type_contrat');
    }

    protected function hasTables(string ...$tables): bool
    {
        foreach ($tables as $table) {
            if (! Schema::hasTable($table)) {
                return false;
            }
        }

        return true;
    }
}
