<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for type_competence, competence, competence_alias, profil_competence matching gestion_recrutement.sql
     */
    public function up(): void
    {
        if (! Schema::hasTable('type_competence')) {
            Schema::create('type_competence', function (Blueprint $table) {
                $table->id('id_type_competence');
                $table->string('libelle', 100)->unique();
            });

            DB::table('type_competence')->insertOrIgnore([
                ['id_type_competence' => 1, 'libelle' => 'Technique'],
                ['id_type_competence' => 2, 'libelle' => 'Langue'],
                ['id_type_competence' => 3, 'libelle' => 'Logiciel'],
                ['id_type_competence' => 4, 'libelle' => 'Méthodologie'],
                ['id_type_competence' => 5, 'libelle' => 'Autre'],
            ]);
        }

        if (! Schema::hasTable('competence')) {
            Schema::create('competence', function (Blueprint $table) {
                $table->id('id_competence');
                $table->string('nom_competence', 150)->unique();
                $table->foreignId('id_type_competence')->constrained('type_competence', 'id_type_competence');
            });
        }

        if (! Schema::hasTable('competence_alias')) {
            Schema::create('competence_alias', function (Blueprint $table) {
                $table->id('id_alias');
                $table->string('texte_brut', 150)->unique();
                $table->foreignId('id_competence')->constrained('competence', 'id_competence')->cascadeOnDelete();
                $table->foreignId('id_utilisateur')->nullable()->constrained('utilisateur', 'id_utilisateur')->nullOnDelete();
                $table->timestampTz('created_at')->useCurrent();

                $table->index('id_competence', 'idx_competence_alias_competence');
            });
        }

        if (! Schema::hasTable('profil_competence')) {
            Schema::create('profil_competence', function (Blueprint $table) {
                $table->foreignId('id_offre')->constrained('offre', 'id_offre')->cascadeOnDelete();
                $table->foreignId('id_competence')->constrained('competence', 'id_competence')->cascadeOnDelete();
                $table->string('niveau_requis', 30)->nullable();
                $table->primary(['id_offre', 'id_competence']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profil_competence');
        Schema::dropIfExists('competence_alias');
        Schema::dropIfExists('competence');
        Schema::dropIfExists('type_competence');
    }
};
