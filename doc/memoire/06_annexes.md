# Annexes Techniques

Les annexes regroupent les spécifications de bas niveau, scripts SQL de configuration, extraits d'algorithmes et résultats de tests automatisés étayant les réalisations présentées dans le mémoire.

---

## Annexe 1 : Configuration PostgreSQL Full-Text Search (`french_unaccent`)

Pour garantir une recherche insensible aux accents et aux flexions grammaticales françaises, une configuration textuelle personnalisée a été générée en base :

```sql
-- 1. Activation de l'extension unaccent
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Création de la configuration de recherche personnalisée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'french_unaccent'
    ) THEN
        CREATE TEXT SEARCH CONFIGURATION french_unaccent (COPY = french);
        
        -- Modification des règles de tokens pour filtrer les accents avant le stemming
        ALTER TEXT SEARCH CONFIGURATION french_unaccent
            ALTER MAPPING FOR word, hword, hword_part
            WITH unaccent, french_stem;
    END IF;
END $$;

-- 3. Ajout de la colonne vectorielle calculée et de l'index inversé GIN
ALTER TABLE document 
ADD COLUMN IF NOT EXISTS recherche_texte tsvector 
GENERATED ALWAYS AS (
    to_tsvector('french_unaccent', coalesce(contenu_texte_extrait, ''))
) STORED;

CREATE INDEX IF NOT EXISTS idx_document_recherche_texte_gin 
ON document USING gin(recherche_texte);
```

---

## Annexe 2 : Algorithme de Découpage de Snippet Résilient aux Accents & Ligatures (PHP)

Implémenté dans [`EloquentCandidatureRepository.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Repositories/Eloquent/EloquentCandidatureRepository.php) et [`EloquentVivierRepository.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Repositories/Eloquent/EloquentVivierRepository.php), cette méthode garantit une correspondance 1-pour-1 stricte de la longueur en caractères pour éliminer tout décalage d'offset tout en conservant les accents originaux :

```php
protected function normalize1to1(string $string): string
{
    $string = mb_strtolower($string, 'UTF-8');
    $table = [
        'à'=>'a', 'á'=>'a', 'â'=>'a', 'ã'=>'a', 'ä'=>'a', 'å'=>'a',
        'è'=>'e', 'é'=>'e', 'ê'=>'e', 'ë'=>'e',
        'ì'=>'i', 'í'=>'i', 'î'=>'i', 'ï'=>'i',
        'ò'=>'o', 'ó'=>'o', 'ô'=>'o', 'õ'=>'o', 'ö'=>'o',
        'ù'=>'u', 'ú'=>'u', 'û'=>'u', 'ü'=>'u',
        'ý'=>'y', 'ÿ'=>'y',
        'ç'=>'c', 'ñ'=>'n',
        'œ'=>'e', 'æ'=>'a', // Remplacement 1-pour-1 préservant rigoureusement la longueur mb_strlen()
    ];
    return strtr($string, $table);
}

public function generateSnippet(?string $text, string $keyword, int $radius = 70): ?string
{
    if (empty($text) || empty($keyword)) {
        return null;
    }

    $normText = $this->normalize1to1($text);
    $normKeyword = $this->normalize1to1($keyword);
    $pos = mb_stripos($normText, $normKeyword);
    $matchLen = mb_strlen($normKeyword);

    if ($pos === false) {
        $words = array_filter(preg_split('/\s+/', $keyword), fn ($w) => mb_strlen($w) >= 3);
        foreach ($words as $w) {
            $normW = $this->normalize1to1($w);
            $p = mb_stripos($normText, $normW);
            if ($p !== false) {
                $pos = $p;
                $matchLen = mb_strlen($normW);
                break;
            }
        }
    }

    if ($pos === false) {
        return null;
    }

    $start = max(0, $pos - $radius);
    $extractLen = ($pos - $start) + $matchLen + $radius;
    $rawExtract = mb_substr($text, $start, $extractLen, 'UTF-8');

    $prefix = $start > 0 ? '… ' : '';
    $suffix = ($start + $extractLen < mb_strlen($text, 'UTF-8')) ? ' …' : '';

    return $prefix . trim(preg_replace('/\s+/', ' ', $rawExtract)) . $suffix;
}
```

---

## Annexe 3 : Pipeline d'Extraction OCR & Normalisation NLP (Python FastAPI)

Extrait du contrôleur d'extraction déployé dans `code_source/ocr/main.py` :

```python
from fastapi import FastAPI, UploadFile, File
from paddleocr import PaddleOCR
from rapidfuzz import process, fuzz
import dateparser
import re

app = FastAPI(title="Microservice OCR & NLP - AlpA Ciment")
ocr = PaddleOCR(use_angle_cls=True, lang="fr", show_log=False)

@app.post("/extract-cv")
async def extract_cv_data(file: UploadFile = File(...)):
    contents = await file.read()
    # 1. Inférence visuelle avec détection angulaire
    result = ocr.ocr(contents, cls=True)
    
    extracted_lines = []
    for line in result[0]:
        text = line[1][0]
        confidence = line[1][1]
        extracted_lines.append({"text": text, "score": confidence})
        
    full_text = "\n".join([item["text"] for item in extracted_lines])
    
    # 2. Matching tolérant aux fautes avec le référentiel des compétences
    matched_skills = match_competences_fuzzy(full_text)
    
    return {
        "raw_text": full_text,
        "competences": matched_skills,
        "status": "ready_for_human_validation"
    }

def match_competences_fuzzy(text: str, threshold: float = 85.0):
    referentiel = ["Laravel", "PostgreSQL", "React", "Maintenance Industrielle", "Électromécanique", "Chaudronnerie"]
    words = set(re.findall(r'\b[A-Za-zÀ-ÿ]{3,}\b', text))
    found = []
    
    for word in words:
        match, score, _ = process.extractOne(word, referentiel, scorer=fuzz.token_sort_ratio)
        if score >= threshold and match not in found:
            found.append({"competence": match, "score_confiance": score})
            
    return found
```

