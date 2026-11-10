<?php

namespace Tests\Feature\Api;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadDocumentCandidatureTest extends TestCase
{
    private const PDF = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n";

    protected int $idCandidature;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        Schema::create('utilisateur', function (Blueprint $table) {
            $table->id('id_utilisateur');
            $table->string('nom', 100);
            $table->string('email', 150)->unique();
            $table->string('role', 30)->default('rh');
            $table->string('mot_de_passe', 255);
            $table->timestamps();
        });

        Schema::create('candidature', function (Blueprint $table) {
            $table->id('id_candidature');
            $table->unsignedBigInteger('id_candidat')->nullable();
            $table->boolean('dans_vivier')->default(false);
            $table->timestamps();
        });

        Schema::create('document', function (Blueprint $table) {
            $table->id('id_document');
            $table->unsignedBigInteger('id_candidature');
            $table->string('type_document', 50)->default('CV');
            $table->string('nom_fichier', 255);
            $table->text('chemin_fichier');
            $table->string('mime_type', 100)->nullable();
            $table->bigInteger('taille_octets')->nullable();
            $table->string('mode_acquisition', 20)->default('fichier');
            $table->text('contenu_texte_extrait')->nullable();
            $table->text('description')->nullable();
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

        $this->idCandidature = DB::table('candidature')->insertGetId([
            'id_candidat' => 1, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->actingAs(User::create([
            'nom' => 'RH Test',
            'email' => 'rh.upload@alphaciment.mg',
            'role' => 'rh',
            'mot_de_passe' => bcrypt('secret123'),
        ]));
    }

    public function test_rh_peut_ajouter_une_lettre_de_motivation_a_une_candidature(): void
    {
        $response = $this->post("/api/candidature/{$this->idCandidature}/documents", [
            'fichier' => UploadedFile::fake()->createWithContent('lettre.pdf', self::PDF),
            'type_document' => 'Autre',
            'description' => 'Lettre de motivation',
        ], ['Accept' => 'application/json']);

        $response->assertCreated();

        $doc = DB::table('document')->where('id_candidature', $this->idCandidature)->first();
        $this->assertNotNull($doc);
        $this->assertSame('Autre', $doc->type_document);
        $this->assertSame('Lettre de motivation', $doc->description);
        $this->assertSame('lettre.pdf', $doc->nom_fichier);
        $this->assertStringStartsWith('documents/annexes/', $doc->chemin_fichier);
        Storage::disk('public')->assertExists($doc->chemin_fichier);

        $this->assertSame(1, AuditLog::where('action', 'AJOUT_DOCUMENT')->count());
    }

    public function test_un_cv_va_dans_le_dossier_cv(): void
    {
        $this->post("/api/candidature/{$this->idCandidature}/documents", [
            'fichier' => UploadedFile::fake()->createWithContent('cv-a-jour.pdf', self::PDF),
            'type_document' => 'CV',
        ], ['Accept' => 'application/json'])->assertCreated();

        $chemin = DB::table('document')->value('chemin_fichier');
        $this->assertStringStartsWith('documents/cv/', $chemin);
    }

    public function test_un_fichier_non_autorise_est_refuse_et_rien_n_est_enregistre(): void
    {
        $response = $this->post("/api/candidature/{$this->idCandidature}/documents", [
            'fichier' => UploadedFile::fake()->createWithContent('script.pdf', "<?php echo 'x';"),
            'type_document' => 'Autre',
        ], ['Accept' => 'application/json']);

        $response->assertStatus(422);
        $this->assertSame(0, DB::table('document')->count());
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_fichier_et_type_obligatoires(): void
    {
        $this->postJson("/api/candidature/{$this->idCandidature}/documents", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['fichier', 'type_document']);
    }

    public function test_candidature_inconnue_renvoie_404(): void
    {
        $this->post('/api/candidature/99999/documents', [
            'fichier' => UploadedFile::fake()->createWithContent('lettre.pdf', self::PDF),
            'type_document' => 'Autre',
        ], ['Accept' => 'application/json'])->assertNotFound();
    }
}
