<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Candidat;
use App\Models\Candidature;
use App\Models\Offre;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RelierOffreEtCandidatsTest extends TestCase
{
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        if (! Schema::hasTable('direction')) {
            Schema::create('direction', function (Blueprint $table) {
                $table->id('id_direction');
                $table->string('nom_direction', 150);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('domaine')) {
            Schema::create('domaine', function (Blueprint $table) {
                $table->id('id_domaine');
                $table->unsignedBigInteger('id_direction')->nullable();
                $table->string('nom_domaine', 150);
                $table->boolean('valide')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('statut_offre')) {
            Schema::create('statut_offre', function (Blueprint $table) {
                $table->id('id_statut_offre');
                $table->string('libelle', 100);
            });
        }

        if (! Schema::hasTable('statut_candidature')) {
            Schema::create('statut_candidature', function (Blueprint $table) {
                $table->id('id_statut_candidature');
                $table->string('libelle', 100);
                $table->integer('ordre_workflow')->default(1);
            });
        }

        if (! Schema::hasTable('type_demande')) {
            Schema::create('type_demande', function (Blueprint $table) {
                $table->id('id_type_demande');
                $table->string('libelle', 50);
            });
        }

        if (! Schema::hasTable('type_contrat')) {
            Schema::create('type_contrat', function (Blueprint $table) {
                $table->id('id_type_contrat');
                $table->string('libelle', 50);
            });
        }

        if (! Schema::hasTable('profil_offre')) {
            Schema::create('profil_offre', function (Blueprint $table) {
                $table->id('id_profil_offre');
                $table->unsignedBigInteger('id_offre');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('mission')) {
            Schema::create('mission', function (Blueprint $table) {
                $table->id('id_mission');
                $table->unsignedBigInteger('id_offre');
                $table->string('intitule', 255)->nullable();
                $table->integer('ordre')->default(1);
            });
        }

        if (! Schema::hasTable('profil_formation')) {
            Schema::create('profil_formation', function (Blueprint $table) {
                $table->id('id_profil_formation');
                $table->unsignedBigInteger('id_offre');
            });
        }

        if (! Schema::hasTable('competence')) {
            Schema::create('competence', function (Blueprint $table) {
                $table->id('id_competence');
                $table->string('nom_competence', 150);
            });
        }

        if (! Schema::hasTable('profil_competence')) {
            Schema::create('profil_competence', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('id_offre');
                $table->unsignedBigInteger('id_competence')->nullable();
                $table->string('niveau_requis', 50)->nullable();
            });
        }

        if (! Schema::hasTable('offre')) {
            Schema::create('offre', function (Blueprint $table) {
                $table->id('id_offre');
                $table->string('titre_poste', 255);
                $table->string('reference', 50)->nullable();
                $table->unsignedBigInteger('id_direction');
                $table->unsignedBigInteger('id_domaine')->nullable();
                $table->unsignedBigInteger('id_type_contrat')->nullable();
                $table->unsignedBigInteger('id_statut_offre');
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('candidat')) {
            Schema::create('candidat', function (Blueprint $table) {
                $table->id('id_candidat');
                $table->string('nom', 100);
                $table->string('prenom', 100);
                $table->string('email', 150)->unique();
                $table->string('telephone', 50)->nullable();
                $table->string('adresse', 255)->nullable();
                $table->date('date_naissance')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('candidature')) {
            Schema::create('candidature', function (Blueprint $table) {
                $table->id('id_candidature');
                $table->unsignedBigInteger('id_candidat');
                $table->unsignedBigInteger('id_type_demande');
                $table->unsignedBigInteger('id_offre')->nullable();
                $table->unsignedBigInteger('id_domaine')->nullable();
                $table->unsignedBigInteger('id_statut_candidature');
                $table->boolean('dans_vivier')->default(false);
                $table->boolean('vue')->default(false);
                $table->string('poste_souhaite', 200)->nullable();
                $table->text('message')->nullable();
                $table->string('canal_depot', 50)->default('web');
                $table->unsignedBigInteger('id_utilisateur_depot')->nullable();
                $table->string('cle_idempotence', 64)->nullable()->unique();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('historique_statut')) {
            Schema::create('historique_statut', function (Blueprint $table) {
                $table->id('id_historique');
                $table->unsignedBigInteger('id_candidature');
                $table->unsignedBigInteger('id_statut_candidature');
                $table->unsignedBigInteger('id_utilisateur')->nullable();
                $table->text('commentaire')->nullable();
                $table->timestamp('date_changement')->useCurrent();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('document')) {
            Schema::create('document', function (Blueprint $table) {
                $table->id('id_document');
                $table->unsignedBigInteger('id_candidature');
                $table->string('type_document', 50)->default('cv');
                $table->string('nom_fichier', 255)->nullable();
                $table->string('chemin_fichier', 255)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('audit_log')) {
            Schema::create('audit_log', function (Blueprint $table) {
                $table->id('id_audit');
                $table->unsignedBigInteger('id_utilisateur')->nullable();
                $table->string('action', 50);
                $table->string('entite', 100);
                $table->unsignedBigInteger('id_entite')->nullable();
                $table->text('description')->nullable();
                $table->json('anciennes_valeurs')->nullable();
                $table->json('nouvelles_valeurs')->nullable();
                $table->string('ip_adresse', 45)->nullable();
                $table->string('user_agent', 255)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('utilisateur')) {
            Schema::create('utilisateur', function (Blueprint $table) {
                $table->id('id_utilisateur');
                $table->string('nom', 100);
                $table->string('email', 150)->unique();
                $table->string('role', 30)->default('rh');
                $table->string('mot_de_passe', 255);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->text('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable()->index();
                $table->timestamps();
            });
        }

        // Données de base
        DB::table('statut_offre')->insertOrIgnore([
            ['id_statut_offre' => 1, 'libelle' => 'Brouillon'],
            ['id_statut_offre' => 2, 'libelle' => 'Publiee'],
            ['id_statut_offre' => 3, 'libelle' => 'Cloturee'],
        ]);

        DB::table('statut_candidature')->insertOrIgnore([
            ['id_statut_candidature' => 1, 'libelle' => 'Reçue', 'ordre_workflow' => 1],
            ['id_statut_candidature' => 2, 'libelle' => 'Présélectionnée', 'ordre_workflow' => 2],
        ]);

        DB::table('type_demande')->insertOrIgnore([
            ['id_type_demande' => 1, 'libelle' => 'Offre'],
            ['id_type_demande' => 2, 'libelle' => 'Spontanee'],
        ]);

        DB::table('direction')->insertOrIgnore([
            ['id_direction' => 1, 'nom_direction' => 'Direction Industrielle', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->user = User::create([
            'nom' => 'Recruteur RH Alpha',
            'email' => 'rh.test.' . uniqid() . '@alphaciment.mg',
            'role' => UserRole::Rh->value,
            'mot_de_passe' => bcrypt('password123'),
        ]);
    }

    public function test_peut_lister_les_candidats_uniques(): void
    {
        $candidat = Candidat::create([
            'nom' => 'RAKOTO',
            'prenom' => 'Jean',
            'email' => 'jean.rakoto.' . uniqid() . '@example.com',
            'telephone' => '0340000001',
            'adresse' => 'Antananarivo',
        ]);

        Candidature::create([
            'id_candidat' => $candidat->id_candidat,
            'id_type_demande' => 2,
            'id_statut_candidature' => 1,
            'poste_souhaite' => 'Électromécanicien Usine',
            'canal_depot' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/candidats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id_candidat',
                        'nom',
                        'prenom',
                        'email',
                        'telephone',
                        'candidatures_count',
                    ],
                ],
            ]);
    }

    public function test_peut_relier_une_candidature_spontanee_a_une_offre(): void
    {
        $candidat = Candidat::create([
            'nom' => 'ANDRIA',
            'prenom' => 'Michel',
            'email' => 'michel.andria.' . uniqid() . '@example.com',
            'telephone' => '0341112233',
        ]);

        $candidature = Candidature::create([
            'id_candidat' => $candidat->id_candidat,
            'id_type_demande' => 2, // Spontanée
            'id_offre' => null,
            'id_statut_candidature' => 1,
            'dans_vivier' => true,
            'canal_depot' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $offre = Offre::create([
            'titre_poste' => 'Ingénieur Maintenance Cimenterie',
            'reference' => 'OFF-TEST-001',
            'id_direction' => 1,
            'id_statut_offre' => 2, // Publiée
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/candidature/{$candidature->id_candidature}/relier-offre", [
            'id_offre' => $offre->id_offre,
            'commentaire' => 'Profil retenu lors du triage vivier',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'La candidature a été reliée avec succès à l\'offre.',
            ]);

        $candidature->refresh();
        $this->assertEquals($offre->id_offre, $candidature->id_offre);
        $this->assertFalse((bool) $candidature->dans_vivier);

        // Vérifier l'audit log
        $this->assertDatabaseHas('audit_log', [
            'entite' => 'Candidature',
            'id_entite' => $candidature->id_candidature,
            'action' => 'RELIER_OFFRE',
        ]);
    }

    public function test_ne_peut_pas_relier_si_offre_invalide(): void
    {
        $candidat = Candidat::create([
            'nom' => 'RABE',
            'prenom' => 'Hery',
            'email' => 'hery.rabe.' . uniqid() . '@example.com',
        ]);

        $candidature = Candidature::create([
            'id_candidat' => $candidat->id_candidat,
            'id_type_demande' => 2,
            'id_statut_candidature' => 1,
            'canal_depot' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/candidature/{$candidature->id_candidature}/relier-offre", [
            'id_offre' => 99999, // Offre inexistante
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['id_offre']);
    }

    public function test_message_erreur_explicite_si_offre_manquante(): void
    {
        $candidat = Candidat::create([
            'nom' => 'TEST',
            'prenom' => 'Erreur',
            'email' => 'test.erreur.' . uniqid() . '@example.com',
        ]);

        $candidature = Candidature::create([
            'id_candidat' => $candidat->id_candidat,
            'id_type_demande' => 2,
            'id_statut_candidature' => 1,
            'canal_depot' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/candidature/{$candidature->id_candidature}/relier-offre", [
            'id_offre' => null,
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'id_offre' => ['Veuillez sélectionner une offre d\'emploi.'],
            ]);
    }

    public function test_pagination_des_candidats(): void
    {
        for ($i = 1; $i <= 3; $i++) {
            Candidat::create([
                'nom' => "CANDIDAT_{$i}",
                'prenom' => "Prenom_{$i}",
                'email' => "candidat.page.{$i}." . uniqid() . '@example.com',
            ]);
        }

        $response = $this->actingAs($this->user)->getJson('/api/candidats?page=2&per_page=1');

        $response->assertStatus(200)
            ->assertJson([
                'current_page' => 2,
                'per_page' => 1,
            ]);
    }

    public function test_peut_consulter_detail_candidat(): void
    {
        $candidat = Candidat::create([
            'nom' => 'RAZAFY',
            'prenom' => 'Paul',
            'email' => 'paul.razafy.' . uniqid() . '@example.com',
            'telephone' => '0342233445',
            'adresse' => 'Toamasina',
        ]);

        $candidature = Candidature::create([
            'id_candidat' => $candidat->id_candidat,
            'id_type_demande' => 2,
            'id_statut_candidature' => 1,
            'poste_souhaite' => 'Opérateur Broyeur',
            'canal_depot' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->getJson("/api/candidat/{$candidat->id_candidat}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id_candidat' => $candidat->id_candidat,
                    'nom' => 'RAZAFY',
                    'prenom' => 'Paul',
                ],
            ]);
    }
}