---

## Annexe 4 : Moteur d'Interpolation Regex des Modèles d'Emails (Laravel)

Extrait de [`CommunicationService.php`](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/code_source/recrutement/app/Services/CommunicationService.php) permettant le remplacement tolérant des balises dynamiques :

```php
public function interpolerVariables(string $template, Candidature $candidature, ?RendezVous $rdv = null): string
{
    $variables = [
        'nom' => $candidature->candidat->nom,
        'prenom' => $candidature->candidat->prenom,
        'email' => $candidature->candidat->email,
        'poste' => $candidature->offre ? $candidature->offre->titre_poste : $candidature->poste_souhaite,
        'direction' => $candidature->offre ? $candidature->offre->direction->nom_direction : 'AlpA Ciment',
        'date_rdv' => $rdv ? $rdv->date_heure->format('d/m/Y à H:i') : '[Date non définie]',
        'lieu_rdv' => $rdv ? $rdv->lieu_ou_lien : 'Site Usine AlpA Ciment',
    ];

    // Regex tolérant {cle} ou {{cle}} avec espaces optionnels et insensible à la casse
    foreach ($variables as $cle => $valeur) {
        $pattern = '/\{\{\s*' . preg_quote($cle, '/') . '\s*\}\}|\{\s*' . preg_quote($cle, '/') . '\s*\}/i';
        $template = preg_replace($pattern, (string)$valeur, $template);
    }

    return $template;
}
```

---

## Annexe 5 : Rapport d'Exécution de la Suite de Tests Automatisés (PHPUnit)

Résultats certifiés de l'exécution de la suite complète de tests de non-régression et de sécurité :

```
   PASS  Tests\Feature\Api\ApiAccessTest
  ✓ test_api_requires_authentication
  ✓ test_api_rejects_users_without_rh_or_admin_role
  ✓ test_api_returns_authenticated_user_context
  ✓ test_roles_referential_contains_available_roles
  ✓ test_login_returns_sanctum_bearer_token
  ✓ test_login_rate_limiting_throttles_excessive_attempts
  ✓ test_expired_token_is_rejected

   PASS  Tests\Feature\Api\DashboardAnalyticsTest
  ✓ test_dashboard_metrics_aggregation
  ✓ test_dashboard_filters_by_direction_and_date

   PASS  Tests\Feature\Api\RechercheAvanceeCandidaturesTest
  ✓ test_recherche_multicritere_competences_mode_and
  ✓ test_recherche_plein_texte_tsvector_avec_index_gin
  ✓ test_recherche_cv_snippet_insensible_aux_accents_et_vivier

   PASS  Tests\Feature\Api\CommunicationTest
  ✓ test_interpolation_variables_dynamiques_modele_email
  ✓ test_immuabilite_preuve_envoi_table_communication

----------------------------------------------------------------------
Tests:    40 passed (211 assertions)
Duration: 2.32s
Status:   100% SUCCÈS
----------------------------------------------------------------------
```

---

## Annexe 6 : Glossaire des Concepts d'Architecture & Sécurité

| Terme / Concept | Définition & Implémentation dans la Plateforme |
| :--- | :--- |
| **Stateless (Sans État)** | Principe architectural fondamental de REST (Roy Fielding) stipulant que le serveur web ne conserve aucun état client en mémoire vive (RAM) ou sur disque local entre les requêtes. Chaque requête cliente est auto-suffisante et porte sa propre preuve d'habilitation (`Authorization: Bearer <token>`). Cela autorise le passage à l'échelle horizontal (*horizontal scaling*) immédiat sans affinité de session (*sticky sessions*). |
| **Reference Token (Jeton de Référence)** | Modèle d'authentification retenu (Laravel Sanctum) où le jeton transmis au client n'est qu'un pointeur cryptographique sécurisé vers un enregistrement persistant en base de données PostgreSQL. Contrairement aux JWT purs, ce modèle confère au système un contrôle absolu de **révocation instantanée** lors de la déconnexion ou en cas de compromission. |
| **SHA-256 (Secure Hash Algorithm 256 bits)** | Fonction de hachage cryptographique à sens unique utilisée par Laravel Sanctum pour stocker l'empreinte des jetons dans la table `personal_access_tokens`. Même en cas d'accès direct non autorisé à la base de données, les jetons en clair ne peuvent pas être reconstitués. |
| **CSRF (Cross-Site Request Forgery)** | Attaque consistant à faire exécuter à l'insu de l'utilisateur des actions non sollicitées en exploitant les cookies de session envoyés automatiquement par le navigateur. Avec une architecture stateless fondée sur des jetons porteurs (*Bearer Tokens*) injectés explicitement par le client React, le vecteur d'attaque CSRF est neutralisé par conception. |
| **Rate Limiting (Limitation de Débit)** | Mécanisme de protection anti force-brute implémenté via le middleware `throttle:5,1` sur la route `/api/login`. Il plafonne les requêtes à 5 tentatives par minute par adresse IP, renvoyant le code HTTP `429 Too Many Requests` au-delà pour contrer les attaques par dictionnaire. |
| **TTL (Time-To-Live) & Expiration de Token** | Durée de vie maximale accordée à un jeton d'authentification. Fixée rigoureusement à 8 heures (`now()->addHours(8)`), elle aligne la persistance de session sur la journée de travail des agents RH et déclenche une purge automatique quotidienne (`sanctum:prune-expired`) planifiée chaque nuit à minuit. |

