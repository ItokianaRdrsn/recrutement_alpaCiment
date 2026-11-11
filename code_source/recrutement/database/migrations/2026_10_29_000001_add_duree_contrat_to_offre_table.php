<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('offre') && ! Schema::hasColumn('offre', 'duree_contrat')) {
            Schema::table('offre', function (Blueprint $table) {
                $table->string('duree_contrat', 100)->nullable()->after('id_type_contrat');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('offre') && Schema::hasColumn('offre', 'duree_contrat')) {
            Schema::table('offre', function (Blueprint $table) {
                $table->dropColumn('duree_contrat');
            });
        }
    }
};
