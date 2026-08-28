# 2026-08-28 - Sprint 4 : Fiche Candidat Détaillée, Historique des Statuts et Export PDF

## Date

2026-08-28

## Tâches accomplies

- Création de la Fiche Candidat RH (`CandidatureDetailView.jsx`) avec présentation en 2 colonnes (carte candidat et informations complètes du dossier).
- Consultation sécurisée des pièces jointes (CV, lettres de motivation, diplômes) avec résolution de l'erreur 403.
- Workflow de changement de statut RH avec saisie de commentaire et enregistrement dans la table `historique_statut`.
- Correction de l'erreur HTTP 500 sur l'API `/api/candidatures/{id}` en alignant le tri de la relation `historique()` sur `date_changement` au lieu de `created_at`.
- Export PDF dynamique du dossier candidat via `/api/candidatures/{id}/export-pdf`.
- Prise en compte de la mention **"Non spécifiée (En attente de validation RH)"** pour les candidatures spontanées dont le domaine n'est pas validé.

---

## Pourquoi faire cela

1. **Centralisation de l'Information RH** : Permettre aux recruteurs d'examiner l'ensemble d'un dossier candidat (coordonnées, documents, historique des décisions) sur un écran dédié.
2. **Traçabilité des Décisions** : Archiver chaque changement d'état (Recue -> Prévisioionné -> Entretien -> Retenue/Non retenue) avec l'auteur et la date exacte (`date_changement`).
3. **Portabilité** : Exporter facilement la fiche sous format PDF imprimable pour les commissions de recrutement.

---

## Actions réalisées

1. **Backend Laravel (`CandidatureController.php` & `Candidature.php`)** :
   - Mise à jour du tri dans la relation `historique()` du modèle `Candidature` :
     `return $this->hasMany(HistoriqueStatut::class, 'id_candidature', 'id_candidature')->orderBy('date_changement', 'desc');`
   - Intégration des horodatages `created_at` et `updated_at` dans la table `candidature` et `historique_statut`.
   - Création de la méthode `exportPdf` retournant le document formaté.

2. **Frontend React (`main.jsx`)** :
   - Implémentation du composant `CandidatureDetailView`.
   - Onglets de navigation interne : *Informations*, *Documents*, *Statut RH*, *Historique statuts*, *Communications*.
   - Traitement explicite des domaines non validés (`valide === false`) affichant l'étiquette *"En attente de validation RH"*.

---

## Fichiers créés ou modifiés

### Fichiers créés
- `doc/suivi-developpement/sprint-4/2026-08-28/fiche-candidat-historique.md`

### Fichiers modifiés
- `app/Models/Candidature.php`
- `app/Models/HistoriqueStatut.php`
- `app/Http/Controllers/Api/CandidatureController.php`
- `code_source/recrutement-react/src/main.jsx`

---

## Explication approfondie du code

### 1. Fix Relation Historique dans `Candidature.php`
```php
public function historique(): HasMany
{
    return $this->hasMany(HistoriqueStatut::class, 'id_candidature', 'id_candidature')
        ->orderBy('date_changement', 'desc');
}
```

### 2. Changement de Statut avec Commentaire dans `CandidatureController.php`
```php
public function updateStatut(Request $request, int $id): JsonResponse
{
    $validated = $request->validate([
        'id_statut_candidature' => ['required', 'exists:statut_candidature,id_statut_candidature'],
        'commentaire' => ['nullable', 'string'],
    ]);

    $candidature = Candidature::findOrFail($id);
    $ancienStatut = $candidature->id_statut_candidature;

    DB::transaction(function () use ($candidature, $validated, $ancienStatut) {
        $candidature->update(['id_statut_candidature' => $validated['id_statut_candidature']]);

        HistoriqueStatut::create([
            'id_candidature' => $candidature->id_candidature,
            'id_statut_candidature' => $validated['id_statut_candidature'],
            'date_changement' => now(),
            'commentaire' => $validated['commentaire'] ?? null,
            'id_utilisateur' => auth()->id(),
        ]);
    });

    return response()->json(['message' => 'Statut mis à jour avec succès.']);
}
```

---

## Explication synthétique simple

La fiche candidat regroupe l'historique complet des évolutions de statut, la consultation directe des documents PDF téléversés et permet aux RH de faire évoluer le dossier avec un motif de décision.

---

## Justification technique

L'utilisation d'une transaction DB garantit la cohérence entre la mise à jour de la table `candidature` et l'insertion dans la table `historique_statut`.

---

## Commandes de vérification

- **Tests Automatises PHPUnit** : `php artisan test` 👉 **15/15 PASS**.
- **Compilation Production Vite** : `npm run build` 👉 **✓ Built in 0.88s (0 error)**.
