<?php

namespace App\Services;

use App\Models\Offre;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmailClassificationService
{
    protected string $classifierUrl;

    public function __construct()
    {
        $this->classifierUrl = config('services.ocr.url', 'http://127.0.0.1:8001') . '/classify-email';
    }

    /**
     * Analyse et classifie l'intention d'un email reçu.
     *
     * @param string $subject Sujet / objet de l'email
     * @param string $body Corps du message texte
     * @return array Résultat de classification (type, id_offre, offre_ciblee, domaine_souhaite, question_resume, confiance, justification)
     */
    public function classify(string $subject, string $body): array
    {
        // 1. Récupération des offres d'emploi actives et publiées pour le contexte IA
        $activeOffers = Offre::query()
            ->whereHas('statut', function ($query) {
                $query->whereIn('libelle', ['Publiée', 'Publiee', 'Actif', 'Active']);
            })
            ->select('id_offre', 'titre_poste')
            ->get()
            ->map(fn($o) => [
                'id' => $o->id_offre,
                'title' => $o->titre_poste,
            ])
            ->toArray();

        // 2. Appel au microservice FastAPI local (Llama 3.2 via Ollama)
        try {
            $response = Http::timeout(25)->post($this->classifierUrl, [
                'subject' => $subject,
                'body' => $body,
                'active_offers' => $activeOffers,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if (!empty($data['classification'])) {
                    return $data['classification'];
                }
            } else {
                Log::warning('Échec appel microservice /classify-email', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Erreur connexion microservice de classification email : ' . $e->getMessage());
        }

        // 3. Fallback heuristique local si le microservice ne répond pas
        return $this->fallbackHeuristic($subject, $body, $activeOffers);
    }

    /**
     * Algorithme de secours heuristique par mots-clés
     */
    protected function fallbackHeuristic(string $subject, string $body, array $activeOffers): array
    {
        $text = mb_strtolower($subject . ' ' . $body);

        // Détection demande information / question
        $infoKeywords = ['renseignement', 'question', 'stage', 'période', 'horaire', 'contact', 'adresse', 'comment postuler'];
        foreach ($infoKeywords as $kw) {
            if (str_contains($text, $kw) && !str_contains($text, 'candidature') && !str_contains($text, 'postule')) {
                return [
                    'type' => 'demande_information',
                    'id_offre' => null,
                    'offre_ciblee' => null,
                    'domaine_souhaite' => null,
                    'question_resume' => $subject,
                    'confiance' => 0.6,
                    'justification' => 'Détection par mots-clés heuristiques (question ou stage)',
                ];
            }
        }

        // Détection candidature spontanée
        if (str_contains($text, 'spontan')) {
            return [
                'type' => 'demande_spontanee',
                'id_offre' => null,
                'offre_ciblee' => null,
                'domaine_souhaite' => null,
                'question_resume' => null,
                'confiance' => 0.6,
                'justification' => 'Détection du mot-clé "spontanée"',
            ];
        }

        // Détection offre active correspondante
        foreach ($activeOffers as $off) {
            $titleLower = mb_strtolower($off['title']);
            if (str_contains($text, $titleLower)) {
                return [
                    'type' => 'demande_offre',
                    'id_offre' => $off['id'],
                    'offre_ciblee' => $off['title'],
                    'domaine_souhaite' => null,
                    'question_resume' => null,
                    'confiance' => 0.7,
                    'justification' => 'Correspondance exacte avec le titre d\'une offre active',
                ];
            }
        }

        // Par défaut
        return [
            'type' => 'demande_offre',
            'id_offre' => null,
            'offre_ciblee' => $subject,
            'domaine_souhaite' => null,
            'question_resume' => null,
            'confiance' => 0.5,
            'justification' => 'Fallback par défaut vers demande sur offre',
        ];
    }
}
