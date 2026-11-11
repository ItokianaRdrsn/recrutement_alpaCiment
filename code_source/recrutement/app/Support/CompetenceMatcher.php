<?php

namespace App\Support;

/**
 * Recherche d'une compétence dans le référentiel, sans IA et sans extension de base de données.
 *
 * Trois niveaux, du plus sûr au plus souple :
 *  1. exact      : même texte, sans tenir compte de la casse, des accents ni des espaces
 *  2. compact    : même texte sans espaces ni ponctuation (« node.js » = « Node JS » = « nodejs »)
 *  3. approx     : faute de frappe ou pluriel (« Gestion de projets », « Photoshopp ») ;
 *                  jamais si les chiffres diffèrent (« Python 2 » ≠ « Python 3 ») ni pour les noms courts.
 */
final class CompetenceMatcher
{
    private const SEUIL_POURCENT = 82.0;
    private const LONGUEUR_MIN_APPROX = 5;
    private const DISTANCE_MAX = 2;

    public static function normaliser(?string $texte): string
    {
        $texte = mb_strtolower(trim((string) $texte));
        $texte = strtr($texte, [
            'à' => 'a', 'â' => 'a', 'ä' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'ö' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c', 'œ' => 'oe',
        ]);
        $texte = preg_replace('/\s+/', ' ', $texte) ?? '';

        return trim($texte, " \t.,;:-");
    }

    public static function compacter(string $normalise): string
    {
        return preg_replace('/[^a-z0-9]+/', '', $normalise) ?? '';
    }

    /**
     * Prépare le référentiel une seule fois pour plusieurs recherches.
     *
     * @param  list<string>  $noms
     * @return list<array{nom: string, norm: string, compact: string}>
     */
    public static function indexer(array $noms): array
    {
        $index = [];
        foreach ($noms as $nom) {
            $norm = self::normaliser($nom);
            $index[] = ['nom' => $nom, 'norm' => $norm, 'compact' => self::compacter($norm)];
        }

        return $index;
    }

    /**
     * @param  list<array{nom: string, norm: string, compact: string}>  $index  résultat de indexer()
     * @return array{nom: string, methode: string}|null  null si la compétence n'existe pas
     */
    public static function trouver(string $recherche, array $index): ?array
    {
        $norm = self::normaliser($recherche);
        if ($norm === '') {
            return null;
        }
        $compact = self::compacter($norm);

        foreach ($index as $entree) {
            if ($entree['norm'] === $norm) {
                return ['nom' => $entree['nom'], 'methode' => 'exact'];
            }
        }

        if ($compact !== '') {
            foreach ($index as $entree) {
                if ($entree['compact'] === $compact) {
                    return ['nom' => $entree['nom'], 'methode' => 'compact'];
                }
            }
        }

        if (strlen($compact) >= self::LONGUEUR_MIN_APPROX) {
            $meilleur = null;
            $meilleurPct = 0.0;
            $chiffres = preg_replace('/\D/', '', $compact);

            foreach ($index as $entree) {
                $autre = $entree['compact'];
                if (strlen($autre) < self::LONGUEUR_MIN_APPROX
                    || abs(strlen($autre) - strlen($compact)) > self::DISTANCE_MAX
                    || preg_replace('/\D/', '', $autre) !== $chiffres
                    || levenshtein($compact, $autre) > self::DISTANCE_MAX) {
                    continue;
                }
                similar_text($compact, $autre, $pct);
                if ($pct >= self::SEUIL_POURCENT && $pct > $meilleurPct) {
                    $meilleur = $entree['nom'];
                    $meilleurPct = $pct;
                }
            }

            if ($meilleur !== null) {
                return ['nom' => $meilleur, 'methode' => 'approx'];
            }
        }

        return null;
    }
}
