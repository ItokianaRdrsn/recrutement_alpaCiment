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
        if (! Schema::hasTable('utilisateur')) {
            Schema::create('utilisateur', function (Blueprint $table) {
                $table->id('id_utilisateur');
                $table->string('nom', 150);
                $table->string('email', 200)->unique();
                $table->string('role', 30)->default('rh');
                $table->timestampsTz();
            });
        }

        if (! Schema::hasTable('type_demande')) {
            Schema::create('type_demande', function (Blueprint $table) {
                $table->id('id_type_demande');
                $table->string('libelle', 50)->unique();
            });

            DB::table('type_demande')->insertOrIgnore([
                ['id_type_demande' => 1, 'libelle' => 'Offre'],
                ['id_type_demande' => 2, 'libelle' => 'Spontanee'],
            ]);
        }

        if (! Schema::hasTable('statut_offre')) {
            Schema::create('statut_offre', function (Blueprint $table) {
                $table->id('id_statut_offre');
                $table->string('libelle', 50)->unique();
                $table->integer('ordre_workflow')->default(0);
            });

            DB::table('statut_offre')->insertOrIgnore([
                ['id_statut_offre' => 1, 'libelle' => 'Brouillon', 'ordre_workflow' => 1],
                ['id_statut_offre' => 2, 'libelle' => 'Publiee', 'ordre_workflow' => 2],
                ['id_statut_offre' => 3, 'libelle' => 'Cloturee', 'ordre_workflow' => 3],
            ]);
        }

        if (! Schema::hasTable('type_contrat')) {
            Schema::create('type_contrat', function (Blueprint $table) {
                $table->id('id_type_contrat');
                $table->string('libelle', 50)->unique();
            });

            DB::table('type_contrat')->insertOrIgnore([
                ['id_type_contrat' => 1, 'libelle' => 'CDI'],
                ['id_type_contrat' => 2, 'libelle' => 'CDD'],
                ['id_type_contrat' => 3, 'libelle' => 'Stage'],
                ['id_type_contrat' => 4, 'libelle' => 'Interim'],
                ['id_type_contrat' => 5, 'libelle' => 'Consultance'],
            ]);
        }

        if (! Schema::hasTable('statut_candidature')) {
            Schema::create('statut_candidature', function (Blueprint $table) {
                $table->id('id_statut_candidature');
                $table->string('libelle', 100)->unique();
                $table->integer('ordre_workflow')->default(0);
            });

            DB::table('statut_candidature')->insertOrIgnore([
                ['id_statut_candidature' => 1, 'libelle' => 'Recue', 'ordre_workflow' => 1],
                ['id_statut_candidature' => 2, 'libelle' => 'Preselectionnee', 'ordre_workflow' => 2],
                ['id_statut_candidature' => 3, 'libelle' => 'Test', 'ordre_workflow' => 3],
                ['id_statut_candidature' => 4, 'libelle' => 'Entretien', 'ordre_workflow' => 4],
                ['id_statut_candidature' => 5, 'libelle' => 'Retenue', 'ordre_workflow' => 5],
                ['id_statut_candidature' => 6, 'libelle' => 'Non retenue', 'ordre_workflow' => 6],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('statut_candidature');
        Schema::dropIfExists('type_contrat');
        Schema::dropIfExists('statut_offre');
        Schema::dropIfExists('type_demande');
        Schema::dropIfExists('utilisateur');
    }
};
