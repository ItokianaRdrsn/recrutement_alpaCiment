<?php

namespace App\Repositories\Eloquent;

use App\Models\Offre;
use App\Models\StatutOffre;
use App\Repositories\Contracts\OffreRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class EloquentOffreRepository implements OffreRepositoryInterface
{
    public function resourceRelations(): array
    {
        return [
            'direction',
            'statut',
            'typeContrat',
            'profil',
            'profils',
            'missions',
            'formations.niveauMin',
            'formations.niveauMax',
            'competences.type',
            'lieuRef',
        ];
    }

    public function paginateFiltered(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $publieeId = $this->getStatusId('Publiee') ?? 0;
        $brouillonId = $this->getStatusId('Brouillon') ?? 0;
        $clotureeId = $this->getStatusId('Cloturee') ?? 0;

        return Offre::query()
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
    }

    public function paginatePublished(int $perPage = 100): LengthAwarePaginator
    {
        $publieeId = $this->getStatusId('Publiee') ?? 0;

        return Offre::query()
            ->with($this->resourceRelations())
            ->where('id_statut_offre', $publieeId)
            ->orderByDesc('date_publication')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function findById(int $id, array $relations = []): Offre
    {
        $query = Offre::query();
        $query->with(!empty($relations) ? $relations : $this->resourceRelations());
        return $query->findOrFail($id);
    }

    public function findPublishedBySlugOrId(string $identifier, array $relations = []): ?Offre
    {
        $publieeId = $this->getStatusId('Publiee') ?? 0;
        $query = Offre::query()
            ->with(!empty($relations) ? $relations : $this->resourceRelations())
            ->where('id_statut_offre', $publieeId);

        if (is_numeric($identifier)) {
            return $query->where('id_offre', (int) $identifier)->first();
        }

        $offres = $query->get();
        return $offres->first(function ($o) use ($identifier) {
            return Str::slug($o->titre_poste) === $identifier ||
                   Str::slug($o->id_offre . '-' . $o->titre_poste) === $identifier;
        });
    }

    public function create(array $attributes): Offre
    {
        return Offre::create($attributes);
    }

    public function update(Offre $offre, array $attributes): bool
    {
        return $offre->update($attributes);
    }

    public function delete(Offre $offre): bool
    {
        return $offre->delete();
    }

    public function getStatusId(string $libelle): ?int
    {
        $status = StatutOffre::where('libelle', $libelle)->first();
        return $status ? (int) $status->id_statut_offre : null;
    }

    public function syncNestedRelations(Offre $offre, array $relationsData): void
    {
        // 1. Profil unique (legacy)
        if (array_key_exists('profil', $relationsData)) {
            if ($relationsData['profil']) {
                $offre->profil()->updateOrCreate([], $relationsData['profil']);
            } else {
                $offre->profil()->delete();
            }
        }

        // 2. Profils multiples
        if (array_key_exists('profils', $relationsData) && is_array($relationsData['profils'])) {
            $offre->profils()->delete();
            foreach ($relationsData['profils'] as $pData) {
                if (!empty($pData['description'])) {
                    $offre->profils()->create($pData);
                }
            }
        }

        // 3. Missions
        if (array_key_exists('missions', $relationsData) && is_array($relationsData['missions'])) {
            $offre->missions()->delete();
            foreach ($relationsData['missions'] as $index => $mData) {
                if (!empty($mData['description'])) {
                    $offre->missions()->create([
                        'description' => $mData['description'],
                        'ordre' => $mData['ordre'] ?? ($index + 1),
                    ]);
                }
            }
        }

        // 4. Formations
        if (array_key_exists('formations', $relationsData) && is_array($relationsData['formations'])) {
            $offre->formations()->delete();
            foreach ($relationsData['formations'] as $fData) {
                $niveauMinText = $fData['niveau_min'] ?? null;
                $niveauMaxText = $fData['niveau_max'] ?? null;

                if (!empty($fData['id_niveau_min']) && empty($niveauMinText)) {
                    $niv = \App\Models\Niveau::find($fData['id_niveau_min']);
                    $niveauMinText = $niv?->libelle;
                }
                if (!empty($fData['id_niveau_max']) && empty($niveauMaxText)) {
                    $niv = \App\Models\Niveau::find($fData['id_niveau_max']);
                    $niveauMaxText = $niv?->libelle;
                }

                $offre->formations()->create([
                    'id_niveau_min' => $fData['id_niveau_min'] ?? null,
                    'id_niveau_max' => $fData['id_niveau_max'] ?? null,
                    'niveau_min' => $niveauMinText,
                    'niveau_max' => $niveauMaxText,
                    'domaine' => $fData['domaine'] ?? null,
                    'obligatoire' => $fData['obligatoire'] ?? false,
                ]);
            }
        }

        // 5. Compétences
        if (array_key_exists('competences', $relationsData) && is_array($relationsData['competences'])) {
            $syncData = [];
            foreach ($relationsData['competences'] as $cData) {
                if (!empty($cData['id_competence'])) {
                    $syncData[$cData['id_competence']] = [
                        'niveau_requis' => $cData['niveau_requis'] ?? 'Intermédiaire',
                    ];
                }
            }
            $offre->competences()->sync($syncData);
        }
    }
}
