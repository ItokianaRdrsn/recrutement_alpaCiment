<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to update candidat_competence, candidat_experience_professionnelle, and candidat_formation to use id_candidature.
     */
    public function up(): void
    {
        // 1. candidat_competence
        if (Schema::hasTable('candidat_competence')) {
            if (Schema::hasColumn('candidat_competence', 'id_candidat') && ! Schema::hasColumn('candidat_competence', 'id_candidature')) {
                DB::statement('ALTER TABLE candidat_competence ADD COLUMN id_candidature BIGINT REFERENCES candidature(id_candidature) ON DELETE CASCADE');
                DB::statement('UPDATE candidat_competence cc SET id_candidature = (SELECT c.id_candidature FROM candidature c WHERE c.id_candidat = cc.id_candidat ORDER BY c.id_candidature DESC LIMIT 1)');
                DB::statement('DELETE FROM candidat_competence WHERE id_candidature IS NULL');
                DB::statement('ALTER TABLE candidat_competence ALTER COLUMN id_candidature SET NOT NULL');
                DB::statement('ALTER TABLE candidat_competence DROP CONSTRAINT IF EXISTS candidat_competence_pkey');
                DB::statement('ALTER TABLE candidat_competence DROP COLUMN id_candidat');
                DB::statement('ALTER TABLE candidat_competence ADD PRIMARY KEY (id_candidature, id_competence)');
            }
        }

        // 2. candidat_experience_professionnelle
        if (Schema::hasTable('candidat_experience_professionnelle')) {
            if (Schema::hasColumn('candidat_experience_professionnelle', 'id_candidat') && ! Schema::hasColumn('candidat_experience_professionnelle', 'id_candidature')) {
                DB::statement('ALTER TABLE candidat_experience_professionnelle ADD COLUMN id_candidature BIGINT REFERENCES candidature(id_candidature) ON DELETE CASCADE');
                DB::statement('UPDATE candidat_experience_professionnelle exp SET id_candidature = (SELECT c.id_candidature FROM candidature c WHERE c.id_candidat = exp.id_candidat ORDER BY c.id_candidature DESC LIMIT 1)');
                DB::statement('DELETE FROM candidat_experience_professionnelle WHERE id_candidature IS NULL');
                DB::statement('ALTER TABLE candidat_experience_professionnelle ALTER COLUMN id_candidature SET NOT NULL');
                DB::statement('ALTER TABLE candidat_experience_professionnelle DROP COLUMN id_candidat');
            }
        }

        // 3. candidat_formation
        if (Schema::hasTable('candidat_formation')) {
            if (Schema::hasColumn('candidat_formation', 'id_candidat') && ! Schema::hasColumn('candidat_formation', 'id_candidature')) {
                DB::statement('ALTER TABLE candidat_formation ADD COLUMN id_candidature BIGINT REFERENCES candidature(id_candidature) ON DELETE CASCADE');
                DB::statement('UPDATE candidat_formation f SET id_candidature = (SELECT c.id_candidature FROM candidature c WHERE c.id_candidat = f.id_candidat ORDER BY c.id_candidature DESC LIMIT 1)');
                DB::statement('DELETE FROM candidat_formation WHERE id_candidature IS NULL');
                DB::statement('ALTER TABLE candidat_formation ALTER COLUMN id_candidature SET NOT NULL');
                DB::statement('ALTER TABLE candidat_formation DROP COLUMN id_candidat');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // down not strictly required for schema alignment
    }
};
