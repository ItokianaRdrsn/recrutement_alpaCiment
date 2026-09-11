<?php

namespace App\Repositories\Contracts;

use App\Models\CandidatExperience;
use App\Models\CandidatFormation;
use App\Models\CvExtractionOcr;
use App\Models\VivierCandidat;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

interface VivierRepositoryInterface
{
    public function getVivierEntries(array $filters): Collection;
    public function getCandidaturesEnVivier(array $filters): Collection;
    public function findById(int $id): VivierCandidat;
    public function updateOrCreate(array $matchAttributes, array $values): VivierCandidat;
    public function delete(VivierCandidat $vivier): bool;
    
    // Candidature Profile relations (Competences, Experiences, Formations)
    public function getExperiencesByCandidature(int $idCandidature): Collection;
    public function getFormationsByCandidature(int $idCandidature): Collection;
    public function getCompetencesByCandidature(int $idCandidature): SupportCollection;
    
    public function syncCandidatCompetence(int $idCandidature, int $idCompetence, array $data): void;
    public function createExperience(array $attributes): CandidatExperience;
    public function createFormation(array $attributes): CandidatFormation;
    
    // OCR
    public function getExtractionOcrByCandidature(int $idCandidature): ?CvExtractionOcr;
    public function updateOrCreateExtractionOcr(int $idCandidature, array $attributes): CvExtractionOcr;
}
