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
        if (! Schema::hasTable('candidat_autre')) {
            Schema::create('candidat_autre', function (Blueprint $table) {
                $table->id('id_autre');
                $table->foreignId('id_candidature')->constrained('candidature', 'id_candidature')->cascadeOnDelete();
                $table->string('titre', 255);
                $table->text('description')->nullable();
                $table->string('source', 20)->default('ocr');
                $table->boolean('valide')->default(true);
                $table->timestampsTz();

                $table->index('id_candidature', 'idx_autre_candidature');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidat_autre');
    }
};
