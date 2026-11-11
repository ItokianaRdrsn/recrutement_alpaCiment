# Conclusion Générale

Le projet présenté dans ce mémoire répondait à un impératif stratégique pour **Alpha Ciment Madagascar** : moderniser, centraliser et fiabiliser la gestion prévisionnelle de ses recrutements et la capitalisation de ses talents, face aux défis d'une industrie lourde en pleine expansion.

En réponse à la problématique posée :
> *« Comment concevoir et déployer une plateforme unifiée de recrutement et de gestion de vivier, capable d'automatiser l'extraction documentaire des CVs par OCR, d'assurer une recherche plein texte multicritère ultra-rapide et de piloter de manière collaborative l'intégralité du pipeline de sélection pour un groupe industriel ? »*

Les travaux réalisés ont permis de livrer une solution informatique complète, modulaire et hautement sécurisée. En substituant aux fichiers tableurs dispersés et aux dossiers papier une plateforme web moderne basée sur **React 18/19** et **Laravel 11**, l'application apporte un gain de réactivité immédiat à la Direction des Ressources Humaines.

L'intégration d'un microservice de vision artificielle (**PaddleOCR**) et de traitement sémantique (**spaCy & RapidFuzz**) décharge les équipes RH de la saisie manuelle tout en respectant le principe de validation humaine (*Human-in-the-Loop*). L'exploitation avancée des mécanismes de recherche plein texte de **PostgreSQL 16** (`tsvector`, index `GIN`, configuration `french_unaccent`) permet d'interroger instantanément le Vivier de Talents sans friction linguistique, garantissant que chaque profil à fort potentiel soit durablement valorisé pour les usines d'Ibity et Tamatave ainsi que pour le siège de Tsaralalàna.

D'un point de vue personnel, ce stage m'a offert l'opportunité de concrétiser les enseignements d'excellence reçus à l'**IT University**. Il m'a permis de maîtriser les patrons de conception de référence (**Clean Architecture**, **Repository Pattern**), de concevoir des bases de données relationnelles optimisées à haute exigence d'intégrité sans recourir à des triggers masqués, et de piloter un projet d'envergure sur 71 jours ouvrés dans le respect strict des principes Agiles.

Les perspectives d'évolution identifiées — intégration d'une application mobile React Native pour les superviseurs d'usine, Chatbot conversationnel d'assistance et matching sémantique par embeddings vectoriels `pgvector` — confirment que la plateforme développée constitue un socle technologique robuste et pérenne, prêt à soutenir le développement industriel d'Alpha Ciment pour les années à venir.

---

<div style="page-break-after: always;"></div>

# Bibliographie et Webographie

### I. Systèmes d'Entreprise, Architecture & Méthodologie
1. **ARCHITECTURE MULTI-TIERS** : Principes et découpage des architectures client-serveur à trois niveaux.  
   *URL* : https://fr.wikipedia.org/wiki/Architecture_trois_tiers  
   *(Consulté le 12 août 2026)*.
2. **ERP (ENTERPRISE RESOURCE PLANNING)** : Principes de gestion intégrée des processus d'entreprise. Oracle France.  
   *URL* : https://www.oracle.com/fr/erp/what-is-erp/  
   *(Consulté le 14 août 2026)*.
3. **MARTIN FOWLER** : *Patterns of Enterprise Application Architecture — Repository Pattern & Service Layer*. Addison-Wesley Professional.  
   *URL* : https://martinfowler.com/eaaCatalog/repository.html  
   *(Consulté le 15 août 2026)*.
4. **ROBERT C. MARTIN (UNCLE BOB)** : *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017.
5. **MICROSOFT AZURE ARCHITECTURE CENTER** : *RESTful web API design and best practices*.  
   *URL* : https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design  
   *(Consulté le 16 août 2026)*.

### II. Outils de Prototypage et Conception Graphique
6. **PENCIL PROJECT** : Logiciel libre de conception de maquettes d'interface utilisateur et de wireframing.  
   *URL* : https://pencil.evolus.vn/Features.html  
   *(Consulté le 18 août 2026)*.
7. **BALSAMIQ WIREFRAMES** : Documentation et guide des outils de maquettage rapide.  
   *URL* : https://balsamiq.com/wireframes/  
   *(Consulté le 18 août 2026)*.

