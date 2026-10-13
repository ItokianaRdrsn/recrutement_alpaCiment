<?php

namespace Tests\Feature\Api;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditLogService;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    protected User $rhUser;

    protected function setUp(): void
    {
        parent::setUp();

        \Illuminate\Support\Facades\Schema::create('audit_log', function (\Illuminate\Database\Schema\Blueprint $table) {
            $table->id('id_audit_log');
            $table->unsignedBigInteger('id_utilisateur')->nullable();
            $table->string('action', 50);
            $table->string('entite', 100);
            $table->unsignedBigInteger('id_entite')->nullable();
            $table->string('description', 255)->nullable();
            $table->json('anciennes_valeurs')->nullable();
            $table->json('nouvelles_valeurs')->nullable();
            $table->string('ip_adresse', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });

        $this->rhUser = User::factory()->rh()->make([
            'id' => 1,
            'name' => 'Agent RH Test',
            'email' => 'rh.test@alpaciment.mg',
        ]);
    }

    public function test_audit_log_service_creates_records(): void
    {
        $service = new AuditLogService();

        $log = $service->log(
            action: 'CREATION_OFFRE',
            entite: 'Offre',
            idEntite: 42,
            description: 'Création offre test',
            anciennesValeurs: null,
            nouvellesValeurs: ['titre' => 'Ingénieur Test'],
            idUtilisateur: 1
        );

        $this->assertInstanceOf(AuditLog::class, $log);
        $this->assertEquals('CREATION_OFFRE', $log->action);
        $this->assertEquals('Offre', $log->entite);
        $this->assertEquals(42, $log->id_entite);
        $this->assertEquals('Création offre test', $log->description);
    }
}
