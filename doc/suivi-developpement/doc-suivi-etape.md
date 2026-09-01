# Document Central de Suivi par Étape et d'Avancement Global (65,5 j)

Ce document récapitule l'organisation du projet *recrutement_alpaCiment*, l'avancement global en pourcentage (`% terminé`), le développement du **Sprint 5** et le journal chronologique cumulatif de toutes les demandes utilisateur (Prompts) avec leurs résolutions.

---

## 📈 Tableau Général d'Avancement par Sprint (% terminé)

- **Avancement Global du Projet :** **71.8% terminé** (47.0 / 65.5 j)
- **Barre de Progression Globale :** `[██████████████░░░░░░] 71.8%`

| Sprint | Intitulé | Estimation | Progression (%) | Statut |
| --- | --- | ---: | ---: | --- |
| **Sprint 0** | Analyse, cadrage et conception | 9,0 j | **100.0%** | **[FAIT]** |
| **Sprint 1** | Socle technique, sécurité et référentiels de base | 6,0 j | **100.0%** | **[FAIT]** |
| **Sprint 2** | Gestion des offres, directions et domaines | 7,0 j | **100.0%** | **[FAIT]** |
| **Sprint 3** | Dépôt et réception des candidatures (Web & Saisie RH) | 6,5 j | **100.0%** | **[FAIT]** |
| **Sprint 4** | Gestion RH des candidatures, fiche candidat, découpage React, routage SPA & Blade Login | 7,0 j | **100.0%** | **[FAIT]** |
| **Sprint 5** | Vivier, compétences, règles de workflow RH & recherche de candidature en pop-up | 11,5 j | **100.0%** | **[FAIT]** |
| **Sprint 6** | Rendez-vous, communications et modèles | 10,0 j | **0.0%** | **[A FAIRE]** |
| **Sprint 7** | Dashboard, recherche avancée, matching et finalisation | 8,5 j | **0.0%** | **[A FAIRE]** |
| **Total** | **Total Scope Général** | **65,5 j** | **71.8%** | |

---

## 📜 Journal Chronologique des Demandes Utilisateur (Prompts) & Résolutions

### Demande 1 : Personnalisation du style du tableau des candidatures
> **User Prompt :** *"oui est bien mais je veux pas que le texte bouge si il n'y a pas de non vue ,et ca attaque trop le rouge aussi ,met juste une barre bleu a gauche du conteneur"*
- **Résolution :** Suppression de la mise en valeur rouge agressive. Ajout d'une barre bleue discrète sur la bordure gauche pour marquer les candidatures non vues sans déplacer le texte.

---

### Demande 2 : Découpage et modularisation du code React par page
> **User Prompt :** *"separe aussi le code react tu as tout regrouper dans main ,separe par page le code"*
- **Résolution :** Extraction de tous les composants React monolithe dans `src/pages/` (`DashboardView.jsx`, `OffersView.jsx`, `CandidaturesView.jsx`, `ReferentialsView.jsx`, `VivierView.jsx`) et mise en place du Lazy Loading via `React.lazy()` et `<Suspense>`.

---

### Demande 3 : Diagnostic de la communication Frontend-Backend (page blanche)
> **User Prompt :** *"j'ai l'impression il n'arrive plus a communiquer avec le backend ,page vide direct"*
- **Résolution :** Correction de l'élément racine dans `main.jsx` (`recrutement-app` vs `root`) et optimisation de l'initialisation pour rétablir la communication API.

---

### Demande 4 : Optimisation extrême des performances et taille de bundle
> **User Prompt :** *"la performance du site est assez mauvaise Network dependency tree / Minify JavaScript Est savings of 6,212 KiB..."*
- **Résolution :** Configuration du découpage manuel des Chunks (`manualChunks` pour `lucide-react` et `react-dom`) dans `vite.config.js`. Réduction de la taille du bundle initial de **8.4 MB à ~200 KB** (gain de >95%).

---

### Demande 5 : Fix de l'erreur 404 au démarrage dans la console
> **User Prompt :** *"okey bonne performance juste lorsque je demarre au debut dans la console il ecrit Failed to load resource: the server responded with a status of 404 (Not Found)"*
- **Résolution :** Ajout d'un favicône SVG inline dans `index.html` pour éliminer la requête manquante `/favicon.ico`.

