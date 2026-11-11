<?php

namespace App\Support;

/**
 * Calcul PUR (sans base de données) du score de matching candidat / offre.
 *
 * Chaque critère renvoie un score entre 0 et 1 (ou null si l'offre n'exprime aucune exigence
 * sur ce critère : il est alors ignoré et les poids des autres sont renormalisés, donc
 * l'absence d'exigence ne pénalise jamais un candidat).
 */
final class MatchingScorer
{
    private const NIVEAUX_COMPETENCE = ['debutant' => 1, 'intermediaire' => 2, 'avance' => 3, 'expert' => 4];

    /** Niveau supposé quand le niveau d'une compétence du candidat est inconnu (Intermédiaire). */
    private const NIVEAU_COMPETENCE_INCONNU = 2;

    public static function normaliser(?string $texte): string
    {
        $texte = mb_strtolower(trim((string) $texte));

        return strtr($texte, [
            'à' => 'a', 'â' => 'a', 'ä' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'ö' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c', 'œ' => 'oe',
        ]);
    }

    public static function rangCompetence(?string $niveau): ?int
    {
        return self::NIVEAUX_COMPETENCE[self::normaliser($niveau)] ?? null;
    }

    /**
     * Rang d'un niveau d'études : Baccalauréat = 0, Bac+N = N, Doctorat = 8.
     */
    public static function rangNiveau(?string $niveau): ?int
    {
        $t = self::normaliser($niveau);
        if ($t === '') {
            return null;
        }
        if (preg_match('/bac\s*\+\s*(\d)/', $t, $m)) {
            return (int) $m[1];
        }
        if (str_contains($t, 'doctorat') || str_contains($t, 'phd')) {
            return 8;
        }
        if (preg_match('/master|ingenieur|\bm2\b/', $t)) {
            return 5;
        }
        if (str_contains($t, 'maitrise')) {
            return 4;
        }
        if (str_contains($t, 'licence')) {
            return 3;
        }
        if (preg_match('/\b(bts|dut|deug)\b/', $t)) {
            return 2;
        }
        if (str_contains($t, 'baccalaureat') || preg_match('/\bbac\b/', $t)) {
            return 0;
        }

        return null;
    }

    /**
     * @param  list<array{id: int|string, nom: string, niveau: ?string}>  $requises  compétences exigées par l'offre
     * @param  list<array{id: int|string, niveau: ?string}>  $candidat  compétences du candidat
     * @return array{score: float, detail: list<array<string, mixed>>}|null
     */
    public static function scoreCompetences(array $requises, array $candidat): ?array
    {
        if ($requises === []) {
            return null;
        }

        $parId = [];
        foreach ($candidat as $c) {
            $parId[(string) $c['id']] = $c['niveau'] ?? null;
        }

        $detail = [];
        $somme = 0.0;
        foreach ($requises as $req) {
            $id = (string) $req['id'];
            $present = array_key_exists($id, $parId);
            $score = 0.0;

            if ($present) {
                $rangReq = self::rangCompetence($req['niveau'] ?? null);
                $rangCand = self::rangCompetence($parId[$id]) ?? self::NIVEAU_COMPETENCE_INCONNU;
                $score = ($rangReq === null || $rangCand >= $rangReq) ? 1.0 : $rangCand / $rangReq;
            }

            $somme += $score;
            $detail[] = [
                'competence' => $req['nom'],
                'niveau_requis' => $req['niveau'] ?? null,
                'niveau_candidat' => $present ? $parId[$id] : null,
                'present' => $present,
                'score' => round($score, 2),
            ];
        }

        return ['score' => $somme / count($requises), 'detail' => $detail];
    }

