### Module Recrutement — Découpage fonctionnel détaillé

Chaque bloc correspond à une fonctionnalité du module, avec les principaux écrans et actions associés.

1. Gestion des offres d'emploi

    1.1. CRUD des offres

    Consulter la liste des offres
    Consulter le détail d'une offre
    Créer une offre
    Modifier une offre
    Supprimer une offre
    Filtrer les offres par direction et statut

    1.2. Gestion du statut des offres
    Passer une offre de Brouillon à Publiée
    Clôturer une offre
    Empêcher le dépôt de nouvelles candidatures sur une offre clôturée

    1.3. Gestion des compétences requises
    Ajouter une compétence requise à une offre
    Modifier le niveau requis
    Supprimer une compétence requise
    Consulter les compétences requises d'une offre

    1.4. Gestion des missions
    Ajouter une mission à une offre
    Modifier une mission
    Supprimer une mission
    Réorganiser l'ordre des missions

    1.5. Génération du lien de candidature
    Générer un lien permettant d'accéder à une offre
    Permettre au candidat d'accéder à l'offre via ce lien
    Permettre le dépôt d'une candidature depuis l'offre

    1.6. Gestion des candidatures d'une offre
    Consulter les candidatures reçues
    Filtrer les candidats par statut
    Accéder à la fiche d'un candidat
    Accéder au vivier lié à la direction de l'offre

2. Dépôt de candidature

    2.1. Dépôt d'une candidature
    Déposer une candidature via le site externe
    Enregistrer une candidature manuellement par un RH

    2.2. Gestion du type de candidature
    Candidature sur une offre
    Candidature spontanée
    Sélectionner uniquement les offres publiées lors d'une candidature sur offre

    2.3. Gestion des informations candidat
    Saisir les informations personnelles
    Saisir le poste souhaité
    Saisir le message de candidature
    Sélectionner un domaine pour une candidature spontanée

    2.4. Gestion des documents
    Ajouter un document
    Importer un fichier
    Ajouter une photo d'un document
    Consulter les documents associés à la candidature

    2.5. Gestion des candidats existants
    Rechercher un candidat par email
    Réutiliser une fiche candidat existante
    Créer automatiquement une nouvelle fiche candidat si celui-ci n'existe pas

    2.6. Gestion du statut initial
    Créer automatiquement la candidature avec le statut Reçue
    Enregistrer le premier historique de statut

    2.7. Accusé de réception
    Identifier le modèle associé au statut Reçue
    Déclencher l'envoi automatique de l'accusé de réception

3. Gestion des candidatures

    3.1. CRUD / gestion des candidatures
    Consulter les candidatures
    Consulter le détail d'une candidature
    Modifier les informations d'une candidature
    Supprimer une candidature selon les droits
    Filtrer les candidatures

    3.2. Recherche et filtrage
    Filtrer par statut
    Filtrer par direction
    Filtrer par période
    Filtrer par canal de dépôt
    Filtrer par type de candidature

    3.3. Gestion des candidatures sur offre
    Direction → Offre → Candidatures
    Consulter les candidats d'une offre
    Filtrer les candidats par statut

    3.4. Gestion des candidatures spontanées
    Direction → Domaine → Candidatures
    Consulter les candidatures spontanées
    Filtrer les candidats par domaine

    3.5. Fiche candidat
    Consulter les informations personnelles
    Consulter le statut actuel
    Consulter l'historique des statuts
    Consulter les documents
    Consulter les compétences
    Consulter les expériences
    Consulter les formations
    Consulter les rendez-vous
    Consulter l'historique des communications
    Exporter la fiche candidat en PDF

    3.6. Gestion du statut des candidatures
    Modifier le statut d'une candidature
    Ajouter un commentaire lors du changement
    Enregistrer l'historique du changement
    Déclencher la communication associée au nouveau statut

    3.7. Recherche avancée des candidats
    Recherche par mots-clés dans les CV
    Recherche par compétences
    Combinaison de plusieurs critères de recherche

4. Gestion du vivier

    4.1. Gestion du vivier
    Ajouter un candidat au vivier
    Retirer un candidat du vivier
    Consulter les candidats du vivier

    4.2. Recherche dans le vivier
    Rechercher par compétence
    Rechercher par domaine
    Rechercher par direction

    4.3. Vivier depuis une offre
    Consulter le vivier associé à la direction d'une offre
    Afficher les candidats provenant des candidatures sur offre et spontanées

5. Gestion des domaines

    5.1. Consultation des domaines
    Consulter les domaines valides
    Filtrer les domaines par direction
    Utiliser les domaines dans le formulaire de candidature spontanée

    5.2. Gestion des domaines
    Ajouter un domaine
    Modifier un domaine
    Rattacher un domaine à une direction
    Valider un domaine
    Consulter les domaines en attente de validation

    5.3. Gestion du domaine « Autre »
    Permettre la saisie d'un domaine non présent dans le référentiel
    Créer le domaine avec valide = false
    Affecter le domaine à une direction par défaut
    Permettre au RH de le corriger et de le valider

    5.4. Synchronisation avec le site externe
    Exposer les domaines valides au site externe
    Permettre au site externe de récupérer la liste des domaines

