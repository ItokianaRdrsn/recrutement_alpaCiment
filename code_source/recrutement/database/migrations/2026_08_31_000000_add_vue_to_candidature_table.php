<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('candidature') && ! Schema::hasColumn('candidature', 'vue')) {
            Schema::table('candidature', function (Blueprint $table) {
                $table->boolean('vue')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('candidature') && Schema::hasColumn('candidature', 'vue')) {
            Schema::table('candidature', function (Blueprint $table) {
                $table->dropColumn('vue');
            });
        }
    }
};
