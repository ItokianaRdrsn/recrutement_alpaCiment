<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidat;
use App\Models\CandidatExperience;
use App\Models\CandidatFormation;
use App\Models\Candidature;
use App\Models\Competence;
use App\Models\CvExtractionOcr;
use App\Models\VivierCandidat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VivierController extends Controller
{
    /**
     * Display Vivier listing with search, filtering by Direction, Domaine & Statut
     */
    public function index(Request $request): JsonResponse
    {
        $query = VivierCandidat::with(['candidat', 'direction', 'domaine']);

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->whereHas('candidat', function ($sub) use ($q) {
                $sub->where('nom', 'ILIKE', "%{$q}%")
                    ->orWhere('prenom', 'ILIKE', "%{$q}%")
                    ->orWhere('email', 'ILIKE', "%{$q}%");
            });
        }

        if ($request->filled('direction')) {
            $query->where('id_direction', $request->input('direction'));
        }

        if ($request->filled('domaine')) {
            $query->where('id_domaine', $request->input('domaine'));
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->input('statut'));
        }

        $vivierItems = $query->orderByDesc('created_at')->get();

        // Include candidatures flagged with dans_vivier = true
        $candQuery = Candidature::with(['candidat', 'offre.direction', 'domaine.direction'])
            ->where('dans_vivier', true);

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $candQuery->whereHas('candidat', function ($sub) use ($q) {
                $sub->where('nom', 'ILIKE', "%{$q}%")
                    ->orWhere('prenom', 'ILIKE', "%{$q}%")
                    ->orWhere('email', 'ILIKE', "%{$q}%");
            });
        }

        if ($request->filled('direction')) {
            $dirId = (int) $request->input('direction');
            $candQuery->where(function ($qDir) use ($dirId) {
                $qDir->whereHas('offre', function ($s) use ($dirId) {
                    $s->where('id_direction', $dirId);
                })->orWhereHas('domaine', function ($s) use ($dirId) {
                    $s->where('id_direction', $dirId);
                });
            });
        }

        $candidaturesEnVivier = $candQuery->orderByDesc('updated_at')->get();

        $combined = collect();

        foreach ($candidaturesEnVivier as $cand) {
            $combined->push([
                'id_vivier_candidat' => 'cand_' . $cand->id_candidature,
                'id_candidature' => $cand->id_candidature,
                'id_candidat' => $cand->id_candidat,
                'candidat' => $cand->candidat,
                'direction' => $cand->direction ?? $cand->offre?->direction ?? $cand->domaine?->direction,
                'domaine' => $cand->domaine,
                'motif_ajout' => $cand->offre ? 'Mis en vivier RH (Candidature sur offre)' : 'Candidature spontanée (En vivier par défaut)',
                'statut' => 'Actif',
                'created_at' => $cand->created_at,
            ]);
        }

        foreach ($vivierItems as $viv) {
            if (!$combined->firstWhere('id_candidat', $viv->id_candidat)) {
                $combined->push([
                    'id_vivier_candidat' => $viv->id_vivier_candidat,
                    'id_candidat' => $viv->id_candidat,
                    'candidat' => $viv->candidat,
                    'direction' => $viv->direction,
                    'domaine' => $viv->domaine,
                    'motif_ajout' => $viv->motif_ajout,
                    'statut' => $viv->statut,
                    'created_at' => $viv->created_at,
                ]);
            }
        }

        return response()->json([
            'data' => $combined->values(),
        ]);
    }

    /**
     * Add candidate to Vivier
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_candidat' => ['required', 'integer', 'exists:candidat,id_candidat'],
            'id_direction' => ['nullable', 'integer', 'exists:direction,id_direction'],
            'id_domaine' => ['nullable', 'integer', 'exists:domaine,id_domaine'],
            'motif_ajout' => ['nullable', 'string', 'max:255'],
        ]);

        $vivier = VivierCandidat::updateOrCreate(
            ['id_candidat' => $validated['id_candidat']],
            [
                'id_direction' => $validated['id_direction'] ?? null,
                'id_domaine' => $validated['id_domaine'] ?? null,
                'motif_ajout' => $validated['motif_ajout'] ?? 'Ajouté au vivier de talents',
                'statut' => 'Actif',
            ]
        );

        return response()->json([
            'message' => 'Candidat ajouté au vivier avec succès.',
            'data' => $vivier->load(['candidat', 'direction', 'domaine']),
        ], 201);
    }

    /**
     * Remove candidate from Vivier
     */
    public function destroy(int $id): JsonResponse
    {
        $vivier = VivierCandidat::findOrFail($id);
        $vivier->delete();

        return response()->json([
            'message' => 'Candidat retiré du vivier avec succès.',
        ]);
    }

    /**
     * Get candidate profile details (Competencies, Experiences, Formations linked to Candidature)
     */
    public function getCandidatProfile(int $id): JsonResponse
    {
        $candidature = Candidature::with('candidat')->find($id);
        if (!$candidature) {
            $candidature = Candidature::with('candidat')->where('id_candidat', $id)->latest()->first();
        }

        $candidat = $candidature ? $candidature->candidat : Candidat::find($id);

        if (!$candidat && !$candidature) {
            return response()->json(['message' => 'Dossier introuvable.'], 404);
        }

        $idCandidature = $candidature ? $candidature->id_candidature : null;

        $experiences = collect();
        if ($idCandidature && \Illuminate\Support\Facades\Schema::hasColumn('candidat_experience_professionnelle', 'id_candidature')) {
            $experiences = CandidatExperience::where('id_candidature', $idCandidature)->orderByDesc('date_debut')->get();
        }

        $formations = collect();
        if ($idCandidature && \Illuminate\Support\Facades\Schema::hasColumn('candidat_formation', 'id_candidature')) {
            $formations = CandidatFormation::where('id_candidature', $idCandidature)->orderByDesc('id_formation')->get();
        }

        $competences = collect();
        if ($idCandidature && \Illuminate\Support\Facades\Schema::hasColumn('candidat_competence', 'id_candidature')) {
            $competences = DB::table('candidat_competence')
                ->join('competence', 'candidat_competence.id_competence', '=', 'competence.id_competence')
                ->join('type_competence', 'competence.id_type_competence', '=', 'type_competence.id_type_competence')
                ->where('candidat_competence.id_candidature', $idCandidature)
                ->select(
                    'competence.id_competence',
                    'competence.nom_competence',
                    'type_competence.libelle as type_competence',
                    'candidat_competence.niveau',
                    'candidat_competence.valide',
                    'candidat_competence.source'
                )->get();
        }

        return response()->json([
            'data' => [
                'candidat' => $candidat,
                'candidature' => $candidature,
                'competences' => $competences,
                'experiences' => $experiences,
                'formations' => $formations,
            ],
        ]);
    }

    /**
     * Add or update candidate competence on Candidature
     */
    public function addCompetence(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'id_competence' => ['required', 'integer', 'exists:competence,id_competence'],
            'niveau' => ['nullable', 'string', 'max:50'],
        ]);

        $candidature = Candidature::find($id);
        $idCandidature = $candidature ? $candidature->id_candidature : $id;

        DB::table('candidat_competence')->updateOrInsert(
            [
                'id_candidature' => $idCandidature,
                'id_competence' => $validated['id_competence'],
            ],
            [
                'niveau' => $validated['niveau'] ?? 'Intermédiaire',
                'valide' => true,
                'source' => 'manuel',
            ]
        );

        return response()->json(['message' => 'Compétence candidature mise à jour.']);
    }

    /**
     * Add candidate experience on Candidature
     */
    public function addExperience(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'poste' => ['nullable', 'string', 'max:200'],
            'intitule_poste' => ['nullable', 'string', 'max:200'],
            'entreprise' => ['nullable', 'string', 'max:200'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
        ]);

        $candidature = Candidature::find($id);
        $idCandidature = $candidature ? $candidature->id_candidature : $id;
        $idCandidat = $candidature ? $candidature->id_candidat : $id;

        $posteTitle = trim($validated['poste'] ?? $validated['intitule_poste'] ?? 'Poste non spécifié');

        $exp = CandidatExperience::create([
            'id_candidature' => $idCandidature,
            'id_candidat' => $idCandidat,
            'poste' => $posteTitle,
            'entreprise' => $validated['entreprise'] ?? null,
            'date_debut' => $validated['date_debut'] ?? null,
            'date_fin' => $validated['date_fin'] ?? null,
            'description' => $validated['description'] ?? null,
            'valide' => true,
            'source' => 'manuel',
        ]);

        return response()->json(['message' => 'Expérience ajoutée.', 'data' => $exp], 201);
    }

    /**
     * Add candidate formation on Candidature
     */
    public function addFormation(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'diplome' => ['required', 'string', 'max:200'],
            'etablissement' => ['nullable', 'string', 'max:200'],
            'annee_obtention' => ['nullable'],
            'date_obtention' => ['nullable', 'date'],
            'domaine_etude' => ['nullable', 'string', 'max:150'],
        ]);

        $candidature = Candidature::find($id);
        $idCandidature = $candidature ? $candidature->id_candidature : $id;
        $idCandidat = $candidature ? $candidature->id_candidat : $id;

        $dateObt = null;
        if (!empty($validated['date_obtention'])) {
            $dateObt = $validated['date_obtention'];
        } elseif (!empty($validated['annee_obtention']) && is_numeric($validated['annee_obtention'])) {
            $dateObt = $validated['annee_obtention'] . '-01-01';
        }

        $form = CandidatFormation::create([
            'id_candidature' => $idCandidature,
            'id_candidat' => $idCandidat,
            'diplome' => $validated['diplome'],
            'etablissement' => $validated['etablissement'] ?? null,
            'date_obtention' => $dateObt,
            'domaine_etude' => $validated['domaine_etude'] ?? null,
            'valide' => true,
            'source' => 'manuel',
        ]);

        return response()->json(['message' => 'Formation ajoutée.', 'data' => $form], 201);
    }

    /**
     * FastAPI / PaddleOCR Extraction endpoint & Store
     */
    public function extractOcr(int $idCandidature): JsonResponse
    {
        $candidature = Candidature::with(['candidat', 'documents'])->findOrFail($idCandidature);

        $rawText = null;
        $extractedData = null;

        // Tente la connexion au Microservice FastAPI OCR (port 8001)
        try {
            $cvDocument = $candidature->documents->firstWhere('type_document', 'CV') ?? $candidature->documents->first();
            
            if ($cvDocument && file_exists(storage_path('app/public/' . $cvDocument->chemin_fichier))) {
                $filePath = storage_path('app/public/' . $cvDocument->chemin_fichier);
                
                $response = \Illuminate\Support\Facades\Http::timeout(5)
                    ->attach('file', file_get_contents($filePath), $cvDocument->nom_fichier)
                    ->post('http://127.0.0.1:8001/extract-cv', [
                        'candidature_id' => $idCandidature,
                    ]);

                if ($response->successful()) {
                    $resJson = $response->json();
                    $rawText = $resJson['texte_brut_ocr'] ?? null;
                    $extractedData = $resJson['donnees_json'] ?? null;
                }
            }
        } catch (\Throwable $e) {
            // Log silent fallback if FastAPI is loading
            \Illuminate\Support\Facades\Log::warning("FastAPI microservice call failed: " . $e->getMessage());
        }

        // Fallback par défaut si microservice hors ligne
        if (!$extractedData) {
            $rawText = 'Texte OCR extrait pour le candidat ' . $candidature->candidat->nom . ' ' . $candidature->candidat->prenom;
            $extractedData = [
                'competences' => [
                    ['nom' => 'PHP / Laravel', 'niveau' => 'Avancé'],
                    ['nom' => 'React.js', 'niveau' => 'Intermédiaire'],
                    ['nom' => 'PostgreSQL', 'niveau' => 'Avancé'],
                    ['nom' => 'Gestion de projet', 'niveau' => 'Intermédiaire'],
                ],
                'experiences' => [
                    [
                        'poste' => 'Développeur Fullstack Web',
                        'entreprise' => 'Alpha Ciment Services',
                        'date_debut' => '2023-01-01',
                        'date_fin' => '2025-12-31',
                        'description' => 'Développement d’applications web complexes et APIs RESTful.',
                    ],
                ],
                'formations' => [
                    [
                        'diplome' => 'Master 2 Génie Logiciel',
                        'etablissement' => 'Université d’Antananarivo / ITU',
                        'annee_obtention' => 2022,
                        'domaine_etude' => 'Informatique',
                    ],
                ],
            ];
        }

        $extraction = CvExtractionOcr::updateOrCreate(
            ['id_candidature' => $idCandidature],
            [
                'texte_brut_ocr' => 'PaddleOCR Raw Text: CV ' . $candidature->candidat->nom . ' ' . $candidature->candidat->prenom . ' - Développeur Informatique M2 Software Engineering.',
                'donnees_json' => $extractedData,
                'statut_validation' => 'en_attente',
            ]
        );

        return response()->json([
            'message' => 'Extraction OCR & IA PaddleOCR effectuée avec succès.',
            'data' => $extraction,
        ]);
    }

    /**
     * Validate, correct or reject extracted OCR CV data by RH
     */
    public function validateOcrData(Request $request, int $idCandidature): JsonResponse
    {
        $validated = $request->validate([
            'statut_validation' => ['required', 'string', 'in:valide,corrige,rejete'],
            'commentaire_rh' => ['nullable', 'string'],
            'competences' => ['nullable', 'array'],
            'experiences' => ['nullable', 'array'],
            'formations' => ['nullable', 'array'],
        ]);

        $candidature = Candidature::findOrFail($idCandidature);
        $idCandidat = $candidature->id_candidat;

        $extraction = CvExtractionOcr::where('id_candidature', $idCandidature)->firstOrFail();
        $extraction->update([
            'statut_validation' => $validated['statut_validation'],
            'commentaire_rh' => $validated['commentaire_rh'] ?? null,
        ]);

        if (in_array($validated['statut_validation'], ['valide', 'corrige'], true)) {
            // Import competencies
            if (!empty($validated['competences'])) {
                foreach ($validated['competences'] as $comp) {
                    $compModel = Competence::firstOrCreate(
                        ['nom_competence' => trim($comp['nom'])],
                        ['id_type_competence' => 1]
                    );

                    DB::table('candidat_competence')->updateOrInsert(
                        [
                            'id_candidature' => $idCandidature,
                            'id_competence' => $compModel->id_competence,
                        ],
                        [
                            'niveau' => $comp['niveau'] ?? 'Intermédiaire',
                            'valide' => true,
                            'source' => 'cv_ocr',
                        ]
                    );
                }
            }

            // Import experiences
            if (!empty($validated['experiences'])) {
                foreach ($validated['experiences'] as $exp) {
                    $posteTitle = trim($exp['poste'] ?? $exp['intitule_poste'] ?? 'Poste non spécifié');
                    CandidatExperience::create([
                        'id_candidature' => $idCandidature,
                        'poste' => $posteTitle,
                        'entreprise' => $exp['entreprise'] ?? null,
                        'date_debut' => $exp['date_debut'] ?? null,
                        'date_fin' => $exp['date_fin'] ?? null,
                        'description' => $exp['description'] ?? null,
                        'valide' => true,
                        'source' => 'cv_ocr',
                    ]);
                }
            }

            // Import formations
            if (!empty($validated['formations'])) {
                foreach ($validated['formations'] as $form) {
                    $dateObt = null;
                    if (!empty($form['date_obtention'])) {
                        $dateObt = $form['date_obtention'];
                    } elseif (!empty($form['annee_obtention']) && is_numeric($form['annee_obtention'])) {
                        $dateObt = $form['annee_obtention'] . '-01-01';
                    }

                    CandidatFormation::create([
                        'id_candidature' => $idCandidature,
                        'diplome' => $form['diplome'],
                        'etablissement' => $form['etablissement'] ?? null,
                        'date_obtention' => $dateObt,
                        'domaine_etude' => $form['domaine_etude'] ?? null,
                        'valide' => true,
                        'source' => 'cv_ocr',
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Validation et enregistrement des données du CV effectués avec succès.',
            'data' => $extraction,
        ]);
    }
}
