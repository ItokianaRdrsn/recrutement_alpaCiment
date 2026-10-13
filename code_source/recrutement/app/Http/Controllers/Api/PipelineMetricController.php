<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PipelineMetric;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class PipelineMetricController extends Controller
{
    /**
     * Retourne les KPIs de monitoring du pipeline n8n / OCR / NER et l'historique paginé des exécutions.
     */
    public function index(Request $request): JsonResponse
    {
        if (!Schema::hasTable('pipeline_metrics')) {
            return response()->json([
                'kpis' => [
                    'total_executions' => 0,
                    'total_succes' => 0,
                    'total_erreurs' => 0,
                    'total_doublons' => 0,
                    'taux_succes' => 100,
                    'duree_moyenne_ocr_s' => 0,
                    'duree_moyenne_ner_s' => 0,
                    'duree_moyenne_totale_s' => 0,
                    'repartition_intentions' => [
                        'demande_emploi' => 0,
                        'information' => 0,
                        'spam' => 0,
                    ],
                ],
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 0,
                ],
            ]);
        }

        $totalExecutions = PipelineMetric::count();
        $totalSucces = PipelineMetric::where('statut', 'succes')->count();
        $totalErreurs = PipelineMetric::where('statut', 'erreur')->count();
        $totalDoublons = PipelineMetric::where('statut', 'doublon_ignore')->count();

        $tauxSucces = $totalExecutions > 0
            ? round((($totalSucces + $totalDoublons) / $totalExecutions) * 100, 1)
            : 100.0;

        $avgOcr = (float) PipelineMetric::where('duree_ocr_s', '>', 0)->avg('duree_ocr_s');
        $avgNer = (float) PipelineMetric::where('duree_ner_s', '>', 0)->avg('duree_ner_s');
        $avgTotale = (float) PipelineMetric::where('duree_totale_s', '>', 0)->avg('duree_totale_s');

        $intentionsCounts = PipelineMetric::select('intention', DB::raw('COUNT(*) as total'))
            ->groupBy('intention')
            ->pluck('total', 'intention')
            ->toArray();

        $query = PipelineMetric::with(['candidature.candidat', 'offre'])
            ->orderByDesc('created_at')
            ->orderByDesc('id_metric');

        if ($request->filled('statut')) {
            $query->where('statut', $request->input('statut'));
        }

        if ($request->filled('intention')) {
            $query->where('intention', $request->input('intention'));
        }

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(function ($sub) use ($q) {
                $sub->where('email_expediteur', 'like', "%{$q}%")
                    ->orWhere('sujet_email', 'like', "%{$q}%")
                    ->orWhere('cle_idempotence', 'like', "%{$q}%")
                    ->orWhere('message_erreur', 'like', "%{$q}%");
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'kpis' => [
                'total_executions' => $totalExecutions,
                'total_succes' => $totalSucces,
                'succes_count' => $totalSucces,
                'total_erreurs' => $totalErreurs,
                'erreurs_count' => $totalErreurs,
                'total_doublons' => $totalDoublons,
                'doublons_count' => $totalDoublons,
                'taux_succes' => $tauxSucces,
                'taux_succes_pct' => $tauxSucces,
                'duree_moyenne_ocr_s' => round($avgOcr, 2),
                'duree_ocr_moyenne_s' => round($avgOcr, 2),
                'duree_moyenne_ner_s' => round($avgNer, 2),
                'duree_ner_moyenne_s' => round($avgNer, 2),
                'duree_moyenne_totale_s' => round($avgTotale, 2),
                'duree_totale_moyenne_s' => round($avgTotale, 2),
                'repartition_intentions' => [
                    'demande_emploi' => (int) ($intentionsCounts['demande_emploi'] ?? 0),
                    'information' => (int) ($intentionsCounts['information'] ?? 0),
                    'spam' => (int) ($intentionsCounts['spam'] ?? 0),
                ],
            ],
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Endpoint public permettant à n8n d'enregistrer une métrique (ex: branche Information ou Spam).
     */
    public function storePublic(Request $request): JsonResponse
    {
        if (!Schema::hasTable('pipeline_metrics')) {
            return response()->json(['status' => 'ignored']);
        }

        $metric = PipelineMetric::create([
            'id_candidature' => $request->input('id_candidature'),
            'id_offre' => $request->input('id_offre'),
            'cle_idempotence' => $request->input('cle_idempotence') ?: $request->input('message_id'),
            'email_expediteur' => $request->input('email_expediteur') ?: $request->input('sender_email'),
            'sujet_email' => mb_substr((string) ($request->input('sujet_email') ?: $request->input('subject') ?: ''), 0, 250),
            'intention' => $request->input('intention', 'information'),
            'statut' => $request->input('statut', 'succes'),
            'duree_classification_s' => (float) $request->input('duree_classification_s', 0),
            'duree_ocr_s' => (float) $request->input('duree_ocr_s', 0),
            'duree_ner_s' => (float) $request->input('duree_ner_s', 0),
            'duree_totale_s' => (float) $request->input('duree_totale_s', 0),
        ]);

        return response()->json([
            'status' => 'logged',
            'data' => $metric,
        ], 201);
    }

    /**
     * Endpoint Dead Letter Queue (DLQ) appelé par workflow_error_handler_n8n.json en cas de crash n8n.
     */
    public function logError(Request $request): JsonResponse
    {
        Log::error('[N8N PIPELINE ERROR - DLQ]', $request->all());

        try {
            if (Schema::hasTable('audit_log')) {
                DB::table('audit_log')->insert([
                    'id_utilisateur' => null,
                    'action' => 'erreur_pipeline',
                    'table_cible' => 'n8n_workflow',
                    'id_enregistrement' => 0,
                    'details' => json_encode($request->all(), JSON_UNESCAPED_UNICODE),
                    'ip_adresse' => $request->ip(),
                    'created_at' => now(),
                ]);
            }

            if (Schema::hasTable('pipeline_metrics')) {
                PipelineMetric::create([
                    'id_candidature' => null,
                    'id_offre' => null,
                    'cle_idempotence' => $request->input('execution_id'),
                    'email_expediteur' => $request->input('sender_email'),
                    'sujet_email' => mb_substr((string) ($request->input('workflow_name') ?: 'Workflow n8n'), 0, 250),
                    'intention' => $request->input('intention', 'demande_emploi'),
                    'statut' => 'erreur',
                    'noeud_erreur' => mb_substr((string) ($request->input('failed_node') ?: 'Inconnu'), 0, 150),
                    'message_erreur' => $request->input('error_message') ?: json_encode($request->all(), JSON_UNESCAPED_UNICODE),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Impossible d\'enregistrer l\'erreur pipeline en BDD : ' . $e->getMessage());
        }

        return response()->json([
            'status' => 'logged',
            'message' => 'Alerte d\'erreur du pipeline n8n consignée avec succès dans Laravel et pipeline_metrics.',
        ], 200);
    }
}
