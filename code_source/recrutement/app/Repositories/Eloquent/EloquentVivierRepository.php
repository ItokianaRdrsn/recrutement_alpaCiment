<?php

namespace App\Repositories\Eloquent;

use App\Models\CandidatExperience;
use App\Models\CandidatFormation;
use App\Models\Candidature;
use App\Models\CvExtractionOcr;
use App\Repositories\Contracts\VivierRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EloquentVivierRepository implements VivierRepositoryInterface
{
    public function getVivierEntries(array $filters): Collection
    {
        return new Collection();
    }

    public function getCandidaturesEnVivier(array $filters): Collection
    {
        $hasOcrTable = Schema::hasTable('cv_extraction_ocr');
        $candWith = ['candidat', 'offre.direction', 'domaine.direction', 'documents'];
        if ($hasOcrTable) {
            $candWith[] = 'cvExtractionOcr';
        }
        $candQuery = Candidature::with($candWith)->where('dans_vivier', true);

        $search = !empty($filters['cv_keyword']) ? trim($filters['cv_keyword']) : (!empty($filters['q']) ? trim($filters['q']) : null);
        $isPgsql = DB::getDriverName() === 'pgsql';
        $likeOp = $isPgsql ? 'ILIKE' : 'like';
        $hasTsvector = $isPgsql && Schema::hasColumn('document', 'recherche_texte');

        if (!empty($search)) {
            $escSearch = addcslashes($search, '%_\\');
            $candQuery->where(function ($qRoot) use ($search, $escSearch, $likeOp, $hasTsvector, $hasOcrTable, $isPgsql) {
                $qRoot->whereHas('candidat', function ($sub) use ($escSearch, $likeOp, $isPgsql) {
                    if ($isPgsql) {
                        $sub->whereRaw('unaccent(nom) ILIKE unaccent(?)', ["%{$escSearch}%"])
                            ->orWhereRaw('unaccent(prenom) ILIKE unaccent(?)', ["%{$escSearch}%"])
                            ->orWhere('email', 'ILIKE', "%{$escSearch}%");
                    } else {
                        $sub->where('nom', $likeOp, "%{$escSearch}%")
                            ->orWhere('prenom', $likeOp, "%{$escSearch}%")
                            ->orWhere('email', $likeOp, "%{$escSearch}%");
                    }
                });

                if ($isPgsql) {
                    $qRoot->orWhereRaw('unaccent(poste_souhaite) ILIKE unaccent(?)', ["%{$escSearch}%"]);
                } else {
                    $qRoot->orWhere('poste_souhaite', $likeOp, "%{$escSearch}%");
                }

                $qRoot->orWhereHas('documents', function ($docQ) use ($search, $escSearch, $hasTsvector, $likeOp, $isPgsql) {
                    if ($hasTsvector) {
                        $docQ->whereRaw("recherche_texte @@ websearch_to_tsquery('french_unaccent', ?)", [$search]);
                    } else {
                        if ($isPgsql) {
                            $docQ->whereRaw('unaccent(contenu_texte_extrait) ILIKE unaccent(?)', ["%{$escSearch}%"]);
                        } else {
                            $docQ->where('contenu_texte_extrait', $likeOp, "%{$escSearch}%");
                        }
                    }
                });

                if ($hasOcrTable) {
                    $qRoot->orWhereHas('cvExtractionOcr', function ($ocrQ) use ($escSearch, $likeOp, $isPgsql) {
                        if ($isPgsql) {
                            $ocrQ->whereRaw('unaccent(texte_brut_ocr) ILIKE unaccent(?)', ["%{$escSearch}%"]);
                        } else {
                            $ocrQ->where('texte_brut_ocr', $likeOp, "%{$escSearch}%");
                        }
                    });
                }
            });
        }

        if (!empty($filters['domaine_direction_only']) && !empty($filters['direction'])) {
            $dirId = (int) $filters['direction'];
            $candQuery->where(function ($qDir) use ($dirId) {
                $qDir->whereHas('domaine', function ($s) use ($dirId) {
                    $s->where('id_direction', $dirId);
                })->orWhere(function ($sub) use ($dirId) {
                    $sub->whereNull('id_domaine')
                        ->whereHas('offre', function ($s) use ($dirId) {
                            $s->where('id_direction', $dirId);
                        });
                });
            });
        } elseif (!empty($filters['direction'])) {
            $dirId = (int) $filters['direction'];
            $candQuery->where(function ($qDir) use ($dirId) {
                $qDir->whereHas('offre', function ($s) use ($dirId) {
                    $s->where('id_direction', $dirId);
                })->orWhereHas('domaine', function ($s) use ($dirId) {
                    $s->where('id_direction', $dirId);
                });
            });
        }

        $results = $candQuery->orderByDesc('updated_at')->get();

        if (!empty($search)) {
            $results->transform(function ($cand) use ($search) {
                $snippet = null;
                if ($cand->relationLoaded('documents')) {
                    foreach ($cand->documents as $doc) {
                        if (!empty($doc->contenu_texte_extrait)) {
                            $snippet = $this->generateSnippet($doc->contenu_texte_extrait, $search);
                            if ($snippet) {
                                break;
                            }
                        }
                    }
                }
                if (!$snippet && $cand->relationLoaded('cvExtractionOcr') && $cand->cvExtractionOcr) {
                    $rawOcr = $cand->cvExtractionOcr->texte_brut_ocr;
                    if (empty($rawOcr) && is_array($cand->cvExtractionOcr->donnees_json)) {
                        $rawOcr = $cand->cvExtractionOcr->donnees_json['texte_brut'] ?? json_encode($cand->cvExtractionOcr->donnees_json);
                    }
                    if (!empty($rawOcr)) {
                        $snippet = $this->generateSnippet($rawOcr, $search);
                    }
                }
                if (!$snippet && !empty($cand->poste_souhaite)) {
                    $snippet = $this->generateSnippet($cand->poste_souhaite, $search, 60);
                }
                if (!$snippet && $cand->relationLoaded('candidat') && $cand->candidat) {
                    $fullCandName = trim(($cand->candidat->prenom ?? '') . ' ' . ($cand->candidat->nom ?? ''));
                    if ($this->generateSnippet($fullCandName, $search, 40)) {
                        $snippet = 'Candidat : ' . $fullCandName;
                    }
                }
                $cand->cv_snippet = $snippet;
                $cand->setAttribute('cv_snippet', $snippet);
                return $cand;
            });
        }

        return $results;
    }

    public function findById(int $id): ?Candidature
    {
        return Candidature::find($id);
    }

    public function updateOrCreate(array $matchAttributes, array $values): ?Candidature
    {
        return null;
    }

    public function delete($vivier): bool
    {
        return true;
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

    public function getAutresByCandidature(int $idCandidature): Collection
    {
        if (Schema::hasTable('candidat_autre')) {
            return \App\Models\CandidatAutre::where('id_candidature', $idCandidature)->orderByDesc('id_autre')->get();
        }
        return new Collection();
    }

    public function getProjetsByCandidature(int $idCandidature): Collection
    {
        if (Schema::hasTable('candidat_projet')) {
            return \App\Models\CandidatProjet::where('id_candidature', $idCandidature)->orderByDesc('date_debut')->orderByDesc('id_projet')->get();
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

    public function createProjet(array $attributes): \App\Models\CandidatProjet
    {
        return \App\Models\CandidatProjet::create($attributes);
    }

    public function createAutre(array $attributes): \App\Models\CandidatAutre
    {
        return \App\Models\CandidatAutre::create($attributes);
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

    public function updateExtractionOcr(CvExtractionOcr $extraction, array $attributes): CvExtractionOcr
    {
        $extraction->update($attributes);
        return $extraction;
    }

    /**
     * Normalisation 1:1 préservant rigoureusement la longueur en nombre de caractères
     * (évite tout décalage d'offset de découpe entre le texte normalisé et le texte source).
     */
    protected function normalize1to1(string $string): string
    {
        $string = mb_strtolower($string, 'UTF-8');
        $table = [
            'à'=>'a', 'á'=>'a', 'â'=>'a', 'ã'=>'a', 'ä'=>'a', 'å'=>'a',
            'è'=>'e', 'é'=>'e', 'ê'=>'e', 'ë'=>'e',
            'ì'=>'i', 'í'=>'i', 'î'=>'i', 'ï'=>'i',
            'ò'=>'o', 'ó'=>'o', 'ô'=>'o', 'õ'=>'o', 'ö'=>'o',
            'ù'=>'u', 'ú'=>'u', 'û'=>'u', 'ü'=>'u',
            'ý'=>'y', 'ÿ'=>'y',
            'ç'=>'c', 'ñ'=>'n',
            'œ'=>'e', 'æ'=>'a',
        ];
        return strtr($string, $table);
    }

    /**
     * Génère un extrait contextuel autour d'un mot-clé trouvé dans le texte extrait.
     * Totalement insensible aux accents, à la casse et aux variantes de mots.
     */
    public function generateSnippet(?string $text, string $keyword, int $radius = 70): ?string
    {
        if (empty($text) || empty($keyword)) {
            return null;
        }

        $normText = $this->normalize1to1($text);
        $normKeyword = $this->normalize1to1($keyword);
        $pos = mb_stripos($normText, $normKeyword);
        $matchLen = mb_strlen($normKeyword);

        if ($pos === false) {
            $words = array_filter(preg_split('/\s+/', $keyword), fn ($w) => mb_strlen($w) >= 3);
            foreach ($words as $w) {
                $normW = $this->normalize1to1($w);
                $p = mb_stripos($normText, $normW);
                if ($p !== false) {
                    $pos = $p;
                    $matchLen = mb_strlen($normW);
                    break;
                }
                if (mb_strlen($normW) >= 6) {
                    $root = mb_substr($normW, 0, 5);
                    $p = mb_stripos($normText, $root);
                    if ($p !== false) {
                        $pos = $p;
                        $matchLen = 5;
                        break;
                    }
                }
            }
        }

        // Repli avec Str::ascii si des caractères non répertoriés sont présents
        if ($pos === false) {
            $asciiText = \Illuminate\Support\Str::ascii($text);
            $asciiKw = \Illuminate\Support\Str::ascii($keyword);
            $p = mb_stripos($asciiText, $asciiKw);
            if ($p !== false) {
                $pos = $p;
                $matchLen = mb_strlen($asciiKw);
            }
        }

        if ($pos === false) {
            return null;
        }

        $start = max(0, $pos - $radius);
        $extractLen = ($pos - $start) + $matchLen + $radius;
        $rawExtract = mb_substr($text, $start, $extractLen, 'UTF-8');

        $cleaned = trim(preg_replace('/\s+/', ' ', $rawExtract));

        $prefix = $start > 0 ? '… ' : '';
        $suffix = ($start + $extractLen < mb_strlen($text, 'UTF-8')) ? ' …' : '';

        return $prefix . $cleaned . $suffix;
    }

    public function findNiveauById(int $id): ?\App\Models\Niveau
    {
        return \App\Models\Niveau::find($id);
    }

    public function findNiveauByLibelle(string $libelle): ?\App\Models\Niveau
    {
        return \App\Models\Niveau::where('libelle', $libelle)->first();
    }
}
