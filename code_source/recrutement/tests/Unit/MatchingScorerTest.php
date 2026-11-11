<?php

namespace Tests\Unit;

use App\Support\MatchingScorer;
use PHPUnit\Framework\TestCase;

class MatchingScorerTest extends TestCase
{
    public function test_rang_niveau_reconnait_les_libelles_du_referentiel(): void
    {
        $this->assertSame(0, MatchingScorer::rangNiveau('Baccalauréat'));
        $this->assertSame(2, MatchingScorer::rangNiveau('Bac+2 (BTS / DUT)'));
        $this->assertSame(3, MatchingScorer::rangNiveau('Bac+3 (Licence)'));
        $this->assertSame(5, MatchingScorer::rangNiveau('Bac+5 (Master 2 / Ingénieur)'));
        $this->assertSame(8, MatchingScorer::rangNiveau('Bac+8 (Doctorat)'));
        $this->assertSame(3, MatchingScorer::rangNiveau('Licence professionnelle'));
        $this->assertNull(MatchingScorer::rangNiveau(''));
        $this->assertNull(MatchingScorer::rangNiveau('Formation sur le tas'));
    }

    public function test_competences_presente_absente_et_niveau_insuffisant(): void
    {
        $requises = [
            ['id' => 1, 'nom' => 'PHP', 'niveau' => 'Avancé'],
            ['id' => 2, 'nom' => 'SQL', 'niveau' => 'Intermédiaire'],
            ['id' => 3, 'nom' => 'Docker', 'niveau' => null],
        ];
        $candidat = [
            ['id' => 1, 'niveau' => 'Débutant'],      // 1/3 du niveau requis
            ['id' => 2, 'niveau' => 'Expert'],        // dépasse l'exigence
        ];

        $res = MatchingScorer::scoreCompetences($requises, $candidat);

        $this->assertEqualsWithDelta((1 / 3 + 1 + 0) / 3, $res['score'], 0.001);
        $this->assertFalse($res['detail'][2]['present']);
    }

    public function test_competences_sans_exigence_est_ignore(): void
    {
        $this->assertNull(MatchingScorer::scoreCompetences([], [['id' => 1, 'niveau' => 'Expert']]));
    }

    public function test_formation_niveau_et_domaine(): void
    {
        $exigences = [['niveau_min' => 'Bac+3 (Licence)', 'domaine' => 'Informatique']];

        $ok = MatchingScorer::scoreFormation($exigences, [
            ['niveau' => 'Bac+5 Master', 'domaine' => 'Informatique de gestion', 'diplome' => 'Master'],
        ]);
        $this->assertEqualsWithDelta(1.0, $ok['score'], 0.001);

        $insuffisant = MatchingScorer::scoreFormation($exigences, [
            ['niveau' => 'Bac+2 (BTS / DUT)', 'domaine' => 'Comptabilité', 'diplome' => 'BTS'],
        ]);
        // niveau : 1 - (3-2)/3 = 0.667 -> 0.7 * 0.667 ; domaine : 0 -> 0.3 * 0
        $this->assertEqualsWithDelta(0.7 * (2 / 3), $insuffisant['score'], 0.001);

        $this->assertNull(MatchingScorer::scoreFormation([['niveau_min' => null, 'domaine' => null]], []));
    }

    public function test_annees_requises_depuis_les_profils(): void
    {
        $this->assertSame(3.0, MatchingScorer::anneesRequises([
            ['type_valeur' => 'experience', 'valeur_min' => '3', 'description' => null],
        ]));
        $this->assertSame(5.0, MatchingScorer::anneesRequises([
            ['type_valeur' => null, 'valeur_min' => null, 'description' => '5 ans d\'expérience en maintenance'],
        ]));
        $this->assertNull(MatchingScorer::anneesRequises([
            ['type_valeur' => null, 'valeur_min' => null, 'description' => 'Permis B'],
        ]));
    }

    public function test_annees_experience_fusionne_les_chevauchements_et_ignore_les_fins_manquantes(): void
    {
        $maintenant = strtotime('2026-01-01');

        $annees = MatchingScorer::anneesExperience([
            ['debut' => '2020-01-01', 'fin' => '2022-01-01', 'actuel' => false],
            ['debut' => '2021-01-01', 'fin' => '2023-01-01', 'actuel' => false], // chevauche : total 2020 -> 2023
            ['debut' => '2015-01-01', 'fin' => null, 'actuel' => false],         // fin inconnue : ignorée
        ], $maintenant);

        $this->assertEqualsWithDelta(3.0, $annees, 0.1);

        $enCours = MatchingScorer::anneesExperience([
            ['debut' => '2024-01-01', 'fin' => null, 'actuel' => true],
        ], $maintenant);
        $this->assertEqualsWithDelta(2.0, $enCours, 0.1);
    }

    public function test_experience_plafonnee_a_1(): void
    {
        $this->assertSame(1.0, MatchingScorer::scoreExperience(2.0, 6.0)['score']);
        $this->assertEqualsWithDelta(0.5, MatchingScorer::scoreExperience(4.0, 2.0)['score'], 0.001);
        $this->assertNull(MatchingScorer::scoreExperience(null, 10.0));
    }

    public function test_le_niveau_est_deduit_de_l_intitule_du_diplome_quand_il_est_absent(): void
    {
        $exigences = [['niveau_min' => 'Bac+3 (Licence)', 'domaine' => 'Télécommunications']];

        // Cas réel OCR : pas de champ « niveau », seulement l'intitulé du diplôme.
        $resultat = MatchingScorer::scoreFormation($exigences, [
            ['niveau' => null, 'domaine' => 'Télécommunications', 'diplome' => 'Master en Télécommunications'],
            ['niveau' => null, 'domaine' => 'Télécommunications', 'diplome' => 'Licence en Télécommunications'],
            ['niveau' => null, 'domaine' => 'Série S', 'diplome' => 'Baccalauréat Série S'],
        ]);

        $this->assertSame(1.0, $resultat['score']);
        $this->assertSame(5, $resultat['detail'][0]['meilleur_niveau_candidat_rang']);
    }

    public function test_combiner_renormalise_les_poids_des_criteres_absents(): void
    {
        $poids = ['competences' => 50, 'formation' => 30, 'experience' => 20];

        $this->assertSame(100, MatchingScorer::combiner([
            'competences' => ['score' => 1.0], 'formation' => ['score' => 1.0], 'experience' => ['score' => 1.0],
        ], $poids));

        // Pas d'exigence de formation : (0.5*50 + 1*20) / 70 = 0.643 -> 64
        $this->assertSame(64, MatchingScorer::combiner([
            'competences' => ['score' => 0.5], 'formation' => null, 'experience' => ['score' => 1.0],
        ], $poids));

        $this->assertNull(MatchingScorer::combiner(['competences' => null, 'formation' => null, 'experience' => null], $poids));
    }
}
