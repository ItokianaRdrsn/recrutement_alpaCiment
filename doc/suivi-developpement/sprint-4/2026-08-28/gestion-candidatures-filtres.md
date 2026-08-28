# 2026-08-28 - Sprint 4 : Module de Gestion RH des Candidatures, Arborescences et Filtrage Avancé

## Date

2026-08-28

## Tâches accomplies

- Implémentation du système complet de gestion des candidatures en Back-Office RH (Sprint 4).
- Séparation des filtres **Type de demande** (Sur offre / Spontanée) et **Canal de dépôt** (Portail Web / Saisie RH).
- Prise en compte stricte des **Domaines Validés** (`domaine.valide = true`) pour le rattachement aux Directions.
- Ajout du bouton **Réinitialiser** (`RotateCcw`) pour rétablir tous les filtres à zéro.
- Vues en arborescence :
  - `Direction → Offre → Candidats` (Candidatures sur offre).
  - `Direction → Domaine → Candidatures` (Candidatures spontanées).
- Correctif CSS de centrage vertical dynamique de l'icône de recherche dans le champ de saisie (`top: 50%; transform: translateY(-50%)`).

---

## Pourquoi faire cela

1. **Rigueur Métier RH** : Permettre à l'équipe RH de filtrer sans confusion entre le type de démarche (offre vs spontanée) et l'origine de la saisie (candidat web vs agent RH).
2. **Conformité au Référentiel DB** : Garantir qu'un domaine en attente de validation RH ne rattache pas automatiquement une candidature spontanée à une Direction tant qu'il n'est pas validé.
3. **Ergonomie UI/UX** : Rendre la recherche fluide et permettre de vider tous les critères de filtres en un clic.

---

## Actions réalisées

1. **Backend Laravel (`CandidatureController.php`)** :
   - Mise à jour de l'action `index` pour supporter `type_demande` (offre/spontanée) et `canal_depot` (site_externe/rh_manuel) séparément.
   - Filtrage par direction sur les candidatures spontanées restreint aux seuls domaines validés (`where('valide', true)`).

2. **Frontend React (`main.jsx` & `styles.css`)** :
   - Refonte de `CandidaturesView` avec deux `<select>` distincts pour le Type et le Canal.
   - Ajout d'une fonction `resetFilters` et d'un bouton dédié avec icône `RotateCcw`.
   - Mise à jour du style CSS de `.search-field svg` pour éliminer le décalage vers le bas.

---

## Fichiers créés ou modifiés

### Fichiers créés
- `doc/suivi-developpement/sprint-4/2026-08-28/gestion-candidatures-filtres.md`

### Fichiers modifiés
- `app/Http/Controllers/Api/CandidatureController.php`
- `app/Models/Candidature.php`
- `code_source/recrutement-react/src/main.jsx`
- `code_source/recrutement-react/src/styles.css`
- `doc/suivi-developpement/sprint-4/taches.md`

---

## Explication approfondie du code

### 1. Contrôleur Backend (`CandidatureController.php`)
```php
public function index(Request $request): JsonResponse
{
    $perPage = (int) ($request->input('per_page', 15));
    $query = Candidature::query()
        ->with(['candidat', 'offre.direction', 'domaine.direction', 'typeDemande', 'statut', 'documents']);

    if ($request->filled('type_demande')) {
        $type = strtolower($request->input('type_demande'));
        if ($type === 'offre' || $type === '1') {
            $query->whereNotNull('id_offre');
        } elseif ($type === 'spontanee' || $type === '2') {
            $query->whereNull('id_offre');
        }
    }

    if ($request->filled('canal_depot')) {
        $query->where('canal_depot', $request->input('canal_depot'));
    }

    if ($request->filled('direction')) {
        $directionId = (int) $request->input('direction');
        $query->where(function ($sub) use ($directionId) {
            $sub->whereHas('offre', function ($o) use ($directionId) {
                $o->where('id_direction', $directionId);
            })
            ->orWhereHas('domaine', function ($d) use ($directionId) {
                $d->where('id_direction', $directionId)
                  ->where('valide', true);
            });
        });
    }

    return response()->json($query->orderByDesc('date_candidature')->paginate($perPage));
}
```

### 2. Formulaire de Filtrage React (`main.jsx`)
```jsx
<section className="filter-bar" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
    <label className="search-field" style={{ minWidth: '220px' }}>
        <Search size={18} />
        <input onChange={(e) => setFilters((curr) => ({ ...curr, q: e.target.value }))} value={filters.q} />
    </label>
    <label>
        <span>Type de demande</span>
        <select onChange={(e) => setFilters((curr) => ({ ...curr, type_demande: e.target.value }))} value={filters.type_demande}>
            <option value="">Tous les types</option>
            <option value="offre">Sur offre</option>
            <option value="spontanee">Spontanée</option>
        </select>
    </label>
    <label>
        <span>Canal de dépôt</span>
        <select onChange={(e) => setFilters((curr) => ({ ...curr, canal_depot: e.target.value }))} value={filters.canal_depot}>
            <option value="">Tous les canaux</option>
            <option value="site_externe">Portail Web</option>
            <option value="rh_manuel">Saisie RH</option>
        </select>
    </label>
    <button className="ghost-button" onClick={resetFilters} type="button">
        <RotateCcw size={16} />
        <span>Réinitialiser</span>
    </button>
</section>
```

---

## Explication synthétique simple

Les RH bénéficient d'un tableau de bord de filtrage des candidatures avec des critères indépendants pour le canal de dépôt (Web vs RH) et le type de demande (Offre vs Spontanée). Si un domaine proposé n'a pas encore été validé par la RH, la candidature reste étiquetée "Non spécifiée" au niveau de la Direction.

---

## Justification technique

La vérification explicite `where('valide', true)` empêche l'affichage erroné d'une direction non encore approuvée par le service RH sur les candidatures spontanées.

---

## Commandes de vérification

- **Tests Automatises PHPUnit** : `php artisan test` 👉 **15/15 PASS**.
- **Compilation Production Vite** : `npm run build` 👉 **✓ Built in 0.93s (0 error)**.
