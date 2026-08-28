# Sprint 3 - Tâches & Suivi (Dépôt et réception des candidatures - 7,5 j)

## Avancement du Sprint

- **[FAIT]** 8 tâches
- **Sous-total : 7,5 j**

---

## 📋 Detail des Tâches

### FRONT-OFFICE

#### **[FAIT]** Formulaire de candidature sur offre (temporaire)
- **Estimation :** 0,5 j
- **Notes :** Dépôt direct autonome via `/offre/:slug`.

#### **[FAIT]** Formulaire de candidature spontanée avec domaine (temporaire)
- **Estimation :** 0,5 j
- **Notes :** Champ libre poste souhaité avec domaine temporaire `id_direction = null`.

#### **[FAIT]** Upload des CV, photos et documents
- **Estimation :** 1,0 j
- **Notes :** Stockage sécurisé et consultation HTTP 200 OK.

---

### BACK-OFFICE

#### **[FAIT]** Saisie manuelle d'une candidature par un RH
- **Estimation :** 1,0 j
- **Notes :** Ajout manuel direct dans l'interface RH.

---

### API / SERVICES

#### **[FAIT]** Détection d'un candidat existant et dédoublonnage par email
- **Estimation :** 1,0 j
- **Notes :** Contrôle par email candidat pour réutiliser la fiche ou mettre à jour.

#### **[FAIT]** Création transactionnelle : candidat, candidature, statut initial, historique
- **Estimation :** 2,0 j
- **Notes :** Transaction SQL garantissant l'intégrité de la candidature.

#### **[FAIT]** Préparation de la réception/import depuis le site externe
- **Estimation :** 0,5 j
- **Notes :** Préparation du connecteur d'ingestion.

#### **[FAIT]** Tests et debug
- **Estimation :** 1,0 j
- **Notes :** Validation des tests d'upload et création candidatures.

---

## Sous-total Sprint 3 : 7,5 j
