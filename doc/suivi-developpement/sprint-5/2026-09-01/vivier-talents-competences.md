# Documentation Sprint 5 - Gestion du Vivier RH, Stepper de Statut & Règles de Gestion (2026-09-01)

## 📌 Objectifs du Sprint 5
Le Sprint 5 couvre l'organisation et la conservation des candidatures qualifiées dans le vivier RH, le suivi des parcours de compétences et l'application des règles de gestion des transitions de statut RH.

---

## 🛠️ Fonctionnalités Implémentées & Fichiers Sources

### 1. Stepper de Statut RH & Ordre Workflow (10, 20, 30, 40, 50, 50)
- **Code Source Backend :** [DatabaseSeeder.php](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement/database/seeders/DatabaseSeeder.php), [CandidatureController.php](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement/app/Http/Controllers/Api/CandidatureController.php)
- **Code Source Frontend :** [CandidatureDetailView.jsx](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement-react/src/pages/CandidatureDetailView.jsx)
- **Explications du code :**
  - Remplacement du menu déroulant `<select>` par des boutons en ligne horizontaux affichant l'ordre exact du workflow : `Reçue` (10), `Présélectionnée` (20), `Test` (30), `Entretien` (40), `Retenue` (50), `Non retenue` (50).
  - Mise en surbrillance du statut actuel.
  - **Règle de non-retour :** Blocage automatique si l'ordre du statut visé est `<= ordre_workflow_actuel`.

### 2. Gestion de la Candidature en Vivier (`dans_vivier`)
- **Code Source Backend :** [CandidatureController.php](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement/app/Http/Controllers/Api/CandidatureController.php) (`updateVivierStatus`)
- **Code Source Frontend :** [CandidatureDetailView.jsx](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement-react/src/pages/CandidatureDetailView.jsx)
- **Explications du code :**
  - Un bouton dédié sous les statuts RH permet de basculer la colonne `dans_vivier` de la candidature à `true` ou `false`.
  - **Règle de verrouillage :** Lorsqu'une candidature est en vivier (`dans_vivier = true`), son statut RH est verrouillé (`on ne peut plus changer son statut`).
  - **Règle d'exclusion :** Une candidature ayant le statut "Retenue" ne peut pas être placée dans le vivier.

### 3. Pop-up de Recherche de Candidature dans le Vivier
- **Code Source Frontend :** [VivierView.jsx](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement-react/src/pages/VivierView.jsx)
- **Explications du code :**
  - Stylisation du bouton principal "Ajouter au vivier RH" (dégradé indigo, ombre portée).
  - Ouverture d'un pop-up modal avec champ de recherche en direct permettant de trouver n'importe quelle candidature (par nom, e-mail, poste ou offre) et de l'ajouter au vivier RH d'un clic.
