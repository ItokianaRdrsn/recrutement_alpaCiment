# 2026-08-28 - Sprint 5 : Vivier de Talents RH, Référentiel des Compétences et Profil Candidate

## Date

2026-08-28

## Tâches accomplies

- Création de la table et du module **Vivier RH** (`vivier_candidat`) permettant de conserver les profils candidats d'intérêt pour de futurs recrutements (Sprint 5).
- Ajout, consultation et retrait manuel d'un candidat du vivier RH avec motifs de conservation.
- Référentiel complet des compétences (`competence` & `type_competence`) avec niveaux de maîtrise (*Débutant*, *Intermédiaire*, *Avancé*, *Expert*).
- Formulaire d'enrichissement manuel du profil candidat : compétences, expériences professionnelles et formations diplômantes.
- Barre de filtres dédiée au vivier (recherche par nom, direction, domaine d'expertise validé et bouton **Réinitialiser**).

---

## Pourquoi faire cela

1. **Capitalisation sur les Talents** : Éviter de perdre des candidats à fort potentiel qui n'ont pas été retenus pour une offre spécifique mais correspondent à la culture d'entreprise.
2. **Recherche Avancée par Compétence** : Permettre d'identifier instantanément les profils du vivier disposant d'un savoir-faire spécifique lors de l'ouverture d'un nouveau poste.
3. **Structuration du Profil** : Harmoniser la fiche de compétences, diplômes et parcours des candidats en vivier.

---

## Actions réalisées

1. **Backend Laravel (`VivierController.php`, `CompetenceController.php`)** :
   - Migration `2026_08_28_000700_create_vivier_and_ocr_tables.php` créant `vivier_candidat`, `competence`, `candidat_competence`, `candidat_experience`, `candidat_formation`.
   - Modèles Eloquent : `VivierCandidat`, `Competence`, `CandidatCompetence`, `CandidatExperience`, `CandidatFormation`.
   - Endpoints API :
     - `GET /api/vivier`
     - `POST /api/vivier`
     - `DELETE /api/vivier/{id}`
     - `GET /api/vivier/candidat/{id}/profile`
     - `POST /api/vivier/candidat/{id}/competences`

2. **Frontend React (`VivierView` dans `main.jsx`)** :
   - Interface d'administration RH du Vivier de talents.
   - Modale interactive d'ajout manuel de candidat au vivier.
   - Filtrage propre par direction, domaines validés et bouton réinitialiser avec icône `RotateCcw`.

---

## Fichiers créés ou modifiés

### Fichiers créés
- `app/Http/Controllers/Api/VivierController.php`
- `app/Http/Controllers/Api/CompetenceController.php`
- `app/Models/VivierCandidat.php`
- `app/Models/Competence.php`
- `app/Models/CandidatCompetence.php`
- `doc/suivi-developpement/sprint-5/2026-08-28/vivier-rh-competences.md`

### Fichiers modifiés
- `code_source/recrutement-react/src/main.jsx`
- `code_source/recrutement-react/src/styles.css`
- `doc/suivi-developpement/sprint-5/taches.md`

---

## Explication approfondie du code

### 1. Contrôleur Vivier (`VivierController.php`)
```php
public function index(Request $request): JsonResponse
{
    $query = VivierCandidat::query()
        ->with(['candidat.competences.competence', 'direction', 'domaine']);

    if ($request->filled('q')) {
        $q = trim($request->input('q'));
        $query->whereHas('candidat', function ($sub) use ($q) {
            $sub->where('nom', 'like', "%{$q}%")
                ->orWhere('prenom', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%");
        });
    }

    if ($request->filled('direction')) {
        $query->where('id_direction', $request->input('direction'));
    }

    return response()->json($query->orderByDesc('date_ajout')->get());
}
```

---

## Explication synthétique simple

Le module Vivier RH offre aux recruteurs un espace dédié pour consulter les profils à fort potentiel, rechercher par compétence et alimenter le profil de chaque candidat avec ses diplômes et expériences.

---

## Justification technique

La structure relationnelle `candidat_competence` avec clé étrangère vers `competence` permet des recherches par compétences indexées sans parcours textuel lent.

---

## Commandes de vérification

- **Tests Automatises PHPUnit** : `php artisan test` 👉 **15/15 PASS**.
- **Compilation Production Vite** : `npm run build` 👉 **✓ Built in 0.88s (0 error)**.
