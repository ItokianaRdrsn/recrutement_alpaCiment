# -*- coding: utf-8 -*-
"""
Normalisation des niveaux d'études : quel que soit le libellé du CV (ou l'absence de libellé),
le niveau enregistré est toujours l'un des libellés du référentiel Laravel `niveau`.
"""

import re
import unicodedata
from typing import Any, Dict, List, Optional

NIVEAU_CAP = "CAP / BEP"
NIVEAU_BAC = "Baccalauréat"
NIVEAU_BAC1 = "Bac+1"
NIVEAU_BAC2 = "Bac+2 (BTS / DUT)"
NIVEAU_BAC3 = "Bac+3 (Licence)"
NIVEAU_BAC4 = "Bac+4 (Master 1)"
NIVEAU_BAC5 = "Bac+5 (Master 2 / Ingénieur)"
NIVEAU_BAC8 = "Bac+8 (Doctorat)"

# Libellés autorisés (mêmes valeurs que la table `niveau` côté Laravel, plus Bac+1).
NIVEAUX_CANONIQUES = [NIVEAU_CAP, NIVEAU_BAC, NIVEAU_BAC1, NIVEAU_BAC2, NIVEAU_BAC3, NIVEAU_BAC4, NIVEAU_BAC5, NIVEAU_BAC8]

_PAR_ANNEES = {1: NIVEAU_BAC1, 2: NIVEAU_BAC2, 3: NIVEAU_BAC3, 4: NIVEAU_BAC4, 5: NIVEAU_BAC5, 6: NIVEAU_BAC5, 7: NIVEAU_BAC5, 8: NIVEAU_BAC8}


def _norm(texte: Optional[str]) -> str:
    t = unicodedata.normalize("NFD", str(texte or "").lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn").strip()


def _depuis_texte(texte: Optional[str]) -> Optional[str]:
    t = _norm(texte)
    if not t:
        return None

    if re.search(r"doctorat|\bphd\b|\bthese\b", t):
        return NIVEAU_BAC8

    m = re.search(r"bac\s*\+\s*(\d)", t)
    if m:
        return _PAR_ANNEES.get(int(m.group(1)))

    if re.search(r"ingenieur|master\s*2|\bm2\b|\bmaster\b|\bmsc\b", t) and not re.search(r"master\s*1|\bm1\b", t):
        return NIVEAU_BAC5
    if re.search(r"master\s*1|\bm1\b|maitrise", t):
        return NIVEAU_BAC4
    if re.search(r"licence|bachelor|\bl3\b", t):
        return NIVEAU_BAC3
    if re.search(r"\b(bts|dut|deug|dts|l2)\b", t):
        return NIVEAU_BAC2
    if re.search(r"\b(cap|bep)\b", t):
        return NIVEAU_CAP
    if re.search(r"baccalaureat|\bbac\b|\bserie [a-z]\b", t):
        return NIVEAU_BAC

    return None


def normaliser_niveau(niveau: Optional[str], diplome: Optional[str] = None) -> Optional[str]:
    """Libellé canonique du niveau d'études, ou None s'il est indéterminable.

    Le niveau fourni par le LLM est utilisé en priorité ; à défaut, il est déduit de l'intitulé du diplôme
    (« Master en Télécommunications » -> « Bac+5 (Master 2 / Ingénieur) »).
    """
    return _depuis_texte(niveau) or _depuis_texte(diplome)


def appliquer_niveaux(formations: Any) -> List[Dict[str, Any]]:
    """Met à jour le champ `niveau` de chaque formation (liste de dicts) avec le libellé canonique."""
    if not isinstance(formations, list):
        return formations
    for f in formations:
        if isinstance(f, dict):
            f["niveau"] = normaliser_niveau(f.get("niveau"), f.get("diplome"))
    return formations


NIVEAU_COMPETENCE_DEFAUT = "Intermédiaire"


def normaliser_niveau_competence(niveau: Optional[str]) -> str:
    """Niveau d'une compétence : Débutant | Intermédiaire | Avancé | Expert (Intermédiaire si non précisé).

    Les niveaux de langue (Maternelle, Courant, Bilingue…) ne font pas partie de cette échelle : ils sont
    conservés tels quels par `appliquer_niveaux_competences`.
    """
    t = _norm(niveau)
    if not t:
        return NIVEAU_COMPETENCE_DEFAUT
    if re.search(r"expert|maitrise|specialiste", t):
        return "Expert"
    if re.search(r"avance|confirme|senior|solide|bon\b", t):
        return "Avancé"
    if re.search(r"intermediaire|moyen|correct|operationnel", t):
        return "Intermédiaire"
    if re.search(r"debutant|notion|fondamentaux|basique|initiation|junior|bases?", t):
        return "Débutant"
    return NIVEAU_COMPETENCE_DEFAUT


def appliquer_niveaux_competences(competences: Any) -> Any:
    """Normalise le niveau de chaque compétence (liste de dicts) ; les langues gardent leur niveau d'origine."""
    if not isinstance(competences, list):
        return competences
    for c in competences:
        if not isinstance(c, dict):
            continue
        nom = _norm(c.get("nom"))
        niveau_langue = nom.startswith("langue") and str(c.get("niveau") or "").strip()
        if niveau_langue:
            continue
        c["niveau"] = normaliser_niveau_competence(c.get("niveau"))
    return competences
