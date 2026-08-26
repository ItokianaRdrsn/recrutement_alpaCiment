# Module Recrutement — Découpage en sprints

Regroupement des fonctionnalités (`module-recrutement-fonctionnalites.md`) par dépendance technique et priorité métier. Logique suivie : livrer un flux bout-en-bout utilisable le plus tôt possible (offre → dépôt → traitement), puis enrichir. Le nombre de sprints réels dépendra de votre vélocité — ceci est un **ordre de dépendance**, pas un calendrier figé.

**Stack** : Laravel — `Queue` pour les traitements asynchrones (envoi d'emails, pipeline OCR), `Scheduler` pour les tâches périodiques. Mentionné explicitement où c'est pertinent ci-dessous.

**Hypothèse retenue pour l'intégration site externe** : on suppose que les candidatures arrivent déjà directement dans le système (peu importe le mécanisme réel pour l'instant). Le format d'intégration définitif (API/export/webhook) et la synchronisation des domaines (5.4) sont traités plus tard, hors périmètre des sprints ci-dessous.

## Planning récapitulatif (~70 jours)

| Sprint | Contenu | Durée | Cumul |
|---|---|---|---|
| 1 | Socle : Offres & Domaines | 8 j | J8 |
| 2 | Dépôt de candidature | 8 j | J16 |
| 3 | Gestion des candidatures & Export PDF | 9 j | J25 |
| 4 | Communication (paramétrage, envoi, automatisation) | 9 j | J34 |
| 5 | Rendez-vous & Vivier | 7 j | J41 |
| 6 | Tableau de bord | 4 j | J45 |
| 7 | Compétences/formations manuelles & recherche | 7 j | J52 |
| 8 | Extraction automatique des CV (OCR/NER) & validation | 12 j | J64 |
| 9 | Matching candidat/offre *(basse priorité)* | 6 j | J70 |

**Répartition du poids** : Sprint 8 (OCR/NER) concentre le plus de jours — c'est la brique la plus risquée techniquement (pipeline externe, modèle NER, tâche asynchrone), cohérent avec ce qu'on avait identifié plus tôt dans la conversation. Sprint 6 (tableau de bord) est le plus léger : essentiellement des vues déjà écrites en SQL à brancher sur des écrans.

**Si le Sprint 9 (matching) est repoussé**, le planning descend à ~64 jours pour le périmètre restant — à garder en tête si le temps venait à manquer, puisque c'est explicitement la fonctionnalité la moins prioritaire du lot.

---

## Sprint 1 — Socle : Offres & Domaines (8 jours)

**Objectif démontrable** : créer, publier et consulter une offre complète (missions, compétences requises, profil recherché) ; gérer le référentiel de domaines pour le futur formulaire spontané.

- 1.1 CRUD des offres 
- 1.2 Statut des offres (Brouillon → Publiée → Clôturée)
- 1.3 Compétences requises d'une offre (`profil_competence`)
- 1.4 Missions d'une offre (`mission`)
- 1.5 Génération du lien de candidature
- 5.1 Consultation des domaines
- 5.2 Gestion des domaines (CRUD admin)
- 5.3 Gestion du domaine « Autre »

**Tables déjà prêtes** : `direction`, `offre`, `statut_offre`, `profil_offre`, `mission`, `profil_competence`, `competence`, `domaine`, `utilisateur`.

---

## Sprint 2 — Dépôt de candidature (8 jours)

**Objectif démontrable** : une candidature complète (avec documents) peut être créée, sans doublon de fiche candidat, que ce soit via saisie RH ou en supposant un flux entrant déjà en place.

- 2.1 Dépôt d'une candidature
- 2.2 Type de candidature (offre publiée uniquement / spontanée)
- 2.3 Informations candidat
- 2.4 Gestion des documents (fichier ou photo)
- 2.5 Dédoublonnage par email
- 2.6 Statut initial + premier historique

