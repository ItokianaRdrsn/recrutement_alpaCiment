<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidat;
use App\Models\Candidature;
use App\Models\Domaine;
use App\Models\Document;
use App\Models\HistoriqueStatut;
use App\Models\Offre;
use App\Models\StatutCandidature;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CandidatureController extends Controller
{
    /**
     * Submit application for a specific published offer (Public candidate portal)
     */
    public function postulerOffre(Request $request, string $idOffre): JsonResponse
    {
        $publieeStatusIds = DB::table('statut_offre')->whereIn('libelle', ['Publiee', 'Publiée'])->pluck('id_statut_offre')->toArray();

        if (is_numeric($idOffre)) {
            $offre = Offre::findOrFail((int) $idOffre);
        } else {
            $offres = Offre::query()->whereIn('id_statut_offre', $publieeStatusIds)->get();
            $offre = $offres->first(function ($o) use ($idOffre) {
                return \Illuminate\Support\Str::slug($o->titre_poste) === $idOffre ||
                       \Illuminate\Support\Str::slug($o->id_offre . '-' . $o->titre_poste) === $idOffre;
            });
            if (!$offre) {
                return response()->json(['message' => 'Offre introuvable ou non disponible.'], 404);
            }
        }

        if (!empty($publieeStatusIds) && !in_array((int) $offre->id_statut_offre, $publieeStatusIds, true)) {
            return response()->json([
                'message' => 'Cette offre n\'est pas ouverte aux candidatures (statut non publié).',
            ], 422);
        }

        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'message_motivation' => ['nullable', 'string'],
            'cv' => ['required', 'file', 'max:10240'], // max 10MB
            'photo' => ['nullable', 'file', 'image', 'max:5120'], // max 5MB
            'documents.*' => ['nullable', 'file', 'max:10240'],
        ]);

        $candidature = DB::transaction(function () use ($request, $validated, $offre) {
            // Deduplication by email
            $candidat = Candidat::firstOrCreate(
                ['email' => strtolower(trim($validated['email']))],
                [
                    'nom' => trim($validated['nom']),
                    'prenom' => trim($validated['prenom']),
                    'telephone' => $validated['telephone'] ?? null,
                ]
            );

            // Initial status: Reçue
            $recueStatusId = DB::table('statut_candidature')->whereIn('libelle', ['Reçue', 'Recue'])->value('id_statut_candidature');
            if (!$recueStatusId) {
                $recueStatusId = DB::table('statut_candidature')->insertGetId([
                    'libelle' => 'Reçue',
                    'ordre_workflow' => 1,
                ], 'id_statut_candidature');
            }

            $typeDemandeId = DB::table('type_demande')->where('libelle', 'Offre')->value('id_type_demande');

            $candidature = Candidature::create([
                'id_candidat' => $candidat->id_candidat,
                'id_type_demande' => $typeDemandeId,
                'id_offre' => $offre->id_offre,
                'id_domaine' => null,
                'id_statut_candidature' => $recueStatusId,
                'dans_vivier' => false,
                'poste_souhaite' => null,
                'message' => $validated['message_motivation'] ?? null,
                'canal_depot' => 'site_externe',
                'id_utilisateur_depot' => null,
            ]);

            // Create initial status history
            HistoriqueStatut::create([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $recueStatusId,
                'date_changement' => now(),
                'commentaire' => 'Candidature déposée sur l\'offre: ' . $offre->titre_poste,
                'id_utilisateur' => auth()->id() ?? null,
            ]);

            // Save CV
            if ($request->hasFile('cv')) {
                $file = $request->file('cv');
                $path = $file->store('documents/cv', 'public');
                Document::create([
                    'id_candidature' => $candidature->id_candidature,
                    'type_document' => 'CV',
                    'nom_fichier' => $file->getClientOriginalName(),
                    'chemin_fichier' => $path,
                    'taille_octets' => $file->getSize(),
                    'mime_type' => $file->getClientMimeType(),
                    'description' => 'Curriculum Vitae',
                ]);
            }

            // Save Photo
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $path = $file->store('documents/photos', 'public');
                Document::create([
                    'id_candidature' => $candidature->id_candidature,
                    'type_document' => 'Photo',
                    'nom_fichier' => $file->getClientOriginalName(),
                    'chemin_fichier' => $path,
                    'taille_octets' => $file->getSize(),
                    'mime_type' => $file->getClientMimeType(),
                    'description' => 'Photo de profil',
                ]);
            }

            // Save additional documents
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $path = $file->store('documents/annexes', 'public');
                    Document::create([
                        'id_candidature' => $candidature->id_candidature,
                        'type_document' => 'Autre',
                        'nom_fichier' => $file->getClientOriginalName(),
                        'chemin_fichier' => $path,
                        'taille_octets' => $file->getSize(),
                        'mime_type' => $file->getClientMimeType(),
                        'description' => 'Pièce jointe complémentaire',
                    ]);
                }
            }

            return $candidature;
        });

        return response()->json([
            'message' => 'Votre candidature a bien été enregistrée. Merci !',
            'data' => [
                'id_candidature' => $candidature->id_candidature,
                'candidat' => $candidature->candidat->only(['nom', 'prenom', 'email']),
            ],
        ], 201);
    }

    /**
     * Submit spontaneous application (Public candidate portal)
     */
    public function candidatureSpontanee(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'poste_souhaite' => ['nullable', 'string', 'max:150'],
            'message_motivation' => ['nullable', 'string'],
            'cv' => ['required', 'file', 'max:10240'],
            'photo' => ['nullable', 'file', 'image', 'max:5120'],
        ]);

        $candidature = DB::transaction(function () use ($request, $validated) {
            $candidat = Candidat::firstOrCreate(
                ['email' => strtolower(trim($validated['email']))],
                [
                    'nom' => trim($validated['nom']),
                    'prenom' => trim($validated['prenom']),
                    'telephone' => $validated['telephone'] ?? null,
                ]
            );

            // Free-text 'poste_souhaite' creates an unvalidated Domaine record with id_direction = null
            $domaineId = null;
            if (!empty($validated['poste_souhaite'])) {
                $domaine = Domaine::firstOrCreate(
                    ['nom_domaine' => trim($validated['poste_souhaite'])],
                    ['id_direction' => null, 'valide' => false]
                );
                $domaineId = $domaine->id_domaine;
            }

            $recueStatusId = DB::table('statut_candidature')->whereIn('libelle', ['Reçue', 'Recue'])->value('id_statut_candidature');
            if (!$recueStatusId) {
                $recueStatusId = DB::table('statut_candidature')->insertGetId([
                    'libelle' => 'Reçue',
                    'ordre_workflow' => 1,
                ], 'id_statut_candidature');
            }

            $typeDemandeId = DB::table('type_demande')->where('libelle', 'Spontanee')->value('id_type_demande');

            $candidature = Candidature::create([
                'id_candidat' => $candidat->id_candidat,
                'id_type_demande' => $typeDemandeId,
                'id_offre' => null,
                'id_domaine' => $domaineId,
                'id_statut_candidature' => $recueStatusId,
                'dans_vivier' => true,
                'poste_souhaite' => $validated['poste_souhaite'] ?? null,
                'message' => $validated['message_motivation'] ?? null,
                'canal_depot' => 'site_externe',
                'id_utilisateur_depot' => null,
            ]);

            HistoriqueStatut::create([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $recueStatusId,
                'date_changement' => now(),
                'commentaire' => 'Dépôt de candidature spontanée' . (!empty($validated['poste_souhaite']) ? ' (Poste souhaité: ' . $validated['poste_souhaite'] . ')' : ''),
                'id_utilisateur' => auth()->id() ?? null,
            ]);

            if ($request->hasFile('cv')) {
                $file = $request->file('cv');
                $path = $file->store('documents/cv', 'public');
                Document::create([
                    'id_candidature' => $candidature->id_candidature,
                    'type_document' => 'CV',
                    'nom_fichier' => $file->getClientOriginalName(),
                    'chemin_fichier' => $path,
                    'taille_octets' => $file->getSize(),
                    'mime_type' => $file->getClientMimeType(),
                    'description' => 'Curriculum Vitae',
                ]);
            }

            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $path = $file->store('documents/photos', 'public');
                Document::create([
                    'id_candidature' => $candidature->id_candidature,
                    'type_document' => 'Photo',
                    'nom_fichier' => $file->getClientOriginalName(),
                    'chemin_fichier' => $path,
                    'taille_octets' => $file->getSize(),
                    'mime_type' => $file->getClientMimeType(),
                    'description' => 'Photo de profil',
                ]);
            }

            return $candidature;
        });

        return response()->json([
            'message' => 'Votre candidature spontanée a bien été enregistrée. Merci !',
            'data' => [
                'id_candidature' => $candidature->id_candidature,
                'candidat' => $candidature->candidat->only(['nom', 'prenom', 'email']),
            ],
        ], 201);
    }

    /**
     * Import candidature from external site / email parser webhook
     */
    public function importExternalCandidature(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'ville' => ['nullable', 'string', 'max:100'],
            'id_offre' => ['nullable', 'integer', 'exists:offre,id_offre'],
            'id_direction' => ['nullable', 'integer', 'exists:direction,id_direction'],
            'source' => ['nullable', 'string', 'max:100'],
            'message_motivation' => ['nullable', 'string'],
            'cv' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
            'photo' => ['nullable', 'file', 'image', 'max:5120'],
        ]);

        $candidature = DB::transaction(function () use ($request, $validated) {
            $candidat = Candidat::firstOrCreate(
                ['email' => strtolower(trim($validated['email']))],
                [
                    'nom' => trim($validated['nom']),
                    'prenom' => trim($validated['prenom']),
                    'telephone' => $validated['telephone'] ?? null,
                ]
            );

            $recueStatusId = DB::table('statut_candidature')->whereIn('libelle', ['Reçue', 'Recue'])->value('id_statut_candidature');
            if (!$recueStatusId) {
                $recueStatusId = DB::table('statut_candidature')->insertGetId([
                    'libelle' => 'Reçue',
                    'ordre_workflow' => 1,
                ], 'id_statut_candidature');
            }

            $typeDemandeId = !empty($validated['id_offre'])
                ? DB::table('type_demande')->where('libelle', 'Offre')->value('id_type_demande')
                : DB::table('type_demande')->where('libelle', 'Spontanee')->value('id_type_demande');

            $candidature = Candidature::create([
                'id_candidat' => $candidat->id_candidat,
                'id_type_demande' => $typeDemandeId,
                'id_offre' => $validated['id_offre'] ?? null,
                'id_domaine' => $validated['id_domaine'] ?? null,
                'id_statut_candidature' => $recueStatusId,
                'dans_vivier' => empty($validated['id_offre']),
                'poste_souhaite' => $validated['poste_souhaite'] ?? null,
                'message' => $validated['message_motivation'] ?? null,
                'canal_depot' => 'site_externe',
                'id_utilisateur_depot' => null,
            ]);

            HistoriqueStatut::create([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $recueStatusId,
                'date_changement' => now(),
                'commentaire' => 'Réception et importation automatique depuis ' . ($validated['source'] ?? 'e-mail / site externe'),
                'id_utilisateur' => null,
            ]);

            if ($request->hasFile('cv')) {
                $file = $request->file('cv');
                $path = $file->store('documents/cv', 'public');
                Document::create([
                    'id_candidature' => $candidature->id_candidature,
                    'type_document' => 'CV',
                    'nom_fichier' => $file->getClientOriginalName(),
                    'chemin_fichier' => $path,
                    'taille_octets' => $file->getSize(),
                    'mime_type' => $file->getClientMimeType(),
                    'description' => 'Curriculum Vitae (Import Externe)',
                ]);
            }

            return $candidature;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Candidature importée avec succès depuis la source externe.',
            'data' => [
                'id_candidature' => $candidature->id_candidature,
                'candidat' => $candidature->candidat->only(['nom', 'prenom', 'email']),
                'source' => $candidature->postule_depuis,
            ],
        ], 201);
    }

    /**
     * Saisie manuelle d'une candidature par un utilisateur RH
     */
    public function saisirRh(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'id_offre' => ['nullable', 'integer', 'exists:offre,id_offre'],
            'id_domaine' => ['nullable', 'integer', 'exists:domaine,id_domaine'],
            'poste_souhaite' => ['nullable', 'string', 'max:200'],
            'message_motivation' => ['nullable', 'string'],
            'cv' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
            'photo' => ['nullable', 'file', 'image', 'max:5120'],
        ]);

        if (!empty($validated['id_offre'])) {
            $offre = Offre::find($validated['id_offre']);
            if ($offre) {
                $publieeStatusIds = DB::table('statut_offre')->whereIn('libelle', ['Publiee', 'Publiée'])->pluck('id_statut_offre')->toArray();
                if (!empty($publieeStatusIds) && !in_array((int) $offre->id_statut_offre, $publieeStatusIds, true)) {
                    return response()->json([
                        'message' => 'Une candidature RH ne peut être enregistrée que sur une offre avec le statut Publiée.',
                    ], 422);
                }
            }
        }

        $candidature = DB::transaction(function () use ($request, $validated) {
            $candidat = Candidat::firstOrCreate(
                ['email' => strtolower(trim($validated['email']))],
                [
                    'nom' => trim($validated['nom']),
                    'prenom' => trim($validated['prenom']),
                    'telephone' => $validated['telephone'] ?? null,
                ]
            );

            $recueStatusId = DB::table('statut_candidature')->whereIn('libelle', ['Reçue', 'Recue'])->value('id_statut_candidature');
            if (!$recueStatusId) {
                $recueStatusId = DB::table('statut_candidature')->insertGetId([
                    'libelle' => 'Reçue',
                    'ordre_workflow' => 1,
                ], 'id_statut_candidature');
            }

            $typeDemandeId = !empty($validated['id_offre'])
                ? DB::table('type_demande')->where('libelle', 'Offre')->value('id_type_demande')
                : DB::table('type_demande')->where('libelle', 'Spontanee')->value('id_type_demande');

            $candidature = Candidature::create([
                'id_candidat' => $candidat->id_candidat,
                'id_type_demande' => $typeDemandeId,
                'id_offre' => $validated['id_offre'] ?? null,
                'id_domaine' => $validated['id_domaine'] ?? null,
                'id_statut_candidature' => $recueStatusId,
                'dans_vivier' => empty($validated['id_offre']),
                'poste_souhaite' => $validated['poste_souhaite'] ?? null,
                'message' => $validated['message_motivation'] ?? null,
                'canal_depot' => 'rh_manuel',
                'id_utilisateur_depot' => auth()->id(),
            ]);

            HistoriqueStatut::create([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $recueStatusId,
                'date_changement' => now(),
                'commentaire' => 'Candidature saisie manuellement par l\'agent RH',
                'id_utilisateur' => auth()->id(),
            ]);

            if ($request->hasFile('cv')) {
                $file = $request->file('cv');
                $path = $file->store('documents/cv', 'public');
                Document::create([
                    'id_candidature' => $candidature->id_candidature,
                    'type_document' => 'CV',
                    'nom_fichier' => $file->getClientOriginalName(),
                    'chemin_fichier' => $path,
                    'taille_octets' => $file->getSize(),
                    'mime_type' => $file->getClientMimeType(),
                    'description' => 'Curriculum Vitae (Saisie RH)',
                ]);
            }

            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $path = $file->store('documents/photos', 'public');
                Document::create([
                    'id_candidature' => $candidature->id_candidature,
                    'type_document' => 'Photo',
                    'nom_fichier' => $file->getClientOriginalName(),
                    'chemin_fichier' => $path,
                    'taille_octets' => $file->getSize(),
                    'mime_type' => $file->getClientMimeType(),
                    'description' => 'Photo de profil (Saisie RH)',
                ]);
            }

            return $candidature;
        });

        return response()->json([
            'message' => 'Candidature saisie manuellement avec succès par le service RH.',
            'data' => [
                'id_candidature' => $candidature->id_candidature,
                'candidat' => $candidature->candidat->only(['nom', 'prenom', 'email']),
            ],
        ], 201);
    }

    /**
     * List all candidatures for Back-Office RH
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) ($request->input('per_page', 15));
        $query = Candidature::query()
            ->with(['candidat', 'offre.direction', 'domaine.direction', 'typeDemande', 'statut', 'documents']);

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->whereHas('candidat', function ($sub) use ($q) {
                $sub->where('nom', 'like', "%{$q}%")
                    ->orWhere('prenom', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if ($request->filled('statut')) {
            $query->where('id_statut_candidature', $request->input('statut'));
        }

        if ($request->filled('offre')) {
            $query->where('id_offre', $request->input('offre'));
        }

        if ($request->filled('type_demande')) {
            $type = strtolower($request->input('type_demande'));
            if ($type === 'offre' || $type === '1') {
                $query->whereNotNull('id_offre');
            } elseif ($type === 'spontanee' || $type === '2') {
                $query->whereNull('id_offre');
            }
        }

        if ($request->filled('canal_depot')) {
            $query->where('canal_depot', $request->input('canal_depot'));
        }

        if ($request->filled('direction')) {
            $directionId = (int) $request->input('direction');
            $query->where(function ($sub) use ($directionId) {
                $sub->whereHas('offre', function ($o) use ($directionId) {
                    $o->where('id_direction', $directionId);
                })
                ->orWhereHas('domaine', function ($d) use ($directionId) {
                    $d->where('id_direction', $directionId)
                      ->where('valide', true);
                });
            });
        }

        $candidatures = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($candidatures);
    }

    /**
     * Show single candidature details for Back-Office RH
     */
    public function show(int $id): JsonResponse
    {
        $candidature = Candidature::with(['candidat', 'offre.direction', 'domaine.direction', 'typeDemande', 'statut', 'documents', 'historique.statut', 'historique.utilisateur'])
            ->findOrFail($id);

        if (! $candidature->vue) {
            $candidature->update(['vue' => true]);
        }

        return response()->json(['data' => $candidature]);
    }

    /**
     * Marquer une candidature comme vue par le RH
     */
    public function marquerVue(int $id): JsonResponse
    {
        $candidature = Candidature::findOrFail($id);

        if (! $candidature->vue) {
            $candidature->update(['vue' => true]);
        }

        return response()->json([
            'message' => 'Candidature marquée comme vue.',
            'data' => $candidature,
        ]);
    }

    /**
     * Update candidature status (RH workflow transition)
     */
    public function updateStatut(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'id_statut_candidature' => ['required', 'integer', 'exists:statut_candidature,id_statut_candidature'],
            'commentaire' => ['nullable', 'string'],
        ]);

        $candidature = Candidature::findOrFail($id);

        if ($candidature->dans_vivier) {
            return response()->json([
                'message' => 'Impossible de modifier le statut d\'une candidature enregistrée dans le vivier RH. Retirez-la du vivier pour changer son statut.',
            ], 422);
        }

        $oldStatusId = $candidature->id_statut_candidature;
        $newStatusId = (int) $validated['id_statut_candidature'];

        if ($oldStatusId === $newStatusId) {
            return response()->json(['message' => 'La candidature est déjà dans ce statut.'], 422);
        }

        $currentStatut = StatutCandidature::find($oldStatusId);
        $newStatut = StatutCandidature::find($newStatusId);

        if ($currentStatut && $newStatut && (int) $newStatut->ordre_workflow <= (int) $currentStatut->ordre_workflow) {
            return response()->json([
                'message' => 'Impossible de basculer vers un statut ayant un ordre de workflow inférieur ou égal à l\'actuel.',
            ], 422);
        }

        DB::transaction(function () use ($candidature, $oldStatusId, $newStatusId, $validated) {
            $candidature->update(['id_statut_candidature' => $newStatusId]);

            HistoriqueStatut::create([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_candidature' => $newStatusId,
                'date_changement' => now(),
                'commentaire' => $validated['commentaire'] ?? 'Changement de statut',
                'id_utilisateur' => auth()->id() ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Statut mis à jour avec succès.',
            'data' => $candidature->fresh(['statut', 'historique']),
        ]);
    }

    /**
     * Get referentiel of candidature statuses
     */
    public function statuts(): JsonResponse
    {
        $statuts = StatutCandidature::orderBy('ordre_workflow')->get();
        return response()->json(['data' => $statuts]);
    }

    /**
     * Toggle dans_vivier boolean on candidature
     */
    public function updateVivierStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'dans_vivier' => ['required', 'boolean'],
        ]);

        $candidature = Candidature::with('statut')->findOrFail($id);

        if ($validated['dans_vivier']) {
            $statusLibelle = strtolower(trim($candidature->statut?->libelle ?? ''));
            if ($statusLibelle === 'retenue' || $statusLibelle === 'retenu') {
                return response()->json([
                    'message' => 'Une candidature ayant le statut "Retenue" ne peut pas être placée dans le vivier RH.',
                ], 422);
            }
        }

        $candidature->update(['dans_vivier' => $validated['dans_vivier']]);

        return response()->json([
            'message' => $validated['dans_vivier'] ? 'Candidature marquée comme étant dans le vivier.' : 'Candidature retirée du vivier.',
            'data' => $candidature,
        ]);
    }
}
