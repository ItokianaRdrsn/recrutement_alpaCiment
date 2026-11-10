# -*- coding: utf-8 -*-
"""
competences_referentiel.py
==========================
Après le NER, vérifie pour chaque compétence extraite si elle existe déjà dans le référentiel Laravel.

La recherche est faite par Laravel (POST /api/public/competences/rapprocher, un seul appel par CV) :
exacte (casse, accents), puis variantes proches (« node.js » / « Nodejs », pluriel, faute de frappe).
Si Laravel est injoignable, le NER continue normalement : les noms restent ceux du CV et Laravel
refait le même rapprochement à l'import.
"""

import logging
import re
import unicodedata
from typing import Any, Dict, List, Optional

import requests

from config import LARAVEL_COMPETENCES_RAPPROCHER_URL

logger = logging.getLogger("AlphaCimentOCR.competences")


def normaliser(nom: Optional[str]) -> str:
    """Minuscules, sans accents, espaces et ponctuation de bord ignorés."""
    texte = unicodedata.normalize("NFKD", str(nom or ""))
    texte = "".join(c for c in texte if not unicodedata.combining(c)).casefold()
    return re.sub(r"\s+", " ", texte).strip(" \t.,;:-")


def rapprocher_competences(noms: List[str]) -> Dict[str, Dict[str, Any]]:
    """
    Interroge Laravel. Retourne {nom_recherché_normalisé: {"existe": bool, "competence": str|None, "methode": str}}.
    Dictionnaire vide en cas d'échec réseau (le NER ne doit jamais échouer à cause de cette étape).
    """
    noms_uniques = list(dict.fromkeys(n for n in noms if isinstance(n, str) and n.strip()))
    if not noms_uniques:
        return {}

    try:
        res = requests.post(LARAVEL_COMPETENCES_RAPPROCHER_URL, json={"noms": noms_uniques[:100]}, timeout=(2, 5))
        if res.status_code != 200:
            logger.warning(f"[Competences] Rapprochement ignoré : HTTP {res.status_code}")
            return {}
        payload = res.json()
        lignes = payload.get("data", []) if isinstance(payload, dict) else payload
        return {
            normaliser(l["recherche"]): l
            for l in lignes
            if isinstance(l, dict) and l.get("recherche")
        }
    except Exception as e:
        logger.warning(f"[Competences] Laravel injoignable ({e}) : noms du CV conservés.")
        return {}


def appliquer_rapprochement(competences: Any, resultats: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Remplace le nom de chaque compétence trouvée par celui du référentiel et fusionne les doublons
    qui en résultent (en gardant le niveau s'il manquait sur la première occurrence).

    Retourne {"competences": [...], "existantes": n, "nouvelles": m}.
    """
    vus: Dict[str, int] = {}
    sortie: List[Any] = []
    existantes = 0

    for comp in competences or []:
        if not isinstance(comp, dict) or not comp.get("nom"):
            sortie.append(comp)
            continue

        trouve = resultats.get(normaliser(comp["nom"]))
        if trouve and trouve.get("existe") and trouve.get("competence"):
            comp = {**comp, "nom": trouve["competence"]}
            existantes += 1

        cle = normaliser(comp["nom"])
        if cle in vus:
            premier = sortie[vus[cle]]
            if isinstance(premier, dict) and not premier.get("niveau") and comp.get("niveau"):
                premier["niveau"] = comp["niveau"]
            continue

        vus[cle] = len(sortie)
        sortie.append(comp)

    total = sum(1 for c in sortie if isinstance(c, dict) and c.get("nom"))
    return {"competences": sortie, "existantes": existantes, "nouvelles": max(0, total - existantes)}
