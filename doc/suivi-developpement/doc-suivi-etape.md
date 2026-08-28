# Document Central de Suivi par Étape et d'Avancement Global (65,5 j)

Ce document récapitule l'organisation du projet *recrutement_alpaCiment*, l'avancement global en pourcentage (`% terminé`), le développement du **Sprint 5** et la séparation claire des colonnes `Type de demande` et `Canal de dépôt` ainsi que le chargement dynamique de la Direction.

---

## 📌 Séparation de Type & Canal et Affichage Réel de la Direction

1. **Séparation Distincte des Colonnes** :
   - **Type de demande** : `Offre` vs `Spontanée` (badge distinct `blue` ou `amber`).
   - **Canal de dépôt** : `Portail Web` (`site_externe`) vs `Saisie Manuelle RH` (`rh_manuel`, badge distinct `gray` ou `purple`).
   - Séparés dans le tableau principal et la fiche détaillée RH ([src/main.jsx](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement-react/src/main.jsx)).

2. **Affichage Dynamique et Réel de la Direction** :
   - Correction de l'eager loading dans [CandidatureController.php](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Http/Controllers/Api/CandidatureController.php) (`offre.direction`, `domaine.direction`).
   - Résolution du problème d'affichage "Non spécifiée" : la direction de l'offre ou du domaine associé s'affiche correctement lorsque le domaine ou l'offre est validé.

---

## 📈 Tableau Général d'Avancement par Sprint (% terminé)

- **Avancement Global du Projet :** **71.8% terminé** (47.0 / 65.5 j)
- **Barre de Progression Globale :** `[██████████████░░░░░░] 71.8%`

| Sprint | Intitulé | Estimation | Progression (%) | Statut |
| --- | --- | ---: | ---: | --- |
| **Sprint 0** | Analyse, cadrage et conception | 9,0 j | **100.0%** | **[FAIT]** |
| **Sprint 1** | Socle technique, sécurité et référentiels de base | 6,0 j | **100.0%** | **[FAIT]** |
| **Sprint 2** | Gestion des offres, directions et domaines | 7,0 j | **100.0%** | **[FAIT]** |
| **Sprint 3** | Dépôt et réception des candidatures | 6,5 j | **100.0%** | **[FAIT]** |
| **Sprint 4** | Gestion RH des candidatures et fiche candidat | 7,0 j | **100.0%** | **[FAIT]** |
| **Sprint 5** | Vivier, compétences et validation CV (OCR / IA) | 11,5 j | **100.0%** | **[FAIT]** |
| **Sprint 6** | Rendez-vous, communications et modèles | 10,0 j | **0.0%** | **[A FAIRE]** |
| **Sprint 7** | Dashboard, recherche avancée, matching et finalisation | 8,5 j | **0.0%** | **[A FAIRE]** |
| **Total** | **Total Scope Général** | **65,5 j** | **71.8%** | |
