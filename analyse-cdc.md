###  1. Dashboard
    Fonctionnalités
    Affichage du nombre de candidatures reçues par offre
    Affichage des offres d'emploi en cours
    Affichage du nombre de candidatures spontanées
    Affichage des statistiques de recrutement par mois
    À déterminer plus tard
    Quels graphiques ?
    Quelle période ?
    Quelles statistiques exactement ?
       
###  2. Gestion des offres d'emploi  -> A ETUDIER
    Fonctionnalités
    CRUD OFFRE D emploi

    Création:

        Colonne :

        Titre du poste
        Direction
        Date de publication
        Date limite
        Statut automatique:

            BROUILLON
                ↓
            PUBLIÉE
                ↓
            CLÔTURÉE

    Le statut ne devrait donc pas être choisi manuellement.

    Modification:

        Permettre de modifier :

        titre
        direction
        date de publication
        date limite

        Il faudra cependant décider plus tard ce qui est modifiable après publication.

        Publication
        Brouillon → Publiée
        Clôture
        Publiée → Clôturée
        Lien de candidature


###    3. Prérequis  — Gestion des offres -> A ETUDIER


    Permettre au RH de récupérer/copier le lien public de l'offre.

    ⚠️ Question à poser au gestionnaire du site :

    Comment sont générées les URL publiques des offres et pouvons-nous récupérer les URL des offres existantes via l'API ?

    Donc oui, ta remarque :

    « faut demander également les URL des offres qu'on a »

    est très pertinente.

    Il faut même demander les identifiants des offres existantes + leurs URLs, car ton application devra probablement faire correspondre :

    Notre offre
        ↕
    Offre du site externe

    Par exemple :

    Notre DB
    ------------------
    id = 15
    external_id = 237
    url = https://site.com/offres/237
    Nombre de candidatures

    Afficher :

    Développeur Laravel
    12 candidatures

    Mais il faut savoir si ce nombre vient :

    de l'API ;
    des candidatures que ton application importe ;
    ou d'une autre source.

    Ici, je séparerais clairement tes questions.

    A. API disponible ?

    Demander :

    documentation API ;
    authentification ;
    endpoints disponibles ;
    CRUD des offres ;
    publication ;
    clôture ;
    récupération des offres ;
    récupération des URLs ;
    récupération du nombre de candidatures.
    B. Communication Local → Online

    Ta question :

    Comment envoyer des données depuis notre site hors ligne au site en ligne ?

    Il faut plutôt l'écrire techniquement :

    Comment notre application pourra-t-elle communiquer avec le site en ligne afin de créer, modifier, publier et clôturer les offres via l'API ?

    Et ensuite, lors du développement, on testera avec Postman avant d'intégrer l'API dans Laravel.

###  4. Dépôt de candidature -> A ETUDIER

    Ici, ton cahier des charges est correct, mais il manque une information essentielle.

    Fonctionnalités
    Accéder au formulaire via le lien de l'offre
    Saisir les informations personnelles
    Déposer CV
    Déposer les documents
    Enregistrer la candidature pour l'offre correspondante
    Envoyer un accusé de réception
    Intégrer les candidatures papier
    ⚠️ Question importante

    Tu as écrit :

    Comment faire pour savoir qu'il a envoyé une demande

    C'est exactement la question à poser au gestionnaire du site.

    Il faut savoir si le site propose :

    Option 1 — Webhook
    Candidat
    ↓
    Site
    ↓
    Candidature
    ↓
    Webhook
    ↓
    Notre Laravel

    Notre application est donc prévenue immédiatement.

    Option 2 — API
    Notre Laravel
    ↓
    GET candidatures
    ↓
    Site
    ↓
    Nouvelles candidatures

    Notre application vérifie régulièrement.

    Option 3 — Email
    Site
    ↓
    Email
    ↓
    Boîte mail
    ↓
    Notre application

    Et elle récupère les informations + pièces jointes.

    Donc ton prérequis devient :

    Déterminer le mécanisme de récupération des candidatures : API, webhook ou email.
        
###  5. Gestion des candidatures liste des candidatures


    Général
    Liste candidatures avec pagination
    Recherche d'un candidat
    Filtrage (type,date,status,offre/poste)
    tableau liste candiatures :
        colonne:
        candidat
        Offre/Poste(le nom de l OFFRE ou du poste)
        Type(offre ou spontannee)
        Date de candidature
        Statut de candidature
        Consultation documents

    Statuts :

    REÇUE
    ↓
    PRÉSÉLECTIONNÉE
    ↓
    PLANIFIER TEST
    ↓
    PLANIFIER ENTRETIEN
    ↓
    RETENUE



    ou :

    REÇUE
    ↓
    PRÉSÉLECTIONNÉE
    ↓
    NON RETENUE

    Et surtout :

    conservation de l'historique des changements de statut.

    Exemple :

    13/08  Reçue
    14/08  Présélectionnée
    17/08  Test
    21/08  Entretien
    25/08  Retenue

###  6. Candidatures sur offre

    POUR LE VIVIER ,AVOIR un bouton vivier pour voir tous les viviers
    A Faire faire un matching sur le poste
    Faire recherche avant sur les competences

    listes des directions : Comptables,IT,Achat
        lorsqu on clique dessus ,menu deroulante avec comme option:
            tous (toutes les offres lier a cette direction)
            afficher les noms des offres avec leur date(ceux qui ne sont pas encore cloturee)
            bouton voir plus(les offres des cloturees)

    maintenant apres avoir choisi la directions et une otpion ,exemple tous:
        list des candidats: candidate ,date ,status ,actions (voir fiche ,document ,crud??)
        dans la fiche candidat:
            information dessus (avec photo si possible ):nom ,email,status actule(entretien,...)
            voir ou telecharger document 
            changer status(preselectionner ,planifier test,planifier entretien, recue)
            communiquer(si c est pas automatique dans les params ou si on peut envoyer un autre email)