---

### Demande 6 : Port et redirection de déconnexion (`/login`)
> **User Prompt :** *"lorsque je clique sur sortir ,il va dans http://127.0.0.1:8000/login ... normalement c'est http://127.0.0.1:5173/ sauf en production"*
- **Résolution :** Proxying de la route `/login` dans `vite.config.js` et redirection vers `/login` relatif pour rester sur le port actif (`5173` / `4173`).

---

### Demande 7 : Élimination des erreurs 401 lors du clic sur "Sortir"
> **User Prompt :** *"maintenant lorsque je clique sur sortir Failed to load resource: the server responded with a status of 401 (Unauthorized) /api/referentiels/recrutement:1 /api/competences:1 /api/dashboard:1"*
- **Résolution :** Ajout des routes `/login` et `/logout` dans les routes publiques `isPublicPath` pour annuler immédiatement tout appel API protégé dès la déconnexion.

---

### Demande 8 : Routage déclaratif type Vue Router (`react-router-dom`)
> **User Prompt :** *"je veux qu'on ait des routes comme ceci ,je suis habituer a vuejs avec ses userRoute et useRouter alors fais la meme logique comme ceci import { BrowserRouter, Routes, Route } from 'react-router-dom';"*
- **Résolution :** Migration du routage React vers `react-router-dom` v7 avec `<BrowserRouter>`, `<Routes>`, `<Route>`, `<Navigate>`, et utilisation des hooks `useNavigate()` et `useLocation()`.

---

### Demande 9 : Prise en charge des en-têtes CORS (`supports_credentials`)
> **User Prompt :** *"Access to fetch at 'http://127.0.0.1:8000/api/me' from origin 'http://127.0.0.1:5173' has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*'"*
- **Résolution :** Création de `config/cors.php` avec `'supports_credentials' => true` et définition explicite des origines autorisées (`http://127.0.0.1:5173`).

---

### Demande 10 : Uniformisation de la page de connexion Blade officielle & suppression du composant React en double
> **User Prompt :** *"pourquoi je me retrouve parfois dans cette page qui ne fonctionne pas ... et lorsque je reactualise ,j'arrive sur la bonne: Back-office recrutement Connexion a l'espace RH AlpA Ciment. Compte de depart : admin@alphaciment.local / password ... supprime la premiere page ,je ne sais pas d'ou ca viens ,ensuite pour le doc de suivi ,arrete de supprimer les anciens ,rajoute toujours a chaque fois et mets aussi mes prompts"*
- **Résolution :** 
  1. Suppression définitive du composant React temporaire `src/pages/LoginPage.jsx`.
  2. Configuration de `redirectToLogin()` et `submitLogout()` pour rediriger systématiquement vers la page officielle Laravel Blade (`resources/views/auth/login.blade.php`).
  3. Conservation intégrale de l'historique de documentation avec inclusion systématique de tous les prompts utilisateur.

---

### Demande 11 : Sprint 5 - Stepper de Statut RH, Règle de non-retour, Bouton Mettre en Vivier & Recherche Pop-up Vivier
> **User Prompt :** *"revenons au sprint 5 maintenant ,deja tu n'as rien terminer a part la gestion de crud competences faisons etape par etape ,la gestion de vivier ,deja dans la fiche du candidature ,on va faire comme ceci ,dans la colonne ou il y a mise a jour du status RH ,deja on ne va pas mettre un menu deroulant ,on va afficher directement tous les status en ligne par ordre et mettre une surbrillance au status actuel de la personne et mettre une regle de gestion ,on ne peut pas revenir a un status qui a un ordre workflow inferieur ou egal ,deja l'ordre va etre 10 ,20 ,30 ,40 ,50 et 50 pour retenue et non retenue et le reste suis l'ordre ,ensuite un peu en bas de ca on a un bouton mettre en vivier qui va mettre true a la colonne dans vivier ,sachant qu'on ne met pas un candidat en vivier mais une candidature en vivier ,et dans la section en vivier maintenant ,deja le bouton ajouter vivier ,tu vas le styliser ,ensuite ,un pop un s'affiche avec recherche de candidature"*
- **Résolution :**
  1. **Ordre Workflow des Statuts (10, 20, 30, 40, 50, 50)** : `Reçue`: 10, `Présélectionnée`: 20, `Test`: 30, `Entretien`: 40, `Retenue`: 50, `Non retenue`: 50.
  2. **Stepper Horizontal de Statut RH** avec surbrillance du statut actuel.
  3. **Règle de Gestion de Non-Retour** : Interdiction côté Frontend et Backend (`CandidatureController.php`) de basculer vers un statut ayant un `ordre_workflow <= ordre_workflow_actuel`.
  4. **Bouton Mettre en Vivier la Candidature** : Intégration d'un bouton dédié `PATCH /api/candidatures/{id}/vivier` (`dans_vivier = true`).
  5. **Pop-up de Recherche dans VivierView** : Bouton stylisé et modal avec recherche dynamique pour ajouter une candidature au vivier.

