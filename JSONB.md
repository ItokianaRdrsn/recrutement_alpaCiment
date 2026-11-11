2. Pourquoi JSONB et pas un simple JSON ou du texte TEXT ? (Argument clé pour le jury)

En PostgreSQL, il y a une différence monumentale entre JSON et JSONB :

Critère	JSON standard	JSONB (Binary JSON) — Notre choix
Format de stockage	Texte brut (comme une simple chaîne de caractères)	Binaire décomposé et optimisé
Vitesse d'écriture	Légèrement plus rapide	Nécessite une conversion binaire à l'insertion
Vitesse de lecture & recherche	Lente (PostgreSQL doit re-parser tout le texte à chaque requête)	Ultra-rapide (accès direct aux clés en mémoire)
Indexation	Impossible d'indexer directement	Indexable avec GIN pour des recherches instantanées
Suppression des espaces & doublons	Conserve les espaces inutiles	Élimine les doublons de clés et compresse les données
3. Quel est l'intérêt métier pour Alpha Ciment ?
La flexibilité d'un modèle NoSQL au sein d'une base SQL relationnelle : Chaque CV a une structure imprévisible : certains candidats ont 10 certifications, d'autres ont 3 projets de fin d'études. Au lieu de figer 40 colonnes SQL vides (certification_1, certification_2...), JSONB permet de stocker des structures polymorphes et évolutives.
Des requêtes SQL avancées sans décoder en PHP : Grâce aux opérateurs PostgreSQL (->, ->>, @>), on peut interroger l'intérieur du JSON directement en SQL :
sql
-- Trouver les CVs qui contiennent la compétence 'Automatisme' dans leur JSON
SELECT id_candidature 
FROM cv_extraction_ocr 
WHERE donnees_json @> '{"competences": [{"nom": "Automatisme"}]}';
Traçabilité parfaite de l'Audit Log : Le champ JSONB stocke l'état complet de l'entité modifiée sans altérer le schéma si de nouvelles colonnes sont ajoutées plus tard au modèle candidature.