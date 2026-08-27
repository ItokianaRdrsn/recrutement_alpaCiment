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
        Schema::table('profil_offre', function (Blueprint $table) {
            $table->dropUnique('profil_offre_id_offre_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profil_offre', function (Blueprint $table) {
            $table->unique('id_offre');
        });
    }
};
