<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;

class OffreController extends Controller
{
    public function index(): RedirectResponse
    {
        return redirect()->away($this->frontendUrl('/offres'));
    }

    private function frontendUrl(string $path): string
    {
        return rtrim((string) config('app.frontend_url'), '/').$path;
    }
}
