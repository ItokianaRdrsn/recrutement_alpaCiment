<?php

namespace App\Repositories\Contracts;

use App\Models\CvExtractionOcr;

interface CvExtractionRepositoryInterface
{
    public function createExtraction(array $attributes): CvExtractionOcr;
    public function attachCompetence(int $candidatureId, string $nomCompetence, ?string $niveau = null, string $source = 'ocr'): void;
    public function addExperience(int $candidatureId, array $attributes): void;
    public function addFormation(int $candidatureId, array $attributes): void;
    public function addProjet(int $candidatureId, array $attributes): void;
    public function addAutre(int $candidatureId, array $attributes): void;
}
