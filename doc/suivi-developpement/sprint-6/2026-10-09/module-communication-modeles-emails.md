# Fiche de Développement : Module de Communication & Modèles d'E-mails (Sprint 6)

## 📌 Informations Générales
- **Sprint :** Sprint 6 (Rendez-vous, communications, automatisation et modèles)
- **Date :** 2026-10-09
- **Auteur :** Antigravity AI / Équipe Projet Soutenance AlpA Ciment
- **Statut :** Terminé (100%)

---

## 🎯 Contexte & Objectifs

Pour fluidifier le travail de recrutement et la relation avec les candidats, le système devait intégrer :
1. La gestion complète des **modèles de communication** personnalisables (`modele_message`), avec prise en charge de variables dynamiques (`{nom}`, `{prenom}`, `{poste}`, `{direction}`, `{date_rdv}`, `{heure_rdv}`, `{mode_rdv}`, `{lieu_rdv}`, `{date_jour}`).
2. L'envoi automatique d'**accusés de réception** par email dès le dépôt d'une candidature.
3. L'envoi automatique de **convocations** détaillées (tests et entretiens) lors de la planification d'un créneau dans l'agenda RH.
4. L'envoi **manuel personnalisé** de messages depuis le dossier d'un candidat avec conservation de l'historique complet dans la table `communication` et traçabilité dans le journal d'audit (`audit_log`).
5. Une interface web dédiée dans le portail RH avec simulation / prévisualisation instantanée du message résolu avec les données réelles du candidat.

---

## 🧱 Architecture & Implémentation

### 1. Base de données & Données de référence
Les tables exploitées sont :
- `type_message` : Accusé de réception, Convocation, Demande information, Demande document, Issue recrutement, Autre.
- `modele_message` : Templates avec objet, contenu dynamique, rattachement éventuel à un statut (`id_statut_candidature`) et drapeau `envoi_automatique`.
- `communication` : Historique d'envoi conservant le contenu réel et figé, le mode (`auto` ou `manuel`), le destinataire et le recruteur expéditeur.
- Le script maître `sql/gestion_recrutement.sql` a été enrichi avec 5 modèles d'e-mails par défaut.

### 2. Couche Backend Laravel
- **Modèles Eloquent** :
  - [`TypeMessage.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Models/TypeMessage.php)
  - [`ModeleMessage.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Models/ModeleMessage.php)
  - [`Communication.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Models/Communication.php)
- **Mailable responsive** :
  - [`CandidatureCommunicationMail.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Mail/CandidatureCommunicationMail.php) et vue Blade [`candidature_communication.blade.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/resources/views/emails/candidature_communication.blade.php).
- **Service métier** :
  - [`CommunicationService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Services/CommunicationService.php) :
    - `remplacerVariables(texte, candidature, rdv)` : moteur d'interpolation Regex tolérant les syntaxes `{variable}` et `{{variable}}`.
    - `envoyerMessage(idCandidature, data, idUtilisateur)` : création dans `communication`, envoi via `Mail::to()`, journalisation dans `audit_log`.
    - `envoyerConvocation(rdv)` : sélectionne automatiquement le modèle de test ou d'entretien et injecte les horaires, modes et consignes.
    - `envoyerAccuseReception(candidature)` : déclenché automatiquement après un dépôt sur offre ou spontané.
- **Contrôleurs RESTful** :
  - [`ModeleMessageController.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Http/Controllers/Api/ModeleMessageController.php) (CRUD des templates, référentiels, endpoint de test d'aperçu `/api/modeles-messages/apercu`).
  - [`CommunicationController.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Http/Controllers/Api/CommunicationController.php) (historique et envoi direct par candidature).

### 3. Couche Frontend React
- **Page Modèles d'emails** ([`ModelesEmailsView.jsx`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement-react/src/pages/ModelesEmailsView.jsx)) :
  - Filtrage par type et par statut actif/inactif.
  - Cartes synthétiques des templates.
  - Modal d'édition avec badges de variables cliquables pour insertion rapide.
  - Modal d'aperçu en direct simulant le rendu sur une candidature existante.
- **Modal d'envoi d'e-mail au candidat** ([`EnvoyerMessageModal.jsx`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement-react/src/components/modals/EnvoyerMessageModal.jsx)) :
  - Pré-remplissage dynamique lors du choix d'un modèle et personnalisation libre avant envoi.
- **Onglet Communications** dans [`CandidatureDetailView.jsx`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement-react/src/pages/CandidatureDetailView.jsx) :
  - Historique chronologique avec badges sémantiques (Automatique / Manuel), sujet, expéditeur et contenu complet.
- **Intégration dans la modale RDV** ([`RendezVousModal.jsx`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement-react/src/components/modals/RendezVousModal.jsx)) :
  - Case à cocher "Envoyer automatiquement une convocation par e-mail au candidat avec les détails du créneau".

---

## 🔬 Justification Technologique

- **Laravel Mailable & Blade Components** : standard éprouvé assurant la compatibilité avec tous les clients de messagerie (Outlook, Gmail, Apple Mail) avec séparation claire entre logique de données et rendu graphique.
- **Remplacement de balises basé sur Regex (PCRE)** : permet une souplesse totale pour les recruteurs (insensibilité à la casse, espaces facultatifs, support des accolades simples `{nom}` ou doubles `{{nom}}`).
- **Stockage figé dans `communication`** : garantit l'inviolabilité juridique et l'auditabilité : même si un modèle d'e-mail est modifié plus tard, la version historique envoyée au candidat ne change jamais.

---

## ✅ Tests & Vérifications

1. **Tests unitaires et fonctionnels** :
   - Suite [`CommunicationTest.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/tests/Feature/Api/CommunicationTest.php) : 4/4 tests validés.
   - Suite complète : `php artisan test` -> **25/25 tests passés (96 assertions)**.
2. **Compilation Frontend** :
   - `npm run build` exécuté avec succès en 838ms (0 erreur).
3. **Synchronisation Base de données** :
   - Fichier maître [`sql/gestion_recrutement.sql`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/sql/gestion_recrutement.sql) synchronisé avec les données de départ.
