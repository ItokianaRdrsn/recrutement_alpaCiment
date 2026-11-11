<?php

namespace App\Enums;

enum StatutRendezVousEnum: int
{
    case AVenir = 1;
    case Realise = 2;
    case Annule = 3;

    public function label(): string
    {
        return match ($this) {
            self::AVenir => 'À venir',
            self::Realise => 'Réalisé',
            self::Annule => 'Annulé',
        };
    }
}
