## Cas 1 : L'ancien système avec Cookies de session (Stateful)
Tu te connectes : la requête arrive sur le Serveur 1.
Le Serveur 1 crée un fichier de session sur son disque dur local (/tmp/sess_abc123).
Dix secondes plus tard, tu cliques sur une offre : le Load Balancer t'envoie sur le Serveur 2.
Catastrophe ! Le Serveur 2 n'a pas ton fichier de session sur son disque => tu es déconnecté !
Pour que ça marche, il faut forcer le Load Balancer à toujours t'envoyer sur la même machine (Sticky Sessions), ce qui casse la scalabilité.

## Cas 2 : Le système Sanctum avec Bearer Token (Stateless)
Tu te connectes sur le Serveur 1 : il génère le token, l'enregistre dans PostgreSQL et te le donne.
Dix secondes plus tard, ta requête arrive sur le Serveur 2 avec l'en-tête Authorization: Bearer 1|xyz.
Le Serveur 2 ne te connaît pas, il n'a aucune mémoire de toi. Mais il lit le token, vérifie l'empreinte dans la base partagée PostgreSQL, et traite ta requête avec succès !
Tu peux détruire, redémarrer ou ajouter 50 serveurs Laravel instantanément : aucune session n'est perdue. C'est cela, la véritable définition de Stateless.


1. Définir « scalable » : quelle charge, quelle limite ?

« Scalable » ne veut rien dire sans chiffres. Exemple : « la recherche répond en moins de 500 ms avec 1 million de candidatures et 50 utilisateurs simultanés ». Sans objectif, on ne peut ni réussir ni échouer.

2. Analyser la complexité (en théorie)

Pour chaque opération, demande-toi comment le coût évolue quand les données doublent :

Complexité	Si les données ×10...	Exemple
O(1) / O(log n)	le coût reste quasi stable	recherche par index B-tree ou GIN
O(n)	le coût ×10	ILIKE '%mot%' sans index (scan complet)
O(n²)	le coût ×100	boucles imbriquées, requêtes N+1 mal gérées

Dans ton code, unaccent(contenu_texte_extrait) ILIKE '%...%' est en O(n) sur la taille totale des CV : ça marche à 1 000 lignes, ça s’effondre à 1 million.

3. Tester avec des volumes réalistes

Le piège classique : tout est rapide en dev avec 50 lignes. Il faut tester avec des données proches de la production, voire 10× plus.

sql
-- Générer des données de test
INSERT INTO document (contenu_texte_extrait)
SELECT repeat('texte de cv développeur laravel ', 200)
FROM generate_series(1, 500000);
4. Lire les plans d’exécution

Pour la base de données, EXPLAIN (ANALYZE, BUFFERS) est l’outil clé :

Seq Scan sur une grosse table = alerte (sauf si la table est petite).
Index Scan / Bitmap Index Scan = bon signe.
Compare le temps à 10 000, 100 000, 1 000 000 de lignes : si ça croît linéairement ou pire, c’est un problème.
5. Faire des tests de charge

Pour tester la concurrence (plusieurs utilisateurs en même temps) :

k6, Locust, Apache JMeter, wrk, Artillery.

Tu observes : temps de réponse (p50, p95, p99), nombre de requêtes/seconde, taux d’erreurs, et à partir de quelle charge ça casse.

6. Profiler pour trouver les goulots
Laravel : Laravel Telescope, Debugbar, Clockwork (nombre de requêtes SQL, N+1, temps par requête), Blackfire ou Xdebug pour le profilage PHP.
PostgreSQL : pg_stat_statements pour identifier les requêtes les plus coûteuses en production.
Mémoire : surveille la consommation par requête (ton with('documents') qui charge tous les textes de CV est un bon exemple).
7. Vérifier les propriétés d’architecture

Un code scalable horizontalement doit être :

Sans état (stateless) : pas de session ou de fichiers stockés localement sur le serveur, pour pouvoir lancer N instances derrière un load balancer.
Asynchrone pour le lourd : OCR, extraction de CV, envoi d’emails dans des queues (jobs), pas dans la requête HTTP.
Paginé et borné : jamais de ->get() sans limite sur une table qui grossit.
Cacheable : les données lues souvent et modifiées rarement (statuts, directions) sont mises en cache.
Sans verrous ni goulot unique : une seule base qui reçoit tout finit par saturer (d’où les réplicas en lecture, le partitionnement, etc.).
8. Surveiller en continu

La scalabilité n’est pas un état définitif. En production : métriques (Prometheus/Grafana, ou un APM comme New Relic, Datadog), alertes sur la latence p95, et suivi de l’évolution du volume de données.

Check-list rapide
 J’ai un objectif chiffré (volume, latence, utilisateurs simultanés)
 Aucune requête ne fait de scan complet sur une grosse table
 Pas de N+1, pas de chargement non borné
 Les tâches lourdes passent par des queues
 Le serveur est stateless
 J’ai testé avec 10× le volume attendu
 J’ai des métriques en production
Un conseil de réalisme

Ne sur-optimise pas trop tôt. Pour une application de gestion de candidatures, quelques centaines de milliers de lignes suffisent déjà largement à poser des problèmes (comme ton ILIKE sur du texte de CV), mais en dessous de ça, la priorité est d’avoir un code lisible, avec les bons index. Mesure d’abord, optimise ensuite ce qui est réellement lent.

Si tu veux, je peux t’aider à construire un petit jeu de données de test et à lire l’EXPLAIN ANALYZE de ta requête de recherche pour voir où elle devient problématique.