<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Offres - Recrutement AlpA Ciment</title>
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
                max-width: 1180px;
                padding: 28px;
            }

            nav {
                display: flex;
                gap: 14px;
                margin-top: 8px;
            }

            a {
                color: #1f4e78;
                font-weight: 700;
                text-decoration: none;
            }

            h1 {
                font-size: 24px;
                margin: 0;
            }

            .muted {
                color: #5b6770;
                margin: 6px 0 0;
            }

            .panel {
                background: #fff;
                border: 1px solid #d9e2ec;
                border-radius: 8px;
                margin-top: 20px;
                padding: 20px;
            }

            .filters {
                align-items: end;
                display: grid;
                gap: 14px;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            }

            label {
                color: #5b6770;
                display: block;
                font-size: 14px;
                font-weight: 700;
                margin-bottom: 8px;
            }

            select,
            button {
                border-radius: 6px;
                font: inherit;
                padding: 10px 12px;
                width: 100%;
            }

            select {
                background: #fff;
                border: 1px solid #d9e2ec;
            }

            button {
                background: #1f4e78;
                border: 0;
                color: #fff;
                cursor: pointer;
                font-weight: 700;
            }

            table {
                border-collapse: collapse;
                width: 100%;
            }

            th,
            td {
                border-bottom: 1px solid #e6edf4;
                padding: 12px;
                text-align: left;
                vertical-align: top;
            }

            th {
                color: #5b6770;
                font-size: 13px;
                text-transform: uppercase;
            }

            .status {
                background: #eaf3f8;
                border-radius: 999px;
                color: #1f4e78;
                display: inline-block;
                font-size: 13px;
                font-weight: 700;
                padding: 4px 9px;
            }

            .empty {
                color: #5b6770;
                padding: 28px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <header>
            <div>
                <h1>Offres d'emploi</h1>
                <p class="muted">Gestion des offres, directions et statuts.</p>
                <nav>
                    <a href="{{ route('dashboard') }}">Dashboard</a>
                    <a href="{{ route('offres.index') }}">Offres</a>
                </nav>
            </div>
            <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button type="submit">Deconnexion</button>
            </form>
        </header>

        <main>
            <section class="panel">
                <form class="filters" method="GET" action="{{ route('offres.index') }}">
                    <div>
                        <label for="direction">Direction</label>
                        <select id="direction" name="direction">
                            <option value="">Toutes les directions</option>
                            @foreach ($directions as $direction)
                                <option value="{{ $direction->id_direction }}" @selected(($filters['direction'] ?? null) == $direction->id_direction)>
                                    {{ $direction->nom_direction }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div>
                        <label for="statut">Statut</label>
                        <select id="statut" name="statut">
                            <option value="">Tous les statuts</option>
                            @foreach ($statuts as $statut)
                                <option value="{{ $statut->id_statut_offre }}" @selected(($filters['statut'] ?? null) == $statut->id_statut_offre)>
                                    {{ $statut->libelle }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div>
                        <button type="submit">Filtrer</button>
                    </div>
                </form>
            </section>

            <section class="panel">
                @if ($offres->isEmpty())
                    <div class="empty">Aucune offre ne correspond aux filtres.</div>
                @else
                    <table>
                        <thead>
                            <tr>
                                <th>Poste</th>
                                <th>Direction</th>
                                <th>Contrat</th>
                                <th>Publication</th>
                                <th>Limite</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($offres as $offre)
                                <tr>
                                    <td>
                                        <strong>{{ $offre->titre_poste }}</strong>
                                        @if ($offre->lieu)
                                            <div class="muted">{{ $offre->lieu }}</div>
                                        @endif
                                    </td>
                                    <td>{{ $offre->direction?->nom_direction }}</td>
                                    <td>{{ $offre->typeContrat?->libelle ?? '-' }}</td>
                                    <td>{{ $offre->date_publication?->format('d/m/Y') ?? '-' }}</td>
                                    <td>{{ $offre->date_limite?->format('d/m/Y') ?? '-' }}</td>
                                    <td><span class="status">{{ $offre->statut?->libelle }}</span></td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>

                    {{ $offres->links() }}
                @endif
            </section>
        </main>
    </body>
</html>
