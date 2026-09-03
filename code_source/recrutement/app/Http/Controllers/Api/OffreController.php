<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OffreResource;
use App\Models\Offre;
use App\Models\StatutOffre;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OffreController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'direction' => ['nullable', 'integer', 'exists:direction,id_direction'],
            'statut' => ['nullable', 'integer', 'exists:statut_offre,id_statut_offre'],
            'type_contrat' => ['nullable', 'integer', 'exists:type_contrat,id_type_contrat'],
            'q' => ['nullable', 'string', 'max:150'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $perPage = (int) ($filters['per_page'] ?? 15);

        $publieeId = $this->statusId('Publiee');
        $brouillonId = $this->statusId('Brouillon');
        $clotureeId = $this->statusId('Cloturee');

        $offres = Offre::query()
            ->with($this->resourceRelations())
            ->when($filters['direction'] ?? null, fn ($query, int $direction) => $query->where('id_direction', $direction))
            ->when($filters['statut'] ?? null, fn ($query, int $statut) => $query->where('id_statut_offre', $statut))
            ->when($filters['type_contrat'] ?? null, fn ($query, int $typeContrat) => $query->where('id_type_contrat', $typeContrat))
            ->when($filters['q'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('titre_poste', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('lieu', 'like', "%{$search}%");
                });
            })
            ->orderByRaw("
                CASE 
                    WHEN id_statut_offre = {$publieeId} THEN 1
                    WHEN id_statut_offre = {$brouillonId} THEN 2
                    WHEN id_statut_offre = {$clotureeId} THEN 3
                    ELSE 4
                END ASC
            ")
            ->orderByDesc('date_publication')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return OffreResource::collection($offres);
    }

    public function publicIndex(Request $request): AnonymousResourceCollection
    {
        $publieeId = $this->statusId('Publiee');

        $offres = Offre::query()
            ->with($this->resourceRelations())
            ->where('id_statut_offre', $publieeId)
            ->orderByDesc('date_publication')
            ->orderByDesc('created_at')
            ->paginate((int) ($request->input('per_page', 100)));

        return OffreResource::collection($offres);
    }

    public function publicShow(string $identifier): OffreResource
    {
        $publieeId = $this->statusId('Publiee');
        $query = Offre::query()->with($this->resourceRelations())->where('id_statut_offre', $publieeId);

        if (is_numeric($identifier)) {
            $offre = $query->where('id_offre', (int) $identifier)->firstOrFail();
        } else {
            $offres = $query->get();
            $offre = $offres->first(function ($o) use ($identifier) {
                return \Illuminate\Support\Str::slug($o->titre_poste) === $identifier ||
                       \Illuminate\Support\Str::slug($o->id_offre . '-' . $o->titre_poste) === $identifier;
            });

            if (!$offre) {
                abort(404, "L'offre n'est pas disponible ou est cloturee.");
            }
        }

        return new OffreResource($offre);
    }

    public function store(Request $request): OffreResource
    {
        $data = $this->validatedData($request);
        $data['id_statut_offre'] = $data['id_statut_offre'] ?? $this->statusId('Brouillon');

        $offre = DB::transaction(function () use ($request, $data) {
            $offre = Offre::query()->create($data);
            $this->syncNestedRelations($request, $offre);
            return $offre;
        });

        return new OffreResource($offre->load($this->resourceRelations()));
    }

    public function show(Offre $offre): OffreResource
    {
        return new OffreResource($offre->load($this->resourceRelations()));
    }

    public function update(Request $request, Offre $offre): OffreResource
    {
        $data = $this->validatedData($request);

        if (isset($data['id_statut_offre']) && (int) $data['id_statut_offre'] !== (int) $offre->id_statut_offre) {
            $this->validateWorkflowProgression($offre, (int) $data['id_statut_offre']);
        }

        DB::transaction(function () use ($request, $offre, $data) {
            $offre->update($data);
            $this->syncNestedRelations($request, $offre);
        });

        return new OffreResource($offre->load($this->resourceRelations()));
    }

    public function publish(Offre $offre): OffreResource
    {
        $targetId = $this->statusId('Publiee');
        $this->validateWorkflowProgression($offre, $targetId);

        $offre->forceFill([
            'id_statut_offre' => $targetId,
            'date_publication' => $offre->date_publication ?? today(),
        ])->save();

        return new OffreResource($offre->load($this->resourceRelations()));
    }

    public function close(Offre $offre): OffreResource
    {
        $targetId = $this->statusId('Cloturee');
        $this->validateWorkflowProgression($offre, $targetId);

        $offre->forceFill([
            'id_statut_offre' => $targetId,
        ])->save();

        return new OffreResource($offre->load($this->resourceRelations()));
    }

    private function validateWorkflowProgression(Offre $offre, int $targetStatusId): void
    {
        $currentStatusId = (int) $offre->id_statut_offre;

        if ($currentStatusId === $targetStatusId) {
            abort(422, "L'offre est deja dans ce statut.");
        }

        $currentOrder = StatutOffre::where('id_statut_offre', $currentStatusId)->value('ordre_workflow') ?? $currentStatusId;
        $targetOrder = StatutOffre::where('id_statut_offre', $targetStatusId)->value('ordre_workflow') ?? $targetStatusId;

        if ($targetOrder <= $currentOrder) {
            abort(422, "Regression de statut interdite : le nouveau statut (ordre {$targetOrder}) doit avoir un ordre d'avancement strictly superieur au statut actuel (ordre {$currentOrder}).");
        }
    }

    public function destroy(Offre $offre): Response
    {
        $offre->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedData(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'titre_poste' => ['required', 'string', 'max:200'],
            'id_direction' => ['required', 'integer', 'exists:direction,id_direction'],
            'description' => ['nullable', 'string'],
            'id_lieu' => ['nullable', 'integer', 'exists:lieu,id_lieu'],
            'lieu' => ['nullable', 'string', 'max:150'],
            'id_type_contrat' => ['nullable', 'integer', 'exists:type_contrat,id_type_contrat'],
            'date_publication' => ['nullable', 'date'],
            'date_limite' => ['nullable', 'date', 'after_or_equal:date_publication'],
            'id_statut_offre' => ['nullable', 'integer', 'exists:statut_offre,id_statut_offre'],
        ]);

        $validator->after(function ($validator) use ($request): void {
            if ($request->has('profils')) {
                $profils = $request->input('profils');
                if (!is_array($profils)) {
                    $validator->errors()->add('profils', 'Le champ profils doit etre un tableau.');
                }
            }
            if ($request->has('missions')) {
                $missions = $request->input('missions');
                if (!is_array($missions)) {
                    $validator->errors()->add('missions', 'Le champ missions doit etre un tableau.');
                }
            }
            if ($request->has('formations')) {
                $formations = $request->input('formations');
                if (!is_array($formations)) {
                    $validator->errors()->add('formations', 'Le champ formations doit etre un tableau.');
                }
            }
            if ($request->has('competences')) {
                $competences = $request->input('competences');
                if (!is_array($competences)) {
                    $validator->errors()->add('competences', 'Le champ competences doit etre un tableau.');
                }
            }
        });

        $data = $validator->validate();
        if (empty($data['id_lieu'])) {
            $data['id_lieu'] = 1; // Fallback par défaut Antananarivo
        }
        return $data;
    }

    private function syncNestedRelations(Request $request, Offre $offre): void
    {
        if ($request->has('profils')) {
            $offre->profils()->delete();
            $profils = $request->input('profils', []);
            if (is_array($profils)) {
                foreach ($profils as $item) {
                    if (is_array($item) && (!empty(trim($item['description'] ?? '')) || !empty($item['valeur_attendue']))) {
                        $offre->profils()->create([
                            'description' => trim($item['description'] ?? ''),
                            'type_valeur' => $item['type_valeur'] ?? null,
                            'valeur_min' => $item['valeur_min'] ?? null,
                            'valeur_max' => $item['valeur_max'] ?? null,
                            'valeur_attendue' => $item['valeur_attendue'] ?? null,
                            'unite_valeur' => $item['unite_valeur'] ?? null,
                        ]);
                    }
                }
            }
        } elseif ($request->has('profil')) {
            $profilData = $request->input('profil');
            if (is_array($profilData) && !empty(array_filter($profilData))) {
                $offre->profils()->delete();
                $offre->profils()->create([
                    'description' => $profilData['description'] ?? null,
                    'type_valeur' => $profilData['type_valeur'] ?? null,
                    'valeur_min' => $profilData['valeur_min'] ?? null,
                    'valeur_max' => $profilData['valeur_max'] ?? null,
                    'valeur_attendue' => $profilData['valeur_attendue'] ?? null,
                    'unite_valeur' => $profilData['unite_valeur'] ?? null,
                ]);
            }
        }

        if ($request->has('missions')) {
            $offre->missions()->delete();
            $missions = $request->input('missions', []);
            if (is_array($missions)) {
                foreach ($missions as $index => $item) {
                    if (is_array($item) && !empty(trim($item['description'] ?? ''))) {
                        $offre->missions()->create([
                            'description' => trim($item['description']),
                            'ordre' => (int) ($item['ordre'] ?? ($index + 1)),
                        ]);
                    }
                }
            }
        }

        if ($request->has('formations')) {
            $offre->formations()->delete();
            $formations = $request->input('formations', []);
            if (is_array($formations)) {
                foreach ($formations as $item) {
                    if (is_array($item) && (!empty($item['id_niveau_min']) || !empty($item['niveau_min']) || !empty($item['domaine']))) {
                        $offre->formations()->create([
                            'id_niveau_min' => $item['id_niveau_min'] ?? null,
                            'id_niveau_max' => $item['id_niveau_max'] ?? null,
                            'niveau_min' => $item['niveau_min'] ?? null,
                            'niveau_max' => $item['niveau_max'] ?? null,
                            'domaine' => $item['domaine'] ?? null,
                            'obligatoire' => (bool) ($item['obligatoire'] ?? true),
                        ]);
                    }
                }
            }
        }

        if ($request->has('competences')) {
            $competences = $request->input('competences', []);
            $syncData = [];
            if (is_array($competences)) {
                foreach ($competences as $item) {
                    if (is_array($item) && !empty($item['id_competence'])) {
                        $syncData[$item['id_competence']] = [
                            'niveau_requis' => $item['niveau_requis'] ?? null,
                        ];
                    }
                }
            }
            $offre->competences()->sync($syncData);
        }
    }

    /**
     * Dynamic database lookup for statut_offre ID
     */
    private function statusId(string $type): int
    {
        $query = DB::table('statut_offre');
        if ($type === 'Publiee') {
            $query->whereIn('libelle', ['Publiee', 'Publiée']);
        } elseif ($type === 'Cloturee') {
            $query->whereIn('libelle', ['Cloturee', 'Clôturée']);
        } else {
            $query->whereIn('libelle', ['Brouillon', 'brouillon']);
        }

        $id = $query->value('id_statut_offre');

        if (!$id) {
            return match ($type) {
                'Publiee' => 2,
                'Cloturee' => 3,
                default => 1,
            };
        }

        return (int) $id;
    }

    /**
     * @return list<string>
     */
    private function resourceRelations(): array
    {
        return ['direction', 'statut', 'typeContrat', 'profil', 'profils', 'missions', 'formations', 'competences.type'];
    }
}
