<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __invoke(): View
    {
        $offresEnCours = 0;

        if (Schema::hasTable('offre') && Schema::hasTable('statut_offre')) {
            $offresEnCours = DB::table('offre')
                ->join('statut_offre', 'statut_offre.id_statut_offre', '=', 'offre.id_statut_offre')
                ->where('statut_offre.libelle', 'Publiee')
                ->count();
        }

        return view('dashboard', [
            'kpis' => [
                'candidatures_sur_offre' => 0,
                'offres_en_cours' => $offresEnCours,
                'candidatures_spontanees' => 0,
            ],
        ]);
    }
}