6. Gestion des compétences, expériences et formations

    6.1. CRUD du référentiel de compétences
    Ajouter une compétence
    Modifier une compétence
    Supprimer une compétence
    Consulter les compétences

    6.2. Gestion des compétences candidat
    Ajouter une compétence
    Modifier une compétence
    Supprimer une compétence
    Valider une compétence extraite automatiquement

    6.3. Gestion des expériences professionnelles
    Ajouter une expérience
    Modifier une expérience
    Supprimer une expérience
    Valider une expérience extraite automatiquement

    6.4. Gestion des formations
    Ajouter une formation
    Modifier une formation
    Supprimer une formation
    Valider une formation extraite automatiquement

    6.5. Extraction automatique des données CV
    Extraire les informations d'un CV
    Identifier les compétences
    Identifier les expériences
    Identifier les formations
    Associer les compétences au référentiel via pg_trgm et competence_alias
    Enregistrer les données extraites avec valide = false

    6.6. Validation des données extraites
    Consulter les éléments extraits
    Consulter le score de confiance
    Valider une donnée
    Modifier une donnée
    Rejeter une donnée

    6.7. Compétences requises d'une offre
    Ajouter une compétence requise
    Modifier le niveau requis
    Supprimer une compétence requise
    Consulter les compétences requises

    6.8. Matching candidat / offre
    Comparer les compétences du candidat avec celles demandées par l'offre
    Calculer un score de correspondance
    Classer les candidats selon leur score

    Fonctionnalité non prioritaire pour la V1.

7. Gestion des rendez-vous

    7.1. CRUD des rendez-vous
    Planifier un rendez-vous
    Consulter un rendez-vous
    Modifier un rendez-vous
    Supprimer / annuler un rendez-vous

    7.2. Gestion du type de rendez-vous
    Test
    Entretien

    7.3. Gestion du rendez-vous
    Affecter un responsable
    Définir la date et l'heure
    Définir le mode de réalisation
    Définir le lieu ou le lien de visioconférence
    Ajouter un commentaire

    7.4. Gestion du statut
    Mettre un rendez-vous À venir
    Marquer un rendez-vous comme Réalisé
    Marquer un rendez-vous comme Annulé

    7.5. Agenda
    Consulter les rendez-vous d'un utilisateur
    Consulter les rendez-vous d'une candidature
    Consulter les rendez-vous par période

    7.6. Communication liée au rendez-vous
    Sélectionner un modèle de convocation
    Personnaliser la convocation
    Envoyer la convocation au candidat

8. Gestion des communications

    8.1. Gestion des communications
    Consulter l'historique des communications
    Consulter une communication
    Envoyer une communication manuellement

    8.2. Gestion des modèles de communication
    Sélectionner un modèle
    Préremplir l'objet et le contenu
    Personnaliser le message avant l'envoi

    8.3. Types de communication
    Accusé de réception
    Convocation
    Demande d'information
    Demande de document
    Issue du recrutement
    Autre

    8.4. Envoi automatique
    Identifier le modèle associé au statut
    Générer automatiquement la communication
    Enregistrer la communication avec mode_envoi = 'auto'

    8.5. Envoi manuel
    Rédiger ou personnaliser un message
    Envoyer le message
    Enregistrer l'utilisateur ayant effectué l'envoi

    8.6. Historique
    Consulter les communications depuis la fiche candidat
    Consulter le type de communication
    Consulter la date d'envoi
    Consulter le contenu envoyé

9. Paramétrage des modèles de communication

    9.1. CRUD des modèles
    Ajouter un modèle
    Consulter un modèle
    Modifier un modèle
    Supprimer un modèle

    9.2. Gestion de l'état du modèle
    Activer un modèle
    Désactiver un modèle

    9.3. Configuration de l'envoi automatique
    Activer / désactiver l'envoi automatique
    Associer un modèle à un statut de candidature
    Contrôler qu'un seul modèle automatique actif soit associé à un statut

    9.4. Personnalisation des modèles
    Définir l'objet
    Définir le contenu
    Utiliser des variables telles que {{nom_candidat}}

10. Tableau de bord

    10.1. Indicateurs
    Nombre de candidatures sur offre
    Nombre d'offres en cours
    Nombre de candidatures spontanées

    10.2. Statistiques
    Évolution mensuelle des candidatures
    Répartition des candidatures par statut
    Taux de transformation
    Délai moyen de traitement

    10.3. Filtrage du tableau de bord
    Filtrer par période
    Filtrer par direction
    Filtrer les indicateurs et graphiques selon les critères sélectionnés
    Fonctionnalités purement applicatives

    Certaines fonctionnalités ne nécessitent pas de nouvelle table :

    Processus de dépôt d'une candidature
    Détection d'un candidat existant
    Déclenchement automatique des communications
    Envoi réel des emails
    Pipeline OCR
    Extraction NER des CV
    Matching candidat/offre
    Synchronisation avec le site externe
    Génération des liens de candidature
    Export PDF
    Et pour ton cas

