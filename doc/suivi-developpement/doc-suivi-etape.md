# Document Central de Suivi par Étape et d'Avancement Global (65,5 j)

Ce document récapitule l'organisation du projet *recrutement_alpaCiment*, l'avancement global en pourcentage (`% terminé`), le développement du **Sprint 4** & **Sprint 5** et le retrait définitif des colonnes redondantes `date_candidature` et `date_maj`.

---

## 📌 Suppression Définitive de `date_candidature` et `date_maj`

À la demande explicite, les colonnes redondantes `date_candidature` et `date_maj` ont été totalement retirées de l'ensemble de l'application au profit des colonnes d'horodatage standards Laravel **`created_at`** et **`updated_at`** :

1. **Fichier SQL ([gestion_recrutement.sql](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/sql/gestion_recrutement.sql))** :
   - Suppression de `date_candidature` et `date_maj` dans la table `candidature`.
   - Vues statistiques (`vue_stats_candidatures_par_mois`, `vue_stats_repartition_statut_mois_courant`, `vue_stats_taux_transformation_mensuel`) basées désormais sur `created_at`.
2. **Migrations & Modèles Backend** :
   - Migration [2026_08_28_000500_create_candidature_tables.php](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/database/migrations/2026_08_28_000500_create_candidature_tables.php) nettoyée.
   - Modèle [Candidature.php](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Models/Candidature.php) et contrôleur [CandidatureController.php](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Http/Controllers/Api/CandidatureController.php) réalignés sur `created_at`.
3. **Frontend React ([main.jsx](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement-react/src/main.jsx))** :
   - Remplacement de tout affichage de `c.date_candidature` par `c.created_at`.

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
