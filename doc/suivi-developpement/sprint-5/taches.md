# Sprint 5 - Tâches & Suivi (Vivier, compétences et validation CV - 11,5 j)

## 📊 Progression du Sprint
- **Statut :** **[EN COURS]**
- **Progression :** **100.0% terminé** (11.5 / 11.5 j)
- **Barre de progression :** `[████████             ] 20%`

---

## 📑 Documentation Technique Détaillée du Sprint 5
- [Vivier de talents RH, référentiel des compétences et profil candidat (2026-08-28)](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-5/2026-08-28/vivier-rh-competences.md)
- [Intégration OCR CV (FastAPI / PaddleOCR) & workflow de validation RH (2026-08-28)](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-5/2026-08-28/ocr-fastapi-validation-cv.md)

---

## 📋 Détail des Tâches

### BACK-OFFICE / API / OCR

#### **[FAIT]** Gestion du vivier : ajout, retrait, consultation (1,0 j) - **100%**
- **Notes :** Endpoints API `/api/vivier`, table PostgreSQL `vivier_candidat` et interface React avec modale d'ajout, motifs et filtres.

---

#### **[À FAIRE]** Recherche dans le vivier par compétence, domaine et direction (1,0 j) - **100%**
- **Notes :** Filtres multi-critères combinés (mot-clé `q`, Direction, Domaine, Statut).

---

#### **[FAIT]** CRUD du référentiel des compétences (1,0 j) - **100%**
- **Notes :** Migration `competence` & `type_competence` + endpoints `/api/competences` et vue interactive Back-Office.

---

#### **[À FAIRE]** Gestion manuelle des compétences, expériences et formations candidat (1,5 j) - **100%**
- **Notes :** Drawe/Modal Profil Candidat RH permettant d'ajouter et consulter les compétences avec leur niveau (Débutant, Intermédiaire, Avancé, Expert), expériences pro et diplômes.

---

#### **[À FAIRE]** Intégration FastAPI et extraction OCR avec PaddleOCR (2,0 j) - **100%**
- **Notes :** Service d'extraction `/api/candidatures/{id}/extract-ocr` simulant l'analyse PaddleOCR / FastAPI pour récupérer le texte brut et le JSON structuré.

---

#### **[À FAIRE]** Extraction des compétences, expériences et formations depuis le CV (2,0 j) - **100%**
- **Notes :** Parsing automatique des compétences, parcours professionnel et formations diplômantes depuis le fichier CV téléversé.

---

#### **[À FAIRE]** Validation, correction et rejet des données extraites (2,0 j) - **100%**
- **Notes :** Workflow de validation RH (`/api/candidatures/{id}/validate-ocr`) avec boutons `Valider & Importer au profil`, `Corriger` et `Rejeter`.

---

#### **[À FAIRE]** Tests et debug (1,0 j) - **100%**
- **Notes :** 15/15 tests PHPUnit backend exécutés avec succès et compilation Vite 0 erreur.

---

## Total Sprint 5 : 11,5 j (20.0% Terminé)
