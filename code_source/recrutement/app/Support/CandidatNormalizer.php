<?php

namespace App\Support;

/**
 * Normalisation des coordonnées et du nom d'un candidat pour la détection « douce » des doublons.
 */
final class CandidatNormalizer
{
    /**
     * E-mail en minuscules ; pour Gmail, les points et le suffixe +tag du nom local sont ignorés.
     */
    public static function email(?string $email): ?string
    {
        $email = mb_strtolower(trim((string) $email));
        if ($email === '' || ! str_contains($email, '@')) {
            return null;
        }

        [$local, $domain] = explode('@', $email, 2);
        if ($domain === 'googlemail.com') {
            $domain = 'gmail.com';
        }
        if ($domain === 'gmail.com') {
            $local = str_replace('.', '', explode('+', $local, 2)[0]);
        }

        return $local === '' ? null : $local . '@' . $domain;
    }

    /**
     * Téléphone malgache ramené au format national à 10 chiffres (ex. 0341234567).
     * +261 34 12 345 67, 00261341234567 et 034 12 345 67 donnent le même résultat.
     */
    public static function telephone(?string $telephone): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $telephone) ?? '';

        if (str_starts_with($digits, '00261')) {
            $digits = substr($digits, 5);
        } elseif (str_starts_with($digits, '261') && strlen($digits) >= 12) {
            $digits = substr($digits, 3);
        }

        if ($digits !== '' && $digits[0] !== '0' && strlen($digits) === 9) {
            $digits = '0' . $digits;
        }

        return strlen($digits) >= 9 ? $digits : null;
    }

    /**
     * Nom + prénom sans accents, en minuscules, prénom et nom indifféremment ordonnés.
     */
    public static function nomComplet(?string $nom, ?string $prenom): ?string
    {
        $mots = [];
        foreach ([$nom, $prenom] as $partie) {
            $partie = mb_strtolower(trim((string) $partie));
            $partie = preg_replace('/[^a-z0-9 ]+/', '', self::sansAccents($partie)) ?? '';
            foreach (preg_split('/\s+/', $partie, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $mot) {
                $mots[] = $mot;
            }
        }

        if (count($mots) < 2) {
            return null;
        }

        sort($mots);

        return implode(' ', $mots);
    }

    private static function sansAccents(string $texte): string
    {
        return strtr($texte, [
            'à' => 'a', 'â' => 'a', 'ä' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'ö' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c', 'ñ' => 'n',
        ]);
    }
}
