<?php

namespace Tests\Feature\BackOffice;

use App\Enums\UserRole;
use App\Models\User;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    public function test_rh_user_can_access_dashboard_redirect_to_react_frontend(): void
    {
        config(['app.frontend_url' => 'http://127.0.0.1:5173']);

        $user = User::factory()->rh()->make([
            'id' => 1,
        ]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertRedirect('http://127.0.0.1:5173/dashboard');
    }

    public function test_admin_user_can_access_offers_redirect_to_react_frontend(): void
    {
        config(['app.frontend_url' => 'http://127.0.0.1:5173']);

        $user = User::factory()->admin()->make([
            'id' => 1,
        ]);

        $this->actingAs($user)
            ->get('/offres')
            ->assertRedirect('http://127.0.0.1:5173/offres');
    }

    public function test_user_without_backoffice_role_is_forbidden(): void
    {
        $user = User::factory()->make([
            'id' => 1,
            'role' => 'manager',
        ]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertForbidden();
    }

    public function test_role_enum_defines_expected_permissions(): void
    {
        $this->assertTrue(UserRole::Admin->allows('manage_users'));
        $this->assertTrue(UserRole::Rh->allows('manage_offres'));
        $this->assertFalse(UserRole::Rh->allows('manage_users'));
    }
}
