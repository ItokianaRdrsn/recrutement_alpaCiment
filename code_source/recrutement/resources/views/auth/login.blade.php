<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Connexion - Recrutement AlpA Ciment</title>
        <style>
            :root {
                color-scheme: light;
                font-family: Arial, sans-serif;
                --bg: #f5f7fa;
                --panel: #ffffff;
                --text: #1f2933;
                --muted: #5b6770;
                --brand: #1f4e78;
                --brand-dark: #173b5c;
                --border: #d9e2ec;
                --danger: #b42318;
            }

            * {
                box-sizing: border-box;
            }

            body {
                align-items: center;
                background: var(--bg);
                color: var(--text);
                display: flex;
                margin: 0;
                min-height: 100vh;
                padding: 24px;
            }

            main {
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 8px;
                box-shadow: 0 18px 50px rgba(31, 78, 120, 0.12);
                margin: 0 auto;
                max-width: 420px;
                padding: 32px;
                width: 100%;
            }

            h1 {
                font-size: 26px;
                line-height: 1.2;
                margin: 0 0 8px;
            }

            p {
                color: var(--muted);
                margin: 0 0 24px;
            }

            label {
                display: block;
                font-weight: 700;
                margin: 18px 0 8px;
            }

            input[type="email"],
            input[type="password"] {
                border: 1px solid var(--border);
                border-radius: 6px;
                font: inherit;
                padding: 12px;
                width: 100%;
            }

            .row {
                align-items: center;
                display: flex;
                gap: 8px;
                margin: 16px 0 24px;
            }

            .row label {
                font-weight: 400;
                margin: 0;
            }

            button {
                background: var(--brand);
                border: 0;
                border-radius: 6px;
                color: #fff;
                cursor: pointer;
                font: inherit;
                font-weight: 700;
                padding: 12px 16px;
                width: 100%;
            }

            button:hover {
                background: var(--brand-dark);
            }

            .error {
                color: var(--danger);
                font-size: 14px;
                margin-top: 8px;
            }

            .hint {
                background: #f3f6fa;
                border: 1px solid var(--border);
                border-radius: 6px;
                color: var(--muted);
                font-size: 14px;
                margin-top: 20px;
                padding: 12px;
            }
        </style>
    </head>
    <body>
        <main>
            <h1>Back-office recrutement</h1>
            <p>Connexion a l'espace RH AlpA Ciment.</p>

            <form method="POST" action="{{ route('login.store') }}">
                @csrf

                <label for="email">Email</label>
                <input id="email" name="email" type="email" value="{{ old('email') }}" required autofocus>
                @error('email')
                    <div class="error">{{ $message }}</div>
                @enderror

                <label for="password">Mot de passe</label>
                <input id="password" name="password" type="password" required>
                @error('password')
                    <div class="error">{{ $message }}</div>
                @enderror

                <div class="row">
                    <input id="remember" name="remember" type="checkbox" value="1">
                    <label for="remember">Se souvenir de moi</label>
                </div>

                <button type="submit">Se connecter</button>
            </form>

            <div class="hint">
                Compte de depart : admin@alphaciment.local / password
            </div>
        </main>
    </body>
</html>
