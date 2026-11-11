<?php

namespace App\Enums;

enum StatutCandidatureEnum: string
{
    case Recue = 'Recue';
    case Preselectionnee = 'Preselectionnee';
    case Test = 'Test';
    case Entretien = 'Entretien';
    case Retenue = 'Retenue';
    case NonRetenue = 'Non retenue';

    /**
     * @return list<string>
     */
    public function variations(): array
    {
        return match ($this) {
            self::Recue => ['Reçue', 'Recue', 'reçue', 'recue'],
            self::Preselectionnee => ['Présélectionnée', 'Preselectionnee', 'présélectionnée', 'preselectionnee'],
            self::Test => ['Test', 'test'],
            self::Entretien => ['Entretien', 'entretien'],
            self::Retenue => ['Retenue', 'Retenu', 'retenue', 'retenu'],
            self::NonRetenue => ['Non retenue', 'Non retenu', 'non retenue', 'non retenu'],
        };
    }

    public function matches(string $libelle): bool
    {
        $normalized = mb_strtolower(trim($libelle));
        foreach ($this->variations() as $variant) {
            if (mb_strtolower(trim($variant)) === $normalized) {
                return true;
            }
        }
        return false;
    }
}
