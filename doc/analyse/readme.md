Dashboard
•	Affichage du nombre de candidatures reçues sur offre
•	Affichage des offres d’emploi en cours
•	Nombre des candidatures spontanées
•	Statistiques du recrutement (mois)

Gestion d offre d emploi
•	Création d’une nouvelle offre d’emploi
Titre du poste ,direction ,date publication ,date limite ,status(automatique)
•	Modification des informations relatives à une offre 
•	Publication et clôture d’une offre
•	Génération d’un lien permettant aux candidats d’accéder à l’offre et de postuler en ligne
???? faut demander également les url des offres qu on a 
•	Consultation du nombre de candidatures reçues pour chaque offre
Pre requis : Recuperation api pour CRUD offre d emploi 
	Comment tester l api et tout
	Comment envoyer des donnes depuis notre site hors ligne au site en ligne
Depot Candidature
•	Accès au formulaire de candidature à partir du lien associé à l’offre
•	Saisie des informations personnelles du candidat
•	Dépôt du  CV et des autres documents nécessaires
•	Enregistrement automatique de la candidature à l’offre correspondante
Comment faire pour savoir qu il a envoyer une demande
•	Envoi automatique d’un accusé de réception au candidat
•	Intégration des candidatures déposées en format papier afin de centraliser l’ensemble des dossiers ( au cas où)
Pre requis : 2 choix : Recuperation des donnees via email 			Recuperation des donnees via api

Gestion Candidature
•	Recherche d’un candidat par différents critères 
•	Consultation du dossier des candidats
•	Affichage du statut de chaque candidature
•	Conservation de l’historique des étapes suivies par le candidat 

		Sur offre :
•	Affichage de la liste des offres et du nombre de candidatures reçues pour chacune d’elles
•	Consultation de l’ensemble des candidats ayant postulé à une offre
•	Consultation des CV et autres documents du candidat
•	Mise à jour du statut de la candidature : reçue, présélectionnée, test, entretien, retenue ou non retenue
•	Accès aux actions liées à la candidature : planification d’un test, planification d’un entretien et communication avec le candidat

        Spontanée :
•	Accès au formulaire de candidature spontanée sur le site
•	Enregistrement automatique des candidatures reçues et accusé de réception
•	Classement des candidatures par domaine d’activité
•	Permettre la consultation des profils disponible lors de futurs besoins en recrutement (Vivier)
•	Possibilité de rechercher et de filtrer les profils selon le domaine recherché
Pre requis : OCR a utiliser : fast api tesseract ,spacy
				IA 
				
	


Planification test et entretien 
•	Planification d’un test ou d’un entretien depuis la fiche du candidat
•	Enregistrement de la date et de l’heure
•	Indication du lieu ou du mode de réalisation
•	Consultation de l’ensemble des tests et entretiens dans un calendrier
•	Modification, reprogrammation ou annulation d’un rendez-vous
•	Suivi du statut : à venir, réalisé ou annulé

Gestion communication & Settings
•	Mise à disposition de modèles de messages prédéfinis :
Envoi automatique d’un accusé de réception lors du dépôt d’une candidature
		Envoi de convocations aux tests et aux entretiens
	Envoi de demandes d’informations ou de documents complémentaires ( au cas où)
	Envoi des notifications relatives à l’issu du recrutement 
•	Possibilité de personnaliser un modèle avant son envoi
•	Conservation de l’historique des communications avec chaque candidat
•	Settings pour messages a envoyer selon :Accuser de réception ,Convocation test ,ensuite le message a envoyer ,et si c est automatique ou manuel

Pre requis : automatisation des envoies des emails et tout
	Settings pour messages a envoyer selon :Accuser de réception ,Convocation test ,ensuite le message a envoyer ,et si c est automatique ou manuel
