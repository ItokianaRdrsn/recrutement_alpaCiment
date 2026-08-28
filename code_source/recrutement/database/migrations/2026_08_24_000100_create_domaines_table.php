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
        Schema::create('domaine', function (Blueprint $table) {
            $table->id('id_domaine');
            $table->string('nom_domaine', 150)->unique();
            $table->foreignId('id_direction')
                ->nullable()
                ->constrained('direction', 'id_direction')
                ->restrictOnDelete();
            $table->boolean('valide')->default(false);
            $table->timestampTz('date_validation')->nullable();
            $table->foreignId('valide_par')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestampsTz();

            $table->index('id_direction', 'idx_domaine_direction');
            $table->index('valide', 'idx_domaine_valide');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('domaine');
    }
};
