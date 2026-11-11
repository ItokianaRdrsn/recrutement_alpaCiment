<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('pipeline_metrics')) {
            Schema::create('pipeline_metrics', function (Blueprint $table) {
                $table->id('id_metric');
                $table->unsignedBigInteger('id_candidature')->nullable();
                $table->unsignedBigInteger('id_offre')->nullable();
                $table->string('cle_idempotence', 255)->nullable();
                $table->string('email_expediteur', 200)->nullable();
                $table->string('sujet_email', 255)->nullable();
                $table->string('intention', 50)->default('demande_emploi'); // demande_emploi, information, spam
                $table->string('statut', 30)->default('succes'); // succes, doublon_ignore, erreur
                $table->decimal('duree_classification_s', 8, 3)->default(0);
                $table->decimal('duree_ocr_s', 8, 3)->default(0);
                $table->decimal('duree_ner_s', 8, 3)->default(0);
                $table->decimal('duree_totale_s', 8, 3)->default(0);
                $table->integer('nb_caracteres_ocr')->default(0);
                $table->integer('nb_competences')->default(0);
                $table->integer('nb_experiences')->default(0);
                $table->integer('nb_projets')->default(0);
                $table->integer('nb_formations')->default(0);
                $table->string('noeud_erreur', 150)->nullable();
                $table->text('message_erreur')->nullable();
                $table->timestamps();

                $table->index('statut', 'idx_pipeline_metrics_statut');
                $table->index('intention', 'idx_pipeline_metrics_intention');
                $table->index('created_at', 'idx_pipeline_metrics_created_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pipeline_metrics');
    }
};
