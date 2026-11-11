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
        Schema::table('candidature', function (Blueprint $table) {
            $table->string('cle_idempotence', 255)->nullable()->unique()->after('id_candidature');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidature', function (Blueprint $table) {
            $table->dropUnique(['cle_idempotence']);
            $table->dropColumn('cle_idempotence');
        });
    }
};
