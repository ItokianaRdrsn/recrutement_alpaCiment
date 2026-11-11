<?php

namespace Tests\Feature\Api;

use App\Models\Offre;
use App\Services\ArchiveOffresService;
use App\Services\OffreService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ArchiveOffresTest extends TestCase
{
    protected int $idCloturee;
    protected int $idPubliee;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('statut_offre', function (Blueprint $table) {
            $table->id('id_statut_offre');
            $table->string('libelle', 50);
            $table->integer('ordre_workflow')->default(1);
        });

        Schema::create('offre', function (Blueprint $table) {
            $table->id('id_offre');
            $table->string('titre_poste', 150);
            $table->string('reference', 50)->nullable();
            $table->unsignedBigInteger('id_direction')->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('id_lieu')->nullable();
            $table->string('lieu', 150)->nullable();
            $table->unsignedBigInteger('id_type_contrat')->nullable();
            $table->string('duree_contrat', 50)->nullable();
            $table->date('date_publication')->nullable();
            $table->date('date_limite')->nullable();
            $table->timestamp('date_cloture')->nullable();
            $table->unsignedBigInteger('id_statut_offre');
            $table->timestamps();
        });

        Schema::create('candidature', function (Blueprint $table) {
            $table->id('id_candidature');
            $table->unsignedBigInteger('id_offre')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_log', function (Blueprint $table) {
            $table->id('id_audit_log');
            $table->unsignedBigInteger('id_utilisateur')->nullable();
            $table->string('action', 50);
            $table->string('entite', 100);
            $table->unsignedBigInteger('id_entite')->nullable();
            $table->string('description', 255)->nullable();
            $table->json('anciennes_valeurs')->nullable();
            $table->json('nouvelles_valeurs')->nullable();
            $table->string('ip_adresse', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });

        DB::table('statut_offre')->insert([
            ['libelle' => 'Brouillon', 'ordre_workflow' => 1],
            ['libelle' => 'Publiee', 'ordre_workflow' => 2],
            ['libelle' => 'Cloturee', 'ordre_workflow' => 3],
        ]);
        $this->idPubliee = (int) DB::table('statut_offre')->where('libelle', 'Publiee')->value('id_statut_offre');
        $this->idCloturee = (int) DB::table('statut_offre')->where('libelle', 'Cloturee')->value('id_statut_offre');
    }

    private function offre(int $statut, ?string $dateCloture, string $titre = 'Poste'): int
    {
        return DB::table('offre')->insertGetId([
            'titre_poste' => $titre,
            'reference' => 'REF-' . $titre,
            'id_statut_offre' => $statut,
            'date_cloture' => $dateCloture,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_seules_les_offres_archivees_depuis_assez_longtemps_sont_supprimees(): void
    {
        $vieille = $this->offre($this->idCloturee, now()->subMonths(13)->toDateTimeString(), 'Vieille');
        $recente = $this->offre($this->idCloturee, now()->subMonths(2)->toDateTimeString(), 'Recente');
        $publiee = $this->offre($this->idPubliee, now()->subMonths(30)->toDateTimeString(), 'Publiee');

        $nb = app(ArchiveOffresService::class)->purger(false, 12);

        $this->assertSame(1, $nb);
        $this->assertNull(DB::table('offre')->where('id_offre', $vieille)->first());
        $this->assertNotNull(DB::table('offre')->where('id_offre', $recente)->first());
        $this->assertNotNull(DB::table('offre')->where('id_offre', $publiee)->first());
        $this->assertSame(1, DB::table('audit_log')->where('action', 'PURGE_OFFRE_ARCHIVEE')->count());
    }

    public function test_les_candidatures_de_l_offre_supprimee_sont_conservees_et_detachees(): void
    {
        $vieille = $this->offre($this->idCloturee, now()->subMonths(20)->toDateTimeString());
        $idCandidature = DB::table('candidature')->insertGetId([
            'id_offre' => $vieille, 'created_at' => now(), 'updated_at' => now(),
        ]);

        app(ArchiveOffresService::class)->purger(false, 12);

        $candidature = DB::table('candidature')->where('id_candidature', $idCandidature)->first();
        $this->assertNotNull($candidature);
        $this->assertNull($candidature->id_offre);
    }

    public function test_la_simulation_ne_supprime_rien(): void
    {
        $this->offre($this->idCloturee, now()->subMonths(20)->toDateTimeString());

        $nb = app(ArchiveOffresService::class)->purger(true, 12);

        $this->assertSame(1, $nb);
        $this->assertSame(1, DB::table('offre')->count());
    }

    public function test_la_commande_artisan_fonctionne(): void
    {
        $this->offre($this->idCloturee, now()->subMonths(20)->toDateTimeString());

        $this->artisan('offres:purger-archives', ['--mois' => 12])
            ->expectsOutputToContain('1 offre(s) archivée(s) supprimée(s).')
            ->assertSuccessful();

        $this->assertSame(0, DB::table('offre')->count());
    }

    public function test_une_offre_cloturee_ne_peut_plus_etre_modifiee_ni_cloturee_a_nouveau(): void
    {
        $id = $this->offre($this->idCloturee, now()->toDateTimeString());
        $offre = Offre::findOrFail($id);
        $service = app(OffreService::class);

        $this->assertTrue($service->estCloturee($offre));

        try {
            $service->update($offre, ['titre_poste' => 'Nouveau titre'], []);
            $this->fail('La modification aurait dû être refusée.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('offre', $e->errors());
        }

        $this->expectException(ValidationException::class);
        $service->close($offre);
    }
}
