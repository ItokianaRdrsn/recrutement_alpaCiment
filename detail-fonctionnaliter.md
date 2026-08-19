# Module Recrutement — Découpage fonctionnel détaillé

Chaque bloc du découpage précédent, détaillé en fonctionnalités précises (écrans, actions, règles). Référence au schéma (`module-recrutement-schema.sql`) et à la doc technique (`module-recrutement.md`) entre parenthèses quand utile.

---

## 1. Gestion des offres d'emploi

1.1. **Créer une offre** — formulaire : titre, direction, description, date de publication, date limite. Statut initial = "Brouillon"
1.2. **Éditer une offre** — modifier les champs tant qu'elle n'est pas clôturée
1.3. **Publier une offre** — passage "Brouillon" → "Publiee" (la rend candidatable)
1.4. **Clôturer une offre** — passage → "Cloturee" (ne peut plus recevoir de nouvelles candidatures — règle à faire respecter côté dépôt, cf bloc 2)
1.5. **Lister les offres par direction** — clic sur une direction → menu déroulant :
   - "Tous" (toutes les offres liées à la direction)
   - Offres publiées, avec leur date (celles non clôturées)
   - "Voir plus" → offres clôturées
1.6. **Associer des compétences requises à une offre** — `offre_competence`, avec niveau requis (utile pour le matching, bloc 6)
1.7. **Consulter le détail d'une offre** — infos + liste des candidatures reçues sur cette offre + compétences requises

---

## 2. Dépôt de candidature

