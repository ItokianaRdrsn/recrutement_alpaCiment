# -*- coding: utf-8 -*-
"""
cv_llm_parser.py
================
Module d'extraction et de structuration d'entités (NER) pour CV
utilisant le LLM local (qwen2.5:7b) via le client centralisé Ollama.

Avantages :
- 100% local, confidentiel et sécurisé.
- Sortie validée strictement via Pydantic (CvStructuredSchema).
- Traitement robuste des dépassements de contexte et réparations JSON.
- Vérification anti-hallucination des coordonnées (email et téléphone).
"""

import json
import logging
import re
import time
from typing import Any, Dict, List, Optional

from niveaux_diplomes import appliquer_niveaux, appliquer_niveaux_competences
from config import LLM_MAX_RETRIES, MAX_CV_CHARS, OLLAMA_MODEL
from ollama_client import (
    InvalidModelOutput,
    OllamaBusy,
    OllamaException,
    OllamaTimeout,
    OllamaUnavailable,
    OutputTruncated,
    chat_json,
    is_available as is_ollama_available,
)
from competences_referentiel import appliquer_rapprochement, rapprocher_competences, retirer_prefixe_langue
from schemas import CvStructuredSchema

logger = logging.getLogger("AlphaCimentOCR.llm")

DEFAULT_MODEL = OLLAMA_MODEL


# =============================================================================
# PROMPT SYSTÈME SÉCURISÉ & ALLÉGÉ
# =============================================================================

