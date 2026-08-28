<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for candidat, candidature, historique_statut, document matching exact gestion_recrutement.sql
     */
    public function up(): void
    {
        if (! Schema::hasTable('candidat')) {
            Schema::create('candidat', function (Blueprint $table) {
                $table->id('id_candidat');
                $table->string('nom', 100);
                $table->string('prenom', 100);
                $table->string('email', 200)->unique();
                $table->string('telephone', 30)->nullable();
                $table->text('adresse')->nullable();
                $table->date('date_naissance')->nullable();
                $table->timestampsTz();

                $table->index('nom', 'idx_candidat_nom');
            });
        }

        if (! Schema::hasTable('candidature')) {
            Schema::create('candidature', function (Blueprint $table) {
                $table->id('id_candidature');
                $table->foreignId('id_candidat')->constrained('candidat', 'id_candidat')->cascadeOnDelete();
                $table->foreignId('id_type_demande')->constrained('type_demande', 'id_type_demande')->restrictOnDelete();
                $table->foreignId('id_offre')->nullable()->constrained('offre', 'id_offre')->restrictOnDelete();
                $table->foreignId('id_domaine')->nullable()->constrained('domaine', 'id_domaine')->restrictOnDelete();
                $table->foreignId('id_statut_candidature')->constrained('statut_candidature', 'id_statut_candidature')->restrictOnDelete();
                $table->boolean('dans_vivier')->default(false);
                $table->string('poste_souhaite', 200)->nullable();
                $table->text('message')->nullable();
                $table->string('canal_depot', 20)->default('site_externe');
                $table->foreignId('id_utilisateur_depot')->nullable()->constrained('utilisateur', 'id_utilisateur')->nullOnDelete();
                $table->timestampsTz();

                $table->index('id_candidat', 'idx_candidature_candidat');
                $table->index('id_offre', 'idx_candidature_offre');
                $table->index('id_domaine', 'idx_candidature_domaine');
                $table->index('id_type_demande', 'idx_candidature_type_demande');
                $table->index('id_statut_candidature', 'idx_candidature_statut');
                $table->index('canal_depot', 'idx_candidature_canal');
            });
        }

        if (! Schema::hasTable('historique_statut')) {
            Schema::create('historique_statut', function (Blueprint $table) {
                $table->id('id_historique');
                $table->foreignId('id_candidature')->constrained('candidature', 'id_candidature')->cascadeOnDelete();
                $table->foreignId('id_statut_candidature')->constrained('statut_candidature', 'id_statut_candidature')->restrictOnDelete();
                $table->timestampTz('date_changement')->useCurrent();
                $table->text('commentaire')->nullable();
                $table->foreignId('id_utilisateur')->nullable()->constrained('utilisateur', 'id_utilisateur')->nullOnDelete();
                $table->timestampsTz();

                $table->index('id_candidature', 'idx_historique_candidature');
            });
        }

        if (! Schema::hasTable('document')) {
            Schema::create('document', function (Blueprint $table) {
                $table->id('id_document');
                $table->foreignId('id_candidature')->constrained('candidature', 'id_candidature')->cascadeOnDelete();
                $table->string('type_document', 50);
                $table->string('nom_fichier', 255);
                $table->text('chemin_fichier');
                $table->string('mime_type', 100)->nullable();
                $table->bigInteger('taille_octets')->nullable();
                $table->string('mode_acquisition', 20)->default('fichier');
                $table->text('contenu_texte_extrait')->nullable();
                $table->text('description')->nullable();
                $table->timestampTz('date_upload')->useCurrent();
                $table->timestamps();

                $table->index('id_candidature', 'idx_document_candidature');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document');
        Schema::dropIfExists('historique_statut');
        Schema::dropIfExists('candidature');
        Schema::dropIfExists('candidat');
    }
};
