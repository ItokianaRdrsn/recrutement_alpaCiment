# -*- coding: utf-8 -*-
"""
cv_nlp_parser.py
=================
Module de parsing NLP des CVs pour AlpA Ciment.

Remplace le stub à données figées par une vraie extraction :
    - Sectionnement heuristique du texte OCR brut (contact / compétences /
      expériences / formations / langues / divers)
    - NER français (spaCy) pour repérer personnes (PER) et organisations (ORG/MISC)
    - Extraction de dates (regex + dateparser) pour les périodes d'expérience
      et les dates d'obtention de diplôme
    - Rapprochement des compétences citées dans le CV avec un référentiel
      (rapidfuzz pour tolérer les fautes/OCR), avec un score de confiance

La sortie JSON est directement alignée sur les colonnes utiles des tables :
    candidat_competence, candidat_experience_professionnelle, candidat_formation
(les FK id_candidature / id_document / valide / valide_par / date_validation
restent à la charge de l'appelant, qui connaît le contexte candidature/document).
"""

import re
import json
import logging
import unicodedata
from datetime import date, datetime
from typing import Optional, List, Dict, Any, Tuple

logger = logging.getLogger("AlpaCimentOCR.nlp")

# ----------------------------------------------------------------------------
# Dépendances NLP optionnelles (le microservice doit continuer à fonctionner,
# en mode dégradé, même si le modèle spaCy n'est pas installé)
# ----------------------------------------------------------------------------
SPACY_AVAILABLE = False
_NLP_MODEL = None
_SPACY_MODEL_NAME = None

for _model_name in ("fr_core_news_md", "fr_core_news_sm"):
    try:
        import spacy  # noqa: F401
        _NLP_MODEL = spacy.load(_model_name)
        SPACY_AVAILABLE = True
        _SPACY_MODEL_NAME = _model_name
        logger.info(f"Modèle spaCy '{_model_name}' chargé pour la NER (PER/ORG).")
        break
    except Exception:
        continue

if not SPACY_AVAILABLE:
    logger.warning(
        "Aucun modèle spaCy français disponible (fr_core_news_md/sm). "
        "La détection d'entités (personnes, entreprises) passera en mode "
        "heuristique pur (regex), moins précis. "
        "Installer via : python -m spacy download fr_core_news_md"
    )

try:
    from rapidfuzz import fuzz
    RAPIDFUZZ_AVAILABLE = True
except Exception:
    RAPIDFUZZ_AVAILABLE = False
    logger.warning("rapidfuzz non disponible : le matching de compétences sera en mode exact uniquement.")

try:
    import dateparser
    DATEPARSER_AVAILABLE = True
except Exception:
    DATEPARSER_AVAILABLE = False
    logger.warning("dateparser non disponible : le parsing de dates sera plus limité.")


# ----------------------------------------------------------------------------
# Référentiel de compétences par défaut
# ----------------------------------------------------------------------------
DEFAULT_SKILLS_REFERENTIEL: List[Dict[str, Any]] = [
    {"nom": "PHP / Laravel", "aliases": ["php", "laravel"]},
    {"nom": "React.js", "aliases": ["react", "react.js", "reactjs"]},
    {"nom": "Vue.js", "aliases": ["vue", "vue.js", "vuejs"]},
    {"nom": "JavaScript / TypeScript", "aliases": ["javascript", "typescript", "js", "ts"]},
    {"nom": "PostgreSQL / SQL", "aliases": ["postgresql", "postgres", "sql", "mysql"]},
    {"nom": "Python / FastAPI", "aliases": ["python", "fastapi", "django", "flask"]},
    {"nom": "Java / Spring", "aliases": ["java", "spring", "spring boot", "springboot"]},
    {"nom": "Gestion de Projet RH", "aliases": ["gestion de projet rh", "gestion rh", "ressources humaines", "rh"]},
    {"nom": "Docker & DevOps", "aliases": ["docker", "devops", "kubernetes", "ci/cd", "cicd"]},
    {"nom": "Comptabilité / Finance", "aliases": ["comptabilite", "comptabilité", "finance", "controle de gestion"]},
    {"nom": "Maintenance Industrielle", "aliases": ["maintenance industrielle", "maintenance", "gmao"]},
    {"nom": "Gestion de la Paie", "aliases": ["paie", "gestion de la paie", "payroll"]},
    {"nom": "Excel / Bureautique", "aliases": ["excel", "bureautique", "pack office", "microsoft office"]},
    {"nom": "Anglais", "aliases": ["anglais", "english"]},
    {"nom": "Communication", "aliases": ["communication"]},
    {"nom": "Management d'équipe", "aliases": ["management", "manager une equipe", "encadrement d'equipe"]},
]

