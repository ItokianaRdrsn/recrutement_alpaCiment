<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('lieu')) {
            Schema::create('lieu', function (Blueprint $table) {
                $table->id('id_lieu');
                $table->string('libelle', 150)->unique();
            });

            foreach ([
                'Antananarivo',
                'Toamasina',
                'Antsirabe',
                'Mahajanga',
                'Fianarantsoa',
                'Toliara',
                'Antsiranana',
                'Usine AlpA Ciment',
            ] as $lieu) {
                DB::table('lieu')->insertOrIgnore(['libelle' => $lieu]);
            }
        }

        if (! Schema::hasTable('niveau')) {
            Schema::create('niveau', function (Blueprint $table) {
                $table->id('id_niveau');
                $table->string('libelle', 100)->unique();
            });

            foreach ([
                'CAP / BEP',
                'Baccalauréat',
                'Bac+2 (BTS / DUT)',
                'Bac+3 (Licence)',
                'Bac+4 (Master 1)',
                'Bac+5 (Master 2 / Ingénieur)',
                'Bac+8 (Doctorat)',
            ] as $niveau) {
                DB::table('niveau')->insertOrIgnore(['libelle' => $niveau]);
            }
        }

        if (Schema::hasTable('offre') && ! Schema::hasColumn('offre', 'id_lieu')) {
            Schema::table('offre', function (Blueprint $table) {
                $table->foreignId('id_lieu')->nullable()->constrained('lieu', 'id_lieu')->restrictOnDelete();
            });
            // Update existing records to default lieu 1
            DB::table('offre')->whereNull('id_lieu')->update(['id_lieu' => 1]);
        }

        if (Schema::hasTable('profil_formation')) {
            Schema::table('profil_formation', function (Blueprint $table) {
                if (! Schema::hasColumn('profil_formation', 'id_niveau_min')) {
                    $table->foreignId('id_niveau_min')->nullable()->constrained('niveau', 'id_niveau')->restrictOnDelete();
                }
                if (! Schema::hasColumn('profil_formation', 'id_niveau_max')) {
                    $table->foreignId('id_niveau_max')->nullable()->constrained('niveau', 'id_niveau')->restrictOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('profil_formation')) {
            Schema::table('profil_formation', function (Blueprint $table) {
                if (Schema::hasColumn('profil_formation', 'id_niveau_min')) {
                    $table->dropForeign(['id_niveau_min']);
                    $table->dropColumn('id_niveau_min');
                }
                if (Schema::hasColumn('profil_formation', 'id_niveau_max')) {
                    $table->dropForeign(['id_niveau_max']);
                    $table->dropColumn('id_niveau_max');
                }
            });
        }

        if (Schema::hasTable('offre') && Schema::hasColumn('offre', 'id_lieu')) {
            Schema::table('offre', function (Blueprint $table) {
                $table->dropForeign(['id_lieu']);
                $table->dropColumn('id_lieu');
            });
        }

        Schema::dropIfExists('niveau');
        Schema::dropIfExists('lieu');
    }
};
