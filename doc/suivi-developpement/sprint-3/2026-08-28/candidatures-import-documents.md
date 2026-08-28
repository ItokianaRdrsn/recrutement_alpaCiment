# 2026-08-28 - Module Candidatures, Structuration Front/Back-Office, Upload et Diagnostic Erreurs

## Date

2026-08-28

## Tâche

- Résolution de l'erreur **HTTP 422 (Unprocessable Content)** lors de la soumission de candidature.
- Structuration de l'architecture React en sous-dossiers dédiés : `src/frontOffice/` (Portail Candidats) et `src/backOffice/` (Administration RH).
- Création des formulaires web temporaires de candidature autonome accessibles via leurs propres URLs :
  - `/offres/:id/postuler` -> Formulaire autonome de candidature sur offre (`PostulerOffrePage.jsx`).
  - `/candidature-spontanee` -> Formulaire autonome de candidature spontanée (`CandidatureSpontaneePage.jsx`).
  - `/candidat/offres` -> Portail public des offres d'emploi disponibles (`PublicOffresPage.jsx`).
- Implémentation du dédoublonnage candidat par email et de la gestion transactionnelle dans `CandidatureController.php`.
- Mise à jour des estimations de planification des sprints à 68,0 jours.

---

## Pourquoi faire cela

1. **Expérience Candidat et Soutenance** : Permettre aux candidats d'accéder directement aux URLs publiques de candidature sans être redirigés vers le formulaire de connexion RH.
2. **Qualité & Rigueur d'Architecture** : Séparer le code du Front-Office public de celui du Back-Office RH pour faciliter la maintenance.
3. **Robustesse de Validation** : Éviter les rejets 422 lors du téléversement de CV ou de requêtes avec champs optionnels vides.

---

## Actions réalisées

1. **Correction Backend (Laravel)** :
   - Assouplissement des règles de validation de `postulerOffre` et `candidatureSpontanee` dans `CandidatureController.php`.
   - Prise en compte de la casse/accentuation dans la vérification du statut publié (`['Publiee', 'Publiée']`).
   - Amélioration de la remontée des erreurs de validation dans la réponse JSON en cas d'échec.

2. **Refactoring Frontend (React)** :
   - Création du dossier `code_source/recrutement-react/src/frontOffice/` contenant :
     - `PostulerOffrePage.jsx`
     - `CandidatureSpontaneePage.jsx`
     - `PublicOffresPage.jsx`
   - Mise à jour de `main.jsx` pour assurer le routage dynamique selon les URLs accédées par l'utilisateur.

3. **Mise à jour de la documentation** :
   - Révision du fichier `planning-sprints.md` et création de `doc-suivi-etape.md` intégrant le scope révisé de 68,0j et le positionnement de la récupération par e-mail au Sprint 6.

---

## Fichiers créés ou modifiés

### Fichiers créés
- `code_source/recrutement-react/src/frontOffice/PostulerOffrePage.jsx`
- `code_source/recrutement-react/src/frontOffice/CandidatureSpontaneePage.jsx`
- `code_source/recrutement-react/src/frontOffice/PublicOffresPage.jsx`
- `doc/suivi-developpement/doc-suivi-etape.md`

### Fichiers modifiés
- `app/Http/Controllers/Api/CandidatureController.php`
- `code_source/recrutement-react/src/main.jsx`
- `doc/suivi-developpement/planning-sprints.md`
- `doc/suivi-developpement/sprint-3/taches.md`

---

## Explication approfondie du code

### 1. Contrôleur Backend (`CandidatureController.php`)
```php
public function postulerOffre(Request $request, int $idOffre): JsonResponse
{
    $offre = Offre::findOrFail($idOffre);

    // Vérification flexible du statut publié (gestion accents DB)
    $publieeStatusIds = DB::table('statut_offre')->whereIn('libelle', ['Publiee', 'Publiée'])->pluck('id_statut_offre')->toArray();
    if (!empty($publieeStatusIds) && !in_array((int) $offre->id_statut_offre, $publieeStatusIds, true)) {
        return response()->json(['message' => 'Cette offre n\'est pas ouverte aux candidatures.'], 422);
    }

    $validated = $request->validate([
        'nom' => ['required', 'string', 'max:100'],
        'prenom' => ['required', 'string', 'max:100'],
        'email' => ['required', 'email', 'max:150'],
        'telephone' => ['nullable', 'string', 'max:50'],
        'ville' => ['nullable', 'string', 'max:100'],
        'linkedin_url' => ['nullable', 'string', 'max:255'],
        'message_motivation' => ['nullable', 'string'],
        'cv' => ['required', 'file', 'max:10240'],
        'photo' => ['nullable', 'file', 'image', 'max:5120'],
    ]);

    // DB Transaction pour garantie atomique
    $candidature = DB::transaction(function () use ($request, $validated, $offre) {
        $candidat = Candidat::firstOrCreate(['email' => strtolower(trim($validated['email']))], [...]);
        // Création candidature, sauvegarde du CV dans storage/app/public/documents/cv et enregistrement historique
        ...
    });

    return response()->json(['message' => 'Votre candidature a bien été enregistrée.'], 201);
}
```

---

## Explication synthétique simple

Les candidats disposent désormais de leurs propres pages web pour postuler sur une offre ou envoyer un CV spontané via des liens directs (`/offres/10/postuler`, `/candidature-spontanee`). Le backend enregistre les données sans doublon d'e-mail et stocke les CV téléversés en toute sécurité.

---

## Justification technique

La séparation des composants React dans `src/frontOffice/` préserve la séparation des responsabilités. Le candidat accède uniquement aux données publiques et ne subit pas les contrôles d'authentification du back-office RH.

---

## Commandes de vérification

- **Tests Automatises PHPUnit** : `php artisan test` 👉 **15/15 PASS**.
- **Compilation Production Vite** : `npm run build` 👉 **✓ Built in 0.90s (0 error)**.
