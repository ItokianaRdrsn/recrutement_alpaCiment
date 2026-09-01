<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class SessionController extends Controller
{
    public function create(): View|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return view('auth.login');
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->boolean('remember');

        if (! Auth::attempt($credentials, $remember)) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Les identifiants sont incorrects.',
                    'errors' => [
                        'email' => ['Les identifiants sont incorrects.'],
                    ],
                ], 422);
            }
            return back()
                ->withErrors(['email' => 'Les identifiants sont incorrects.'])
                ->onlyInput('email');
        }

        $request->session()->regenerate();

        $request->session()->forget('url.intended');

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Connexion réussie',
                'data' => Auth::user(),
            ]);
        }

        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');

        return redirect()->to($frontendUrl ? $frontendUrl.'/dashboard' : route('dashboard'));
    }

    public function destroy(Request $request): JsonResponse|RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Déconnexion réussie']);
        }

        return redirect()->route('login');
    }
}
