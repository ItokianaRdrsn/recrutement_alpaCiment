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

use App\Models\CandidatExperience;
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
        ];
        if ($hasOcrTable) {
            $withRelations[] = 'cvExtractionOcr';
        }

        $query = Candidature::query()->with($withRelations);

        // 1. Recherche plein-texte / mots-clés dans les candidats (nom, prénom, email)
        if (!empty($filters['q'])) {
            $q = trim($filters['q']);
            $query->whereHas('candidat', function ($sub) use ($q) {
                $sub->where('nom', 'like', "%{$q}%")
                    ->orWhere('prenom', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        // 2. Recherche textuelle / tsvector dans les CVs extraits (documents ou cvExtractionOcr)
        if (!empty($filters['cv_keyword'])) {
            $term = trim($filters['cv_keyword']);
            $isPgsql = DB::getDriverName() === 'pgsql';
            $hasTsvector = $isPgsql && Schema::hasColumn('document', 'recherche_texte');

            $query->where(function ($sub) use ($term, $isPgsql, $hasTsvector, $hasOcrTable) {
                $sub->whereHas('documents', function ($docQuery) use ($term, $isPgsql, $hasTsvector) {
                    if ($hasTsvector) {
                        $docQuery->where(function ($w) use ($term) {
                            $w->whereRaw("recherche_texte @@ plainto_tsquery('french', ?)", [$term])
                                ->orWhere('contenu_texte_extrait', 'ILIKE', "%{$term}%");
                        });
                    } elseif ($isPgsql) {
                        $docQuery->where('contenu_texte_extrait', 'ILIKE', "%{$term}%");
                    } else {
                        $docQuery->where('contenu_texte_extrait', 'LIKE', "%{$term}%");
                    }
                });

                if ($hasOcrTable) {
                    $sub->orWhereHas('cvExtractionOcr', function ($ocrQ) use ($term, $isPgsql) {
                        if ($isPgsql) {
                            $ocrQ->where('texte_brut_ocr', 'ILIKE', "%{$term}%")
                                ->orWhereRaw("CAST(donnees_json AS TEXT) ILIKE ?", ["%{$term}%"]);
                        } else {
                            $ocrQ->where('texte_brut_ocr', 'LIKE', "%{$term}%")
                                ->orWhere('donnees_json', 'LIKE', "%{$term}%");
                        }
                    });
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
                    $query->whereHas('competences', function ($q) use ($cName) {
                        $q->where('competence.nom_competence', 'like', "%{$cName}%");
                    });
                }
            } else {
                $query->whereHas('competences', function ($q) use ($compIds, $compNames) {
                    $q->where(function ($sub) use ($compIds, $compNames) {
                        if (!empty($compIds)) {
                            $sub->whereIn('competence.id_competence', $compIds);
                        }
                        if (!empty($compNames)) {
                            $sub->orWhere(function ($subName) use ($compNames) {
                                foreach ($compNames as $name) {
                                    $subName->orWhere('competence.nom_competence', 'like', "%{$name}%");
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
            $query->whereHas('formations', function ($fQuery) use ($lvl) {
                $fQuery->where('niveau', 'like', "%{$lvl}%")
                    ->orWhere('diplome', 'like', "%{$lvl}%");
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
            $isPgsql = DB::getDriverName() === 'pgsql';

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
            $query->where(function ($sub) use ($p) {
                $sub->where('poste_souhaite', 'like', "%{$p}%")
                    ->orWhereHas('experiences', function ($expQ) use ($p) {
                        $expQ->where('poste', 'like', "%{$p}%");
                    });
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
        if (!empty($filters['cv_keyword'])) {
            $cvTerm = trim($filters['cv_keyword']);
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
                $cand->cv_snippet = $snippet;
                $cand->setAttribute('cv_snippet', $snippet);
                return $cand;
            });
        }

        return $paginator;
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
            ]);
        }

        return $query->findOrFail($id);
    }

    /**
     * Génère un extrait contextuel autour d'un mot-clé trouvé dans le texte extrait
     */
    protected function generateSnippet(?string $text, string $keyword, int $radius = 70): ?string
    {
        if (empty($text) || empty($keyword)) {
            return null;
        }

        $pos = mb_stripos($text, $keyword);
        if ($pos === false) {
            return null;
        }

        $start = max(0, $pos - $radius);
        $keywordLen = mb_strlen($keyword);
        $extractLen = ($pos - $start) + $keywordLen + $radius;
        $rawExtract = mb_substr($text, $start, $extractLen);

        $cleaned = trim(preg_replace('/\s+/', ' ', $rawExtract));

        $prefix = $start > 0 ? '… ' : '';
        $suffix = ($start + $extractLen < mb_strlen($text)) ? ' …' : '';

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

    public function getStatusIdByLibelle(array $libelles): ?int
    {
        $id = DB::table('statut_candidature')
            ->whereIn('libelle', $libelles)
            ->value('id_statut_candidature');

        if (!$id && in_array('Reçue', $libelles, true)) {
            $id = DB::table('statut_candidature')->insertGetId([
                'libelle' => 'Reçue',
                'ordre_workflow' => 1,
            ], 'id_statut_candidature');
        }

        return $id ? (int) $id : null;
    }

    public function getTypeDemandeIdByLibelle(string $libelle): ?int
    {
        $id = DB::table('type_demande')->where('libelle', $libelle)->value('id_type_demande');
        return $id ? (int) $id : null;
    }

    public function getStatuts(): Collection
    {
        return StatutCandidature::orderBy('ordre_workflow')->get();
    }
}
