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

        if (Schema::hasTable('offre')) {
            $kpis['offres_total'] = DB::table('offre')->count();
        }

        if (Schema::hasTable('offre') && Schema::hasTable('statut_offre')) {
            $kpis['offres_publiees'] = DB::table('offre')
                ->join('statut_offre', 'statut_offre.id_statut_offre', '=', 'offre.id_statut_offre')
                ->where('statut_offre.libelle', 'Publiee')
                ->count();
        }

        if (Schema::hasTable('domaine')) {
            $kpis['domaines_en_attente'] = DB::table('domaine')
                ->where('valide', false)
                ->count();
        }

        $offresRecentes = Schema::hasTable('offre')
            ? Offre::query()
                ->with(['direction', 'statut', 'typeContrat'])
                ->orderByDesc('date_publication')
                ->orderBy('titre_poste')
                ->limit(5)
                ->get()
            : collect();

        return response()->json([
            'data' => [
                'kpis' => $kpis,
                'offres_recentes' => OffreResource::collection($offresRecentes)->resolve($request),
            ],
        ]);
    }
}
