# Document Central de Suivi par Étape et d'Avancement Global (65,5 j)

Ce document récapitule l'organisation du projet *recrutement_alpaCiment*, l'avancement global en pourcentage (`% terminé`), le développement du **Sprint 4** et l'optimisation extrême des performances réseau et frontend (Code-Splitting, Lazy Loading & Deduplication).

---

## ⚡ Optimisations Majeures des Performances (Sprint 4)

1. **Splitting de Code & Dynamic Imports (`React.lazy()`)** :
   - Mise en place du chargement différé (*lazy loading*) via `React.lazy()` et `<Suspense>` pour toutes les vues et pages (`DashboardView`, `OffersView`, `CandidaturesView`, `ReferentialsView`, `VivierView`, etc.).
   - Empaquetage séparé des icônes (`vendor-icons.js`) et du framework (`vendor-react.js`).
   - **Taille du bundle initial réduite de 8,4 Mo à ~200 Ko (-97,5%)** !
2. **Elimination de la cascade de requêtes et déduplication API** :
   - Déduplication des requêtes d'initialisation `/api/me`, `/api/referentiels/recrutement`, `/api/competences` à l'aide d'un garde d'exécution unique `useRef`.
   - Suppression du blocage en cascade pour le chargement du tableau de bord.
3. **Calcul direct des KPIs Candidatures** :
   - Ajout des requêtes directes optimisées pour les KPIs candidatures sur offre et candidatures spontanées.

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
| **Sprint 4** | Gestion RH des candidatures, fiche candidat, découpage React et optimisations performance | 7,0 j | **100.0%** | **[FAIT]** |
| **Sprint 5** | Vivier, compétences et validation CV (OCR / IA) | 11,5 j | **100.0%** | **[FAIT]** |
| **Sprint 6** | Rendez-vous, communications et modèles | 10,0 j | **0.0%** | **[A FAIRE]** |
| **Sprint 7** | Dashboard, recherche avancée, matching et finalisation | 8,5 j | **0.0%** | **[A FAIRE]** |
| **Total** | **Total Scope Général** | **65,5 j** | **71.8%** | |
