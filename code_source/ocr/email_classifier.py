# -*- coding: utf-8 -*-
"""
email_classifier.py
===================
Module d'analyse et de classification intelligente des emails entrants
pour le service recrutement d'Alpha Ciment via Ollama (qwen2.5:7b).

Catégories d'intention :
1. 'demande_offre'       : Candidature ciblée sur une offre d'emploi spécifique.
2. 'demande_spontanee'   : Candidature libre sans offre précise (vivier de talents).
3. 'demande_information' : Question générale, demande de stage, renseignements RH.
4. 'hors_sujet'          : Spams, réponses automatiques de non-distribution (NDR), newsletters.
"""

import json
import logging
import re
import threading
import time
from typing import Any, Dict, List, Optional

import requests

from config import (
    LARAVEL_BASE_URL,
    LARAVEL_PUBLIC_OFFERS_URL,
    MAX_EMAIL_BODY_CHARS,
    OFFERS_CACHE_TTL_S,
    OLLAMA_MODEL,
)
from ollama_client import OllamaBusy, chat_json
from schemas import EmailClassificationResultSchema, EmailTypeEnum

logger = logging.getLogger("AlphaCimentOCR.email_classifier")

# -----------------------------------------------------------------------------
# CACHE DES OFFRES LARAVEL AVEC TTL ET REPLI PÉRIMÉ
# -----------------------------------------------------------------------------
_offers_cache = {
    "last_fetched": 0.0,
    "offers": []  # List[Dict[str, Any]]
}
_offers_cache_lock = threading.Lock()


