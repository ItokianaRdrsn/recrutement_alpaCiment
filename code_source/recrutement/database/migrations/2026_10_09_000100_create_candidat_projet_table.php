<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('candidat_projet')) {
            Schema::create('candidat_projet', function (Blueprint $table) {
                $table->id('id_projet');
                $table->foreignId('id_candidature')->constrained('candidature', 'id_candidature')->cascadeOnDelete();
                $table->string('titre_projet', 200);
                $table->string('role', 150)->nullable();
                $table->string('technologies', 255)->nullable();
                $table->string('url_projet', 255)->nullable();
                $table->date('date_debut')->nullable();
                $table->date('date_fin')->nullable();
                $table->text('description')->nullable();
                $table->string('source', 20)->default('manuel');
                $table->decimal('score_confiance', 4, 3)->nullable();
                $table->foreignId('id_document')->nullable()->constrained('document', 'id_document')->nullOnDelete();
                $table->boolean('valide')->default(false);
                $table->timestampTz('date_validation')->nullable();
                $table->foreignId('valide_par')->nullable()->constrained('utilisateur', 'id_utilisateur')->nullOnDelete();
                $table->timestampsTz();

                $table->index('id_candidature', 'idx_projet_candidature');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidat_projet');
    }
};
