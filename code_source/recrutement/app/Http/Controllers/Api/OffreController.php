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
    private const STATUT_BROUILLON = 'Brouillon';
    private const STATUT_PUBLIEE = 'Publiee';
    private const STATUT_CLOTUREE = 'Cloturee';

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'direction' => ['nullable', 'integer', 'exists:direction,id_direction'],
            'statut' => ['nullable', 'integer', 'exists:statut_offre,id_statut_offre'],
            'type_contrat' => ['nullable', 'integer', 'exists:type_contrat,id_type_contrat'],
            'q' => ['nullable', 'string', 'max:150'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $perPage = (int) ($filters['per_page'] ?? 15);

        $publieeId = $this->statusId(self::STATUT_PUBLIEE);
        $brouillonId = $this->statusId(self::STATUT_BROUILLON);
        $clotureeId = $this->statusId(self::STATUT_CLOTUREE);

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
        $publieeStatusId = $this->statusId(self::STATUT_PUBLIEE);

        $offres = Offre::query()
            ->with($this->resourceRelations())
            ->where('id_statut_offre', $publieeStatusId)
            ->where(function ($query): void {
                $query->whereNull('date_limite')
                    ->orWhere('date_limite', '>=', today());
            })
            ->orderByDesc('date_publication')
            ->paginate(15);

        return OffreResource::collection($offres);
    }

    public function publicShow(Offre $offre): OffreResource
    {
        $publieeStatusId = $this->statusId(self::STATUT_PUBLIEE);

        if ((int) $offre->id_statut_offre !== $publieeStatusId) {
            abort(404, "L'offre n'est pas disponible ou est cloturee.");
        }

        return new OffreResource($offre->load($this->resourceRelations()));
    }

    public function store(Request $request): OffreResource
    {
        $data = $this->validatedData($request);
        $data['id_statut_offre'] = $data['id_statut_offre'] ?? $this->statusId(self::STATUT_BROUILLON);

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
        $targetId = $this->statusId(self::STATUT_PUBLIEE);
        $this->validateWorkflowProgression($offre, $targetId);

        $offre->forceFill([
            'id_statut_offre' => $targetId,
            'date_publication' => $offre->date_publication ?? today(),
        ])->save();

        return new OffreResource($offre->load($this->resourceRelations()));
    }

    public function close(Offre $offre): OffreResource
    {
        $targetId = $this->statusId(self::STATUT_CLOTUREE);
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

        $currentOrder = StatutOffre::where('id_statut_offre', $currentStatusId)->value('ordre_workflow') ?? 0;
        $targetOrder = StatutOffre::where('id_statut_offre', $targetStatusId)->value('ordre_workflow') ?? 0;

        if ($targetOrder <= $currentOrder) {
            abort(422, "Regression de statut interdite : le nouveau statut (ordre {$targetOrder}) doit avoir un ordre d'avancement strictement superieur au statut actuel (ordre {$currentOrder}).");
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
            'lieu' => ['nullable', 'string', 'max:200'],
            'id_type_contrat' => ['nullable', 'integer', 'exists:type_contrat,id_type_contrat'],
            'date_publication' => ['nullable', 'date'],
            'date_limite' => ['nullable', 'date'],
            'id_statut_offre' => ['nullable', 'integer', 'exists:statut_offre,id_statut_offre'],
        ]);

        $validator->after(function ($validator) use ($request): void {
            $datePublication = $request->input('date_publication');
            $dateLimite = $request->input('date_limite');
            $publicationTimestamp = strtotime((string) $datePublication);
            $limiteTimestamp = strtotime((string) $dateLimite);

            if ($publicationTimestamp !== false && $limiteTimestamp !== false && $limiteTimestamp < $publicationTimestamp) {
                $validator->errors()->add('date_limite', 'La date limite doit etre posterieure ou egale a la date de publication.');
            }
        });

        return $validator->validate();
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
                    if (is_array($item) && (!empty($item['niveau_min']) || !empty($item['domaine']))) {
                        $offre->formations()->create([
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

    private function statusId(string $libelle): int
    {
        $statusId = StatutOffre::query()
            ->where('libelle', $libelle)
            ->value('id_statut_offre');

        if (! $statusId) {
            abort(422, "Le statut {$libelle} n'existe pas dans le referentiel.");
        }

        return (int) $statusId;
    }

    /**
     * @return list<string>
     */
    private function resourceRelations(): array
    {
        return ['direction', 'statut', 'typeContrat', 'profil', 'profils', 'missions', 'formations', 'competences.type'];
    }
}
