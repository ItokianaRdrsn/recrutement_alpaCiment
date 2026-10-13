<?php

namespace Tests\Feature\Api;

use App\Models\AuditLog;
use App\Models\Candidature;
use App\Models\ModeRealisation;
use App\Models\RendezVous;
use App\Models\StatutCandidature;
use App\Models\StatutRendezVous;
use App\Models\TypeRendezVous;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\RendezVousService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;
use Tests\TestCase;

class RendezVousTest extends TestCase
{
    protected User $rhUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup tables in SQLite memory for testing
        Schema::create('utilisateur', function (Blueprint $table) {
            $table->id('id_utilisateur');
            $table->string('nom', 150);
            $table->string('email', 200)->unique();
            $table->string('role', 30)->default('rh');
            $table->timestamps();
        });

        Schema::create('type_rendez_vous', function (Blueprint $table) {
            $table->id('id_type_rendez_vous');
            $table->string('libelle', 50);
        });

        Schema::create('statut_rendez_vous', function (Blueprint $table) {
            $table->id('id_statut_rendez_vous');
            $table->string('libelle', 50);
            $table->integer('ordre_workflow')->default(1);
        });

        Schema::create('mode_realisation', function (Blueprint $table) {
            $table->id('id_mode_realisation');
            $table->string('libelle', 50);
        });

        Schema::create('candidature', function (Blueprint $table) {
            $table->id('id_candidature');
            $table->unsignedBigInteger('id_candidat')->nullable();
            $table->unsignedBigInteger('id_type_demande')->nullable();
            $table->unsignedBigInteger('id_offre')->nullable();
            $table->unsignedBigInteger('id_domaine')->nullable();
            $table->unsignedBigInteger('id_statut_candidature')->nullable();
            $table->boolean('dans_vivier')->default(false);
            $table->boolean('vue')->default(false);
            $table->string('poste_souhaite')->nullable();
            $table->text('message')->nullable();
            $table->string('canal_depot')->default('web');
            $table->unsignedBigInteger('id_utilisateur_depot')->nullable();
            $table->timestamps();
        });

        Schema::create('rendez_vous', function (Blueprint $table) {
            $table->id('id_rendez_vous');
            $table->unsignedBigInteger('id_candidature');
            $table->unsignedBigInteger('id_utilisateur')->nullable();
            $table->unsignedBigInteger('id_type_rendez_vous');
            $table->unsignedBigInteger('id_statut_rendez_vous');
            $table->unsignedBigInteger('id_mode_realisation');
            $table->dateTime('date_debut');
            $table->dateTime('date_fin');
            $table->text('details_lieu')->nullable();
            $table->text('commentaire')->nullable();
            $table->timestamps();
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
            $table->timestamps();
        });

        Schema::create('statut_candidature', function (Blueprint $table) {
            $table->id('id_statut_candidature');
            $table->string('libelle', 50);
            $table->integer('ordre_workflow')->default(1);
        });

        Schema::create('historique_statut', function (Blueprint $table) {
            $table->id('id_historique_statut');
            $table->unsignedBigInteger('id_candidature');
            $table->unsignedBigInteger('id_statut_candidature');
            $table->text('commentaire')->nullable();
            $table->unsignedBigInteger('id_utilisateur')->nullable();
            $table->dateTime('date_changement')->nullable();
            $table->timestamps();
        });

        TypeRendezVous::insert([
            ['id_type_rendez_vous' => 1, 'libelle' => 'Test'],
            ['id_type_rendez_vous' => 2, 'libelle' => 'Entretien'],
        ]);

        StatutRendezVous::insert([
            ['id_statut_rendez_vous' => 1, 'libelle' => 'A venir', 'ordre_workflow' => 1],
            ['id_statut_rendez_vous' => 2, 'libelle' => 'Realise', 'ordre_workflow' => 2],
            ['id_statut_rendez_vous' => 3, 'libelle' => 'Annule', 'ordre_workflow' => 3],
        ]);

        ModeRealisation::insert([
            ['id_mode_realisation' => 1, 'libelle' => 'Presentiel'],
            ['id_mode_realisation' => 2, 'libelle' => 'Visioconference'],
            ['id_mode_realisation' => 3, 'libelle' => 'Telephone'],
        ]);

