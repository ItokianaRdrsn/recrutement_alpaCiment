<?php

namespace App\Enums;

enum CanalDepot: string
{
    case SiteExterne = 'site_externe';
    case RhManuel = 'rh_manuel';
    case ImportExterne = 'import_externe';

    public function label(): string
    {
        return match ($this) {
            self::SiteExterne => 'Site externe / Portail public',
            self::RhManuel => 'Saisie manuelle RH',
            self::ImportExterne => 'Import automatique externe (n8n / Email)',
        };
    }
}
