# Document Central de Suivi par Étape et d'Avancement Global (66,5 j)

Ce document récapitule l'organisation du projet *recrutement_alpaCiment*, l'architecture Front-Office / Back-Office, la structuration exacte des sprints (Total 66,5 j) et le suivi détaillé des étapes.

---

## 📊 Tableau Récapitulatif des Sprints (66,5 jours)

| Sprint | Intitulé | Estimation | Statut |
| --- | --- | ---: | --- |
| **Sprint 0** | Analyse, cadrage et conception | 9,0 j | **[FAIT]** |
| **Sprint 1** | Socle technique, sécurité et référentiels de base | 6,0 j | **[FAIT]** |
| **Sprint 2** | Gestion des offres, directions et domaines | 7,0 j | **[FAIT]** |
| **Sprint 3** | Dépôt et réception des candidatures (Formulaires temporaires) | 7,5 j | **[FAIT]** |
| **Sprint 4** | Gestion RH des candidatures et fiche candidat | 7,0 j | **[A FAIRE]** |
| **Sprint 5** | Vivier, compétences et validation CV (OCR / IA) | 11,5 j | **[A FAIRE]** |
| **Sprint 6** | Rendez-vous, communications et modèles (Ingestion Mail & Accusé) | 10,0 j | **[A FAIRE]** |
| **Sprint 7** | Dashboard, recherche avancée, matching et finalisation | 8,5 j | **[A FAIRE]** |
| **Total** | **Total Scope Général** | **66,5 j** | |

---

## 🛠️ Synthese des Évolutions & Correctifs Déjà Implémentés (Sprints 0 à 3)

### 1. Front-Office Candidats Autonome avec Slugs SEO
- **Portail Public** : Routes autonomes `/candidat/offres`, `/candidature-spontanee`, et `/offre/:slug` (ex : `http://127.0.0.1:5173/offre/une-commerciale-retail`).
- **Communication Directe** : Helpers `getPublicJson()` et `sendPublicFormData()` pour éviter toute redirection d'authentification RH 401.

### 2. Candidature Spontanée avec Champ Libre "Poste souhaité"
- Migration PostgreSQL : `ALTER TABLE domaine ALTER COLUMN id_direction DROP NOT NULL;` exécutée.
- Enregistrement automatique d'un domaine temporaire avec `id_direction = NULL` et `valide = false` modifiable et validable dans l'interface RH.

### 3. Fiche Candidat Pleine Page ("Grande Page") & Affichage Documents
- Affichage pleine page en 2 colonnes dans `CandidaturesView`.
- Resolution du lien de stockage `storage:link` et route de secours `Route::get('/storage/{path}')` dans `routes/web.php` pour ouvrir tous les fichiers joints (CV, Photos, Annexes) avec HTTP 200 OK.

---

## 📂 Architecture Applicative : Séparation Front-Office vs Back-Office

```text
code_source/recrutement-react/src/
├── frontOffice/                   <-- Portail public autonome pour les candidats (sans auth RH)
│   ├── PublicOffresPage.jsx       <-- URL: /candidat/offres (Accès direct à toutes les offres publiées)
│   ├── PostulerOffrePage.jsx      <-- URL: /offre/:slug (Dépôt direct de candidature avec Slug SEO)
│   └── CandidatureSpontaneePage.jsx <-- URL: /candidature-spontanee (Formulaire direct avec poste souhaité)
├── backOffice/                    <-- Administration RH sécurisée
│   ├── DashboardView.jsx          <-- Tableau de bord RH
│   ├── OffersView.jsx             <-- Gestion des offres (Bouton Partage générant /offre/:slug)
│   ├── CandidaturesView.jsx       <-- Gestion RH et Fiche Candidat Pleine Page (Photo + Fichiers)
│   ├── ReferentialsView.jsx       <-- Référentiels (Directions, Domaines en attente/validés, Compétences)
│   └── AppShell.jsx               <-- Layout Back-office avec sidebar sticky et accordéon
└── main.jsx                       <-- Routeur principal séparant Front-Office et Back-Office
```

---

## 📑 Référentiel des Fiches de Suivi Datées

Toutes les actions quotidiennes sont consignées dans les dossiers correspondants :
- [2026-08-25 - Invalidation Session & Login](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-1/2026-08-25/invalidation-session-login.md)
- [2026-08-26 - Directions & Domaines Pleine Largeur](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-2/2026-08-26/referentiels-directions-domaines.md)
- [2026-08-27 - Profils Multiples & Sticky Sidebar Accordéon](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-2/2026-08-27/profils-multiples-subnav-sticky.md)
- [2026-08-27 - Workflow Statut Croissant & Tri SQL Offres](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-2/2026-08-27/workflow-statuts-tri-dashboard.md)
- [2026-08-28 - Candidatures, Upload CV & Front/Back Office](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-3/2026-08-28/candidatures-import-documents.md)
