<?php

namespace App\Services;

use App\Enums\SourceDonnee;
use App\Enums\StatutValidationOcr;
use App\Enums\TypeDocumentEnum;
use App\Models\Candidature;
use App\Models\CvExtractionOcr;
use App\Repositories\Contracts\CandidatRepositoryInterface;
use App\Repositories\Contracts\CandidatureRepositoryInterface;
use App\Repositories\Contracts\CompetenceRepositoryInterface;
use App\Repositories\Contracts\VivierRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VivierService
{
    public function __construct(
        protected VivierRepositoryInterface $vivierRepository,
        protected CompetenceRepositoryInterface $competenceRepository,
        protected CandidatureRepositoryInterface $candidatureRepository,
        protected CandidatRepositoryInterface $candidatRepository,
        protected AuditLogService $auditLogService
    ) {}

    public function listVivier(array $filters): Collection
    {
        $candidaturesEnVivier = $this->vivierRepository->getCandidaturesEnVivier($filters);

        return $candidaturesEnVivier->map(function ($cand) {
            return [
                'id_vivier_candidat' => $cand->id_candidature,
                'id_candidature' => $cand->id_candidature,
                'id_candidat' => $cand->id_candidat,
                'candidat' => $cand->candidat,
                'direction' => $cand->direction ?? $cand->offre?->direction ?? $cand->domaine?->direction,
                'domaine' => $cand->domaine,
                'offre' => $cand->offre,
                'motif_ajout' => $cand->offre 
                    ? "Mis en vivier RH (Candidature sur offre : " . ($cand->offre->titre_poste ?? $cand->offre->titre ?? 'Poste') . ")"
                    : 'Candidature spontanée (En vivier par défaut)',
                'poste_souhaite' => $cand->poste_souhaite ?? ($cand->offre?->titre_poste ?? $cand->offre?->titre ?? null),
                'statut' => $cand->statut?->libelle ?? 'Actif',
                'created_at' => $cand->created_at,
                'cv_snippet' => $cand->cv_snippet ?? null,
            ];
        })->values();
    }

    public function addToVivier(array $data): ?Candidature
    {
        $id = $data['id_candidature'] ?? null;
        if (!$id && !empty($data['id_candidat'])) {
            $cand = Candidature::where('id_candidat', $data['id_candidat'])->latest()->first();
            $id = $cand?->id_candidature;
        }

        if ($id) {
            return $this->candidatureRepository->updateVivierStatus((int) $id, true);
        }

        return null;
    }

    public function removeFromVivier(int $id): void
    {
        $cand = Candidature::find($id);
        if ($cand) {
            $this->candidatureRepository->updateVivierStatus($cand->id_candidature, false);
            return;
        }

        Candidature::where('id_candidat', $id)->where('dans_vivier', true)->update(['dans_vivier' => false]);
    }

    public function getCandidatProfile(int $id): array
    {
        $candidature = null;
        try {
            $candidature = $this->candidatureRepository->findById($id, ['candidat']);
        } catch (\Throwable) {
            $candidature = null;
        }

        $candidat = $candidature ? $candidature->candidat : null;
        if (!$candidat) {
            try {
                $candidat = $this->candidatRepository->findById($id);
            } catch (\Throwable) {
                $candidat = null;
            }
        }

        if (!$candidat && !$candidature) {
            abort(404, 'Dossier introuvable.');
        }

        $idCandidature = $candidature ? $candidature->id_candidature : null;

        $experiences = $idCandidature ? $this->vivierRepository->getExperiencesByCandidature($idCandidature) : collect();
        $formations = $idCandidature ? $this->vivierRepository->getFormationsByCandidature($idCandidature) : collect();
        $projets = $idCandidature ? $this->vivierRepository->getProjetsByCandidature($idCandidature) : collect();
        $competences = $idCandidature ? $this->vivierRepository->getCompetencesByCandidature($idCandidature) : collect();
        $autres = $idCandidature ? $this->vivierRepository->getAutresByCandidature($idCandidature) : collect();

        return [
            'candidat' => $candidat,
            'candidature' => $candidature,
            'competences' => $competences,
            'experiences' => $experiences,
            'formations' => $formations,
            'projets' => $projets,
            'autres' => $autres,
        ];
    }

    public function addCompetence(int $id, int $idCompetence, ?string $niveau): void
    {
        $this->vivierRepository->syncCandidatCompetence($id, $idCompetence, [
            'niveau' => $niveau ?? 'Intermédiaire',
            'valide' => true,
            'source' => SourceDonnee::Manuel->value,
        ]);
    }

    public function addExperience(int $id, array $data)
    {
        $posteTitle = trim($data['poste'] ?? $data['intitule_poste'] ?? 'Poste non spécifié');

        return $this->vivierRepository->createExperience([
            'id_candidature' => $id,
            'poste' => $posteTitle,
            'entreprise' => $data['entreprise'] ?? null,
            'date_debut' => $data['date_debut'] ?? null,
            'date_fin' => $data['date_fin'] ?? null,
            'description' => $data['description'] ?? null,
            'valide' => true,
            'source' => SourceDonnee::Manuel->value,
        ]);
    }

    public function addProjet(int $id, array $data)
    {
        return $this->vivierRepository->createProjet([
            'id_candidature' => $id,
            'titre_projet' => trim($data['titre_projet'] ?? 'Projet / Réalisation'),
            'role' => $data['role'] ?? null,
            'technologies' => $data['technologies'] ?? null,
            'url_projet' => $data['url_projet'] ?? null,
            'date_debut' => $data['date_debut'] ?? null,
            'date_fin' => $data['date_fin'] ?? null,
            'description' => $data['description'] ?? null,
            'valide' => true,
            'source' => SourceDonnee::Manuel->value,
        ]);
    }

    public function addAutre(int $id, array $data)
    {
        return $this->vivierRepository->createAutre([
            'id_candidature' => $id,
            'titre' => trim($data['titre'] ?? 'Information complémentaire'),
            'description' => $data['description'] ?? null,
            'valide' => true,
            'source' => SourceDonnee::Manuel->value,
        ]);
    }

    public function addFormation(int $id, array $data)
    {
        $candidature = $this->candidatureRepository->findById($id);
        $idCandidature = $candidature ? $candidature->id_candidature : $id;

        $dateObt = null;
        if (!empty($data['date_obtention'])) {
            $dateObt = $data['date_obtention'];
        } elseif (!empty($data['annee_obtention']) && is_numeric($data['annee_obtention'])) {
            $dateObt = $data['annee_obtention'] . '-01-01';
        }

        $idNiveau = $data['id_niveau'] ?? null;
        $niveauText = $data['niveau'] ?? null;

        if ($idNiveau && empty($niveauText)) {
            $niveauObj = $this->vivierRepository->findNiveauById((int) $idNiveau);
            if ($niveauObj) {
                $niveauText = $niveauObj->libelle;
            }
        } elseif (!empty($niveauText) && empty($idNiveau)) {
            $niveauObj = $this->vivierRepository->findNiveauByLibelle($niveauText);
            if ($niveauObj) {
                $idNiveau = $niveauObj->id_niveau;
            }
        }

        $form = $this->vivierRepository->createFormation([
            'id_candidature' => $idCandidature,
            'diplome' => $data['diplome'],
            'etablissement' => $data['etablissement'] ?? null,
            'date_obtention' => $dateObt,
            'domaine_etude' => $data['domaine_etude'] ?? null,
            'id_niveau' => $idNiveau,
            'niveau' => $niveauText,
            'valide' => true,
            'source' => SourceDonnee::Manuel->value,
        ]);

        return $form->load('niveauRel');
    }

    public function extractOcr(int $idCandidature): CvExtractionOcr
    {
        $candidature = $this->candidatureRepository->findById($idCandidature, ['candidat', 'documents']);

        $rawText = null;
        $extractedData = null;

        try {
            $cvDocument = $candidature->documents->firstWhere('type_document', TypeDocumentEnum::Cv->value) ?? $candidature->documents->first();

            if ($cvDocument && file_exists(storage_path('app/public/' . $cvDocument->chemin_fichier))) {
                $filePath = storage_path('app/public/' . $cvDocument->chemin_fichier);

                $response = Http::timeout(60)
                    ->attach('file', file_get_contents($filePath), $cvDocument->nom_fichier)
                    ->post('http://127.0.0.1:8001/extract-cv', [
                        'candidature_id' => $idCandidature,
                    ]);

                if ($response->successful()) {
                    $resJson = $response->json();
                    $rawText = $resJson['texte_brut_ocr'] ?? null;
                    $extractedData = $resJson['donnees_json'] ?? null;
                }
            }
        } catch (\Throwable $e) {
            Log::warning("FastAPI microservice call failed: " . $e->getMessage());
        }

        if (!$extractedData) {
            $rawText = 'Texte OCR non extrait pour le candidat ' . $candidature->candidat->nom . ' ' . $candidature->candidat->prenom;
            $extractedData = [
                'texte_brut' => $rawText,
            ];
        }

        return $this->vivierRepository->updateOrCreateExtractionOcr($idCandidature, [
            'texte_brut_ocr' => $rawText,
            'donnees_json' => $extractedData,
            'statut_validation' => StatutValidationOcr::EnAttente->value,
        ]);
    }

    public function validateOcrData(int $idCandidature, array $data): CvExtractionOcr
    {
        $extraction = $this->vivierRepository->getExtractionOcrByCandidature($idCandidature);
        if (!$extraction) {
            abort(404, 'Extraction OCR introuvable.');
        }

        $extraction = $this->vivierRepository->updateExtractionOcr($extraction, [
            'statut_validation' => $data['statut_validation'],
            'commentaire_rh' => $data['commentaire_rh'] ?? null,
        ]);

        if (in_array($data['statut_validation'], [StatutValidationOcr::Valide->value, StatutValidationOcr::Corrige->value], true)) {
            // 1. Compétences
            if (!empty($data['competences'])) {
                foreach ($data['competences'] as $comp) {
                    $nomComp = is_array($comp) ? ($comp['nom'] ?? $comp['nom_competence'] ?? $comp['competence'] ?? null) : (is_string($comp) ? $comp : null);
                    if (empty($nomComp) || !is_string($nomComp)) {
                        continue;
                    }

                    $compModel = $this->competenceRepository->firstOrCreate(
                        ['nom_competence' => trim($nomComp)],
                        ['id_type_competence' => 1]
                    );

                    $this->vivierRepository->syncCandidatCompetence($idCandidature, $compModel->id_competence, [
                        'niveau' => is_array($comp) ? ($comp['niveau'] ?? 'Intermédiaire') : 'Intermédiaire',
                        'valide' => true,
                        'source' => SourceDonnee::CvOcr->value,
                    ]);
                }
            }

            // 2. Expériences
            if (!empty($data['experiences'])) {
                foreach ($data['experiences'] as $exp) {
                    $posteTitle = trim($exp['poste'] ?? $exp['intitule_poste'] ?? 'Poste non spécifié');
                    $this->vivierRepository->createExperience([
                        'id_candidature' => $idCandidature,
                        'poste' => $posteTitle,
                        'entreprise' => $exp['entreprise'] ?? null,
                        'date_debut' => $exp['date_debut'] ?? null,
                        'date_fin' => $exp['date_fin'] ?? null,
                        'description' => $exp['description'] ?? null,
                        'valide' => true,
                        'source' => SourceDonnee::CvOcr->value,
                    ]);
                }
            }

            // 3. Formations
            if (!empty($data['formations'])) {
                foreach ($data['formations'] as $form) {
                    $dateObt = null;
                    if (!empty($form['date_obtention'])) {
                        $dateObt = $form['date_obtention'];
                    } elseif (!empty($form['annee_obtention']) && is_numeric($form['annee_obtention'])) {
                        $dateObt = $form['annee_obtention'] . '-01-01';
                    }

                    $this->vivierRepository->createFormation([
                        'id_candidature' => $idCandidature,
                        'diplome' => $form['diplome'],
                        'etablissement' => $form['etablissement'] ?? null,
                        'date_obtention' => $dateObt,
                        'domaine_etude' => $form['domaine_etude'] ?? null,
                        'valide' => true,
                        'source' => SourceDonnee::CvOcr->value,
                    ]);
                }
            }

            // 4. Projets & Réalisations
            if (!empty($data['projets'])) {
                foreach ($data['projets'] as $proj) {
                    $titre = trim($proj['titre_projet'] ?? $proj['titre'] ?? $proj['nom'] ?? 'Projet / Réalisation');
                    $this->vivierRepository->createProjet([
                        'id_candidature' => $idCandidature,
                        'titre_projet' => $titre,
                        'role' => $proj['role'] ?? null,
                        'technologies' => is_array($proj['technologies'] ?? null) ? implode(', ', $proj['technologies']) : ($proj['technologies'] ?? null),
                        'url_projet' => $proj['url_projet'] ?? $proj['url'] ?? null,
                        'date_debut' => $proj['date_debut'] ?? null,
                        'date_fin' => $proj['date_fin'] ?? null,
                        'description' => $proj['description'] ?? null,
                        'valide' => true,
                        'source' => SourceDonnee::CvOcr->value,
                    ]);
                }
            }

            // 5. Autres (Loisirs, Permis, Références...)
            if (!empty($data['autres'])) {
                foreach ($data['autres'] as $autre) {
                    $titre = trim($autre['titre'] ?? 'Information complémentaire');
                    $this->vivierRepository->createAutre([
                        'id_candidature' => $idCandidature,
                        'titre' => $titre,
                        'description' => $autre['description'] ?? null,
                        'valide' => true,
                        'source' => SourceDonnee::CvOcr->value,
                    ]);
                }
            }
        }

        $actionLabel = $data['statut_validation'] === StatutValidationOcr::Valide->value
            ? 'VALIDATION_OCR'
            : ($data['statut_validation'] === StatutValidationOcr::Corrige->value ? 'CORRECTION_OCR' : 'REJET_OCR');

        $this->auditLogService->log(
            action: $actionLabel,
            entite: 'Candidature',
            idEntite: $idCandidature,
            description: "Décision RH sur extraction CV (Statut: {$data['statut_validation']}) - Candidature #{$idCandidature}",
            anciennesValeurs: ['statut_validation' => StatutValidationOcr::EnAttente->value],
            nouvellesValeurs: [
                'statut_validation' => $data['statut_validation'],
                'commentaire_rh' => $data['commentaire_rh'] ?? null,
                'nb_competences' => count($data['competences'] ?? []),
                'nb_experiences' => count($data['experiences'] ?? []),
                'nb_formations' => count($data['formations'] ?? []),
                'nb_projets' => count($data['projets'] ?? []),
            ]
        );

        return $extraction;
    }
}