NIVEAU_KEYWORDS = [
    (r"\bexpert(e)?\b", "Expert"),
    (r"\bavanc[ée]e?\b", "Avancé"),
    (r"\bma[iî]tris[ée]e?\b", "Avancé"),
    (r"\binterm[ée]diaire\b", "Intermédiaire"),
    (r"\bop[ée]rationnel(le)?\b", "Intermédiaire"),
    (r"\bd[ée]butant(e)?\b", "Débutant"),
    (r"\bnotions?\b", "Débutant"),
    (r"\bbase(s)?\b", "Débutant"),
]

# ----------------------------------------------------------------------------
# Sections
# ----------------------------------------------------------------------------
SECTION_PATTERNS: Dict[str, str] = {
    "contact": r"contact|coordonn[ée]es|informations?\s+personnelles?",
    "profil": r"profil|r[ée]sum[ée]\s+professionnel|objectifs?\s+professionnels?|[aà]\s+propos",
    "competences": r"comp[ée]tences?(\s+(techniques?|cl[ée]s?|professionnelles?))?|savoir[\s-]faire|skills?",
    "experiences": r"exp[ée]riences?(\s+professionnelles?)?|parcours\s+professionnel|emplois?",
    "formations": r"formations?|dipl[oô]mes?(\s+obtenus?)?|parcours\s+acad[ée]mique|[ée]tudes|cursus",
    "langues": r"langues?(\s+parl[ée]es?)?",
    "divers": r"centres?\s+d.?int[ée]r[êe]ts?|loisirs|hobb(y|ies)|divers",
}
_COMPILED_SECTIONS = {name: re.compile(pattern, re.IGNORECASE) for name, pattern in SECTION_PATTERNS.items()}


def _strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)
    )


def _is_section_header(line: str) -> Optional[str]:
    """Retourne le nom canonique de la section si la ligne ressemble à un titre, sinon None."""
    clean = re.sub(r"[^\w\sàâäéèêëïîôöùûüÿçœ]", " ", line, flags=re.IGNORECASE).strip()
    clean = re.sub(r"\s+", " ", clean)
    if not clean or len(clean) > 45:
        return None
    for name, pattern in _COMPILED_SECTIONS.items():
        if re.fullmatch(pattern.pattern + r"s?", clean, re.IGNORECASE):
            return name
        if len(clean.split()) <= 5 and pattern.search(clean):
            return name
    return None


def split_into_sections(raw_text: str) -> Dict[str, str]:
    """Découpe le texte OCR brut en sections logiques. Fallback: tout dans 'general'."""
    lines = raw_text.splitlines()
    sections: Dict[str, List[str]] = {}
    current = "general"
    sections[current] = []

    for line in lines:
        header = _is_section_header(line)
        if header:
            current = header
            sections.setdefault(current, [])
            continue
        sections.setdefault(current, []).append(line)

    return {name: "\n".join(chunk).strip() for name, chunk in sections.items() if "\n".join(chunk).strip()}


# ----------------------------------------------------------------------------
# Contact / identité
# ----------------------------------------------------------------------------
EMAIL_RE = re.compile(r"[\w.\-+]+@[\w\-]+\.[\w.\-]+")
PHONE_RE = re.compile(
    r"(\+?261[\s.\-]?)?(0?3[2-4][\s.\-]?\d{2}[\s.\-]?\d{3}[\s.\-]?\d{2})"  # Madagascar
    r"|(\+?\d{1,3}[\s.\-]?)?(\(?\d{2,4}\)?[\s.\-]?){2,5}\d{2,4}"
)
NAME_LINE_RE = re.compile(r"^([A-ZÀ-Ý][A-Za-zÀ-ÿ'\-]+(\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ'\-]+){1,3})$")


def extract_contact(raw_text: str, sections: Dict[str, str]) -> Dict[str, Optional[str]]:
    email_match = EMAIL_RE.search(raw_text)
    phone_match = PHONE_RE.search(raw_text)

    nom_complet = None
    head_text = "\n".join(raw_text.splitlines()[:6])

    if SPACY_AVAILABLE:
        doc = _NLP_MODEL(head_text)
        persons = [ent.text.strip() for ent in doc.ents if ent.label_ == "PER"]
        if persons:
            nom_complet = max(persons, key=len)

    if not nom_complet:
        for line in raw_text.splitlines()[:6]:
            line = line.strip()
            if NAME_LINE_RE.match(line) and "CV" not in line.upper() and "CURRICULUM" not in line.upper():
                nom_complet = line
                break

    return {
        "nom_complet": nom_complet,
        "email": email_match.group(0) if email_match else None,
        "telephone": re.sub(r"\s+", " ", phone_match.group(0)).strip() if phone_match else None,
    }


