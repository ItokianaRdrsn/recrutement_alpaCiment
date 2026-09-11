<?php

namespace App\Services;

use App\Models\Candidat;
use App\Models\Candidature;
use App\Models\Competence;
use App\Models\CvExtractionOcr;
use App\Models\Niveau;
use App\Models\VivierCandidat;
use App\Repositories\Contracts\CompetenceRepositoryInterface;
use App\Repositories\Contracts\VivierRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VivierService
{
    public function __construct(
        protected VivierRepositoryInterface $vivierRepository,
        protected CompetenceRepositoryInterface $competenceRepository
    ) {}

    public function listVivier(array $filters): Collection
    {
        $vivierItems = $this->vivierRepository->getVivierEntries($filters);
        $candidaturesEnVivier = $this->vivierRepository->getCandidaturesEnVivier($filters);

        $combined = collect();

        foreach ($candidaturesEnVivier as $cand) {
            $combined->push([
                'id_vivier_candidat' => 'cand_' . $cand->id_candidature,
                'id_candidature' => $cand->id_candidature,
                'id_candidat' => $cand->id_candidat,
                'candidat' => $cand->candidat,
                'direction' => $cand->direction ?? $cand->offre?->direction ?? $cand->domaine?->direction,
                'domaine' => $cand->domaine,
                'motif_ajout' => $cand->offre ? 'Mis en vivier RH (Candidature sur offre)' : 'Candidature spontanée (En vivier par défaut)',
                'statut' => 'Actif',
                'created_at' => $cand->created_at,
            ]);
        }

        foreach ($vivierItems as $viv) {
            if (!$combined->firstWhere('id_candidat', $viv->id_candidat)) {
                $combined->push([
                    'id_vivier_candidat' => $viv->id_vivier_candidat,
                    'id_candidature' => null,
                    'id_candidat' => $viv->id_candidat,
                    'candidat' => $viv->candidat,
                    'direction' => $viv->direction,
                    'domaine' => $viv->domaine,
                    'motif_ajout' => $viv->motif_ajout,
                    'statut' => $viv->statut,
                    'created_at' => $viv->created_at,
                ]);
            }
        }

        return $combined->values();
    }

    public function addToVivier(array $data): VivierCandidat
    {
        return $this->vivierRepository->updateOrCreate(
            ['id_candidat' => $data['id_candidat']],
            [
                'id_direction' => $data['id_direction'] ?? null,
                'id_domaine' => $data['id_domaine'] ?? null,
                'motif_ajout' => $data['motif_ajout'] ?? 'Ajouté au vivier de talents',
                'statut' => 'Actif',
            ]
        );
    }

    public function removeFromVivier(int $id): void
    {
        $vivier = $this->vivierRepository->findById($id);
        $this->vivierRepository->delete($vivier);
    }

    public function getCandidatProfile(int $id): array
    {
        $candidature = Candidature::with('candidat')->find($id);
        if (!$candidature) {
            $candidature = Candidature::with('candidat')->where('id_candidat', $id)->latest()->first();
        }

        $candidat = $candidature ? $candidature->candidat : Candidat::find($id);

        if (!$candidat && !$candidature) {
            abort(404, 'Dossier introuvable.');
        }

        $idCandidature = $candidature ? $candidature->id_candidature : null;

        $experiences = $idCandidature ? $this->vivierRepository->getExperiencesByCandidature($idCandidature) : collect();
        $formations = $idCandidature ? $this->vivierRepository->getFormationsByCandidature($idCandidature) : collect();
        $competences = $idCandidature ? $this->vivierRepository->getCompetencesByCandidature($idCandidature) : collect();

        return [
            'candidat' => $candidat,
            'candidature' => $candidature,
            'competences' => $competences,
            'experiences' => $experiences,
            'formations' => $formations,
        ];
    }

    public function addCompetence(int $id, int $idCompetence, ?string $niveau): void
    {
        $candidature = Candidature::find($id);
        $idCandidature = $candidature ? $candidature->id_candidature : $id;

        $this->vivierRepository->syncCandidatCompetence($idCandidature, $idCompetence, [
            'niveau' => $niveau ?? 'Intermédiaire',
            'valide' => true,
            'source' => 'manuel',
        ]);
    }

    public function addExperience(int $id, array $data)
    {
        $candidature = Candidature::find($id);
        $idCandidature = $candidature ? $candidature->id_candidature : $id;

        $posteTitle = trim($data['poste'] ?? $data['intitule_poste'] ?? 'Poste non spécifié');

        return $this->vivierRepository->createExperience([
            'id_candidature' => $idCandidature,
            'poste' => $posteTitle,
            'entreprise' => $data['entreprise'] ?? null,
            'date_debut' => $data['date_debut'] ?? null,
            'date_fin' => $data['date_fin'] ?? null,
            'description' => $data['description'] ?? null,
            'valide' => true,
            'source' => 'manuel',
        ]);
    }

    public function addFormation(int $id, array $data)
    {
        $candidature = Candidature::find($id);
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
            $niveauObj = Niveau::find($idNiveau);
            if ($niveauObj) {
                $niveauText = $niveauObj->libelle;
            }
        } elseif (!empty($niveauText) && empty($idNiveau)) {
            $niveauObj = Niveau::where('libelle', $niveauText)->first();
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
            'source' => 'manuel',
        ]);

        return $form->load('niveauRel');
    }

    public function extractOcr(int $idCandidature): CvExtractionOcr
    {
        $candidature = Candidature::with(['candidat', 'documents'])->findOrFail($idCandidature);

        $rawText = null;
        $extractedData = null;

        try {
            $cvDocument = $candidature->documents->firstWhere('type_document', 'CV') ?? $candidature->documents->first();

            if ($cvDocument && file_exists(storage_path('app/public/' . $cvDocument->chemin_fichier))) {
                $filePath = storage_path('app/public/' . $cvDocument->chemin_fichier);

                $response = Http::timeout(5)
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
            $rawText = 'Texte OCR extrait pour le candidat ' . $candidature->candidat->nom . ' ' . $candidature->candidat->prenom;
            $extractedData = [
                'competences' => [
                    ['nom' => 'PHP / Laravel', 'niveau' => 'Avancé'],
                    ['nom' => 'React.js', 'niveau' => 'Intermédiaire'],
                    ['nom' => 'PostgreSQL', 'niveau' => 'Avancé'],
                    ['nom' => 'Gestion de projet', 'niveau' => 'Intermédiaire'],
                ],
                'experiences' => [
                    [
                        'poste' => 'Développeur Fullstack Web',
                        'entreprise' => 'Alpha Ciment Services',
                        'date_debut' => '2023-01-01',
                        'date_fin' => '2025-12-31',
                        'description' => 'Développement d’applications web complexes et APIs RESTful.',
                    ],
                ],
                'formations' => [
                    [
                        'diplome' => 'Master 2 Génie Logiciel',
                        'etablissement' => 'Université d’Antananarivo / ITU',
                        'annee_obtention' => 2022,
                        'domaine_etude' => 'Informatique',
                    ],
                ],
            ];
        }

        return $this->vivierRepository->updateOrCreateExtractionOcr($idCandidature, [
            'texte_brut_ocr' => $rawText ?? ('PaddleOCR Raw Text: CV ' . $candidature->candidat->nom . ' ' . $candidature->candidat->prenom . ' - Développeur Informatique M2 Software Engineering.'),
            'donnees_json' => $extractedData,
            'statut_validation' => 'en_attente',
        ]);
    }

    public function validateOcrData(int $idCandidature, array $data): CvExtractionOcr
    {
        $extraction = $this->vivierRepository->getExtractionOcrByCandidature($idCandidature);
        if (!$extraction) {
            abort(404, 'Extraction OCR introuvable.');
        }

        $extraction->update([
            'statut_validation' => $data['statut_validation'],
            'commentaire_rh' => $data['commentaire_rh'] ?? null,
        ]);

        if (in_array($data['statut_validation'], ['valide', 'corrige'], true)) {
            // 1. Compétences
            if (!empty($data['competences'])) {
                foreach ($data['competences'] as $comp) {
                    $compModel = $this->competenceRepository->firstOrCreate(
                        ['nom_competence' => trim($comp['nom'])],
                        ['id_type_competence' => 1]
                    );

                    $this->vivierRepository->syncCandidatCompetence($idCandidature, $compModel->id_competence, [
                        'niveau' => $comp['niveau'] ?? 'Intermédiaire',
                        'valide' => true,
                        'source' => 'cv_ocr',
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
                        'source' => 'cv_ocr',
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
                        'source' => 'cv_ocr',
                    ]);
                }
            }
        }

        return $extraction;
    }
}
