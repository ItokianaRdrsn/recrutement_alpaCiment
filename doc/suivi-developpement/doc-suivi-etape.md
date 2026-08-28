# Document Central de Suivi par Étape et d'Avancement Global (65,5 j)

Ce document récapitule l'organisation du projet *recrutement_alpaCiment*, l'avancement global en pourcentage (`% terminé`), les 4 onglets de la Fiche Candidat et la synthèse des étapes.

---

## 📌 Ergonomie & Onglets de la Fiche Candidat (`CandidatureDetailView`)

Les boutons d'onglets au sommet de la Fiche Candidat sont désormais épurés au nombre de **4 onglets de navigation** :

1. **`[Informations]`** (Onglet actif par défaut) :
   - Vue 2 colonnes consolidée contenant :
     - Identité, avatar et coordonnées du candidat.
     - **Formulaire de mise à jour du statut RH** (changement de statut + commentaire).
     - Informations du poste (Offre vs Spontanée), Direction et Lettre de motivation.
     - **Documents & Pièces jointes** (grille des fichiers avec téléchargement direct).

2. **`[Documents]`** : Vue dédiée pleine largeur des pièces jointes.
3. **`[Historique statuts]`** : Timeline chronologique des changements de statut.
4. **`[Communications]`** : Suivi des e-mails et accusés de réception.

---

## 📈 Tableau Général d'Avancement par Sprint (% terminé)

- **Avancement Global du Projet :** **54.2% terminé** (35.5 / 65.5 j)
- **Barre de Progression Globale :** `[███████████░░░░░░░░░] 54.2%`

| Sprint | Intitulé | Estimation | Progression (%) | Statut |
| --- | --- | ---: | ---: | --- |
| **Sprint 0** | Analyse, cadrage et conception | 9,0 j | **100.0%** | **[FAIT]** |
| **Sprint 1** | Socle technique, sécurité et référentiels de base | 6,0 j | **100.0%** | **[FAIT]** |
| **Sprint 2** | Gestion des offres, directions et domaines | 7,0 j | **100.0%** | **[FAIT]** |
| **Sprint 3** | Dépôt et réception des candidatures | 6,5 j | **100.0%** | **[FAIT]** |
| **Sprint 4** | Gestion RH des candidatures et fiche candidat | 7,0 j | **100.0%** | **[FAIT]** |
| **Sprint 5** | Vivier, compétences et validation CV (OCR / IA) | 11,5 j | **0.0%** | **[A FAIRE]** |
| **Sprint 6** | Rendez-vous, communications et modèles | 10,0 j | **0.0%** | **[A FAIRE]** |
| **Sprint 7** | Dashboard, recherche avancée, matching et finalisation | 8,5 j | **0.0%** | **[A FAIRE]** |
| **Total** | **Total Scope Général** | **65,5 j** | **54.2%** | |

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
│   ├── CandidaturesView.jsx       <-- Fiche Candidat 4 Onglets (Informations, Documents, Historique, Comm)
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
