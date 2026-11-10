<?php

namespace App\Repositories\Contracts;

use App\Models\CandidatExperience;
use App\Models\CandidatFormation;
use App\Models\CvExtractionOcr;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

interface VivierRepositoryInterface
{
    public function getVivierEntries(array $filters): Collection;
    public function getCandidaturesEnVivier(array $filters): Collection;
    public function findById(int $id): ?\App\Models\Candidature;
    public function updateOrCreate(array $matchAttributes, array $values);
    public function delete($vivier): bool;
    
    // Candidature Profile relations (Competences, Experiences, Formations, Projets, Autres)
    public function getExperiencesByCandidature(int $idCandidature): Collection;
    public function getFormationsByCandidature(int $idCandidature): Collection;
    public function getProjetsByCandidature(int $idCandidature): Collection;
    public function getAutresByCandidature(int $idCandidature): Collection;
    public function getCompetencesByCandidature(int $idCandidature): SupportCollection;
    
    public function syncCandidatCompetence(int $idCandidature, int $idCompetence, array $data): void;
    public function createExperience(array $attributes): CandidatExperience;
    public function createFormation(array $attributes): CandidatFormation;
    public function createProjet(array $attributes): \App\Models\CandidatProjet;
    public function createAutre(array $attributes): \App\Models\CandidatAutre;
    
    // OCR
    public function getExtractionOcrByCandidature(int $idCandidature): ?CvExtractionOcr;
    public function updateOrCreateExtractionOcr(int $idCandidature, array $attributes): CvExtractionOcr;
    public function updateExtractionOcr(CvExtractionOcr $extraction, array $attributes): CvExtractionOcr;

    // Référentiel Niveau
    public function findNiveauById(int $id): ?\App\Models\Niveau;
    public function findNiveauByLibelle(string $libelle): ?\App\Models\Niveau;
}
