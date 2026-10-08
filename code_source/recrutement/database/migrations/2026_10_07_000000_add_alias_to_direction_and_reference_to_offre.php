<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ajouter la colonne 'alias' à la table 'direction'
        Schema::table('direction', function (Blueprint $table) {
            if (!Schema::hasColumn('direction', 'alias')) {
                $table->string('alias', 20)->nullable()->after('nom_direction');
            }
        });

        // 2. Mettre à jour les alias des directions existantes
        $directionAliases = [
            'Informatique' => 'IT',
            'Ressources Humaines' => 'RH',
            'Finance' => 'FIN',
            'Marketing' => 'MKT',
            'Commercial' => 'COMM',
        ];

        foreach ($directionAliases as $nom => $alias) {
            DB::table('direction')
                ->where('nom_direction', 'ilike', '%' . $nom . '%')
                ->update(['alias' => $alias]);
        }

        // 3. Ajouter la colonne 'reference' à la table 'offre'
        Schema::table('offre', function (Blueprint $table) {
            if (!Schema::hasColumn('offre', 'reference')) {
                $table->string('reference', 50)->nullable()->unique()->after('titre_poste');
            }
        });

        // 4. Générer les références pour toutes les offres existantes (alias + '-' + id_offre)
        $offres = DB::table('offre')
            ->leftJoin('direction', 'offre.id_direction', '=', 'direction.id_direction')
            ->select('offre.id_offre', 'direction.alias')
            ->get();

        foreach ($offres as $o) {
            $prefix = !empty($o->alias) ? strtoupper(trim($o->alias)) : 'REF';
            $ref = $prefix . '-' . $o->id_offre;

            DB::table('offre')
                ->where('id_offre', $o->id_offre)
                ->update(['reference' => $ref]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('offre', function (Blueprint $table) {
            if (Schema::hasColumn('offre', 'reference')) {
                $table->dropColumn('reference');
            }
        });

        Schema::table('direction', function (Blueprint $table) {
            if (Schema::hasColumn('direction', 'alias')) {
                $table->dropColumn('alias');
            }
        });
    }
};
