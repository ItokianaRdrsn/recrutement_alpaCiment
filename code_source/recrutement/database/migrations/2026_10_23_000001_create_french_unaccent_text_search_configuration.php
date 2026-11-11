<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Configure unaccent extension and french_unaccent text search configuration in PostgreSQL,
     * then rebuild document.recherche_texte to be accent-insensitive.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS unaccent');

            DB::statement("
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'french_unaccent') THEN
                        CREATE TEXT SEARCH CONFIGURATION french_unaccent ( COPY = french );
                        ALTER TEXT SEARCH CONFIGURATION french_unaccent
                            ALTER MAPPING FOR word, hword, hword_part WITH unaccent, french_stem;
                    END IF;
                END
                $$;
            ");

            if (Schema::hasTable('document') && Schema::hasColumn('document', 'recherche_texte')) {
                DB::statement('DROP INDEX IF EXISTS idx_document_recherche_texte');
                DB::statement('ALTER TABLE document DROP COLUMN IF EXISTS recherche_texte');
                DB::statement("ALTER TABLE document ADD COLUMN recherche_texte tsvector GENERATED ALWAYS AS (to_tsvector('french_unaccent', coalesce(contenu_texte_extrait, ''))) STORED");
                DB::statement('CREATE INDEX IF NOT EXISTS idx_document_recherche_texte ON document USING GIN (recherche_texte)');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            if (Schema::hasTable('document') && Schema::hasColumn('document', 'recherche_texte')) {
                DB::statement('DROP INDEX IF EXISTS idx_document_recherche_texte');
                DB::statement('ALTER TABLE document DROP COLUMN IF EXISTS recherche_texte');
                DB::statement("ALTER TABLE document ADD COLUMN recherche_texte tsvector GENERATED ALWAYS AS (to_tsvector('french', coalesce(contenu_texte_extrait, ''))) STORED");
                DB::statement('CREATE INDEX IF NOT EXISTS idx_document_recherche_texte ON document USING GIN (recherche_texte)');
            }

            DB::statement('DROP TEXT SEARCH CONFIGURATION IF EXISTS french_unaccent');
        }
    }
};
