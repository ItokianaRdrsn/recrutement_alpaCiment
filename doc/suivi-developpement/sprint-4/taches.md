# Sprint 4 - Tâches & Suivi (Gestion RH des candidatures et fiche candidat - 7,0 j)

## 📊 Progression du Sprint
- **Statut :** **[FAIT]**
- **Progression :** **100.0% terminé** (7.0 / 7.0 j)
- **Barre de progression :** `[████████████████████] 100%`

---

## 📑 Documentation Technique Détaillée du Sprint 4
- [Gestion des candidatures, arborescences et filtrage avancé (2026-08-28)](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-4/2026-08-28/gestion-candidatures-filtres.md)
- [Fiche candidat détaillée, historique des statuts et export PDF (2026-08-28)](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-4/2026-08-28/fiche-candidat-historique.md)

---

## 📋 Détail des Tâches

### BACK-OFFICE

#### **[FAIT]** Liste générale des candidatures avec pagination
- **Estimation :** 0,5 j
- **Progression :** **100%**
- **Notes :** Onglet `[Toutes les candidatures]` affichant la vue consolidée et paginée dans le Back-Office RH via `/api/candidatures`.

---

#### **[FAIT]** Recherche et filtres : statut, direction, période, canal, type
- **Estimation :** 0,5 j
- **Progression :** **100%**
- **Notes :** Barre de filtrage multi-critères complète : statut RH, direction, type/canal (offre vs spontanée), plage de dates (`date_debut`/`date_fin`) et mot-clé `q`.

---

#### **[FAIT]** Gestion des candidatures sur offre : Direction -> Offre -> Candidats
- **Estimation :** 0,5 j
- **Progression :** **100%**
- **Notes :** Onglet et vue d'arborescence dédiée `[Direction → Offre → Candidats]` groupant les dossiers par Direction puis par Intitulé d'offre.

---

#### **[FAIT]** Gestion des candidatures spontanées : Direction -> Domaine -> Candidatures
- **Estimation :** 0,5 j
- **Progression :** **100%**
- **Notes :** Onglet et vue d'arborescence dédiée `[Direction → Domaine → Candidatures]` groupant les dossiers spontanés par Direction puis par Domaine d'expertise.

---

#### **[FAIT]** Fiche candidat : informations, documents et historique statuts
- **Estimation :** 2,0 j
- **Progression :** **100%**
- **Notes :** Vue pleine page ("Grande Page") 2 colonnes avec photo/avatar, coordonnées, motivation, pièces jointes consultables sans erreur 403 et historique chronologique des statuts.

---

#### **[FAIT]** Changement de statut avec commentaire et historique
- **Estimation :** 1,5 j
- **Progression :** **100%**
- **Notes :** Formulaire de mise à jour du statut RH avec saisie de commentaire et enregistrement dans la table `historique_statut_candidature`.

---

#### **[FAIT]** Export PDF de la fiche candidat
- **Estimation :** 0,5 j
- **Progression :** **100%**
- **Notes :** Bouton `Exporter en PDF / Imprimer` fonctionnel dans la fiche candidat (`/api/candidatures/{id}/export-pdf`).

---

#### **[FAIT]** Tests et debug
- **Estimation :** 1,0 j
- **Progression :** **100%**
- **Notes :** 15/15 tests PHPUnit validés et compilation production Vite 0 erreur.

---

## Total Sprint 4 : 7,0 j (100.0% Terminé)
