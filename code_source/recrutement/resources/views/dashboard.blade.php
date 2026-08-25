<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Dashboard - Recrutement AlpA Ciment</title>
        <style>
            body {
                background: #f5f7fa;
                color: #1f2933;
                font-family: Arial, sans-serif;
                margin: 0;
            }

            header {
                align-items: center;
                background: #fff;
                border-bottom: 1px solid #d9e2ec;
                display: flex;
                justify-content: space-between;
                padding: 18px 28px;
            }

            main {
                margin: 0 auto;
                max-width: 1100px;
                padding: 28px;
            }

            h1 {
                font-size: 24px;
                margin: 0;
            }

            .muted {
                color: #5b6770;
                margin: 6px 0 0;
            }

            .grid {
                display: grid;
                gap: 16px;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                margin-top: 24px;
            }

            .card {
                background: #fff;
                border: 1px solid #d9e2ec;
                border-radius: 8px;
                padding: 20px;
            }

            .card span {
                color: #5b6770;
                display: block;
                font-size: 14px;
                margin-bottom: 8px;
            }

            .card strong {
                color: #1f4e78;
                font-size: 30px;
            }

            button {
                background: #1f4e78;
                border: 0;
                border-radius: 6px;
                color: #fff;
                cursor: pointer;
                font: inherit;
                font-weight: 700;
                padding: 10px 14px;
            }

            a {
                color: #1f4e78;
                font-weight: 700;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <header>
            <div>
                <h1>Dashboard recrutement</h1>
                <p class="muted">Connecte : {{ auth()->user()->name }} - role {{ auth()->user()->role }}</p>
            </div>
            <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button type="submit">Deconnexion</button>
            </form>
        </header>

        <main>
            <p class="muted">
                Socle de session pret. Les prochains modules viendront se brancher ici :
                offres, candidatures, vivier, rendez-vous et communications.
            </p>
            <p><a href="{{ route('offres.index') }}">Voir les offres</a></p>

            <section class="grid">
                <article class="card">
                    <span>Candidatures sur offre</span>
                    <strong>{{ $kpis['candidatures_sur_offre'] }}</strong>
                </article>
                <article class="card">
                    <span>Offres en cours</span>
                    <strong>{{ $kpis['offres_en_cours'] }}</strong>
                </article>
                <article class="card">
                    <span>Candidatures spontanees</span>
                    <strong>{{ $kpis['candidatures_spontanees'] }}</strong>
                </article>
            </section>
        </main>
    </body>
</html>