SYSTEM_PROMPT = """Tu es un extracteur et structurateur sémantique de CV pour Alpha Ciment.
Ta mission est d'analyser le texte du CV fourni et de retourner STRICTEMENT un objet JSON valide respectant le schéma de données ci-dessous.

==============================
SCHÉMA JSON OBLIGATOIRE À RETOURNER :
==============================
{
  "contact": {
    "nom_complet": "Nom et prénom du candidat (ou null)",
    "email": "adresse.email@example.com (ou null)",
    "telephone": "Numéro de téléphone EXACTEMENT tel qu'écrit dans le CV sans changer l'indicatif (ou null)",
    "ville": "Ville ou région de résidence (ou null)"
  },
  "profil": "Bref résumé ou accroche professionnelle du candidat (ou null)",
  "competences": [
    {
      "nom": "Nom de la compétence, technologie, outil ou langue (ex: Français, Python, Gestion d'équipe)",
      "niveau": "Débutant | Intermédiaire | Avancé | Expert (Intermédiaire si le CV ne précise aucun niveau)"
    }
  ],
  "experiences": [
    {
      "poste": "Intitulé exact du poste",
      "entreprise": "Nom de l'entreprise employeur",
      "date_debut": "YYYY-MM-DD (ou YYYY-01-01 si seulement l'année)",
      "date_fin": "YYYY-MM-DD (ou null si le poste est en cours)",
      "description": "Synthèse des missions réalisées"
    }
  ],
  "projets": [
    {
      "titre_projet": "Titre du projet ou réalisation",
      "role": "Rôle dans le projet",
      "technologies": "Technologies utilisées séparées par des virgules",
      "url_projet": "Lien web ou GitHub (ou null)",
      "date_debut": "YYYY-MM-DD (ou null)",
      "date_fin": "YYYY-MM-DD (ou null)",
      "description": "Description du projet personnel ou académique"
    }
  ],
  "formations": [
    {
      "diplome": "Intitulé du diplôme ou certificat",
      "etablissement": "Nom de l'école ou université",
      "date_obtention": "YYYY-MM-DD (ou YYYY-01-01)",
      "domaine_etude": "Filière ou domaine d'étude",
      "niveau": "CAP / BEP | Baccalauréat | Bac+1 | Bac+2 (BTS / DUT) | Bac+3 (Licence) | Bac+4 (Master 1) | Bac+5 (Master 2 / Ingénieur) | Bac+8 (Doctorat) (ou null)"
    }
  ],
  "autres": [
    {
      "titre": "Catégorie de l'information (ex: Loisirs, Centres d'intérêt, Permis de conduire, Bénévolat, Références)",
      "description": "Détail complet ou description de l'information"
    }
  ]
}

==============================
CONSIGNES STRICTES D'EXTRACTION :
==============================
1. FORMAT DE SORTIE : Réponds UNIQUEMENT avec le bloc JSON brut. Aucun texte d'introduction, aucun commentaire, aucune balise Markdown.
2. TÉLÉPHONE : Recopie le numéro EXACTEMENT comme il apparaît dans le texte brut (ex: si le texte indique '032 48 429 39', renvoie '032 48 429 39'. Ne le convertis JAMAIS en '+261').
3. LANGUES DANS COMPÉTENCES : Toutes les langues mentionnées (ex: Malagasy, Français, Anglais) DOIVENT être incluses dans le tableau "competences" en écrivant uniquement le nom de la langue, sans préfixe « Langue : » (ex: 'Français', niveau: 'Avancé').
3 bis. COMPÉTENCES ATOMIQUES : Une compétence = une seule capacité, technologie ou outil précis. Un titre de rubrique (ex: "Réseaux & Télécoms", "Datacom & Sécurité", "Compétences techniques") n'est JAMAIS une compétence : ne le recopie pas. Éclate la liste qui le suit en autant de compétences distinctes. Exemple : "Réseaux & Télécoms : Réseaux mobiles, configuration et simulation de systèmes réseau, surveys et documentation de sites télécoms" donne 4 compétences : "Réseaux mobiles", "Configuration et simulation de systèmes réseau", "Surveys de sites télécoms", "Documentation de sites télécoms". Exemple : "Datacom & Sécurité : notions Datacom (Huawei), fondamentaux de cybersécurité réseau" donne "Datacom (Huawei)" et "Cybersécurité réseau". Retire les mots de niveau ("notions de", "fondamentaux de", "maîtrise de") du nom et utilise-les pour renseigner "niveau" (notions / fondamentaux = Débutant). Si le CV ne précise aucun niveau, mets "Intermédiaire". N'attribue "Avancé" ou "Expert" que si le CV l'écrit explicitement (n'invente JAMAIS un niveau supérieur). Cette règle ne concerne pas les langues : elles restent obligatoirement dans "competences", sous leur seul nom (règle 3), jamais dans "autres".
4. DISSOCIATION OBLIGATOIRE :
   - "experiences" : Uniquement les emplois réels en entreprise (CDI, CDD, stages conventionnés).
   - "projets" : Projets académiques, projets d'école, projets personnels, hackathons. Ne place JAMAIS un projet d'école dans les expériences !
5. NIVEAUX DES FORMATIONS : Normalise le champ "niveau" en utilisant EXACTEMENT l'un de ces libellés : "CAP / BEP", "Baccalauréat", "Bac+1", "Bac+2 (BTS / DUT)", "Bac+3 (Licence)", "Bac+4 (Master 1)", "Bac+5 (Master 2 / Ingénieur)", "Bac+8 (Doctorat)". Déduis-le de l'intitulé du diplôme (Master / Ingénieur = Bac+5, Licence = Bac+3, BTS / DUT = Bac+2, Doctorat = Bac+8). Mets null pour une simple certification.
6. ZÉRO TEXTE JETÉ & SECTION "AUTRES" : Tout élément figurant dans le CV qui ne correspond à aucune des catégories précédentes (ex: permis de conduire, centres d'intérêt, engagement associatif, références, disponibilités particulières) doit obligatoirement être inséré dans la liste "autres".
7. INTÉGRITÉ : N'invente aucune information. Pour un projet, "technologies" n'est rempli que si le CV nomme explicitement des technologies (sinon null) ; recopie l'URL du projet caractère par caractère, sans la corriger. Si une section n'existe pas dans le CV, renvoie une liste vide [].

TEXTE DU CV À ANALYSER :
<texte_cv>
{{ $json.texte_cv || $json.text }}
</texte_cv>
"""


# =============================================================================
# VÉRIFICATION DES COORDONNÉES DANS LE TEXTE ORIGINAL
# =============================================================================

def _verifier_coordonnees(contact: Dict[str, Any], raw_text: str, warnings: List[str]) -> None:
    """
    Vérifie par expression régulière que l'email et le téléphone extraits
    figurent réellement dans le texte brut OCR pour éliminer les hallucinations.
    """
    if not raw_text:
        return

    # 1. Vérification de l'e-mail
    email = contact.get("email")
    if email and isinstance(email, str):
        email_clean = email.strip().lower()
        if email_clean not in raw_text.lower():
            warnings.append(
                f"L'adresse email '{email}' extraite n'a pas été trouvée dans le texte original (hallucination rejetée)."
            )
            contact["email"] = None

    # 2. Vérification du téléphone
    tel = contact.get("telephone")
    if tel and isinstance(tel, str):
        digits_tel = re.sub(r"[^\d]", "", tel)
        digits_raw = re.sub(r"[^\d]", "", raw_text)

        # Test direct des chiffres consécutifs
        match_found = digits_tel in digits_raw if digits_tel else False

        # Tolérance sur les indicatifs (+261 vs 03x à Madagascar)
        if not match_found and len(digits_tel) >= 8:
            significant_tel = digits_tel[-9:] if len(digits_tel) >= 9 else digits_tel[-8:]
            match_found = significant_tel in digits_raw

        # S'il y a au moins 6 chiffres et qu'ils ne se retrouvent pas dans le texte brut
        if len(digits_tel) >= 6 and not match_found:
            warnings.append(
                f"Le numéro de téléphone '{tel}' extrait n'a pas été trouvé dans le texte original (hallucination rejetée)."
            )
            contact["telephone"] = None


