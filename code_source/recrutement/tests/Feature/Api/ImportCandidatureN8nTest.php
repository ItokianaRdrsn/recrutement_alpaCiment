<?php

namespace Tests\Feature\Api;

use App\Models\Candidat;
use App\Models\CandidatProjet;
use App\Models\Candidature;
use App\Models\Communication;
use App\Models\ModeleMessage;
use App\Models\StatutCandidature;
use App\Models\TypeMessage;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ImportCandidatureN8nTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Création des tables requises en mémoire SQLite
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

        DB::table('type_demande')->insert([
            ['id_type_demande' => 1, 'libelle' => 'Offre'],
            ['id_type_demande' => 2, 'libelle' => 'Spontanee'],
        ]);

        DB::table('statut_candidature')->insert([
            ['id_statut_candidature' => 1, 'libelle' => 'Reçue', 'ordre_workflow' => 10],
            ['id_statut_candidature' => 2, 'libelle' => 'Présélectionnée', 'ordre_workflow' => 20],
        ]);

        DB::table('type_message')->insert([
            ['id_type_message' => 1, 'libelle' => 'Accuse de reception'],
            ['id_type_message' => 6, 'libelle' => 'Autre'],
        ]);
    }

    public function test_import_candidature_spontanee_avec_projets_et_communication(): void
    {
        $payload = [
            'nom' => 'Rakoto',
            'prenom' => 'Jean',
            'email' => 'rakoto.jean.test@alpaciment.local',
            'telephone' => '+261340000001',
            'ville' => 'Antananarivo',
            'id_offre' => null, // Spontanée
            'source' => 'email / n8n',
            'sujet_email' => 'Candidature Spontanée Développeur Web',
            'corps_email' => 'Bonjour, je souhaite postuler pour rejoindre AlpA Ciment.',
            'texte_brut_ocr' => 'Texte brut CV OCR',
            'donnees_json' => [
                'competences' => [
                    ['nom' => 'Laravel', 'niveau' => 'Avancé'],
                    ['nom' => 'React', 'niveau' => 'Avancé']
                ],
                'experiences' => [
                    [
                        'poste' => 'Développeur Fullstack',
                        'entreprise' => 'Entreprise Test',
                        'date_debut' => '2023-01-01',
                        'date_fin' => '2024-01-01',
                        'description' => 'Missions de développement'
                    ]
                ],
                'projets' => [
                    [
                        'titre_projet' => 'AlpA Logistics App',
                        'role' => 'Lead Dev',
                        'technologies' => 'React, PostgreSQL',
                        'url_projet' => 'https://github.com/test/logistics',
                        'date_debut' => '2022-05-01',
                        'date_fin' => '2022-11-01',
                        'description' => 'Projet de fin d\'études'
                    ]
                ],
                'formations' => [
                    [
                        'diplome' => 'Licence Informatique',
                        'etablissement' => 'Université Test',
                        'annee_obtention' => '2022'
                    ]
                ]
            ]
        ];

        $response = $this->postJson('/api/public/import-candidature', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $candidatureId = $response->json('data.id_candidature');
        $this->assertNotNull($candidatureId);

        // 1. Vérification candidature créée et en vivier (car spontanée sans id_offre)
        $candidature = Candidature::findOrFail($candidatureId);
        $this->assertTrue($candidature->dans_vivier);
        $this->assertNull($candidature->id_offre);

        // 2. Vérification projet créé
        $this->assertDatabaseHas('candidat_projet', [
            'id_candidature' => $candidatureId,
            'titre_projet' => 'AlpA Logistics App',
            'role' => 'Lead Dev',
        ]);

        // 3. Vérification archivage communication de l'email reçu
        $this->assertDatabaseHas('communication', [
            'id_candidature' => $candidatureId,
            'objet' => 'Candidature Spontanée Développeur Web',
            'mode_envoi' => 'auto',
        ]);
    }
}