*Repoussé* : 2.7 (accusé de réception) — dépend du Sprint 4 (communication).

**Tables déjà prêtes** : `candidat`, `candidature`, `type_demande`, `statut_candidature`, `historique_statut`, `document`.

---

## Sprint 3 — Gestion des candidatures (back-office) & Export PDF (9 jours)

**Objectif démontrable** : le RH consulte, filtre, fait progresser les candidatures, et peut exporter une fiche candidat en PDF.

- 3.1 CRUD / gestion des candidatures
- 3.2 Recherche et filtrage (statut, direction, période, canal, type)
- 3.3 Candidatures sur offre (Direction → Offre → Candidatures)
- 3.4 Candidatures spontanées (Direction → Domaine → Candidatures)
- 3.5 Fiche candidat, **export PDF inclus** *(compétences/expériences/formations/rendez-vous affichés vides en attendant les sprints suivants — la structure de l'export doit prévoir ces sections dès maintenant pour ne pas la refaire)*
- 3.6 Changement de statut + historique *(hors déclenchement automatique de communication, cf Sprint 4)*
- 1.6 Gestion des candidatures d'une offre *(dépend de 3.x, regroupé ici)*

**Tables déjà prêtes** : rien de nouveau, uniquement les tables des Sprints 1-2.

---

## Sprint 4 — Communication : paramétrage, envoi, automatisation, envoi technique réel (9 jours)

**Objectif démontrable** : le RH configure des modèles, envoie manuellement, le système déclenche l'envoi automatique au bon moment, et les emails partent réellement.

- 9.1 CRUD des modèles
- 9.2 Activation/désactivation d'un modèle
- 9.3 Configuration de l'envoi automatique (contrôle d'unicité par statut)
- 9.4 Personnalisation des modèles (variables)
- 8.1 Consultation/envoi manuel
- 8.2 Sélection et personnalisation d'un modèle avant envoi
- 8.3 Types de communication (référentiel déjà en base)
- 8.5 Envoi manuel
- 8.6 Historique des communications
- 8.4 Envoi automatique (déclenché par changement de statut)
- **2.7** Accusé de réception (maintenant activable)
- **3.6 (complément)** Déclenchement de la communication liée au nouveau statut
- **Envoi technique réel des emails** — `Mail` + `Queue` Laravel : chaque `communication` à envoyer devient un `Job` mis en file, avec retry automatique en cas d'échec SMTP. Le `Scheduler` peut piloter un traitement périodique de rattrapage (ex: toutes les 5 min, renvoyer les communications restées "en attente" trop longtemps)

**Tables déjà prêtes** : `type_message`, `modele_message`, `communication`.

---

## Sprint 5 — Rendez-vous & Vivier (7 jours)

**Objectif démontrable** : planifier tests/entretiens avec convocation automatique ; gérer le vivier de candidats.

- 7.1 CRUD des rendez-vous
- 7.2 Type de rendez-vous (Test/Entretien)
- 7.3 Détails du rendez-vous (responsable, date, mode, lieu)
- 7.4 Statut du rendez-vous
- 7.5 Agenda
- 7.6 Communication liée au rendez-vous (dépend du Sprint 4, maintenant prêt)
- 4.1 Gestion du vivier (ajout/retrait)
- 4.2 Recherche dans le vivier *(par direction/domaine dès maintenant ; par compétence repoussé au Sprint 7)*
- 4.3 Vivier depuis une offre

**Tables déjà prêtes** : `type_rendez_vous`, `statut_rendez_vous`, `mode_realisation`, `rendez_vous`.

---

## Sprint 6 — Tableau de bord (4 jours)

**Objectif démontrable** : vue d'ensemble chiffrée de l'activité de recrutement, avec assez de données réelles (Sprints 2-5) pour être significative.

