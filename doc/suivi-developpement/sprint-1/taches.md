# Sprint 1 - Tâches

## Avancement

- **[FAIT]** 4 tâches
- **[EN COURS]** 3 tâches
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

### **[EN COURS]** Mise en place des migrations principales et des seeders

- **Estimation :** 1,5 j
- **Notes :** Premières migrations et seeders créés pour utilisateurs, directions, statuts, domaines, types de contrat, offres, profil d'offre avec valeurs génériques et formations liées aux offres. Les autres modules viendront ensuite.

---

### **[FAIT]** Mise en place de l'architecture API REST

- **Estimation :** 1,0 j
- **Notes :** Routes API ajoutées pour `/api/me`, `/api/dashboard`, `/api/referentiels/recrutement`, `/api/offres` et `/api/offres/{id}`. Contrôleurs API, resource JSON et conventions de réponse créés.

---

### **[EN COURS]** Authentification et gestion des rôles RH / admin

- **Estimation :** 2,0 j
- **Notes :** Connexion de base créée. Middleware `role:rh,admin` ajouté pour protéger le back-office et l'API interne. Il reste à finaliser les permissions plus fines selon les futurs écrans.

---

## Front-office / Interface

### **[FAIT]** Installation de React avec Vite et structure de navigation

- **Estimation :** 1,0 j
- **Notes :** Dépendances React installées, plugin React ajouté à Vite, point d'entrée `resources/js/app.jsx` créé, navigation dashboard/offres disponible.

---

### **[FAIT]** Intégration de la mise en page générale du back-office

- **Estimation :** 1,0 j
- **Notes :** Première mise en page React créée avec sidebar, barre supérieure, cartes KPI, filtres, tableau des offres et pagination. La mise en page pourra être enrichie au fur et à mesure des modules.

---

### **[EN COURS]** Tests et debug

- **Estimation :** 0,5 j
- **Notes :** Tests Laravel OK : login, dashboard, offres protégées et accès API par rôle. `php artisan test` passe avec 7 tests. `npm run build` passe également. Les tests du sprint complet restent à faire après les permissions finales.

---

## Total

**Sprint 1 : 8,0 j**
