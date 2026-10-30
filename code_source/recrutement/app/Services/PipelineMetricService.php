<?php

namespace App\Services;

use App\Enums\StatutPipelineMetric;
use App\Models\Candidature;
use App\Repositories\Contracts\PipelineMetricRepositoryInterface;
use Illuminate\Support\Facades\Log;

class PipelineMetricService
{
    public function __construct(
        protected PipelineMetricRepositoryInterface $metricRepository
    ) {}

    /**
     * Enregistre les métriques d'exécution du pipeline lors d'un import n8n réussi via le repository.
     */
    public function enregistrerSucces(Candidature $candidature, ?string $cle, array $data): void
    {
        try {
            $metrics = $data['metrics'] ?? [];
            $donnees = $data['donnees_json'] ?? [];
            if (is_string($donnees)) {
                $donnees = json_decode($donnees, true) ?: [];
            }

            $this->metricRepository->create([
                'cle_idempotence' => $cle,
                'email_expediteur' => $data['email'] ?? null,
                'sujet_email' => $data['sujet_email'] ?? null,
                'id_offre' => $candidature->id_offre,
                'id_candidature' => $candidature->id_candidature,
                'duree_classification_s' => $metrics['duree_classification_s'] ?? $data['duree_classification_s'] ?? 0,
                'duree_ocr_s' => $metrics['duree_ocr_s'] ?? $data['duree_ocr_s'] ?? 0,
                'duree_ner_s' => $metrics['duree_ner_s'] ?? $data['duree_ner_s'] ?? 0,
                'duree_totale_s' => $metrics['duree_totale_s'] ?? $data['duree_totale_s'] ?? 0,
                'nb_caracteres_ocr' => !empty($data['texte_brut_ocr']) ? mb_strlen($data['texte_brut_ocr']) : 0,
                'nb_competences' => !empty($donnees['competences']) && is_array($donnees['competences']) ? count($donnees['competences']) : 0,
                'nb_experiences' => !empty($donnees['experiences']) && is_array($donnees['experiences']) ? count($donnees['experiences']) : 0,
                'nb_projets' => !empty($donnees['projets']) && is_array($donnees['projets']) ? count($donnees['projets']) : 0,
                'nb_formations' => !empty($donnees['formations']) && is_array($donnees['formations']) ? count($donnees['formations']) : 0,
                'statut' => StatutPipelineMetric::Succes->value,
            ]);
        } catch (\Throwable $e) {
            Log::warning("Erreur métriques succès #{$candidature->id_candidature}: " . $e->getMessage());
        }
    }

    /**
     * Enregistre la trace d'un doublon ignoré lors d'un rejeu réseau ou webhook dupliqué via le repository.
     */
    public function enregistrerDoublon(Candidature $candidature, string $cle, array $data): void
    {
        try {
            $this->metricRepository->create([
                'cle_idempotence' => $cle,
                'email_expediteur' => $data['email'] ?? null,
                'sujet_email' => $data['sujet_email'] ?? null,
                'id_offre' => $candidature->id_offre,
                'id_candidature' => $candidature->id_candidature,
                'statut' => StatutPipelineMetric::DoublonIgnore->value,
                'message_erreur' => 'Candidature déjà traitée (cle_idempotence reconnue).',
            ]);
        } catch (\Throwable $e) {
            Log::warning("Erreur métrique doublon [{$cle}]: " . $e->getMessage());
        }
    }
}
