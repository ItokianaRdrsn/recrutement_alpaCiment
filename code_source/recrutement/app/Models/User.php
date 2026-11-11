<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

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

    public function setPasswordAttribute($value): void
    {
        $this->attributes['mot_de_passe'] = $value;
    }

    public function setNameAttribute($value): void
    {
        $this->attributes['nom'] = $value;
    }

    public function getNameAttribute(): ?string
    {
        return $this->attributes['nom'] ?? $this->attributes['name'] ?? null;
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
