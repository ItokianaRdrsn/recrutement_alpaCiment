# 2026-10-09 - Planification des Rendez-vous RH & Agenda FullCalendar

## Date

2026-10-09

## Tâche

Implémentation complète de la gestion des rendez-vous RH (tests techniques et entretiens) avec agenda interactif FullCalendar dans le front-office React, contrôleurs et services API Laravel, synchronisation bidirectionnelle avec les candidatures, traçabilité par Audit Log et respect de la règle de synchronisation SQL.

## Pourquoi faire cela

Dans le cadre du processus de recrutement AlpA Ciment, les recruteurs et managers doivent convoquer les candidats pré-sélectionnés à des tests d'évaluation et des entretiens d'embauche. Il est essentiel de :
1. Offrir un agenda visuel et interactif (vues Mois, Semaine, Jour) permettant de visualiser immédiatement les disponibilités des recruteurs et les créneaux d'évaluation.
2. Permettre la reprogrammation rapide par glisser-déposer (`eventDrop`) et ajustement de durée (`eventResize`).
3. Intégrer la planification directement au sein de la fiche détaillée d'un candidat pour faciliter la transition du workflow (ex. passage au statut *Test technique* ou *Entretien*).
4. Journaliser toute planification, modification, reprogrammation ou annulation dans le journal d'audit (`audit_log`).

## Actions réalisées

