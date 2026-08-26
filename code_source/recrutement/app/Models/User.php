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

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'role',
        'password',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
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
