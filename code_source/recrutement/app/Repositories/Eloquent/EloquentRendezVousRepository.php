<?php

namespace App\Repositories\Eloquent;

use App\Models\HistoriqueStatut;
use App\Models\ModeRealisation;
use App\Models\RendezVous;
use App\Models\StatutCandidature;
use App\Models\StatutRendezVous;
use App\Models\TypeRendezVous;
use App\Models\User;
use App\Repositories\Contracts\RendezVousRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class EloquentRendezVousRepository implements RendezVousRepositoryInterface
{
    public function getReferentiels(): array
    {
        return [
            'types' => TypeRendezVous::all(),
            'statuts' => StatutRendezVous::orderBy('ordre_workflow')->get(),
            'modes' => ModeRealisation::all(),
            'responsables' => User::whereIn('role', ['rh', 'admin', 'manager'])
                ->select(['id_utilisateur', 'nom', 'email', 'role'])
                ->get(),
        ];
    }

    public function getRendezVous(array $filters = [], bool $paginate = false, int $perPage = 50): Collection|LengthAwarePaginator
    {
        $query = RendezVous::with([
            'candidature.candidat',
            'candidature.offre.direction',
            'candidature.domaine.direction',
            'utilisateur',
            'typeRendezVous',
            'statutRendezVous',
            'modeRealisation',
        ]);

        if (!empty($filters['date_debut'])) {
            $query->whereDate('date_debut', '>=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $query->whereDate('date_fin', '<=', $filters['date_fin']);
        }

        if (!empty($filters['id_utilisateur'])) {
            $query->where('id_utilisateur', $filters['id_utilisateur']);
        }

        if (!empty($filters['id_candidature'])) {
            $query->where('id_candidature', $filters['id_candidature']);
        }

        if (!empty($filters['id_statut_rendez_vous'])) {
            $query->where('id_statut_rendez_vous', $filters['id_statut_rendez_vous']);
        }

        if (!empty($filters['id_type_rendez_vous'])) {
            $query->where('id_type_rendez_vous', $filters['id_type_rendez_vous']);
        }

        $query->orderBy('date_debut', 'asc');

        return $paginate ? $query->paginate($perPage) : $query->get();
    }

    public function findById(int $id, array $relations = []): RendezVous
    {
        $query = RendezVous::query();
        if (!empty($relations)) {
            $query->with($relations);
        }
        return $query->findOrFail($id);
    }

    public function create(array $attributes): RendezVous
    {
        return RendezVous::create($attributes);
    }

    public function update(RendezVous $rendezVous, array $attributes): bool
    {
        return $rendezVous->update($attributes);
    }

    public function delete(RendezVous $rendezVous): bool
    {
        return (bool) $rendezVous->delete();
    }

    public function findTypeById(int $id): ?TypeRendezVous
    {
        return TypeRendezVous::find($id);
    }

    public function findStatutCandidatureById(int $id): ?StatutCandidature
    {
        return StatutCandidature::find($id);
    }

    public function createHistoriqueStatut(array $attributes): HistoriqueStatut
    {
        return HistoriqueStatut::create($attributes);
    }
}
