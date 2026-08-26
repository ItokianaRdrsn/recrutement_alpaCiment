<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Back-office recrutement - AlpA Ciment</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body>
        <form id="logout-form" method="POST" action="{{ route('logout') }}" hidden>
            @csrf
        </form>

        <div id="recrutement-app"></div>
    </body>
</html>
