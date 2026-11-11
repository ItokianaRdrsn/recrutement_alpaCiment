<?php

namespace Tests;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $this->traitsUsedByTest = class_uses_recursive(static::class);

        $app->make(Kernel::class)->bootstrap();

        return $app;
    }

    public function actingAs(Authenticatable $user, $guard = null)
    {
        if ($guard === null) {
            Sanctum::actingAs($user, ['*']);
            return parent::actingAs($user, 'web');
        }

        if ($guard === 'sanctum') {
            return Sanctum::actingAs($user, ['*']);
        }

        return parent::actingAs($user, $guard);
    }
}
