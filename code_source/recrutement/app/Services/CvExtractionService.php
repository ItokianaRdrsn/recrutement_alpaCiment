<?php

namespace App\Services;

use App\Enums\SourceDonnee;
use App\Enums\StatutValidationOcr;
use App\Models\CvExtractionOcr;
use App\Repositories\Contracts\CvExtractionRepositoryInterface;

class CvExtractionService
{
    public function __construct(
        protected CvExtractionRepositoryInterface $cvExtractionRepository
    ) {}

    /**
     * Enregistre l'extraction OCR brute et peuple les compétences, expériences, formations et projets via le repository.
     */
    public function importerProfilOcr(int $candidatureId, array $data): ?CvExtractionOcr
    {
        $donnees = $data['donnees_json'] ?? [];
        if (is_string($donnees)) {
            $donnees = json_decode($donnees, true) ?: [];
        }

        if (empty($donnees['autres']) && !empty($data['autres']) && is_array($data['autres'])) {
            $donnees['autres'] = $data['autres'];
        }

        $ocr = $this->cvExtractionRepository->createExtraction([
            'id_candidature' => $candidatureId,
            'texte_brut_ocr' => $data['texte_brut_ocr'] ?? null,
            'donnees_json' => $donnees,
            'statut_validation' => StatutValidationOcr::Valide->value,
        ]);

        if (empty($donnees) || !is_array($donnees)) {
            return $ocr;
        }

        // 1. Compétences
        if (!empty($donnees['competences']) && is_array($donnees['competences'])) {
            foreach ($donnees['competences'] as $c) {
                $nom = is_array($c) ? ($c['nom'] ?? $c['competence'] ?? null) : (is_string($c) ? $c : null);
                if (!empty($nom) && is_string($nom)) {
                    $this->cvExtractionRepository->attachCompetence(
                        candidatureId: $candidatureId,
                        nomCompetence: trim($nom),
                        niveau: is_array($c) ? ($c['niveau'] ?? 'Intermédiaire') : 'Intermédiaire',
                        source: SourceDonnee::Ocr->value
                    );
                }
            }
        }

        // 2. Expériences
        if (!empty($donnees['experiences']) && is_array($donnees['experiences'])) {
            foreach ($donnees['experiences'] as $exp) {
                if (!empty($exp['poste'])) {
                    $this->cvExtractionRepository->addExperience($candidatureId, [
                        'poste' => $exp['poste'],
                        'entreprise' => $exp['entreprise'] ?? null,
                        'date_debut' => $this->parseDateSafely($exp['date_debut'] ?? null),
                        'date_fin' => $this->parseDateSafely($exp['date_fin'] ?? null),
                        'poste_actuel' => !empty($exp['poste_actuel']),
                        'description' => $exp['description'] ?? null,
                        'source' => SourceDonnee::Ocr->value,
                        'valide' => true,
                    ]);
                }
            }
        }

        // 3. Formations
        if (!empty($donnees['formations']) && is_array($donnees['formations'])) {
            foreach ($donnees['formations'] as $f) {
                if (!empty($f['diplome'])) {
                    $this->cvExtractionRepository->addFormation($candidatureId, [
                        'diplome' => $f['diplome'],
                        'etablissement' => $f['etablissement'] ?? null,
                        'domaine_etude' => $f['domaine_etude'] ?? null,
                        'niveau' => $f['niveau'] ?? null,
                        'date_obtention' => $this->parseDateSafely($f['date_obtention'] ?? null),
                        'source' => SourceDonnee::Ocr->value,
                        'valide' => true,
                    ]);
                }
            }
        }

        // 4. Projets
        if (!empty($donnees['projets']) && is_array($donnees['projets'])) {
            foreach ($donnees['projets'] as $p) {
                if (!empty($p['titre_projet'])) {
                    $this->cvExtractionRepository->addProjet($candidatureId, [
                        'titre_projet' => $p['titre_projet'],
                        'role' => $p['role'] ?? null,
                        'technologies' => $p['technologies'] ?? null,
                        'url_projet' => $p['url_projet'] ?? null,
                        'description' => $p['description'] ?? null,
                        'source' => SourceDonnee::Ocr->value,
                        'valide' => true,
                    ]);
                }
            }
        }

        // 5. Autres (loisirs, permis, références, engagement associatif...)
        if (!empty($donnees['autres']) && is_array($donnees['autres'])) {
            foreach ($donnees['autres'] as $a) {
                if (is_string($a)) {
                    $titre = 'Information complémentaire';
                    $description = $a;
                } elseif (is_array($a)) {
                    $titre = $a['titre'] ?? $a['categorie'] ?? $a['nom'] ?? 'Information complémentaire';
                    $description = $a['description'] ?? $a['valeur'] ?? $a['contenu'] ?? $a['details'] ?? null;
                } else {
                    continue;
                }
                if (!empty($titre) || !empty($description)) {
                    $this->cvExtractionRepository->addAutre($candidatureId, [
                        'titre' => mb_substr((string) ($titre ?: 'Information complémentaire'), 0, 255),
                        'description' => $description ? (string) $description : null,
                        'source' => SourceDonnee::Ocr->value,
                        'valide' => true,
                    ]);
                }
            }
        }

        return $ocr;
    }

    /**
     * Parse une date OCR de manière tolérante (ex: 2024 -> 2024-01-01).
     */
    public function parseDateSafely(?string $value): ?string
    {
        if (empty($value)) return null;
        if (preg_match('/^\d{4}$/', trim($value))) return trim($value) . '-01-01';
        if (preg_match('/^\d{4}-\d{2}$/', trim($value))) return trim($value) . '-01';
        $timestamp = strtotime($value);
        return $timestamp ? date('Y-m-d', $timestamp) : null;
    }
}
