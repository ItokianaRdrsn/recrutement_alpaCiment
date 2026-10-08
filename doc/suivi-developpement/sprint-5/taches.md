# Sprint 5 - Tâches & Suivi (Vivier, compétences et validation CV - 11,5 j)

## 📊 Progression du Sprint
- **Statut :** **[FAIT]**
- **Progression :** **100.0% terminé** (11.5 / 11.5 j)
- **Barre de progression :** `[████████████████████] 100%`

---

## 📑 Documentation Technique Détaillée du Sprint 5
- [Vivier de talents RH, référentiel des compétences et profil candidat (2026-08-28)](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-5/2026-08-28/vivier-rh-competences.md)
- [Gestion manuelle des compétences, expériences et formations candidat (2026-09-01)](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-5/2026-09-01/gestion-manuelle-competences-experiences-formations.md)
- [Microservice FastAPI OCR & Parsing NLP CV (2026-09-01)](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-5/2026-09-01/microservice-fastapi-paddleocr.md)
- [Validation, correction et rejet des données extraites du CV (2026-10-08)](file:///c:/Users/Strix/OneDrive/Documents/itu/itu_s6/Projet_Soutenance/recrutement_alpaCiment/doc/suivi-developpement/sprint-5/2026-10-08/validation-correction-rejet-ocr.md)

---

## 📋 Détail des Tâches

### BACK-OFFICE / API / OCR

#### **[FAIT]** Gestion du vivier : ajout, retrait, consultation (1,0 j) - **100%**
- **Notes :** Endpoints API `/api/vivier`, table PostgreSQL `vivier_candidat` et interface React avec modale d'ajout, motifs et filtres.

---

#### **[FAIT]** Recherche dans le vivier par compétence, domaine et direction (1,0 j) - **100%**
- **Notes :** Filtres multi-critères combinés (mot-clé `q`, Direction, Domaine, Statut).

---

#### **[FAIT]** CRUD du référentiel des compétences (1,0 j) - **100%**
- **Notes :** Migration `competence` & `type_competence` + endpoints `/api/competences` et vue interactive Back-Office.

---

#### **[FAIT]** Gestion manuelle des compétences, expériences et formations candidat (1,5 j) - **100%**
- **Notes :** Fiche Candidat RH & Vivier permettant d'ajouter et consulter les compétences avec leur niveau (Débutant, Intermédiaire, Avancé, Expert), expériences pro et diplômes.

---

#### **[FAIT]** Intégration FastAPI et microservice OCR dans `code_source/ocr` (2,0 j) - **100%**
- **Notes :** Création du microservice autonome FastAPI `code_source/ocr/` (port 8001) avec PaddleOCR, pypdf et affichage direct du résultat de l'extraction.

---

#### **[FAIT]** Extraction des compétences, expériences et formations depuis le CV (2,0 j) - **100%**
- **Notes :** Module NLP & LLM local Llama 3.2 via Ollama pour structurer automatiquement contact, profil, compétences, expériences et formations.

---

#### **[FAIT]** Validation, correction et rejet des données extraites (2,0 j) - **100%**
- **Notes :** Workflow complet de contrôle RH dans la fiche candidat : bandeau de statut (`en_attente`, `valide`, `corrige`, `rejete`), mode interactif d'édition et de suppression d'éléments extraits, saisie de commentaire RH et boutons d'action d'enregistrement direct dans le profil candidat.

---

#### **[FAIT]** Tests et debug (1,0 j) - **100%**
- **Notes :** Tests automatisés PHPUnit (`OcrValidationTest.php`), validation des suites backend (17/17 au vert) et compilation Vite 0 erreur.

---

## Total Sprint 5 : 11,5 / 11,5 j (100.0% Terminé)