### III. Bases de Données & Indexation Plein Texte
8. **POSTGRESQL 16 DOCUMENTATION** : Manuel officiel du système de gestion de base de données relationnelle et objet.  
   *URL* : https://www.postgresql.org/docs/16/index.html  
   *(Consulté le 20 août 2026)*.
9. **POSTGRESQL FULL-TEXT SEARCH (TSVECTOR & TSQUERY)** : Documentation sur la recherche lexicale et les dictionnaires de langue.  
   *URL* : https://www.postgresql.org/docs/16/textsearch.html  
   *(Consulté le 20 août 2026)*.
10. **POSTGRESQL UNACCENT EXTENSION** : Dictionnaire textuel de suppression des accents diacritiques.  
    *URL* : https://www.postgresql.org/docs/16/unaccent.html  
    *(Consulté le 22 août 2026)*.
11. **POSTGRESQL GIN INDEXES** : Index inversé généralisé pour les données vectorielles et JSONB.  
    *URL* : https://www.postgresql.org/docs/16/gin.html  
    *(Consulté le 22 août 2026)*.
12. **MYSQL VS POSTGRESQL** : Étude comparative des performances et standards SQL. DataBird.  
    *URL* : https://www.data-bird.co/blog/postgresql-vs-mysql  
    *(Consulté le 23 août 2026)*.

### IV. Frameworks de Développement Backend & Frontend
13. **LARAVEL 11.X DOCUMENTATION** : Documentation officielle du framework web PHP.  
    *URL* : https://laravel.com/docs/11.x  
    *(Consulté le 25 août 2026)*.
14. **LARAVEL SANCTUM** : Documentation sur l'authentification par jetons API légers (Bearer tokens).  
    *URL* : https://laravel.com/docs/11.x/sanctum  
    *(Consulté le 25 août 2026)*.
15. **PHP 8.2 & 8.3 DOCUMENTATION** : Guide officiel du langage PHP et nouvelles fonctionnalités de typage.  
    *URL* : https://www.php.net/manual/fr/  
    *(Consulté le 25 août 2026)*.
16. **REACT JS DOCUMENTATION** : Guide officiel pour la création d'interfaces déclaratives à base de composants.  
    *URL* : https://react.dev/  
    *(Consulté le 28 août 2026)*.
17. **VITE 8.X DOCUMENTATION** : Outil de construction et serveur de développement pour applications frontales.  
    *URL* : https://vite.dev/guide/  
    *(Consulté le 28 août 2026)*.
18. **FULLCALENDAR V6** : Suite logicielle de planification interactive et d'agenda pour React.  
    *URL* : https://fullcalendar.io/docs  
    *(Consulté le 05 octobre 2026)*.

### V. Vision par Ordinateur, IA & Traitement Automatique du Langage (NLP)
19. **FASTAPI OFFICIAL DOCUMENTATION** : Framework web Python asynchrone haute performance basé sur Pydantic.  
    *URL* : https://fastapi.tiangolo.com/  
    *(Consulté le 15 septembre 2026)*.
20. **PADDLEOCR (PP-OCRV4)** : Reconnaissance optique de caractères multilingue basée sur les réseaux de neurones profonds.  
    *Dépôt GitHub* : https://github.com/PaddlePaddle/PaddleOCR  
    *(Consulté le 18 septembre 2026)*.
21. **SPACY INDUSTRIAL NLP** : Bibliothèque open-source de traitement du langage naturel et modèles français (`fr_core_news_md`).  
    *URL* : https://spacy.io/models/fr  
    *(Consulté le 20 septembre 2026)*.
22. **RAPIDFUZZ PYTHON LIBRARY** : Algorithmes ultra-rapides de distance de Levenshtein et comparaison floue de chaînes.  
    *Dépôt GitHub* : https://github.com/rapidfuzz/RapidFuzz  
    *(Consulté le 22 septembre 2026)*.
23. **DATEPARSER DOCUMENTATION** : Bibliothèque Python de détection et normalisation automatique des formats de date.  
    *URL* : https://dateparser.readthedocs.io/  
    *(Consulté le 24 septembre 2026)*.
