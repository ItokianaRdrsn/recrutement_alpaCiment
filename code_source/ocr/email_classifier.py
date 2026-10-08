# -*- coding: utf-8 -*-
"""
email_classifier.py
===================
Module d'analyse et de classification intelligente des emails entrants
via le LLM local (Llama 3.2) sous Ollama.

Catégories d'intention :
1. 'demande_offre'       : Candidature ciblée sur une offre d'emploi spécifique.
2. 'demande_spontanee'   : Candidature libre sans offre précise (vivier de talents).
3. 'demande_information' : Question générale, demande de stage, renseignements RH.
"""

import json
import logging
import requests
from typing import Dict, Any, List, Optional

logger = logging.getLogger("AlpaCimentOCR.email_classifier")

OLLAMA_API_URL = "http://127.0.0.1:11434/api/generate"
DEFAULT_MODEL = "llama3.2"
LARAVEL_PUBLIC_OFFERS_URL = "http://127.0.0.1:8000/api/public/offres"


def fetch_active_offers_from_laravel(url: str = LARAVEL_PUBLIC_OFFERS_URL) -> List[Dict[str, Any]]:
    """
    Récupère automatiquement la liste des offres publiées depuis l'API Laravel
    avec leurs IDs, références (ex: IT-1, COMM-12) et intitulés de poste.
    """
    try:
        res = requests.get(url, timeout=3)
        if res.status_code == 200:
            payload = res.json()
            offers = payload.get("data", []) if isinstance(payload, dict) else payload
            logger.info(f"{len(offers)} offres actives récupérées depuis Laravel pour le contexte IA.")
            return [
                {
                    "id": o.get("id"),
                    "reference": o.get("reference"),
                    "title": o.get("titre_poste") or o.get("title")
                }
                for o in offers if isinstance(o, dict)
            ]
    except Exception as e:
        logger.warning(f"Impossible de contacter Laravel pour récupérer les offres ({e}). Utilisation du contexte vide.")
    return []


CLASSIFIER_SYSTEM_PROMPT = """Tu es un assistant RH expert chargé de classifier les emails reçus par le service recrutement d'AlpA Ciment.
Ta mission est d'analyser le sujet et le corps de l'email pour déterminer avec précision l'intention de l'expéditeur.

Tu dois classer l'email dans EXACTEMENT UNE de ces trois catégories :
1. "demande_offre" :
   - Le candidat postule pour une offre d'emploi existante ou mentionne un poste ou une référence d'offre (ex: "Réf: IT-1", "COMM-12", "Candidature Développeur Fullstack").
   - Si une liste d'offres actives est fournie et qu'une offre correspond au titre ou à la référence (ex: "IT-1"), définis impérativement "id_offre", "reference_offre" et "type": "demande_offre".
2. "demande_spontanee" :
   - Le candidat envoie son CV de manière générale sans cibler un poste précis ni une référence (ex: "Candidature spontanée", "Recherche d'opportunités").
3. "demande_information" :
   - L'expéditeur pose une question, demande des renseignements généraux, s'informe sur des stages ou les coordonnées (ex: "Avez-vous des stages ?", "Quels sont vos horaires ?").

Voici le format JSON STRICT que tu dois retourner :
{
  "type": "demande_offre" | "demande_spontanee" | "demande_information",
  "id_offre": int_ou_null,
  "reference_offre": "Référence exacte de l'offre (ex: IT-1, COMM-12) ou null",
  "offre_ciblee": "Intitulé du poste ciblé ou null",
  "domaine_souhaite": "Domaine professionnel déduit (ex: Informatique, Maintenance, Finance, RH) ou null",
  "question_resume": "Bref résumé de la question si demande_information, sinon null",
  "confiance": 0.95,
  "justification": "Courte phrase expliquant pourquoi cette catégorie a été choisie"
}

RÈGLES IMPORTANTES :
1. Réponds UNIQUEMENT avec le JSON valide, sans texte d'introduction ni de conclusion.
2. Dès qu'un poste, un métier ou une référence (ex: IT-1) est mentionné, choisis "demande_offre" et associe l'offre active correspondante.
"""


