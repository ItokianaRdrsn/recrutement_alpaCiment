<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class SessionController extends Controller
{
    public function create(): View|RedirectResponse
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');

        if (Auth::check()) {
            return redirect()->to($frontendUrl ? $frontendUrl.'/dashboard' : route('dashboard'));
        }

        if ($frontendUrl) {
            return redirect()->away($frontendUrl . '/login');
        }

        return view('auth.login');
    }

    public function store(LoginRequest $request): JsonResponse|RedirectResponse
    {
        $credentials = [
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
        ];
        $remember = (bool) $request->validated('remember', false);

        if (! Auth::attempt($credentials, $remember)) {
            if ($request->wantsJson() || $request->is('api/*')) {
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

        if ($request->hasSession()) {
            $request->session()->regenerate();
            $request->session()->forget('url.intended');
        }

        if ($request->wantsJson() || $request->is('api/*')) {
            $user = Auth::user();
            $expiresAt = now()->addHours(8);
            $token = $user->createToken('auth-token', ['*'], $expiresAt)->plainTextToken;

            return response()->json([
                'message' => 'Connexion réussie',
                'data' => [
                    'id' => $user->id_utilisateur ?? $user->id,
                    'name' => $user->nom ?? $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'role_label' => $user->roleEnum()?->label(),
                    'permissions' => $user->permissions(),
                    'token' => $token,
                    'expires_at' => $expiresAt->toIso8601String(),
                ],
            ]);
        }

        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
        return redirect()->to($frontendUrl ? $frontendUrl.'/dashboard' : route('dashboard'));
    }

    public function destroy(Request $request): JsonResponse|RedirectResponse
    {
        if ($request->wantsJson() || $request->is('api/*')) {
            $user = $request->user();
            if ($user && method_exists($user, 'currentAccessToken')) {
                $token = $user->currentAccessToken();
                if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) {
                    $token->delete();
                }
            }

            if (Auth::guard('web')->check()) {
                Auth::guard('web')->logout();
            }

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return response()->json([
                'message' => 'Déconnexion réussie',
            ]);
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
        return redirect()->to($frontendUrl ? $frontendUrl.'/login' : route('login'));
    }
}
