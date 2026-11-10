<?php

namespace Database\Seeders;

use App\Models\Competence;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Offre de démonstration « Ingénieur Réseaux & Télécoms » : exigences calées sur un profil
 * Master Télécoms (réseaux mobiles, Datacom Huawei, cybersécurité, développement web).
 *
 * Idempotent : peut être relancé sans créer de doublon.
 *   php artisan db:seed --class=OffreTelecomSeeder
 *
 * Prérequis : référentiels de base (DatabaseSeeder : directions, statuts, contrats, lieux).
 */
class OffreTelecomSeeder extends Seeder
{
    private const TITRE = 'Ingénieur Réseaux & Télécoms';

    public function run(): void
    {
        $idDirection = DB::table('direction')->where('nom_direction', 'Informatique')->value('id_direction');
        $idStatut = DB::table('statut_offre')->where('libelle', 'Publiee')->value('id_statut_offre');
        $idContrat = DB::table('type_contrat')->where('libelle', 'CDI')->value('id_type_contrat');
        $idLieu = DB::table('lieu')->where('libelle', 'Antananarivo')->value('id_lieu');

        if (!$idDirection || !$idStatut || !$idContrat) {
            $this->command?->error('Référentiels manquants : lancez d\'abord `php artisan db:seed` (DatabaseSeeder).');

            return;
        }

        DB::transaction(function () use ($idDirection, $idStatut, $idContrat, $idLieu): void {
            $idOffre = DB::table('offre')->where('titre_poste', self::TITRE)->value('id_offre');

            $valeurs = [
                'id_direction' => $idDirection,
                'id_statut_offre' => $idStatut,
                'id_type_contrat' => $idContrat,
                'id_lieu' => $idLieu ?? 1,
                'lieu' => 'Antananarivo',
                'description' => "Alpha Ciment recherche un(e) ingénieur(e) Réseaux & Télécoms pour accompagner la fiabilité "
                    . "et l'évolution de ses réseaux (sites, usines, liaisons mobiles). Vous participez aux surveys de sites, "
                    . "à la configuration et à la simulation des systèmes réseau, à la documentation technique et à la sécurité "
                    . "des réseaux, et contribuez aux interfaces web internes. Profil jeune diplômé accepté.",
                'date_publication' => now()->toDateString(),
                'date_limite' => now()->addDays(60)->toDateString(),
                'updated_at' => now(),
            ];

            if ($idOffre) {
                DB::table('offre')->where('id_offre', $idOffre)->update($valeurs);
            } else {
                $idOffre = DB::table('offre')->insertGetId($valeurs + [
                    'titre_poste' => self::TITRE,
                    'reference' => 'INF-RT-' . now()->format('y') . '01',
                    'created_at' => now(),
                ], 'id_offre');
            }

            // Nettoyage des lignes enfants pour rester idempotent
            DB::table('profil_competence')->where('id_offre', $idOffre)->delete();
            DB::table('profil_formation')->where('id_offre', $idOffre)->delete();
            DB::table('profil_offre')->where('id_offre', $idOffre)->delete();
            DB::table('mission')->where('id_offre', $idOffre)->delete();

            // Compétences exigées (mêmes libellés que ceux extraits d'un CV : le rapprochement les retrouve)
            $typeTechnique = DB::table('type_competence')->where('libelle', 'Technique')->value('id_type_competence') ?? 1;
            $typeMethodo = DB::table('type_competence')->where('libelle', 'Méthodologie')->value('id_type_competence') ?? $typeTechnique;

            foreach ([
                ['Réseaux mobiles', 'Intermediaire', $typeTechnique],
                ['Configuration et simulation de systèmes réseau', 'Intermediaire', $typeTechnique],
                ['Surveys de sites télécoms', 'Intermediaire', $typeTechnique],
                ['Documentation de sites télécoms', 'Debutant', $typeMethodo],
                ['Datacom (Huawei)', 'Debutant', $typeTechnique],
                ['Cybersécurité réseau', 'Debutant', $typeTechnique],
                ['Développement web', 'Debutant', $typeTechnique],
                ["Conception d'interfaces numériques", 'Debutant', $typeTechnique],
            ] as [$nom, $niveau, $type]) {
                $competence = Competence::trouverOuCreer($nom, ['id_type_competence' => $type]);

                DB::table('profil_competence')->updateOrInsert(
                    ['id_offre' => $idOffre, 'id_competence' => $competence->id_competence],
                    ['niveau_requis' => $niveau]
                );
            }

            // Formation : Licence minimum (Bac+3), Master apprécié (Bac+5), domaine Télécommunications
            $formation = [
                'id_offre' => $idOffre,
                'niveau_min' => 'Bac+3 (Licence)',
                'niveau_max' => 'Bac+5 (Master 2 / Ingénieur)',
                'domaine' => 'Télécommunications',
                'obligatoire' => true,
                'created_at' => now(),
            ];
            if (Schema::hasColumn('profil_formation', 'id_niveau_min')) {
                $formation['id_niveau_min'] = DB::table('niveau')->where('libelle', 'Bac+3 (Licence)')->value('id_niveau');
            }
            if (Schema::hasColumn('profil_formation', 'id_niveau_max')) {
                $formation['id_niveau_max'] = DB::table('niveau')->where('libelle', 'Bac+5 (Master 2 / Ingénieur)')->value('id_niveau');
            }
            DB::table('profil_formation')->insert($formation);

            // Expérience : 1 an (stages et missions terrain comptent ; un jeune diplômé obtient un score partiel)
            DB::table('profil_offre')->insert([
                'id_offre' => $idOffre,
                'description' => "1 an d'expérience en réseaux / télécoms (stages et missions terrain acceptés)",
                'type_valeur' => 'experience',
                'valeur_min' => '1',
                'valeur_attendue' => '1',
                'unite_valeur' => 'ans',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ([
                'Réaliser les surveys de sites télécoms et documenter les installations techniques',
                'Configurer et simuler les systèmes réseau (réseaux mobiles, liaisons, équipements Huawei)',
                'Assurer l\'exploitation et la sécurisation des réseaux (fondamentaux de cybersécurité)',
                'Contribuer au développement et à la conception d\'interfaces web internes',
            ] as $i => $mission) {
                DB::table('mission')->insert([
                    'id_offre' => $idOffre,
                    'description' => $mission,
                    'ordre' => $i + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $this->command?->info("Offre « " . self::TITRE . " » prête (id {$idOffre}, publiée).");
        });
    }
}