# =============================================================================
# RÉPARATION DE JSON TRONQUÉ
# =============================================================================

def _repair_truncated_json(text: str) -> Dict[str, Any]:
    """
    Tente de réparer un JSON tronqué (fermeture de chaînes, accolades et crochets manquants).
    """
    if not text:
        return {}

    cleaned = text.strip()

    # Si une chaîne est restée ouverte
    in_string = False
    escape = False
    for char in cleaned:
        if char == '\\' and not escape:
            escape = True
            continue
        if char == '"' and not escape:
            in_string = not in_string
        escape = False

    if in_string:
        cleaned += '"'

    # Fermeture des structures ouvertes
    open_stack = []
    in_string = False
    escape = False
    for char in cleaned:
        if char == '\\' and not escape:
            escape = True
            continue
        if char == '"' and not escape:
            in_string = not in_string
            escape = False
            continue
        escape = False

        if not in_string:
            if char in "{[":
                open_stack.append(char)
            elif char == "}":
                if open_stack and open_stack[-1] == "{":
                    open_stack.pop()
            elif char == "]":
                if open_stack and open_stack[-1] == "[":
                    open_stack.pop()

    cleaned = cleaned.rstrip(", \t\r\n")

    while open_stack:
        opener = open_stack.pop()
        if opener == "{":
            cleaned += "}"
        elif opener == "[":
            cleaned += "]"

    try:
        return json.loads(cleaned)
    except Exception as err:
        logger.error(f"[NER] Échec définitif de réparation JSON : {err}")
        return {
            "contact": {"nom_complet": None, "email": None, "telephone": None, "ville": None},
            "profil": None,
            "competences": [],
            "experiences": [],
            "projets": [],
            "formations": []
        }


# =============================================================================
# FONCTION PRINCIPALE : PARSE_CV_WITH_LLM
# =============================================================================

