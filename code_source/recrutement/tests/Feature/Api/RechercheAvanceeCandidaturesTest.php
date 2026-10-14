<?php

namespace Tests\Feature\Api;

use App\Models\Candidat;
use App\Models\CandidatExperience;
use App\Models\CandidatFormation;
use App\Models\Candidature;
use App\Models\Competence;
use App\Models\Direction;
use App\Models\Document;
use App\Models\Domaine;
use App\Models\Offre;
use App\Models\StatutCandidature;
use App\Models\TypeCompetence;
use App\Models\TypeDemande;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RechercheAvanceeCandidaturesTest extends TestCase
{
    protected User $rhUser;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Définition des schémas SQLite pour l'environnement de test
        Schema::create('utilisateur', function (Blueprint $table) {
            $table->id('id_utilisateur');
            $table->string('nom', 100);
            $table->string('email', 150)->unique();
            $table->string('role', 30)->default('rh');
            $table->string('mot_de_passe', 255);
            $table->timestamps();
        });

        Schema::create('direction', function (Blueprint $table) {
            $table->id('id_direction');
            $table->string('nom_direction', 150);
            $table->timestamps();
        });

        Schema::create('domaine', function (Blueprint $table) {
            $table->id('id_domaine');
            $table->unsignedBigInteger('id_direction')->nullable();
            $table->string('nom_domaine', 150);
            $table->boolean('valide')->default(true);
            $table->timestamps();
        });

        Schema::create('statut_offre', function (Blueprint $table) {
            $table->id('id_statut_offre');
            $table->string('libelle', 100);
        });

        Schema::create('type_contrat', function (Blueprint $table) {
            $table->id('id_type_contrat');
            $table->string('libelle', 50);
        });

        Schema::create('offre', function (Blueprint $table) {
            $table->id('id_offre');
            $table->unsignedBigInteger('id_direction')->nullable();
            $table->unsignedBigInteger('id_statut_offre')->nullable();
            $table->unsignedBigInteger('id_type_contrat')->nullable();
            $table->string('titre_poste', 200);
            $table->timestamp('date_publication')->nullable();
            $table->timestamps();
        });

        Schema::create('type_demande', function (Blueprint $table) {
            $table->id('id_type_demande');
            $table->string('libelle', 50);
        });

        Schema::create('statut_candidature', function (Blueprint $table) {
            $table->id('id_statut_candidature');
            $table->string('libelle', 100);
            $table->integer('ordre_workflow')->default(10);
        });

        Schema::create('candidat', function (Blueprint $table) {
            $table->id('id_candidat');
            $table->string('nom', 150);
            $table->string('prenom', 150)->nullable();
            $table->string('email', 200)->unique();
            $table->timestamps();
        });

        Schema::create('candidature', function (Blueprint $table) {
            $table->id('id_candidature');
            $table->unsignedBigInteger('id_candidat');
            $table->unsignedBigInteger('id_type_demande')->nullable();
            $table->unsignedBigInteger('id_offre')->nullable();
            $table->unsignedBigInteger('id_domaine')->nullable();
            $table->unsignedBigInteger('id_statut_candidature')->nullable();
            $table->boolean('dans_vivier')->default(false);
            $table->boolean('vue')->default(false);
            $table->string('canal_depot', 50)->default('site_externe');
            $table->string('cle_idempotence', 255)->nullable();
            $table->string('poste_souhaite', 150)->nullable();
            $table->text('message')->nullable();
            $table->unsignedBigInteger('id_utilisateur_depot')->nullable();
            $table->timestamps();
        });

        Schema::create('document', function (Blueprint $table) {
            $table->id('id_document');
            $table->unsignedBigInteger('id_candidature');
            $table->string('type_document', 50)->default('cv');
            $table->string('nom_fichier', 255);
            $table->text('chemin_fichier');
            $table->string('mime_type', 100)->nullable();
            $table->bigInteger('taille_octets')->nullable();
            $table->string('mode_acquisition', 20)->default('fichier');
            $table->text('contenu_texte_extrait')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('type_competence', function (Blueprint $table) {
            $table->id('id_type_competence');
            $table->string('libelle', 100);
        });

        Schema::create('competence', function (Blueprint $table) {
            $table->id('id_competence');
            $table->string('nom_competence', 150)->unique();
            $table->unsignedBigInteger('id_type_competence');
        });

        Schema::create('candidat_competence', function (Blueprint $table) {
            $table->unsignedBigInteger('id_candidature');
            $table->unsignedBigInteger('id_competence');
            $table->string('niveau', 30)->nullable();
            $table->string('source', 20)->default('manuel');
            $table->decimal('score_confiance', 4, 3)->nullable();
            $table->unsignedBigInteger('id_document')->nullable();
            $table->boolean('valide')->default(false);
            $table->timestamp('date_validation')->nullable();
            $table->unsignedBigInteger('valide_par')->nullable();
            $table->primary(['id_candidature', 'id_competence']);
        });

        Schema::create('candidat_formation', function (Blueprint $table) {
            $table->id('id_formation');
            $table->unsignedBigInteger('id_candidature');
            $table->string('diplome', 200);
            $table->string('etablissement', 200)->nullable();
            $table->string('domaine_etude', 150)->nullable();
            $table->unsignedBigInteger('id_niveau')->nullable();
            $table->string('niveau', 50)->nullable();
            $table->date('date_obtention')->nullable();
            $table->string('source', 20)->default('manuel');
            $table->decimal('score_confiance', 4, 3)->nullable();
            $table->unsignedBigInteger('id_document')->nullable();
            $table->boolean('valide')->default(false);
            $table->timestamp('date_validation')->nullable();
            $table->unsignedBigInteger('valide_par')->nullable();
            $table->timestamps();
        });

        Schema::create('candidat_experience_professionnelle', function (Blueprint $table) {
            $table->id('id_experience');
            $table->unsignedBigInteger('id_candidature');
            $table->string('poste', 200);
            $table->string('entreprise', 200)->nullable();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->boolean('poste_actuel')->default(false);
            $table->text('description')->nullable();
            $table->string('source', 20)->default('manuel');
            $table->decimal('score_confiance', 4, 3)->nullable();
            $table->unsignedBigInteger('id_document')->nullable();
            $table->boolean('valide')->default(false);
            $table->timestamp('date_validation')->nullable();
            $table->unsignedBigInteger('valide_par')->nullable();
            $table->timestamps();
        });

        // 2. Utilisateur RH authentifié
        $this->rhUser = User::create([
            'nom' => 'Responsable RH AlpA',
            'email' => 'rh.recherche@alpaciment.mg',
            'role' => 'rh',
            'mot_de_passe' => bcrypt('secret123'),
        ]);

        $this->actingAs($this->rhUser);
    }

    public function test_recherche_par_mot_cle_cv_avec_snippet(): void
    {
        $candidat = Candidat::create([
            'nom' => 'Rakoto',
            'prenom' => 'Jean',
            'email' => 'jean.rakoto@example.com',
        ]);

        $candidature = Candidature::create([
            'id_candidat' => $candidat->id_candidat,
            'canal_depot' => 'site_externe',
        ]);

        // Attacher un document avec du texte CV extrait
        Document::create([
            'id_candidature' => $candidature->id_candidature,
            'type_document' => 'cv',
            'nom_fichier' => 'cv_jean.pdf',
            'chemin_fichier' => '/docs/cv_jean.pdf',
            'contenu_texte_extrait' => "Ingénieur électromécanicien avec 8 ans d'expérience en maintenance préventive des broyeurs à ciment et turbines industrielles.",
        ]);

        // Autre candidature sans le mot-clé
        $candidat2 = Candidat::create([
            'nom' => 'Rasoa',
            'prenom' => 'Marie',
            'email' => 'marie.rasoa@example.com',
        ]);
        $candidature2 = Candidature::create([
            'id_candidat' => $candidat2->id_candidat,
            'canal_depot' => 'site_externe',
        ]);
        Document::create([
            'id_candidature' => $candidature2->id_candidature,
            'type_document' => 'cv',
            'nom_fichier' => 'cv_marie.pdf',
            'chemin_fichier' => '/docs/cv_marie.pdf',
            'contenu_texte_extrait' => "Responsable comptable et financière avec maîtrise des logiciels Sage et Excel.",
        ]);

        // Test 1: Recherche par mot-clé présent "broyeurs"
        $response = $this->getJson('/api/candidatures?cv_keyword=broyeurs');
        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertCount(1, $data);
        $this->assertEquals($candidature->id_candidature, $data[0]['id_candidature']);
        $this->assertNotNull($data[0]['cv_snippet']);
        $this->assertStringContainsString('broyeurs', strtolower($data[0]['cv_snippet']));

        // Test 2: Recherche par mot-clé absent "chimie"
        $responseEmpty = $this->getJson('/api/candidatures?cv_keyword=chimie');
        $responseEmpty->assertStatus(200);
        $this->assertCount(0, $responseEmpty->json('data'));
    }

    public function test_filtrage_par_competences_mode_any_et_all(): void
    {
        $typeTech = TypeCompetence::create(['id_type_competence' => 1, 'libelle' => 'Technique']);
        $compPython = Competence::create(['id_competence' => 1, 'nom_competence' => 'Python', 'id_type_competence' => 1]);
        $compReact = Competence::create(['id_competence' => 2, 'nom_competence' => 'React', 'id_type_competence' => 1]);
        $compSql = Competence::create(['id_competence' => 3, 'nom_competence' => 'PostgreSQL', 'id_type_competence' => 1]);

        // Candidat 1 : Python + React
        $cand1 = Candidat::create(['nom' => 'Dev', 'prenom' => 'Fullstack', 'email' => 'fullstack@alpa.mg']);
        $candidature1 = Candidature::create(['id_candidat' => $cand1->id_candidat]);
        DB::table('candidat_competence')->insert([
            ['id_candidature' => $candidature1->id_candidature, 'id_competence' => 1, 'niveau' => 'Avancé', 'source' => 'manuel', 'valide' => true],
            ['id_candidature' => $candidature1->id_candidature, 'id_competence' => 2, 'niveau' => 'Expert', 'source' => 'manuel', 'valide' => true],
        ]);

        // Candidat 2 : Python seulement
        $cand2 = Candidat::create(['nom' => 'Dev', 'prenom' => 'Data', 'email' => 'data@alpa.mg']);
        $candidature2 = Candidature::create(['id_candidat' => $cand2->id_candidat]);
        DB::table('candidat_competence')->insert([
            ['id_candidature' => $candidature2->id_candidature, 'id_competence' => 1, 'niveau' => 'Intermédiaire', 'source' => 'manuel', 'valide' => true],
        ]);

        // Test mode ANY (OU) : Python OU React -> doit trouver les 2 candidatures
        $respAny = $this->getJson('/api/candidatures?competences=1,2&competence_mode=any');
        $respAny->assertStatus(200);
        $this->assertCount(2, $respAny->json('data'));

        // Test mode ALL (ET) : Python ET React -> doit trouver uniquement la candidature 1
        $respAll = $this->getJson('/api/candidatures?competences=1,2&competence_mode=all');
        $respAll->assertStatus(200);
        $this->assertCount(1, $respAll->json('data'));
        $this->assertEquals($candidature1->id_candidature, $respAll->json('data.0.id_candidature'));
    }

    public function test_filtrage_par_niveau_etude_et_diplome(): void
    {
        $cand1 = Candidat::create(['nom' => 'Ingenieur', 'prenom' => 'Paul', 'email' => 'paul@alpa.mg']);
        $candidature1 = Candidature::create(['id_candidat' => $cand1->id_candidat]);
        CandidatFormation::create([
            'id_candidature' => $candidature1->id_candidature,
            'diplome' => "Diplôme d'Ingénieur en Génie Civil",
            'etablissement' => 'ESPA Vontovorona',
            'niveau' => 'Bac+5 / Ingénieur',
            'domaine_etude' => 'Génie Civil',
        ]);

        $cand2 = Candidat::create(['nom' => 'Technicien', 'prenom' => 'Luc', 'email' => 'luc@alpa.mg']);
        $candidature2 = Candidature::create(['id_candidat' => $cand2->id_candidat]);
        CandidatFormation::create([
            'id_candidature' => $candidature2->id_candidature,
            'diplome' => 'BTS Maintenance Industrielle',
            'etablissement' => 'IST Antananarivo',
            'niveau' => 'Bac+2',
            'domaine_etude' => 'Maintenance',
        ]);

        // Filtrer par niveau d'étude "Bac+5"
        $respBac5 = $this->getJson('/api/candidatures?niveau_etude=Bac%2B5');
        $respBac5->assertStatus(200);
        $this->assertCount(1, $respBac5->json('data'));
        $this->assertEquals($candidature1->id_candidature, $respBac5->json('data.0.id_candidature'));

        // Filtrer par diplôme "BTS"
        $respBts = $this->getJson('/api/candidatures?niveau_etude=BTS');
        $respBts->assertStatus(200);
        $this->assertCount(1, $respBts->json('data'));
        $this->assertEquals($candidature2->id_candidature, $respBts->json('data.0.id_candidature'));
    }

    public function test_filtrage_par_annees_experience_minimum(): void
    {
        // Candidat 1 : 5 ans d'expérience (2018-01-01 -> 2023-01-01 = ~1826 jours)
        $cand1 = Candidat::create(['nom' => 'Senior', 'prenom' => 'Alain', 'email' => 'alain.senior@alpa.mg']);
        $candidature1 = Candidature::create(['id_candidat' => $cand1->id_candidat]);
        CandidatExperience::create([
            'id_candidature' => $candidature1->id_candidature,
            'poste' => 'Chef de centrale',
            'entreprise' => 'Holcim',
            'date_debut' => '2018-01-01',
            'date_fin' => '2023-01-01',
            'poste_actuel' => false,
        ]);

        // Candidat 2 : 1 an d'expérience (2023-01-01 -> 2024-01-01 = 365 jours)
        $cand2 = Candidat::create(['nom' => 'Junior', 'prenom' => 'Miora', 'email' => 'miora.junior@alpa.mg']);
        $candidature2 = Candidature::create(['id_candidat' => $cand2->id_candidat]);
        CandidatExperience::create([
            'id_candidature' => $candidature2->id_candidature,
            'poste' => 'Opératrice de production',
            'entreprise' => 'AlpA Ciment',
            'date_debut' => '2023-01-01',
            'date_fin' => '2024-01-01',
            'poste_actuel' => false,
        ]);

        // Filtre : au moins 3 ans d'expérience
        $resp3Ans = $this->getJson('/api/candidatures?annees_exp_min=3');
        $resp3Ans->assertStatus(200);
        $this->assertCount(1, $resp3Ans->json('data'));
        $this->assertEquals($candidature1->id_candidature, $resp3Ans->json('data.0.id_candidature'));

        // Filtre : au moins 1 an d'expérience (doit inclure les deux)
        $resp1An = $this->getJson('/api/candidatures?annees_exp_min=1');
        $resp1An->assertStatus(200);
        $this->assertCount(2, $resp1An->json('data'));
    }

    public function test_combinaison_multi_criteres(): void
    {
        $typeTech = TypeCompetence::create(['id_type_competence' => 1, 'libelle' => 'Technique']);
        $compSap = Competence::create(['nom_competence' => 'SAP', 'id_type_competence' => 1]);

        // Candidat Parfait : CV contient "logistique", compétence SAP, Bac+5, 4 ans exp
        $candTarget = Candidat::create(['nom' => 'Ideal', 'prenom' => 'Candidat', 'email' => 'ideal@alpa.mg']);
        $candTargetCandidature = Candidature::create(['id_candidat' => $candTarget->id_candidat]);

        Document::create([
            'id_candidature' => $candTargetCandidature->id_candidature,
            'type_document' => 'cv',
            'nom_fichier' => 'cv_ideal.pdf',
            'chemin_fichier' => '/docs/ideal.pdf',
            'contenu_texte_extrait' => 'Gestion de la chaîne logistique et approvisionnement clinker.',
        ]);

        DB::table('candidat_competence')->insert([
            'id_candidature' => $candTargetCandidature->id_candidature,
            'id_competence' => $compSap->id_competence,
            'niveau' => 'Avancé',
        ]);

        CandidatFormation::create([
            'id_candidature' => $candTargetCandidature->id_candidature,
            'diplome' => 'Master Logistique',
            'niveau' => 'Bac+5',
        ]);

        CandidatExperience::create([
            'id_candidature' => $candTargetCandidature->id_candidature,
            'poste' => 'Responsable Supply Chain',
            'date_debut' => '2019-01-01',
            'date_fin' => '2023-06-01',
        ]);

        // Appel combiné
        $response = $this->getJson('/api/candidatures?' . http_build_query([
            'cv_keyword' => 'logistique',
            'competences' => (string) $compSap->id_competence,
            'niveau_etude' => 'Bac+5',
            'annees_exp_min' => '3',
        ]));

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $item = $response->json('data.0');
        $this->assertEquals($candTargetCandidature->id_candidature, $item['id_candidature']);
        $this->assertNotNull($item['cv_snippet']);
        $this->assertStringContainsString('logistique', strtolower($item['cv_snippet']));
    }
}
