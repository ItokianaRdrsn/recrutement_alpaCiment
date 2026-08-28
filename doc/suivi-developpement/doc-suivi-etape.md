# Document Central de Suivi par Étape et d'Avancement Global (65,5 j)

Ce document récapitule l'organisation du projet *recrutement_alpaCiment*, l'avancement global en pourcentage (`% terminé`), le développement du **Sprint 2** et la généralisation des Pop-ups Modals pour tous les Référentiels.

---

## 📌 Généralisation des Modals Pop-up pour les Référentiels (Sprint 2)

A la demande explicite de l'utilisateur, l'ensemble des formulaires de création et de modification des référentiels a été migré vers des **Modals Pop-up interactives** au design identique à celui de la saisie RH :

1. **Modals Implémentées ([main.jsx](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement-react/src/main.jsx))** :
   - **`DirectionModal`** : Pop-up de création/édition d'une direction avec icône `<Building2 />`.
   - **`DomaineModal`** : Pop-up de création/édition d'un domaine d'expertise avec sélection de la direction parente et case de validation RH (`<Layers />`).
   - **`CompetenceModal`** : Pop-up de création d'une compétence avec sélection du type (Technique, Soft skill, Langue) (`<Sparkles />`).
2. **Interface Utilisateur & Actions (`ReferentialsView`)** :
   - Suppression des anciens formulaires intégrés à plat dans les sections.
   - Boutons d'en-tête violets **`+ Nouvelle Direction`**, **`+ Nouveau Domaine`**, **`+ Nouvelle Compétence`**.
   - Clic sur l'icône de crayon (Édition) d'une ligne de tableau ouvrant automatiquement la modal pré-remplie du référentiel correspondant.

---

## 📈 Tableau Général d'Avancement par Sprint (% terminé)

- **Avancement Global du Projet :** **71.8% terminé** (47.0 / 65.5 j)
- **Barre de Progression Globale :** `[██████████████░░░░░░] 71.8%`

| Sprint | Intitulé | Estimation | Progression (%) | Statut |
| --- | --- | ---: | ---: | --- |
| **Sprint 0** | Analyse, cadrage et conception | 9,0 j | **100.0%** | **[FAIT]** |
| **Sprint 1** | Socle technique, sécurité et référentiels de base | 6,0 j | **100.0%** | **[FAIT]** |
| **Sprint 2** | Gestion des offres, directions et domaines (Modals Pop-up) | 7,0 j | **100.0%** | **[FAIT]** |
| **Sprint 3** | Dépôt et réception des candidatures (Web & Saisie RH) | 6,5 j | **100.0%** | **[FAIT]** |
| **Sprint 4** | Gestion RH des candidatures et fiche candidat | 7,0 j | **100.0%** | **[FAIT]** |
| **Sprint 5** | Vivier, compétences et validation CV (OCR / IA) | 11,5 j | **100.0%** | **[FAIT]** |
| **Sprint 6** | Rendez-vous, communications et modèles | 10,0 j | **0.0%** | **[A FAIRE]** |
| **Sprint 7** | Dashboard, recherche avancée, matching et finalisation | 8,5 j | **0.0%** | **[A FAIRE]** |
| **Total** | **Total Scope Général** | **65,5 j** | **71.8%** | |