        StatutCandidature::insert([
            ['id_statut_candidature' => 1, 'libelle' => 'Reçue', 'ordre_workflow' => 1],
            ['id_statut_candidature' => 4, 'libelle' => 'Entretien', 'ordre_workflow' => 4],
        ]);

        $this->rhUser = User::factory()->rh()->make([
            'id' => 1,
            'name' => 'Agent RH Test',
            'email' => 'rh.test@alpaciment.mg',
        ]);
    }

    public function test_planifier_rendez_vous_creates_record_and_audit(): void
    {
        $candidature = Candidature::create([
            'id_statut_candidature' => 1,
            'poste_souhaite' => 'Ingénieur Béton',
        ]);

        $service = new RendezVousService(new AuditLogService());

        $rdv = $service->planifier([
            'id_candidature' => $candidature->id_candidature,
            'id_type_rendez_vous' => 2, // Entretien
            'id_mode_realisation' => 2, // Visioconference
            'date_debut' => '2026-10-15 10:00:00',
            'date_fin' => '2026-10-15 11:00:00',
            'details_lieu' => 'https://meet.google.com/test-meet',
            'commentaire' => 'Entretien technique préliminaire',
            'id_statut_candidature_cible' => 4, // Passe statut candidature vers Entretien
        ], idUtilisateurConnecte: 1);

        $this->assertInstanceOf(RendezVous::class, $rdv);
        $this->assertEquals(2, $rdv->id_type_rendez_vous);
        $this->assertEquals(2, $rdv->id_mode_realisation);
        $this->assertEquals(1, $rdv->id_statut_rendez_vous); // A venir par défaut

        // Candidature statut mis à jour vers Entretien (4)
        $candidature->refresh();
        $this->assertEquals(4, $candidature->id_statut_candidature);

        // Audit log présent
        $this->assertDatabaseHas('audit_log', [
            'action' => 'PLANIFICATION_RDV',
            'entite' => 'RendezVous',
            'id_entite' => $rdv->id_rendez_vous,
        ]);
    }

    public function test_planifier_fails_if_date_fin_before_date_debut(): void
    {
        $candidature = Candidature::create([
            'id_statut_candidature' => 1,
        ]);

        $service = new RendezVousService(new AuditLogService());

        $this->expectException(InvalidArgumentException::class);

        $service->planifier([
            'id_candidature' => $candidature->id_candidature,
            'id_type_rendez_vous' => 1,
            'id_mode_realisation' => 1,
            'date_debut' => '2026-10-15 14:00:00',
            'date_fin' => '2026-10-15 13:00:00', // Invalide
        ]);
    }

    public function test_modifier_and_annuler_rendez_vous(): void
    {
        $candidature = Candidature::create([
            'id_statut_candidature' => 1,
        ]);

        $service = new RendezVousService(new AuditLogService());

        $rdv = $service->planifier([
            'id_candidature' => $candidature->id_candidature,
            'id_type_rendez_vous' => 1,
            'id_mode_realisation' => 1,
            'date_debut' => '2026-10-15 14:00:00',
            'date_fin' => '2026-10-15 15:00:00',
        ], idUtilisateurConnecte: 1);

        // Modification
        $updated = $service->modifier($rdv, [
            'details_lieu' => 'Salle Bâtiment A - 2ème étage',
        ], idUtilisateurConnecte: 1);

        $this->assertEquals('Salle Bâtiment A - 2ème étage', $updated->details_lieu);

        // Annulation
        $annule = $service->annuler($updated, motif: 'Empêchement candidat', idUtilisateurConnecte: 1);
        $this->assertEquals(3, $annule->id_statut_rendez_vous); // 3 = Annulé
        $this->assertStringContainsString('Empêchement candidat', $annule->commentaire);

        $this->assertDatabaseHas('audit_log', [
            'action' => 'ANNULATION_RDV',
            'entite' => 'RendezVous',
            'id_entite' => $rdv->id_rendez_vous,
        ]);
    }
}
