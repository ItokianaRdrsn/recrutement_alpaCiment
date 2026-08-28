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
        if (! Schema::hasTable('statut_candidature')) {
            Schema::create('statut_candidature', function (Blueprint $table) {
                $table->id('id_statut_candidature');
                $table->string('libelle', 100)->unique();
                $table->integer('ordre_workflow')->default(0);
                $table->timestamps();
            });

            DB::table('statut_candidature')->insert([
                ['libelle' => 'Reçue', 'ordre_workflow' => 1, 'created_at' => now(), 'updated_at' => now()],
                ['libelle' => 'En cours d\'examen', 'ordre_workflow' => 2, 'created_at' => now(), 'updated_at' => now()],
                ['libelle' => 'Présélectionné', 'ordre_workflow' => 3, 'created_at' => now(), 'updated_at' => now()],
                ['libelle' => 'Entretien', 'ordre_workflow' => 4, 'created_at' => now(), 'updated_at' => now()],
                ['libelle' => 'Offre faite', 'ordre_workflow' => 5, 'created_at' => now(), 'updated_at' => now()],
                ['libelle' => 'Embauché', 'ordre_workflow' => 6, 'created_at' => now(), 'updated_at' => now()],
                ['libelle' => 'Refusé', 'ordre_workflow' => 7, 'created_at' => now(), 'updated_at' => now()],
                ['libelle' => 'En vivier', 'ordre_workflow' => 8, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        if (! Schema::hasTable('candidats')) {
            Schema::create('candidats', function (Blueprint $table) {
                $table->id('id_candidat');
                $table->string('nom', 100);
                $table->string('prenom', 100);
                $table->string('email', 150)->unique();
                $table->string('telephone', 50)->nullable();
                $table->string('adresse', 255)->nullable();
                $table->string('ville', 100)->nullable();
                $table->string('code_postal', 20)->nullable();
                $table->string('pays', 100)->default('Madagascar');
                $table->date('date_naissance')->nullable();
                $table->string('linkedin_url', 255)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('candidatures')) {
            Schema::create('candidatures', function (Blueprint $table) {
                $table->id('id_candidature');
                $table->foreignId('id_candidat')->constrained('candidats', 'id_candidat')->onDelete('cascade');
                $table->foreignId('id_type_demande')->nullable()->constrained('type_demande', 'id_type_demande')->onDelete('set null');
                $table->foreignId('id_offre')->nullable()->constrained('offre', 'id_offre')->onDelete('set null');
                $table->foreignId('id_direction')->nullable()->constrained('direction', 'id_direction')->onDelete('set null');
                $table->foreignId('id_domaine')->nullable()->constrained('domaine', 'id_domaine')->onDelete('set null');
                $table->foreignId('id_statut_candidature')->constrained('statut_candidature', 'id_statut_candidature')->onDelete('restrict');
                $table->timestamp('date_candidature')->useCurrent();
                $table->text('message_motivation')->nullable();
                $table->string('postule_depuis', 100)->default('Formulaire web');
                $table->foreignId('id_recruteur_assigne')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('historique_statut')) {
            Schema::create('historique_statut', function (Blueprint $table) {
                $table->id('id_historique_statut');
                $table->foreignId('id_candidature')->constrained('candidatures', 'id_candidature')->onDelete('cascade');
                $table->foreignId('id_statut_precedent')->nullable()->constrained('statut_candidature', 'id_statut_candidature')->onDelete('set null');
                $table->foreignId('id_statut_nouveau')->constrained('statut_candidature', 'id_statut_candidature')->onDelete('restrict');
                $table->foreignId('modifie_par')->nullable()->constrained('users')->onDelete('set null');
                $table->text('commentaire')->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }

        if (! Schema::hasTable('documents')) {
            Schema::create('documents', function (Blueprint $table) {
                $table->id('id_document');
                $table->foreignId('id_candidature')->constrained('candidatures', 'id_candidature')->onDelete('cascade');
                $table->string('type_document', 50); // CV, Photo, Lettre_Motivation, Autre
                $table->string('nom_fichier', 255);
                $table->string('chemin_fichier', 255);
                $table->bigInteger('taille_octets')->nullable();
                $table->string('mime_type', 100)->nullable();
                $table->string('description', 255)->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
        Schema::dropIfExists('historique_statut');
        Schema::dropIfExists('candidatures');
        Schema::dropIfExists('candidats');
        Schema::dropIfExists('statut_candidature');
    }
};
