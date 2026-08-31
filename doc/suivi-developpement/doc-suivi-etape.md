# Document Central de Suivi par Étape et d'Avancement Global (65,5 j)

Ce document récapitule l'organisation du projet *recrutement_alpaCiment*, l'avancement global en pourcentage (`% terminé`), le développement du **Sprint 4** et le design de la barre bleue verticale sans décalage de texte pour le suivi des candidatures non vues.

---

## 📌 Barre Bleue Verticale d'Indication des Candidatures Non Vues (Sprint 4)

A la demande explicite de l'utilisateur pour éviter tout décalage du texte et éliminer l'effet agressif du badge rouge :

1. **Indicateur par Barre Bleue à Gauche (`borderLeft: 4px solid #3b82f6`)** :
   - Pour chaque candidature non consultée (`!c.vue`), une élégante **barre bleue verticale de 4px** est affichée sur le bord gauche de la ligne du tableau, accompagnée d'un léger voile bleu translucide (`rgba(59, 130, 246, 0.04)`).
   - Le texte et les cellules restent **100% alignés** avec la même position exacte, supprimant tout saut de mise en page ou décalage horizontal.
2. **Transition Douce et Disparition à la Consultation** :
   - Dès que l'utilisateur RH clique sur **`Voir dossier`** ou **`Consulter`**, la barre bleue s'estompe en douceur (`transition: 'all 0.2s ease'`).

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
| **Sprint 4** | Gestion RH des candidatures, fiche candidat et suivi par barre bleue "Non vue" | 7,0 j | **100.0%** | **[FAIT]** |
| **Sprint 5** | Vivier, compétences et validation CV (OCR / IA) | 11,5 j | **100.0%** | **[FAIT]** |
| **Sprint 6** | Rendez-vous, communications et modèles | 10,0 j | **0.0%** | **[A FAIRE]** |
| **Sprint 7** | Dashboard, recherche avancée, matching et finalisation | 8,5 j | **0.0%** | **[A FAIRE]** |
| **Total** | **Total Scope Général** | **65,5 j** | **71.8%** | |
