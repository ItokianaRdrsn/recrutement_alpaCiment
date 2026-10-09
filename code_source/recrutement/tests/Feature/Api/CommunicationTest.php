<?php

namespace Tests\Feature\Api;

use App\Mail\CandidatureCommunicationMail;
use App\Models\AuditLog;
use App\Models\Candidat;
use App\Models\Candidature;
use App\Models\Communication;
use App\Models\ModeleMessage;
use App\Models\StatutCandidature;
use App\Models\TypeMessage;
use App\Models\User;
use App\Services\CommunicationService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CommunicationTest extends TestCase
{
    protected User $rhUser;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Schemas in SQLite memory
        Schema::create('utilisateur', function (Blueprint $table) {
            $table->id('id_utilisateur');
            $table->string('nom', 150);
            $table->string('email', 200)->unique();
            $table->string('role', 30)->default('rh');
            $table->timestamps();
        });

        Schema::create('type_message', function (Blueprint $table) {
            $table->id('id_type_message');
            $table->string('libelle', 100)->unique();
        });

        Schema::create('statut_candidature', function (Blueprint $table) {
            $table->id('id_statut_candidature');
            $table->string('libelle', 100);
            $table->integer('ordre_workflow')->default(10);
        });

        Schema::create('candidat', function (Blueprint $table) {
            $table->id('id_candidat');
            $table->string('nom', 150);
            $table->string('prenom', 150);
            $table->string('email', 200)->unique();
            $table->string('telephone', 50)->nullable();
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
            $table->string('poste_souhaite', 150)->nullable();
            $table->timestamps();
        });

        Schema::create('modele_message', function (Blueprint $table) {
            $table->id('id_modele_message');
            $table->unsignedBigInteger('id_type_message');
            $table->unsignedBigInteger('id_statut_candidature')->nullable();
            $table->string('nom_modele', 150);
            $table->string('objet', 255);
            $table->text('contenu');
            $table->boolean('envoi_automatique')->default(false);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        Schema::create('communication', function (Blueprint $table) {
            $table->id('id_communication');
            $table->unsignedBigInteger('id_candidature');
            $table->unsignedBigInteger('id_modele_message')->nullable();
            $table->unsignedBigInteger('id_type_message');
            $table->string('objet', 255);
            $table->text('contenu')->nullable();
            $table->string('mode_envoi', 10)->default('manuel');
            $table->timestamp('date_envoi')->useCurrent();
            $table->unsignedBigInteger('id_utilisateur')->nullable();
        });

        Schema::create('audit_log', function (Blueprint $table) {
            $table->id('id_audit_log');
            $table->unsignedBigInteger('id_utilisateur')->nullable();
            $table->string('action', 50);
            $table->string('entite', 100);
            $table->unsignedBigInteger('id_entite')->nullable();
            $table->string('description', 255)->nullable();
            $table->json('anciennes_valeurs')->nullable();
            $table->json('nouvelles_valeurs')->nullable();
            $table->string('ip_adresse', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // Seed basic types
        TypeMessage::insert([
            ['id_type_message' => 1, 'libelle' => 'Accuse de reception'],
            ['id_type_message' => 2, 'libelle' => 'Convocation'],
            ['id_type_message' => 3, 'libelle' => 'Demande information'],
            ['id_type_message' => 4, 'libelle' => 'Demande document'],
            ['id_type_message' => 5, 'libelle' => 'Issue recrutement'],
            ['id_type_message' => 6, 'libelle' => 'Autre'],
        ]);

        StatutCandidature::insert([
            ['id_statut_candidature' => 1, 'libelle' => 'Recue', 'ordre_workflow' => 10],
            ['id_statut_candidature' => 3, 'libelle' => 'Test', 'ordre_workflow' => 30],
        ]);

        $this->rhUser = User::create([
            'nom' => 'RH Test Communication',
            'email' => 'rh.test.comm@alpaciment.mg',
            'role' => 'rh',
        ]);
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('audit_log');
        Schema::dropIfExists('communication');
        Schema::dropIfExists('modele_message');
        Schema::dropIfExists('candidature');
        Schema::dropIfExists('candidat');
        Schema::dropIfExists('statut_candidature');
        Schema::dropIfExists('type_message');
        Schema::dropIfExists('utilisateur');

        parent::tearDown();
    }

    public function test_can_list_modele_messages_and_referentiels(): void
    {
        ModeleMessage::create([
            'id_type_message' => 1,
            'id_statut_candidature' => 1,
            'nom_modele' => 'Accusé réception',
            'objet' => 'Accusé {poste}',
            'contenu' => 'Bonjour {prenom}',
            'envoi_automatique' => true,
            'actif' => true,
        ]);

        $response = $this->actingAs($this->rhUser)
            ->getJson('/api/modeles-messages');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nom_modele', 'Accusé réception');

        $refResponse = $this->actingAs($this->rhUser)
            ->getJson('/api/modeles-messages/referentiels');

        $refResponse->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'types',
                    'statuts',
                    'variables_disponibles',
                ],
            ]);
    }

    public function test_can_create_update_and_delete_modele_message(): void
    {
        $payload = [
            'id_type_message' => 3,
            'nom_modele' => 'Template Test Unitaire',
            'objet' => 'Demande de précisions pour {poste}',
            'contenu' => 'Bonjour {prenom}, merci de préciser vos disponibilités.',
            'envoi_automatique' => false,
            'actif' => true,
        ];

        $createResponse = $this->actingAs($this->rhUser)
            ->postJson('/api/modeles-messages', $payload);

        $createResponse->assertStatus(201)
            ->assertJsonPath('data.nom_modele', 'Template Test Unitaire');

        $idModele = $createResponse->json('data.id_modele_message');

        // Update
        $updateResponse = $this->actingAs($this->rhUser)
            ->putJson("/api/modeles-messages/{$idModele}", [
                'nom_modele' => 'Template Modifié',
                'objet' => 'Objet Nouveau {poste}',
            ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.nom_modele', 'Template Modifié');

        // Delete
        $deleteResponse = $this->actingAs($this->rhUser)
            ->deleteJson("/api/modeles-messages/{$idModele}");

        $deleteResponse->assertStatus(200);
        $this->assertNull(ModeleMessage::find($idModele));
    }

    public function test_can_preview_template_variables_replacement(): void
    {
        $candidat = Candidat::create([
            'nom' => 'Rakoto',
            'prenom' => 'Faniry',
            'email' => 'faniry.preview@test.mg',
        ]);

        $candidature = Candidature::create([
            'id_candidat' => $candidat->id_candidat,
            'poste_souhaite' => 'Développeur FullStack',
        ]);

        $previewResponse = $this->actingAs($this->rhUser)
            ->postJson('/api/modeles-messages/apercu', [
                'id_candidature' => $candidature->id_candidature,
                'objet' => 'Convocation pour {poste}',
                'contenu' => 'Bonjour {prenom} {nom}, votre profil nous intéresse.',
            ]);

        $previewResponse->assertStatus(200)
            ->assertJsonPath('data.objet', 'Convocation pour Développeur FullStack')
            ->assertJsonPath('data.contenu', 'Bonjour Faniry Rakoto, votre profil nous intéresse.');
    }

    public function test_can_send_manual_communication_to_candidat(): void
    {
        Mail::fake();

        $candidat = Candidat::create([
            'nom' => 'Razafy',
            'prenom' => 'Soa',
            'email' => 'soa.razafy@test.mg',
        ]);

        $candidature = Candidature::create([
            'id_candidat' => $candidat->id_candidat,
            'poste_souhaite' => 'Chef de projet',
        ]);

        $payload = [
            'id_type_message' => 4,
            'objet' => 'Demande de documents pour {poste}',
            'contenu' => 'Bonjour {prenom}, merci de fournir votre diplôme.',
            'mode_envoi' => 'manuel',
        ];

        $response = $this->actingAs($this->rhUser)
            ->postJson("/api/candidature/{$candidature->id_candidature}/communications", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.mode_envoi', 'manuel')
            ->assertJsonPath('data.objet', 'Demande de documents pour Chef de projet');

        Mail::assertSent(CandidatureCommunicationMail::class, function ($mail) {
            return $mail->hasTo('soa.razafy@test.mg');
        });

        $this->assertDatabaseHas('communication', [
            'id_candidature' => $candidature->id_candidature,
            'mode_envoi' => 'manuel',
        ]);

        $this->assertDatabaseHas('audit_log', [
            'action' => 'ENVOI_COMMUNICATION',
            'entite' => 'Communication',
        ]);
    }
}
