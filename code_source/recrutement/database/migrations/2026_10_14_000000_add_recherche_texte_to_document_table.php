<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add full-text tsvector to document table on PostgreSQL.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql' && Schema::hasTable('document')) {
            if (! Schema::hasColumn('document', 'recherche_texte')) {
                DB::statement("ALTER TABLE document ADD COLUMN IF NOT EXISTS recherche_texte tsvector GENERATED ALWAYS AS (to_tsvector('french', coalesce(contenu_texte_extrait, ''))) STORED");
                DB::statement('CREATE INDEX IF NOT EXISTS idx_document_recherche_texte ON document USING GIN (recherche_texte)');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql' && Schema::hasTable('document')) {
            if (Schema::hasColumn('document', 'recherche_texte')) {
                DB::statement('DROP INDEX IF EXISTS idx_document_recherche_texte');
                DB::statement('ALTER TABLE document DROP COLUMN IF EXISTS recherche_texte');
            }
        }
    }
};