2.1. **Dépôt via le site externe** — import automatique (format d'intégration encore à définir, cf points ouverts)
2.2. **Dépôt manuel par un RH** — formulaire dans le back-office, `canal_depot = 'rh_manuel'`, `id_utilisateur_depot` renseigné
2.3. **Choisir le type de candidature** — "sur offre" (sélection parmi les offres *publiées* uniquement) ou "spontanée"
2.4. **Candidature spontanée : choisir un domaine** — liste déroulante (synchronisée avec le référentiel) + option "Autre, précisez" (crée un nouveau domaine en attente de validation, cf bloc 5)
2.5. **Recherche/dédoublonnage du candidat** — recherche automatique par email ; si trouvé, réutilise la fiche existante, sinon en crée une nouvelle
2.6. **Upload des documents** — au choix : joindre un fichier, ou prendre une photo (à traiter ensuite par OCR)
2.7. **Validation des champs obligatoires** — nom, email, tél (+ poste souhaité et message si spontanée) — logique applicative, pas de contrainte DB à part `NOT NULL` de base
2.8. **Création automatique du statut initial** — "Recue" + première ligne dans l'historique
2.9. **Déclenchement de l'accusé de réception** — si un modèle actif+auto existe pour le statut "Recue" (cf bloc 8)

---

## 3. Gestion des candidatures (back-office)

3.1. **Vue générale** — liste de toutes les candidatures, tous types confondus, avec filtres transverses (statut, direction, période, canal de dépôt)
3.2. **Vue "candidatures sur offre"** — navigation Direction → Offre (tous/publiées/clôturées) → liste des candidats
3.3. **Vue "candidatures spontanées"** — navigation Direction → Domaine → liste des candidats
3.4. **Liste des candidats** (dans chaque vue) — colonnes : nom, date, statut, actions (voir fiche / documents)
3.5. **Fiche candidat** :
   - Informations (nom, email, tél, photo si dispo, adresse, date de naissance)
   - Statut actuel + historique complet des changements
   - Documents (consultation/téléchargement)
   - Compétences, expériences, formations (déclarées ou extraites — avec indicateur "à valider" si extraction CV, cf bloc 6)
   - Rendez-vous liés (cf bloc 7)
   - Historique des communications (cf bloc 8)
3.6. **Changer le statut d'une candidature** — avec commentaire optionnel, écrit simultanément dans `historique_statut` (pas de trigger : à faire dans la même transaction applicative)
3.7. **Recherche avancée** — par mots-clés (via `document.recherche_texte`, full-text) et/ou par compétences (bloc 6)

---

## 4. Vivier

4.1. **Marquer/démarquer un candidat "en vivier"** — indépendant du statut de workflow (`dans_vivier`)
4.2. **Écran vivier général** — tous les candidats en vivier, tous types confondus
4.3. **Bouton "voir le vivier" depuis une offre** — filtré sur la direction de cette offre (candidatures sur offre *et* spontanées de la même direction)
4.4. **Recherche dans le vivier** — par compétences, par domaine/direction

---

## 5. Domaines (candidature spontanée)

5.1. **Synchronisation avec le site externe** — endpoint exposant la liste des domaines valides, pour alimenter la liste déroulante côté site
5.2. **Création automatique via "Autre"** — quand un candidat tape un domaine non répertorié, création d'un `domaine` avec `valide = false`, direction "Autre" par défaut
5.3. **Écran RH "domaines à valider"** — liste des domaines en attente
5.4. **Valider/corriger un domaine** — renommer si besoin, rattacher à la bonne direction, appel à `valider_domaine()`

---

## 6. Compétences, expériences, formations & matching

6.1. **Référentiel compétences** — CRUD admin sur `competence`
6.2. **Déclarer une compétence manuellement** — RH ou candidat, `source = 'manuel'`, `valide = true` d'emblée
6.3. **Extraction automatique depuis un CV** — pipeline externe (OCR + dictionnaire/fuzzy pour compétences via `pg_trgm`/`competence_alias`, NER pour expériences/formations) — service à part, écrit dans la base via l'application, `source = 'cv_ocr'`, `valide = false`
6.4. **Écran de validation RH des extractions** — file d'attente des compétences/expériences/formations `valide = false`, avec le score de confiance affiché ; valider, corriger, ou rejeter
6.5. **Associer des compétences requises à une offre** — cf 1.6, table `offre_competence`
6.6. **Matching automatique candidat ↔ offre** — score basé sur le recoupement `candidat_competence` (validées uniquement) vs `offre_competence` — non prioritaire V1
6.7. **Recherche avancée par compétences** — filtrer candidats/vivier par une ou plusieurs compétences (validées)

---

## 7. Rendez-vous (tests / entretiens)

7.1. **Planifier un rendez-vous** — pour une candidature : type (Test/Entretien), responsable (`utilisateur`), date/heure début-fin, mode (présentiel/visio/tél), lieu ou lien
7.2. **Modifier un rendez-vous** — reprogrammer, changer de responsable ou de mode
7.3. **Annuler un rendez-vous** — passage statut → "Annule"
7.4. **Marquer comme réalisé** — passage statut → "Realise"
7.5. **Vue agenda** — par utilisateur responsable, ou par candidature
7.6. **Lien avec la communication** — convoquer un candidat à ce rendez-vous (cf bloc 8, modèle "Convocation")

---

## 8. Communication

8.1. **Choisir un modèle selon le contexte** — proposer les modèles actifs pertinents pour le type de message (accusé, convocation, demande d'info/document, issue)
8.2. **Personnaliser avant envoi** — éditer objet/contenu (pré-rempli depuis le modèle) sans jamais modifier le modèle lui-même
8.3. **Envoyer manuellement** — enregistre la `communication`, `mode_envoi = 'manuel'`, `id_utilisateur` obligatoire
8.4. **Déclenchement de l'envoi automatique** — à construire : au moment où `candidature.id_statut_candidature` change, chercher un modèle actif+auto pour ce statut et générer la communication (pas de trigger, logique applicative)
8.5. **Envoi technique réel** — service/worker qui traite les communications `mode_envoi = 'auto'` en attente et les envoie réellement (SMTP/API emailing) — hors périmètre base de données
8.6. **Historique des communications** — consultable depuis la fiche candidat (3.5)

---

## 9. Paramètres — Gestion des modèles de communication

9.1. **Lister les modèles** — par type de message, avec indicateur actif/inactif et auto/manuel
9.2. **Créer/éditer un modèle** — nom, type, objet, contenu (avec variables du type `{{nom_candidat}}`)
9.3. **Activer/désactiver un modèle** — `actif`
9.4. **Configurer l'auto-envoi** — toggle `envoi_automatique` + sélection du statut déclencheur (`id_statut_candidature`)
9.5. **Gérer le conflit d'unicité** — un seul modèle actif+auto par statut ; l'écran doit soit désactiver dans l'UI les statuts déjà pris, soit afficher clairement l'erreur renvoyée par la contrainte SQL

---

## 10. Tableau de bord

10.1. **Afficher les 3 compteurs** — candidatures sur offre, offres en cours, candidatures spontanées (`vue_dashboard_kpis`)
10.2. **Graphique de tendance mensuelle** — nombre de candidatures par mois (`vue_stats_candidatures_par_mois`)
10.3. **Répartition par statut** — sur le mois en cours (`vue_stats_repartition_statut_mois_courant`)
10.4. **Taux de transformation** — retenues / total, par mois (`vue_stats_taux_transformation_mensuel`)
10.5. **Délai moyen de traitement** — en jours, par mois de réception (`vue_stats_delai_traitement`)
10.6. **Filtres du tableau de bord** — par période et/ou par direction (à construire — les vues actuelles ne filtrent pas par direction, à voir si besoin)

---

## Ce qui reste purement applicatif (aucune table à ajouter, juste des écrans/services à construire)

- Le processus de dépôt transactionnel (2.5 à 2.9)
- Le déclenchement de l'envoi automatique (8.4)
- Le pipeline OCR/NER (6.3) et son écran de validation (6.4)
- L'envoi technique des emails (8.5)
- Le calcul du score de matching (6.6)
- La synchronisation des domaines avec le site externe (5.1)