# ----------------------------------------------------------------------------
# Compétences
# ----------------------------------------------------------------------------
def _normalize_referentiel(referentiel: Optional[List[Any]]) -> List[Dict[str, Any]]:
    if not referentiel:
        return DEFAULT_SKILLS_REFERENTIEL
    normalized = []
    for item in referentiel:
        if isinstance(item, str):
            normalized.append({"nom": item, "aliases": [item]})
        elif isinstance(item, dict) and "nom" in item:
            aliases = item.get("aliases") or [item["nom"]]
            normalized.append({**item, "aliases": aliases})
    return normalized or DEFAULT_SKILLS_REFERENTIEL


def _detect_niveau(context_window: str) -> Optional[str]:
    ctx = _strip_accents(context_window.lower())
    for pattern, label in NIVEAU_KEYWORDS:
        if re.search(_strip_accents(pattern), ctx):
            return label
    return None


def extract_competences(
    raw_text: str,
    sections: Dict[str, str],
    referentiel: Optional[List[Any]] = None,
) -> List[Dict[str, Any]]:
    """Rapproche le texte du CV avec un référentiel de compétences (exact + fuzzy)."""
    skills_ref = _normalize_referentiel(referentiel)
    search_text = sections.get("competences") or raw_text
    search_norm = _strip_accents(search_text.lower())
    lines = search_text.splitlines() or [search_text]

    results: Dict[str, Dict[str, Any]] = {}

    for skill in skills_ref:
        best_score = 0.0
        best_line = ""
        matched_exact = False

        for alias in skill["aliases"]:
            alias_norm = _strip_accents(alias.lower())
            if re.search(r"\b" + re.escape(alias_norm) + r"\b", search_norm):
                matched_exact = True
                best_score = 1.0
                for line in lines:
                    if alias_norm in _strip_accents(line.lower()):
                        best_line = line
                        break
                break

        if not matched_exact and RAPIDFUZZ_AVAILABLE:
            for alias in skill["aliases"]:
                alias_norm = _strip_accents(alias.lower())
                for line in lines:
                    line_norm = _strip_accents(line.lower())
                    if not line_norm.strip():
                        continue
                    ratio = fuzz.partial_ratio(alias_norm, line_norm) / 100.0
                    if ratio > best_score:
                        best_score = ratio
                        best_line = line

        if matched_exact:
            score_confiance = 0.90
        elif best_score >= 0.85:
            score_confiance = round(best_score * 0.80, 3)
        else:
            continue

        niveau = _detect_niveau(best_line) if best_line else None
        if niveau:
            score_confiance = round(min(score_confiance + 0.05, 1.0), 3)

        nom = skill["nom"]
        if nom not in results or results[nom]["score_confiance"] < score_confiance:
            entry = {
                "nom": nom,
                "niveau": niveau or "Intermédiaire",
                "source": "cv_ocr",
                "score_confiance": round(score_confiance, 3),
            }
            if "id_competence" in skill:
                entry["id_competence"] = skill["id_competence"]
            results[nom] = entry

    return list(results.values())


# ----------------------------------------------------------------------------
# Dates
# ----------------------------------------------------------------------------
MONTHS_PATTERN = (
    r"janvier|janv\.?|f[ée]vrier|f[ée]vr\.?|mars|avril|avr\.?|mai|juin|"
    r"juillet|juil\.?|ao[uû]t|septembre|sept\.?|octobre|oct\.?|"
    r"novembre|nov\.?|d[ée]cembre|d[ée]c\.?"
)
DATE_TOKEN = (
    r"(?:\d{1,2}\s*[/.\-]\s*\d{1,2}\s*[/.\-]\s*\d{2,4}"
    r"|(?:\d{1,2}\s+)?(?:" + MONTHS_PATTERN + r")\s+\d{4}"
    r"|\d{1,2}\s*[/.\-]\s*\d{4}"
    r"|\d{4})"
)
CURRENT_KEYWORDS_RE = re.compile(
    r"aujourd'?\s*hui|pr[ée]sent(e)?|actuel(le)?|en\s+cours|[àa]\s+ce\s+jour", re.IGNORECASE
)
DATE_RANGE_RE = re.compile(
    r"(?P<start>" + DATE_TOKEN + r")\s*(?:-|–|—|[àa]|au)\s*"
    r"(?P<end>" + DATE_TOKEN + r"|aujourd'?\s*hui|pr[ée]sent(?:e)?|actuel(?:le)?|en\s+cours)",
    re.IGNORECASE,
)
SINGLE_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")


