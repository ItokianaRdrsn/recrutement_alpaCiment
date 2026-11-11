<?php

namespace App\Repositories\Eloquent;

use App\Models\Candidature;
use App\Models\Document;
use App\Models\HistoriqueStatut;
use App\Models\StatutCandidature;
use App\Repositories\Contracts\CandidatureRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EloquentCandidatureRepository implements CandidatureRepositoryInterface
{
    public function paginateFiltered(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $hasOcrTable = Schema::hasTable('cv_extraction_ocr');
        $withRelations = [
            'candidat',
            'offre.direction',
            'domaine.direction',
            'typeDemande',
            'statut',
            'documents',
            'competences',
            'formations',
            'experiences',
            'projets',
            'autres',
        ];
        if ($hasOcrTable) {
            $withRelations[] = 'cvExtractionOcr';
        }

        $isPgsql = DB::getDriverName() === 'pgsql';
        $likeOp = $isPgsql ? 'ILIKE' : 'like';
        $hasTsvector = $isPgsql && Schema::hasColumn('document', 'recherche_texte');

        $query = Candidature::query()->with($withRelations);

        // 1. Recherche plein-texte / mots-clés dans les candidats (nom, prénom, email) ET recherche plein texte dans le CV
        if (!empty($filters['q'])) {
            $q = trim($filters['q']);
            $escapedQ = addcslashes($q, '%_\\');
            $query->where(function ($rootQ) use ($q, $escapedQ, $likeOp, $hasTsvector, $hasOcrTable, $isPgsql) {
                $rootQ->whereHas('candidat', function ($sub) use ($escapedQ, $likeOp, $isPgsql) {
                    if ($isPgsql) {
                        $sub->whereRaw('unaccent(nom) ILIKE unaccent(?)', ["%{$escapedQ}%"])
                            ->orWhereRaw('unaccent(prenom) ILIKE unaccent(?)', ["%{$escapedQ}%"])
                            ->orWhere('email', 'ILIKE', "%{$escapedQ}%");
                    } else {
                        $sub->where('nom', $likeOp, "%{$escapedQ}%")
                            ->orWhere('prenom', $likeOp, "%{$escapedQ}%")
                            ->orWhere('email', $likeOp, "%{$escapedQ}%");
                    }
                });

                $this->applyDocumentSearch($rootQ, $q, $hasTsvector, $isPgsql, $likeOp, true);

                if ($isPgsql) {
                    $rootQ->orWhereRaw('unaccent(poste_souhaite) ILIKE unaccent(?)', ["%{$escapedQ}%"]);
                } else {
                    $rootQ->orWhere('poste_souhaite', $likeOp, "%{$escapedQ}%");
                }

                if ($hasOcrTable) {
                    $this->applyOcrSearch($rootQ, $q, $isPgsql, $likeOp, true);
                }
            });
        }

        // 2. Recherche textuelle / tsvector dans les CVs extraits (documents ou cvExtractionOcr)
        if (!empty($filters['cv_keyword'])) {
            $term = trim($filters['cv_keyword']);

            $query->where(function ($sub) use ($term, $hasTsvector, $hasOcrTable, $likeOp, $isPgsql) {
                $this->applyDocumentSearch($sub, $term, $hasTsvector, $isPgsql, $likeOp, false);

                if ($hasOcrTable) {
                    $this->applyOcrSearch($sub, $term, $isPgsql, $likeOp, true);
                }
            });
        }

        // 3. Filtrage par compétences (IDs ou noms, modes any ou all)
        if (!empty($filters['competences'])) {
            $rawComps = is_array($filters['competences'])
                ? $filters['competences']
                : array_filter(array_map('trim', explode(',', (string) $filters['competences'])));

            $compIds = [];
            $compNames = [];
            foreach ($rawComps as $item) {
                if (is_numeric($item)) {
                    $compIds[] = (int) $item;
                } elseif (!empty($item)) {
                    $compNames[] = (string) $item;
                }
            }

            $mode = strtolower((string) ($filters['competence_mode'] ?? 'any'));

            if ($mode === 'all') {
                foreach ($compIds as $cId) {
                    $query->whereHas('competences', function ($q) use ($cId) {
                        $q->where('competence.id_competence', $cId);
                    });
                }
                foreach ($compNames as $cName) {
                    $escCName = addcslashes($cName, '%_\\');
                    $query->whereHas('competences', function ($q) use ($escCName, $likeOp, $isPgsql) {
                        if ($isPgsql) {
                            $q->whereRaw('unaccent(competence.nom_competence) ILIKE unaccent(?)', ["%{$escCName}%"]);
                        } else {
                            $q->where('competence.nom_competence', $likeOp, "%{$escCName}%");
                        }
                    });
                }
            } else {
                $query->whereHas('competences', function ($q) use ($compIds, $compNames, $likeOp, $isPgsql) {
                    $q->where(function ($sub) use ($compIds, $compNames, $likeOp, $isPgsql) {
                        if (!empty($compIds)) {
                            $sub->whereIn('competence.id_competence', $compIds);
                        }
                        if (!empty($compNames)) {
                            $sub->orWhere(function ($subName) use ($compNames, $likeOp, $isPgsql) {
                                foreach ($compNames as $name) {
                                    $escName = addcslashes($name, '%_\\');
                                    if ($isPgsql) {
                                        $subName->orWhereRaw('unaccent(competence.nom_competence) ILIKE unaccent(?)', ["%{$escName}%"]);
                                    } else {
                                        $subName->orWhere('competence.nom_competence', $likeOp, "%{$escName}%");
                                    }
                                }
                            });
                        }
                    });
                });
            }
        }

        // 4. Filtrage par niveau d'études ou diplôme
        if (!empty($filters['niveau_etude'])) {
            $lvl = trim($filters['niveau_etude']);
            $escLvl = addcslashes($lvl, '%_\\');
            $query->whereHas('formations', function ($fQuery) use ($escLvl, $likeOp, $isPgsql) {
                if ($isPgsql) {
                    $fQuery->whereRaw('unaccent(niveau) ILIKE unaccent(?)', ["%{$escLvl}%"])
                        ->orWhereRaw('unaccent(diplome) ILIKE unaccent(?)', ["%{$escLvl}%"]);
                } else {
                    $fQuery->where('niveau', $likeOp, "%{$escLvl}%")
                        ->orWhere('diplome', $likeOp, "%{$escLvl}%");
                }
            });
        }
        if (!empty($filters['id_niveau'])) {
            $idNiv = (int) $filters['id_niveau'];
            $query->whereHas('formations', function ($fQuery) use ($idNiv) {
                $fQuery->where('id_niveau', $idNiv);
            });
        }

        // 5. Filtrage par années d'expérience minimum cumulées
        if (isset($filters['annees_exp_min']) && is_numeric($filters['annees_exp_min']) && (float) $filters['annees_exp_min'] > 0) {
            $minYears = (float) $filters['annees_exp_min'];
            $daysNeeded = (int) ($minYears * 365);

            $expTable = Schema::hasTable('candidat_experience_professionnelle')
                ? 'candidat_experience_professionnelle'
                : 'experience_professionnelle';

            $diffExpr = $isPgsql
                ? 'SUM(COALESCE(date_fin, CURRENT_DATE) - date_debut)'
                : "SUM(julianday(COALESCE(date_fin, date('now'))) - julianday(date_debut))";

            $query->whereIn('candidature.id_candidature', function ($sub) use ($expTable, $diffExpr, $daysNeeded) {
                $sub->select('id_candidature')
                    ->from($expTable)
                    ->whereNotNull('date_debut')
                    ->groupBy('id_candidature')
                    ->havingRaw("{$diffExpr} >= ?", [$daysNeeded]);
            });
        }

        // 6. Filtrage par poste ou métier
        if (!empty($filters['poste_keyword'])) {
            $p = trim($filters['poste_keyword']);
            $escP = addcslashes($p, '%_\\');
            $query->where(function ($sub) use ($escP, $likeOp, $isPgsql) {
                if ($isPgsql) {
                    $sub->whereRaw('unaccent(poste_souhaite) ILIKE unaccent(?)', ["%{$escP}%"])
                        ->orWhereHas('experiences', function ($expQ) use ($escP) {
                            $expQ->whereRaw('unaccent(poste) ILIKE unaccent(?)', ["%{$escP}%"]);
                        });
                } else {
                    $sub->where('poste_souhaite', $likeOp, "%{$escP}%")
                        ->orWhereHas('experiences', function ($expQ) use ($escP, $likeOp) {
                            $expQ->where('poste', $likeOp, "%{$escP}%");
                        });
                }
            });
        }

        // 7. Filtrage par vivier
        if (isset($filters['dans_vivier']) && $filters['dans_vivier'] !== '') {
            $inVivier = filter_var($filters['dans_vivier'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($inVivier !== null) {
                $query->where('dans_vivier', $inVivier);
            }
        }

        // 8. Filtres standards existants (statut, offre, type_demande, canal, direction)
        if (!empty($filters['statut'])) {
            $query->where('id_statut_candidature', $filters['statut']);
        }

        if (!empty($filters['offre'])) {
            $query->where('id_offre', $filters['offre']);
        }

        if (!empty($filters['type_demande'])) {
            $type = strtolower((string) $filters['type_demande']);
            if ($type === 'offre' || $type === '1') {
                $query->whereNotNull('id_offre');
            } elseif ($type === 'spontanee' || $type === '2') {
                $query->whereNull('id_offre');
            }
        }

        if (!empty($filters['canal_depot'])) {
            $query->where('canal_depot', $filters['canal_depot']);
        }

        if (!empty($filters['direction'])) {
            $directionId = (int) $filters['direction'];
            $query->where(function ($sub) use ($directionId) {
                $sub->whereHas('offre', function ($o) use ($directionId) {
                    $o->where('id_direction', $directionId);
                })
                ->orWhereHas('domaine', function ($d) use ($directionId) {
                    $d->where('id_direction', $directionId)
                      ->where('valide', true);
                });
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate($perPage);

        // 9. Génération dynamique de l'extrait contextuel de CV si mot-clé demandé
        $snippetTerm = !empty($filters['cv_keyword']) ? trim($filters['cv_keyword']) : (!empty($filters['q']) ? trim($filters['q']) : null);
        if (!empty($snippetTerm)) {
            $cvTerm = $snippetTerm;
            $paginator->getCollection()->transform(function ($cand) use ($cvTerm) {
                $snippet = null;
                if ($cand->relationLoaded('documents')) {
                    foreach ($cand->documents as $doc) {
                        if (!empty($doc->contenu_texte_extrait)) {
                            $snippet = $this->generateSnippet($doc->contenu_texte_extrait, $cvTerm);
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
                        $snippet = $this->generateSnippet($rawOcr, $cvTerm);
                    }
                }
                if (!$snippet && !empty($cand->poste_souhaite)) {
                    $snippet = $this->generateSnippet($cand->poste_souhaite, $cvTerm, 60);
                }
                if (!$snippet && $cand->relationLoaded('competences')) {
                    foreach ($cand->competences as $c) {
                        if ($this->generateSnippet($c->nom_competence, $cvTerm, 40)) {
                            $snippet = 'Compétence : ' . $c->nom_competence;
                            break;
                        }
                    }
                }
                if (!$snippet && $cand->relationLoaded('candidat') && $cand->candidat) {
                    $fullCandName = trim(($cand->candidat->prenom ?? '') . ' ' . ($cand->candidat->nom ?? ''));
                    if ($this->generateSnippet($fullCandName, $cvTerm, 40)) {
                        $snippet = 'Candidat : ' . $fullCandName;
                    }
                }
                $cand->cv_snippet = $snippet;
                return $cand;
            });
        }

        return $paginator;
    }

    /**
     * Recherche textuelle dans les documents attachés.
     * Utilise websearch_to_tsquery('french_unaccent', ?) en direct sur l'index GIN quand tsvector est disponible.
     */
    private function applyDocumentSearch($query, string $term, bool $hasTsvector, bool $isPgsql, string $likeOp, bool $isOr = false): void
    {
        $callback = function ($docQuery) use ($term, $hasTsvector, $isPgsql, $likeOp) {
            if ($hasTsvector) {
                $docQuery->whereRaw("recherche_texte @@ websearch_to_tsquery('french_unaccent', ?)", [$term]);
            } else {
                $escaped = addcslashes($term, '%_\\');
                if ($isPgsql) {
                    $docQuery->whereRaw('unaccent(contenu_texte_extrait) ILIKE unaccent(?)', ["%{$escaped}%"]);
                } else {
                    $docQuery->where('contenu_texte_extrait', $likeOp, "%{$escaped}%");
                }
            }
        };

        if ($isOr) {
            $query->orWhereHas('documents', $callback);
        } else {
            $query->whereHas('documents', $callback);
        }
    }

    /**
     * Recherche textuelle dans le texte brut OCR.
     */
    private function applyOcrSearch($query, string $term, bool $isPgsql, string $likeOp, bool $isOr = false): void
    {
        $escaped = addcslashes($term, '%_\\');
        $callback = function ($ocrQ) use ($escaped, $isPgsql, $likeOp) {
            if ($isPgsql) {
                $ocrQ->whereRaw('unaccent(texte_brut_ocr) ILIKE unaccent(?)', ["%{$escaped}%"]);
            } else {
                $ocrQ->where('texte_brut_ocr', $likeOp, "%{$escaped}%");
            }
        };

        if ($isOr) {
            $query->orWhereHas('cvExtractionOcr', $callback);
        } else {
            $query->whereHas('cvExtractionOcr', $callback);
        }
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

    public function findById(int $id, array $relations = []): Candidature
    {
        $query = Candidature::query();
        if (!empty($relations)) {
            $query->with($relations);
        } else {
            $query->with([
                'candidat',
                'offre.direction',
                'domaine.direction',
                'typeDemande',
                'statut',
                'documents',
                'cvExtractionOcr',
                'historique.statut',
                'historique.utilisateur',
                'competences',
                'formations',
                'experiences',
                'projets',
                'autres',
            ]);
        }

        return $query->findOrFail($id);
    }

    public function findByIdForUpdate(int $id, array $relations = []): Candidature
    {
        $query = Candidature::query()->lockForUpdate();
        if (!empty($relations)) {
            $query->with($relations);
        } else {
            $query->with(['candidat', 'offre', 'statut']);
        }
        return $query->findOrFail($id);
    }

    public function findStatutById(int $id): ?\App\Models\StatutCandidature
    {
        return \App\Models\StatutCandidature::find($id);
    }

    public function findByCleIdempotence(string $cle, array $relations = []): ?Candidature
    {
        $query = Candidature::query()->where('cle_idempotence', $cle);
        if (!empty($relations)) {
            $query->with($relations);
        } else {
            $query->with(['candidat', 'offre', 'statut']);
        }
        return $query->first();
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

    public function create(array $attributes): Candidature
    {
        return Candidature::create($attributes);
    }

    public function update(Candidature $candidature, array $attributes): bool
    {
        return $candidature->update($attributes);
    }

    public function markAsViewed(Candidature $candidature): bool
    {
        if (!$candidature->vue) {
            return $candidature->update(['vue' => true]);
        }
        return true;
    }

    public function createHistorique(array $attributes): HistoriqueStatut
    {
        return HistoriqueStatut::create($attributes);
    }

    public function createDocument(array $attributes): Document
    {
        return Document::create($attributes);
    }

    public function getStatusIdByLibelle(array|string|\App\Enums\StatutCandidatureEnum $libelles): ?int
    {
        if ($libelles instanceof \App\Enums\StatutCandidatureEnum) {
            $libelles = $libelles->variations();
        } elseif (is_string($libelles)) {
            $libelles = [$libelles];
        }

        $id = DB::table('statut_candidature')
            ->whereIn('libelle', $libelles)
            ->value('id_statut_candidature');

        if (!$id && (in_array('Reçue', $libelles, true) || in_array('Recue', $libelles, true))) {
            $id = DB::table('statut_candidature')->insertGetId([
                'libelle' => 'Reçue',
                'ordre_workflow' => 1,
            ], 'id_statut_candidature');
        }

        return $id ? (int) $id : null;
    }

    public function getTypeDemandeIdByLibelle(string|\App\Enums\TypeDemandeEnum $libelle): ?int
    {
        $val = $libelle instanceof \App\Enums\TypeDemandeEnum ? $libelle->value : $libelle;
        $id = DB::table('type_demande')->where('libelle', $val)->value('id_type_demande');
        return $id ? (int) $id : null;
    }

    public function getStatuts(): Collection
    {
        return StatutCandidature::orderBy('ordre_workflow')->get();
    }
}