- Création des modèles Eloquent `RendezVous`, `TypeRendezVous`, `StatutRendezVous` et `ModeRealisation`.
- Établissement de la relation `rendezVous()` (hasMany) dans le modèle `Candidature`.
- Développement du service métier `RendezVousService` avec validation stricte des horaires (`date_fin > date_debut`), mise à jour synchronisée du statut de la candidature et traçabilité via `AuditLogService` (`PLANIFICATION_RDV`, `MODIFICATION_RDV`, `ANNULATION_RDV`, `SUPPRESSION_RDV`).
- Création de la ressource JSON `RendezVousResource` et du contrôleur `RendezVousController` exposant l'API REST complète (`index`, `store`, `show`, `update`, `cancel`, `destroy`, `referentiels`).
- Installation et intégration de la suite FullCalendar v6 (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`) avec support du glisser-déposer, redimensionnement et localisation française.
- Création du composant React `AgendaView.jsx` avec barre d'outils de filtres (type, statut, mode, responsable RH), codes couleur distinctifs et navigation fluide.
- Création de la modale réutilisable `RendezVousModal.jsx` (utilisée à la fois depuis l'agenda global et directement depuis la fiche candidat).
- Ajout de l'onglet *Rendez-vous* dans `CandidatureDetailView.jsx` affichant la chronologie des rendez-vous du candidat et permettant la prise de rendez-vous en un clic.
- Ajout de l'accès à l'agenda dans la barre latérale `AppShell.jsx` et du routage dans `main.jsx`.
- Rédaction et validation des tests automatisés PHPUnit `RendezVousTest.php`.
- Vérification de la synchronisation du script maître `sql/gestion_recrutement.sql`.

## Fichiers créés ou modifiés

### Fichiers créés

- `code_source/recrutement/app/Models/RendezVous.php` : modèle Eloquent pour la table `rendez_vous`.
- `code_source/recrutement/app/Models/TypeRendezVous.php` : modèle pour le référentiel des types de rendez-vous (Test, Entretien).
- `code_source/recrutement/app/Models/StatutRendezVous.php` : modèle pour les statuts de rendez-vous (A venir, Réalisé, Annulé).
- `code_source/recrutement/app/Models/ModeRealisation.php` : modèle pour les modes de réalisation (Présentiel, Visioconférence, Téléphone).
- `code_source/recrutement/app/Http/Resources/RendezVousResource.php` : ressource API formatant les rendez-vous avec les informations du candidat et du responsable.
- `code_source/recrutement/app/Services/RendezVousService.php` : service métier gérant la planification, les contrôles et les logs d'audit.
- `code_source/recrutement/app/Http/Controllers/Api/RendezVousController.php` : contrôleur API REST pour les rendez-vous.
- `code_source/recrutement/tests/Feature/Api/RendezVousTest.php` : suite de tests automatisés PHPUnit pour les rendez-vous et l'audit.
- `code_source/recrutement-react/src/components/modals/RendezVousModal.jsx` : modale React pour la planification et modification de rendez-vous.
- `code_source/recrutement-react/src/pages/AgendaView.jsx` : vue principale de l'agenda interactif FullCalendar.

### Fichiers modifiés

- `code_source/recrutement/app/Models/Candidature.php` : ajout de la relation `rendezVous()`.
- `code_source/recrutement/routes/api.php` : enregistrement des routes de l'API rendez-vous.
- `code_source/recrutement-react/package.json` : ajout des dépendances FullCalendar v6.
- `code_source/recrutement-react/src/components/layout/AppShell.jsx` : ajout du lien Agenda dans le menu latéral.
- `code_source/recrutement-react/src/main.jsx` : configuration du lazy loading et de la route `/agenda`.
- `code_source/recrutement-react/src/pages/CandidatureDetailView.jsx` : intégration de l'onglet *Rendez-vous & Entretiens*.

## Explication du code

### Service `RendezVousService`
Le service encapsule toutes les opérations transactionnelles :
- Il vérifie la validité chronologique des créneaux (`date_fin > date_debut`).
- Lors de la création, si l'option `id_statut_candidature_cible` est transmise, il fait évoluer le statut de la candidature et enregistre une entrée dans `historique_statut`.
- Il génère automatiquement les entrées d'audit correspondantes via `AuditLogService` avec l'ID du recruteur responsable.

### Interface React & FullCalendar (`AgendaView.jsx`)
L'agenda intègre les vues Mois, Semaine et Jour avec un créneau horaire configuré de 07h à 20h :
- **Affichage ciblé sans heure brute** : l'option `displayEventTime={false}` masque les heures brutes sur les étiquettes pour préserver l'espace. Le libellé affiche la **direction** et le **prénom** du candidat (ex. `[IT] Faniry (Entretien)`).
- **Gestion des créneaux multiples / simultanés** : activation de `dayMaxEvents={2}`, `dayMaxEventRows={true}` et `moreLinkClick="popover"` pour éviter le débordement lors de rendez-vous simultanés et afficher un popover "+N autres".
- **Code couleur sémantique** : Bleu pour Entretien, Violet pour Test, Vert pour Réalisé, Gris pour Annulé.
- **Glisser-déposer & redimensionnement** : déclenchement de `eventDrop` et `eventResize` appelant `PUT /api/rendez-vous/{id}` avec confirmation.

## Explication simple

Les recruteurs disposent maintenant d'un véritable agenda partagé interactif dans le portail RH. Ils peuvent planifier un test technique ou un entretien d'embauche en quelques secondes, voir tous les rendez-vous sous forme de calendrier, déplacer un créneau par glisser-déposer, ou planifier directement un rendez-vous depuis le dossier d'un candidat.

## Justification technique

- **FullCalendar v6** : bibliothèque standard de l'industrie, offrant des performances de rendu élevées sur de grands volumes d'événements, une excellente gestion du responsive et une compatibilité native avec les navigateurs modernes.
- **Validation temporelle en amont (Backend + DB)** : contrainte `CHECK (date_fin > date_debut)` en base PostgreSQL et validation dans `RendezVousService` pour prévenir toute incohérence d'horaire.
- **Synchronisation transactionnelle du statut candidat** : l'utilisation de transactions SQL `DB::transaction()` garantit qu'en cas d'erreur de planification, la candidature ne reste pas dans un état incohérent.

## Sources

- `[S1]` FullCalendar React Documentation : https://fullcalendar.io/docs/react
- `[S2]` Laravel Eloquent Relationships : https://laravel.com/docs/11.x/eloquent-relationships

## Vérifications

- Tests PHPUnit : `php artisan test` (21/21 tests passés avec succès, 73 assertions).
- Compilation frontend : `npm run build` (succès en 731ms, 0 erreur).
- Script SQL maître : `sql/gestion_recrutement.sql` vérifié conforme avec les tables `type_rendez_vous`, `statut_rendez_vous`, `mode_realisation`, et `rendez_vous`.

## Suite logique

Poursuite des fonctionnalités du Sprint 6 :
1. Module de communication (CRUD des modèles d'emails personnalisables avec variables dynamiques).
2. Configuration du serveur SMTP Gmail et envoi d'emails réels de convocation et accusé de réception.