def _parse_date_token(token: str, end_of_period: bool = False) -> Optional[str]:
    """Retourne une date ISO (YYYY-MM-DD) à partir d'un fragment de texte, ou None."""
    token = token.strip()
    if not token:
        return None
    if DATEPARSER_AVAILABLE:
        settings = {
            "PREFER_DAY_OF_MONTH": "last" if end_of_period else "first",
            "REQUIRE_PARTS": ["year"],
        }
        parsed = dateparser.parse(token, languages=["fr"], settings=settings)
        if parsed:
            return parsed.date().isoformat()
    year_match = SINGLE_YEAR_RE.search(token)
    if year_match:
        year = int(year_match.group(0))
        return date(year, 12 if end_of_period else 1, 1).isoformat()
    return None


# ----------------------------------------------------------------------------
# Expériences professionnelles
# ----------------------------------------------------------------------------
SEPARATORS_POSTE_ENTREPRISE = re.compile(
    r"\s*(?:[-–—|@]|chez|au sein de|pour)\s*", re.IGNORECASE
)


def _find_org_entity(text: str) -> Optional[str]:
    if not SPACY_AVAILABLE or not text.strip():
        return None
    doc = _NLP_MODEL(text)
    for ent in doc.ents:
        if ent.label_ in ("ORG", "MISC"):
            return ent.text.strip()
    return None


def _split_blocks_by_regex(section_text: str, anchor_re: re.Pattern) -> List[str]:
    """Découpe une section en blocs, chaque bloc démarrant sur une occurrence de anchor_re."""
    matches = list(anchor_re.finditer(section_text))
    if not matches:
        return [section_text] if section_text.strip() else []

    blocks = []
    starts = []
    for m in matches:
        line_start = section_text.rfind("\n", 0, m.start()) + 1
        if not starts or line_start != starts[-1]:
            starts.append(line_start)
    starts.append(len(section_text))

    for i in range(len(starts) - 1):
        block = section_text[starts[i]: starts[i + 1]].strip()
        if block:
            blocks.append(block)
    return blocks


def extract_experiences(raw_text: str, sections: Dict[str, str]) -> List[Dict[str, Any]]:
    section_text = sections.get("experiences")
    if not section_text:
        return []

    blocks = _split_blocks_by_regex(section_text, DATE_RANGE_RE)
    experiences = []

    for block in blocks:
        confidence = 0.45
        range_match = DATE_RANGE_RE.search(block)

        date_debut = None
        date_fin = None
        poste_actuel = False

        if range_match:
            date_debut = _parse_date_token(range_match.group("start"), end_of_period=False)
            end_raw = range_match.group("end")
            if CURRENT_KEYWORDS_RE.fullmatch(end_raw.strip()):
                poste_actuel = True
                date_fin = None
            else:
                date_fin = _parse_date_token(end_raw, end_of_period=True)
            if date_debut:
                confidence += 0.20
            if date_fin or poste_actuel:
                confidence += 0.15
            remaining = (block[: range_match.start()] + " " + block[range_match.end():]).strip()
        else:
            remaining = block

        remaining_lines = [l.strip(" •-\t") for l in remaining.splitlines() if l.strip(" •-\t")]
        poste, entreprise, description = None, None, None

        if remaining_lines:
            first_line = remaining_lines[0]
            parts = SEPARATORS_POSTE_ENTREPRISE.split(first_line, maxsplit=1)
            parts = [p.strip() for p in parts if p and p.strip()]
            if len(parts) >= 2:
                poste, entreprise = parts[0], parts[1]
            else:
                poste = first_line

            org_found = _find_org_entity(first_line)
            if org_found:
                entreprise = org_found
                if poste and org_found.lower() in poste.lower():
                    poste = poste.lower().replace(org_found.lower(), "").strip(" -–—|") or poste

            description = " ".join(remaining_lines[1:]).strip() or None

        if poste:
            confidence += 0.10
        if entreprise:
            confidence += 0.10

        if not poste and not entreprise:
            continue

        experiences.append({
            "poste": poste or "Poste non déterminé",
            "entreprise": entreprise,
            "date_debut": date_debut,
            "date_fin": date_fin,
            "poste_actuel": poste_actuel,
            "description": description,
            "source": "cv_ocr",
            "score_confiance": round(min(confidence, 0.95), 3),
        })

    return experiences


