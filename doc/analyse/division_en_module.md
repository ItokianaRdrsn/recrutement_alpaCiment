# Module Recrutement — Découpage fonctionnel

Vue d'ensemble du projet organisée en blocs fonctionnels. Pour chacun : ce qu'il fait, ce qui existe déjà dans le schéma, et ce qui reste à construire côté application.

---

## 1. Gestion des offres d'emploi

**Ce que ça fait** : créer/éditer une offre, la publier, la clôturer ; navigation par direction (tous / en cours / voir plus pour les clôturées).

- Schéma : `offre`, `statut_offre`, `direction` — déjà complet
- À construire : écrans de création/édition, filtre par direction avec les 3 options (tous / offres publiées / voir plus)

---

## 2. Dépôt de candidature

**Ce que ça fait** : réceptionne une candidature, sur offre ou spontanée, depuis le site externe (import) ou saisie manuelle RH ; upload de documents par fichier ou photo+OCR ; dédoublonnage du candidat par email.

- Schéma : `candidat` (email unique), `candidature` (`canal_depot`, `id_utilisateur_depot`), `document` (`mode_acquisition`, `contenu_texte_extrait`) — complet
- À construire : le processus transactionnel de dépôt (détaillé en section 7bis du fichier `module-recrutement.md`) : vérif offre publiée → recherche/création candidat → création candidature+historique → upload documents → accusé de réception

---

## 3. Gestion des candidatures (back-office)

**Ce que ça fait** : vue générale (tous types), vue "sur offre" (par direction → offre), vue "spontanée" (par direction → domaine) ; fiche candidat détaillée ; changement de statut avec historique.

- Schéma : `candidature`, `statut_candidature`, `historique_statut`, `type_demande` — complet
- À construire : les 3 écrans de liste (général / sur offre / spontané), la fiche candidat, le changement de statut (avec écriture simultanée dans `historique_statut` — pas de trigger, à faire côté appli)

---

## 4. Vivier

**Ce que ça fait** : marquer un candidat en réserve (indépendamment de son statut) ; bouton "voir le vivier" depuis une offre, filtré sur sa direction.

- Schéma : `candidature.dans_vivier` — complet (note : pas de colonne direction dénormalisée, la requête vivier-par-direction passe par une jointure `offre`/`domaine` à chaque lecture — décision déjà actée)
- À construire : le bouton/écran vivier, la requête de filtrage par direction

---

## 5. Domaines (candidature spontanée)

**Ce que ça fait** : liste déroulante de domaines synchronisée avec le site externe, option "Autre, précisez" qui crée un nouveau domaine en attente de validation.

- Schéma : `domaine` (`valide`, `date_validation`, `valide_par`), fonction `valider_domaine()` — complet
- À construire : l'API de synchronisation avec le site externe, l'écran RH "domaines à valider"

---

## 6. Compétences, expériences, formations & matching

**Ce que ça fait** : référentiel de compétences, compétences déclarées par candidat / requises par offre, extraction automatique depuis les CV (OCR + dictionnaire/fuzzy pour compétences, NER pour expériences/formations), validation RH avant utilisation, matching candidat ↔ offre.

- Schéma : `competence`, `candidat_competence`, `offre_competence` — complet pour la base. **Restent à ajouter** (décidés mais pas encore écrits dans le script) : `experience_professionnelle`, `formation`, colonnes `source`/`score_confiance`/`valide` sur `candidat_competence`, `pg_trgm` + `competence_alias`
- À construire : le pipeline OCR/NER (service à part, Python probablement), l'écran de validation RH des extractions, l'algorithme de score de matching
- **Priorité** : déjà actée comme non-urgente pour la V1 (fonctionnalité "recherche avancée sur compétences" du besoin initial)

---

## 7. Rendez-vous (tests / entretiens)

**Ce que ça fait** : planifier un test ou un entretien pour une candidature, avec un responsable, une date, un mode (présentiel/visio/tél), un statut (à venir/réalisé/annulé).

- Schéma : `rendez_vous`, `type_rendez_vous`, `statut_rendez_vous`, `mode_realisation` — complet
- À construire : l'écran de planification, la vue agenda/calendrier du RH

---

## 8. Communication

**Ce que ça fait** : modèles de messages prédéfinis par catégorie (accusé de réception, convocation, demande d'info/document, issue), personnalisables avant envoi, historique conservé par candidat, envoi manuel ou automatique selon le statut atteint.

- Schéma : `type_message`, `modele_message` (`id_statut_candidature`, `envoi_automatique`), `communication` — complet
- À construire : l'écran d'envoi (choix modèle → personnalisation → envoi), le déclenchement effectif de l'envoi automatique (pas de trigger : à faire dans le code au moment du changement de statut), l'envoi technique réel (SMTP/API emailing)

---

## 9. Paramètres — Gestion des modèles de communication *(nouveau)*

**Ce que ça fait** : un écran d'administration pour créer/éditer/activer/désactiver les modèles de message, et définir lesquels s'envoient automatiquement (et à quel statut).

- Schéma : **déjà entièrement couvert** par `modele_message` — aucune nouvelle table nécessaire
- À construire : l'écran CRUD (liste des modèles par type, formulaire d'édition avec objet/contenu, toggle `actif`, toggle `envoi_automatique` + sélection du `statut_candidature` déclencheur)
- Point d'attention : la contrainte d'unicité (un seul modèle actif+auto par statut) va rejeter en base une tentative d'activer 2 modèles automatiques sur le même statut — l'écran doit afficher cette erreur proprement plutôt que planter, ou mieux, désactiver dans l'UI les statuts déjà pris avant même l'envoi

---

## 10. Tableau de bord *(nouveau)*

**Ce que ça fait** : vue d'ensemble de l'activité de recrutement.

| Indicateur | Requête (principe) |
|---|---|
| Candidatures reçues sur offre | `COUNT(*) FROM candidature WHERE id_type_demande = 'Offre'` |
| Offres en cours | `COUNT(*) FROM offre WHERE id_statut_offre = 'Publiee'` |
| Candidatures spontanées | `COUNT(*) FROM candidature WHERE id_type_demande = 'Spontanee'` |
| Statistiques du recrutement (mois) | Répartition mensuelle par statut, taux de transformation (retenues / total), délai moyen de traitement — voir détail ci-dessous |

- Schéma : **déjà entièrement couvert**, aucune nouvelle table nécessaire — uniquement des requêtes de lecture/agrégation sur `candidature`, `offre`, `historique_statut`
- Sur "statistiques du recrutement (mois)", plusieurs interprétations possibles, à préciser :
  - Nombre de candidatures reçues par mois (tendance)
  - Répartition des candidatures par statut sur le mois en cours
  - Taux de transformation (retenues / total) sur le mois
  - Délai moyen de traitement (temps entre "Recue" et statut final), calculable via `historique_statut`
- À construire : les requêtes d'agrégation (éventuellement une `VIEW` SQL réutilisable — pas un trigger, juste une requête sauvegardée, recalculée à chaque lecture), les écrans de visualisation (cartes chiffrées + graphique mensuel)

---

## Récapitulatif : ce qui manque encore au schéma SQL

Deux ajouts déjà décidés en discussion mais pas encore écrits dans le script :
1. `experience_professionnelle`, `formation` (+ enrichissement de `candidat_competence`) — pattern `source`/`score_confiance`/`valide`
2. `pg_trgm` + `competence_alias` — matching dictionnaire/fuzzy pour les compétences

Tout le reste (dépôt, dashboard, paramètres communication) est déjà couvert par le schéma existant — ce sont des écrans/requêtes à construire, pas des tables à ajouter.
