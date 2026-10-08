# -*- coding: utf-8 -*-
"""
cv_llm_parser.py
================
Module d'extraction et de structuration d'entités (NER) pour CV
utilisant un LLM local (Mistral 7B ou Llama 3) via Ollama.

Avantages :
- 100% local, confidentiel et gratuit (aucun envoi sur un cloud externe).
- Sortie garantie au format JSON strict grâce à l'option format="json" d'Ollama.
- Compréhension sémantique des formulations chaotiques des CVs francophones.
"""

import json
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger("AlpaCimentOCR.llm")

OLLAMA_API_URL = "http://127.0.0.1:11434/api/generate"
DEFAULT_MODEL = "llama3.2"


SYSTEM_PROMPT = """Tu es un expert RH et un analyseur de CV ultra-précis pour AlpA Ciment.
Ta tâche est d'analyser le texte brut suivant issu de l'OCR d'un CV et d'en extraire les informations sous un format JSON strict.

Tu dois respecter EXACTEMENT ce schéma JSON :
{
  "contact": {
    "nom_complet": "Nom et prénom du candidat ou null",
    "email": "Adresse email ou null",
    "telephone": "Numéro de téléphone ou null",
    "ville": "Ville de résidence ou null"
  },
  "profil": "Bref résumé du profil professionnel ou null",
  "competences": [
    {
      "nom": "Nom de la compétence (ex: React.js, PHP, Gestion de projet)",
      "niveau": "Niveau estimé: Débutant, Intermédiaire, Avancé ou Expert"
    }
  ],
  "experiences": [
    {
      "poste": "Intitulé du poste occupé",
      "entreprise": "Nom de l'entreprise ou organisation",
      "date_debut": "Date ou année de début (ex: 2021 ou Janvier 2021)",
      "date_fin": "Date ou année de fin ou 'En cours' ou null",
      "description": "Courte synthèse des missions réalisées ou null"
    }
  ],
  "formations": [
    {
      "diplome": "Intitulé du diplôme ou certification",
      "etablissement": "Nom de l'école ou université",
      "annee_obtention": "Année d'obtention ou période",
      "domaine_etude": "Filière ou domaine d'étude ou null"
    }
  ]
}

RÈGLES IMPORTANTES :
1. Réponds UNIQUEMENT avec l'objet JSON valide, sans texte d'introduction ni de conclusion.
2. Si une information n'est pas présente dans le texte, mets null ou une liste vide [].
3. N'invente AUCUNE information qui n'est pas dans le document.
4. Corrige les coquilles évidentes de l'OCR dans les noms d'outils (ex: 'Phtyon' -> 'Python').
5. Sois concis et synthétique dans les descriptions de missions (maximum 2 phrases par expérience).
6. Si tu ne trouves rien par exemple dans experiences ou formations ou tous les autres ,n'essaie pas de rassembler des bout d'informations entre eux
"""


def is_ollama_available(url: str = OLLAMA_API_URL) -> bool:
    """Vérifie si le serveur Ollama est démarré et répond sur le port local."""
    try:
        base_url = url.replace("/api/generate", "/api/tags")
        res = requests.get(base_url, timeout=2)
        return res.status_code == 200
    except Exception:
        return False


