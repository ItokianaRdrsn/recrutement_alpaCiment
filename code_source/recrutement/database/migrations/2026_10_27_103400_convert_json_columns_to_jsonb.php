<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            if (Schema::hasTable('cv_extraction_ocr') && Schema::hasColumn('cv_extraction_ocr', 'donnees_json')) {
                DB::statement('ALTER TABLE cv_extraction_ocr ALTER COLUMN donnees_json TYPE JSONB USING donnees_json::jsonb');
            }

            if (Schema::hasTable('audit_log')) {
                if (Schema::hasColumn('audit_log', 'anciennes_valeurs')) {
                    DB::statement('ALTER TABLE audit_log ALTER COLUMN anciennes_valeurs TYPE JSONB USING anciennes_valeurs::jsonb');
                }
                if (Schema::hasColumn('audit_log', 'nouvelles_valeurs')) {
                    DB::statement('ALTER TABLE audit_log ALTER COLUMN nouvelles_valeurs TYPE JSONB USING nouvelles_valeurs::jsonb');
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            if (Schema::hasTable('cv_extraction_ocr') && Schema::hasColumn('cv_extraction_ocr', 'donnees_json')) {
                DB::statement('ALTER TABLE cv_extraction_ocr ALTER COLUMN donnees_json TYPE JSON USING donnees_json::json');
            }

            if (Schema::hasTable('audit_log')) {
                if (Schema::hasColumn('audit_log', 'anciennes_valeurs')) {
                    DB::statement('ALTER TABLE audit_log ALTER COLUMN anciennes_valeurs TYPE JSON USING anciennes_valeurs::json');
                }
                if (Schema::hasColumn('audit_log', 'nouvelles_valeurs')) {
                    DB::statement('ALTER TABLE audit_log ALTER COLUMN nouvelles_valeurs TYPE JSON USING nouvelles_valeurs::json');
                }
            }
        }
    }
};
