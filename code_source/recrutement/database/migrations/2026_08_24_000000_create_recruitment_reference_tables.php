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
        Schema::create('type_demande', function (Blueprint $table) {
            $table->id('id_type_demande');
            $table->string('libelle', 50)->unique();
        });

        Schema::create('statut_offre', function (Blueprint $table) {
            $table->id('id_statut_offre');
            $table->string('libelle', 50)->unique();
            $table->integer('ordre_workflow')->default(0);
        });

        Schema::create('type_contrat', function (Blueprint $table) {
            $table->id('id_type_contrat');
            $table->string('libelle', 50)->unique();
        });

        Schema::create('statut_candidature', function (Blueprint $table) {
            $table->id('id_statut_candidature');
            $table->string('libelle', 100)->unique();
            $table->integer('ordre_workflow')->default(0);
        });
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
    }
};
