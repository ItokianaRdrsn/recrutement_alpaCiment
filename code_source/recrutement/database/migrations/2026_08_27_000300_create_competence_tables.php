<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('type_competence', function (Blueprint $table) {
            $table->id('id_type_competence');
            $table->string('libelle', 100)->unique();
        });

        DB::table('type_competence')->insert([
            ['libelle' => 'Technique'],
            ['libelle' => 'Langue'],
            ['libelle' => 'Logiciel'],
            ['libelle' => 'Méthodologie'],
            ['libelle' => 'Autre'],
        ]);

        Schema::create('competence', function (Blueprint $table) {
            $table->id('id_competence');
            $table->string('nom_competence', 150)->unique();
            $table->foreignId('id_type_competence')
                ->constrained('type_competence', 'id_type_competence')
                ->restrictOnDelete();
            $table->timestampsTz();
        });

        Schema::create('profil_competence', function (Blueprint $table) {
            $table->foreignId('id_offre')
                ->constrained('offre', 'id_offre')
                ->cascadeOnDelete();
            $table->foreignId('id_competence')
                ->constrained('competence', 'id_competence')
                ->cascadeOnDelete();
            $table->string('niveau_requis', 30)->nullable();
            $table->primary(['id_offre', 'id_competence']);
        });

        // Insert initial standard competencies if empty
        $techniqueId = DB::table('type_competence')->where('libelle', 'Technique')->value('id_type_competence');
        $logicielId = DB::table('type_competence')->where('libelle', 'Logiciel')->value('id_type_competence');
        $langueId = DB::table('type_competence')->where('libelle', 'Langue')->value('id_type_competence');

        if ($techniqueId && $logicielId && $langueId) {
            DB::table('competence')->insertOrIgnore([
                ['nom_competence' => 'PHP / Laravel', 'id_type_competence' => $techniqueId, 'created_at' => now(), 'updated_at' => now()],
                ['nom_competence' => 'React.js', 'id_type_competence' => $techniqueId, 'created_at' => now(), 'updated_at' => now()],
                ['nom_competence' => 'PostgreSQL', 'id_type_competence' => $logicielId, 'created_at' => now(), 'updated_at' => now()],
                ['nom_competence' => 'Gestion de projet', 'id_type_competence' => $techniqueId, 'created_at' => now(), 'updated_at' => now()],
                ['nom_competence' => 'Français (Courant)', 'id_type_competence' => $langueId, 'created_at' => now(), 'updated_at' => now()],
                ['nom_competence' => 'Anglais (Professionnel)', 'id_type_competence' => $langueId, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profil_competence');
        Schema::dropIfExists('competence');
        Schema::dropIfExists('type_competence');
    }
};
