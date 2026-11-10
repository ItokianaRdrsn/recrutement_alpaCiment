# -*- coding: utf-8 -*-
"""
document_classifier.py
======================
Module d'identification et de classification intelligente de documents.
Permet d'identifier avec certitude le véritable CV parmi plusieurs pièces jointes
(CV, lettre de motivation, diplômes, photos, signatures).
"""

import re
from typing import Any, Dict, List, Optional

CV_KEYWORDS = [
    "experience", "experiences", "expérience", "expériences",
    "formation", "formations",
    "competence", "competences", "compétence", "compétences",
    "diplome", "diplomes", "diplôme", "diplômes",
    "education", "éducation", "poste", "langues", "projets", "cursus",
    "contact", "profil", "etudes", "études",
    "baccalaureat", "baccalauréat", "licence", "master", "doctorat",
    "coordonnees", "coordonnées", "telephone", "téléphone", "email",
    "parcours", "centres d'interet", "centres d'intérêt", "hard skills", "soft skills"
]

LM_KEYWORDS = [
    "madame", "monsieur", "madame, monsieur", "veuillez agreer", "veuillez agréer",
    "dans l'attente", "lettre de motivation", "objet :", "objet:", "candidature au poste",
    "j'ai l'honneur", "je sollicite", "passionne par", "passionné par",
    "salutations distinguees", "salutations distinguées", "actuellement a la recherche",
    "actuellement à la recherche", "soumettre ma candidature", "votre bienveillance"
]

DIPLOME_KEYWORDS = [
    "certifie que", "decerne a", "décerné à", "recteur", "session", "proces-verbal",
    "procès-verbal", "attestation de reussite", "attestation de réussite", "bulletin de notes",
    "releve de notes", "relevé de notes", "republique", "république", "ministere", "ministère",
    "a satisfait aux epreuves", "a satisfait aux épreuves", "vu les textes", "grade de",
    "decision du jury", "décision du jury", "attestation d'inscription"
]


def score_text_density(text_lower: str, keywords: List[str]) -> int:
    """Compte les occurrences distinctes de mots-clés dans le texte normalisé."""
    if not text_lower:
        return 0
    count = 0
    for kw in keywords:
        if kw in text_lower:
            count += 1
    return count


def _fn_has(fn_lower: str, tokens: List[str]) -> bool:
    """
    Vrai si l'un des tokens apparaît comme MOT ENTIER dans le nom de fichier
    (séparateurs : espace, _, -, ., chiffres). Évite les faux positifs par
    sous-chaîne : « lm » dans « film », « cin » dans « medecine ».
    """
    words = [w for w in re.split(r"[^a-zàâäéèêëïîôöùûüç]+", fn_lower) if w]
    return any(t in words for t in tokens)


def classify_document(text: str, filename: str = "", file_size: int = 0) -> Dict[str, Any]:
    """
    Analyse un document à partir de son nom, de sa taille et de son contenu textuel
    pour déterminer sa nature exacte : 'CV', 'LETTRE_MOTIVATION', 'DIPLOME', 'PHOTO', 'AUTRE'.
    """
    fn_lower = (filename or "").lower()
    text_lower = (text or "").lower()
    size_kb = file_size / 1024 if file_size > 0 else 0

    score_cv = 0
    score_lm = 0
    score_diplome = 0

    # -------------------------------------------------------------------------
    # 1. ANALYSE DU NOM DE FICHIER (Heuristique rapide)
    # -------------------------------------------------------------------------
    # Marqueurs explicites CV
    if re.search(r"\b(cv|curriculum|resume|profil)\b", fn_lower) or "cv_" in fn_lower or "_cv" in fn_lower or "-cv" in fn_lower:
        score_cv += 60

    # Marqueurs explicites Lettre de motivation
    if _fn_has(fn_lower, ["lettre", "motivation", "lm", "cover"]):
        score_lm += 60
        score_cv -= 40

    # Marqueurs explicites Diplôme / Certificat / Pièces administratives
    if _fn_has(fn_lower, ["diplome", "diplôme", "certif", "certificat", "attestation", "cin", "releve", "relevé", "bulletin", "recommandation"]):
        score_diplome += 60
        score_cv -= 40

    # Marqueurs explicites Photo
    if _fn_has(fn_lower, ["photo", "portrait", "avatar", "badge"]):
        score_cv -= 50

    # -------------------------------------------------------------------------
    # 2. ANALYSE DU FORMAT ET DE LA TAILLE
    # -------------------------------------------------------------------------
    if fn_lower.endswith(".pdf") or fn_lower.endswith(".docx") or fn_lower.endswith(".doc"):
        score_cv += 10
        score_lm += 10
        score_diplome += 10

    if 30 <= size_kb <= 5000:
        score_cv += 10

    # -------------------------------------------------------------------------
    # 3. ANALYSE DU CONTENU TEXTUEL (OCR / PyPDF)
    # -------------------------------------------------------------------------
    cv_hits = score_text_density(text_lower, CV_KEYWORDS)
    lm_hits = score_text_density(text_lower, LM_KEYWORDS)
    diplome_hits = score_text_density(text_lower, DIPLOME_KEYWORDS)

    # Pondération du texte : chaque hit de rubrique CV apporte +8 points
    score_cv += cv_hits * 8
    score_lm += lm_hits * 12
    score_diplome += diplome_hits * 12

    # Recherche de motifs typiques d'un CV : présence de plages d'années (ex: 2020 - 2023)
    year_ranges = len(re.findall(r"\b(20\d\d|19\d\d)\s*[-–àa]\s*(20\d\d|present|présent|ce jour|aujourd'hui)\b", text_lower))
    if year_ranges > 0:
        score_cv += min(year_ranges * 10, 30)

    # Présence de numéro de téléphone malgache ou international
    if re.search(r"(\+261|032|033|034|037|038)\s*\d{2}\s*\d{2,3}", text_lower):
        score_cv += 15

    # Détection de lettre : formule de politesse forte élimine le CV
    if "veuillez agreer" in text_lower or "veuillez agréer" in text_lower or "madame, monsieur" in text_lower:
        score_cv -= 25
        score_lm += 30

    # Normalisation des scores entre 0 et 100
    score_cv = max(0, min(100, score_cv))
    score_lm = max(0, min(100, score_lm))
    score_diplome = max(0, min(100, score_diplome))

    # Détermination du type prédit
    max_score = max(score_cv, score_lm, score_diplome)
    if max_score < 15 and not text.strip():
        # Pas de texte lisible
        if any(fn_lower.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
            type_predit = "PHOTO"
        else:
            type_predit = "AUTRE"
    elif max_score == score_cv and score_cv >= 25:
        type_predit = "CV"
    elif max_score == score_lm and score_lm >= 25:
        type_predit = "LETTRE_MOTIVATION"
    elif max_score == score_diplome and score_diplome >= 25:
        type_predit = "DIPLOME"
    else:
        # Fallback si ambigu
        type_predit = "CV" if score_cv >= score_lm else "AUTRE"

    return {
        "filename": filename,
        "est_cv": (type_predit == "CV"),
        "type_predit": type_predit,
        "score_cv": score_cv,
        "score_lm": score_lm,
        "score_diplome": score_diplome,
        "cv_hits": cv_hits,
        "lm_hits": lm_hits,
        "diplome_hits": diplome_hits,
    }


IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".heic")
MIN_CV_SCORE = 30


