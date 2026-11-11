<?php

namespace Tests\Feature\Api;

use App\Models\Competence;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CompetenceReferentielTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('competence', function (Blueprint $table) {
            $table->id('id_competence');
            $table->string('nom_competence', 150)->unique();
            $table->unsignedBigInteger('id_type_competence')->default(1);
        });
    }

    public function test_trouver_ou_creer_ignore_la_casse_et_les_espaces(): void
    {
        $python = Competence::trouverOuCreer('Python', ['id_type_competence' => 1]);

        $this->assertSame($python->id_competence, Competence::trouverOuCreer('python')->id_competence);
        $this->assertSame($python->id_competence, Competence::trouverOuCreer('  PYTHON ')->id_competence);
        $this->assertSame(1, Competence::count());
    }

    public function test_trouver_ou_creer_cree_une_nouvelle_competence_et_garde_le_nom_saisi(): void
    {
        $nouvelle = Competence::trouverOuCreer('Soudure TIG', ['id_type_competence' => 1]);

        $this->assertSame('Soudure TIG', $nouvelle->nom_competence);
        $this->assertSame(1, Competence::count());
    }

    public function test_trouver_ou_creer_reconnait_une_variante_proche(): void
    {
        $node = Competence::trouverOuCreer('Node.js', ['id_type_competence' => 1]);

        $this->assertSame($node->id_competence, Competence::trouverOuCreer('NodeJS')->id_competence);
        $this->assertSame(1, Competence::count());
    }

    public function test_endpoint_rapprocher_indique_les_competences_existantes_sans_rien_creer(): void
    {
        Competence::trouverOuCreer('Python');
        Competence::trouverOuCreer('Électromécanique');

        $response = $this->postJson('/api/public/competences/rapprocher', [
            'noms' => ['python', 'electromecanique', 'Soudure TIG'],
        ]);

        $response->assertOk();
        $lignes = collect($response->json('data'))->keyBy('recherche');

        $this->assertTrue($lignes['python']['existe']);
        $this->assertSame('Python', $lignes['python']['competence']);
        $this->assertSame('Électromécanique', $lignes['electromecanique']['competence']);
        $this->assertFalse($lignes['Soudure TIG']['existe']);
        $this->assertNull($lignes['Soudure TIG']['competence']);
        $this->assertSame(2, Competence::count()); // la recherche ne crée jamais de compétence
    }

    public function test_endpoint_rapprocher_refuse_une_liste_vide(): void
    {
        $this->postJson('/api/public/competences/rapprocher', ['noms' => []])->assertStatus(422);
    }
}
