<?php

namespace App\Services;

use App\Models\Candidature;
use App\Models\Offre;
use App\Support\MatchingScorer;
use Illuminate\Support\Facades\DB;

/**
 * Matching candidat / offre explicable : un score global sur 100 décomposé par critère
 * (compétences, formation, expérience), avec le détail de chaque exigence.
 */
class MatchingService
{
    /**
     * @return array<string, mixed>|null null si la candidature n'est rattachée à aucune offre
     */
    public function evaluer(Candidature $candidature): ?array
    {
        if (! $candidature->id_offre) {
            return null;
        }

        $offre = $this->chargerOffre((int) $candidature->id_offre);

        return $offre ? $this->evaluerPourOffre($candidature, $offre) : null;
    }

    /**
     * Classement des candidatures d'une offre, meilleur score en premier.
     *
     * @return list<array<string, mixed>>
     */
    public function classement(int $idOffre): array
    {
        $offre = $this->chargerOffre($idOffre);
        if (! $offre) {
            return [];
        }

        $lignes = [];
        foreach ($this->candidaturesDeLOffre($idOffre) as $candidature) {
            $eval = $this->evaluerPourOffre($candidature, $offre);
            $lignes[] = [
                'id_candidature' => $candidature->id_candidature,
                'id_candidat' => $candidature->id_candidat,
                'nom' => $candidature->candidat?->nom,
                'prenom' => $candidature->candidat?->prenom,
                'score' => $eval['score'],
                'criteres' => array_map(fn ($c) => $c === null ? null : $c['score'], $eval['criteres']),
            ];
        }

        usort($lignes, fn ($a, $b) => ($b['score'] ?? -1) <=> ($a['score'] ?? -1));

        return $lignes;
    }

    /**
     * Recalcule et enregistre candidature.score_matching pour toutes les candidatures de l'offre.
     *
     * @return int nombre de candidatures mises à jour
     */
    public function recalculer(int $idOffre): int
    {
        $offre = $this->chargerOffre($idOffre);
        if (! $offre) {
            return 0;
        }

        $nb = 0;
        foreach ($this->candidaturesDeLOffre($idOffre) as $candidature) {
            $score = $this->evaluerPourOffre($candidature, $offre)['score'];
            DB::table('candidature')
                ->where('id_candidature', $candidature->id_candidature)
                ->update(['score_matching' => $score]);
            $nb++;
        }

        return $nb;
    }

    protected function chargerOffre(int $idOffre): ?Offre
    {
        return Offre::with(['competences', 'formations', 'profils'])->find($idOffre);
    }

    protected function candidaturesDeLOffre(int $idOffre)
    {
        return Candidature::query()
            ->where('id_offre', $idOffre)
            ->with(['candidat', 'competences', 'formations', 'experiences'])
            ->get();
    }

    /**
     * @return array{score: ?int, criteres: array<string, array<string, mixed>|null>, poids: array<string, int|float>}
     */
    protected function evaluerPourOffre(Candidature $candidature, Offre $offre): array
    {
        $candidature->loadMissing(['competences', 'formations', 'experiences']);

        $competences = MatchingScorer::scoreCompetences(
            $offre->competences->map(fn ($c) => [
                'id' => $c->id_competence,
                'nom' => $c->nom_competence,
                'niveau' => $c->pivot->niveau_requis ?? null,
            ])->all(),
            $candidature->competences->map(fn ($c) => [
                'id' => $c->id_competence,
                'niveau' => $c->pivot->niveau ?? null,
            ])->all()
        );

        $formation = MatchingScorer::scoreFormation(
            $offre->formations->map(fn ($f) => [
                'niveau_min' => $f->niveau_min,
                'domaine' => $f->domaine,
            ])->all(),
            $candidature->formations->map(fn ($f) => [
                'niveau' => $f->niveau,
                'domaine' => $f->domaine_etude,
                'diplome' => $f->diplome,
            ])->all()
        );

        $experience = MatchingScorer::scoreExperience(
            MatchingScorer::anneesRequises($offre->profils->map(fn ($p) => [
                'type_valeur' => $p->type_valeur,
                'valeur_min' => $p->valeur_min,
                'description' => $p->description,
            ])->all()),
            MatchingScorer::anneesExperience($candidature->experiences->map(fn ($e) => [
                'debut' => $e->date_debut,
                'fin' => $e->date_fin,
                'actuel' => (bool) $e->poste_actuel,
            ])->all())
        );

        $criteres = ['competences' => $competences, 'formation' => $formation, 'experience' => $experience];
        $poids = (array) config('recrutement.matching.poids', []);

        $sortie = [];
        foreach ($criteres as $nom => $critere) {
            $sortie[$nom] = $critere === null ? null : [
                'score' => (int) round($critere['score'] * 100),
                'poids' => $poids[$nom] ?? 0,
                'detail' => $critere['detail'],
            ];
        }

        return [
            'score' => MatchingScorer::combiner($criteres, $poids),
            'criteres' => $sortie,
            'poids' => $poids,
        ];
    }
}