def parse_cv_with_llm(
    raw_text: str,
    model: str = DEFAULT_MODEL,
    ollama_url: str = OLLAMA_API_URL,
    timeout: int = 120
) -> Dict[str, Any]:
    """
    Transmet le texte brut OCR à Ollama pour extraction sémantique des entités.
    
    Retourne un dictionnaire structuré contenant :
    - contact
    - profil
    - competences
    - experiences
    - formations
    - texte_brut
    """
    if not raw_text or not raw_text.strip():
        return {
            "texte_brut": "",
            "contact": {"nom_complet": None, "email": None, "telephone": None, "ville": None},
            "profil": None,
            "competences": [],
            "experiences": [],
            "formations": [],
            "source_parsing": "aucun_texte"
        }

    # Vérification de disponibilité d'Ollama
    if not is_ollama_available(ollama_url):
        logger.warning("Serveur Ollama inaccessible sur localhost:11434. Mode dégradé.")
        return {
            "texte_brut": raw_text,
            "contact": {"nom_complet": None, "email": None, "telephone": None, "ville": None},
            "profil": None,
            "competences": [],
            "experiences": [],
            "formations": [],
            "source_parsing": "fallback_ollama_offline"
        }

    user_prompt = f"Voici le texte brut du CV à structurer :\n\n```\n{raw_text}\n```"

    payload = {
        "model": model,
        "prompt": f"{SYSTEM_PROMPT}\n\n{user_prompt}",
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.1,  # Faible température pour une fidélité maximale au texte
            "num_ctx": 4096,     # Contexte optimal (rapide et suffisant pour les CVs)
            "num_predict": 4096, # Assez de tokens pour ne jamais couper le JSON
        }
    }

    try:
        logger.info(f"Envoi du texte OCR au modèle local '{model}' via Ollama...")
        response = requests.post(ollama_url, json=payload, timeout=timeout)
        response.raise_for_status()

        result_data = response.json()
        generated_json_text = result_data.get("response", "{}").strip()

        # Tentative de parsing direct
        try:
            parsed = json.loads(generated_json_text)
        except json.JSONDecodeError as decode_err:
            logger.warning(f"JSON incomplet ou mal formé détecté ({decode_err}), tentative de réparation...")
            parsed = _repair_truncated_json(generated_json_text)

        parsed["texte_brut"] = raw_text
        parsed["source_parsing"] = f"ollama_{model}"
        logger.info("Extraction NER par LLM réussie avec succès.")
        return parsed

    except requests.exceptions.Timeout:
        logger.error(f"Délai d'attente dépassé ({timeout}s) lors de l'appel à Ollama.")
        return {
            "texte_brut": raw_text,
            "contact": {"nom_complet": None, "email": None, "telephone": None, "ville": None},
            "profil": None,
            "competences": [],
            "experiences": [],
            "formations": [],
            "source_parsing": "fallback_timeout"
        }
    except Exception as e:
        logger.error(f"Erreur lors du parsing LLM avec Ollama : {e}")
        return {
            "texte_brut": raw_text,
            "contact": {"nom_complet": None, "email": None, "telephone": None, "ville": None},
            "profil": None,
            "competences": [],
            "experiences": [],
            "formations": [],
            "source_parsing": f"fallback_erreur_{type(e).__name__}"
        }


def _repair_truncated_json(text: str) -> Dict[str, Any]:
    """
    Tente de réparer un JSON tronqué (chaîne non fermée, accolades ou crochets manquants).
    """
    if not text:
        return {}

    # Nettoyage préliminaire
    cleaned = text.strip()
    
    # Si une chaîne est restée ouverte (nombre impair de guillemets non échappés)
    # On ferme la chaîne ouverte
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

    # Fermer les structures ouvertes (accolades et crochets)
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

    # Si la dernière virgule est orpheline avant la fermeture, on la retire
    cleaned = cleaned.rstrip(", \t\r\n")

    # Refermer les conteneurs dans l'ordre inverse
    while open_stack:
        opener = open_stack.pop()
        if opener == "{":
            cleaned += "}"
        elif opener == "[":
            cleaned += "]"

    try:
        return json.loads(cleaned)
    except Exception as err:
        logger.error(f"Échec définitif de réparation JSON: {err}")
        return {
            "contact": {"nom_complet": None, "email": None, "telephone": None, "ville": None},
            "profil": None,
            "competences": [],
            "experiences": [],
            "formations": []
        }


if __name__ == "__main__":
    # Test autonome rapide
    sample_cv = """
    JEAN DUPONT
    Email: jean.dupont@email.com | Tél: 034 11 222 33 | Antananarivo
    Développeur Fullstack expérimenté avec 4 ans d'expérience.
    
    COMPÉTENCES
    - PHP / Laravel, React.js, Python, PostgreSQL, Docker
    - Méthodologie Agile / Scrum
    
    EXPÉRIENCES PROFESSIONNELLES
    Développeur Web Senior - Alpha Ciment (2022 - Présent)
    Conception et développement de la plateforme de gestion interne.
    
    Développeur Junior - IT Solutions (2020 - 2022)
    Maintenance d'applications web et APIs REST.
    
    FORMATIONS
    Master 2 en Informatique - ITU (2020)
    Licence Informatique - Université d'Antananarivo (2018)
    """

    print("Test d'extraction avec Ollama + Mistral...")
    res = parse_cv_with_llm(sample_cv)
    print(json.dumps(res, indent=2, ensure_ascii=False))
