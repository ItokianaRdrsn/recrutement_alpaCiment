# Guide d'Apprentissage & Mémo Technique pour la Soutenance
## Plateforme de Recrutement AlpA Ciment : Architecture, Sécurité & Base de Données

Ce document constitue un **guide de référence technique et conceptuel** pour la rédaction de votre mémoire et la préparation aux questions du jury de soutenance. Il aborde en profondeur les choix d'architecture, la sécurité de l'API REST et les stratégies avancées de bases de données (PostgreSQL).

---

## Sommaire

1. [Architecture de Sécurité : Laravel Sanctum vs JWT vs Session Stateful](#1-architecture-de-sécurité--laravel-sanctum-vs-jwt-vs-session-stateful)
   - [Le concept de Stateless selon Roy Fielding](#a-le-concept-de-stateless-selon-roy-fielding)
   - [Pourquoi Sanctum (Reference Tokens) plutôt qu'un JWT pur ?](#b-pourquoi-sanctum-reference-tokens-plutôt-quun-jwt-pur-)
   - [Cryptographie et stockage en base : Le hash SHA-256](#c-cryptographie-et-stockage-en-base--le-hash-sha-256)
   - [Pourquoi les Bearer Tokens éliminent le risque de CSRF](#d-pourquoi-les-bearer-tokens-éliminent-le-risque-de-csrf)
   - [Cycle de vie : Expiration à 8h et purge planifiée](#e-cycle-de-vie--expiration-à-8h-et-purge-planifiée)
   - [Protection Anti-Brute Force (Rate Limiting)](#f-protection-anti-brute-force-rate-limiting)
2. [Structure de Données : JSON vs JSONB dans PostgreSQL](#2-structure-de-données--json-vs-jsonb-dans-postgresql)
   - [Le point commun : L'évolution du schéma sans ALTER TABLE](#a-le-point-commun--lévolution-du-schéma-sans-alter-table)
   - [Les 3 différences fondamentales qui font la supériorité de JSONB](#b-les-3-différences-fondamentales-qui-font-la-supériorité-de-jsonb)
   - [Application réelle dans AlpA Ciment : Audit Log et Extraction OCR](#c-application-réelle-dans-alpa-ciment--audit-log-et-extraction-ocr)
3. [Stratégies d'Indexation en Base de Données](#3-stratégies-dindexation-en-base-de-données)
   - [Qu'est-ce qu'un index ? (L'analogie du livre)](#a-quest-ce-quun-index--lanalogie-du-livre)
   - [Les Index B-Tree : Clés étrangères et tris](#b-les-index-b-tree--clés-étrangères-et-tris)
   - [Les Index Partiels : L'optimisation mémoire fine](#c-les-index-partiels--loptimisation-mémoire-fine)
   - [Pourquoi ne pas indexer toutes les colonnes ? (Trade-off écriture/lecture)](#d-pourquoi-ne-pas-indexer-toutes-les-colonnes--trade-off-écriturelecture)
4. [Moteur de Recherche : FTS, GIN et Trigrammes (pg_trgm)](#4-moteur-de-recherche--fts-gin-et-trigrammes-pg_trgm)
   - [FTS (Full-Text Search) : Le cerveau linguistique](#a-fts-full-text-search--le-cerveau-linguistique)
   - [GIN (Generalized Inverted Index) : Les jambes de course](#b-gin-generalized-inverted-index--les-jambes-de-course)
   - [La configuration personnalisée `french_unaccent`](#c-la-configuration-personnalisée-french_unaccent)
   - [Pourquoi PAS de `pg_trgm` sur les CVs ? (L'explosion des trigrammes)](#d-pourquoi-pas-de-pg_trgm-sur-les-cvs--lexplosion-des-trigrammes)
   - [La stratégie hybride idéale : Textes longs vs Textes courts](#e-la-stratégie-hybride-idéale--textes-longs-vs-textes-courts)
5. [Communication Frontend-Backend & Stratégie de Cache](#5-communication-frontend-backend--stratégie-de-cache)
   - [Cycle de vie d'un appel réseau et centralisation (`client.js`)](#a-cycle-de-vie-dun-appel-réseau-et-centralisation-clientjs)
   - [Déduplication des requêtes en vol (`inFlightRequests`)](#b-déduplication-des-requêtes-en-vol-inflightrequests)
   - [Stratégie de Cache côté client : Du TTL à l'invalidation sur mutation](#c-stratégie-de-cache-côté-client--du-ttl-à-linvalidation-sur-mutation)
   - [Format de transport : JSON vs Fichiers (`FormData`) et le piège du Boundary](#d-format-de-transport--json-vs-fichiers-formdata-et-le-piège-du-boundary)
6. [Sécurité Réseau & Navigateur : Le Mécanisme CORS](#6-sécurité-réseau--navigateur--le-mécanisme-cors)
   - [Définition de l'Origine et Same-Origin Policy (SOP)](#a-définition-de-lorigine-et-same-origin-policy-sop)
   - [La requête préliminaire (*Preflight* `OPTIONS`)](#b-la-requête-préliminaire-preflight-options)
   - [Configuration dans Laravel (`config/cors.php`)](#c-configuration-dans-laravel-configcorsphp)
   - [Le Reverse-Proxy Vite en développement](#d-le-reverse-proxy-vite-en-développement)
   - [Question piège du jury : Pourquoi Postman et curl ignorent CORS](#e-question-piège-du-jury--pourquoi-postman-et-curl-ignorent-cors)
7. [Le Cœur Métier du Recrutement : Ingestion, Transactions ACID & Décodage Base64](#7-le-cœur-métier-du-recrutement--ingestion-transactions-acid--décodage-base64)
   - [Garantie d'intégrité : Les Transactions SQL (`DB::transaction`)](#a-garantie-dintégrité--les-transactions-sql-dbtransaction)
   - [Ingestion automatique n8n et décodage Base64 du CV](#b-ingestion-automatique-n8n-et-décodage-base64-du-cv)
   - [Pourquoi stocker sur disque (`Storage`) plutôt qu'en base (BLOB) ?](#c-pourquoi-stocker-sur-disque-storage-plutôt-quen-base-blob-)
   - [Pipeline OCR & Architecture Hybride (Relationnel + JSONB)](#d-pipeline-ocr--architecture-hybride-relationnel--jsonb)
   - [Traçabilité & Conformité RH : Machine à états et Audit Log](#e-traçabilité--conformité-rh--machine-à-états-et-audit-log)

---

## 1. Architecture de Sécurité : Laravel Sanctum vs JWT vs Session Stateful

### A. Le concept de Stateless selon Roy Fielding

Dans la thèse de doctorat de **Roy Fielding (2000)**, créateur du standard REST, le principe **Stateless** (*sans état*) impose que :
> *« Chaque requête client envoyée au serveur doit contenir toutes les informations nécessaires à son traitement, sans dépendre d'un contexte de session conservé en mémoire par le serveur web. »*

```
STATEFUL (Ancien modèle PHP) :
Client ──[Cookie]──> [Serveur Web 1] ── lit /tmp/sess_123 sur SON disque local
                      Si le serveur 1 plante ou si Load Balancer route vers Serveur 2 ➔ Déconnexion !

STATELESS (Notre modèle REST Sanctum) :
Client ──[Bearer Token]──> [N'importe quel Serveur Web] ── valide avec ──> [Base Partagée PostgreSQL]
                            Les serveurs sont interchangeables et scalables à l'infini.
```

### B. Pourquoi Sanctum (Reference Tokens) plutôt qu'un JWT pur ?

| Critère | JWT Pur (Stateless pur) | Sanctum / Reference Tokens (Notre choix) |
| :--- | :--- | :--- |
| **Stockage serveur** | Aucun (chiffré dans le jeton) | Empreinte SHA-256 dans PostgreSQL (`personal_access_tokens`) |
| **Révocation instantanée (Kill-switch)** | **Impossible** (Le jeton reste valide jusqu'à son expiration) | **Immédiate** (`DELETE FROM personal_access_tokens WHERE id = ...`) |
| **Gestion multi-appareils** | Impossible d'isoler une session | Déconnexion sélective (PC bureau, mobile) |
| **Traçabilité** | Aucune | Colonne `last_used_at` horodatée à chaque requête |

> **Argument Soutenance :** Le JWT pur sacrifie la sécurité au profit d'un dogme "zéro base". En contexte d'entreprise industrielle, si un collaborateur RH quitte l'entreprise ou se fait voler son ordinateur, nous devons être capables de **couper ses accès immédiatement**. Les jetons de référence Sanctum offrent cette sécurité absolue tout en conservant une API REST 100% sans état côté serveurs applicatifs.

### C. Cryptographie et stockage en base : Le hash SHA-256

Sanctum ne stocke **JAMAIS** le jeton en clair dans PostgreSQL :
1. Sanctum génère une chaîne aléatoire cryptographique secrète de 40 caractères.
2. Il calcule son **empreinte SHA-256** (hachage unidirectionnel irréversible).
3. Seul le hash SHA-256 est enregistré dans la colonne `token` de la table `personal_access_tokens`.
4. Le client React reçoit `id|secret_en_clair` et le garde dans son `localStorage`.
5. Si un attaquant vole une copie de sauvegarde de PostgreSQL, **il ne peut pas usurper les identités**, car il est mathématiquement impossible de retrouver le secret original à partir du hash SHA-256.

### D. Pourquoi les Bearer Tokens éliminent le risque de CSRF

* **Le CSRF (*Cross-Site Request Forgery*)** n'est possible que lorsqu'une application utilise des **cookies de session**. En effet, les navigateurs web envoient automatiquement les cookies associés à un domaine lors de requêtes inter-sites (par exemple via une image piégée sur un site malveillant).
* Avec les **Bearer Tokens**, chaque appel vers l'API transmet explicitement l'en-tête HTTP :
  `Authorization: Bearer <token>`
* Le navigateur n'envoie **JAMAIS** cet en-tête de sa propre initiative. Un site tiers ne peut ni deviner le token stocké dans le `localStorage` de React, ni forcer le navigateur à injecter l'en-tête `Authorization`.
* **Conséquence directe :** L'API est immunisée contre le CSRF par conception. Nous avons donc supprimé la route `/api/csrf-token` et tous les en-têtes `X-CSRF-TOKEN` côté React, économisant un aller-retour réseau sur chaque action.

### E. Cycle de vie : Expiration à 8h et purge planifiée

1. **Génération (`SessionController.php`)** :
   ```php
   $expiresAt = now()->addHours(8);
   $token = $user->createToken('auth-token', ['*'], $expiresAt)->plainTextToken;
   ```
   Chaque token est estampillé d'une date d'expiration stricte correspondant à une journée de travail.
2. **Contrôle automatique** : Si `expires_at < now()`, Sanctum rejette immédiatement la requête avec un code HTTP `401 Unauthorized`. React purge alors le `localStorage` et redirige l'utilisateur vers `/login`.
3. **Purge programmée (`routes/console.php`)** :
   ```php
   Schedule::command('sanctum:prune-expired --hours=0')->daily();
   ```
   Tous les jours à minuit (`0 0 * * *`), Laravel nettoie la table PostgreSQL pour ne pas encombrer la mémoire avec les jetons périmés.

### F. Protection Anti-Brute Force (Rate Limiting)

Dans `routes/api.php` :
```php
Route::post('/login', [SessionController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('api.login');
```
* Limite les soumissions de login à **5 requêtes par minute par adresse IP**.
* À la 6ᵉ tentative erronée, l'API répond immédiatement par un code HTTP `429 Too Many Requests`.
* Protège l'infrastructure contre les attaques par dictionnaire ou déni de service (DoS).

---

## 2. Structure de Données : JSON vs JSONB dans PostgreSQL

### A. Le point commun : L'évolution du schéma sans ALTER TABLE

Sur le plan de la **flexibilité du schéma**, `json` et `jsonb` permettent tous les deux d'absorber des structures variables sans avoir à modifier le schéma de la table SQL (`ALTER TABLE`).

### B. Les 3 différences fondamentales qui font la supériorité de JSONB

| Fonctionnalité | `JSON` standard | `JSONB` (Binary JSON) — Choix AlpA Ciment |
| :--- | :--- | :--- |
| **Format en base** | Texte brut (comme un simple `VARCHAR`) | Binaire hiérarchique pré-analysé et compressé |
| **Parsing à la lecture** | Doit réanalyser toute la chaîne caractère par caractère à chaque `SELECT` | **Zéro parsing** : accès direct à l'offset mémoire de chaque clé |
| **Indexation GIN** | **Impossible** (rejet d'erreur par PostgreSQL) | **Supportée** : index inversé complet sur clés et valeurs |
| **Opérateurs d'inclusion** | Non supportés | Supporte `@>` (*contient*), `?` (*existe*), `?|` (*ou*) |
| **Vitesse de recherche** | $\mathcal{O}(N)$ sur la taille du texte | $\mathcal{O}(1)$ ou $\mathcal{O}(\log K)$ sur les clés indexées |

### C. Application réelle dans AlpA Ciment : Audit Log et Extraction OCR

1. **Table `audit_log`** :
   Colonnes `anciennes_valeurs` et `nouvelles_valeurs` typées en `JSONB`.
   Permet d'auditer des entités différentes (`Candidature`, `Offre`, `RendezVous`) dans la même table sans créer 10 tables d'audit.
2. **Table `cv_extraction_ocr`** :
   Colonne `donnees_json` typée en `JSONB`.
   Stocke l'arborescence des données extraites par le microservice Python (téléphone, compétences détectées avec scores de confiance, diplômes) tout en autorisant des requêtes SQL directes d'inclusion :
   ```sql
   SELECT id_candidature 
   FROM cv_extraction_ocr 
   WHERE donnees_json @> '{"competences": [{"nom": "Électromécanique"}]}';
   ```

---

## 3. Stratégies d'Indexation en Base de Données

### A. Qu'est-ce qu'un index ? (L'analogie du livre)

* **Scan séquentiel (Seq Scan)** : Chercher un mot dans un livre de 1000 pages en lisant chaque page de la 1 à la 1000. Très coûteux en CPU et en lectures disque.
* **Index** : Aller à la table alphabétique à la fin du livre, trouver le mot et sauter directement au numéro de page indiqué.

### B. Les Index B-Tree : Clés étrangères et tris

Le **B-Tree** (*Balanced Tree*) est l'arbre équilibré par défaut de PostgreSQL :
* **Sur les clés étrangères (Foreign Keys)** :
  ```sql
  CREATE INDEX idx_candidature_offre ON candidature(id_offre);
  CREATE INDEX idx_document_candidature ON document(id_candidature);
  ```
  Accélère drastiquement les jointures `INNER JOIN` et `LEFT JOIN`.
* **Sur les colonnes d'ordonnancement** :
  ```sql
  CREATE INDEX idx_rendez_vous_date_debut ON rendez_vous(date_debut);
  CREATE INDEX idx_pipeline_metrics_created_at ON pipeline_metrics(created_at DESC);
  ```
  Permet à PostgreSQL de servir les `ORDER BY` sans trier en mémoire vive.

### C. Les Index Partiels : L'optimisation mémoire fine

Un index partiel n'indexe qu'un sous-ensemble conditionnel de lignes grâce à une clause `WHERE` :
```sql
CREATE INDEX idx_candidature_vivier ON candidature(dans_vivier) 
WHERE dans_vivier = true;

CREATE INDEX idx_candidature_cle_idempotence ON candidature(cle_idempotence) 
WHERE cle_idempotence IS NOT NULL;
```
* **Bénéfice :** Si 500 candidatures sur 10 000 sont dans le Vivier, l'index ne pèse que pour ces 500 lignes.
* **Gain :** Économise 95% de RAM dans le *Buffer Pool* PostgreSQL et accélère les écritures sur les 9 500 autres lignes.

### D. Pourquoi ne pas indexer toutes les colonnes ? (Trade-off écriture/lecture)

1. **Surcoût en écriture** : Chaque `INSERT`, `UPDATE` ou `DELETE` oblige PostgreSQL à recalculer tous les index de la table.
2. **Consommation de mémoire vive** : Les index doivent résider dans la RAM (*shared buffers*). Trop d'index saturent la mémoire du serveur.
3. **Règle d'or :** On n'indexe que les colonnes cibles des `JOIN`, des `WHERE` fréquents et des `ORDER BY`.

---

## 4. Moteur de Recherche : FTS, GIN et Trigrammes (pg_trgm)

```
                            CHAÎNE DE RECHERCHE TEXTUELLE
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            ▼                                                           ▼
     TEXTE LONG (CV, Documents)                                 TEXTE COURT (Compétences, Noms)
            │                                                           │
   FTS (french_unaccent)                                        Trigrammes (pg_trgm)
            │                                                           │
   Index GIN (tsvector_ops)                                     Index GIN (gin_trgm_ops)
            │                                                           │
   Réponse en 2 ms sur 5000 CVs                                 Tolérance aux fautes de frappe
```

### A. FTS (Full-Text Search) : Le cerveau linguistique

FTS ne cherche pas de simples sous-chaînes de caractères ; il analyse la langue :
1. **Élimination des mots vides (*Stop-Words*)** : Supprime *le, la, les, de, pour, dans, avec*.
2. **Racines grammaticales (*Stemming*)** : Ramène les mots conjugués ou au pluriel à leur racine lexicale (`mécaniciens` $\rightarrow$ `'mecanicien'`, `réparaient` $\rightarrow$ `'repar'`).
3. **Objets manipulés** :
   - `tsvector` : Le document préparé sous forme de vecteur de racines et positions.
   - `tsquery` : La requête utilisateur transformée sous les mêmes règles.
   - Opérateur `@@` : Teste si le vecteur correspond à la requête.

### B. GIN (Generalized Inverted Index) : Les jambes de course

Sans index, FTS doit recalculer le `tsvector` de chaque document à chaque recherche (trop lent).  
L'index **GIN** inverse le stockage : au lieu d'associer `Document ➔ Mots`, il associe `Mot ➔ [Liste des Documents]`.
* Une recherche sur `"mecanique"` consulte directement l'entrée `'mecanicien'` dans l'index GIN et renvoie immédiatement la liste des identifiants sans ouvrir aucun fichier PDF.

### C. La configuration personnalisée `french_unaccent`

PostgreSQL standard ne retire pas les accents lors du stemming français. Nous avons créé une configuration sur mesure dans la migration `2026_10_23_000001` :
```sql
CREATE TEXT SEARCH CONFIGURATION french_unaccent ( COPY = french );
ALTER TEXT SEARCH CONFIGURATION french_unaccent
    ALTER MAPPING FOR word, hword, hword_part WITH unaccent, french_stem;

ALTER TABLE document ADD COLUMN recherche_texte tsvector 
GENERATED ALWAYS AS (to_tsvector('french_unaccent', coalesce(contenu_texte_extrait, ''))) STORED;

CREATE INDEX idx_document_recherche_texte ON document USING GIN (recherche_texte);
```
Dans Laravel :
```php
$docQuery->whereRaw("recherche_texte @@ websearch_to_tsquery('french_unaccent', ?)", [$term]);
```
Permet à un recruteur de chercher `"electromecanicien"` et de trouver instantanément un CV contenant `"Électromécanicien"`.

### D. Pourquoi PAS de `pg_trgm` sur les CVs ? (L'explosion des trigrammes)

* **Contrainte de type** : `pg_trgm` n'opère que sur du type `TEXT` ou `VARCHAR`. Il ne peut pas s'appliquer sur un `tsvector`.
* **Explosion combinatoire** : Un trigramme découpe les chaînes en paquets de 3 lettres consécutives.
  - Sur un CV de 2000 mots, FTS extrait environ **300 racines uniques**.
  - `pg_trgm` génère **plus de 15 000 trigrammes** !
  - L'index devient 3 à 5 fois plus lourd que la table elle-même et sature la mémoire du serveur à chaque upload de fichier.

### E. La stratégie hybride idéale : Textes longs vs Textes courts

* **Pour les textes longs (CVs, lettres de motivation)** :
  $\longrightarrow$ **FTS + Index GIN (`tsvector_ops`)** : Léger, sémantique, rapide, ne fait pas exploser la RAM.
* **Pour les textes courts (Compétences, Métiers)** :
  $\longrightarrow$ **Trigrammes + Index GIN (`gin_trgm_ops`)** :
  ```sql
  CREATE INDEX idx_competence_nom_trgm ON competence USING GIN (nom_competence gin_trgm_ops);
  ```
  Sur des libellés de 30 caractères, l'index trigramme est minuscule et permet de tolérer les fautes de frappe de saisie du recruteur ou les recherches partielles (`LIKE '%soud%'`).

---

## 5. Communication Frontend-Backend & Stratégie de Cache

### A. Cycle de vie d'un appel réseau et centralisation (`client.js`)

Plutôt que d'éparpiller des appels `fetch()` natifs non protégés à travers des dizaines de composants React, l'architecture d'AlpA Ciment repose sur une couche d'abstraction unifiée : `client.js`.

Cette couche résout automatiquement trois défis majeurs du découplage SPA (Single Page Application) :
1. **L'injection automatique des en-têtes d'authentification** :
   ```javascript
   export function authHeaders(customHeaders = {}) {
       const token = getAuthToken(); // Récupère le token Sanctum en mémoire/storage
       return {
           Accept: 'application/json',
           ...(token ? { Authorization: `Bearer ${token}` } : {}),
           ...customHeaders,
       };
   }
   ```
   Les composants React (`OffersView`, `VivierView`) n'ont plus à manipuler manuellement les tokens.
2. **L'interception des sessions expirées (HTTP 401)** :
   Si le Bearer Token a dépassé sa durée de vie (8 heures), le serveur renvoie `401 Unauthorized`. Le client intercepte ce statut, purge les tokens locaux et redirige automatiquement vers l'écran `/login`.
3. **Le formatage standardisé des erreurs de validation (HTTP 422)** :
   Laravel renvoie les erreurs sous la forme `{ errors: { email: ["Format invalide"], titre: ["Requis"] } }`. Le client transforme ce dictionnaire en message unifié et lisible pour l'utilisateur :
   ```javascript
   if (payload.errors) {
       const errList = Object.values(payload.errors).flat().join(' | ');
       throw new Error(errList);
   }
   ```

### B. Déduplication des requêtes en vol (`inFlightRequests`)

En React 18, le mode de développement `StrictMode` monte intentionnellement chaque composant deux fois pour détecter les fuites de mémoire et effets de bord. Sans protection, chaque requête `GET` part en double sur le réseau. De plus, si deux composants distincts sur le même écran demandent simultanément les référentiels, le serveur recevrait deux requêtes identiques.

Notre implémentation utilise une table de hachage `inFlightRequests = new Map()` :
```javascript
const inFlightRequests = new Map();

export async function getJson(url) {
    const fullUrl = backendPath(url);

    // Si une requête vers cette même URL est DÉJÀ en cours :
    if (inFlightRequests.has(fullUrl)) {
        return inFlightRequests.get(fullUrl); // Partage de la même promesse !
    }

    const requestPromise = (async () => {
        try {
            const response = await fetch(fullUrl, { headers: authHeaders() });
            return await response.json();
        } finally {
            inFlightRequests.delete(fullUrl); // Nettoyage dès que la réponse arrive
        }
    })();

    inFlightRequests.set(fullUrl, requestPromise);
    return requestPromise;
}
```
* **Bénéfice** : Élimine les requêtes concurrentes redondantes, économise la bande passante et divise par deux les sollicitations initiales sur PHP-FPM.

### C. Stratégie de Cache côté client : Du TTL à l'invalidation sur mutation

Pour les données quasi-statiques (Directions, Domaines, Types de contrat, Statuts), interroger la base de données à chaque changement d'onglet est un gaspillage de ressources.

Nous combinons deux approches :
1. **Un TTL de sécurité élevé (ex: 1 heure)** :
   `getCachedJson(url, ttlMs = 3600000)` conserve la réponse dans un cache en mémoire vive (`Map`). Pendant 1 heure, la réponse est servie à **0 ms** sans émettre aucun paquet sur le réseau.
2. **L'invalidation ciblée sur mutation (*Cache Invalidation on Mutation*)** :
   Le problème du simple TTL est la fraîcheur des données : si un administrateur ajoute une direction, les autres composants risquent d'attendre l'expiration du délai pour la voir.
   Pour résoudre ce compromis, notre code déclenche une purge explicite dès qu'une écriture (`POST`, `PUT`, `DELETE`) est confirmée :
   ```javascript
   // Dans ReferentialsView après création d'une direction :
   await sendJson('/api/referentiels/directions', { method: 'POST', body: ... });
   
   invalidateCache('/api/referentiels');
   invalidateCache('/api/directions');
   ```

> **Nuance Soutenance (Client-Side Memory vs Multi-Utilisateurs)** :
> Le cache `staticDataCache` résidant dans la RAM du navigateur de l'utilisateur, l'invalidation locale garantit une cohérence immédiate pour l'administrateur qui fait l'action. Pour les autres recruteurs connectés sur d'autres postes, le TTL de sécurité (1h) ou un rafraîchissement manuel (F5) garantit qu'aucune donnée périmée ne persiste indéfiniment.

### D. Format de transport : JSON vs Fichiers (`FormData`) et le piège du Boundary

Notre architecture utilise deux protocoles de sérialisation :
* **Cas standard (Texte & Objets) $\rightarrow$ `application/json`** :
  Le corps de la requête est sérialisé avec `JSON.stringify()`. Léger, universel, parfaitement typé.
* **Cas des Fichiers (CVs PDF, Photos) $\rightarrow$ `multipart/form-data`** :
  Utilisation de l'objet natif `FormData`.

> [!WARNING]
> **Le piège classique à éviter en soutenance** :
> Lors de l'envoi d'un `FormData`, il ne faut **JAMAIS** spécifier manuellement l'en-tête `'Content-Type': 'multipart/form-data'`.
> En effet, le navigateur doit obligatoirement générer un délimiteur unique appelé **`boundary`** (ex: `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`). Si le développeur force l'en-tête manuellement, le `boundary` est absent et le serveur Laravel est incapable de décomposer le flux pour extraire le fichier !

---

## 6. Sécurité Réseau & Navigateur : Le Mécanisme CORS

### A. Définition de l'Origine et Same-Origin Policy (SOP)

La **Same-Origin Policy (SOP)** est une politique de sécurité critique appliquée par tous les navigateurs web. Elle interdit à un script issu d'une origine d'accéder aux données d'une origine différente sans consentement explicite.

Une **Origine** est définie par le tuple strict :
$$\text{Origine} = \langle \text{Protocole}, \text{Domaine / IP}, \text{Port} \rangle$$

Dans notre environnement de développement :
* Frontend : `http://localhost:5173` (Port 5173)
* Backend : `http://localhost:8000` (Port 8000)
Les ports étant distincts, toute requête directe du front vers le back constitue une requête **Cross-Origin**.

### B. La requête préliminaire (*Preflight* `OPTIONS`)

Avant d'autoriser l'envoi d'une requête potentiellement modificatrice (`POST`, `PUT`, `DELETE`) ou contenant des en-têtes non standards (`Authorization: Bearer ...`), le navigateur émet automatiquement une requête invisible avec la méthode **`OPTIONS`**.

1. Le navigateur demande : *"Le port 5173 a-t-il le droit d'envoyer un POST avec un en-tête Authorization ?"*
2. Le serveur Laravel valide l'origine et renvoie les autorisations (`Access-Control-Allow-Origin`, `Access-Control-Allow-Headers`).
3. Le navigateur reçoit l'accord et expédie la véritable requête métier.

### C. Configuration dans Laravel (`config/cors.php`)

Dans notre backend, la politique est explicitée dans `config/cors.php` :
```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        env('FRONTEND_URL', 'http://127.0.0.1:5173'),
    ],
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
];
```
* **Principe de moindre privilège** : Nous n'utilisons pas le joker wildcard `allowed_origins => ['*']`, car cela permettrait à n'importe quel site web malveillant d'exécuter des requêtes vers notre API au nom d'un recruteur connecté.

### D. Le Reverse-Proxy Vite en développement

Pour supprimer tout frottement CORS durant le développement local, `vite.config.js` intègre un proxy inverse :
```javascript
server: {
    port: 5173,
    proxy: {
        '/api': {
            target: 'http://127.0.0.1:8000',
            changeOrigin: true,
        },
    },
}
```
* Le navigateur envoie sa requête à `http://localhost:5173/api/...` (même port $\rightarrow$ **0 vérification CORS**).
* Le serveur de développement Vite (Node.js) transmet la requête au serveur Laravel (PHP) en direct de machine à machine. Comme CORS n'existe que dans les navigateurs, l'échange est immédiat et transparent.

### E. Question piège du jury : Pourquoi Postman et curl ignorent CORS

> **Question du jury** : *"Si j'utilise Postman ou curl pour attaquer votre API, est-ce que votre configuration CORS me bloque ?"*  
> **Réponse technique** :  
> *"Non. CORS est une spécification implémentée **exclusivement au sein des moteurs de rendu des navigateurs web** pour protéger l'utilisateur final. Des outils comme curl, Postman ou des scripts Python ne respectent pas la Same-Origin Policy. La véritable sécurité de notre API repose donc sur l'authentification **Laravel Sanctum avec Token Bearer**, les permissions RBAC et la validation stricte des données."*

---

## 7. Le Cœur Métier du Recrutement : Ingestion, Transactions ACID & Décodage Base64

### A. Garantie d'intégrité : Les Transactions SQL (`DB::transaction`)

L'enregistrement d'une candidature n'est pas une simple opération d'une ligne ; il orchestre **six tables interdépendantes** :
`candidat`, `candidature`, `document`, `cv_extraction_ocr`, `candidature_competence`, `historique_statut_candidature`.

Pour éviter toute corruption de données en cas de panne réseau ou de disque saturé, nous appliquons le principe **ACID** (Atomicité, Cohérence, Isolation, Durabilité) via `DB::beginTransaction()` :

```php
// app/Services/CandidatureService.php
DB::beginTransaction();
try {
    $candidat = Candidat::create([...]);
    $candidature = Candidature::create([...]);
    $this->storeFiles($candidature, $request);
    HistoriqueStatutCandidature::create([...]);

    DB::commit(); // Tout est validé simultanément dans PostgreSQL
} catch (\Throwable $e) {
    DB::rollBack(); // Annulation intégrale : aucune ligne orpheline en base
    throw $e;
}
```

### B. Ingestion automatique n8n et décodage Base64 du CV

Dans notre architecture automatisée, l'agent d'ingestion **n8n** écoute les candidatures entrantes par e-mail.  
Comme un flux HTTP JSON ne peut pas contenir d'octets binaires bruts, n8n encode le document PDF du CV en **chaîne Base64** (`cv_base64`).

Dans `CandidatureService::storeFiles()` :
```php
// 1. Nettoyage du préfixe éventuel "data:application/pdf;base64,"
if (str_contains($base64, ';base64,')) {
    $parts = explode(';base64,', $base64);
    $base64 = end($parts);
}

// 2. Décodage binaire natif PHP
$decoded = base64_decode($base64);

// 3. Écriture physique sur le disque de stockage
$filename = $data['cv_nom'] ?: ('cv_' . $candidature->id_candidature . '.pdf');
$path = 'documents/cv/' . uniqid() . '_' . $filename;
Storage::disk('public')->put($path, $decoded);

// 4. Enregistrement des métadonnées dans PostgreSQL
$this->candidatureRepository->createDocument([
    'id_candidature' => $candidature->id_candidature,
    'type_document'  => 'CV',
    'nom_fichier'    => $filename,
    'chemin_fichier' => $path,
    'taille_octets'  => strlen($decoded),
    'mime_type'      => 'application/pdf',
]);
```

### C. Pourquoi stocker sur disque (`Storage`) plutôt qu'en base (BLOB) ?

Une erreur de débutant fréquente consiste à créer une colonne `BYTEA` ou `BLOB` dans PostgreSQL pour y stocker directement les fichiers des CVs.

| Critère | Stockage Fichier sur Disque / Object Storage (Notre choix) | Stockage BLOB en Base de Données |
| :--- | :--- | :--- |
| **Poids des Sauvegardes BDD** | Sauvegardes légères (quelques mégaoctets de texte). | Sauvegardes titanesques de plusieurs gigaoctets. |
| **Utilisation RAM PostgreSQL** | La mémoire vive est dédiée aux index B-Tree / GIN et au cache de requêtes. | Les gros binaires polluent la mémoire tampon partagée (*shared buffers*). |
| **Distribution Web (CDN/Web Server)** | Servi directement par Nginx ou via lien symbolique public sans toucher à PHP. | Chaque téléchargement monopolise un worker PHP et une connexion SQL active. |
| **Scalabilité** | Migration transparente vers un bucket AWS S3 / MinIO via `Storage::disk('s3')`. | Nécessite une restructuration lourde de la base de données. |

### D. Pipeline OCR & Architecture Hybride (Relationnel + JSONB)

Le CV physique stocké passe ensuite dans le moteur d'extraction OCR et NER :
1. **Texte brut + Entités JSONB** $\rightarrow$ Stockés dans la table `cv_extraction_ocr` :
   - `texte_brut_ocr` : Le corpus texte intégral utilisé pour le Full-Text Search.
   - `donnees_json` : Les entités structurées (compétences détectées, expériences, diplômes) stockées dans notre colonne **`jsonb`**.
2. **Éclatement Relationnel** $\rightarrow$ Insertion dans les tables `candidature_competence`, `candidat_experience`, `candidat_formation`.

> **Pourquoi cette double persistance ?**
> * Le format **JSONB** offre une totale flexibilité : si le modèle d'IA commence à extraire de nouvelles métadonnées (ex: langues parlées, permis de conduire, liens LinkedIn), le schéma de la base n'a pas besoin d'être modifié.
> * Les **tables relationnelles** permettent aux recruteurs d'exécuter des filtres SQL ultra-rapides (`JOIN`, `GROUP BY`, `ORDER BY`) indexés par B-Tree sur les années d'expérience et les compétences clés.

### E. Traçabilité & Conformité RH : Machine à états et Audit Log

Dans une entreprise industrielle comme AlpA Ciment, chaque décision RH doit être auditable et irréfutable :

1. **Workflow de Statuts Horodaté (`historique_statut_candidature`)** :
   Chaque passage d'étape ($\text{Reçue} \rightarrow \text{Présélectionnée} \rightarrow \text{Entretien} \rightarrow \text{Retenue}$) enregistre l'identifiant du recruteur, la date exacte et un commentaire justificatif.
2. **Piste d'Audit Système (`audit_log`)** :
   Toute modification sensible (ex: correction manuelle d'une compétence mal reconnue par l'OCR) journalise dans PostgreSQL le différentiel exact (`anciennes_valeurs` et `nouvelles_valeurs` sous format `jsonb`).
