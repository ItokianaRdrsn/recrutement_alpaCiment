# Sprint 1 - Tâches

## Avancement

- **[FAIT]** 7 tâches
- **[EN COURS]** 0 tâche
- **[A FAIRE]** 0 tâche

## Légende

- **[FAIT]** : tâche terminée et utilisable.
- **[EN COURS]** : tâche commencée, mais pas encore totalement terminée.
- **[A FAIRE]** : tâche prévue, non commencée.

---

## Back-office / API

### **[FAIT]** Configuration du projet Laravel et de l'environnement PostgreSQL

- **Estimation :** 1,0 j
- **Notes :** Laravel démarre, PostgreSQL répond, `.env` configuré.

---

### **[FAIT]** Mise en place des migrations principales et des seeders

- **Estimation :** 1,5 j
- **Notes :** Migrations principales créées et exécutées : utilisateurs, directions, statuts, domaines, types de contrat, offres, profil d'offre avec valeurs génériques et formations liées aux offres. `DatabaseSeeder` prépare les référentiels et données de départ. `php artisan migrate:status` confirme que les 7 migrations sont exécutées.

---

### **[FAIT]** Mise en place de l'architecture API REST

- **Estimation :** 1,0 j
- **Notes :** Routes API ajoutées pour `/api/csrf-token`, `/api/me`, `/api/dashboard`, `/api/referentiels/recrutement`, `/api/offres` et `/api/offres/{id}`. Contrôleurs API, resource JSON et conventions de réponse créés.

---

### **[FAIT]** Authentification et gestion des rôles RH / admin

- **Estimation :** 2,0 j
- **Notes :** Connexion de base créée. Les rôles `admin` et `rh` sont centralisés dans `UserRole`, le middleware `role` protège le back-office et l'API interne, et l'endpoint `/api/me` expose les permissions utiles au frontend.

---

## Front-office / Interface

### **[FAIT]** Installation de React avec Vite et structure de navigation

- **Estimation :** 1,0 j
- **Notes :** React/Vite est séparé de Laravel dans `code_source/recrutement-react`. Le point d'entrée est `src/main.jsx`, avec navigation dashboard/offres disponible.

---

### **[FAIT]** Intégration de la mise en page générale du back-office

- **Estimation :** 1,0 j
- **Notes :** Première mise en page React créée dans le projet frontend séparé, avec sidebar, barre supérieure, cartes KPI, filtres, tableau des offres et pagination. La mise en page pourra être enrichie au fur et à mesure des modules.

---

### **[FAIT]** Tests et debug

- **Estimation :** 0,5 j
- **Notes :** Tests Laravel OK : login, dashboard, offres protégées, accès API par rôle, permissions et garde de chargement des offres récentes. `php artisan test` passe avec 14 tests. `npm run build` passe dans le projet React séparé.

---

## Total

**Sprint 1 : 8,0 j**
