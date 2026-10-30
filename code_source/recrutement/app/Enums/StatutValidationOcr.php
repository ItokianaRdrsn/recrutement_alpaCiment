<?php

namespace App\Enums;

enum StatutValidationOcr: string
{
    case EnAttente = 'en_attente';
    case Valide = 'valide';
    case Corrige = 'corrige';
    case Rejete = 'rejete';

    public function isApprouve(): bool
    {
        return in_array($this, [self::Valide, self::Corrige], true);
    }
}
