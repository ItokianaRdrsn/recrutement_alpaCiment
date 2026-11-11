<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\User;
use Tests\TestCase;

class ApiAccessTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! \Illuminate\Support\Facades\Schema::hasTable('utilisateur')) {
            \Illuminate\Support\Facades\Schema::create('utilisateur', function ($table) {
                $table->id('id_utilisateur');
                $table->string('nom', 100);
                $table->string('email', 150)->unique();
                $table->string('role', 30)->default('admin');
                $table->string('mot_de_passe', 255);
                $table->timestamps();
            });
        }

        if (! \Illuminate\Support\Facades\Schema::hasTable('personal_access_tokens')) {
            \Illuminate\Support\Facades\Schema::create('personal_access_tokens', function ($table) {
                $table->id();
                $table->morphs('tokenable');
                $table->text('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable()->index();
                $table->timestamps();
            });
        }
    }

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

    public function test_login_returns_sanctum_bearer_token(): void
    {
        $user = User::create([
            'nom' => 'Admin Test',
            'email' => 'admin_test_sanctum@alphaciment.local',
            'mot_de_passe' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => UserRole::Admin->value,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Connexion réussie')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                    'role',
                    'role_label',
                    'permissions',
                    'token',
                ],
            ]);

        $token = $response->json('data.token');
        $this->assertNotEmpty($token);

        // Ensure test environment tests stateless bearer tokens without cached session
        $this->app['auth']->forgetGuards();
        $this->flushSession();

        // Access protected API using Bearer token
        $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me')
            ->assertOk();

        $this->assertEquals($user->email, $meResponse->json('data.email'));

        // Logout revokes the token
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout')
            ->assertOk();

        $this->app['auth']->forgetGuards();

        // After revocation, token should be invalid
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me')
            ->assertUnauthorized();
    }

    public function test_login_rate_limiting_throttles_excessive_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'email' => 'hacker@example.test',
                'password' => 'wrong-pass',
            ]);
        }

        // The 6th request within the same minute should be throttled
        $response = $this->postJson('/api/login', [
            'email' => 'hacker@example.test',
            'password' => 'wrong-pass',
        ]);

        $response->assertStatus(429);
    }

    public function test_expired_token_is_rejected(): void
    {
        $user = User::query()->where('email', 'admin_test_sanctum@alphaciment.local')->first();
        if (! $user) {
            $user = User::create([
                'nom' => 'Admin Test Expiration',
                'email' => 'admin_test_expiration@alphaciment.local',
                'mot_de_passe' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => UserRole::Admin->value,
            ]);
        }

        // Create an expired token (expires_at in the past)
        $expiredToken = $user->createToken('expired-token', ['*'], now()->subMinutes(5))->plainTextToken;

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$expiredToken}")
            ->getJson('/api/me')
            ->assertUnauthorized();
    }
}
