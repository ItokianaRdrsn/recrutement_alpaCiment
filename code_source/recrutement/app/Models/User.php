<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $table = 'utilisateur';
    protected $primaryKey = 'id_utilisateur';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'nom',
        'email',
        'role',
        'mot_de_passe',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'mot_de_passe',
        'remember_token',
    ];

    public function getAuthPasswordName(): string
    {
        return 'mot_de_passe';
    }

    public function roleEnum(): ?UserRole
    {
        return UserRole::tryFrom((string) $this->role);
    }

    public function hasRole(string|UserRole ...$roles): bool
    {
        $acceptedRoles = array_map(
            fn (string|UserRole $role): string => $role instanceof UserRole ? $role->value : $role,
            $roles
        );

        return in_array((string) $this->role, $acceptedRoles, true);
    }

    public function canPerform(string $permission): bool
    {
        return $this->roleEnum()?->allows($permission) ?? false;
    }

    /**
     * @return list<string>
     */
    public function permissions(): array
    {
        return $this->roleEnum()?->permissions() ?? [];
    }
}
