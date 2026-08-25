<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('offre', function (Blueprint $table) {
            $table->id('id_offre');
            $table->string('titre_poste', 200);
            $table->foreignId('id_direction')
                ->constrained('direction', 'id_direction')
                ->restrictOnDelete();
            $table->text('description')->nullable();
            $table->string('lieu', 200)->nullable();
            $table->foreignId('id_type_contrat')
                ->nullable()
                ->constrained('type_contrat', 'id_type_contrat')
                ->restrictOnDelete();
            $table->date('date_publication')->nullable();
            $table->date('date_limite')->nullable();
            $table->foreignId('id_statut_offre')
                ->constrained('statut_offre', 'id_statut_offre')
                ->restrictOnDelete();
            $table->timestampsTz();

            $table->index('id_direction', 'idx_offre_direction');
            $table->index('id_type_contrat', 'idx_offre_type_contrat');
            $table->index('id_statut_offre', 'idx_offre_statut');
        });

        DB::statement(
            'ALTER TABLE offre ADD CONSTRAINT chk_offre_dates CHECK (date_limite IS NULL OR date_publication IS NULL OR date_limite >= date_publication)'
        );

        Schema::create('profil_offre', function (Blueprint $table) {
            $table->id('id_profil_offre');
            $table->foreignId('id_offre')
                ->unique()
                ->constrained('offre', 'id_offre')
                ->cascadeOnDelete();
            $table->text('description')->nullable();
            $table->string('type_valeur', 50)->nullable();
            $table->string('valeur_min', 100)->nullable();
            $table->string('valeur_max', 100)->nullable();
            $table->string('valeur_attendue', 200)->nullable();
            $table->string('unite_valeur', 50)->nullable();
            $table->timestampsTz();

            $table->index('id_offre', 'idx_profil_offre_offre');
        });

        Schema::create('mission', function (Blueprint $table) {
            $table->id('id_mission');
            $table->foreignId('id_offre')
                ->constrained('offre', 'id_offre')
                ->cascadeOnDelete();
            $table->text('description');
            $table->integer('ordre')->default(1);
            $table->timestampsTz();

            $table->index('id_offre', 'idx_mission_offre');
        });

        DB::statement('ALTER TABLE mission ADD CONSTRAINT chk_mission_ordre CHECK (ordre > 0)');

        Schema::create('profil_formation', function (Blueprint $table) {
            $table->id('id_profil_formation');
            $table->foreignId('id_offre')
                ->constrained('offre', 'id_offre')
                ->cascadeOnDelete();
            $table->string('niveau_min', 50)->nullable();
            $table->string('niveau_max', 50)->nullable();
            $table->string('domaine', 150)->nullable();
            $table->boolean('obligatoire')->default(true);
            $table->timestampTz('created_at')->useCurrent();

            $table->index('id_offre', 'idx_profil_formation_offre');
        });

        DB::statement(
            'ALTER TABLE profil_formation ADD CONSTRAINT chk_profil_formation_niveau CHECK (niveau_min IS NOT NULL OR niveau_max IS NOT NULL OR domaine IS NOT NULL)'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profil_formation');
        Schema::dropIfExists('mission');
        Schema::dropIfExists('profil_offre');
        Schema::dropIfExists('offre');
    }
};
