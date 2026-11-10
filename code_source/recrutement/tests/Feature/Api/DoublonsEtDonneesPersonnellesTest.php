<?php

namespace Tests\Feature\Api;

use App\Models\AuditLog;
use App\Models\Candidat;
use App\Services\CandidatDoublonService;
use App\Services\DonneesPersonnellesService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use Tests\TestCase;

class DoublonsEtDonneesPersonnellesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('candidat', function (Blueprint $table) {
            $table->id('id_candidat');
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 200)->unique();
            $table->string('telephone', 30)->nullable();
            $table->text('adresse')->nullable();
            $table->date('date_naissance')->nullable();
            $table->timestamps();
        });

        Schema::create('statut_candidature', function (Blueprint $table) {
            $table->id('id_statut_candidature');
            $table->string('libelle', 100);
            $table->integer('ordre_workflow')->default(1);
        });

        Schema::create('candidature', function (Blueprint $table) {
            $table->id('id_candidature');
            $table->unsignedBigInteger('id_candidat');
            $table->unsignedBigInteger('id_statut_candidature')->nullable();
            $table->boolean('dans_vivier')->default(false);
            $table->timestamps();
        });

        Schema::create('document', function (Blueprint $table) {
            $table->id('id_document');
            $table->unsignedBigInteger('id_candidature');
            $table->string('chemin_fichier')->nullable();
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
    }

    private function candidat(string $nom, string $prenom, string $email, ?string $tel = null): Candidat
    {
        return Candidat::create(['nom' => $nom, 'prenom' => $prenom, 'email' => $email, 'telephone' => $tel]);
    }

    private function candidature(int $idCandidat, bool $vivier = false, ?string $date = null, ?int $statut = null): int
    {
        return DB::table('candidature')->insertGetId([
            'id_candidat' => $idCandidat,
            'id_statut_candidature' => $statut,
            'dans_vivier' => $vivier,
            'created_at' => $date ?? now(),
            'updated_at' => $date ?? now(),
        ]);
    }

    public function test_groupes_detecte_un_doublon_par_telephone_normalise(): void
    {
        $this->candidat('Rakoto', 'Jean', 'jean@mail.com', '034 12 345 67');
        $this->candidat('Rakoto', 'J.', 'autre@mail.com', '+261 34 12 345 67');
        $this->candidat('Andria', 'Lova', 'lova@mail.com', '032 00 000 00');

        $groupes = app(CandidatDoublonService::class)->groupes();

        $parTelephone = array_values(array_filter($groupes, fn ($g) => $g['critere'] === 'telephone'));
        $this->assertCount(1, $parTelephone);
        $this->assertSame('forte', $parTelephone[0]['confiance']);
        $this->assertCount(2, $parTelephone[0]['candidats']);
    }

    public function test_fusionner_deplace_les_candidatures_et_supprime_le_doublon(): void
    {
        $principal = $this->candidat('Rakoto', 'Jean', 'jean@mail.com');
        $doublon = $this->candidat('Rakoto', 'Jean', 'jean2@mail.com', '0341234567');
        $this->candidature($principal->id_candidat);
        $this->candidature($doublon->id_candidat);

        $resultat = app(CandidatDoublonService::class)->fusionner($principal->id_candidat, $doublon->id_candidat);

        $this->assertNull(Candidat::find($doublon->id_candidat));
        $this->assertSame(2, DB::table('candidature')->where('id_candidat', $principal->id_candidat)->count());
        $this->assertSame('0341234567', $resultat->telephone); // champ vide complété
        $this->assertSame(1, AuditLog::where('action', 'FUSION')->count());
    }

    public function test_fusionner_un_candidat_avec_lui_meme_est_refuse(): void
    {
        $c = $this->candidat('Rakoto', 'Jean', 'jean@mail.com');

        $this->expectException(InvalidArgumentException::class);
        app(CandidatDoublonService::class)->fusionner($c->id_candidat, $c->id_candidat);
    }

    public function test_effacer_supprime_le_candidat_ses_fichiers_et_n_ecrit_aucune_donnee_perso_dans_l_audit(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('documents/cv/cv.pdf', 'contenu');

        $c = $this->candidat('Rakoto', 'Jean', 'jean.secret@mail.com');
        $idCand = $this->candidature($c->id_candidat);
        DB::table('document')->insert([
            'id_candidature' => $idCand,
            'chemin_fichier' => 'documents/cv/cv.pdf',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        app(DonneesPersonnellesService::class)->effacerCandidat($c->id_candidat);

        $this->assertNull(Candidat::find($c->id_candidat));
        Storage::disk('public')->assertMissing('documents/cv/cv.pdf');

        $log = AuditLog::where('action', 'EFFACEMENT')->firstOrFail();
        $this->assertStringNotContainsString('jean.secret@mail.com', json_encode($log->toArray()));
    }

    public function test_purge_vivier_cible_uniquement_les_anciens_non_retenus(): void
    {
        $retenue = DB::table('statut_candidature')->insertGetId(['libelle' => 'Retenue', 'ordre_workflow' => 5]);
        $recue = DB::table('statut_candidature')->insertGetId(['libelle' => 'Reçue', 'ordre_workflow' => 1]);
        $vieux = now()->subMonths(30)->toDateTimeString();

        $ancien = $this->candidat('Ancien', 'Vivier', 'ancien@mail.com');
        $this->candidature($ancien->id_candidat, true, $vieux, $recue);

        $recent = $this->candidat('Recent', 'Vivier', 'recent@mail.com');
        $this->candidature($recent->id_candidat, true, now()->subMonths(2)->toDateTimeString(), $recue);

        $retenu = $this->candidat('Retenu', 'Ancien', 'retenu@mail.com');
        $this->candidature($retenu->id_candidat, true, $vieux, $retenue);

        $horsVivier = $this->candidat('Hors', 'Vivier', 'hors@mail.com');
        $this->candidature($horsVivier->id_candidat, false, $vieux, $recue);

        $service = app(DonneesPersonnellesService::class);

        $this->assertSame([$ancien->id_candidat], $service->candidatsAPurger(24));
        $this->assertSame(1, $service->purgerVivier(true, 24)); // simulation : rien n'est effacé
        $this->assertNotNull(Candidat::find($ancien->id_candidat));

        $this->assertSame(1, $service->purgerVivier(false, 24));
        $this->assertNull(Candidat::find($ancien->id_candidat));
        $this->assertNotNull(Candidat::find($retenu->id_candidat));
    }
}
