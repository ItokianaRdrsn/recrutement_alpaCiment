# Chapitre 3 : Évaluation du Projet et Connaissances Acquises

Ce troisième chapitre dresse le bilan qualitatif et quantitatif des travaux réalisés. Il mesure les retombées opérationnelles directes pour Alpha Ciment Madagascar, détaille les acquis techniques, méthodologiques et humains tirés de cette expérience de stage en entreprise, et expose les perspectives d'évolution envisagées pour enrichir le système d'information.

---

## 3.1 Bilan pour l'Entreprise

Au sein du siège social d'Alpha Ciment à Tsaralalàna, le Département Informatique assurait la maîtrise d'ouvrage technique du projet, tandis que la Direction des Ressources Humaines portait les exigences métiers. La conception et la réalisation de la plateforme de recrutement ont été conduites de manière autonome et individuelle, sous la supervision attentive de mon encadreur professionnel, **Monsieur Hery Mampionona RANDRIAMASY**.

Tout au long du cycle de développement, des revues de sprint mensuelles ont été organisées avec les équipes informatiques et les responsables RH. Ces présentations régulières ont permis de recueillir des retours d'utilisation en conditions réelles et d'ajuster continuellement l'ergonomie des interfaces ainsi que les règles de gestion des candidatures.

L'implémentation de la solution apporte à Alpha Ciment des gains tangibles et mesurables à plusieurs niveaux :

### 3.1.1 Gains d'Efficacité Opérationnelle et Productivité

* **Réduction drastique du temps d'ingestion documentaire** : Là où l'ouverture manuelle d'un CV, sa lecture intégrale et la retranscription de ses données dans un tableur absorbaient entre **8 et 12 minutes** par postulant, le microservice d'OCR (PaddleOCR) et d'extraction automatique effectue ce pré-traitement en **moins de 3 secondes**.
* **Fin de l'amnésie organisationnelle grâce au Vivier Unique** : Auparavant, 100% des candidatures qualifiées non retenues sur une offre spécifique étaient égarées dans des classeurs d'archives ou des boîtes de courriels saturées. Grâce à l'indicateur permanent `dans_vivier = true`, plus de **42 profils techniques qualifiés** ont déjà été capitalisés dans le Vivier, immédiatement mobilisables pour les besoins saisonniers ou urgents des usines.
* **Recherche instantanée multicritère et plein texte** : Trouver un profil spécifique (par exemple : *"Électromécanicien avec habilitation haute tension disponible pour le site d'Ibity"*) s'opère désormais en **moins de 10 millisecondes**, contre plusieurs heures de fouille manuelle auparavant.

### 3.1.2 Fiabilisation, Centralisation et Sécurisation des Données RH

* **Fédération des sites industriels et administratifs** : La plateforme unifie les candidatures en provenance des sites d'usine d'Ibity et de Tamatave avec celles du siège de Tsaralalàna au sein d'une base de données PostgreSQL unique et sécurisée.
* **Éradication des doublons** : L'algorithme de contrôle d'unicité par adresse e-mail rattache automatiquement tout nouvel acte de candidature à l'historique préexistant du candidat.
* **Traçabilité juridique et conformité d'audit** : Grâce au journal immuable `audit_logs` et à la table `communications`, chaque décision d'avancement, chaque motif de rejet et chaque convocation envoyée par courriel est formellement horodatée et imputée à son auteur.

### 3.1.3 Modernisation de la Marque Employeur

* **Communication réactive et valorisante** : L'envoi automatique d'accusés de réception personnalisés et de convocations détaillées véhicule auprès des candidats l'image d'un groupe industriel moderne et respectueux des talents.
* **Homogénéité graphique** : Le studio d'affiches intégré permet aux recruteurs de produire en quelques clics des visuels professionnels respectant fidèlement la charte graphique officielle d'Alpha Ciment.

---

## 3.2 Bilan Personnel et Professionnel

Ce stage de fin d'études au sein d'Alpha Ciment a constitué une immersion professionnelle décisive, me permettant de confronter l'enseignement théorique reçu à l'IT University aux exigences rigoureuses du monde industriel.

En marge du projet principal de développement, j'ai eu l'opportunité de participer activement aux opérations quotidiennes du Département Informatique, notamment à des interventions sur l'infrastructure réseau locale et à des activités d'assistance aux utilisateurs (*Helpdesk*). Ces interventions m'ont permis de mieux appréhender les contraintes opérationnelles réelles des collaborateurs sur les différents sites.

