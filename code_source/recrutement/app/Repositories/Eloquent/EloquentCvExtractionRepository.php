<?php

namespace App\Repositories\Eloquent;

use App\Models\Competence;
use App\Models\CvExtractionOcr;
use App\Repositories\Contracts\CvExtractionRepositoryInterface;
use Illuminate\Support\Facades\DB;

class EloquentCvExtractionRepository implements CvExtractionRepositoryInterface
{
    public function createExtraction(array $attributes): CvExtractionOcr
    {
        return CvExtractionOcr::create($attributes);
    }

    public function attachCompetence(int $candidatureId, string $nomCompetence, ?string $niveau = null, string $source = 'ocr'): void
    {
        $comp = Competence::firstOrCreate(
            ['nom_competence' => trim($nomCompetence)],
            ['id_type_competence' => 1]
        );

        DB::table('candidat_competence')->updateOrInsert(
            [
                'id_candidature' => $candidatureId,
                'id_competence' => $comp->id_competence,
            ],
            [
                'niveau' => $niveau,
                'source' => $source,
                'valide' => true,
            ]
        );
    }

    public function addExperience(int $candidatureId, array $attributes): void
    {
        $attributes['id_candidature'] = $candidatureId;
        $attributes['created_at'] = now();
        $attributes['updated_at'] = now();

        DB::table('candidat_experience_professionnelle')->insert($attributes);
    }

    public function addFormation(int $candidatureId, array $attributes): void
    {
        $attributes['id_candidature'] = $candidatureId;
        $attributes['created_at'] = now();
        $attributes['updated_at'] = now();

        DB::table('candidat_formation')->insert($attributes);
    }

    public function addProjet(int $candidatureId, array $attributes): void
    {
        $attributes['id_candidature'] = $candidatureId;
        $attributes['created_at'] = now();
        $attributes['updated_at'] = now();

        DB::table('candidat_projet')->insert($attributes);
    }
}
