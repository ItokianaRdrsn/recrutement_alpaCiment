<?php

namespace Tests\Unit;

use App\Support\CandidatNormalizer;
use PHPUnit\Framework\TestCase;

class CandidatNormalizerTest extends TestCase
{
    public function test_telephone_malgache_formats_equivalents(): void
    {
        $attendu = '0341234567';
        foreach (['034 12 345 67', '+261 34 12 345 67', '00261341234567', '261341234567', '341234567', '034-12-345-67'] as $saisie) {
            $this->assertSame($attendu, CandidatNormalizer::telephone($saisie), $saisie);
        }
    }

    public function test_telephone_trop_court_ou_vide_donne_null(): void
    {
        $this->assertNull(CandidatNormalizer::telephone(''));
        $this->assertNull(CandidatNormalizer::telephone(null));
        $this->assertNull(CandidatNormalizer::telephone('12345'));
    }

    public function test_email_gmail_ignore_points_et_tag(): void
    {
        $this->assertSame('teddyr@gmail.com', CandidatNormalizer::email(' Teddy.R+cv@Gmail.com '));
        $this->assertSame('teddyr@gmail.com', CandidatNormalizer::email('teddyr@googlemail.com'));
    }

    public function test_email_autre_domaine_garde_les_points(): void
    {
        $this->assertSame('t.rakoto@alpha-ciment.mg', CandidatNormalizer::email('T.Rakoto@Alpha-Ciment.mg'));
        $this->assertNull(CandidatNormalizer::email('pas-un-email'));
    }

    public function test_nom_complet_insensible_aux_accents_et_a_l_ordre(): void
    {
        $this->assertSame(
            CandidatNormalizer::nomComplet('RAKOTO', 'Hélène'),
            CandidatNormalizer::nomComplet('helene', 'rakoto')
        );
        $this->assertNull(CandidatNormalizer::nomComplet('Rakoto', ''));
    }
}
