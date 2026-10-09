<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $emailSubject }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 24px 12px;
            color: #1e293b;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header {
            background-color: #0f172a;
            color: #ffffff;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            letter-spacing: 0.5px;
            color: #ffffff;
        }
        .header p {
            margin: 6px 0 0 0;
            font-size: 13px;
            color: #94a3b8;
        }
        .body {
            padding: 32px 28px;
            line-height: 1.65;
            font-size: 15px;
            color: #334155;
            white-space: pre-line;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .footer a {
            color: #2563eb;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AlpA Ciment</h1>
            <p>Direction des Ressources Humaines</p>
        </div>
        <div class="body">
{{ $emailContent }}
        </div>
        <div class="footer">
            <p>Cet email vous a été adressé par la plateforme de recrutement d'AlpA Ciment.<br>
            Merci de ne pas modifier les mentions de référence lors de vos réponses.</p>
            <p>© {{ date('Y') }} AlpA Ciment - Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