###  7. Candidatures spontanées -> a etudier pour savoir le domaine car on met poste souhaiter et je pense qu il faut relier a un poste ensuite mettre une colonne poste souhaiter aussi


    formulaire de candidature spontanée ;
    réception automatique ;
    accusé de réception ;
    classement par domaine ;
    ajout au vivier ;
    recherche ;
    filtrage.

    Puis :

    Candidature spontanée
            ↓
    CV
            ↓
    OCR
            ↓
    Extraction des informations
            ↓
    Profil candidat
            ↓
    Vivier
    OCR

    Ton architecture envisagée :

    Laravel
    ↓
    FastAPI
    ↓
    Tesseract
    ↓
    spaCy
    ↓
    Résultat

    Et l'IA peut éventuellement intervenir ensuite.

    ⚠️ Je mettrais IA / matching candidat-offre comme fonctionnalité à confirmer, car ce n'est pas complètement défini dans ton cahier des charges actuel.

###  7. Planification

    Très bien :

    Test / Entretien

    Planifier
        Date
        Heure
        Lieu / visioconférence
        Responsable => recherche de nom et on lui envoit un email une heure avant 
    Modifier
        Reprogrammer
        Annuler
        Statut


    Statuts :

        À VENIR
        RÉALISÉ
        ANNULÉ

    Et calendrier global :

            AOÛT 2026

    Lun  Mar  Mer  Jeu  Ven
            12   13   14
                │
                ├── 10h Test - Jean
                └── 15h Entretien - Paul

###  8. Communication & Settings

    Je fusionnerais effectivement ces deux parties.

    Templates

    Tu auras par exemple :

    ACCUSÉ DE RÉCEPTION
    CONVOCATION TEST
    CONVOCATION ENTRETIEN
    DEMANDE DE DOCUMENT
    RETENUE
    NON RETENUE
    Chaque template possède
    Nom
    Objet
    Corps du message
    Actif
    Automatique / Manuel

    Exemple :

    Template : Accusé réception

    Objet :
    Candidature reçue - {{offre}}

    Message :
    Bonjour {{prenom}},

    Nous avons bien reçu votre candidature
    pour le poste {{offre}}.

    Cordialement...

###  9. Automatisation

    Tu as :

    Pre requis : automatisation des envois des emails

    On peut définir :

    Automatique
    Candidature reçue
        ↓
    Event Laravel
        ↓
    Job
        ↓
    Email
    Manuel
    Candidature reçue
        ↓
    RH consulte
        ↓
    [Envoyer accusé]
        ↓
    Email
    Programmation

    Pour un email envoyé à une date donnée :

    Cron
    ↓
    Laravel Scheduler
    ↓
    Queue
    ↓
    Email

    Donc :

    Laravel Events + Queue + Scheduler + Cron suffisent pour ton besoin initial. Pas besoin d'Airflow.

###  10. Ton cahier des charges propre

    Je le structurerais finalement comme ceci :

    1. DASHBOARD
    ├── Candidatures par offre
    ├── Offres en cours
    ├── Candidatures spontanées
    └── Statistiques mensuelles

    2. GESTION DES OFFRES
    ├── Créer
    ├── Modifier
    ├── Publier
    ├── Clôturer
    ├── Récupérer/générer lien
    └── Nombre candidatures

    3. DÉPÔT CANDIDATURE
    ├── Candidature sur offre
    ├── Candidature spontanée
    ├── Informations candidat
    ├── CV
    ├── Documents
    └── Accusé réception

    4. GESTION DES CANDIDATURES
    ├── Recherche
    ├── Filtrage
    ├── Dossier candidat
    ├── CV/Documents
    ├── Statuts
    └── Historique

    5. VIVIER
    ├── Classement par domaine
    ├── Recherche
    └── Filtrage

    6. PLANIFICATION
    ├── Tests
    ├── Entretiens
    ├── Calendrier
    ├── Modification
    ├── Reprogrammation
    └── Annulation

    7. COMMUNICATION
    ├── Templates
    ├── Envoi
    ├── Personnalisation
    └── Historique

    8. SETTINGS
    ├── Templates
    ├── Automatique / manuel
    └── Activation / désactivation

    9. OCR / IA
    ├── OCR CV
    ├── Extraction
    ├── Classification
    └── IA / matching (à confirmer)

    10. INTÉGRATIONS
        ├── API site externe
        ├── Récupération candidatures
        ├── Webhooks éventuels
        ├── Email
        └── FastAPI
    Et surtout : tes 3 grosses inconnues externes

    Avant de figer l'architecture, il faut obtenir du gestionnaire du site :

    ① OFFRES

    Comment notre application crée/modifie/publie/clôture une offre et récupère son URL ?

    ② CANDIDATURES

    Comment notre application est-elle informée d'une nouvelle candidature et récupère-t-elle les données + CV + documents ?

    ③ OFFRES EXISTANTES

    Pouvez-vous nous fournir les identifiants et URL des offres actuellement présentes sur le site afin de les associer à notre future application ?

    Une fois qu'on a ces réponses, on pourra passer de ton cahier des charges à l'analyse des écrans, puis au MCD, sans construire quelque chose qui devra être refait à cause des contraintes du site externe.

