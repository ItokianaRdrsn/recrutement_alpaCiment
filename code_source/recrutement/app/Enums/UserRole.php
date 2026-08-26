<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Rh = 'rh';

    /**
     * @return list<string>
     */
    public static function backOfficeValues(): array
    {
        return [
            self::Admin->value,
            self::Rh->value,
        ];
    }

    /**
     * @return list<array{code: string, label: string, permissions: list<string>}>
     */
    public static function toReferentiel(): array
    {
        return array_map(fn (self $role): array => [
            'code' => $role->value,
            'label' => $role->label(),
            'permissions' => $role->permissions(),
        ], self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrateur',
            self::Rh => 'Responsable RH',
        };
    }

    /**
     * @return list<string>
     */
    public function permissions(): array
    {
        return match ($this) {
            self::Admin => [
                'access_backoffice',
                'view_dashboard',
                'view_offres',
                'manage_offres',
                'manage_referentiels',
                'manage_users',
            ],
            self::Rh => [
                'access_backoffice',
                'view_dashboard',
                'view_offres',
                'manage_offres',
            ],
        };
    }

    public function allows(string $permission): bool
    {
        return in_array($permission, $this->permissions(), true);
    }
}
