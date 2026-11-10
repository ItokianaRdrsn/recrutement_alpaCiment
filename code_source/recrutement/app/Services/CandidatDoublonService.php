<?php

namespace App\Services;

use App\Models\Candidat;
use App\Support\CandidatNormalizer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

/**
 * Détection « douce » des doublons de candidats : le service SIGNALE, le RH décide de fusionner.
 *
 * Critères (du plus fiable au moins fiable) :
 *  - téléphone identique après normalisation  -> confiance « forte »
 *  - e-mail identique après normalisation     -> confiance « forte »
 *  - nom + prénom identiques (sans accents)   -> confiance « faible » (homonymes possibles)
 */
class CandidatDoublonService
{
    public function __construct(protected AuditLogService $auditLogService) {}

    /**
     * @return list<array{critere: string, confiance: string, valeur: string, candidats: list<array<string, mixed>>}>
     */
    public function groupes(): array
    {
        return $this->construireGroupes(Candidat::query()->withCount('candidatures')->get());
    }

    /**
     * Doublons probables d'un candidat donné.
     *
     * @return list<array{critere: string, confiance: string, valeur: string, candidats: list<array<string, mixed>>}>
     */
    public function probablesPour(int $idCandidat): array
    {
        $groupes = array_filter(
            $this->groupes(),
            fn (array $g) => in_array($idCandidat, array_column($g['candidats'], 'id_candidat'), true)
        );

        return array_values($groupes);
    }

    /**
     * Fusionne $idDoublon dans $idPrincipal : ses candidatures sont rattachées au candidat principal,
     * puis la fiche doublon est supprimée. Action décidée par le RH, tracée dans l'audit.
     */
    public function fusionner(int $idPrincipal, int $idDoublon): Candidat
    {
        if ($idPrincipal === $idDoublon) {
            throw new InvalidArgumentException('Impossible de fusionner un candidat avec lui-même.');
        }

        return DB::transaction(function () use ($idPrincipal, $idDoublon) {
            $principal = Candidat::findOrFail($idPrincipal);
            $doublon = Candidat::findOrFail($idDoublon);

            $nbCandidatures = DB::table('candidature')
                ->where('id_candidat', $idDoublon)
                ->update(['id_candidat' => $idPrincipal]);

            if (Schema::hasTable('vivier_candidat')) {
                DB::table('vivier_candidat')->where('id_candidat', $idDoublon)->delete();
            }

            // On complète les champs vides du principal avec ceux du doublon (jamais d'écrasement).
            foreach (['telephone', 'adresse', 'date_naissance'] as $champ) {
                if (empty($principal->{$champ}) && ! empty($doublon->{$champ})) {
                    $principal->{$champ} = $doublon->{$champ};
                }
            }
            $principal->save();

            $doublon->delete();

            $this->auditLogService->log(
                'FUSION',
                'candidat',
                $idPrincipal,
                "Fusion du candidat #{$idDoublon} dans #{$idPrincipal} ({$nbCandidatures} candidature(s) rattachée(s)).",
                ['id_doublon' => $idDoublon],
                ['id_principal' => $idPrincipal, 'candidatures_deplacees' => $nbCandidatures]
            );

            return $principal->fresh();
        });
    }

    /**
     * @param  iterable<Candidat>  $candidats
     * @return list<array{critere: string, confiance: string, valeur: string, candidats: list<array<string, mixed>>}>
     */
    protected function construireGroupes(iterable $candidats): array
    {
        $criteres = [
            ['telephone', 'forte', fn (Candidat $c) => CandidatNormalizer::telephone($c->telephone)],
            ['email', 'forte', fn (Candidat $c) => CandidatNormalizer::email($c->email)],
            ['nom_prenom', 'faible', fn (Candidat $c) => CandidatNormalizer::nomComplet($c->nom, $c->prenom)],
        ];

        $groupes = [];
        foreach ($criteres as [$critere, $confiance, $cle]) {
            $index = [];
            foreach ($candidats as $candidat) {
                $valeur = $cle($candidat);
                if ($valeur !== null) {
                    $index[$valeur][] = $candidat;
                }
            }
            foreach ($index as $valeur => $membres) {
                if (count($membres) < 2) {
                    continue;
                }
                $groupes[] = [
                    'critere' => $critere,
                    'confiance' => $confiance,
                    'valeur' => (string) $valeur,
                    'candidats' => array_map(fn (Candidat $c) => [
                        'id_candidat' => $c->id_candidat,
                        'nom' => $c->nom,
                        'prenom' => $c->prenom,
                        'email' => $c->email,
                        'telephone' => $c->telephone,
                        'nb_candidatures' => $c->candidatures_count ?? null,
                    ], $membres),
                ];
            }
        }

        return $groupes;
    }
}
