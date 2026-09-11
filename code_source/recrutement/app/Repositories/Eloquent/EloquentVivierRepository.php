<?php

namespace App\Repositories\Eloquent;

use App\Models\CandidatExperience;
use App\Models\CandidatFormation;
use App\Models\Candidature;
use App\Models\CvExtractionOcr;
use App\Models\VivierCandidat;
use App\Repositories\Contracts\VivierRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EloquentVivierRepository implements VivierRepositoryInterface
{
    public function getVivierEntries(array $filters): Collection
    {
        $query = VivierCandidat::with(['candidat', 'direction', 'domaine']);

        if (!empty($filters['q'])) {
            $q = trim($filters['q']);
            $query->whereHas('candidat', function ($sub) use ($q) {
                $sub->where('nom', 'ILIKE', "%{$q}%")
                    ->orWhere('prenom', 'ILIKE', "%{$q}%")
                    ->orWhere('email', 'ILIKE', "%{$q}%");
            });
        }

        if (!empty($filters['direction'])) {
            $query->where('id_direction', $filters['direction']);
        }

        if (!empty($filters['domaine'])) {
            $query->where('id_domaine', $filters['domaine']);
        }

        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function getCandidaturesEnVivier(array $filters): Collection
    {
        $candQuery = Candidature::with(['candidat', 'offre.direction', 'domaine.direction'])
            ->where('dans_vivier', true);

        if (!empty($filters['q'])) {
            $q = trim($filters['q']);
            $candQuery->whereHas('candidat', function ($sub) use ($q) {
                $sub->where('nom', 'ILIKE', "%{$q}%")
                    ->orWhere('prenom', 'ILIKE', "%{$q}%")
                    ->orWhere('email', 'ILIKE', "%{$q}%");
            });
        }

        if (!empty($filters['direction'])) {
            $dirId = (int) $filters['direction'];
            $candQuery->where(function ($qDir) use ($dirId) {
                $qDir->whereHas('offre', function ($s) use ($dirId) {
                    $s->where('id_direction', $dirId);
                })->orWhereHas('domaine', function ($s) use ($dirId) {
                    $s->where('id_direction', $dirId);
                });
            });
        }

        return $candQuery->orderByDesc('updated_at')->get();
    }

    public function findById(int $id): VivierCandidat
    {
        return VivierCandidat::findOrFail($id);
    }

    public function updateOrCreate(array $matchAttributes, array $values): VivierCandidat
    {
        return VivierCandidat::updateOrCreate($matchAttributes, $values);
    }

    public function delete(VivierCandidat $vivier): bool
    {
        return $vivier->delete();
    }

    public function getExperiencesByCandidature(int $idCandidature): Collection
    {
        if (Schema::hasColumn('candidat_experience_professionnelle', 'id_candidature')) {
            return CandidatExperience::where('id_candidature', $idCandidature)->orderByDesc('date_debut')->get();
        }
        return new Collection();
    }

    public function getFormationsByCandidature(int $idCandidature): Collection
    {
        if (Schema::hasColumn('candidat_formation', 'id_candidature')) {
            return CandidatFormation::with('niveauRel')->where('id_candidature', $idCandidature)->orderByDesc('id_formation')->get();
        }
        return new Collection();
    }

    public function getCompetencesByCandidature(int $idCandidature): SupportCollection
    {
        if (Schema::hasColumn('candidat_competence', 'id_candidature')) {
            return DB::table('candidat_competence')
                ->join('competence', 'candidat_competence.id_competence', '=', 'competence.id_competence')
                ->join('type_competence', 'competence.id_type_competence', '=', 'type_competence.id_type_competence')
                ->where('candidat_competence.id_candidature', $idCandidature)
                ->select(
                    'competence.id_competence',
                    'competence.nom_competence',
                    'type_competence.libelle as type_competence',
                    'candidat_competence.niveau',
                    'candidat_competence.valide',
                    'candidat_competence.source'
                )->get();
        }
        return collect();
    }

    public function syncCandidatCompetence(int $idCandidature, int $idCompetence, array $data): void
    {
        DB::table('candidat_competence')->updateOrInsert(
            [
                'id_candidature' => $idCandidature,
                'id_competence' => $idCompetence,
            ],
            $data
        );
    }

    public function createExperience(array $attributes): CandidatExperience
    {
        return CandidatExperience::create($attributes);
    }

    public function createFormation(array $attributes): CandidatFormation
    {
        return CandidatFormation::create($attributes);
    }

    public function getExtractionOcrByCandidature(int $idCandidature): ?CvExtractionOcr
    {
        return CvExtractionOcr::where('id_candidature', $idCandidature)->first();
    }

    public function updateOrCreateExtractionOcr(int $idCandidature, array $attributes): CvExtractionOcr
    {
        return CvExtractionOcr::updateOrCreate(
            ['id_candidature' => $idCandidature],
            $attributes
        );
    }
}