### 3.2.1 Compétences Techniques Approfondies

* **Maîtrise de la Clean Architecture & Design Patterns** : Évolution du paradigme traditionnel vers une séparation stricte en 5 couches (FormRequest $\rightarrow$ Thin Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ API Resource), garantissant un code découplé et facilement testable.
* **Administration avancée de bases de données relationnelles (PostgreSQL 16)** :
  * Création d'index inversés généralisés (`GIN`) sur des vecteurs de lexèmes (`tsvector`).
  * Configuration linguistique personnalisée avec filtrage diacritique (`french_unaccent`).
  * Stockage et requêtage de structures de données semi-structurées (`JSONB`).
* **Ingénierie de la Vision par Ordinateur et du NLP** :
  * Implémentation d'un microservice asynchrone haute performance avec Python et **FastAPI**.
  * Déploiement du modèle neuronal de segmentation spatiale **PaddleOCR (PP-OCRv4)** pour préserver l'agencement des CVs multi-colonnes.
  * Réconciliation floue tolérante aux erreurs de numérisation via **RapidFuzz** et les distances de Levenshtein.
* **Développement Frontend Réactif Moderne** : Maîtrise avancée de l'écosystème React associé à Vite, gestion fine de l'état asynchrone, intégration de la suite calendaire FullCalendar et développement d'un studio visuel avec drag-and-drop.
* **Sécurité Applicative et Authentification Stateless** : Abandon des sessions cookies au profit d'une architecture moderne par Bearer Tokens avec **Laravel Sanctum**, hachage SHA-256 et limitation de débit (*Rate Limiting*).

### 3.2.2 Compétences Humaines et Méthodologiques

* **Gestion de Projet Agile & Respect des Engagements** : Conduite d'un calendrier strict découpé en 8 Sprints sur 71 jours ouvrés, validé dans les délais impartis.
* **Écoute active et traduction des besoins utilisateurs** : Aptitude à dialoguer avec des spécialistes non techniciens (responsables des ressources humaines, directeurs de site) pour transformer des besoins fonctionnels en spécifications d'ingénierie logicielle.
* **Autonomie et résolution méthodique de pannes complexes** : Développement de réflexes d'investigation rigoureux face aux anomalies subtiles (gestion des encodages de caractères UTF-8, synchronisation des liens symboliques de stockage après renommage de répertoires).

---

## 3.3 Extensions et Évolutions Futures

Bien que la plateforme soit actuellement opérationnelle et réponde à l'intégralité du cahier des charges validé, plusieurs perspectives prometteuses ont été identifiées pour accompagner le développement futur d'Alpha Ciment :

### 3.3.1 Application Mobile Dédiée aux Superviseurs d'Usine (React Native)

Dans les cimenteries d'Ibity et de Tamatave, les recrutements techniques comportent des épreuves pratiques d'atelier (soudure, démontage mécanique, raccordement d'armoires électriques). Développer une déclinaison mobile native avec **React Native** permettra aux chefs d'équipe et contremaîtres :
* De consulter la liste des candidats convoqués au poste d'atelier sans utiliser d'ordinateur ;
* De photographier directement les pièces d'identité ou diplômes originaux pour transmission immédiate au backend ;
* De renseigner sur une tablette tactile les grilles d'évaluation technique et notes d'habileté manuelle, synchronisées instantanément avec la Fiche Candidat 360° du siège.

### 3.3.2 Chatbot Conversationnel d'Assistance aux Candidats

Intégrer sur le portail public un agent conversationnel interactif (*Chatbot*) afin d'orienter les postulants vers les offres correspondant le mieux à leur profil, de répondre aux interrogations fréquentes sur l'entreprise et de vérifier la complétude de leurs dossiers avant soumission.

### 3.3.3 Matching Sémantique Prédictif Offres-Candidats par Recherche Vectorielle (`pgvector`)

Actuellement, l'appariement des profils repose sur la correspondance textuelle et lexicale des compétences. L'intégration de l'extension PostgreSQL **`pgvector`** couplée à un modèle d'embedding sémantique local permettra d'associer un candidat à une offre même lorsque celui-ci emploie des termes synonymes non répertoriés dans le thésaurus officiel, attribuant à chaque dossier un score de pertinence prédictif.
