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
     * List all candidates in the Vivier with search & filters
     */
    public function index(Request $request): JsonResponse
    {
        $q = trim($request->input('q', ''));
        $directionId = $request->input('direction');
        $domaineId = $request->input('domaine');

        // 1. Vivier Candidats records
        $vivierQuery = VivierCandidat::query()->with(['candidat', 'direction', 'domaine']);

        if (!empty($q)) {
            $vivierQuery->whereHas('candidat', function ($sub) use ($q) {
                $sub->where('nom', 'like', "%{$q}%")
                    ->orWhere('prenom', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }
        if ($directionId) {
            $vivierQuery->where('id_direction', $directionId);
        }
        if ($domaineId) {
            $vivierQuery->where('id_domaine', $domaineId);
        }

        $vivierItems = $vivierQuery->orderByDesc('created_at')->get();

        // 2. Candidatures marked dans_vivier = true
        $candQuery = Candidature::query()
            ->with(['candidat', 'direction', 'domaine', 'statut', 'offre'])
            ->where('dans_vivier', true);

        if (!empty($q)) {
            $candQuery->whereHas('candidat', function ($sub) use ($q) {
                $sub->where('nom', 'like', "%{$q}%")
                    ->orWhere('prenom', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }
        if ($directionId) {
            $candQuery->where(function ($sub) use ($directionId) {
                $sub->where('id_direction', $directionId)
                    ->orWhereHas('offre', fn($o) => $o->where('id_direction', $directionId))
                    ->orWhereHas('domaine', fn($d) => $d->where('id_direction', $directionId));
            });
        }
        if ($domaineId) {
            $candQuery->where('id_domaine', $domaineId);
        }

        $candItems = $candQuery->orderByDesc('created_at')->get();

        // Format unified list
        $combined = collect();

        foreach ($candItems as $cand) {
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
            // Avoid duplicate candidates if already included from candidatures
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
            'id_candidat' => ['required', 'integer', 'exists:candidats,id_candidat'],
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
     * Get candidate profile details (Competencies, Experiences, Formations)
     */
    public function getCandidatProfile(int $idCandidat): JsonResponse
    {
        $candidat = Candidat::findOrFail($idCandidat);

        $experiences = CandidatExperience::where('id_candidat', $idCandidat)->orderByDesc('date_debut')->get();
        $formations = CandidatFormation::where('id_candidat', $idCandidat)->orderByDesc('annee_obtention')->get();

        $competences = DB::table('candidat_competence')
            ->join('competence', 'candidat_competence.id_competence', '=', 'competence.id_competence')
            ->join('type_competence', 'competence.id_type_competence', '=', 'type_competence.id_type_competence')
            ->where('candidat_competence.id_candidat', $idCandidat)
            ->select(
                'competence.id_competence',
                'competence.nom_competence',
                'type_competence.libelle as type_competence',
                'candidat_competence.niveau',
                'candidat_competence.valide',
                'candidat_competence.source_extraction'
            )
            ->get();

        return response()->json([
            'data' => [
                'candidat' => $candidat,
                'competences' => $competences,
                'experiences' => $experiences,
                'formations' => $formations,
            ],
        ]);
    }

    /**
     * Add or update candidate competence
     */
    public function addCompetence(Request $request, int $idCandidat): JsonResponse
    {
        $validated = $request->validate([
            'id_competence' => ['required', 'integer', 'exists:competence,id_competence'],
            'niveau' => ['nullable', 'string', 'max:50'],
        ]);

        DB::table('candidat_competence')->updateOrInsert(
            [
                'id_candidat' => $idCandidat,
                'id_competence' => $validated['id_competence'],
            ],
            [
                'niveau' => $validated['niveau'] ?? 'Intermédiaire',
                'valide' => true,
                'source_extraction' => 'Manuelle',
            ]
        );

        return response()->json(['message' => 'Compétence candidat mise à jour.']);
    }

    /**
     * Add candidate experience
     */
    public function addExperience(Request $request, int $idCandidat): JsonResponse
    {
        $validated = $request->validate([
            'intitule_poste' => ['required', 'string', 'max:150'],
            'entreprise' => ['nullable', 'string', 'max:150'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
        ]);

        $exp = CandidatExperience::create([
            'id_candidat' => $idCandidat,
            'intitule_poste' => $validated['intitule_poste'],
            'entreprise' => $validated['entreprise'] ?? null,
            'date_debut' => $validated['date_debut'] ?? null,
            'date_fin' => $validated['date_fin'] ?? null,
            'description' => $validated['description'] ?? null,
            'valide' => true,
        ]);

        return response()->json(['message' => 'Expérience ajoutée.', 'data' => $exp], 201);
    }

    /**
     * Add candidate formation
     */
    public function addFormation(Request $request, int $idCandidat): JsonResponse
    {
        $validated = $request->validate([
            'diplome' => ['required', 'string', 'max:150'],
            'etablissement' => ['nullable', 'string', 'max:150'],
            'annee_obtention' => ['nullable', 'integer'],
            'domaine_etude' => ['nullable', 'string', 'max:150'],
        ]);

        $form = CandidatFormation::create([
            'id_candidat' => $idCandidat,
            'diplome' => $validated['diplome'],
            'etablissement' => $validated['etablissement'] ?? null,
            'annee_obtention' => $validated['annee_obtention'] ?? null,
            'domaine_etude' => $validated['domaine_etude'] ?? null,
            'valide' => true,
        ]);

        return response()->json(['message' => 'Formation ajoutée.', 'data' => $form], 201);
    }

    /**
     * FastAPI / PaddleOCR Extraction endpoint simulation & Store
     */
    public function extractOcr(int $idCandidature): JsonResponse
    {
        $candidature = Candidature::with(['candidat', 'documents'])->findOrFail($idCandidature);

        // Simulated PaddleOCR & FastAPI LLM extraction payload
        $extractedData = [
            'competences' => [
                ['nom' => 'PHP / Laravel', 'niveau' => 'Avancé'],
                ['nom' => 'React.js', 'niveau' => 'Intermédiaire'],
                ['nom' => 'PostgreSQL', 'niveau' => 'Avancé'],
                ['nom' => 'Gestion de projet', 'niveau' => 'Intermédiaire'],
            ],
            'experiences' => [
                [
                    'intitule_poste' => 'Développeur Fullstack Web',
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
                        ['id_type_competence' => 1] // Technique
                    );

                    DB::table('candidat_competence')->updateOrInsert(
                        [
                            'id_candidat' => $idCandidat,
                            'id_competence' => $compModel->id_competence,
                        ],
                        [
                            'niveau' => $comp['niveau'] ?? 'Intermédiaire',
                            'valide' => true,
                            'source_extraction' => 'OCR_IA',
                        ]
                    );
                }
            }

            // Import experiences
            if (!empty($validated['experiences'])) {
                foreach ($validated['experiences'] as $exp) {
                    CandidatExperience::create([
                        'id_candidat' => $idCandidat,
                        'intitule_poste' => $exp['intitule_poste'],
                        'entreprise' => $exp['entreprise'] ?? null,
                        'date_debut' => $exp['date_debut'] ?? null,
                        'date_fin' => $exp['date_fin'] ?? null,
                        'description' => $exp['description'] ?? null,
                        'valide' => true,
                    ]);
                }
            }

            // Import formations
            if (!empty($validated['formations'])) {
                foreach ($validated['formations'] as $form) {
                    CandidatFormation::create([
                        'id_candidat' => $idCandidat,
                        'diplome' => $form['diplome'],
                        'etablissement' => $form['etablissement'] ?? null,
                        'annee_obtention' => $form['annee_obtention'] ?? null,
                        'domaine_etude' => $form['domaine_etude'] ?? null,
                        'valide' => true,
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
