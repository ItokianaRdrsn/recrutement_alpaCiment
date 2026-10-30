# Chapitre 3 : Évaluation du Projet et Connaissances Acquises

Ce troisième et dernier chapitre dresse le bilan qualitatif et quantitatif des travaux réalisés. Il mesure les retombées directes pour AlpA Ciment Madagascar, détaille les acquis techniques et méthodologiques tirés de cette expérience de stage, et esquisse les perspectives d'évolution pour le système d'information de l'entreprise.

---

## 3.1 Bilan pour l'Entreprise

L'implémentation de la plateforme a transformé en profondeur la gestion des ressources humaines d'AlpA Ciment. Les retombées observées se mesurent à trois niveaux majeurs :

### 3.1.1 Gains d'Efficacité Opérationnelle et Chiffrés
* **Réduction drastique du temps de traitement documentaire** : Là où l'ouverture manuelle, la lecture et la saisie des informations d'un CV nécessitaient en moyenne 8 à 12 minutes par candidat, le microservice d'OCR et de parsing réalise cette opération en moins de **3 secondes**.
* **Zéro perte de talents grâce au Vivier Unique** : Avant le projet, 100% des candidatures non retenues pour un poste donné étaient perdues dans des boîtes d'archives physiques ou électroniques. Grâce au vivier intelligent, plus de **40 profils qualifiés** ont déjà été capitalisés et restent immédiatement mobilisables pour les besoins saisonniers de l'usine.
* **Recherche instantanée multicritère** : Trouver un profil spécifique (ex. *"Électromécanicien avec 3 ans d'expérience disposant d'un diplôme Bac+2"*) s'effectue désormais en **moins de 10 millisecondes**, contre plusieurs heures de fouille manuelle dans les classeurs auparavant.

### 3.1.2 Fiabilisation et Sécurisation des Données RH
* **Fin des doublons de candidature** : L'algorithme de dédoublonnage automatique par adresse e-mail garantit qu'un candidat postulant plusieurs fois voit l'ensemble de ses démarches consolidées sous un historique unique.
* **Traçabilité juridique et conformité d'audit** : Grâce au journal d'audit (`audit_logs`) et à l'historisation immuable des communications, chaque décision de sélection, chaque motif de rejet et chaque convocation envoyée est formellement horodatée et attribuée à un responsable RH.

### 3.1.3 Valorisation de la Marque Employeur
* **Communication professionnelle et réactive** : L'automatisation des accusés de réception et la personnalisation dynamique des convocations renvoient aux postulants l'image d'une entreprise industrielle moderne et respectueuse de ses candidats.
* **Homogénéité graphique** : Le studio d'affiches permet de générer des supports de communication visuellement cohérents pour les campagnes de recrutement en usine et sur les réseaux sociaux.

---

## 3.2 Bilan Personnel et Professionnel

Ce stage de fin d'études de Licence en Informatique à l'IT University a constitué une étape charnière dans ma formation d'ingénieur logiciel. Il m'a permis de confronter les théories académiques aux contraintes impérieuses du monde industriel.

### 3.2.1 Compétences Techniques Approfondies
* **Maîtrise de la Clean Architecture** : Abandon du modèle traditionnel *Fat Controller* au profit d'un découpage rigoureux en 5 couches (FormRequest $\rightarrow$ Thin Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ API Resource). Cette rigueur garantit un code modulaire, facile à maintenir et hautement testable.
* **Expertise SGBD Avancée sur PostgreSQL 16** :
  * Conception d'index inversés généralisés (`GIN`) sur des colonnes textuelles vectorielles (`tsvector`).
  * Configuration de dictionnaires linguistiques personnalisés (`french_unaccent`) et gestion de l'insensibilité diacritique.
  * Manipulation native et requêtage de structures semi-structurées `JSONB`.
* **Vision par Ordinateur & Traitement du Langage Naturel (NLP)** :
  * Déploiement et orchestration d'un microservice FastAPI asynchrone avec Uvicorn.
  * Prise en main des réseaux de neurones profonds de **PaddleOCR (PP-OCRv4)** pour la détection de texte orienté en multi-colonnes.
  * Utilisation de **spaCy** et **RapidFuzz** pour la réconciliation floue tolérante aux erreurs de numérisation.
* **Développement Frontend Moderne** : Maîtrise de l'écosystème React 18 avec l'outillage Vite, manipulation de states complexes, intégration de bibliothèques tierces riches (FullCalendar, Lucide) et création d'un canvas graphique interactif avec drag-and-drop.

### 3.2.2 Compétences Méthodologiques et Humaines
* **Gestion de Projet Agile & Respect des Délais** : Conduite d'un planning rigoureux découpé en 8 sprints sur 71 jours ouvrés, en maintenant un taux d'avancement réel supérieur aux prévisions initiales.
* **Écoute active et traduction des besoins métiers** : Capacité à dialoguer avec des spécialistes non informaticiens (responsables RH, chefs d'atelier d'usine) pour traduire leurs problématiques quotidiennes en exigences techniques concrètes.
* **Autonomie et résolution méthodique de problèmes complexes** : Développement d'une démarche d'investigation rigoureuse face aux bugs subtils (comme le décalage de normalisation UTF-8 entre PHP et PostgreSQL résolu avec `Str::ascii()`).

---

## 3.3 Extensions et Évolutions Futures

Bien que la plateforme soit pleinement opérationnelle et réponde à l'intégralité du cahier des charges, plusieurs axes d'évolution prometteurs se dégagent pour accompagner l'expansion future d'AlpA Ciment :

### 3.3.1 Notifications Multicanales par SMS et WhatsApp
Dans le contexte malgache, de nombreux candidats postulant à des postes d'ouvriers en usine (manutentionnaires, conducteurs d'engins, soudeurs) ne disposent pas d'un accès internet permanent pour consulter leurs e-mails. L'intégration d'une passerelle SMS locale (ex. API Telma / Orange Money / Airtel) ou d'une API WhatsApp Business permettrait d'envoyer les convocations aux entretiens et tests directement par messagerie instantanée.

### 3.3.2 Matching Prédictif Offre $\longleftrightarrow$ Candidat par Recherche Vectorielle (`pgvector`)
Actuellement, le rapprochement entre candidats et offres repose sur un filtrage précis par compétences déclarées. L'ajout de l'extension PostgreSQL **`pgvector`** permettrait de générer des *embeddings* sémantiques (représentations vectorielles) des fiches de poste et des CVs. Le système pourrait ainsi suggérer automatiquement un score de pertinence sémantique même lorsque le candidat utilise des synonymes non répertoriés dans le référentiel officiel.

### 3.3.3 Application Mobile Dédiée pour les Superviseurs d'Usine
Développer une interface mobile allégée (Progressive Web App ou React Native) permettrait aux chefs d'équipe et contremaîtres d'évaluer directement les tests pratiques des candidats à l'usine (grille d'évaluation technique, notation d'habileté manuelle) depuis une tablette ou un smartphone durci, avec synchronisation immédiate sur le dossier central du candidat.