    /**
     * @param  list<array{niveau_min: ?string, domaine: ?string}>  $exigences  lignes profil_formation de l'offre
     * @param  list<array{niveau: ?string, domaine: ?string, diplome: ?string}>  $formations  formations du candidat
     * @return array{score: float, detail: list<array<string, mixed>>}|null
     */
    public static function scoreFormation(array $exigences, array $formations): ?array
    {
        $rangs = array_filter(
            // Le niveau est souvent absent des données OCR : on le déduit alors de l'intitulé du diplôme
            // (« Master en Télécommunications » → Bac+5, « Licence … » → Bac+3).
            array_map(fn ($f) => self::rangNiveau($f['niveau'] ?? null) ?? self::rangNiveau($f['diplome'] ?? null), $formations),
            fn ($r) => $r !== null
        );
        $meilleur = $rangs === [] ? null : max($rangs);

        $texteCandidat = self::normaliser(implode(' ', array_map(
            fn ($f) => ($f['domaine'] ?? '') . ' ' . ($f['diplome'] ?? ''),
            $formations
        )));

        $detail = [];
        $somme = 0.0;
        $nb = 0;

        foreach ($exigences as $ex) {
            $min = self::rangNiveau($ex['niveau_min'] ?? null);
            $domaine = self::normaliser($ex['domaine'] ?? null);

            $scoreNiveau = null;
            if ($min !== null) {
                if ($meilleur === null) {
                    $scoreNiveau = 0.0;
                } elseif ($meilleur >= $min) {
                    $scoreNiveau = 1.0;
                } else {
                    $scoreNiveau = max(0.0, 1 - ($min - $meilleur) / max($min, 1));
                }
            }

            $scoreDomaine = null;
            if ($domaine !== '') {
                $scoreDomaine = 0.0;
                foreach (preg_split('/[^a-z0-9]+/', $domaine, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $mot) {
                    if (strlen($mot) >= 4 && str_contains($texteCandidat, $mot)) {
                        $scoreDomaine = 1.0;
                        break;
                    }
                }
            }

            if ($scoreNiveau === null && $scoreDomaine === null) {
                continue; // ligne sans exigence exploitable
            }

            // Niveau 70 %, domaine 30 % (renormalisé si l'un des deux manque)
            $poidsN = $scoreNiveau === null ? 0.0 : 0.7;
            $poidsD = $scoreDomaine === null ? 0.0 : 0.3;
            $score = (($scoreNiveau ?? 0) * $poidsN + ($scoreDomaine ?? 0) * $poidsD) / ($poidsN + $poidsD);

            $somme += $score;
            $nb++;
            $detail[] = [
                'niveau_min' => $ex['niveau_min'] ?? null,
                'domaine' => $ex['domaine'] ?? null,
                'meilleur_niveau_candidat_rang' => $meilleur,
                'score' => round($score, 2),
            ];
        }

        return $nb === 0 ? null : ['score' => $somme / $nb, 'detail' => $detail];
    }

    /**
     * Années d'expérience requises, lues dans les profils de l'offre :
     * type_valeur = "experience" + valeur_min numérique, ou une description du type « 3 ans d'expérience ».
     *
     * @param  list<array{type_valeur: ?string, valeur_min: ?string, description: ?string}>  $profils
     */
    public static function anneesRequises(array $profils): ?float
    {
        $max = null;
        foreach ($profils as $p) {
            $annees = null;
            if (self::normaliser($p['type_valeur'] ?? null) === 'experience' && is_numeric($p['valeur_min'] ?? null)) {
                $annees = (float) $p['valeur_min'];
            } else {
                $desc = self::normaliser($p['description'] ?? null);
                if (str_contains($desc, 'experience') && preg_match('/(\d+)\s*an/', $desc, $m)) {
                    $annees = (float) $m[1];
                }
            }
            if ($annees !== null && ($max === null || $annees > $max)) {
                $max = $annees;
            }
        }

        return $max;
    }

    /**
     * Années d'expérience cumulées (périodes qui se chevauchent comptées une seule fois).
     * Une période sans date de fin n'est comptée que si le poste est marqué « actuel ».
     *
     * @param  list<array{debut: ?string, fin: ?string, actuel: ?bool}>  $periodes
     */
    public static function anneesExperience(array $periodes, ?int $maintenantTs = null): float
    {
        $now = $maintenantTs ?? time();

        $intervalles = [];
        foreach ($periodes as $p) {
            $debut = ! empty($p['debut']) ? strtotime((string) $p['debut']) : false;
            if ($debut === false) {
                continue;
            }
            if (! empty($p['fin'])) {
                $fin = strtotime((string) $p['fin']);
                if ($fin === false) {
                    continue;
                }
            } elseif (! empty($p['actuel'])) {
                $fin = $now;
            } else {
                continue;
            }
            $fin = min($fin, $now);
            if ($fin > $debut) {
                $intervalles[] = [$debut, $fin];
            }
        }

        usort($intervalles, fn ($a, $b) => $a[0] <=> $b[0]);

        $total = 0;
        $courant = null;
        foreach ($intervalles as [$d, $f]) {
            if ($courant === null) {
                $courant = [$d, $f];
            } elseif ($d <= $courant[1]) {
                $courant[1] = max($courant[1], $f);
            } else {
                $total += $courant[1] - $courant[0];
                $courant = [$d, $f];
            }
        }
        if ($courant !== null) {
            $total += $courant[1] - $courant[0];
        }

        return round($total / (365.25 * 86400), 1);
    }

    public static function scoreExperience(?float $anneesRequises, float $anneesCandidat): ?array
    {
        if ($anneesRequises === null) {
            return null;
        }
        $score = $anneesRequises <= 0 ? 1.0 : min(1.0, $anneesCandidat / $anneesRequises);

        return [
            'score' => $score,
            'detail' => [['annees_requises' => $anneesRequises, 'annees_candidat' => $anneesCandidat]],
        ];
    }

    /**
     * Score global sur 100. Les critères null sont ignorés (poids renormalisés).
     *
     * @param  array<string, array{score: float}|null>  $criteres
     * @param  array<string, int|float>  $poids
     */
    public static function combiner(array $criteres, array $poids): ?int
    {
        $total = 0.0;
        $poidsTotal = 0.0;
        foreach ($criteres as $nom => $critere) {
            if ($critere === null) {
                continue;
            }
            $p = (float) ($poids[$nom] ?? 0);
            $total += $critere['score'] * $p;
            $poidsTotal += $p;
        }

        return $poidsTotal > 0 ? (int) round($total / $poidsTotal * 100) : null;
    }
}
