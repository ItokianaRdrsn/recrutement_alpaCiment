<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('offre', 'date_cloture')) {
            Schema::table('offre', function (Blueprint $table): void {
                $table->timestamp('date_cloture')->nullable()->after('date_limite');
            });
        }

        // Offres déjà clôturées : on prend leur dernière modification comme date de clôture.
        $clotureeId = DB::table('statut_offre')->where('libelle', 'Cloturee')->value('id_statut_offre');
        if ($clotureeId) {
            DB::table('offre')
                ->where('id_statut_offre', $clotureeId)
                ->whereNull('date_cloture')
                ->update(['date_cloture' => DB::raw('COALESCE(updated_at, CURRENT_TIMESTAMP)')]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('offre', 'date_cloture')) {
            Schema::table('offre', function (Blueprint $table): void {
                $table->dropColumn('date_cloture');
            });
        }
    }
};
