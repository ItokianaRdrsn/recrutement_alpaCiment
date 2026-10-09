<?php

namespace Tests\Feature\Api;

use App\Models\CvExtractionOcr;
use App\Models\User;
use App\Services\VivierService;
use Tests\TestCase;

class OcrValidationTest extends TestCase
{
    protected User $rhUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->rhUser = User::factory()->rh()->make([
            'id' => 1,
            'name' => 'Agent RH Test',
            'email' => 'rh.test@alpaciment.mg',
        ]);
    }

    public function test_rh_validation_service_validates_and_syncs_data(): void
    {
        $mockExtraction = new CvExtractionOcr([
            'id_extraction' => 1,
            'id_candidature' => 999,
            'statut_validation' => 'en_attente',
            'texte_brut_ocr' => 'CV test',
            'donnees_json' => ['competences' => []],
        ]);

        $updatedExtraction = new CvExtractionOcr([
            'id_extraction' => 1,
            'id_candidature' => 999,
            'statut_validation' => 'valide',
            'commentaire_rh' => 'Validé par RH',
        ]);

        $vivierRepo = $this->createMock(\App\Repositories\Contracts\VivierRepositoryInterface::class);
        $competenceRepo = $this->createMock(\App\Repositories\Contracts\CompetenceRepositoryInterface::class);

        $vivierRepo->expects($this->once())
            ->method('getExtractionOcrByCandidature')
            ->with(999)
            ->willReturn($mockExtraction);

        $vivierRepo->expects($this->once())
            ->method('updateExtractionOcr')
            ->with($mockExtraction, [
                'statut_validation' => 'valide',
                'commentaire_rh' => 'Validé par RH',
            ])
            ->willReturn($updatedExtraction);

        $compModel = new \App\Models\Competence(['nom_competence' => 'PHP']);
        $compModel->id_competence = 10;

        $competenceRepo->expects($this->once())
            ->method('firstOrCreate')
            ->willReturn($compModel);

        $vivierRepo->expects($this->once())
            ->method('syncCandidatCompetence')
            ->with(999, 10, [
                'niveau' => 'Avancé',
                'valide' => true,
                'source' => 'cv_ocr',
            ]);

        $auditMock = $this->createMock(\App\Services\AuditLogService::class);
        $auditMock->expects($this->once())->method('log');

        $service = new VivierService($vivierRepo, $competenceRepo, $auditMock);

        $result = $service->validateOcrData(999, [
            'statut_validation' => 'valide',
            'commentaire_rh' => 'Validé par RH',
            'competences' => [
                ['nom' => 'PHP', 'niveau' => 'Avancé']
            ],
            'experiences' => [],
            'formations' => [],
        ]);

        $this->assertEquals('valide', $result->statut_validation);
        $this->assertEquals('Validé par RH', $result->commentaire_rh);
    }

    public function test_rh_validation_service_can_reject_data(): void
    {
        $mockExtraction = new CvExtractionOcr([
            'id_extraction' => 2,
            'id_candidature' => 999,
            'statut_validation' => 'en_attente',
        ]);

        $rejectedExtraction = new CvExtractionOcr([
            'id_extraction' => 2,
            'id_candidature' => 999,
            'statut_validation' => 'rejete',
            'commentaire_rh' => 'Document illisible ou rejeté',
        ]);

        $vivierRepo = $this->createMock(\App\Repositories\Contracts\VivierRepositoryInterface::class);
        $competenceRepo = $this->createMock(\App\Repositories\Contracts\CompetenceRepositoryInterface::class);

        $vivierRepo->expects($this->once())
            ->method('getExtractionOcrByCandidature')
            ->with(999)
            ->willReturn($mockExtraction);

        $vivierRepo->expects($this->once())
            ->method('updateExtractionOcr')
            ->with($mockExtraction, [
                'statut_validation' => 'rejete',
                'commentaire_rh' => 'Document illisible ou rejeté',
            ])
            ->willReturn($rejectedExtraction);

        // En cas de rejet, aucune compétence/expérience n'est injectée
        $vivierRepo->expects($this->never())->method('syncCandidatCompetence');
        $vivierRepo->expects($this->never())->method('createExperience');
        $vivierRepo->expects($this->never())->method('createFormation');

        $auditMock = $this->createMock(\App\Services\AuditLogService::class);
        $auditMock->expects($this->once())->method('log');

        $service = new VivierService($vivierRepo, $competenceRepo, $auditMock);

        $result = $service->validateOcrData(999, [
            'statut_validation' => 'rejete',
            'commentaire_rh' => 'Document illisible ou rejeté',
            'competences' => [],
            'experiences' => [],
            'formations' => [],
        ]);

        $this->assertEquals('rejete', $result->statut_validation);
        $this->assertEquals('Document illisible ou rejeté', $result->commentaire_rh);
    }

    public function test_rh_validation_service_can_save_corrections(): void
    {
        $mockExtraction = new CvExtractionOcr([
            'id_extraction' => 3,
            'id_candidature' => 999,
            'statut_validation' => 'en_attente',
        ]);

        $correctedExtraction = new CvExtractionOcr([
            'id_extraction' => 3,
            'id_candidature' => 999,
            'statut_validation' => 'corrige',
            'commentaire_rh' => 'Poste rectifié en Lead Architecte',
        ]);

        $vivierRepo = $this->createMock(\App\Repositories\Contracts\VivierRepositoryInterface::class);
        $competenceRepo = $this->createMock(\App\Repositories\Contracts\CompetenceRepositoryInterface::class);

        $vivierRepo->expects($this->once())
            ->method('getExtractionOcrByCandidature')
            ->with(999)
            ->willReturn($mockExtraction);

        $vivierRepo->expects($this->once())
            ->method('updateExtractionOcr')
            ->with($mockExtraction, [
                'statut_validation' => 'corrige',
                'commentaire_rh' => 'Poste rectifié en Lead Architecte',
            ])
            ->willReturn($correctedExtraction);

        $vivierRepo->expects($this->once())
            ->method('createExperience')
            ->with($this->callback(function ($exp) {
                return $exp['poste'] === 'Lead Architecte' && $exp['source'] === 'cv_ocr';
            }));

        $auditMock = $this->createMock(\App\Services\AuditLogService::class);
        $auditMock->expects($this->once())->method('log');

        $service = new VivierService($vivierRepo, $competenceRepo, $auditMock);

        $result = $service->validateOcrData(999, [
            'statut_validation' => 'corrige',
            'commentaire_rh' => 'Poste rectifié en Lead Architecte',
            'competences' => [],
            'experiences' => [
                ['poste' => 'Lead Architecte', 'entreprise' => 'Alpa Ciment']
            ],
            'formations' => [],
        ]);

        $this->assertEquals('corrige', $result->statut_validation);
        $this->assertEquals('Poste rectifié en Lead Architecte', $result->commentaire_rh);
    }
}
