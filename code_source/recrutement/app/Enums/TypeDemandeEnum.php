<?php

namespace App\Enums;

enum TypeDemandeEnum: string
{
    case Offre = 'Offre';
    case Spontanee = 'Spontanee';

    public function label(): string
    {
        return match ($this) {
            self::Offre => 'Candidature sur offre',
            self::Spontanee => 'Candidature spontanée',
        };
    }
}
