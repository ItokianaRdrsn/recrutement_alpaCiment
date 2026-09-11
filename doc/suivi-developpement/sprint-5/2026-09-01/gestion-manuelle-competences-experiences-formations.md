# Documentation Sprint 5 - Gestion Manuelle des Compétences, Expériences et Formations Candidat (1,5 j)

## 📌 Objectif de la Tâche
Permettre aux gestionnaires RH de consulter et saisir manuellement le profil complet du candidat :
- **Compétences avec niveau de maîtrise** (`Débutant`, `Intermédiaire`, `Avancé`, `Expert`).
- **Expériences professionnelles** (Intitulé de poste, entreprise, périodes, description).
- **Formations et diplômes** (Diplôme, université/établissement, année d'obtention, domaine d'étude).

---

## 🛠️ Implémentation & Fichiers Sources

### 1. Fichiers Source Backend
- **[VivierController.php](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement/app/Http/Controllers/Api/VivierController.php)** :
  - `getCandidatProfile(idCandidat)` : Récupère les compétences, expériences et formations.
  - `addCompetence(request, idCandidat)` : Ajoute ou met à jour la compétence avec son niveau.
  - `addExperience(request, idCandidat)` : Enregistre une nouvelle expérience pro.
  - `addFormation(request, idCandidat)` : Enregistre une nouvelle formation / diplôme.

### 2. Fichiers Source Frontend
- **[CandidatureDetailView.jsx](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement-react/src/pages/CandidatureDetailView.jsx)** : Onglet dédié *"Profil & Compétences"* permettant la consultation et la saisie en direct des compétences avec niveau (`Débutant`, `Intermédiaire`, `Avancé`, `Expert`), des expériences et des formations.
- **[VivierView.jsx](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement-react/src/pages/VivierView.jsx)** : Fiche/Drawer profil candidat accessible depuis le vivier RH.

---

## 🔄 Explications du Code & Formats

```json
{
  "id_competence": 4,
  "niveau": "Avancé"
}
```

Niveaux de compétences supportés :
- `Débutant`
- `Intermédiaire`
- `Avancé`
- `Expert`