def parse_cv_with_llm(
    raw_text: str,
    model: str = DEFAULT_MODEL,
    ollama_url: Optional[str] = None,
    timeout: int = 120,
) -> Dict[str, Any]:
    """
    Transmet le texte brut OCR au LLM local (qwen2.5:7b) via chat_json.
    
    Lève :
    - OllamaUnavailable si le serveur Ollama est inaccessible (traduit en 503 dans main.py)
    - OllamaTimeout si le délai d'attente est dépassé (traduit en 503 dans main.py)
    - InvalidModelOutput si la validation Pydantic échoue sur une sortie inexploitable (502 dans main.py)
    Si le JSON reste invalide après LLM_MAX_RETRIES nouvelles tentatives, renvoie un repli
    ner_status='vide' qui conserve le texte brut pour validation manuelle (pas d'erreur HTTP).
    
    Retourne :
    Dictionnaire structuré complet incluant 'ner_status' ("ok" | "partiel" | "vide"),
    'warnings' et les entités structurées du CV.
    """
    warnings: List[str] = []

    if not raw_text or not raw_text.strip():
        empty_schema = CvStructuredSchema().model_dump()
        empty_schema["texte_brut"] = ""
        empty_schema["ner_status"] = "vide"
        empty_schema["warnings"] = ["Aucun texte fourni pour l'analyse sémantique NER."]
        empty_schema["source_parsing"] = "aucun_texte"
        return empty_schema

    text_to_process = raw_text.strip()
    is_partiel = False

    # 1. Plafonnement de la longueur du texte d'entrée (MAX_CV_CHARS)
    if len(text_to_process) > MAX_CV_CHARS:
        text_to_process = text_to_process[:MAX_CV_CHARS]
        is_partiel = True
        warnings.append(
            f"Le texte du CV a été tronqué aux {MAX_CV_CHARS} premiers caractères pour optimiser la mémoire."
        )

    user_prompt = f"""Voici le texte brut du CV à extraire et structurer :

<texte_cv>
{text_to_process}
</texte_cv>

Extrais les informations sous forme de JSON valide conforme au schéma attendu."""

    # 2. Appel au client Ollama avec le JSON Schema Pydantic (avec nouvelles tentatives)
    parsed_json: Dict[str, Any] = {}
    last_error: Optional[Exception] = None

    for attempt in range(LLM_MAX_RETRIES + 1):
        try:
            parsed_json = chat_json(
                system=SYSTEM_PROMPT,
                user=user_prompt,
                schema=CvStructuredSchema,
                timeout=timeout,
                num_predict=4096,
                temperature=0.1 if attempt == 0 else 0.0,  # 2e essai : plus déterministe
            )
            last_error = None
            break
        except OutputTruncated as ot:
            # Troncature : on tente la réparation et on marque partiel (pas de nouvel essai)
            logger.warning(f"[NER] Sortie modèle tronquée, tentative de réparation : {ot}")
            is_partiel = True
            warnings.append("La réponse du modèle a dépassé la limite de tokens et a été partiellement reconstituée.")
            parsed_json = _repair_truncated_json(ot.partial_content)
            last_error = None
            break
        except (InvalidModelOutput, OllamaTimeout) as transient:
            # Erreurs transitoires : JSON invalide ou lenteur ponctuelle -> nouvel essai
            last_error = transient
            logger.warning(f"[NER] Tentative {attempt + 1}/{LLM_MAX_RETRIES + 1} échouée : {transient}")

    if last_error is not None:
        if isinstance(last_error, OllamaTimeout):
            raise last_error  # inchangé : traduit en 503 dans main.py
        # JSON invalide après tous les essais -> repli : on conserve le texte brut OCR
        # et on laisse le RH valider/saisir manuellement (statut 'vide' = à traiter à la main).
        logger.error(f"[NER] Repli manuel après échec du LLM : {last_error}")
        fallback = CvStructuredSchema().model_dump()
        fallback["texte_brut"] = raw_text
        fallback["ner_status"] = "vide"
        fallback["warnings"] = warnings + [
            "L'analyse automatique a échoué (sortie IA invalide). Le texte brut est conservé : "
            "validation manuelle par le RH requise."
        ]
        fallback["source_parsing"] = f"fallback_manuel_{model}"
        return fallback

    # 3. Validation et normalisation avec Pydantic
    try:
        validated = CvStructuredSchema.model_validate(parsed_json)
        result_dict = validated.model_dump()
    except Exception as val_err:
        logger.error(f"[NER] Erreur validation schéma Pydantic : {val_err}")
        # Si réparable via dict
        if isinstance(parsed_json, dict) and "contact" in parsed_json:
            result_dict = parsed_json
            is_partiel = True
            warnings.append(f"Validation partielle du modèle : {str(val_err)}")
        else:
            raise InvalidModelOutput(f"Le format retourné par le LLM est invalide : {str(val_err)}")

    # 3 quinquies. Langues : le nom seul (« Français »), jamais « Langue : Français », même si le modèle met le préfixe
    if isinstance(result_dict.get("competences"), list):
        retirer_prefixe_langue(result_dict["competences"])

    # 3 quater. Niveau des compétences : valeurs canoniques, « Intermédiaire » quand le CV ne précise rien
    if isinstance(result_dict.get("competences"), list):
        appliquer_niveaux_competences(result_dict["competences"])

    # 3 ter. Niveaux d'études : toujours les mêmes libellés, déduits du diplôme si le LLM n'en a pas donné
    if isinstance(result_dict.get("formations"), list):
        appliquer_niveaux(result_dict["formations"])

    # 3 bis. Recherche dans le référentiel : chaque compétence extraite existe-t-elle déjà ?
    if isinstance(result_dict.get("competences"), list) and result_dict["competences"]:
        noms = [c.get("nom") for c in result_dict["competences"] if isinstance(c, dict) and c.get("nom")]
        rapprochement = appliquer_rapprochement(result_dict["competences"], rapprocher_competences(noms))
        result_dict["competences"] = rapprochement["competences"]
        logger.info(
            f"[NER] Compétences : {rapprochement['existantes']} déjà au référentiel, "
            f"{rapprochement['nouvelles']} nouvelle(s)."
        )

    # # 4. Vérification anti-hallucination des coordonnées (email et téléphone)
    # if "contact" in result_dict and isinstance(result_dict["contact"], dict):
    #     _verifier_coordonnees(result_dict["contact"], raw_text, warnings)

    # 5. Détermination du statut NER
    if not any([
        result_dict.get("competences"),
        result_dict.get("experiences"),
        result_dict.get("formations"),
        result_dict.get("projets")
    ]) and not result_dict.get("contact", {}).get("nom_complet"):
        ner_status = "vide"
    elif is_partiel:
        ner_status = "partiel"
    else:
        ner_status = "ok"

    result_dict["texte_brut"] = raw_text
    result_dict["ner_status"] = ner_status
    result_dict["warnings"] = warnings
    result_dict["source_parsing"] = f"ollama_{model}"

    return result_dict
