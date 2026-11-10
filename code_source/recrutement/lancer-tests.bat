@echo off
cd /d "%~dp0"
echo Lancement des tests Laravel (patientez)...
php artisan test > resultat-tests.txt 2>&1
echo.
echo Termine. Resultat enregistre dans resultat-tests.txt
echo Vous pouvez fermer cette fenetre et dire a Claude : "c est fait".
pause