def _safe_score(val: Any) -> float:
    try:
        return float(val) if val is not None else 0.0
    except (ValueError, TypeError):
        return 0.0


def select_best_cv(documents: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Parmi une liste de documents classifiés, élit le meilleur candidat pour être le CV
    et regroupe les autres pièces jointes (Photo, LM, Diplômes).
    
    Améliorations intégrées :
    - Double clé de tri : Priorité au type prédit 'CV' pour qu'une LM bruitée ne batte pas un vrai CV
    - Exclusion stricte : Une pure PHOTO ne peut pas être élue comme CV
    - Détection d'ambiguïté : Flag 'ambigu: True' si 2 CVs ont des scores très proches (< 10 pts)
    - Seuil MIN_CV_SCORE (30) : Si aucun document n'atteint le score minimum, best_cv est None
    """
    if not documents:
        return {
            "best_cv": None,
            "best_cv_filename": None,
            "confiance": 0.0,
            "ambigu": False,
            "photo": None,
            "pieces_jointes": [],
            "documents": [],
        }

    # 1. Exclusion stricte : une pure PHOTO ne peut pas être un CV
    cv_candidates = [
        d for d in documents
        if (d.get("type_predit") or "").upper() != "PHOTO"
    ]

    # Si tous les documents reçus sont des photos (aucun document bureautique/CV)
    if not cv_candidates:
        photo_doc = documents[0] if documents else None
        pj = documents[1:] if len(documents) > 1 else []
        return {
            "best_cv": None,
            "best_cv_filename": None,
            "confiance": 0.0,
            "ambigu": False,
            "photo": photo_doc,
            "pieces_jointes": pj,
            "documents": documents,
        }

    # 2. Tri à double clé :
    #    (1) Priorité absolue aux documents dont le type prédit est 'CV' face aux LM/Diplômes
    #    (2) Score CV descendant
    sorted_candidates = sorted(
        cv_candidates,
        key=lambda d: (
            (d.get("type_predit") or "").upper() == "CV",
            _safe_score(d.get("score_cv")),
        ),
        reverse=True,
    )

    best_candidate = None
    best_score = _safe_score(sorted_candidates[0].get("score_cv"))
    ambigu = False

    # 3. Élection du CV si seuil MIN_CV_SCORE atteint
    if best_score >= MIN_CV_SCORE:
        best_candidate = sorted_candidates[0]
        # Détection d'ambiguïté (ex: 2 versions de CV ou scores très proches)
        if len(sorted_candidates) > 1:
            second_score = _safe_score(sorted_candidates[1].get("score_cv"))
            if second_score >= MIN_CV_SCORE and (best_score - second_score) <= 10:
                ambigu = True

    # 4. Répartition des autres fichiers : Photo de profil vs Pièces jointes
    photo_doc = None
    pieces_jointes = []
    remaining_docs = [d for d in documents if d is not best_candidate]

    for doc in remaining_docs:
        fn = (doc.get("filename") or "").lower()
        t = (doc.get("type_predit") or "AUTRE").upper()

        is_photo = (t == "PHOTO") or (
            t == "AUTRE" and any(fn.endswith(ext) for ext in IMAGE_EXTENSIONS)
        )

        if is_photo and photo_doc is None:
            photo_doc = doc
        else:
            pieces_jointes.append(doc)

    return {
        "best_cv": best_candidate,
        "best_cv_filename": best_candidate.get("filename") if best_candidate else None,
        "confiance": min(1.0, round(best_score / 100.0, 2)) if best_candidate else 0.0,
        "ambigu": ambigu,
        "photo": photo_doc,
        "pieces_jointes": pieces_jointes,
        "documents": sorted_candidates,
    }
