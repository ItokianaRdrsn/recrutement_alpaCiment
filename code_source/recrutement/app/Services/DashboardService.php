<?php

namespace App\Services;

use App\Http\Resources\OffreResource;
use App\Repositories\Contracts\DashboardRepositoryInterface;
use Illuminate\Http\Request;

class DashboardService
{
    public function __construct(
        protected DashboardRepositoryInterface $dashboardRepository
    ) {}

    public function getDashboardData(Request $request): array
    {
        $filters = [
            'direction_id' => $request->filled('direction_id') ? (int) $request->input('direction_id') : null,
            'offre_id' => $request->filled('offre_id') ? (int) $request->input('offre_id') : null,
            'canal' => $request->input('canal'),
            'periode' => $request->input('periode', 'all'),
            'date_debut' => $request->input('date_debut'),
            'date_fin' => $request->input('date_fin'),
        ];

        // 1. Métriques de base et existantes
        $kpis = $this->dashboardRepository->getKpis($filters);
        $funnel = $this->dashboardRepository->getDetailedFunnel($filters);
        $evolution = $this->dashboardRepository->getMonthlyEvolution($filters, 6);
        $directions = $this->dashboardRepository->getDirectionBreakdown();
        $canaux = $this->dashboardRepository->getChannelBreakdown($filters);
        $pending = $this->dashboardRepository->getPendingCandidatures(6);
        $dernieresCandidatures = $this->dashboardRepository->getLatestUnseenCandidatures($filters, 6);
        $offresRecentes = $this->dashboardRepository->getRecentOffers(5);

        // 2. Vitesse et goulots (Médiane P50, P90, Stagnation, Backlog, Délai 1ère réponse)
        $dureesWorkflow = $this->dashboardRepository->getWorkflowDurations($filters);
        $dossiersStagnants = $this->dashboardRepository->getStagnantCandidatures($filters, 7, 10);
        $backlogNonConsulte = $this->dashboardRepository->getUnreadBacklog($filters, 10);
        $delaiPremiereReponse = $this->dashboardRepository->getFirstResponseMetrics($filters);

        // 3. Qualité des sources et des offres (Rendement canal, Santé offres, Candidats récurrents)
        $rendementCanaux = $this->dashboardRepository->getChannelYield($filters);
        $santeOffres = $this->dashboardRepository->getOfferHealth();
        $candidatsRecurrents = $this->dashboardRepository->getRecurringCandidates(10);

        // 4. Matching et vivier (Vivier réactivable, Offre vs Demande compétences)
        $vivierReactivable = $this->dashboardRepository->getReactivableVivier(6);
        $competencesOffreDemande = $this->dashboardRepository->getSkillsSupplyDemand();

        // 5. Santé du pipeline d’ingestion (n8n / OCR / NER)
        $santePipeline = $this->dashboardRepository->getPipelineHealth(14);

        // 6. Conformité RGPD & Respect des délais cibles (SLA)
        $conformiteSla = $this->dashboardRepository->getComplianceAndSla($filters);

        return [
            // Données fondamentales
            'kpis' => $kpis,
            'entonnoir' => $funnel,
            'evolution_mensuelle' => $evolution,
            'repartition_directions' => $directions,
            'repartition_canaux' => $canaux,
            'candidatures_a_traiter' => $pending,
            'dernieres_candidatures' => $dernieresCandidatures,
            'offres_recentes' => OffreResource::collection($offresRecentes)->resolve($request),

            // Nouveaux blocs analytiques
            'durees_workflow' => $dureesWorkflow,
            'dossiers_stagnants' => $dossiersStagnants,
            'backlog_non_consulte' => $backlogNonConsulte,
            'delai_premiere_reponse' => $delaiPremiereReponse,
            'rendement_canaux' => $rendementCanaux,
            'sante_offres' => $santeOffres,
            'candidats_recurrents' => $candidatsRecurrents,
            'vivier_reactivable' => $vivierReactivable,
            'competences_offre_demande' => $competencesOffreDemande,
            'sante_pipeline' => $santePipeline,
            'conformite_sla' => $conformiteSla,
        ];
    }
}
