**ESTIMATION DE STAGE ETU003346**			
**Estimation en jours**			
	**Tâches**	**Estimation**	
**Sprint 0**	**Analyse, cadrage et conception**		
	Analyse du cahier des charges et définition du périmètre V1	2	
	Identification des modules fonctionnels du recrutement	1.5	
	Analyse des parcours candidat / RH / admin	1.5	
	Conception du MCD / MLD et des règles métier	2	
	Conception de l'architecture Laravel / React / PostgreSQL / FastAPI	1.5	
	Planification du projet et préparation de l'environnement	1.5	
	**Sous-total**	**10**	
			
**Sprint 1**	**Socle technique, sécurité et référentiels de base**		
	BACK-OFFICE / API		
	Configuration du projet Laravel et de l'environnement PostgreSQL	1	
	Mise en place des migrations principales et des seeders	1.5	
	Mise en place de l'architecture API REST	1	
	Authentification et gestion des rôles RH / admin / manager	2	
	FRONT-OFFICE / INTERFACE		
	Installation de React avec Vite et structure de navigation	1	
	Intégration de la mise en page générale du back-office	1	
	Tests et debug	0.5	
	**Sous-total**	**8**	
			
**Sprint 2**	**Gestion des offres, directions et domaines**		
	BACK-OFFICE		
	CRUD des directions	0.5	
	CRUD des domaines et validation des domaines en attente	1	
	CRUD des offres d'emploi	2	
	Gestion du statut des offres : brouillon, publiée, clôturée	1	
	Gestion du profil, des missions et des formations requises	1.5	
	Gestion des compétences requises par offre	1	
	FRONT-OFFICE / API		
	Affichage des offres publiées et génération du lien de candidature	1	
	Tests et debug	1	
	**Sous-total**	**9**	
			
**Sprint 3**	**Dépôt et réception des candidatures**		
	FRONT-OFFICE		
	Formulaire de candidature sur offre	1.5	
	Formulaire de candidature spontanée avec domaine ou autre domaine	1.5	
	Upload des CV, photos et documents	1	
	BACK-OFFICE		
	Saisie manuelle d'une candidature par un RH	1	
	API / SERVICES		
	Détection d'un candidat existant et dédoublonnage par email	1	
	Création transactionnelle : candidat, candidature, statut initial, historique	2	
	Préparation de la réception/import depuis le site externe	0.5	
	Accusé de réception et première communication automatique	0.5	
	Tests et debug	1	
	**Sous-total**	**10**	
			
**Sprint 4**	**Gestion RH des candidatures et fiche candidat**		
	BACK-OFFICE		
	Liste générale des candidatures avec pagination	1	
	Recherche et filtres : statut, direction, période, canal, type	1	
	Gestion des candidatures sur offre : Direction -> Offre -> Candidats	1	
	Gestion des candidatures spontanées : Direction -> Domaine -> Candidatures	1	
	Fiche candidat : informations, documents, statut, historique statuts et communications	2	
	Changement de statut avec commentaire et historique	1.5	
	Export PDF de la fiche candidat	0.5	
	Tests et debug	1	
	**Sous-total**	**9**	
			
**Sprint 5**	**Vivier, compétences et validation CV**		
	BACK-OFFICE		
	Gestion du vivier : ajout, retrait, consultation	1	
	Recherche dans le vivier par compétence, domaine et direction	1	
	CRUD du référentiel des compétences	1	
	Gestion manuelle des compétences, expériences et formations candidat	1.5	
	OCR / IA		
	Intégration FastAPI et extraction OCR avec PaddleOCR	1.5	
	Extraction des compétences, expériences et formations depuis le CV	1	
	Validation, correction et rejet des données extraites	1	
	Tests et debug	1	
	**Sous-total**	**9**	
			
**Sprint 6**	**Rendez-vous, communications et modèles**		
	BACK-OFFICE		
	CRUD des rendez-vous : test, entretien, statut, mode, responsable	2	
	Vue agenda par utilisateur, candidature et période	1	
	Communication liée aux rendez-vous	1	
	CRUD des modèles de communication	1	
	Activation, désactivation et configuration de l'envoi automatique	1	
	API / SERVICES		
	Envoi manuel, historique des communications et préparation des rappels	1.5	
	Tests et debug	0.5	
	**Sous-total**	**8**	
			
**Sprint 7**	**Dashboard, recherche avancée, matching et finalisation**		
	BACK-OFFICE		
	Tableau de bord et indicateurs principaux	1	
	Statistiques mensuelles, répartition par statut et taux de transformation	1	
	Délai moyen de traitement et filtres du dashboard	1	
	Recherche avancée par mots-clés CV et compétences	1	
	Matching candidat -> offre avec score simple	1	
	Tests fonctionnels globaux, corrections et optimisation	1.5	
	Documentation et préparation du déploiement	0.5	
	**Sous-total**	**7**	
			
			
	**Total Scope**	**70**	
