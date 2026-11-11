<?php

namespace Tests\Feature\Api;

use App\Exceptions\DocumentStorageException;
use App\Models\AuditLog;
use App\Models\Candidat;
use App\Models\Candidature;
use App\Models\Document;
use App\Models\Offre;
use App\Models\StatutCandidature;
use App\Models\StatutOffre;
use App\Services\CandidatureService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CandidatureIntakeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('direction', function (Blueprint $table) {
            $table->id('id_direction');
            $table->string('nom_direction', 150);
            $table->timestamps();
        });

        Schema::create('domaine', function (Blueprint $table) {
            $table->id('id_domaine');
            $table->unsignedBigInteger('id_direction')->nullable();
            $table->string('nom_domaine', 150);
            $table->boolean('valide')->default(true);
            $table->timestamps();
        });

        Schema::create('statut_offre', function (Blueprint $table) {
            $table->id('id_statut_offre');
            $table->string('libelle', 100);
        });

        Schema::create('type_contrat', function (Blueprint $table) {
            $table->id('id_type_contrat');
            $table->string('libelle', 50);
        });

        Schema::create('offre', function (Blueprint $table) {
            $table->id('id_offre');
            $table->unsignedBigInteger('id_direction')->nullable();
            $table->unsignedBigInteger('id_statut_offre')->nullable();
            $table->unsignedBigInteger('id_type_contrat')->nullable();
            $table->string('titre_poste', 200);
            $table->string('slug', 200)->nullable();
            $table->timestamp('date_publication')->nullable();
            $table->timestamps();
        });

        Schema::create('type_demande', function (Blueprint $table) {
            $table->id('id_type_demande');
            $table->string('libelle', 50);
        });

        Schema::create('statut_candidature', function (Blueprint $table) {
            $table->id('id_statut_candidature');
            $table->string('libelle', 100);
            $table->integer('ordre_workflow')->default(10);
        });

        Schema::create('candidat', function (Blueprint $table) {
            $table->id('id_candidat');
            $table->string('nom', 150);
            $table->string('prenom', 150)->nullable();
            $table->string('email', 200)->unique();
            $table->string('telephone', 50)->nullable();
            $table->string('ville', 100)->nullable();
            $table->timestamps();
        });

        Schema::create('candidature', function (Blueprint $table) {
            $table->id('id_candidature');
            $table->unsignedBigInteger('id_candidat');
            $table->unsignedBigInteger('id_type_demande')->nullable();
            $table->unsignedBigInteger('id_offre')->nullable();
            $table->unsignedBigInteger('id_domaine')->nullable();
            $table->unsignedBigInteger('id_statut_candidature')->nullable();
            $table->boolean('dans_vivier')->default(false);
            $table->boolean('vue')->default(false);
            $table->string('poste_souhaite', 150)->nullable();
            $table->text('message')->nullable();
            $table->string('canal_depot', 50)->nullable();
            $table->unsignedBigInteger('id_utilisateur_depot')->nullable();
            $table->string('cle_idempotence', 255)->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('historique_statut', function (Blueprint $table) {
            $table->id('id_historique');
            $table->unsignedBigInteger('id_candidature');
            $table->unsignedBigInteger('id_statut_candidature');
            $table->timestamp('date_changement')->useCurrent();
            $table->text('commentaire')->nullable();
            $table->unsignedBigInteger('id_utilisateur')->nullable();
            $table->timestamps();
        });

        Schema::create('document', function (Blueprint $table) {
            $table->id('id_document');
            $table->unsignedBigInteger('id_candidature');
            $table->string('nom_fichier', 255);
            $table->string('chemin_fichier', 255);
            $table->string('type_document', 50);
            $table->integer('taille_octets')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->string('description', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('competence', function (Blueprint $table) {
            $table->id('id_competence');
            $table->string('nom_competence', 150)->unique();
            $table->unsignedBigInteger('id_type_competence')->default(1);
            $table->timestamps();
        });

        Schema::create('candidat_competence', function (Blueprint $table) {
            $table->unsignedBigInteger('id_candidature');
            $table->unsignedBigInteger('id_competence');
            $table->string('niveau', 30)->nullable();
            $table->string('source', 20)->default('manuel');
            $table->float('score_confiance')->nullable();
            $table->boolean('valide')->default(true);
            $table->primary(['id_candidature', 'id_competence']);
        });

        Schema::create('candidat_experience_professionnelle', function (Blueprint $table) {
            $table->id('id_experience');
            $table->unsignedBigInteger('id_candidature');
            $table->string('poste', 200);
            $table->string('entreprise', 200)->nullable();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->boolean('poste_actuel')->default(false);
            $table->text('description')->nullable();
            $table->string('source', 20)->default('manuel');
            $table->boolean('valide')->default(true);
            $table->timestamps();
        });

        Schema::create('candidat_formation', function (Blueprint $table) {
            $table->id('id_formation');
            $table->unsignedBigInteger('id_candidature');
            $table->string('diplome', 200);
            $table->string('etablissement', 200)->nullable();
            $table->string('domaine_etude', 150)->nullable();
            $table->string('niveau', 50)->nullable();
            $table->date('date_obtention')->nullable();
            $table->string('source', 20)->default('manuel');
            $table->boolean('valide')->default(true);
            $table->timestamps();
        });

        Schema::create('candidat_projet', function (Blueprint $table) {
            $table->id('id_projet');
            $table->unsignedBigInteger('id_candidature');
            $table->string('titre_projet', 200);
            $table->string('role', 150)->nullable();
            $table->string('technologies', 255)->nullable();
            $table->string('url_projet', 255)->nullable();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->text('description')->nullable();
            $table->string('source', 20)->default('manuel');
            $table->float('score_confiance')->nullable();
            $table->unsignedBigInteger('id_document')->nullable();
            $table->boolean('valide')->default(false);
            $table->timestamp('date_validation')->nullable();
            $table->unsignedBigInteger('valide_par')->nullable();
            $table->timestamps();
        });

        Schema::create('cv_extraction_ocr', function (Blueprint $table) {
            $table->id('id_extraction');
            $table->unsignedBigInteger('id_candidature');
            $table->text('texte_brut_ocr')->nullable();
            $table->json('donnees_json')->nullable();
            $table->string('statut_validation', 50)->default('en_attente');
            $table->text('commentaire_rh')->nullable();
            $table->timestamps();
        });

        Schema::create('type_message', function (Blueprint $table) {
            $table->id('id_type_message');
            $table->string('libelle', 100)->unique();
        });

        Schema::create('modele_message', function (Blueprint $table) {
            $table->id('id_modele_message');
            $table->unsignedBigInteger('id_type_message');
            $table->unsignedBigInteger('id_statut_candidature')->nullable();
            $table->string('nom_modele', 150);
            $table->string('objet', 255);
            $table->text('contenu');
            $table->boolean('envoi_automatique')->default(false);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        Schema::create('communication', function (Blueprint $table) {
            $table->id('id_communication');
            $table->unsignedBigInteger('id_candidature');
            $table->unsignedBigInteger('id_modele_message')->nullable();
            $table->unsignedBigInteger('id_type_message');
            $table->string('objet', 255);
            $table->text('contenu')->nullable();
            $table->string('mode_envoi', 10)->default('manuel');
            $table->timestamp('date_envoi')->useCurrent();
            $table->unsignedBigInteger('id_utilisateur')->nullable();
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
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('pipeline_metrics', function (Blueprint $table) {
            $table->id('id_metric');
            $table->string('cle_idempotence', 255)->nullable();
            $table->string('email_expediteur', 255)->nullable();
            $table->string('sujet_email', 255)->nullable();
            $table->string('intention', 50)->nullable();
            $table->unsignedBigInteger('id_offre')->nullable();
            $table->unsignedBigInteger('id_candidature')->nullable();
            $table->float('duree_classification_s')->default(0);
            $table->float('duree_ocr_s')->default(0);
            $table->float('duree_ner_s')->default(0);
            $table->float('duree_totale_s')->default(0);
            $table->integer('nb_caracteres_ocr')->default(0);
            $table->integer('nb_competences')->default(0);
            $table->integer('nb_experiences')->default(0);
            $table->integer('nb_projets')->default(0);
            $table->integer('nb_formations')->default(0);
            $table->string('statut', 30)->default('succes');
            $table->string('noeud_erreur', 150)->nullable();
            $table->text('message_erreur')->nullable();
            $table->timestamps();
        });

        DB::table('type_demande')->insert([
            ['id_type_demande' => 1, 'libelle' => 'Offre'],
            ['id_type_demande' => 2, 'libelle' => 'Spontanee'],
        ]);

        DB::table('statut_candidature')->insert([
            ['id_statut_candidature' => 1, 'libelle' => 'Reçue', 'ordre_workflow' => 10],
            ['id_statut_candidature' => 2, 'libelle' => 'Présélectionnée', 'ordre_workflow' => 20],
            ['id_statut_candidature' => 3, 'libelle' => 'Retenue', 'ordre_workflow' => 60],
        ]);

        DB::table('statut_offre')->insert([
            ['id_statut_offre' => 1, 'libelle' => 'Brouillon'],
            ['id_statut_offre' => 2, 'libelle' => 'Publiee'],
        ]);

        DB::table('type_message')->insert([
            ['id_type_message' => 1, 'libelle' => 'Accuse de reception'],
            ['id_type_message' => 6, 'libelle' => 'Autre'],
        ]);
    }

    public function test_rejet_cv_base64_corrompu_aucun_fichier_et_aucun_enregistrement(): void
    {
        Storage::fake('public');

        $payload = [
            'nom' => 'Corrupt',
            'prenom' => 'Base64',
            'email' => 'corrupt@alphaciment.local',
            'source' => 'n8n',
            'cv_base64' => 'NOT-VALID-BASE64-CORRUPT!@#$',
            'cv_nom' => 'corrupted.pdf',
        ];

        $response = $this->postJson('/api/public/import-candidature', $payload);

        // L'API doit lever une DocumentStorageException (erreur serveur 500)
        $this->assertTrue(in_array($response->status(), [422, 500], true));

        // ACID : Aucune candidature n'a été conservée en base
        $this->assertEquals(0, Candidature::count());

        // Sécurité : Aucun fichier orphelin n'a été créé sur le disque
        $this->assertEmpty(Storage::disk('public')->allFiles('documents/cv'));
    }

    public function test_rejet_fichier_non_autorise_script_php(): void
    {
        Storage::fake('public');

        $phpScript = "<?php echo 'vulnerability'; ?>";
        $payload = [
            'nom' => 'Hacker',
            'prenom' => 'Test',
            'email' => 'hacker@malicious.local',
            'source' => 'n8n',
            'cv_base64' => base64_encode($phpScript),
            'cv_nom' => 'exploit.php',
        ];

        $response = $this->postJson('/api/public/import-candidature', $payload);

        $this->assertTrue(in_array($response->status(), [422, 500], true));
        $this->assertEquals(0, Candidature::count());
        $this->assertEmpty(Storage::disk('public')->allFiles('documents/cv'));
    }

    public function test_acceptation_cv_pdf_valide_et_nom_uuid_genere(): void
    {
        Storage::fake('public');

        $validPdf = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF";
        $payload = [
            'nom' => 'Rakoto',
            'prenom' => 'Valide',
            'email' => 'rakoto.valide@alphaciment.local',
            'source' => 'n8n',
            'cv_base64' => base64_encode($validPdf),
            'cv_nom' => 'mon_cv_original.pdf',
        ];

        $response = $this->postJson('/api/public/import-candidature', $payload);
        $response->assertStatus(201);

        $candidatureId = $response->json('data.id_candidature');
        $this->assertNotNull($candidatureId);

        $doc = Document::where('id_candidature', $candidatureId)->where('type_document', 'CV')->first();
        $this->assertNotNull($doc);
        $this->assertEquals('mon_cv_original.pdf', $doc->nom_fichier);
        $this->assertStringStartsWith('documents/cv/', $doc->chemin_fichier);
        $this->assertStringEndsWith('.pdf', $doc->chemin_fichier);

        // Le fichier physique existe sur le disque
        Storage::disk('public')->assertExists($doc->chemin_fichier);
    }

    public function test_acceptation_cv_docx_valide(): void
    {
        Storage::fake('public');

        // Signature zip minimale PK\x03\x04
        $fakeDocx = "PK\x03\x04" . str_repeat("\x00", 30) . "[Content_Types].xml" . str_repeat("\x00", 50);
        $payload = [
            'nom' => 'Rabe',
            'prenom' => 'Docx',
            'email' => 'rabe.docx@alphaciment.local',
            'source' => 'n8n',
            'cv_base64' => base64_encode($fakeDocx),
            'cv_nom' => 'mon_cv.docx',
        ];

        $response = $this->postJson('/api/public/import-candidature', $payload);
        $response->assertStatus(201);

        $candidatureId = $response->json('data.id_candidature');
        $doc = Document::where('id_candidature', $candidatureId)->where('type_document', 'CV')->first();
        $this->assertNotNull($doc);
        $this->assertStringEndsWith('.docx', $doc->chemin_fichier);
        Storage::disk('public')->assertExists($doc->chemin_fichier);
    }

    public function test_candidature_sans_cv_est_acceptee_sans_erreur(): void
    {
        Storage::fake('public');

        $payload = [
            'nom' => 'Sans',
            'prenom' => 'Cv',
            'email' => 'sans.cv@alphaciment.local',
            'source' => 'n8n',
        ];

        $response = $this->postJson('/api/public/import-candidature', $payload);
        $response->assertStatus(201);

        $candidatureId = $response->json('data.id_candidature');
        $this->assertEquals(0, Document::where('id_candidature', $candidatureId)->where('type_document', 'CV')->count());
    }

    public function test_nettoyage_fichiers_si_echec_apres_stockage_document(): void
    {
        Storage::fake('public');

        $validPdf = "%PDF-1.4\n%%EOF";

        /** @var \App\Services\DocumentService $documentService */
        $documentService = app(\App\Services\DocumentService::class);

        // Simulation d'une écriture physique
        $path = 'documents/cv/temp_file.pdf';
        Storage::disk('public')->put($path, $validPdf);
        $this->assertNotEmpty(Storage::disk('public')->allFiles('documents/cv'));

        // Mécanisme de nettoyage appelé en cas de catch (\Throwable)
        $documentService->supprimerFichiers([$path]);

        // Vérifier que le disque public n'a plus aucun fichier orphelin
        $this->assertEmpty(Storage::disk('public')->allFiles('documents/cv'));
    }

    public function test_update_statut_workflow_et_verrou(): void
    {
        $candidat = Candidat::create([
            'nom' => 'Workflow',
            'prenom' => 'Tester',
            'email' => 'workflow@alphaciment.local',
        ]);

        $candidature = Candidature::create([
            'id_candidat' => $candidat->id_candidat,
            'id_statut_candidature' => 1, // Reçue (ordre 10)
            'dans_vivier' => false,
        ]);

        /** @var CandidatureService $service */
        $service = app(CandidatureService::class);

        // 1. Transition légitime vers ordre 20 (Présélectionnée)
        $updated = $service->updateStatut($candidature->id_candidature, 2, 'Entretien préliminaire', null);
        $this->assertEquals(2, $updated->id_statut_candidature);

        // 2. Tentative de transition vers le même statut -> refusé
        $this->expectException(ValidationException::class);
        $service->updateStatut($candidature->id_candidature, 2, 'Doublon', null);
    }

    public function test_update_statut_refuse_regression_workflow(): void
    {
        $candidat = Candidat::create([
            'nom' => 'Workflow',
            'prenom' => 'Regress',
            'email' => 'regress@alphaciment.local',
        ]);

        $candidature = Candidature::create([
            'id_candidat' => $candidat->id_candidat,
            'id_statut_candidature' => 2, // Présélectionnée (ordre 20)
            'dans_vivier' => false,
        ]);

        /** @var CandidatureService $service */
        $service = app(CandidatureService::class);

        // Tentative de revenir en arrière (ordre 10) -> refusé
        $this->expectException(ValidationException::class);
        $service->updateStatut($candidature->id_candidature, 1, 'Retour arrière interdit', null);
    }

    public function test_update_vivier_garde_fou_et_blocage_statut_retenue(): void
    {
        $candidat = Candidat::create([
            'nom' => 'Vivier',
            'prenom' => 'Tester',
            'email' => 'vivier@alphaciment.local',
        ]);

        $candidature = Candidature::create([
            'id_candidat' => $candidat->id_candidat,
            'id_statut_candidature' => 3, // Retenue
            'dans_vivier' => false,
        ]);

        /** @var CandidatureService $service */
        $service = app(CandidatureService::class);

        // 1. Candidature 'Retenue' ne peut pas être mise dans le vivier
        try {
            $service->updateVivierStatus($candidature->id_candidature, true);
            $this->fail("Aurait dû lever une ValidationException car la candidature est Retenue");
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('dans_vivier', $e->errors());
        }

        // 2. Garde-fou "valeur identique" : si déjà faux, basculer à faux ne doit pas ajouter de log d'audit
        $auditCountBefore = AuditLog::count();
        $service->updateVivierStatus($candidature->id_candidature, false);
        $this->assertEquals($auditCountBefore, AuditLog::count());
    }
}
