<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ModeleMessageResource;
use App\Models\Candidature;
use App\Models\ModeleMessage;
use App\Models\StatutCandidature;
use App\Models\TypeMessage;
use App\Services\CommunicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModeleMessageController extends Controller
{
    public function __construct(
        protected CommunicationService $communicationService
    ) {}

    /**
     * Référentiels pour les modèles de messages (types de messages, statuts).
     */
    public function referentiels(): JsonResponse
    {
        return response()->json([
            'data' => [
                'types' => TypeMessage::all(),
                'statuts' => StatutCandidature::orderBy('ordre_workflow')->get(),
                'variables_disponibles' => [
                    ['cle' => '{nom}', 'description' => 'Nom de famille du candidat'],
                    ['cle' => '{prenom}', 'description' => 'Prénom du candidat'],
                    ['cle' => '{nom_complet}', 'description' => 'Prénom et nom'],
                    ['cle' => '{poste}', 'description' => 'Titre de l\'offre ou poste souhaité'],
                    ['cle' => '{direction}', 'description' => 'Direction de rattachement'],
                    ['cle' => '{date_rdv}', 'description' => 'Date du rendez-vous / entretien'],
                    ['cle' => '{heure_rdv}', 'description' => 'Heure de début et de fin du rendez-vous'],
                    ['cle' => '{mode_rdv}', 'description' => 'Mode (Présentiel, Visioconférence, Téléphone)'],
                    ['cle' => '{lieu_rdv}', 'description' => 'Détails du lieu ou lien de visioconférence'],
                    ['cle' => '{date_jour}', 'description' => 'Date du jour en toutes lettres'],
                ],
            ],
        ]);
    }

    /**
     * Liste des modèles de messages.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ModeleMessage::with(['typeMessage', 'statutCandidature'])
            ->orderBy('id_type_message')
            ->orderBy('id_modele_message');

        if ($request->has('actif')) {
            $query->where('actif', filter_var($request->query('actif'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('id_type_message')) {
            $query->where('id_type_message', $request->query('id_type_message'));
        }

        $modeles = $query->get();

        return response()->json([
            'data' => ModeleMessageResource::collection($modeles),
        ]);
    }

    /**
     * Détail d'un modèle.
     */
    public function show(int $id): JsonResponse
    {
        $modele = ModeleMessage::with(['typeMessage', 'statutCandidature'])->findOrFail($id);

        return response()->json([
            'data' => new ModeleMessageResource($modele),
        ]);
    }

    /**
     * Création d'un nouveau modèle.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_type_message' => 'required|exists:type_message,id_type_message',
            'id_statut_candidature' => 'nullable|exists:statut_candidature,id_statut_candidature',
            'nom_modele' => 'required|string|max:150',
            'objet' => 'required|string|max:255',
            'contenu' => 'required|string',
            'envoi_automatique' => 'boolean',
            'actif' => 'boolean',
        ]);

        if (!empty($validated['envoi_automatique']) && empty($validated['id_statut_candidature'])) {
            return response()->json([
                'message' => 'Un modèle configuré en envoi automatique doit obligatoirement être rattaché à un statut de candidature.',
            ], 422);
        }

        $modele = ModeleMessage::create([
            'id_type_message' => $validated['id_type_message'],
            'id_statut_candidature' => $validated['id_statut_candidature'] ?? null,
            'nom_modele' => $validated['nom_modele'],
            'objet' => $validated['objet'],
            'contenu' => $validated['contenu'],
            'envoi_automatique' => $validated['envoi_automatique'] ?? false,
            'actif' => $validated['actif'] ?? true,
        ]);

        $modele->load(['typeMessage', 'statutCandidature']);

        return response()->json([
            'message' => 'Modèle de message créé avec succès.',
            'data' => new ModeleMessageResource($modele),
        ], 201);
    }

    /**
     * Mise à jour d'un modèle.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $modele = ModeleMessage::findOrFail($id);

        $validated = $request->validate([
            'id_type_message' => 'sometimes|required|exists:type_message,id_type_message',
            'id_statut_candidature' => 'nullable|exists:statut_candidature,id_statut_candidature',
            'nom_modele' => 'sometimes|required|string|max:150',
            'objet' => 'sometimes|required|string|max:255',
            'contenu' => 'sometimes|required|string',
            'envoi_automatique' => 'boolean',
            'actif' => 'boolean',
        ]);

        $envoiAuto = $validated['envoi_automatique'] ?? $modele->envoi_automatique;
        $statutCible = array_key_exists('id_statut_candidature', $validated) 
            ? $validated['id_statut_candidature'] 
            : $modele->id_statut_candidature;

        if ($envoiAuto && empty($statutCible)) {
            return response()->json([
                'message' => 'Un modèle configuré en envoi automatique doit obligatoirement être rattaché à un statut de candidature.',
            ], 422);
        }

        $modele->update($validated);
        $modele->load(['typeMessage', 'statutCandidature']);

        return response()->json([
            'message' => 'Modèle de message mis à jour avec succès.',
            'data' => new ModeleMessageResource($modele),
        ]);
    }

    /**
     * Suppression d'un modèle.
     */
    public function destroy(int $id): JsonResponse
    {
        $modele = ModeleMessage::findOrFail($id);
        $modele->delete();

        return response()->json([
            'message' => 'Modèle de message supprimé avec succès.',
        ]);
    }

    /**
     * Aperçu / simulation du rendu d'un texte ou modèle avec variables.
     */
    public function apercu(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_candidature' => 'nullable|exists:candidature,id_candidature',
            'objet' => 'nullable|string',
            'contenu' => 'required|string',
        ]);

        $candidature = !empty($validated['id_candidature'])
            ? Candidature::with(['candidat', 'offre.direction', 'domaine.direction'])->find($validated['id_candidature'])
            : Candidature::with(['candidat', 'offre.direction', 'domaine.direction'])->latest('id_candidature')->first();

        if (!$candidature) {
            return response()->json([
                'data' => [
                    'objet' => $validated['objet'] ?? '',
                    'contenu' => $validated['contenu'],
                ],
            ]);
        }

        $sujetResolus = !empty($validated['objet'])
            ? $this->communicationService->remplacerVariables($validated['objet'], $candidature)
            : '';

        $contenuResolus = $this->communicationService->remplacerVariables($validated['contenu'], $candidature);

        return response()->json([
            'data' => [
                'objet' => $sujetResolus,
                'contenu' => $contenuResolus,
                'candidat' => $candidature->candidat?->only(['nom', 'prenom', 'email']),
            ],
        ]);
    }
}
