<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OffreResource;
use App\Models\Offre;
use App\Models\StatutOffre;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
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

        $offres = Offre::query()
            ->with(['direction', 'statut', 'typeContrat'])
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
            ->orderByDesc('date_publication')
            ->orderBy('titre_poste')
            ->paginate($perPage)
            ->withQueryString();

        return OffreResource::collection($offres);
    }

    public function store(Request $request): OffreResource
    {
        $data = $this->validatedData($request);
        $data['id_statut_offre'] = $data['id_statut_offre'] ?? $this->statusId(self::STATUT_BROUILLON);

        $offre = Offre::query()->create($data);

        return new OffreResource($offre->load($this->resourceRelations()));
    }

    public function show(Offre $offre): OffreResource
    {
        return new OffreResource($offre->load($this->resourceRelations()));
    }

    public function update(Request $request, Offre $offre): OffreResource
    {
        $data = $this->validatedData($request);
        $data['id_statut_offre'] = $data['id_statut_offre'] ?? $this->statusId(self::STATUT_BROUILLON);

        $offre->update($data);

        return new OffreResource($offre->load($this->resourceRelations()));
    }

    public function publish(Offre $offre): OffreResource
    {
        $offre->forceFill([
            'id_statut_offre' => $this->statusId(self::STATUT_PUBLIEE),
            'date_publication' => $offre->date_publication ?? today(),
        ])->save();

        return new OffreResource($offre->load($this->resourceRelations()));
    }

    public function close(Offre $offre): OffreResource
    {
        $offre->forceFill([
            'id_statut_offre' => $this->statusId(self::STATUT_CLOTUREE),
        ])->save();

        return new OffreResource($offre->load($this->resourceRelations()));
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
        return ['direction', 'statut', 'typeContrat', 'profil', 'missions', 'formations'];
    }
}
