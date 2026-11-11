<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('candidature') && ! Schema::hasColumn('candidature', 'score_matching')) {
            Schema::table('candidature', function (Blueprint $table) {
                $table->unsignedSmallInteger('score_matching')->nullable()->after('dans_vivier');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('candidature', 'score_matching')) {
            Schema::table('candidature', function (Blueprint $table) {
                $table->dropColumn('score_matching');
            });
        }
    }
};
