1. Qu'est-ce qu'un Index ? (L'analogie du livre de 1000 pages)

Imagine un livre d'histoire de 1000 pages :

Sans index (Seq Scan / Scan Séquentiel) : Si tu cherches le mot "Napoléon", tu es obligé de lire le livre page par page, de la page 1 à 1000. Si le mot est à la page 998, cela t'aura pris 10 minutes.
Avec un index à la fin du livre : Tu vas à la lettre N, tu trouves "Napoléon : pages 12, 45, 998". En 2 secondes, tu ouvres directement la bonne page.

En base de données, un index est une structure de données auxiliaire que PostgreSQL maintient en mémoire pour retrouver des lignes sans parcourir toute la table.

2. Les 3 Familles d'Index utilisées dans notre projet Alpha Ciment

Dans sql/gestion_recrutement.sql, nous avons combiné trois stratégies d'indexation complémentaires :

                               LES INDEX DU PROJET ALPHA CIMENT
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              ▼                               ▼                               ▼
       1. INDEX B-TREE                 2. INDEX PARTIELS                3. INDEX GIN
    (Jointures & Tris standards)       (Optimisation mémoire fine)     (Plein texte & Trigrammes)
Type 1 : Les Index B-Tree (L'index par défaut de PostgreSQL)

C'est un arbre équilibré (Balanced Tree). La recherche se fait par dichotomie en complexité 
𝑂
(
log
⁡
𝑁
)
O(logN).

Où l'utilise-t-on dans le code ?
Sur toutes les clés étrangères (Foreign Keys) pour accélérer les jointures JOIN :
sql
CREATE INDEX idx_candidature_offre ON candidature(id_offre);
CREATE INDEX idx_candidature_candidat ON candidature(id_candidat);
CREATE INDEX idx_document_candidature ON document(id_candidature);
Pourquoi ? Sans index, afficher les documents d'un candidat oblige PostgreSQL à scanner toute la table document pour trouver ceux qui ont id_candidature = 42.
Sur les colonnes de tri et dates :
sql
CREATE INDEX idx_rendez_vous_date_debut ON rendez_vous(date_debut);
CREATE INDEX idx_pipeline_metrics_created_at ON pipeline_metrics(created_at DESC);
Pourquoi ? Quand React demande les prochains rendez-vous (ORDER BY date_debut ASC), PostgreSQL lit l'index directement dans l'ordre sans devoir trier les lignes en mémoire vive.
Type 2 : Les Index Partiels (Partial Indexes) — L'optimisation d'ingénieur

Un index classique indexe 100 % des lignes d'une table.
Un index partiel n'indexe qu'un sous-ensemble de lignes grâce à une clause WHERE.

Regarde dans notre code (sql/gestion_recrutement.sql lignes 320 et 325) :
sql
-- Index partiel 1 : Uniquement pour les candidatures archivées en vivier
CREATE INDEX idx_candidature_vivier ON candidature(dans_vivier) 
WHERE dans_vivier = true;
-- Index partiel 2 : Uniquement pour les imports ayant une clé d'idempotence
CREATE INDEX idx_candidature_cle_idempotence ON candidature(cle_idempotence) 
WHERE cle_idempotence IS NOT NULL;
Pourquoi c'est génial pour votre projet ?
Sur 10 000 candidatures, seules 500 sont dans le Vivier (dans_vivier = true).
Au lieu de créer un index lourd sur les 10 000 lignes, l'index partiel ne pèse que pour 500 lignes !
Gains : L'index prend 95 % de place en moins en mémoire RAM et les insertions de candidatures ordinaires sont plus rapides.
Type 3 : Les Index GIN (Generalized Inverted Index) — Le moteur de recherche

Le B-Tree est incapable de chercher un mot au milieu d'un texte ou dans un JSONB. C'est là qu'intervient l'index GIN (index inversé).

Au lieu d'associer Ligne -> Contenu, l'index GIN associe Mot -> Liste des Lignes qui le contiennent.

A. Sur le Full-Text Search des CVs (sql/gestion_recrutement.sql ligne 378) :
sql
CREATE INDEX idx_document_recherche_texte 
ON document USING GIN (recherche_texte);

Quand un RH tape "mecanique" dans la barre de recherche :

PostgreSQL ne lit aucun document.
Il regarde dans l'index GIN le mot 'mecan':2 et récupère instantanément la liste des id_document : [4, 18, 92, 105].
Temps d'exécution : ~2 millisecondes, même sur des milliers de CVs scannés !
B. Sur les Trigrammes pour les fautes de frappe (pg_trgm) (ligne 241) :
sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_competence_nom_trgm 
ON competence USING GIN (nom_competence gin_trgm_ops);
Découpe les mots en paquets de 3 lettres (ex: "ciment" 
→
→ ["cim", "ime", "men", "ent"]).
Permet d'accélérer les recherches partielles LIKE '%ciment%' et de tolérer les fautes de frappe.
4. Le piège classique : Pourquoi ne pas indexer TOUTES les colonnes ? (Question piège du jury !)

Si un membre du jury te demande :
« Si les index sont si rapides, pourquoi ne pas en mettre sur toutes les colonnes de chaque table ? »

La réponse d'expert :

Tout index a un coût en écriture et en stockage disque.

Ralentissement des écritures (INSERT, UPDATE, DELETE) : À chaque nouveau CV enregistré ou nouveau statut, PostgreSQL doit mettre à jour la table ET recalculer tous les index associés. Si une table a 15 index, chaque insertion devient 15 fois plus lourde.
Consommation de RAM : Pour être rapides, les index doivent résider dans la mémoire vive (Buffer Pool). Trop d'index saturent la RAM du serveur.
Notre stratégie : Nous n'avons indexé que les colonnes cibles des clauses JOIN (clés étrangères), WHERE (filtres récurrents du back-office) et ORDER BY (tris chronologiques).