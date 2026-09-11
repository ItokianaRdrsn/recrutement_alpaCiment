<?php

namespace App\Repositories\Eloquent;

use App\Models\Candidature;
use App\Models\Document;
use App\Models\HistoriqueStatut;
use App\Models\StatutCandidature;
use App\Repositories\Contracts\CandidatureRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class EloquentCandidatureRepository implements CandidatureRepositoryInterface
{
    public function paginateFiltered(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Candidature::query()
            ->with(['candidat', 'offre.direction', 'domaine.direction', 'typeDemande', 'statut', 'documents']);

        if (!empty($filters['q'])) {
            $q = trim($filters['q']);
            $query->whereHas('candidat', function ($sub) use ($q) {
                $sub->where('nom', 'like', "%{$q}%")
                    ->orWhere('prenom', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if (!empty($filters['statut'])) {
            $query->where('id_statut_candidature', $filters['statut']);
        }

        if (!empty($filters['offre'])) {
            $query->where('id_offre', $filters['offre']);
        }

        if (!empty($filters['type_demande'])) {
            $type = strtolower((string) $filters['type_demande']);
            if ($type === 'offre' || $type === '1') {
                $query->whereNotNull('id_offre');
            } elseif ($type === 'spontanee' || $type === '2') {
                $query->whereNull('id_offre');
            }
        }

        if (!empty($filters['canal_depot'])) {
            $query->where('canal_depot', $filters['canal_depot']);
        }

        if (!empty($filters['direction'])) {
            $directionId = (int) $filters['direction'];
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

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function findById(int $id, array $relations = []): Candidature
    {
        $query = Candidature::query();
        if (!empty($relations)) {
            $query->with($relations);
        } else {
            $query->with(['candidat', 'offre.direction', 'domaine.direction', 'typeDemande', 'statut', 'documents', 'historique.statut', 'historique.utilisateur']);
        }

        return $query->findOrFail($id);
    }

    public function create(array $attributes): Candidature
    {
        return Candidature::create($attributes);
    }

    public function update(Candidature $candidature, array $attributes): bool
    {
        return $candidature->update($attributes);
    }

    public function markAsViewed(Candidature $candidature): bool
    {
        if (!$candidature->vue) {
            return $candidature->update(['vue' => true]);
        }
        return true;
    }

    public function createHistorique(array $attributes): HistoriqueStatut
    {
        return HistoriqueStatut::create($attributes);
    }

    public function createDocument(array $attributes): Document
    {
        return Document::create($attributes);
    }

    public function getStatusIdByLibelle(array $libelles): ?int
    {
        $id = DB::table('statut_candidature')
            ->whereIn('libelle', $libelles)
            ->value('id_statut_candidature');

        if (!$id && in_array('Reçue', $libelles, true)) {
            $id = DB::table('statut_candidature')->insertGetId([
                'libelle' => 'Reçue',
                'ordre_workflow' => 1,
            ], 'id_statut_candidature');
        }

        return $id ? (int) $id : null;
    }

    public function getTypeDemandeIdByLibelle(string $libelle): ?int
    {
        $id = DB::table('type_demande')->where('libelle', $libelle)->value('id_type_demande');
        return $id ? (int) $id : null;
    }

    public function getStatuts(): Collection
    {
        return StatutCandidature::orderBy('ordre_workflow')->get();
    }
}
