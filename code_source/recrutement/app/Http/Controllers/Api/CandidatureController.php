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
            'ville' => ['nullable', 'string', 'max:100'],
            'linkedin_url' => ['nullable', 'string', 'max:255'],
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
                    'ville' => $validated['ville'] ?? null,
                    'linkedin_url' => $validated['linkedin_url'] ?? null,
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
                'id_direction' => $offre->id_direction,
                'id_statut_candidature' => $recueStatusId,
                'date_candidature' => now(),
                'message_motivation' => $validated['message_motivation'] ?? null,
                'postule_depuis' => 'Formulaire web (temporaire)',
            ]);

            // Create initial status history
            HistoriqueStatut::create([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_precedent' => null,
                'id_statut_nouveau' => $recueStatusId,
                'modifie_par' => auth()->id() ?? null,
                'commentaire' => 'Candidature déposée sur l\'offre: ' . $offre->titre_poste,
                'created_at' => now(),
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
            'ville' => ['nullable', 'string', 'max:100'],
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
                    'ville' => $validated['ville'] ?? null,
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
                'id_direction' => null,
                'id_domaine' => $domaineId,
                'id_statut_candidature' => $recueStatusId,
                'date_candidature' => now(),
                'message_motivation' => $validated['message_motivation'] ?? null,
                'postule_depuis' => 'Formulaire web spontané (temporaire)',
            ]);

            HistoriqueStatut::create([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_precedent' => null,
                'id_statut_nouveau' => $recueStatusId,
                'modifie_par' => auth()->id() ?? null,
                'commentaire' => 'Dépôt de candidature spontanée' . (!empty($validated['poste_souhaite']) ? ' (Poste souhaité: ' . $validated['poste_souhaite'] . ')' : ''),
                'created_at' => now(),
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
                    'ville' => $validated['ville'] ?? null,
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
                'id_direction' => $validated['id_direction'] ?? null,
                'id_statut_candidature' => $recueStatusId,
                'date_candidature' => now(),
                'message_motivation' => $validated['message_motivation'] ?? null,
                'postule_depuis' => $validated['source'] ?? 'Import Webmail / Site Externe',
            ]);

            HistoriqueStatut::create([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_precedent' => null,
                'id_statut_nouveau' => $recueStatusId,
                'modifie_par' => null,
                'commentaire' => 'Réception et importation automatique depuis ' . ($validated['source'] ?? 'e-mail / site externe'),
                'created_at' => now(),
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
     * List all candidatures for Back-Office RH
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) ($request->input('per_page', 15));
        $query = Candidature::query()
            ->with(['candidat', 'offre', 'direction', 'domaine', 'statut', 'documents']);

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

        if ($request->filled('direction')) {
            $directionId = (int) $request->input('direction');
            $query->where(function ($sub) use ($directionId) {
                $sub->where('id_direction', $directionId)
                    ->orWhereHas('offre', function ($o) use ($directionId) {
                        $o->where('id_direction', $directionId);
                    })
                    ->orWhereHas('domaine', function ($d) use ($directionId) {
                        $d->where('id_direction', $directionId);
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
        $candidature = Candidature::with(['candidat', 'offre', 'direction', 'domaine', 'statut', 'documents', 'historique.statutNouveau', 'historique.statutPrecedent', 'historique.utilisateur'])
            ->findOrFail($id);

        return response()->json(['data' => $candidature]);
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
        $oldStatusId = $candidature->id_statut_candidature;
        $newStatusId = (int) $validated['id_statut_candidature'];

        if ($oldStatusId === $newStatusId) {
            return response()->json(['message' => 'La candidature est déjà dans ce statut.'], 422);
        }

        DB::transaction(function () use ($candidature, $oldStatusId, $newStatusId, $validated) {
            $candidature->update(['id_statut_candidature' => $newStatusId]);

            HistoriqueStatut::create([
                'id_candidature' => $candidature->id_candidature,
                'id_statut_precedent' => $oldStatusId,
                'id_statut_nouveau' => $newStatusId,
                'modifie_par' => auth()->id() ?? null,
                'commentaire' => $validated['commentaire'] ?? 'Changement de statut',
                'created_at' => now(),
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
}
