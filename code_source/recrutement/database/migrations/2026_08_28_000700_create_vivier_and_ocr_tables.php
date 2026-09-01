<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for candidat_competence, experience_professionnelle, formation, vivier_candidat, cv_extraction_ocr matching exact gestion_recrutement.sql
     */
    public function up(): void
    {
        if (! Schema::hasTable('candidat_competence')) {
            Schema::create('candidat_competence', function (Blueprint $table) {
                $table->foreignId('id_candidat')->constrained('candidat', 'id_candidat')->cascadeOnDelete();
                $table->foreignId('id_competence')->constrained('competence', 'id_competence')->cascadeOnDelete();
                $table->string('niveau', 30)->nullable();
                $table->string('source', 20)->default('manuel');
                $table->decimal('score_confiance', 4, 3)->nullable();
                $table->foreignId('id_document')->nullable()->constrained('document', 'id_document')->nullOnDelete();
                $table->boolean('valide')->default(false);
                $table->timestampTz('date_validation')->nullable();
                $table->foreignId('valide_par')->nullable()->constrained('utilisateur', 'id_utilisateur')->nullOnDelete();
                $table->primary(['id_candidat', 'id_competence']);
            });
        }

        if (! Schema::hasTable('candidat_experience_professionnelle') && ! Schema::hasTable('experience_professionnelle')) {
            Schema::create('candidat_experience_professionnelle', function (Blueprint $table) {
                $table->id('id_experience');
                $table->foreignId('id_candidat')->constrained('candidat', 'id_candidat')->cascadeOnDelete();
                $table->string('poste', 200);
                $table->string('entreprise', 200)->nullable();
                $table->date('date_debut')->nullable();
                $table->date('date_fin')->nullable();
                $table->boolean('poste_actuel')->default(false);
                $table->text('description')->nullable();
                $table->string('source', 20)->default('manuel');
                $table->decimal('score_confiance', 4, 3)->nullable();
                $table->foreignId('id_document')->nullable()->constrained('document', 'id_document')->nullOnDelete();
                $table->boolean('valide')->default(false);
                $table->timestampTz('date_validation')->nullable();
                $table->foreignId('valide_par')->nullable()->constrained('utilisateur', 'id_utilisateur')->nullOnDelete();
                $table->timestampsTz();

                $table->index('id_candidat', 'idx_experience_candidat');
            });
        }

        if (! Schema::hasTable('candidat_formation') && ! Schema::hasTable('formation')) {
            Schema::create('candidat_formation', function (Blueprint $table) {
                $table->id('id_formation');
                $table->foreignId('id_candidat')->constrained('candidat', 'id_candidat')->cascadeOnDelete();
                $table->string('diplome', 200);
                $table->string('etablissement', 200)->nullable();
                $table->string('domaine_etude', 150)->nullable();
                $table->string('niveau', 50)->nullable();
                $table->date('date_obtention')->nullable();
                $table->string('source', 20)->default('manuel');
                $table->decimal('score_confiance', 4, 3)->nullable();
                $table->foreignId('id_document')->nullable()->constrained('document', 'id_document')->nullOnDelete();
                $table->boolean('valide')->default(false);
                $table->timestampTz('date_validation')->nullable();
                $table->foreignId('valide_par')->nullable()->constrained('utilisateur', 'id_utilisateur')->nullOnDelete();
                $table->timestampsTz();

                $table->index('id_candidat', 'idx_formation_candidat');
            });
        }

        if (! Schema::hasTable('vivier_candidat')) {
            Schema::create('vivier_candidat', function (Blueprint $table) {
                $table->id('id_vivier_candidat');
                $table->foreignId('id_candidat')->constrained('candidat', 'id_candidat')->cascadeOnDelete();
                $table->foreignId('id_direction')->nullable()->constrained('direction', 'id_direction')->nullOnDelete();
                $table->foreignId('id_domaine')->nullable()->constrained('domaine', 'id_domaine')->nullOnDelete();
                $table->string('motif_ajout', 255)->nullable();
                $table->string('statut', 50)->default('Actif');
                $table->timestampsTz();
            });
        }

        if (! Schema::hasTable('cv_extraction_ocr')) {
            Schema::create('cv_extraction_ocr', function (Blueprint $table) {
                $table->id('id_extraction');
                $table->foreignId('id_candidature')->constrained('candidature', 'id_candidature')->cascadeOnDelete();
                $table->text('texte_brut_ocr')->nullable();
                $table->json('donnees_json')->nullable();
                $table->string('statut_validation', 50)->default('en_attente');
                $table->text('commentaire_rh')->nullable();
                $table->timestampsTz();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cv_extraction_ocr');
        Schema::dropIfExists('vivier_candidat');
        Schema::dropIfExists('formation');
        Schema::dropIfExists('experience_professionnelle');
        Schema::dropIfExists('candidat_competence');
    }
};