- 10.1 Indicateurs (3 compteurs)
- 10.2 Statistiques mensuelles (tendance, répartition, taux de transformation, délai)
- 10.3 Filtrage par période/direction *(nécessite d'étendre les vues SQL existantes, qui ne filtrent pas encore par direction)*

**Tables déjà prêtes** : les 5 vues SQL (`vue_dashboard_kpis` et les 4 `vue_stats_*`) — 10.3 demande de les paramétrer ou d'en écrire des variantes filtrées.

---

## Sprint 7 — Compétences, expériences, formations (déclaration manuelle) & recherche avancée (7 jours)

**Objectif démontrable** : enrichir manuellement un profil candidat (compétences/expériences/formations) et effectuer une recherche avancée sur ces critères.

- 6.1 CRUD référentiel compétences
- 6.2 Gestion manuelle des compétences candidat
- 6.3 Gestion manuelle des expériences professionnelles
- 6.4 Gestion manuelle des formations
- **3.5 (complément)** Affichage compétences/expériences/formations dans la fiche candidat (et dans l'export PDF du Sprint 3, à compléter)
- 3.7 Recherche avancée par compétences *(la recherche par mots-clés dans les CV dépend du Sprint 8)*
- 4.2 (complément) Recherche dans le vivier par compétence

**Tables déjà prêtes** : `competence`, `candidat_competence`, `experience_professionnelle`, `formation`.

---

## Sprint 8 — Extraction automatique des CV (OCR/NER) & validation (12 jours)

**Objectif démontrable** : un CV uploadé est automatiquement analysé, les compétences/expériences/formations proposées apparaissent dans une file de validation RH, et la recherche full-text sur le contenu des CV fonctionne.

- 6.5 Extraction automatique des données CV (pipeline OCR/NER, `pg_trgm` + `competence_alias` pour les compétences)
- 6.6 Écran de validation RH des données extraites (score de confiance, valider/corriger/rejeter)
- **3.7 (complément)** Recherche par mots-clés dans les CV, via `document.recherche_texte`
- **Laravel Queue** : le traitement OCR/NER d'un document tourne en tâche de fond (potentiellement lent), pas dans la requête d'upload — le document passe par un statut de traitement (à ajouter si besoin : `en_attente` / `traite` / `echec`)

**Tables déjà prêtes** : `document` (colonnes `contenu_texte_extrait`, `recherche_texte`, `mode_acquisition`), `candidat_competence`/`experience_professionnelle`/`formation` (colonnes `source`, `score_confiance`, `valide`).

---

## Sprint 9 — Matching candidat / offre (6 jours) *(basse priorité, à ajouter si le temps le permet)*

- 6.8 Comparer les compétences du candidat avec celles requises par l'offre (`profil_competence` vs `candidat_competence` validées), calculer un score, classer les candidats

**Tables déjà prêtes** : tout est là (`profil_competence`, `candidat_competence`) — uniquement l'algorithme de score et l'écran à construire.

---

## Hors périmètre pour l'instant

- **5.4** Synchronisation des domaines avec le site externe
- **Format d'intégration définitif** avec le site externe (API / export / webhook) — on part du principe que les candidatures arrivent déjà dans le système ; le mécanisme réel sera traité séparément, plus tard

---

## Vue d'ensemble des dépendances

```
Sprint 1 (Offres, Domaines)
    │
    ▼
Sprint 2 (Dépôt de candidature)
    │
    ▼
Sprint 3 (Gestion des candidatures + Export PDF) ──┐
    │                                                │
    ▼                                                │
Sprint 4 (Communication + envoi technique) ──────────┤
    │                                                │
    ▼                                                │
Sprint 5 (Rendez-vous & Vivier)                      │
    │                                                │
    ▼                                                ▼
Sprint 6 (Tableau de bord)                  Sprint 7 (Compétences/Formations manuelles)
                                                       │
                                                       ▼
                                             Sprint 8 (OCR/NER + validation)
                                                       │
                                                       ▼
                                             Sprint 9 (Matching — basse priorité)

Hors périmètre : intégration site externe (traitée séparément)
```