def classify_email_intent(
    subject: str,
    body: str,
    active_offers: Optional[List[Dict[str, Any]]] = None,
    model: str = DEFAULT_MODEL,
    ollama_url: str = OLLAMA_API_URL,
    timeout: int = 30
) -> Dict[str, Any]:
    """
    Classifie l'intention d'un email (offre, spontanée, information) via Llama 3.2.
    """
    subject_clean = (subject or "").strip()
    body_clean = (body or "").strip()

    if not subject_clean and not body_clean:
        return {
            "type": "demande_information",
            "id_offre": None,
            "reference_offre": None,
            "offre_ciblee": None,
            "domaine_souhaite": None,
            "question_resume": "Email vide sans contenu",
            "confiance": 0.0,
            "justification": "Aucun contenu fourni dans l'email"
        }

    # Si les offres actives ne sont pas fournies par l'appelant (ex: n8n),
    # les récupérer directement et automatiquement depuis l'API Laravel
    if not active_offers:
        active_offers = fetch_active_offers_from_laravel()

    # Formatage des offres actives disponibles avec leurs références
    offers_context = ""
    if active_offers:
        offers_lines = [
            f"- ID: {o.get('id') or o.get('id_offre')} | Réf: {o.get('reference') or o.get('ref') or 'N/A'} | Titre: {o.get('title') or o.get('titre_poste')}"
            for o in active_offers
        ]
        offers_context = "OFFRES ACTUELLEMENT PUBLIÉES CHEZ ALPA CIMENT :\n" + "\n".join(offers_lines) + "\n\n"

    user_prompt = f"""{offers_context}EMAIL À CLASSIFIER :
Objet : {subject_clean}
Corps du message :
```
{body_clean}
```
"""

    payload = {
        "model": model,
        "prompt": f"{CLASSIFIER_SYSTEM_PROMPT}\n\n{user_prompt}",
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.1,
            "num_ctx": 4096,
            "num_predict": 1024,
        }
    }

    try:
        logger.info(f"Classification de l'email '{subject_clean}' avec {model}...")
        res = requests.post(ollama_url, json=payload, timeout=timeout)
        res.raise_for_status()

        res_json = res.json()
        raw_output = res_json.get("response", "{}").strip()
        parsed = json.loads(raw_output)

        # Validation minimale des champs
        valid_types = ["demande_offre", "demande_spontanee", "demande_information"]
        if parsed.get("type") not in valid_types:
            parsed["type"] = "demande_information"

        return parsed

    except Exception as e:
        logger.error(f"Erreur classification email via Ollama: {e}")
        # Heuristique simple de secours si LLM indisponible
        lower_sub = subject_clean.lower()
        lower_body = body_clean.lower()
        
        detected_type = "demande_information"
        if "candidature" in lower_sub or "postule" in lower_body or "cv" in lower_sub:
            if "spontan" in lower_sub or "spontan" in lower_body:
                detected_type = "demande_spontanee"
            else:
                detected_type = "demande_offre"

        return {
            "type": detected_type,
            "id_offre": None,
            "offre_ciblee": None,
            "domaine_souhaite": None,
            "question_resume": subject_clean if detected_type == "demande_information" else None,
            "confiance": 0.5,
            "justification": f"Fallback heuristique (erreur LLM: {str(e)})"
        }


if __name__ == "__main__":
    # Tests unitaires de validation
    test_offers = [
        {"id": 1, "title": "Développeur Fullstack React / Laravel"},
        {"id": 2, "title": "Ingénieur Maintenance Industrielle"},
        {"id": 3, "title": "Comptable Fournisseurs"}
    ]

    tests = [
        {
            "subject": "Candidature au poste de Développeur React / Laravel",
            "body": "Bonjour, suite à votre annonce, je vous transmets mon CV en pièce jointe pour le poste de développeur.",
        },
        {
            "subject": "Candidature spontanée - Ingénieur mécanique",
            "body": "Madame, Monsieur, passionné par le secteur du ciment, je vous transmets mon profil pour d'éventuels besoins.",
        },
        {
            "subject": "Renseignements sur vos stages de fin d'études",
            "body": "Bonjour, je suis étudiant en 3ème année et j'aimerais savoir si vous accueillez des stagiaires cet été ?",
        }
    ]

    print("--- Démarrage du test de classification d'emails ---")
    for t in tests:
        print(f"\nObjet testé : {t['subject']}")
        result = classify_email_intent(t["subject"], t["body"], test_offers)
        print(json.dumps(result, indent=2, ensure_ascii=False))
