# Sprint 2 - Tâches

## Avancement

- **[FAIT]** 8 tâches
- **[EN COURS]** 0 tâche
- **[A FAIRE]** 0 tâche

## Légende

- **[FAIT]** : tâche terminée et utilisable.
- **[EN COURS]** : tâche commencée, mais pas encore totalement terminée.
- **[A FAIRE]** : tâche prévue, non commencée.

---

## Back-office

### **[FAIT]** CRUD des directions

- **Estimation :** 0,5 j
- **Notes :** API REST créée pour lister, créer, modifier et supprimer les directions. Interface React ajoutée dans l'écran `Référentiels`. La suppression est bloquée si la direction est déjà utilisée par un domaine ou une offre.

---

### **[FAIT]** CRUD des domaines et validation des domaines en attente

- **Estimation :** 1,0 j
- **Notes :** API REST créée pour lister, créer, modifier, supprimer et valider les domaines. Interface React ajoutée avec formulaire, statut `Valide` / `En attente` et action de validation.

---

### **[FAIT]** CRUD des offres d'emploi

- **Estimation :** 2,0 j
- **Notes :** API REST complète (index, store, show, update, destroy) avec filtrage par direction, statut, type de contrat et recherche textuelle. Interface React avec vue de liste aérée et formulaire de création/modification séparé sur une page dédiée. Voir [entrée de suivi](./2026-08-26/crud-offres-emploi.md) et [séparation du formulaire](./2026-08-27/separation-formulaire-offres.md).

---

### **[FAIT]** Gestion du statut des offres : brouillon, publiée, clôturée

- **Estimation :** 1,0 j
- **Notes :** Cycle de vie brouillon → publiée → clôturée implémenté via les endpoints PATCH `/publier` et `/cloturer`. Boutons d'action dans le tableau des offres avec désactivation contextuelle selon le statut courant. Voir [entrée de suivi](./2026-08-26/statut-offres.md).

---

### **[FAIT]** Gestion du profil, des missions et des formations requises

- **Estimation :** 1,5 j
- **Notes :** Saisie et modification complète des critères de profil (`profil_offre`), des missions avec ordre (`mission`), et des formations requises avec niveau et domaine (`profil_formation`). Interface React mise à jour avec sous-sections de formulaire et fiches dépliables. Voir [entrée de suivi](./2026-08-27/profil-missions-formations.md).

---

### **[FAIT]** Gestion des compétences requises par offre

- **Estimation :** 1,0 j
- **Notes :** Migration des tables `type_competence`, `competence` et `profil_competence`. Référentiel administrable dans l'écran `Référentiels`. Sélection des compétences requises et du niveau exigé (Débutant, Intermédiaire, Avancé, Expert) dans l'offre avec affichage de badges. Voir [entrée de suivi](./2026-08-27/competences-offres.md).

---

## Front-office / API

### **[FAIT]** Affichage des offres publiées et génération du lien de candidature

- **Estimation :** 1,0 j
- **Notes :** Endpoints publics unauthenticated `GET /api/public/offres` et `GET /api/public/offres/{id}`. Filtre automatique sur le statut `Publiee` et la date limite. Action de copie direct du lien de candidature (`Share2`) dans l'interface RH. Voir [entrée de suivi](./2026-08-27/offres-publiques-candidature.md).

---

### **[FAIT]** Tests et debug

- **Estimation :** 1,0 j
- **Notes :** Tests automatisés PHPUnit validés à 100% (13/13 passed). Compilation de production React `npm run build` réussie sans avertissement ni erreur.

---

## Total

**Sprint 2 : 9,0 j (100% terminé)**
