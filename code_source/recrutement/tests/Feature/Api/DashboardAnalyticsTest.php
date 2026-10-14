<?php

namespace Tests\Feature\Api;

use App\Models\Candidat;
use App\Models\Candidature;
use App\Models\Direction;
use App\Models\Domaine;
use App\Models\Offre;
use App\Models\StatutCandidature;
use App\Models\StatutOffre;
use App\Models\TypeDemande;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DashboardAnalyticsTest extends TestCase
{
    protected User $rhUser;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Schémas SQLite
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
            $table->string('canal_depot', 50)->default('site_externe');
            $table->string('cle_idempotence', 255)->nullable();
            $table->string('poste_souhaite', 150)->nullable();
            $table->timestamps();
        });

        Schema::create('rendez_vous', function (Blueprint $table) {
            $table->id('id_rendez_vous');
            $table->unsignedBigInteger('id_candidature')->nullable();
            $table->dateTime('date_debut');
            $table->dateTime('date_fin')->nullable();
            $table->unsignedBigInteger('id_statut_rendez_vous')->nullable();
        });

        Schema::create('statut_rendez_vous', function (Blueprint $table) {
            $table->id('id_statut_rendez_vous');
            $table->string('libelle', 50);
        });

        // 2. Données de référence
        $dir1 = Direction::create(['nom_direction' => 'Direction Industrielle']);
        $dir2 = Direction::create(['nom_direction' => 'Direction Informatique']);

        DB::table('statut_offre')->insert([
            ['id_statut_offre' => 1, 'libelle' => 'Brouillon'],
            ['id_statut_offre' => 2, 'libelle' => 'Publiee'],
        ]);

        DB::table('type_demande')->insert([
            ['id_type_demande' => 1, 'libelle' => 'Offre'],
            ['id_type_demande' => 2, 'libelle' => 'Spontanee'],
        ]);

        DB::table('statut_candidature')->insert([
            ['id_statut_candidature' => 1, 'libelle' => 'Reçue', 'ordre_workflow' => 10],
            ['id_statut_candidature' => 2, 'libelle' => 'Présélectionnée', 'ordre_workflow' => 20],
            ['id_statut_candidature' => 3, 'libelle' => 'Entretien', 'ordre_workflow' => 40],
            ['id_statut_candidature' => 4, 'libelle' => 'Retenue', 'ordre_workflow' => 50],
        ]);

        // Offres
        $offre1 = DB::table('offre')->insertGetId([
            'id_direction' => $dir1->id_direction,
            'id_statut_offre' => 2, // Publiee
            'titre_poste' => 'Ingénieur Procédés Ciment',
            'date_publication' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $offre2 = DB::table('offre')->insertGetId([
            'id_direction' => $dir2->id_direction,
            'id_statut_offre' => 2, // Publiee
            'titre_poste' => 'Développeur Fullstack',
            'date_publication' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Candidats & Candidatures
        $c1 = DB::table('candidat')->insertGetId(['nom' => 'Andria', 'prenom' => 'Haja', 'email' => 'haja@test.local', 'created_at' => now(), 'updated_at' => now()]);
        $c2 = DB::table('candidat')->insertGetId(['nom' => 'Rabe', 'prenom' => 'Koto', 'email' => 'koto@test.local', 'created_at' => now(), 'updated_at' => now()]);
        $c3 = DB::table('candidat')->insertGetId(['nom' => 'Rakoto', 'prenom' => 'Jean', 'email' => 'jean@test.local', 'created_at' => now(), 'updated_at' => now()]);

        // C1 : Reçue sur offre 1
        DB::table('candidature')->insert([
            'id_candidat' => $c1,
            'id_offre' => $offre1,
            'id_type_demande' => 1,
            'id_statut_candidature' => 1, // Reçue
            'dans_vivier' => false,
            'canal_depot' => 'site_externe',
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        // C2 : Entretien sur offre 2
        DB::table('candidature')->insert([
            'id_candidat' => $c2,
            'id_offre' => $offre2,
            'id_type_demande' => 1,
            'id_statut_candidature' => 3, // Entretien
            'dans_vivier' => false,
            'canal_depot' => 'site_externe',
            'created_at' => now()->subDays(5),
            'updated_at' => now()->subDays(1),
        ]);

        // C3 : Retenue spontanée
        DB::table('candidature')->insert([
            'id_candidat' => $c3,
            'id_offre' => null,
            'id_type_demande' => 2,
            'id_statut_candidature' => 4, // Retenue
            'dans_vivier' => true,
            'canal_depot' => 'rh_manuel',
            'cle_idempotence' => '<msg-test-123@domain.com>',
            'created_at' => now()->subDays(10),
            'updated_at' => now()->subDays(2),
        ]);

        // RDV à venir
        DB::table('rendez_vous')->insert([
            'id_candidature' => 2,
            'date_debut' => now()->addDays(3)->format('Y-m-d H:i:s'),
            'date_fin' => now()->addDays(3)->addHour()->format('Y-m-d H:i:s'),
        ]);

        // Utilisateur RH
        $this->rhUser = User::create([
            'nom' => 'rh_test',
            'email' => 'rh@alpaciment.local',
            'role' => 'rh',
            'mot_de_passe' => bcrypt('password'),
        ]);
    }

    public function test_dashboard_endpoint_returns_complete_analytics_structure(): void
    {
        $response = $this->actingAs($this->rhUser)->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'kpis' => [
                        'total_candidatures',
                        'candidatures_sur_offre',
                        'candidatures_spontanees',
                        'candidatures_en_vivier',
                        'offres_total',
                        'offres_publiees',
                        'domaines_en_attente',
                        'rdv_a_venir',
                        'taux_recrutement',
                        'delai_moyen_jours',
                    ],
                    'entonnoir',
                    'evolution_mensuelle',
                    'repartition_directions',
                    'repartition_canaux',
                    'candidatures_a_traiter',
                    'offres_recentes',
                ],
            ]);

        $data = $response->json('data');

        // Vérification des KPIs calculés
        $this->assertEquals(3, $data['kpis']['total_candidatures']);
        $this->assertEquals(2, $data['kpis']['candidatures_sur_offre']);
        $this->assertEquals(1, $data['kpis']['candidatures_spontanees']);
        $this->assertEquals(1, $data['kpis']['candidatures_en_vivier']);
        $this->assertEquals(2, $data['kpis']['offres_publiees']);
        $this->assertEquals(1, $data['kpis']['rdv_a_venir']);

        // Vérification du Funnel (4 statuts configurés)
        $this->assertCount(4, $data['entonnoir']);

        // Vérification de l'évolution mensuelle
        $this->assertCount(6, $data['evolution_mensuelle']);

        // Vérification répartition par direction
        $this->assertCount(2, $data['repartition_directions']);

        // Vérification candidatures à traiter
        $this->assertNotEmpty($data['candidatures_a_traiter']);
        $this->assertEquals('Andria Haja', $data['candidatures_a_traiter'][0]['nom_complet']);
    }

    public function test_dashboard_filters_by_direction(): void
    {
        // Filtrer par Direction Industrielle (id_direction = 1)
        $response = $this->actingAs($this->rhUser)->getJson('/api/dashboard?direction_id=1');

        $response->assertStatus(200);
        $data = $response->json('data');

        // Seule l'offre 1 et la candidature 1 sont rattachées à la Direction 1
        $this->assertEquals(1, $data['kpis']['total_candidatures']);
        $this->assertEquals(1, $data['kpis']['offres_publiees']);
    }

    public function test_dashboard_filters_by_period_this_month(): void
    {
        $response = $this->actingAs($this->rhUser)->getJson('/api/dashboard?periode=this_month');

        $response->assertStatus(200);
        $data = $response->json('data');

        // Les 3 candidatures ont été créées dans le mois en cours
        $this->assertEquals(3, $data['kpis']['total_candidatures']);
    }

    public function test_dashboard_filters_by_direct_dates_and_adapts_trend_curve_to_period(): void
    {
        // Plage de 7 jours (granularité quotidienne)
        $debut = now()->subDays(6)->format('Y-m-d');
        $fin = now()->format('Y-m-d');

        $response = $this->actingAs($this->rhUser)->getJson("/api/dashboard?date_debut={$debut}&date_fin={$fin}");

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertNotEmpty($data['evolution_mensuelle']);
        $this->assertCount(7, $data['evolution_mensuelle']);
        $this->assertEquals('jour', $data['evolution_mensuelle'][0]['type_granulat']);
        $this->assertArrayHasKey('total', $data['evolution_mensuelle'][0]);
        $this->assertArrayHasKey('label', $data['evolution_mensuelle'][0]);
    }
}

