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

        $request->session()->regenerate();
        $request->session()->forget('url.intended');

        if ($request->wantsJson() || $request->is('api/*')) {
            $user = Auth::user();
            return response()->json([
                'message' => 'Connexion réussie',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'role_label' => $user->roleEnum()?->label(),
                    'permissions' => $user->permissions(),
                ],
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

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Déconnexion réussie',
            ]);
        }

        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
        return redirect()->to($frontendUrl ? $frontendUrl.'/login' : route('login'));
    }
}
