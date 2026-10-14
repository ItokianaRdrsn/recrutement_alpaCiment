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
     * Applique les filtres de date et de direction sur une requête de candidature.
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

                // Taux de recrutement et Délai moyen
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

                // Délai moyen de recrutement (jours)
                if ($totalFinalisees > 0) {
                    $joursCumul = 0;
                    $nbAvecDates = 0;
                    foreach ($finalisees as $c) {
                        if ($c->created_at && $c->updated_at) {
                            $jours = Carbon::parse($c->created_at)->diffInDays(Carbon::parse($c->updated_at));
                            $joursCumul += max(0, $jours);
                            $nbAvecDates++;
                        }
                    }
                    if ($nbAvecDates > 0) {
                        $kpis['delai_moyen_jours'] = round($joursCumul / $nbAvecDates, 1);
                    }
                }
            }
        } catch (\Throwable $e) {}

        return $kpis;
    }

    public function getFunnel(array $filters = []): array
    {
        $funnel = [];
        try {
            if (Schema::hasTable('statut_candidature') && Schema::hasTable('candidature')) {
                $statuts = StatutCandidature::orderBy('ordre_workflow', 'asc')->get();

                $query = Candidature::query();
                $this->applyCandidatureFilters($query, $filters);
                $total = (clone $query)->count();

                $countsByStatus = (clone $query)
                    ->select('id_statut_candidature', DB::raw('count(*) as total'))
                    ->groupBy('id_statut_candidature')
                    ->pluck('total', 'id_statut_candidature')
                    ->toArray();

                foreach ($statuts as $st) {
                    $count = $countsByStatus[$st->id_statut_candidature] ?? 0;
                    $pct = $total > 0 ? round(($count / $total) * 100, 1) : 0.0;

                    $funnel[] = [
                        'id_statut' => $st->id_statut_candidature,
                        'libelle' => $st->libelle,
                        'ordre' => $st->ordre_workflow,
                        'count' => $count,
                        'pourcentage' => $pct,
                    ];
                }
            }
        } catch (\Throwable $e) {}

        return $funnel;
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
                    // Par défaut ('all') : les 6 derniers mois calendaires
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

                // Granularité quotidienne si la période sélectionnée est courte (<= 35 jours, ex: un mois ciblé ou 30 jours)
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
                    // Granularité mensuelle pour les périodes plus étendues (> 35 jours ou vue globale)
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

                $breakdown = [
                    [
                        'canal' => 'Site Web (Candidats direct)',
                        'code' => 'site_web',
                        'count' => $siteWeb,
                        'pourcentage' => $total > 0 ? round(($siteWeb / $total) * 100, 1) : 0,
                    ],
                    [
                        'canal' => 'E-mail Ingestion (n8n & IA)',
                        'code' => 'email',
                        'count' => $emailN8n,
                        'pourcentage' => $total > 0 ? round(($emailN8n / $total) * 100, 1) : 0,
                    ],
                    [
                        'canal' => 'Saisie Manuelle RH',
                        'code' => 'rh_manuel',
                        'count' => $rhManuel,
                        'pourcentage' => $total > 0 ? round(($rhManuel / $total) * 100, 1) : 0,
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
