# Sprint 2 - Tâches

## Avancement

- **[FAIT]** 4 tâches
- **[EN COURS]** 1 tâche
- **[A FAIRE]** 3 tâches

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
- **Notes :** API REST complète (index, store, show, update, destroy) avec filtrage par direction, statut, type de contrat et recherche textuelle. Interface React ajoutée dans l'écran `Offres` avec formulaire de création/modification, pagination et bouton « Nouvelle offre ». Voir [entrée de suivi](./2026-08-26/crud-offres-emploi.md).

---

### **[FAIT]** Gestion du statut des offres : brouillon, publiée, clôturée

- **Estimation :** 1,0 j
- **Notes :** Cycle de vie brouillon → publiée → clôturée implémenté via les endpoints PATCH `/publier` et `/cloturer`. Boutons d'action dans le tableau des offres avec désactivation contextuelle selon le statut courant. Voir [entrée de suivi](./2026-08-26/statut-offres.md).

---

### **[A FAIRE]** Gestion du profil, des missions et des formations requises

- **Estimation :** 1,5 j
- **Notes :** Décrire précisément les attentes liées à l'offre.

---

### **[A FAIRE]** Gestion des compétences requises par offre

- **Estimation :** 1,0 j
- **Notes :** Lier les compétences au besoin de recrutement.

---

## Front-office / API

### **[A FAIRE]** Affichage des offres publiées et génération du lien de candidature

- **Estimation :** 1,0 j
- **Notes :** Préparer l'accès candidat aux offres ouvertes.

---

### **[EN COURS]** Tests et debug

- **Estimation :** 1,0 j
- **Notes :** Tests Laravel existants OK avec 13 tests. `npm run build` OK côté React. Les tests complets du Sprint 2 seront enrichis avec les offres, statuts et affichage public.

---

## Total

**Sprint 2 : 9,0 j**