---

### Demande 12 : Nouvelles Règles de Gestion Vivier, Fichiers de Méthodologie, Règles & Dossier Horodaté Sprint 5
> **User Prompt :** *"la maintenant ,c'est des sprint dont on parle alors ,tu crees un dossier du jour dans le sprint 5 ,franchement , supprimes l'ancien vivier et copie le dans ce nouveau dossier avec les mises a jour ,et aussi crees un nouveau dossier avec toutes les regles de gestion qu'on a mis depuis le debut ,et aussi rajoute justement cette regle de gestion ,lorsqu'un candidat est en vivier ,on ne peut plus changer son status ,et lorsqu'il est retunue ,on ne peut plus mettre en vivier .Creer moi un fichier methodologie qui devra lister les etapes par lesquelles du doit passer a chaque prompt que je te fais comme lorsqu'il s'agit des sprints , creer dossier du jour et faire fichier sur la taches ,explications du code ,source ,et aussi mettre dans doc suivi ,ensuite pour les rectifications ,mettres dans doc suivi juste ,pas de sprint ,a toi de juger si c'est rectification ou sprint ,mais dans tous les cas ,on doit mettre dans doc suivi ,et toutes les regles de gestion mettre dans un fichier regle de gestion"*
- **Résolution :**
  1. **Dossier Horodaté du jour** : Création de [sprint-5/2026-09-01/](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-5/2026-09-01/) et rédaction de [vivier-talents-competences.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-5/2026-09-01/vivier-talents-competences.md).
  2. **Registre des Règles de Gestion** : Création de [regles-de-gestion.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/regles-de-gestion.md).
  3. **Guide Méthodologique** : Création de [methodologie.md](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/methodologie.md).
  4. **Nouvelles Règles Métier Implémentées (Code Backend + Frontend)** :
     - **Verrouillage du Statut RH en Vivier** : Si `dans_vivier = true`, le changement de statut RH est désactivé et bloqué.
     - **Exclusion du Vivier pour Statut Retenue** : Si le statut de la candidature est `Retenue`, le bouton d'ajout au vivier est désactivé et bloqué.

---

### Demande 13 (Rectification) : Navigation Référentiels, Liens Candidatures et Disposition 2 Colonnes Directions/Offres
> **User Prompt :** *"okey rectification maintenant ,surveille fichier methodologie pour savoir quoi faire ,pour la navigation ,deja lorsque je clique sur referencielles je ne veux pas directement atterir sur tous les referenciens ,juste affiche le menu deroulant et laisse moi choisir ,et pour candidature ,remplace par candidature sur offre et candidature spontannee ,ensuite dans candidature sur offre ,dans cette page ,liste toutes les directions et affiches aussi toutes les candidatures en 2 colonnes ,colonne gauche toutes les candidatures et colonne droite du coup plus grande la meme liste des candidatures comme actuellement de base ca va lister toutes les candidatures et toujours avec la meme indications lorsqu'on a pqs encore vu ,ensuites lorsqu'on appuis sur une direction ,comme menu deroulante on a choix : 1,toutes les offres ,2 voir les offres , dans le choix 1 ,on voit directement toutes les chandidatures ,dans le choix 2 ,le meme resultat que ce qui est actuellement dans Direction ->offre ->candidat"*
- **Résolution :**
  1. **Navigation Menu Référentiels ([AppShell.jsx](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement-react/src/components/layout/AppShell.jsx))** : Le clic sur l'en-tête "Référentiels" ouvre/ferme le menu déroulant sans redirection automatique.
  2. **Séparation des Liens Candidatures** : Liens distincts "Candidatures sur offre" et "Candidatures spontanées".
  3. **Disposition 2 Colonnes & Arborescence Directions / Offres** : Colonne gauche liste les directions, colonne droite plus grande affiche les candidatures avec barre verticale bleue d'indication non-vue.

