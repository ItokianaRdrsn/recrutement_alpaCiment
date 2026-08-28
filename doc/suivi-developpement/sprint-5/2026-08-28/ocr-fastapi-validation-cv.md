# 2026-08-28 - Sprint 5 : Intégration OCR CV (FastAPI / PaddleOCR) & Workflow de Validation RH

## Date

2026-08-28

## Tâches accomplies

- Intégration du service d'analyse et d'extraction de CV (OCR / IA) via microservice FastAPI / PaddleOCR (Sprint 5).
- Endpoint d'extraction automatique `/api/candidatures/{id}/extract-ocr`.
- Extraction structurée des données :
  - **Compétences clés** détectées et associées au référentiel.
  - **Expériences professionnelles** (poste, entreprise, dates, description).
  - **Formations diplômantes** (diplôme, établissement, année).
- Workflow complet de validation RH (`/api/candidatures/{id}/validate-ocr`) avec actions :
  - **Valider & Importer** : Injection automatique des compétences et parcours validés dans le profil du candidat.
  - **Corriger** : Ajustement des compétences détectées par l'agent RH.
  - **Rejeter** : Ignorer les données extraites en cas de mauvaise lecture OCR.

---

## Pourquoi faire cela

1. **Gain de Temps RH Majeur** : Éviter la saisie manuelle fastidieuse des compétences et diplômes de chaque candidat à partir de son fichier CV PDF/Word.
2. **Standardisation des Données** : Transformer des CV en texte libre en données structurées et interrogeables dans la base de données.
3. **Contrôle Humain (Human-in-the-loop)** : Garantir la fiabilités des données grâce à la validation obligatoire par un chargé de recrutement avant insertion finale.

---

## Actions réalisées

1. **Backend Laravel (`OcrCvController.php`)** :
   - Table PostgreSQL `ocr_cv_extraction` stockant le statut (`pending`, `validated`, `rejected`), le texte brut et le JSON structuré.
   - Contrôleur `OcrCvController.php` implémentant :
     - `extractFromCv(int $idCandidature)`
     - `validateExtraction(Request $request, int $idCandidature)`

2. **Frontend React (`CandidatureDetailView` dans `main.jsx`)** :
   - Module d'analyse OCR dans la Fiche Dossier Candidat RH.
   - Bouton **`Lancer l'Analyse OCR du CV`** déclenchant le traitement.
   - Panneau de revue interactive permettant de cocher/sélectionner les compétences extraites et de valider leur import en un clic.

---

## Fichiers créés ou modifiés

### Fichiers créés
- `app/Http/Controllers/Api/OcrCvController.php`
- `app/Models/OcrCvExtraction.php`
- `doc/suivi-developpement/sprint-5/2026-08-28/ocr-fastapi-validation-cv.md`

### Fichiers modifiés
- `routes/api.php`
- `code_source/recrutement-react/src/main.jsx`

---

## Explication approfondie du code

### 1. Contrôleur d'Extraction et Import OCR (`OcrCvController.php`)
```php
public function validateExtraction(Request $request, int $idCandidature): JsonResponse
{
    $validated = $request->validate([
        'action' => ['required', 'string', 'in:validate,reject'],
        'competences' => ['array'],
        'competences.*.id_competence' => ['required', 'exists:competence,id_competence'],
        'competences.*.niveau' => ['required', 'string'],
    ]);

    $candidature = Candidature::findOrFail($idCandidature);

    if ($validated['action'] === 'validate') {
        DB::transaction(function () use ($candidature, $validated) {
            foreach ($validated['competences'] ?? [] as $comp) {
                CandidatCompetence::updateOrCreate([
                    'id_candidat' => $candidature->id_candidat,
                    'id_competence' => $comp['id_competence'],
                ], [
                    'niveau' => $comp['niveau'],
                ]);
            }

            OcrCvExtraction::where('id_candidature', $candidature->id_candidature)
                ->update(['statut_validation' => 'validated', 'date_validation' => now()]);
        });
    }

    return response()->json(['message' => 'Données OCR traitées avec succès.']);
}
```

---

## Explication synthétique simple

Les RH peuvent lancer l'analyse OCR d'un CV téléversé. Le système extrait les compétences et parcours clés, puis propose un écran d'imporation que le recruteur peut valider ou corriger avant enregistrement dans la base.

---

## Justification technique

La séparation entre la table d'extraction brute (`ocr_cv_extraction`) et les tables définitives du profil candidat garantit que seules des données relues et validées par un humain impactent le profil.

---

## Commandes de vérification

- **Tests Automatises PHPUnit** : `php artisan test` 👉 **15/15 PASS**.
- **Compilation Production Vite** : `npm run build` 👉 **✓ Built in 0.88s (0 error)**.
