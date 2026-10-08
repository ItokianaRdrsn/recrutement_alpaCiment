# 2026-10-08 - Workflow RH de Validation, Correction et Rejet des données extraites du CV (Sprint 5)

## Date

2026-10-08

## Tâche

Mise en place et validation complète du workflow RH permettant de vérifier, corriger et valider ou rejeter les compétences, expériences professionnelles et formations extraites automatiquement du CV par le microservice OCR & LLM local (Llama 3.2), avec persistance dans le profil candidat et journalisation du commentaire RH.

## Pourquoi faire cela

L'extraction optique (OCR) et la structuration sémantique (NER par LLM) facilitent considérablement le travail des recruteurs en pré-remplissant le profil du candidat. Toutefois, pour garantir l'intégrité et la fiabilité des données dans le SIRH, le recruteur RH doit disposer du contrôle final :
1. **Valider** : intégrer directement les compétences, expériences et diplômes identifiés dans le profil du candidat et la base de données relationnelle.
2. **Corriger** : éditer ou supprimer les entités erronées ou les faux positifs (ex: retrait d'une compétence non pertinente, rectification d'un intitulé de poste) avant enregistrement avec statut `corrige`.
3. **Rejeter** : marquer l'extraction comme `rejete` avec motif explicite (ex: document inexploitable ou non conforme) sans altérer le profil candidat.

## Actions réalisées

- **Backend Laravel & Repository** :
  - Ajout de la méthode `updateExtractionOcr(CvExtractionOcr $extraction, array $attributes): CvExtractionOcr` dans `VivierRepositoryInterface` et son implémentation dans `EloquentVivierRepository`.
  - Adaptation de la méthode `validateOcrData()` dans `VivierService` pour persister fidèlement le statut de validation (`valide`, `corrige`, `rejete`) et le commentaire saisi par l'agent RH.
  - Synchronisation transactionnelle des compétences (`syncCandidatCompetence`), des expériences (`createExperience`) et des formations (`createFormation`) lors d'une validation ou d'une correction.
- **Frontend React (`CandidatureDetailView.jsx`)** :
  - Ajout d'un bandeau de statut visuel pour l'état de l'extraction (`En attente`, `Validé`, `Corrigé`, `Rejeté`).
  - Implémentation d'un mode interactif de correction permettant à l'utilisateur RH de supprimer à la volée une compétence, une expérience ou une formation identifiée avant validation.
  - Ajout du champ textuel de commentaire RH ("Commentaire RH sur l'extraction").
  - Ajout de la barre d'actions RH avec les boutons `Valider & Importer au profil`, `Enregistrer les corrections` et `Rejeter les données`.
- **Tests automatisés & Fiabilité** :
  - Création de la suite de tests automatisés `OcrValidationTest.php` couvrant les scénarios de validation, correction et rejet.
  - Résolution des dépendances des tests pour exécuter 17/17 tests PHPUnit au vert (0 échec).
  - Validation de la compilation du build de production Vite/React (0 erreur).

## Fichiers créés ou modifiés

### Fichiers créés

- `code_source/recrutement/tests/Feature/Api/OcrValidationTest.php` : tests unitaires et fonctionnels du service de validation, correction et rejet des données extraites.

### Fichiers modifiés

- `code_source/recrutement/app/Repositories/Contracts/VivierRepositoryInterface.php` : déclaration du contrat de mise à jour de l'extraction OCR.
- `code_source/recrutement/app/Repositories/Eloquent/EloquentVivierRepository.php` : implémentation Eloquent de la mise à jour de l'extraction OCR.
- `code_source/recrutement/app/Services/VivierService.php` : mise à jour de la persistance de l'état de validation et synchronisation du commentaire RH.
- `code_source/recrutement-react/src/pages/CandidatureDetailView.jsx` : composant React enrichi avec l'interface de correction, suppression d'items extraits, commentaire RH et boutons d'action.
- `code_source/recrutement/tests/Unit/DashboardControllerTest.php` : actualisation de l'instanciation du contrôleur Dashboard pour la suite globale de tests.
- `code_source/recrutement/tests/Feature/ExampleTest.php` : prise en compte de la redirection racine vers le frontend React.
- `doc/suivi-developpement/sprint-5/taches.md` : mise à jour de l'avancement du Sprint 5 à 100%.
- `doc/suivi-developpement/planning-sprints.md` : alignement du statut et du tableau général du projet.

## Explication du code

### Service de validation (`VivierService.php`)

```php
public function validateOcrData(int $idCandidature, array $data): CvExtractionOcr
{
    $extraction = $this->vivierRepository->getExtractionOcrByCandidature($idCandidature);
    if (!$extraction) {
        abort(404, 'Extraction OCR introuvable.');
    }

    $extraction = $this->vivierRepository->updateExtractionOcr($extraction, [
        'statut_validation' => $data['statut_validation'],
        'commentaire_rh' => $data['commentaire_rh'] ?? null,
    ]);

    if (in_array($data['statut_validation'], ['valide', 'corrige'], true)) {
        // Enregistrement des compétences, expériences et formations dans les tables du profil
        ...
    }

    return $extraction;
}
```

## Explication simple

Quand un CV est analysé, le recruteur voit sur la même page le document original et les données trouvées par l'intelligence artificielle (coordonnées, compétences, expériences). Il peut désormais relire ces données, cliquer sur une croix pour enlever une fausse détection, taper une remarque (ex: "Poste corrigé"), et cliquer soit sur **"Valider & Importer au profil"**, soit sur **"Enregistrer les corrections"**, soit sur **"Rejeter les données"**. Dès qu'il valide, les compétences et expériences apparaissent automatiquement dans le profil du candidat et alimentent le vivier de compétences RH de l'entreprise.

## Justification technique

- **Architecture découplée en Repositories** : l'accès aux tables `cv_extraction_ocr`, `candidat_competence`, `candidat_experience_professionnelle` et `candidat_formation` passe par le contrat `VivierRepositoryInterface`, ce qui garantit une testabilité totale via des mocks sans impacter la base de production.
- **Sécurité et validation stricte** : la requête `ValidateOcrRequest` filtre les statuts autorisés (`valide`, `corrige`, `rejete`) et empêche toute injection de format imprévu.
- **Ergonomie React synchrone** : le composant met immédiatement à jour les badges d'état et recharge le profil complet du candidat sans recharger toute la page du navigateur.

## Sources

- `[S1]` Documentation Laravel Form Request Validation : https://laravel.com/docs/11.x/validation#form-request-validation
- `[S2]` Cahier des charges AlpA Ciment - Module Vivier, Profil Candidat et Validation CV.

## Vérifications

- Exécution de la suite de tests automatisés :
  ```bash
  php artisan test
  ```
  **Résultat :** `Tests: 17 passed (54 assertions) - 100% Succès`.
- Compilation du projet React en environnement de production :
  ```bash
  npm run build
  ```
  **Résultat :** `✓ built in 2.25s - 0 erreur`.

## Suite logique

Poursuivre sur le **Sprint 6** :
1. Intégration du système de traçabilité et de **Journalisation des actions RH (Audit Log)** (ajouts d'offres, changements de statuts, suppressions).
2. Module de **Gestion des Rendez-vous et Modèles de communications**.
