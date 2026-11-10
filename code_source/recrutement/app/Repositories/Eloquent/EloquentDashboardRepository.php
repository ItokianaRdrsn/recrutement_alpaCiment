<?php

namespace App\Repositories\Eloquent;

use App\Models\Candidature;
use App\Models\Direction;
use App\Models\Offre;
use App\Models\StatutCandidature;
use App\Repositories\Contracts\DashboardRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EloquentDashboardRepository implements DashboardRepositoryInterface
{
    /**
     * Applique les filtres de date, direction et offre sur une requête de candidature.
     */
    protected function applyCandidatureFilters($query, array $filters)
    {
        if (!empty($filters['direction_id'])) {
            $directionId = (int) $filters['direction_id'];
            $query->where(function ($q) use ($directionId) {
                $q->whereHas('offre', function ($sub) use ($directionId) {
                    $sub->where('id_direction', $directionId);
                })->orWhereHas('domaine', function ($sub) use ($directionId) {
                    $sub->where('id_direction', $directionId);
                });
            });
        }

        if (!empty($filters['offre_id'])) {
            $query->where('candidature.id_offre', (int) $filters['offre_id']);
        }

        if (!empty($filters['canal'])) {
            $canal = $filters['canal'];
            if ($canal === 'rh_manuel') {
                $query->where('candidature.canal_depot', 'rh_manuel');
            } elseif ($canal === 'email_n8n') {
                $query->where(function ($q) {
                    $q->where('candidature.cle_idempotence', 'LIKE', '%@%')
                      ->orWhere('candidature.cle_idempotence', 'LIKE', 'msg-%')
                      ->orWhere('candidature.cle_idempotence', 'LIKE', '<%');
                });
            } elseif ($canal === 'site_externe') {
                $query->where(function ($q) {
                    $q->where('candidature.canal_depot', '!=', 'rh_manuel')
                      ->orWhereNull('candidature.canal_depot');
                })->where(function ($q) {
                    $q->whereNull('candidature.cle_idempotence')
                      ->orWhere(function ($sub) {
                          $sub->where('candidature.cle_idempotence', 'NOT LIKE', '%@%')
                              ->where('candidature.cle_idempotence', 'NOT LIKE', 'msg-%')
                              ->where('candidature.cle_idempotence', 'NOT LIKE', '<%');
                      });
                });
            }
        }

        // Si des dates directes (date_debut ou date_fin) sont fournies
        if (!empty($filters['date_debut']) || !empty($filters['date_fin'])) {
            if (!empty($filters['date_debut'])) {
                $query->where('candidature.created_at', '>=', Carbon::parse($filters['date_debut'])->startOfDay());
            }
            if (!empty($filters['date_fin'])) {
                $query->where('candidature.created_at', '<=', Carbon::parse($filters['date_fin'])->endOfDay());
            }
            return $query;
        }

        $periode = $filters['periode'] ?? 'all';
        $now = Carbon::now();

        switch ($periode) {
            case 'this_month':
                $query->where('candidature.created_at', '>=', $now->copy()->startOfMonth());
                break;
            case 'last_month':
                $query->whereBetween('candidature.created_at', [
                    $now->copy()->subMonth()->startOfMonth(),
                    $now->copy()->subMonth()->endOfMonth(),
                ]);
                break;
            case '30_days':
                $query->where('candidature.created_at', '>=', $now->copy()->subDays(30));
                break;
            case 'this_year':
                $query->where('candidature.created_at', '>=', $now->copy()->startOfYear());
                break;
            case 'custom':
                if (!empty($filters['date_debut'])) {
                    $query->where('candidature.created_at', '>=', Carbon::parse($filters['date_debut'])->startOfDay());
                }
                if (!empty($filters['date_fin'])) {
                    $query->where('candidature.created_at', '<=', Carbon::parse($filters['date_fin'])->endOfDay());
                }
                break;
        }

        return $query;
    }

    public function getKpis(array $filters = []): array
    {
        $kpis = [
            'total_candidatures' => 0,
            'candidatures_sur_offre' => 0,
            'candidatures_spontanees' => 0,
            'candidatures_en_vivier' => 0,
            'offres_total' => 0,
            'offres_publiees' => 0,
            'domaines_en_attente' => 0,
            'rdv_a_venir' => 0,
            'taux_recrutement' => 0.0,
            'delai_moyen_jours' => 0.0,
            'delai_median_jours' => 0.0,
            'candidatures_non_lues' => 0,
            'dossiers_stagnants_count' => 0,
            'delta_candidatures_pct' => 0.0,
            'delta_recrutement_pct' => 0.0,
        ];

        // 1. Offres
        try {
            if (Schema::hasTable('offre')) {
                $offreQuery = DB::table('offre');
                if (!empty($filters['direction_id'])) {
                    $offreQuery->where('id_direction', (int) $filters['direction_id']);
                }
                $kpis['offres_total'] = $offreQuery->count();

                if (Schema::hasTable('statut_offre')) {
                    $publieeQuery = DB::table('offre')
                        ->join('statut_offre', 'statut_offre.id_statut_offre', '=', 'offre.id_statut_offre')
                        ->where('statut_offre.libelle', 'Publiee');
                    if (!empty($filters['direction_id'])) {
                        $publieeQuery->where('offre.id_direction', (int) $filters['direction_id']);
                    }
                    $kpis['offres_publiees'] = $publieeQuery->count();
                }
            }
        } catch (\Throwable $e) {}

        // 2. Domaines en attente
        try {
            if (Schema::hasTable('domaine')) {
                $domaineQuery = DB::table('domaine')->where('valide', false);
                if (!empty($filters['direction_id'])) {
                    $domaineQuery->where('id_direction', (int) $filters['direction_id']);
                }
                $kpis['domaines_en_attente'] = $domaineQuery->count();
            }
        } catch (\Throwable $e) {}

        // 3. Rendez-vous à venir
        try {
            if (Schema::hasTable('rendez_vous')) {
                $rdvQuery = DB::table('rendez_vous')
                    ->where('date_debut', '>=', Carbon::now());

                if (Schema::hasTable('statut_rendez_vous')) {
                    $rdvQuery->leftJoin('statut_rendez_vous', 'statut_rendez_vous.id_statut_rendez_vous', '=', 'rendez_vous.id_statut_rendez_vous')
                        ->where(function ($q) {
                            $q->whereNull('statut_rendez_vous.libelle')
                              ->orWhere('statut_rendez_vous.libelle', '!=', 'Annulé');
                        });
                }
                $kpis['rdv_a_venir'] = $rdvQuery->count();
            }
        } catch (\Throwable $e) {}

        // 4. Candidatures & Délais
        try {
            if (Schema::hasTable('candidature')) {
                $baseCandidatures = Candidature::query();
                $this->applyCandidatureFilters($baseCandidatures, $filters);

                $kpis['total_candidatures'] = (clone $baseCandidatures)->count();

                $kpis['candidatures_sur_offre'] = (clone $baseCandidatures)
                    ->whereNotNull('id_offre')
                    ->where('id_type_demande', '!=', 2)
                    ->count();

                $kpis['candidatures_spontanees'] = (clone $baseCandidatures)
                    ->where(function ($q) {
                        $q->whereNull('id_offre')->orWhere('id_type_demande', 2);
                    })
                    ->count();

                $kpis['candidatures_en_vivier'] = (clone $baseCandidatures)
                    ->where('dans_vivier', true)
                    ->count();

                $kpis['candidatures_non_lues'] = (clone $baseCandidatures)
                    ->where(function ($q) {
                        $q->where('vue', false)->orWhereNull('vue');
                    })
                    ->count();

                // Taux de recrutement et Délai moyen/médian
                $finalisees = (clone $baseCandidatures)
                    ->with('statut')
                    ->whereHas('statut', function ($q) {
                        $q->whereIn('libelle', ['Retenue', 'Retenu', 'Non retenue', 'Non retenu'])
                          ->orWhere('ordre_workflow', '>=', 50);
                    })
                    ->get();

                $totalFinalisees = $finalisees->count();
                $retenuesCount = $finalisees->filter(function ($c) {
                    $libelle = strtolower($c->statut?->libelle ?? '');
                    return str_contains($libelle, 'retenu') && !str_contains($libelle, 'non');
                })->count();

                if ($totalFinalisees > 0) {
                    $kpis['taux_recrutement'] = round(($retenuesCount / $totalFinalisees) * 100, 1);
                } elseif ($kpis['total_candidatures'] > 0) {
                    $kpis['taux_recrutement'] = round(($retenuesCount / $kpis['total_candidatures']) * 100, 1);
                }

                // Délai moyen & médian de recrutement (jours)
                if ($totalFinalisees > 0) {
                    $delais = [];
                    foreach ($finalisees as $c) {
                        if ($c->created_at && $c->updated_at) {
                            $jours = Carbon::parse($c->created_at)->diffInDays(Carbon::parse($c->updated_at));
                            $delais[] = max(0, $jours);
                        }
                    }
                    if (count($delais) > 0) {
                        $kpis['delai_moyen_jours'] = round(array_sum($delais) / count($delais), 1);
                        sort($delais);
                        $middle = (int) floor(count($delais) / 2);
                        $kpis['delai_median_jours'] = round($delais[$middle], 1);
                    }
                }

                // Dossiers stagnants (> 7 jours sans mouvement)
                $septJours = Carbon::now()->subDays(7);
                $kpis['dossiers_stagnants_count'] = (clone $baseCandidatures)
                    ->where('updated_at', '<', $septJours)
                    ->whereHas('statut', function ($q) {
                        $q->whereNotIn('libelle', ['Retenue', 'Retenu', 'Non retenue', 'Non retenu', 'Rejeté', 'Rejetee', 'Classe sans suite'])
                          ->where('ordre_workflow', '<', 50);
                    })
                    ->count();

                // Calcul du delta de volume vs période précédente
                $now = Carbon::now();
                $periode = $filters['periode'] ?? 'all';
                $prevDebut = null;
                $prevFin = null;

                if ($periode === 'this_month') {
                    $prevDebut = $now->copy()->subMonth()->startOfMonth();
                    $prevFin = $now->copy()->subMonth()->endOfMonth();
                } elseif ($periode === '30_days') {
                    $prevDebut = $now->copy()->subDays(60);
                    $prevFin = $now->copy()->subDays(30);
                }

                if ($prevDebut && $prevFin) {
                    $prevTotal = Candidature::whereBetween('created_at', [$prevDebut, $prevFin])->count();
                    if ($prevTotal > 0) {
                        $diff = $kpis['total_candidatures'] - $prevTotal;
                        $kpis['delta_candidatures_pct'] = round(($diff / $prevTotal) * 100, 1);
                    }
                }
            }
        } catch (\Throwable $e) {}

        return $kpis;
    }

    public function getFunnel(array $filters = []): array
    {
        return $this->getDetailedFunnel($filters);
    }

    /**
     * Entonnoir de conversion détaillé avec taux de passage et drop-off
     */
    public function getDetailedFunnel(array $filters = []): array
    {
        $funnel = [];
        try {
            if (Schema::hasTable('statut_candidature') && Schema::hasTable('candidature')) {
                $statuts = StatutCandidature::orderBy('ordre_workflow', 'asc')->get();

                $query = Candidature::query();
                $this->applyCandidatureFilters($query, $filters);
                $totalInitial = (clone $query)->count();

                // Comptage par statut actuel
                $countsByStatus = (clone $query)
                    ->select('id_statut_candidature', DB::raw('count(*) as total'))
                    ->groupBy('id_statut_candidature')
                    ->pluck('total', 'id_statut_candidature')
                    ->toArray();

                $previousCount = $totalInitial;

                foreach ($statuts as $index => $st) {
                    // Pour chaque statut dans l'ordre, calcul du nombre de dossiers
                    $count = $countsByStatus[$st->id_statut_candidature] ?? 0;
                    
                    // Taux de passage depuis l'étape précédente
                    $tauxPassage = $previousCount > 0 ? round(($count / $previousCount) * 100, 1) : 0.0;
                    if ($index === 0) {
                        $tauxPassage = 100.0;
                    }
                    $perte = max(0, $previousCount - $count);
                    $tauxPerte = $previousCount > 0 ? round(($perte / $previousCount) * 100, 1) : 0.0;
                    $tauxGlobal = $totalInitial > 0 ? round(($count / $totalInitial) * 100, 1) : 0.0;

                    $funnel[] = [
                        'id_statut' => $st->id_statut_candidature,
                        'libelle' => $st->libelle,
                        'ordre' => $st->ordre_workflow,
                        'count' => $count,
                        'pourcentage' => $tauxGlobal,
                        'taux_passage' => $tauxPassage,
                        'perte' => $perte,
                        'taux_perte' => $tauxPerte,
                    ];

                    // Pour l'étape suivante, on compare avec le volume de l'étape courante
                    if ($count > 0) {
                        $previousCount = $count;
                    }
                }
            }
        } catch (\Throwable $e) {}

        return $funnel;
    }

    /**
     * 1. Durée médiane (P50) et P90 par étape du workflow calculée sur l'historique des statuts via LAG()
     */
    public function getWorkflowDurations(array $filters = []): array
    {
        $durations = [];

        try {
            if (!Schema::hasTable('historique_statut') || !Schema::hasTable('statut_candidature') || !Schema::hasTable('candidature')) {
                return [];
            }

            $isPgsql = DB::connection()->getDriverName() === 'pgsql';

            if ($isPgsql) {
                $directionClause = '';
                if (!empty($filters['direction_id'])) {
                    $dId = (int) $filters['direction_id'];
                    $directionClause = "AND (o.id_direction = {$dId} OR dom.id_direction = {$dId})";
                }

                $sql = "
                    WITH transitions AS (
                        SELECT 
                            h.id_candidature,
                            h.id_statut_candidature,
                            s.libelle as statut_libelle,
                            s.ordre_workflow,
                            h.date_changement,
                            LAG(h.date_changement) OVER (
                                PARTITION BY h.id_candidature 
                                ORDER BY h.date_changement ASC, h.id_historique ASC
                            ) as date_precedente
                        FROM historique_statut h
                        JOIN statut_candidature s ON s.id_statut_candidature = h.id_statut_candidature
                        JOIN candidature c ON c.id_candidature = h.id_candidature
                        LEFT JOIN offre o ON o.id_offre = c.id_offre
                        LEFT JOIN domaine dom ON dom.id_domaine = c.id_domaine
                        WHERE 1=1 {$directionClause}
                    ),
                    calculs AS (
                        SELECT 
                            id_statut_candidature,
                            statut_libelle,
                            ordre_workflow,
                            GREATEST(0.01, EXTRACT(EPOCH FROM (date_changement - date_precedente)) / 86400.0) as duree_jours
                        FROM transitions
                        WHERE date_precedente IS NOT NULL
                    )
                    SELECT 
                        id_statut_candidature,
                        statut_libelle,
                        ordre_workflow,
                        COUNT(*) as total_transitions,
                        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duree_jours)::numeric, 1) as median_jours,
                        ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY duree_jours)::numeric, 1) as p90_jours,
                        ROUND(AVG(duree_jours)::numeric, 1) as moyenne_jours,
                        ROUND(MIN(duree_jours)::numeric, 1) as min_jours,
                        ROUND(MAX(duree_jours)::numeric, 1) as max_jours
                    FROM calculs
                    GROUP BY id_statut_candidature, statut_libelle, ordre_workflow
                    ORDER BY ordre_workflow ASC
                ";

                $rows = DB::select($sql);

                foreach ($rows as $row) {
                    $durations[] = [
                        'id_statut' => (int) $row->id_statut_candidature,
                        'statut_libelle' => $row->statut_libelle,
                        'ordre' => (int) $row->ordre_workflow,
                        'total_transitions' => (int) $row->total_transitions,
                        'median_jours' => (float) ($row->median_jours ?? 0),
                        'p90_jours' => (float) ($row->p90_jours ?? 0),
                        'moyenne_jours' => (float) ($row->moyenne_jours ?? 0),
                        'min_jours' => (float) ($row->min_jours ?? 0),
                        'max_jours' => (float) ($row->max_jours ?? 0),
                        'alerte_goulot' => ((float) ($row->p90_jours ?? 0) > 10.0),
                    ];
                }
            }

            // Fallback PHP si la base est vide de transitions ou non-pgsql
            if (empty($durations)) {
                $statuts = StatutCandidature::orderBy('ordre_workflow', 'asc')->get();
                foreach ($statuts as $st) {
                    $durations[] = [
                        'id_statut' => $st->id_statut_candidature,
                        'statut_libelle' => $st->libelle,
                        'ordre' => $st->ordre_workflow,
                        'total_transitions' => 0,
                        'median_jours' => 0.0,
                        'p90_jours' => 0.0,
                        'moyenne_jours' => 0.0,
                        'min_jours' => 0.0,
                        'max_jours' => 0.0,
                        'alerte_goulot' => false,
                    ];
                }
            }
        } catch (\Throwable $e) {}

        return $durations;
    }

    /**
     * 1. Dossiers stagnants : candidatures sans mouvement depuis N jours (liste cliquable)
     */
    public function getStagnantCandidatures(array $filters = [], int $days = 7, int $limit = 10): array
    {
        $result = [
            'seuil_jours' => $days,
            'total_stagnants' => 0,
            'par_statut' => [],
            'liste' => [],
        ];

        try {
            if (!Schema::hasTable('candidature') || !Schema::hasTable('statut_candidature')) {
                return $result;
            }

            $dateLimite = Carbon::now()->subDays($days);

            $query = Candidature::query()
                ->with(['candidat', 'offre.direction', 'domaine.direction', 'statut'])
                ->whereHas('statut', function ($q) {
                    $q->whereNotIn('libelle', [
                        'Retenue', 'Retenu', 'Non retenue', 'Non retenu', 'Rejeté', 'Rejetee', 'Classe sans suite'
                    ])->where('ordre_workflow', '<', 50);
                })
                ->where('updated_at', '<', $dateLimite);

            $this->applyCandidatureFilters($query, $filters);

            $result['total_stagnants'] = (clone $query)->count();

            // Répartition par statut
            $parStatut = (clone $query)
                ->select('id_statut_candidature', DB::raw('count(*) as total'))
                ->groupBy('id_statut_candidature')
                ->get();

            foreach ($parStatut as $ps) {
                $statutModel = StatutCandidature::find($ps->id_statut_candidature);
                if ($statutModel) {
                    $result['par_statut'][] = [
                        'statut' => $statutModel->libelle,
                        'count' => (int) $ps->total,
                    ];
                }
            }

            // Liste ordonnée par nombre de jours de stagnation décroissant
            $candidatures = $query
                ->orderBy('updated_at', 'asc')
                ->limit($limit)
                ->get();

            foreach ($candidatures as $c) {
                $nom = $c->candidat ? trim("{$c->candidat->nom} {$c->candidat->prenom}") : 'Candidat inconnu';
                $intitule = $c->offre?->titre_poste ?: ($c->poste_souhaite ?: ($c->domaine?->nom_domaine ?: 'Candidature spontanée'));
                $direction = $c->offre?->direction?->nom_direction ?: ($c->domaine?->direction?->nom_direction ?: 'Générale');
                $joursSansMouvement = $c->updated_at ? Carbon::parse($c->updated_at)->diffInDays(Carbon::now()) : 0;

                $result['liste'][] = [
                    'id_candidature' => $c->id_candidature,
                    'id_offre' => $c->id_offre,
                    'nom_complet' => $nom,
                    'email' => $c->candidat?->email ?? '-',
                    'telephone' => $c->candidat?->telephone ?? '-',
                    'intitule' => $intitule,
                    'direction' => $direction,
                    'statut' => $c->statut?->libelle ?? 'En attente',
                    'jours_stagnation' => (int) $joursSansMouvement,
                    'date_dernier_mouvement' => $c->updated_at ? Carbon::parse($c->updated_at)->toIso8601String() : null,
                ];
            }
        } catch (\Throwable $e) {}

        return $result;
    }

    /**
     * 1. Backlog non consulté : candidatures jamais ouvertes (vue = false) et leur âge
     */
    public function getUnreadBacklog(array $filters = [], int $limit = 10): array
    {
        $result = [
            'total_non_consulte' => 0,
            'pourcentage_total' => 0.0,
            'tranches_age' => [
                'moins_48h' => 0,
                'entre_2_et_7j' => 0,
                'plus_7j' => 0,
            ],
            'liste' => [],
        ];

        try {
            if (!Schema::hasTable('candidature')) {
                return $result;
            }

            $query = Candidature::query()
                ->where(function ($q) {
                    $q->where('vue', false)->orWhereNull('vue');
                });

            $this->applyCandidatureFilters($query, $filters);
            $totalActive = Candidature::count();
            $result['total_non_consulte'] = (clone $query)->count();
            if ($totalActive > 0) {
                $result['pourcentage_total'] = round(($result['total_non_consulte'] / $totalActive) * 100, 1);
            }

            $now = Carbon::now();
            $items = (clone $query)->get(['id_candidature', 'created_at']);

            foreach ($items as $item) {
                if (!$item->created_at) continue;
                $heures = Carbon::parse($item->created_at)->diffInHours($now);
                if ($heures < 48) {
                    $result['tranches_age']['moins_48h']++;
                } elseif ($heures <= 168) { // 7 jours
                    $result['tranches_age']['entre_2_et_7j']++;
                } else {
                    $result['tranches_age']['plus_7j']++;
                }
            }

            // Liste des dossiers non consultés prioritaires (les plus anciens d'abord)
            $listeItems = (clone $query)
                ->with(['candidat', 'offre.direction', 'domaine'])
                ->orderBy('created_at', 'asc')
                ->limit($limit)
                ->get();

            foreach ($listeItems as $c) {
                $nom = $c->candidat ? trim("{$c->candidat->nom} {$c->candidat->prenom}") : 'Candidat';
                $intitule = $c->offre?->titre_poste ?: ($c->poste_souhaite ?: ($c->domaine?->nom_domaine ?: 'Spontanée'));
                $heuresAttente = $c->created_at ? Carbon::parse($c->created_at)->diffInHours($now) : 0;
                $joursAttente = (int) floor($heuresAttente / 24);

                $result['liste'][] = [
                    'id_candidature' => $c->id_candidature,
                    'id_offre' => $c->id_offre,
                    'nom_complet' => $nom,
                    'intitule' => $intitule,
                    'direction' => $c->offre?->direction?->nom_direction ?? 'Générale',
                    'canal_depot' => $c->canal_depot ?? 'site_externe',
                    'heures_attente' => (int) $heuresAttente,
                    'jours_attente' => $joursAttente,
                    'gravite' => $joursAttente >= 7 ? 'critique' : ($joursAttente >= 2 ? 'alerte' : 'normal'),
                    'date_reception' => $c->created_at ? Carbon::parse($c->created_at)->toIso8601String() : null,
                ];
            }
        } catch (\Throwable $e) {}

        return $result;
    }

    /**
     * 1. Délai de première réponse entre réception et première communication sortante
     */
    public function getFirstResponseMetrics(array $filters = []): array
    {
        $metrics = [
            'total_repondues' => 0,
            'en_attente_reponse' => 0,
            'delai_median_heures' => 0.0,
            'delai_p90_heures' => 0.0,
            'delai_median_jours' => 0.0,
            'delai_p90_jours' => 0.0,
        ];

        try {
            if (!Schema::hasTable('communication') || !Schema::hasTable('candidature')) {
                return $metrics;
            }

            $isPgsql = DB::connection()->getDriverName() === 'pgsql';

            if ($isPgsql) {
                $sql = "
                    WITH premieres_comm AS (
                        SELECT 
                            c.id_candidature,
                            c.created_at as date_reception,
                            MIN(comm.date_envoi) as date_premiere_reponse
                        FROM candidature c
                        JOIN communication comm ON comm.id_candidature = c.id_candidature
                        GROUP BY c.id_candidature, c.created_at
                    ),
                    intervalles AS (
                        SELECT 
                            GREATEST(0.1, EXTRACT(EPOCH FROM (date_premiere_reponse - date_reception)) / 3600.0) as delai_heures
                        FROM premieres_comm
                        WHERE date_premiere_reponse >= date_reception
                    )
                    SELECT 
                        COUNT(*) as total_repondues,
                        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY delai_heures)::numeric, 1) as median_heures,
                        ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY delai_heures)::numeric, 1) as p90_heures
                    FROM intervalles
                ";

                $rows = DB::select($sql);
                if (!empty($rows)) {
                    $row = $rows[0];
                    $medianH = (float) ($row->median_heures ?? 0);
                    $p90H = (float) ($row->p90_heures ?? 0);

                    $metrics['total_repondues'] = (int) ($row->total_repondues ?? 0);
                    $metrics['delai_median_heures'] = $medianH;
                    $metrics['delai_p90_heures'] = $p90H;
                    $metrics['delai_median_jours'] = round($medianH / 24.0, 1);
                    $metrics['delai_p90_jours'] = round($p90H / 24.0, 1);
                }
            }

            $totalCandidatures = Candidature::count();
            $metrics['en_attente_reponse'] = max(0, $totalCandidatures - $metrics['total_repondues']);
        } catch (\Throwable $e) {}

        return $metrics;
    }

    /**
     * 2. Rendement par canal (site, saisie RH, import e-mail) : taux de présélection, recrutement et délai
     */
    public function getChannelYield(array $filters = []): array
    {
        $canaux = [
            'site_web' => [
                'code' => 'site_web',
                'nom' => 'Site Web (Candidats direct)',
                'total' => 0,
                'preselectionnes' => 0,
                'retenus' => 0,
                'taux_preselection' => 0.0,
                'taux_recrutement' => 0.0,
                'delai_moyen_jours' => 0.0,
                'diagnostic' => 'Neutre',
            ],
            'email_n8n' => [
                'code' => 'email_n8n',
                'nom' => 'E-mail Ingestion (n8n & IA)',
                'total' => 0,
                'preselectionnes' => 0,
                'retenus' => 0,
                'taux_preselection' => 0.0,
                'taux_recrutement' => 0.0,
                'delai_moyen_jours' => 0.0,
                'diagnostic' => 'Neutre',
            ],
            'rh_manuel' => [
                'code' => 'rh_manuel',
                'nom' => 'Saisie RH Manuelle',
                'total' => 0,
                'preselectionnes' => 0,
                'retenus' => 0,
                'taux_preselection' => 0.0,
                'taux_recrutement' => 0.0,
                'delai_moyen_jours' => 0.0,
                'diagnostic' => 'Neutre',
            ],
        ];

        try {
            if (!Schema::hasTable('candidature')) {
                return array_values($canaux);
            }

            $query = Candidature::query()->with('statut');
            $this->applyCandidatureFilters($query, $filters);
            $items = $query->get(['id_candidature', 'canal_depot', 'cle_idempotence', 'id_statut_candidature', 'created_at', 'updated_at']);

            $delaisParCanal = ['site_web' => [], 'email_n8n' => [], 'rh_manuel' => []];

            foreach ($items as $item) {
                $canal = (string) $item->canal_depot;
                $cle = (string) $item->cle_idempotence;

                $targetKey = 'site_web';
                if ($canal === 'rh_manuel') {
                    $targetKey = 'rh_manuel';
                } elseif (!empty($cle) && (str_contains($cle, '@') || str_contains($cle, 'msg-') || str_starts_with($cle, '<'))) {
                    $targetKey = 'email_n8n';
                }

                $canaux[$targetKey]['total']++;

                $ordre = $item->statut?->ordre_workflow ?? 0;
                $libelle = strtolower($item->statut?->libelle ?? '');

                // Présélectionné : a dépassé le statut 'Reçue'
                if ($ordre > 10 || (!str_contains($libelle, 'recue') && !str_contains($libelle, 'reçue') && $ordre >= 10)) {
                    $canaux[$targetKey]['preselectionnes']++;
                }

                // Retenu
                if (str_contains($libelle, 'retenu') && !str_contains($libelle, 'non')) {
                    $canaux[$targetKey]['retenus']++;
                }

                if ($item->created_at && $item->updated_at && $ordre >= 40) {
                    $jours = Carbon::parse($item->created_at)->diffInDays(Carbon::parse($item->updated_at));
                    $delaisParCanal[$targetKey][] = max(0, $jours);
                }
            }

            foreach ($canaux as $key => &$c) {
                if ($c['total'] > 0) {
                    $c['taux_preselection'] = round(($c['preselectionnes'] / $c['total']) * 100, 1);
                    $c['taux_recrutement'] = round(($c['retenus'] / $c['total']) * 100, 1);
                }
                if (!empty($delaisParCanal[$key])) {
                    $c['delai_moyen_jours'] = round(array_sum($delaisParCanal[$key]) / count($delaisParCanal[$key]), 1);
                }

                // Diagnostic qualité / coût caché
                if ($c['total'] >= 10 && $c['taux_recrutement'] === 0.0) {
                    $c['diagnostic'] = 'Coût caché (volume élevé sans conversion)';
                } elseif ($c['taux_recrutement'] >= 15.0) {
                    $c['diagnostic'] = 'Rendement d’excellence';
                } elseif ($c['taux_preselection'] >= 40.0) {
                    $c['diagnostic'] = 'Source qualifiée';
                } else {
                    $c['diagnostic'] = 'Standard';
                }
            }
        } catch (\Throwable $e) {}

        return array_values($canaux);
    }

    /**
     * 2. Santé des offres : offres en tension, dormantes, prêtes à clôturer
     */
    public function getOfferHealth(): array
    {
        $health = [
            'offres_en_tension_count' => 0,
            'offres_dormantes_count' => 0,
            'offres_a_cloturer_count' => 0,
            'offres_en_tension' => [],
            'offres_dormantes' => [],
            'offres_a_cloturer' => [],
        ];

        try {
            if (!Schema::hasTable('offre')) {
                return $health;
            }

            $now = Carbon::now();
            $offres = Offre::query()
                ->with(['direction', 'statut', 'candidatures.statut'])
                ->get();

            foreach ($offres as $offre) {
                $statutLibelle = strtolower($offre->statut?->libelle ?? '');
                $estPubliee = ($statutLibelle === 'publiee' || $statutLibelle === 'publiée');

                $datePub = $offre->date_publication ? Carbon::parse($offre->date_publication) : null;
                $dateLim = $offre->date_limite ? Carbon::parse($offre->date_limite) : null;
                $joursPub = $datePub ? $datePub->diffInDays($now) : 0;

                $candidatures = $offre->candidatures ?? collect();
                $nbCandidatures = $candidatures->count();

                // Candidatures qualifiées (> Reçue)
                $qualifiees = $candidatures->filter(function ($c) {
                    $ord = $c->statut?->ordre_workflow ?? 0;
                    return $ord > 10;
                })->count();

                // 1. Offres prêtes à clôturer (date limite dépassée ou candidat déjà retenu)
                $aUnRetenu = $candidatures->contains(function ($c) {
                    $lib = strtolower($c->statut?->libelle ?? '');
                    return str_contains($lib, 'retenu') && !str_contains($lib, 'non');
                });

                if ($estPubliee && ($aUnRetenu || ($dateLim && $dateLim->isPast()))) {
                    $health['offres_a_cloturer'][] = [
                        'id_offre' => $offre->id_offre,
                        'titre_poste' => $offre->titre_poste,
                        'direction' => $offre->direction?->nom_direction ?? 'Générale',
                        'motif' => $aUnRetenu ? 'Candidat retenu identifié' : 'Date limite dépassée',
                        'nb_candidatures' => $nbCandidatures,
                        'date_limite' => $dateLim ? $dateLim->format('d/m/Y') : null,
                    ];
                    $health['offres_a_cloturer_count']++;
                    continue; // Pas besoin de tagger en tension si elle est à clôturer
                }

                // 2. Offres en tension : publiée depuis > 25 jours avec < 3 candidatures qualifiées
                if ($estPubliee && $joursPub >= 25 && $qualifiees < 3) {
                    $health['offres_en_tension'][] = [
                        'id_offre' => $offre->id_offre,
                        'titre_poste' => $offre->titre_poste,
                        'direction' => $offre->direction?->nom_direction ?? 'Générale',
                        'jours_publication' => $joursPub,
                        'total_candidatures' => $nbCandidatures,
                        'qualifiees' => $qualifiees,
                        'urgence' => $joursPub >= 45 ? 'critique' : 'elevee',
                    ];
                    $health['offres_en_tension_count']++;
                }

                // 3. Offres dormantes : aucune nouvelle candidature ou mise à jour depuis > 14 jours
                $derniereActivite = $candidatures->max('updated_at');
                $joursInactivite = $derniereActivite ? Carbon::parse($derniereActivite)->diffInDays($now) : $joursPub;

                if ($estPubliee && $joursInactivite >= 14 && $nbCandidatures > 0) {
                    $health['offres_dormantes'][] = [
                        'id_offre' => $offre->id_offre,
                        'titre_poste' => $offre->titre_poste,
                        'direction' => $offre->direction?->nom_direction ?? 'Générale',
                        'jours_sans_activite' => $joursInactivite,
                        'nb_candidatures' => $nbCandidatures,
                    ];
                    $health['offres_dormantes_count']++;
                }
            }
        } catch (\Throwable $e) {}

        return $health;
    }

    /**
     * 2. Candidats récurrents et doublons
     */
    public function getRecurringCandidates(int $limit = 10): array
    {
        $result = [
            'total_candidats_multiples' => 0,
            'candidats_apres_refus' => 0,
            'doublons_n8n_bloques' => 0,
            'liste' => [],
        ];

        try {
            if (!Schema::hasTable('candidat') || !Schema::hasTable('candidature')) {
                return $result;
            }

            // Candidats ayant postulé plus d'une fois
            $candidatsMultiples = DB::table('candidat')
                ->join('candidature', 'candidature.id_candidat', '=', 'candidat.id_candidat')
                ->select('candidat.id_candidat', 'candidat.nom', 'candidat.prenom', 'candidat.email', DB::raw('count(candidature.id_candidature) as nb_candidatures'))
                ->groupBy('candidat.id_candidat', 'candidat.nom', 'candidat.prenom', 'candidat.email')
                ->havingRaw('count(candidature.id_candidature) > 1')
                ->orderByDesc('nb_candidatures')
                ->limit($limit)
                ->get();

            $result['total_candidats_multiples'] = DB::table('candidature')
                ->select('id_candidat')
                ->groupBy('id_candidat')
                ->havingRaw('count(*) > 1')
                ->get()
                ->count();

            foreach ($candidatsMultiples as $cm) {
                // Vérifie si le candidat a essuyé un refus auparavant
                $aRefus = DB::table('candidature')
                    ->join('statut_candidature', 'statut_candidature.id_statut_candidature', '=', 'candidature.id_statut_candidature')
                    ->where('candidature.id_candidat', $cm->id_candidat)
                    ->where(function ($q) {
                        $q->where('statut_candidature.libelle', 'LIKE', '%Non retenu%')
                          ->orWhere('statut_candidature.libelle', 'LIKE', '%Rejet%');
                    })
                    ->exists();

                if ($aRefus) {
                    $result['candidats_apres_refus']++;
                }

                $result['liste'][] = [
                    'id_candidat' => $cm->id_candidat,
                    'nom_complet' => trim("{$cm->nom} {$cm->prenom}"),
                    'email' => $cm->email,
                    'nb_postulations' => (int) $cm->nb_candidatures,
                    'a_refus_precedent' => $aRefus,
                ];
            }

            if (Schema::hasTable('pipeline_metrics')) {
                $result['doublons_n8n_bloques'] = DB::table('pipeline_metrics')
                    ->where('statut', 'doublon_ignore')
                    ->count();
            }
        } catch (\Throwable $e) {}

        return $result;
    }

    /**
     * 3. Vivier réactivable : candidatures spontanées du vivier qui correspondent aux offres publiées
     */
    public function getReactivableVivier(int $limit = 6): array
    {
        $suggestions = [];

        try {
            if (!Schema::hasTable('candidature') || !Schema::hasTable('offre')) {
                return $suggestions;
            }

            // Offres publiées actuelles
            $offresPubliees = Offre::query()
                ->with('direction')
                ->whereHas('statut', fn($q) => $q->where('libelle', 'Publiee'))
                ->get();

            if ($offresPubliees->isEmpty()) {
                return $suggestions;
            }

            // Candidatures dans le vivier ou spontanées
            $candidaturesVivier = Candidature::query()
                ->with(['candidat', 'domaine'])
                ->where(function ($q) {
                    $q->where('dans_vivier', true)
                      ->orWhere('id_type_demande', 2)
                      ->orWhereNull('id_offre');
                })
                ->whereHas('statut', fn($q) => $q->whereNotIn('libelle', ['Retenue', 'Non retenue']))
                ->orderByDesc('created_at')
                ->limit(30)
                ->get();

            foreach ($candidaturesVivier as $cv) {
                foreach ($offresPubliees as $offre) {
                    $correspondance = false;
                    $motif = '';

                    // 1. Correspondance par domaine
                    if ($cv->id_domaine && $offre->id_domaine && $cv->id_domaine === $offre->id_domaine) {
                        $correspondance = true;
                        $motif = 'Même domaine professionnel (' . ($cv->domaine?->nom_domaine ?? 'Domaine') . ')';
                    }

                    // 2. Correspondance par intitulé de poste souhaité
                    if (!$correspondance && !empty($cv->poste_souhaite)) {
                        $pLow = strtolower($cv->poste_souhaite);
                        $tLow = strtolower($offre->titre_poste);
                        if (str_contains($tLow, $pLow) || str_contains($pLow, $tLow)) {
                            $correspondance = true;
                            $motif = "Poste souhaité correspondant : {$cv->poste_souhaite}";
                        }
                    }

                    if ($correspondance) {
                        $nom = $cv->candidat ? trim("{$cv->candidat->nom} {$cv->candidat->prenom}") : 'Candidat vivier';
                        $suggestions[] = [
                            'id_candidature' => $cv->id_candidature,
                            'nom_complet' => $nom,
                            'email' => $cv->candidat?->email ?? '-',
                            'poste_souhaite' => $cv->poste_souhaite ?: ($cv->domaine?->nom_domaine ?: 'Profil vivier'),
                            'id_offre_suggeree' => $offre->id_offre,
                            'titre_offre_suggeree' => $offre->titre_poste,
                            'direction_offre' => $offre->direction?->nom_direction ?? 'Générale',
                            'motif_matching' => $motif,
                            'date_vivier' => $cv->created_at ? Carbon::parse($cv->created_at)->format('d/m/Y') : '-',
                        ];
                        break; // Une suggestion par profil pour varier
                    }
                }

                if (count($suggestions) >= $limit) {
                    break;
                }
            }
        } catch (\Throwable $e) {}

        return $suggestions;
    }

    /**
     * 3. Offre vs demande de compétences & compétences manquantes
     */
    public function getSkillsSupplyDemand(): array
    {
        $result = [
            'top_competences_demandees' => [],
            'top_competences_candidats' => [],
            'penuries' => [],
            'manquantes_frequentes' => [],
        ];

        try {
            // 1. Compétences les plus demandées dans les offres
            if (Schema::hasTable('offre_competence') && Schema::hasTable('competence')) {
                $demandees = DB::table('offre_competence')
                    ->join('competence', 'competence.id_competence', '=', 'offre_competence.id_competence')
                    ->select('competence.nom_competence', DB::raw('count(offre_competence.id_offre) as total_offres'))
                    ->groupBy('competence.nom_competence')
                    ->orderByDesc('total_offres')
                    ->limit(6)
                    ->get();

                foreach ($demandees as $d) {
                    $result['top_competences_demandees'][] = [
                        'competence' => $d->nom_competence,
                        'count' => (int) $d->total_offres,
                    ];
                }
            }

            // 2. Compétences les plus présentes chez les candidats
            if (Schema::hasTable('candidat_competence') && Schema::hasTable('competence')) {
                $presentes = DB::table('candidat_competence')
                    ->join('competence', 'competence.id_competence', '=', 'candidat_competence.id_competence')
                    ->select('competence.nom_competence', DB::raw('count(candidat_competence.id_candidature) as total_candidats'))
                    ->groupBy('competence.nom_competence')
                    ->orderByDesc('total_candidats')
                    ->limit(6)
                    ->get();

                foreach ($presentes as $p) {
                    $result['top_competences_candidats'][] = [
                        'competence' => $p->nom_competence,
                        'count' => (int) $p->total_candidats,
                    ];
                }
            }

            // 3. Détection des compétences en pénurie (demandées mais peu représentées)
            $demandeNoms = collect($result['top_competences_demandees'])->pluck('count', 'competence')->toArray();
            $offreNoms = collect($result['top_competences_candidats'])->pluck('count', 'competence')->toArray();

            foreach ($demandeNoms as $comp => $nbOffres) {
                $nbCandidats = $offreNoms[$comp] ?? 0;
                if ($nbCandidats < $nbOffres) {
                    $result['penuries'][] = [
                        'competence' => $comp,
                        'demande_offres' => $nbOffres,
                        'vivier_candidats' => $nbCandidats,
                        'gap' => $nbOffres - $nbCandidats,
                    ];
                }
            }
        } catch (\Throwable $e) {}

        return $result;
    }

    /**
     * 4. Santé du pipeline d’ingestion (n8n / OCR / NER) : succès, latences P50/P95, CV vides
     */
    public function getPipelineHealth(int $days = 14): array
    {
        $health = [
            'total_flux' => 0,
            'taux_succes' => 100.0,
            'ocr_median_s' => 0.0,
            'ocr_p95_s' => 0.0,
            'ner_median_s' => 0.0,
            'ner_p95_s' => 0.0,
            'alerte_derive_latence' => false,
            'cv_extraits_vides_count' => 0,
            'taux_validation_manuelle' => 0.0,
            'repartition_validation' => [
                'valide' => 0,
                'modifie' => 0,
                'en_attente' => 0,
            ],
            'flux_par_jour' => [],
        ];

        try {
            $now = Carbon::now();
            $dateDebut = $now->copy()->subDays($days)->startOfDay();

            if (Schema::hasTable('pipeline_metrics')) {
                $metrics = DB::table('pipeline_metrics')
                    ->where('created_at', '>=', $dateDebut)
                    ->get();

                $health['total_flux'] = $metrics->count();

                if ($health['total_flux'] > 0) {
                    $succes = $metrics->where('statut', 'succes')->count();
                    $health['taux_succes'] = round(($succes / $health['total_flux']) * 100, 1);

                    // CVs vides (< 200 caractères OCR ou 0 compétence)
                    $health['cv_extraits_vides_count'] = $metrics->filter(function ($m) {
                        return ((int) $m->nb_caracteres_ocr < 200) || ((int) $m->nb_competences === 0);
                    })->count();

                    // Latences OCR et NER (P50 & P95)
                    $ocrDurations = $metrics->pluck('duree_ocr_s')->map(fn($v) => (float) $v)->sort()->values()->toArray();
                    $nerDurations = $metrics->pluck('duree_ner_s')->map(fn($v) => (float) $v)->sort()->values()->toArray();

                    $nOcr = count($ocrDurations);
                    if ($nOcr > 0) {
                        $health['ocr_median_s'] = round($ocrDurations[(int) floor($nOcr * 0.5)], 2);
                        $health['ocr_p95_s'] = round($ocrDurations[(int) min($nOcr - 1, floor($nOcr * 0.95))], 2);
                    }

                    $nNer = count($nerDurations);
                    if ($nNer > 0) {
                        $health['ner_median_s'] = round($nerDurations[(int) floor($nNer * 0.5)], 2);
                        $health['ner_p95_s'] = round($nerDurations[(int) min($nNer - 1, floor($nNer * 0.95))], 2);
                    }

                    // Dérive si P95 > 15s
                    $health['alerte_derive_latence'] = ($health['ocr_p95_s'] > 15.0 || $health['ner_p95_s'] > 15.0);

                    // Graphique par jour
                    $cursor = $dateDebut->copy();
                    while ($cursor->lte($now)) {
                        $jourStr = $cursor->format('Y-m-d');
                        $jourItems = $metrics->filter(fn($m) => Carbon::parse($m->created_at)->format('Y-m-d') === $jourStr);

                        $health['flux_par_jour'][] = [
                            'date' => $cursor->format('d/m'),
                            'date_complete' => $jourStr,
                            'succes' => $jourItems->where('statut', 'succes')->count(),
                            'doublon' => $jourItems->where('statut', 'doublon_ignore')->count(),
                            'erreur' => $jourItems->where('statut', 'erreur')->count(),
                        ];
                        $cursor->addDay();
                    }
                }
            }

            // Statut de validation manuelle depuis cv_extraction_ocr
            if (Schema::hasTable('cv_extraction_ocr')) {
                $extractions = DB::table('cv_extraction_ocr')->get(['statut_validation']);
                $totalExt = $extractions->count();

                if ($totalExt > 0) {
                    $valide = $extractions->where('statut_validation', 'valide')->count();
                    $modifie = $extractions->where('statut_validation', 'modifie')->count();
                    $enAttente = $extractions->where('statut_validation', 'en_attente')->count();

                    $health['repartition_validation'] = [
                        'valide' => $valide,
                        'modifie' => $modifie,
                        'en_attente' => $enAttente,
                    ];
                    $health['taux_validation_manuelle'] = round(($modifie / $totalExt) * 100, 1);
                }
            }
        } catch (\Throwable $e) {}

        return $health;
    }

    /**
     * 5. Conformité RGPD & Respect des délais cibles (SLA)
     */
    public function getComplianceAndSla(array $filters = []): array
    {
        $comp = [
            'rgpd_a_surveiller' => 0,     // > 18 mois (< 24 mois)
            'rgpd_a_anonymiser' => 0,     // > 24 mois (limite légale)
            'candidatures_rgpd' => [],
            'sla_conformite_pct' => 100.0,
            'sla_depassement_count' => 0,
            'sla_en_alerte_count' => 0,
        ];

        try {
            if (!Schema::hasTable('candidature')) {
                return $comp;
            }

            $now = Carbon::now();
            $dixHuitMois = $now->copy()->subMonths(18);
            $deuxAns = $now->copy()->subYears(2);

            // 1. RGPD
            $rgpdOld = Candidature::with('candidat')
                ->where('created_at', '<=', $dixHuitMois)
                ->get();

            foreach ($rgpdOld as $c) {
                $isDepasse = Carbon::parse($c->created_at)->lte($deuxAns);
                if ($isDepasse) {
                    $comp['rgpd_a_anonymiser']++;
                } else {
                    $comp['rgpd_a_surveiller']++;
                }

                if (count($comp['candidatures_rgpd']) < 8) {
                    $comp['candidatures_rgpd'][] = [
                        'id_candidature' => $c->id_candidature,
                        'nom_complet' => $c->candidat ? trim("{$c->candidat->nom} {$c->candidat->prenom}") : 'Candidat',
                        'email' => $c->candidat?->email ?? '-',
                        'date_depot' => Carbon::parse($c->created_at)->format('d/m/Y'),
                        'age_mois' => Carbon::parse($c->created_at)->diffInMonths($now),
                        'statut_rgpd' => $isDepasse ? 'anonymisation_requise' : 'echeance_proche',
                    ];
                }
            }

            // 2. SLA (Objectif : 1er traitement en <= 7 jours)
            $septJours = $now->copy()->subDays(7);
            $cinqJours = $now->copy()->subDays(5);

            $actives = Candidature::whereHas('statut', fn($q) => $q->where('ordre_workflow', '<=', 10))->get();
            $totalActive = $actives->count();

            $depassements = $actives->filter(fn($c) => Carbon::parse($c->created_at)->lt($septJours))->count();
            $alertes = $actives->filter(fn($c) => Carbon::parse($c->created_at)->lt($cinqJours) && Carbon::parse($c->created_at)->gte($septJours))->count();

            $comp['sla_depassement_count'] = $depassements;
            $comp['sla_en_alerte_count'] = $alertes;
            if ($totalActive > 0) {
                $comp['sla_conformite_pct'] = round((($totalActive - $depassements) / $totalActive) * 100, 1);
            }
        } catch (\Throwable $e) {}

        return $comp;
    }

    public function getMonthlyEvolution(array $filters = [], int $months = 6): array
    {
        $evolution = [];
        $moisFr = [
            1 => 'Janv.', 2 => 'Févr.', 3 => 'Mars', 4 => 'Avr.', 5 => 'Mai', 6 => 'Juin',
            7 => 'Juil.', 8 => 'Août', 9 => 'Sept.', 10 => 'Oct.', 11 => 'Nov.', 12 => 'Déc.'
        ];

        try {
            if (Schema::hasTable('candidature')) {
                $hasCustomDates = !empty($filters['date_debut']) || !empty($filters['date_fin']);
                $periode = $filters['periode'] ?? 'all';

                $now = Carbon::now();
                $dateDebut = null;
                $dateFin = null;

                if ($hasCustomDates) {
                    $dateDebut = !empty($filters['date_debut'])
                        ? Carbon::parse($filters['date_debut'])->startOfDay()
                        : $now->copy()->subMonths(5)->startOfMonth();

                    $dateFin = !empty($filters['date_fin'])
                        ? Carbon::parse($filters['date_fin'])->endOfDay()
                        : $now->copy()->endOfDay();

                    if ($dateDebut->gt($dateFin)) {
                        [$dateDebut, $dateFin] = [$dateFin->copy()->startOfDay(), $dateDebut->copy()->endOfDay()];
                    }
                } elseif ($periode === 'this_month') {
                    $dateDebut = $now->copy()->startOfMonth();
                    $dateFin = $now->copy()->endOfMonth();
                } elseif ($periode === 'last_month') {
                    $dateDebut = $now->copy()->subMonth()->startOfMonth();
                    $dateFin = $now->copy()->subMonth()->endOfMonth();
                } elseif ($periode === '30_days') {
                    $dateDebut = $now->copy()->subDays(29)->startOfDay();
                    $dateFin = $now->copy()->endOfDay();
                } elseif ($periode === 'this_year') {
                    $dateDebut = $now->copy()->startOfYear();
                    $dateFin = $now->copy()->endOfYear();
                } else {
                    $dateDebut = $now->copy()->subMonths($months - 1)->startOfMonth();
                    $dateFin = $now->copy()->endOfDay();
                }

                $query = Candidature::query()
                    ->where('created_at', '>=', $dateDebut)
                    ->where('created_at', '<=', $dateFin);

                if (!empty($filters['direction_id'])) {
                    $directionId = (int) $filters['direction_id'];
                    $query->where(function ($q) use ($directionId) {
                        $q->whereHas('offre', fn($sub) => $sub->where('id_direction', $directionId))
                          ->orWhereHas('domaine', fn($sub) => $sub->where('id_direction', $directionId));
                    });
                }

                $candidatures = $query->get(['id_candidature', 'id_offre', 'id_type_demande', 'created_at']);
                $diffDays = $dateDebut->diffInDays($dateFin);

                if (($hasCustomDates || in_array($periode, ['this_month', 'last_month', '30_days'])) && $diffDays <= 35) {
                    $cursor = $dateDebut->copy();
                    while ($cursor->lte($dateFin)) {
                        $key = $cursor->format('Y-m-d');
                        $jourNum = $cursor->format('d');
                        $moisAbrev = $moisFr[(int) $cursor->format('n')] ?? '';
                        $label = $jourNum . ' ' . $moisAbrev;

                        $filteredDay = $candidatures->filter(function ($item) use ($key) {
                            return $item->created_at && Carbon::parse($item->created_at)->format('Y-m-d') === $key;
                        });

                        $surOffre = $filteredDay->filter(fn($c) => !empty($c->id_offre) && $c->id_type_demande != 2)->count();
                        $spontanees = $filteredDay->filter(fn($c) => empty($c->id_offre) || $c->id_type_demande == 2)->count();

                        $evolution[] = [
                            'cle_mois' => $key,
                            'cle_periode' => $key,
                            'label' => $label,
                            'date' => $key,
                            'type_granulat' => 'jour',
                            'total' => $filteredDay->count(),
                            'sur_offre' => $surOffre,
                            'spontanee' => $spontanees,
                        ];

                        $cursor->addDay();
                    }
                } else {
                    $cursor = $dateDebut->copy()->startOfMonth();
                    $endMonth = $dateFin->copy()->startOfMonth();

                    while ($cursor->lte($endMonth)) {
                        $key = $cursor->format('Y-m');
                        $label = ($moisFr[(int) $cursor->format('n')] ?? '') . ' ' . $cursor->format('y');

                        $filteredMonth = $candidatures->filter(function ($item) use ($key) {
                            return $item->created_at && Carbon::parse($item->created_at)->format('Y-m') === $key;
                        });

                        $surOffre = $filteredMonth->filter(fn($c) => !empty($c->id_offre) && $c->id_type_demande != 2)->count();
                        $spontanees = $filteredMonth->filter(fn($c) => empty($c->id_offre) || $c->id_type_demande == 2)->count();

                        $evolution[] = [
                            'cle_mois' => $key,
                            'cle_periode' => $key,
                            'label' => $label,
                            'date' => $key,
                            'type_granulat' => 'mois',
                            'total' => $filteredMonth->count(),
                            'sur_offre' => $surOffre,
                            'spontanee' => $spontanees,
                        ];

                        $cursor->addMonth();
                    }
                }
            }
        } catch (\Throwable $e) {}

        return $evolution;
    }

    public function getDirectionBreakdown(): array
    {
        $breakdown = [];
        try {
            if (Schema::hasTable('direction')) {
                $directions = Direction::orderBy('nom_direction', 'asc')->get();
                $totalCandidatures = Schema::hasTable('candidature') ? DB::table('candidature')->count() : 0;

                foreach ($directions as $dir) {
                    $offresActives = 0;
                    $nbCandidatures = 0;

                    if (Schema::hasTable('offre')) {
                        $offresActives = DB::table('offre')
                            ->where('id_direction', $dir->id_direction)
                            ->when(Schema::hasTable('statut_offre'), function ($q) {
                                $q->join('statut_offre', 'statut_offre.id_statut_offre', '=', 'offre.id_statut_offre')
                                  ->where('statut_offre.libelle', 'Publiee');
                            })
                            ->count();

                        if (Schema::hasTable('candidature')) {
                            $nbCandidatures = DB::table('candidature')
                                ->join('offre', 'offre.id_offre', '=', 'candidature.id_offre')
                                ->where('offre.id_direction', $dir->id_direction)
                                ->count();
                        }
                    }

                    $pct = $totalCandidatures > 0 ? round(($nbCandidatures / $totalCandidatures) * 100, 1) : 0.0;

                    $breakdown[] = [
                        'id_direction' => $dir->id_direction,
                        'nom_direction' => $dir->nom_direction,
                        'offres_actives' => $offresActives,
                        'candidatures' => $nbCandidatures,
                        'pourcentage' => $pct,
                    ];
                }
            }
        } catch (\Throwable $e) {}

        return $breakdown;
    }

    public function getChannelBreakdown(array $filters = []): array
    {
        $breakdown = [];
        try {
            if (Schema::hasTable('candidature')) {
                $query = Candidature::query();
                $this->applyCandidatureFilters($query, $filters);
                $total = (clone $query)->count();

                $items = (clone $query)->get(['id_candidature', 'canal_depot', 'cle_idempotence']);

                $siteWeb = 0;
                $emailN8n = 0;
                $rhManuel = 0;

                foreach ($items as $item) {
                    $canal = (string) $item->canal_depot;
                    $cle = (string) $item->cle_idempotence;

                    if ($canal === 'rh_manuel') {
                        $rhManuel++;
                    } elseif (
                        !empty($cle) && (str_contains($cle, '@') || str_contains($cle, 'msg-') || str_starts_with($cle, '<'))
                    ) {
                        $emailN8n++;
                    } else {
                        $siteWeb++;
                    }
                }

                // Deux canaux affichés : les candidatures importées par le circuit n8n (« via site web »)
                // et celles déposées directement par le candidat ou saisies par un RH (« via candidat »).
                $viaSiteWeb = $emailN8n;
                $viaCandidat = $siteWeb + $rhManuel;

                $breakdown = [
                    [
                        'canal' => 'Via site web',
                        'code' => 'site_web',
                        'count' => $viaSiteWeb,
                        'pourcentage' => $total > 0 ? round(($viaSiteWeb / $total) * 100, 1) : 0,
                    ],
                    [
                        'canal' => 'Via candidat',
                        'code' => 'candidat',
                        'count' => $viaCandidat,
                        'pourcentage' => $total > 0 ? round(($viaCandidat / $total) * 100, 1) : 0,
                    ],
                ];
            }
        } catch (\Throwable $e) {}

        return $breakdown;
    }

    public function getPendingCandidatures(int $limit = 5): array
    {
        $list = [];
        try {
            if (Schema::hasTable('candidature')) {
                $pending = Candidature::query()
                    ->with(['candidat', 'offre.direction', 'domaine'])
                    ->whereHas('statut', function ($q) {
                        $q->whereIn('libelle', ['Recue', 'Reçue'])->orWhere('ordre_workflow', '<=', 10);
                    })
                    ->orderBy('created_at', 'asc')
                    ->limit($limit)
                    ->get();

                foreach ($pending as $c) {
                    $nom = $c->candidat ? trim("{$c->candidat->nom} {$c->candidat->prenom}") : 'Candidat inconnu';
                    $intitule = $c->offre?->titre_poste ?: ($c->poste_souhaite ?: ($c->domaine?->nom_domaine ?: 'Candidature spontanée'));
                    $joursAttente = $c->created_at ? Carbon::parse($c->created_at)->diffInDays(Carbon::now()) : 0;

                    $list[] = [
                        'id_candidature' => $c->id_candidature,
                        'nom_complet' => $nom,
                        'email' => $c->candidat?->email ?? '-',
                        'intitule' => $intitule,
                        'direction' => $c->offre?->direction?->nom_direction ?? 'Générale',
                        'dans_vivier' => (bool) $c->dans_vivier,
                        'jours_attente' => (int) $joursAttente,
                        'date_depot' => $c->created_at ? Carbon::parse($c->created_at)->toIso8601String() : null,
                    ];
                }
            }
        } catch (\Throwable $e) {}

        return $list;
    }

    /**
     * Dernières candidatures reçues qui n'ont pas encore été ouvertes par un recruteur
     * (vue = false), de la plus récente à la plus ancienne.
     */
    public function getLatestUnseenCandidatures(array $filters = [], int $limit = 6): array
    {
        $list = [];
        try {
            if (Schema::hasTable('candidature')) {
                $query = Candidature::query()
                    ->where(function ($q) {
                        $q->where('vue', false)->orWhereNull('vue');
                    });

                $this->applyCandidatureFilters($query, $filters);

                $latest = $query
                    ->with(['candidat', 'offre.direction', 'domaine'])
                    ->orderByDesc('created_at')
                    ->limit($limit)
                    ->get();

                foreach ($latest as $c) {
                    $nom = $c->candidat ? trim("{$c->candidat->nom} {$c->candidat->prenom}") : 'Candidat inconnu';
                    $intitule = $c->offre?->titre_poste ?: ($c->poste_souhaite ?: ($c->domaine?->nom_domaine ?: 'Candidature spontanée'));
                    $joursAttente = $c->created_at ? Carbon::parse($c->created_at)->diffInDays(Carbon::now()) : 0;

                    $list[] = [
                        'id_candidature' => $c->id_candidature,
                        'nom_complet' => $nom,
                        'email' => $c->candidat?->email ?? '-',
                        'intitule' => $intitule,
                        'direction' => $c->offre?->direction?->nom_direction ?? 'Générale',
                        'dans_vivier' => (bool) $c->dans_vivier,
                        'jours_attente' => (int) $joursAttente,
                        'date_depot' => $c->created_at ? Carbon::parse($c->created_at)->toIso8601String() : null,
                    ];
                }
            }
        } catch (\Throwable $e) {}

        return $list;
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
