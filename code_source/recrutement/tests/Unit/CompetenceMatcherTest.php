<?php

namespace Tests\Unit;

use App\Support\CompetenceMatcher;
use PHPUnit\Framework\TestCase;

class CompetenceMatcherTest extends TestCase
{
    private function index(): array
    {
        return CompetenceMatcher::indexer([
            'Python', 'Node.js', 'Gestion de projet', 'Électromécanique', 'Photoshop', 'SQL', 'Java', 'Python 3', 'Langue : Français',
        ]);
    }

    public function test_exact_ignore_casse_accents_et_espaces(): void
    {
        $this->assertSame(['nom' => 'Python', 'methode' => 'exact'], CompetenceMatcher::trouver('  PYTHON ', $this->index()));
        $this->assertSame(['nom' => 'Électromécanique', 'methode' => 'exact'], CompetenceMatcher::trouver('electromecanique', $this->index()));
        $this->assertSame(['nom' => 'Langue : Français', 'methode' => 'exact'], CompetenceMatcher::trouver('langue : francais', $this->index()));
    }

    public function test_compact_ignore_la_ponctuation_et_les_espaces(): void
    {
        $this->assertSame(['nom' => 'Node.js', 'methode' => 'compact'], CompetenceMatcher::trouver('Node JS', $this->index()));
        $this->assertSame(['nom' => 'Node.js', 'methode' => 'compact'], CompetenceMatcher::trouver('nodejs', $this->index()));
    }

    public function test_approx_reconnait_pluriel_et_faute_de_frappe(): void
    {
        $this->assertSame(['nom' => 'Gestion de projet', 'methode' => 'approx'], CompetenceMatcher::trouver('Gestion de projets', $this->index()));
        $this->assertSame(['nom' => 'Photoshop', 'methode' => 'approx'], CompetenceMatcher::trouver('Photoshopp', $this->index()));
        $this->assertSame(['nom' => 'Python', 'methode' => 'approx'], CompetenceMatcher::trouver('Pyhton', $this->index()));
    }

    public function test_pas_de_faux_rapprochement(): void
    {
        $index = $this->index();

        $this->assertNull(CompetenceMatcher::trouver('JavaScript', $index));   // != Java
        $this->assertNull(CompetenceMatcher::trouver('MySQL', $index));         // != SQL
        $this->assertNull(CompetenceMatcher::trouver('Soudure TIG', $index));   // inconnue
        $this->assertNull(CompetenceMatcher::trouver('', $index));
    }

    public function test_les_chiffres_distinguent_deux_competences(): void
    {
        $index = CompetenceMatcher::indexer(['Python 2']);

        $this->assertNull(CompetenceMatcher::trouver('Python 3', $index));
    }
}
