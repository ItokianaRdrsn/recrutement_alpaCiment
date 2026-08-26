<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\User;
use Tests\TestCase;

class ApiAccessTest extends TestCase
{
    public function test_api_requires_authentication(): void
    {
        $this->getJson('/api/me')
            ->assertUnauthorized();
    }

    public function test_api_rejects_users_without_rh_or_admin_role(): void
    {
        $user = User::factory()->make([
            'id' => 1,
            'role' => 'manager',
        ]);

        $this->actingAs($user)
            ->getJson('/api/me')
            ->assertForbidden();
    }

    public function test_api_returns_authenticated_user_context(): void
    {
        $user = User::factory()->make([
            'id' => 1,
            'name' => 'Responsable RH',
            'email' => 'rh@example.test',
            'role' => 'rh',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.name', 'Responsable RH')
            ->assertJsonPath('data.email', 'rh@example.test')
            ->assertJsonPath('data.role', UserRole::Rh->value)
            ->assertJsonPath('data.role_label', 'Responsable RH');

        $this->assertContains('access_backoffice', $response->json('data.permissions'));
        $this->assertContains('view_dashboard', $response->json('data.permissions'));
    }

    public function test_roles_referential_contains_available_roles(): void
    {
        $roles = UserRole::toReferentiel();

        $this->assertContains([
            'code' => UserRole::Admin->value,
            'label' => 'Administrateur',
            'permissions' => UserRole::Admin->permissions(),
        ], $roles);
        $this->assertContains([
            'code' => UserRole::Rh->value,
            'label' => 'Responsable RH',
            'permissions' => UserRole::Rh->permissions(),
        ], $roles);
    }
}
