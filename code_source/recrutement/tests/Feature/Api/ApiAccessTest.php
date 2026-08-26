<?php

namespace Tests\Feature\Api;

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

        $this->actingAs($user)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.name', 'Responsable RH')
            ->assertJsonPath('data.email', 'rh@example.test')
            ->assertJsonPath('data.role', 'rh');
    }
}