def fetch_active_offers_from_laravel(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """
    Récupère la liste des offres publiées depuis l'API Laravel avec mise en cache TTL.
    En cas d'échec réseau ou timeout, réutilise la dernière liste connue (même périmée)
    au lieu de basculer sur un contexte vide.
    """
    global _offers_cache
    now = time.time()

    with _offers_cache_lock:
        if not force_refresh and (now - _offers_cache["last_fetched"]) < OFFERS_CACHE_TTL_S and _offers_cache["offers"]:
            return _offers_cache["offers"]

    url = f"{LARAVEL_BASE_URL.rstrip('/')}/api/public/offres"
    try:
        res = requests.get(url, timeout=(2, 4))
        if res.status_code == 200:
            payload = res.json()
            raw_list = payload.get("data", []) if isinstance(payload, dict) else payload
            parsed_offers = []
            for o in raw_list:
                if isinstance(o, dict):
                    oid = o.get("id") or o.get("id_offre")
                    ref = o.get("reference") or o.get("code")
                    title = o.get("titre_poste") or o.get("title")
                    if oid:
                        parsed_offers.append({
                            "id": int(oid),
                            "reference": str(ref).strip() if ref else None,
                            "title": str(title).strip() if title else "Poste Alpha Ciment",
                        })

            with _offers_cache_lock:
                _offers_cache["last_fetched"] = now
                _offers_cache["offers"] = parsed_offers

            logger.info(f"[EmailClassifier] Cache offres mis à jour ({len(parsed_offers)} offres actives).")
            return parsed_offers
    except Exception as e:
        logger.warning(f"[EmailClassifier] Impossible de contacter Laravel ({e}). Utilisation du dernier cache connu.")

    with _offers_cache_lock:
        return _offers_cache["offers"] or []


# -----------------------------------------------------------------------------
# 1. PRÉ-FILTRE SANS IA : E-MAILS AUTOMATIQUES, NDR, SPAMS
# -----------------------------------------------------------------------------

AUTO_SENDER_PATTERNS = [
    r"mailer-daemon",
    r"postmaster",
    r"no-reply",
    r"noreply",
    r"notification",
    r"bounce",
]

AUTO_SUBJECT_PATTERNS = [
    r"delivery status notification",
    r"undelivered mail",
    r"undelivered",
    r"r[eé]ponse automatique",
    r"out of office",
    r"absence du bureau",
    r"cong[eé]s?",
    r"automatic reply",
    r"failure notice",
    r"mail delivery failed",
]


def pre_filter_automatic_emails(
    sender: Optional[str] = None,
    subject: Optional[str] = None,
    headers: Optional[Dict[str, str]] = None
) -> Optional[Dict[str, Any]]:
    """
    Détecte sans appel IA les messages automatiques (rebonds NDR, répondeurs de congés, newsletters).
    Retourne un résultat immédiat 'hors_sujet' (confiance 1.0, source 'regle') ou None.
    """
    sender_clean = (sender or "").lower().strip()
    subject_clean = (subject or "").lower().strip()
    hdrs = {k.lower(): str(v).lower() for k, v in (headers or {}).items()}

    # 1. En-têtes standards d'e-mails automatiques
    if "auto-submitted" in hdrs:
        val = hdrs["auto-submitted"]
        if val and val != "no":
            return {
                "type": "hors_sujet",
                "id_offre": None,
                "reference_offre": None,
                "offre_ciblee": None,
                "domaine_souhaite": None,
                "question_resume": "Email généré automatiquement détecté via en-tête Auto-Submitted",
                "confiance": 1.0,
                "justification": f"En-tête Auto-Submitted: {val}",
                "source": "regle",
                "a_verifier": False,
            }

    if "list-unsubscribe" in hdrs:
        return {
            "type": "hors_sujet",
            "id_offre": None,
            "reference_offre": None,
            "offre_ciblee": None,
            "domaine_souhaite": None,
            "question_resume": "Courrier de masse / newsletter détecté via List-Unsubscribe",
            "confiance": 1.0,
            "justification": "Présence de l'en-tête List-Unsubscribe",
            "source": "regle",
            "a_verifier": False,
        }

    # 2. Expéditeurs automatiques
    for pat in AUTO_SENDER_PATTERNS:
        if re.search(pat, sender_clean):
            return {
                "type": "hors_sujet",
                "id_offre": None,
                "reference_offre": None,
                "offre_ciblee": None,
                "domaine_souhaite": None,
                "question_resume": "Message de notification automatique ou robot système",
                "confiance": 1.0,
                "justification": f"Expéditeur système automatisé détecté ({pat})",
                "source": "regle",
                "a_verifier": False,
            }

    # 3. Sujets de messages automatiques / NDR
    for pat in AUTO_SUBJECT_PATTERNS:
        if re.search(pat, subject_clean):
            return {
                "type": "hors_sujet",
                "id_offre": None,
                "reference_offre": None,
                "offre_ciblee": None,
                "domaine_souhaite": None,
                "question_resume": "Réponse automatique ou notification de non-remise de courrier",
                "confiance": 1.0,
                "justification": f"Objet de message automatique détecté ({pat})",
                "source": "regle",
                "a_verifier": False,
            }

    return None


# -----------------------------------------------------------------------------
# 2. CORRESPONDANCE PAR CODE AVANT LE LLM (RÉFÉRENCES D'OFFRES)
# -----------------------------------------------------------------------------

def match_offer_by_reference_in_text(
    subject: str,
    body: str,
    active_offers: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Recherche avec limites de mots et insensibilité à la casse les références
    des offres actives dans l'objet et le corps de l'e-mail.
    """
    text_to_search = f"{subject}\n{body}"

    for offer in active_offers:
        ref = offer.get("reference")
        if not ref or len(ref.strip()) < 2:
            continue
        ref_clean = ref.strip()
        # Regex avec limites de mots : ex \bIT-1\b ou \bCOMM-12\b
        pattern = r"\b" + re.escape(ref_clean) + r"\b"
        if re.search(pattern, text_to_search, re.IGNORECASE):
            logger.info(f"[EmailClassifier] Référence d'offre '{ref_clean}' trouvée par code (ID: {offer['id']}).")
            return {
                "type": "demande_offre",
                "id_offre": offer["id"],
                "reference_offre": ref_clean,
                "offre_ciblee": offer.get("title"),
                "domaine_souhaite": None,
                "question_resume": None,
                "confiance": 1.0,
                "justification": f"Référence exacte de l'offre '{ref_clean}' identifiée dans l'email",
                "source": "regle",
                "a_verifier": False,
            }

    return None


# -----------------------------------------------------------------------------
# 3. PROMPT SYSTEME CLASSIFICATION LLM
# -----------------------------------------------------------------------------

CLASSIFIER_SYSTEM_PROMPT = """Tu es un assistant RH expert chargé de classifier les emails reçus par le service recrutement d'Alpha Ciment.
Ta mission est d'analyser le sujet et le corps de l'email pour déterminer avec précision l'intention de l'expéditeur.

Tu dois impérativement classer l'email dans l'un des 4 types suivants :
1. "demande_offre" : Le candidat postule pour une offre d'emploi existante ou mentionne un poste ou une référence d'offre.
2. "demande_spontanee" : Le candidat envoie son CV de manière générale sans cibler un poste précis ni une référence (candidature libre / vivier).
3. "demande_information" : L'expéditeur pose une question, demande des renseignements généraux, s'informe sur des stages ou les coordonnées.
4. "hors_sujet" : Courrier indésirable, spam publicitaire, notification automatique ou message sans aucun rapport avec le recrutement.

Règles impératives :
- Si une offre correspond dans la liste fournie, indique son id_offre et reference_offre.
- Réponds UNIQUEMENT sous forme d'objet JSON valide conforme au schéma.
"""


# -----------------------------------------------------------------------------
# 4. FONCTION PRINCIPALE : CLASSIFY_EMAIL_INTENT
# -----------------------------------------------------------------------------

def classify_email_intent(
    subject: str,
    body: str,
    active_offers: Optional[List[Dict[str, Any]]] = None,
    sender: Optional[str] = None,
    headers: Optional[Dict[str, str]] = None,
    model: str = OLLAMA_MODEL,
    timeout: int = 30
) -> Dict[str, Any]:
    """
    Classifie l'intention d'un email avec pipeline à 3 niveaux :
    1. Pré-filtre déterministe (e-mails automatiques / NDR / en-têtes)
    2. Correspondance par code déterministe (détection des références d'offres)
    3. Classification sémantique par LLM (qwen2.5:7b) via chat_json
    4. Repli heuristique explicite en cas d'indisponibilité du LLM
    """
    subject_clean = (subject or "").strip()
    body_clean = (body or "").strip()

    # Troncature du corps du message à MAX_EMAIL_BODY_CHARS
    if len(body_clean) > MAX_EMAIL_BODY_CHARS:
        body_clean = body_clean[:MAX_EMAIL_BODY_CHARS]

    if not subject_clean and not body_clean:
        return {
            "type": "demande_information",
            "id_offre": None,
            "reference_offre": None,
            "offre_ciblee": None,
            "domaine_souhaite": None,
            "question_resume": "Email vide sans contenu",
            "confiance": 0.0,
            "justification": "Aucun contenu fourni dans l'email",
            "source": "regle",
            "a_verifier": True,
        }

    # Étape 1 : Pré-filtre automatique sans IA
    auto_result = pre_filter_automatic_emails(sender=sender, subject=subject_clean, headers=headers)
    if auto_result:
        return auto_result

    # Récupération des offres actives (depuis paramètre ou cache Laravel)
    if active_offers is None:
        active_offers = fetch_active_offers_from_laravel()

    valid_offer_ids = {o["id"] for o in active_offers if isinstance(o, dict) and o.get("id")}

    # Étape 2 : Correspondance par référence d'offre dans le code AVANT le LLM
    code_match = match_offer_by_reference_in_text(subject_clean, body_clean, active_offers)
    if code_match:
        return code_match

    # Étape 3 : Classification sémantique via LLM
    offers_context = ""
    if active_offers:
        lines = [
            f"- ID: {o.get('id')} | Réf: {o.get('reference') or 'N/A'} | Titre: {o.get('title')}"
            for o in active_offers
        ]
        offers_context = "OFFRES ACTUELLEMENT PUBLIÉES CHEZ ALPHA CIMENT :\n" + "\n".join(lines) + "\n\n"

    user_prompt = f"""{offers_context}EMAIL À CLASSIFIER :
Expéditeur : {sender or "Inconnu"}
Objet : {subject_clean}
Corps du message :
```
{body_clean}
```
"""

    try:
        parsed = chat_json(
            system=CLASSIFIER_SYSTEM_PROMPT,
            user=user_prompt,
            schema=EmailClassificationResultSchema,
            timeout=timeout,
            num_predict=1024,
            temperature=0.1,
        )

        # Validation de la sortie avec Pydantic
        validated = EmailClassificationResultSchema.model_validate(parsed)
        result = validated.model_dump()
        result["source"] = "llm"
        result["a_verifier"] = False

        # Vérification post-LLM que l'id_offre retourné existe bien dans les offres actives
        returned_id = result.get("id_offre")
        if returned_id is not None:
            if returned_id not in valid_offer_ids:
                logger.warning(
                    f"[EmailClassifier] id_offre {returned_id} suggéré par le LLM n'appartient pas aux offres actives. Réinitialisé à null."
                )
                result["id_offre"] = None
                result["reference_offre"] = None

        return result

    except OllamaBusy:
        # Ne pas basculer sur un repli heuristique si le LLM est seulement occupé par un NER :
        # OllamaBusy remonte vers l'API HTTP 503 (Retry-After) pour que n8n réessaie plus tard avec le LLM
        logger.warning("[EmailClassifier] Moteur IA occupé (file d'attente saturée), remontée d'OllamaBusy.")
        raise
    except Exception as e:
        logger.warning(f"[EmailClassifier] Échec appel LLM ({e}), basculement sur repli heuristique.")
        # Étape 4 : Repli heuristique explicite (confiance <= 0.5, source="heuristique", a_verifier=True)
        lower_sub = subject_clean.lower()
        lower_body = body_clean.lower()

        detected_type = "demande_information"
        if any(w in lower_sub or w in lower_body for w in ("candidature", "postule", "postuler", "cv", "recrutement")):
            if any(w in lower_sub or w in lower_body for w in ("spontan", "libre", "vivier")):
                detected_type = "demande_spontanee"
            else:
                detected_type = "demande_offre"

        return {
            "type": detected_type,
            "id_offre": None,
            "reference_offre": None,
            "offre_ciblee": None,
            "domaine_souhaite": None,
            "question_resume": subject_clean if detected_type == "demande_information" else None,
            "confiance": 0.4,
            "justification": f"Repli heuristique suite à indisponibilité IA ({type(e).__name__})",
            "source": "heuristique",
            "a_verifier": True,
        }
