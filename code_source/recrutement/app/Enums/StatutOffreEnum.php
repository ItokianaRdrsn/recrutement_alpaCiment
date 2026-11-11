<?php

namespace App\Enums;

enum StatutOffreEnum: string
{
    case Brouillon = 'Brouillon';
    case Publiee = 'Publiee';
    case Cloturee = 'Cloturee';

    /**
     * @return list<string>
     */
    public function variations(): array
    {
        return match ($this) {
            self::Brouillon => ['Brouillon', 'brouillon'],
            self::Publiee => ['Publiée', 'Publiee', 'publiée', 'publiee', 'Active', 'Actif'],
            self::Cloturee => ['Clôturée', 'Cloturee', 'clôturée', 'cloturee', 'Clôturé', 'Cloture'],
        };
    }
}