# ----------------------------------------------------------------------------
# Formations
# ----------------------------------------------------------------------------
DIPLOME_KEYWORDS = [
    (r"doctorat|phd|ph\.d", "Doctorat", "Bac+8"),
    (r"master\s*2|master\s*ii|bac\s*\+?\s*5|mba|ing[ée]nieur", "Master / Ingénieur", "Bac+5"),
    (r"master\s*1|master\s*i|bac\s*\+?\s*4", "Master 1", "Bac+4"),
    (r"licence|bachelor|bac\s*\+?\s*3", "Licence", "Bac+3"),
    (r"bts|dut|bac\s*\+?\s*2|dip[lô]me\s+universitaire\s+de\s+technologie", "BTS / DUT", "Bac+2"),
    (r"baccalaur[ée]at|\bbac\b(?!\s*\+)", "Baccalauréat", "Bac"),
    (r"\bcap\b|\bbep\b", "CAP / BEP", "CAP/BEP"),
]
ETABLISSEMENT_KEYWORDS_RE = re.compile(
    r"((?:universit[ée]|institut|[ée]cole|facult[ée]|lyc[ée]e|centre\s+de\s+formation)[^\n,.;]{0,60})",
    re.IGNORECASE,
)


def extract_formations(raw_text: str, sections: Dict[str, str]) -> List[Dict[str, Any]]:
    section_text = sections.get("formations")
    if not section_text:
        return []

    if DATE_RANGE_RE.search(section_text):
        blocks = _split_blocks_by_regex(section_text, DATE_RANGE_RE)
    else:
        blocks = _split_blocks_by_regex(section_text, SINGLE_YEAR_RE)

    formations = []

    for block in blocks:
        confidence = 0.45
        block_norm = _strip_accents(block.lower())

        date_obtention = None
        range_match = DATE_RANGE_RE.search(block)
        if range_match:
            end_raw = range_match.group("end")
            if not CURRENT_KEYWORDS_RE.fullmatch(end_raw.strip()):
                date_obtention = _parse_date_token(end_raw, end_of_period=True)
            if not date_obtention:
                date_obtention = _parse_date_token(range_match.group("start"), end_of_period=True)
        else:
            year_match = SINGLE_YEAR_RE.search(block)
            if year_match:
                date_obtention = date(int(year_match.group(0)), 1, 1).isoformat()
        if date_obtention:
            confidence += 0.15

        diplome, niveau = None, None
        for pattern, label, niveau_label in DIPLOME_KEYWORDS:
            if re.search(_strip_accents(pattern), block_norm):
                diplome, niveau = label, niveau_label
                confidence += 0.20
                break

        first_line = next((l.strip(" •-\t") for l in block.splitlines() if l.strip(" •-\t")), "")
        if not diplome:
            diplome = first_line or None
        else:
            if first_line and len(first_line) > len(diplome):
                diplome = first_line

        etablissement = None
        etab_match = ETABLISSEMENT_KEYWORDS_RE.search(block)
        if etab_match:
            etablissement = etab_match.group(0).strip()
            confidence += 0.10
        else:
            org_found = _find_org_entity(block)
            if org_found:
                etablissement = org_found
                confidence += 0.10

        domaine_etude = None
        domaine_match = re.search(
            r"(?:sp[ée]cialit[ée]|filière|domaine|en)\s+([A-ZÀ-Ýa-zà-ÿ' ]{3,50})",
            block,
            re.IGNORECASE,
        )
        if domaine_match:
            domaine_etude = domaine_match.group(1).strip(" .,;")

        if not diplome:
            continue

        formations.append({
            "diplome": diplome,
            "etablissement": etablissement,
            "domaine_etude": domaine_etude,
            "niveau": niveau,
            "date_obtention": date_obtention,
            "source": "cv_ocr",
            "score_confiance": round(min(confidence, 0.95), 3),
        })

    return formations


# ----------------------------------------------------------------------------
# Point d'entrée principal
# ----------------------------------------------------------------------------
def parse_cv_text_to_json(
    raw_text: str,
    filename: str,
    referentiel_competences: Optional[List[Any]] = None,
) -> Dict[str, Any]:
    """Parseur NLP : découpe en sections, puis extrait contact/compétences/expériences/formations."""
    sections = split_into_sections(raw_text)

    return {
        "texte_brut": raw_text,
        "contact": extract_contact(raw_text, sections),
        "competences": extract_competences(raw_text, sections, referentiel_competences),
        "experiences": extract_experiences(raw_text, sections),
        "formations": extract_formations(raw_text, sections),
        "_meta": {
            "sections_detectees": list(sections.keys()),
            "moteur_ner": _SPACY_MODEL_NAME if SPACY_AVAILABLE else None,
        },
    }
