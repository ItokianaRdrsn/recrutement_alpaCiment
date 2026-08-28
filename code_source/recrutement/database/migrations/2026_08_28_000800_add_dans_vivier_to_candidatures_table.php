<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for type_rendez_vous, statut_rendez_vous, mode_realisation, rendez_vous, type_message, modele_message, communication matching exact gestion_recrutement.sql
     */
    public function up(): void
    {
        if (! Schema::hasTable('type_rendez_vous')) {
            Schema::create('type_rendez_vous', function (Blueprint $table) {
                $table->id('id_type_rendez_vous');
                $table->string('libelle', 50)->unique();
            });

            DB::table('type_rendez_vous')->insertOrIgnore([
                ['id_type_rendez_vous' => 1, 'libelle' => 'Test'],
                ['id_type_rendez_vous' => 2, 'libelle' => 'Entretien'],
            ]);
        }

        if (! Schema::hasTable('statut_rendez_vous')) {
            Schema::create('statut_rendez_vous', function (Blueprint $table) {
                $table->id('id_statut_rendez_vous');
                $table->string('libelle', 50)->unique();
                $table->integer('ordre_workflow')->default(0);
            });

            DB::table('statut_rendez_vous')->insertOrIgnore([
                ['id_statut_rendez_vous' => 1, 'libelle' => 'A venir', 'ordre_workflow' => 1],
                ['id_statut_rendez_vous' => 2, 'libelle' => 'Realise', 'ordre_workflow' => 2],
                ['id_statut_rendez_vous' => 3, 'libelle' => 'Annule', 'ordre_workflow' => 3],
            ]);
        }

        if (! Schema::hasTable('mode_realisation')) {
            Schema::create('mode_realisation', function (Blueprint $table) {
                $table->id('id_mode_realisation');
                $table->string('libelle', 50)->unique();
            });

            DB::table('mode_realisation')->insertOrIgnore([
                ['id_mode_realisation' => 1, 'libelle' => 'Presentiel'],
                ['id_mode_realisation' => 2, 'libelle' => 'Visioconference'],
                ['id_mode_realisation' => 3, 'libelle' => 'Telephone'],
            ]);
        }

        if (! Schema::hasTable('rendez_vous')) {
            Schema::create('rendez_vous', function (Blueprint $table) {
                $table->id('id_rendez_vous');
                $table->foreignId('id_candidature')->constrained('candidature', 'id_candidature')->cascadeOnDelete();
                $table->foreignId('id_utilisateur')->constrained('utilisateur', 'id_utilisateur')->restrictOnDelete();
                $table->foreignId('id_type_rendez_vous')->constrained('type_rendez_vous', 'id_type_rendez_vous')->restrictOnDelete();
                $table->foreignId('id_statut_rendez_vous')->constrained('statut_rendez_vous', 'id_statut_rendez_vous')->restrictOnDelete();
                $table->foreignId('id_mode_realisation')->constrained('mode_realisation', 'id_mode_realisation')->restrictOnDelete();
                $table->timestamp('date_debut');
                $table->timestamp('date_fin');
                $table->text('details_lieu')->nullable();
                $table->text('commentaire')->nullable();
                $table->timestampsTz();

                $table->index('id_candidature', 'idx_rendez_vous_candidature');
                $table->index('id_utilisateur', 'idx_rendez_vous_utilisateur');
                $table->index('id_type_rendez_vous', 'idx_rendez_vous_type');
                $table->index('id_statut_rendez_vous', 'idx_rendez_vous_statut');
                $table->index('id_mode_realisation', 'idx_rendez_vous_mode');
                $table->index('date_debut', 'idx_rendez_vous_date_debut');
            });
        }

        if (! Schema::hasTable('type_message')) {
            Schema::create('type_message', function (Blueprint $table) {
                $table->id('id_type_message');
                $table->string('libelle', 100)->unique();
            });

            DB::table('type_message')->insertOrIgnore([
                ['id_type_message' => 1, 'libelle' => 'Accuse de reception'],
                ['id_type_message' => 2, 'libelle' => 'Convocation'],
                ['id_type_message' => 3, 'libelle' => 'Demande information'],
                ['id_type_message' => 4, 'libelle' => 'Demande document'],
                ['id_type_message' => 5, 'libelle' => 'Issue recrutement'],
                ['id_type_message' => 6, 'libelle' => 'Autre'],
            ]);
        }

        if (! Schema::hasTable('modele_message')) {
            Schema::create('modele_message', function (Blueprint $table) {
                $table->id('id_modele_message');
                $table->foreignId('id_type_message')->constrained('type_message', 'id_type_message')->restrictOnDelete();
                $table->foreignId('id_statut_candidature')->nullable()->constrained('statut_candidature', 'id_statut_candidature')->nullOnDelete();
                $table->string('nom_modele', 150);
                $table->string('objet', 255);
                $table->text('contenu');
                $table->boolean('envoi_automatique')->default(false);
                $table->boolean('actif')->default(true);
                $table->timestampsTz();

                $table->index('id_type_message', 'idx_modele_message_type');
                $table->index('id_statut_candidature', 'idx_modele_message_statut');
            });
        }

        if (! Schema::hasTable('communication')) {
            Schema::create('communication', function (Blueprint $table) {
                $table->id('id_communication');
                $table->foreignId('id_candidature')->constrained('candidature', 'id_candidature')->cascadeOnDelete();
                $table->foreignId('id_modele_message')->nullable()->constrained('modele_message', 'id_modele_message')->nullOnDelete();
                $table->foreignId('id_type_message')->constrained('type_message', 'id_type_message')->restrictOnDelete();
                $table->string('objet', 255);
                $table->text('contenu')->nullable();
                $table->string('mode_envoi', 10)->default('manuel');
                $table->timestampTz('date_envoi')->useCurrent();
                $table->foreignId('id_utilisateur')->nullable()->constrained('utilisateur', 'id_utilisateur')->nullOnDelete();

                $table->index('id_candidature', 'idx_communication_candidature');
                $table->index('id_type_message', 'idx_communication_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('communication');
        Schema::dropIfExists('modele_message');
        Schema::dropIfExists('type_message');
        Schema::dropIfExists('rendez_vous');
        Schema::dropIfExists('mode_realisation');
        Schema::dropIfExists('statut_rendez_vous');
        Schema::dropIfExists('type_rendez_vous');
    }
};
