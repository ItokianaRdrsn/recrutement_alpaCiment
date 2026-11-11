# -*- coding: utf-8 -*-
"""
ollama_client.py
================
Client unique et résilient pour le serveur Ollama local (qwen2.5:7b).
Gère le verrouillage concurrentiel, la gestion stricte des erreurs et le formatage JSON.
"""

import json
import logging
import threading
import time
from typing import Any, Dict, Optional, Union

import requests

from config import (
    OLLAMA_CONCURRENCY,
    OLLAMA_MODEL,
    OLLAMA_NUM_CTX,
    OLLAMA_TAGS_URL,
    OLLAMA_URL,
)

logger = logging.getLogger("AlphaCimentOCR.ollama")

# Sémaphore limitant la concurrence d'appels LLM (Qwen 7B est lourd en mémoire VRAM/RAM)
_ollama_semaphore = threading.Semaphore(max(1, OLLAMA_CONCURRENCY))

# Cache pour is_available()
_availability_cache = {"last_check": 0.0, "is_available": False}
_cache_lock = threading.Lock()
AVAILABILITY_CACHE_TTL = 5.0  # 5 secondes


# =============================================================================
# EXCEPTIONS PERSONNALISÉES
# =============================================================================

class OllamaException(Exception):
    """Exception de base pour les interactions Ollama."""
    pass


class OllamaUnavailable(OllamaException):
    """Levée quand le serveur Ollama est injoignable ou hors ligne."""
    pass


class OllamaTimeout(OllamaException):
    """Levée lors d'un dépassement de délai de réponse Ollama."""
    pass


class OllamaBusy(OllamaException):
    """Levée quand le verrou ou la file d'attente d'Ollama est saturé."""
    pass


class OutputTruncated(OllamaException):
    """Levée quand la génération a été coupée pour dépassement de longueur de tokens."""
    def __init__(self, message: str, partial_content: str = ""):
        super().__init__(message)
        self.partial_content = partial_content


class InvalidModelOutput(OllamaException):
    """Levée quand le LLM ne produit pas une sortie JSON valide conforme au schéma."""
    pass


# =============================================================================
# FONCTIONS DE SANTÉ ET DÉMARRAGE
# =============================================================================

def is_available(force_refresh: bool = False) -> bool:
    """
    Vérifie si Ollama répond avec un cache court pour éviter les requêtes HTTP répétitives.
    """
    global _availability_cache
    now = time.time()

    with _cache_lock:
        if not force_refresh and (now - _availability_cache["last_check"]) < AVAILABILITY_CACHE_TTL:
            return _availability_cache["is_available"]

    available = False
    try:
        res = requests.get(OLLAMA_TAGS_URL, timeout=(2, 3))
        available = (res.status_code == 200)
    except Exception:
        available = False

    with _cache_lock:
        _availability_cache["last_check"] = now
        _availability_cache["is_available"] = available

    return available


def warmup() -> None:
    """
    Précharge le modèle en mémoire VRAM au démarrage via un thread d'arrière-plan.
    """
    def _run_warmup():
        try:
            logger.info(f"[Ollama] Warmup : vérification et préchargement de {OLLAMA_MODEL}...")
            if not is_available(force_refresh=True):
                logger.warning("[Ollama] Serveur Ollama injoignable au démarrage. Warmup ignoré.")
                return

            payload = {
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": "ping"}],
                "stream": False,
                "keep_alive": "30m",
                "options": {"num_predict": 1},
            }
            res = requests.post(OLLAMA_URL, json=payload, timeout=(3, 120))
            if res.status_code == 200:
                logger.info(f"[Ollama] Modèle {OLLAMA_MODEL} prêt et maintenu en mémoire (keep_alive: 30m).")
            else:
                logger.warning(f"[Ollama] Réponse inattendue lors du warmup : {res.status_code}")
        except Exception as e:
            logger.warning(f"[Ollama] Échec warmup non bloquant : {e}")

    thread = threading.Thread(target=_run_warmup, daemon=True, name="ollama-warmup")
    thread.start()


# =============================================================================
# APPEL LLM STRUCTURÉ (CHAT_JSON)
# =============================================================================

def chat_json(
    system: str,
    user: str,
    schema: Optional[Union[Dict[str, Any], Any]] = None,
    timeout: int = 60,
    queue_timeout: int = 20,
    num_predict: int = 4096,
    temperature: float = 0.1,
) -> Dict[str, Any]:
    """
    Envoie une requête chat structurée à Ollama (/api/chat) avec un schéma JSON strict.
    Gère la limitation de concurrence, les timeouts et la validation de format.
    """
    # 1. Résolution du format schéma JSON
    json_format: Any = "json"
    if schema is not None:
        if hasattr(schema, "model_json_schema"):
            json_format = schema.model_json_schema()
        elif isinstance(schema, dict):
            json_format = schema

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "stream": False,
        "format": json_format,
        "keep_alive": "30m",
        "options": {
            "temperature": temperature,
            "num_ctx": OLLAMA_NUM_CTX,
            "num_predict": num_predict,
        },
    }

    # 2. Acquisition du sémaphore de concurrence avec queue_timeout dédié
    acquired = _ollama_semaphore.acquire(timeout=queue_timeout)
    if not acquired:
        raise OllamaBusy(f"Service Ollama occupé (file d'attente dépassée {queue_timeout}s). Réessayer plus tard.")

    try:
        t0 = time.perf_counter()
        connect_timeout = 3
        read_timeout = max(5, timeout)

        try:
            res = requests.post(
                OLLAMA_URL,
                json=payload,
                timeout=(connect_timeout, read_timeout)
            )
        except requests.exceptions.ConnectTimeout:
            raise OllamaUnavailable(f"Connexion impossible au serveur Ollama sur {OLLAMA_URL}.")
        except requests.exceptions.ConnectionError:
            raise OllamaUnavailable(f"Serveur Ollama injoignable sur {OLLAMA_URL}. Vérifiez qu'Ollama est démarré.")
        except requests.exceptions.ReadTimeout:
            raise OllamaTimeout(f"Délai de lecture dépassé ({read_timeout}s) pour {OLLAMA_MODEL}.")
        except requests.exceptions.RequestException as re:
            raise OllamaException(f"Erreur requête Ollama : {str(re)}")

        if res.status_code != 200:
            if res.status_code in (502, 503, 504):
                raise OllamaUnavailable(f"Ollama a retourné un statut HTTP {res.status_code} : {res.text}")
            raise OllamaException(f"Ollama HTTP {res.status_code} : {res.text}")

        res_data = res.json()
        duration_s = round(time.perf_counter() - t0, 3)
        logger.debug(f"[Ollama] Réponse reçue en {duration_s}s.")

        # Vérification si la génération a été tronquée par la limite de tokens
        done_reason = res_data.get("done_reason")
        message_content = res_data.get("message", {}).get("content", "").strip()

        if done_reason == "length":
            logger.warning("[Ollama] Génération interrompue par 'done_reason: length' (OutputTruncated).")
            raise OutputTruncated(
                "La réponse du modèle a été tronquée par la limite maximale de tokens.",
                partial_content=message_content
            )

        if not message_content:
            raise InvalidModelOutput("Le modèle a retourné un contenu vide.")

        try:
            parsed = json.loads(message_content)
            if not isinstance(parsed, dict):
                raise InvalidModelOutput("Le contenu généré n'est pas un objet JSON.")
            return parsed
        except json.JSONDecodeError as jde:
            raise InvalidModelOutput(f"JSON invalide généré par le modèle : {jde}")

    finally:
        _ollama_semaphore.release()