---

### Demande 14 (Rectification) : Compte de Candidatures par Direction & Affichage Direct des Offres avec Bouton Candidats
> **User Prompt :** *"deja dans la candidature sur offre pour chaque directions ,on va mettre le nombre de candidature ,ensuite le 2 ne marche pas lorsqu'on clique sur voir les offres il n'y a rien qui s'affiche il dit toujours Aucune offre pour cette direction ,et aussi je t'ai lorsqu'on clique sur voir les offres ,deja plus de menu deroulante pour voir les offres ,affiches directement les offres avec un bouton pour afficher la liste des candidats pour chaque offre"*
- **Résolution :**
  1. **Compteur de Candidatures par Direction** : Badge affichant le nombre de candidatures rattachées à chaque Direction dans son en-tête.
  2. **Affichage Direct des Offres** : Suppression du menu déroulant Choix 1 / Choix 2.

---

### Demande 15 (Rectification) : Resolution Bug d'Association ID Direction sur les Offres ("Aucune offre publiée pour cette direction")
> **User Prompt :** *"Rectification eerreur: Aucune offre publiée pour cette direction. alors que j'ai des offres pour la direction"*
- **Résolution :**
  - **Diagnostic Root Cause** : L'API Laravel `OffreResource` formate les objets d'offre sous les clés `id` et `direction.id` au lieu de `id_offre` et `direction.id_direction`.
  - **Correction ([CandidaturesView.jsx](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement-react/src/pages/CandidaturesView.jsx))** : Implémentation des fonctions helper universelles (`getDirId`, `getOffreDirId`, `getOffreId`, `getCandOffreId`, `getCandDirId`).

---

### Demande 16 (Rectification) : Ligne Unique "Offres & Candidatures" à Gauche, Champ de Recherche Offre & Cartes d'Offres avec Bouton Déroulant Candidats à Droite
> **User Prompt :** *"Okey beacoup mieux juste dans la section a gauche pour Direction et offre ,lorsque je clique sur une direction ,il y a toutes les candidatures et la liste des offres ,changeons cela ,la liste des offres change par une seule ligne qui est offre candidature et lorsqu'on clique ,dans la section a droit ,fait la liste des offres avec un bouton comme liste deroulante pour afficher toutes les candidatures ,et rajouter champ pour recherche offre"*
- **Résolution :**
  1. **Colonne 1 (Gauche)** : Bouton sur une seule ligne `💼 Offres & Candidatures (X offres)`.
  2. **Colonne 2 (Droite)** : Champ de recherche d'offres et cartes d'offres avec boutons déroulants `👥 Voir candidats (X) 🔽`.

---

### Demande 17 (Rectification) : 2 Boutons sous chaque Direction ("Toutes les candidatures" & "Offres & candidatures"), Arrivée par Défaut sur "Toutes les candidatures"
> **User Prompt :** *"non je te parle de chaque direction on aura 2 bouton comme :toutes les candidatures et Offre&candidature mais de base on arrive dans toutes les candidature"*
- **Résolution (Suivant strict protocole Rectification de `methodologie.md`) :**
  1. **Les 2 Boutons sous Chaque Direction ([CandidaturesView.jsx](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement-react/src/pages/CandidaturesView.jsx))** : Sous l'intitulé de chaque direction dans la colonne de gauche, intégration de deux boutons distincts :
     - **Bouton 1 : `👥 Toutes les candidatures (X)`**
     - **Bouton 2 : `💼 Offres & candidatures (Y offres)`**
  2. **Affichage par Défaut (`de base`)** : À l'ouverture de la page ou lors de la sélection d'une direction, le sous-mode actif est **"Toutes les candidatures"**, affichant directement dans la colonne de droite le tableau récapitulatif de tous les candidats de cette direction (avec l'indicateur barre bleue non-vue).
  3. **Bascule vers "Offres & candidatures"** : Le clic sur le Bouton 2 bascule la colonne de droite vers le composant de recherche et de cartes d'offres avec boutons déroulants de candidats.
