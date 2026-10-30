# -*- coding: utf-8 -*-
"""
Tests unitaires pour ollama_client.py
"""

from unittest.mock import MagicMock, patch
import pytest
import requests

from ollama_client import (
    InvalidModelOutput,
    OllamaBusy,
    OllamaTimeout,
    OllamaUnavailable,
    OutputTruncated,
    chat_json,
    is_available,
)


def test_ollama_timeout_exception():
    """Vérifie qu'un ReadTimeout de requests est traduit en OllamaTimeout."""
    with patch("requests.post", side_effect=requests.exceptions.ReadTimeout("Timeout exceeded")):
        with pytest.raises(OllamaTimeout) as exc_info:
            chat_json(system="sys", user="usr", timeout=2)
        assert "Délai de lecture dépassé" in str(exc_info.value)


def test_ollama_unavailable_connection_error():
    """Vérifie qu'une ConnectionError de requests est traduite en OllamaUnavailable."""
    with patch("requests.post", side_effect=requests.exceptions.ConnectionError("Connection refused")):
        with pytest.raises(OllamaUnavailable) as exc_info:
            chat_json(system="sys", user="usr", timeout=2)
        assert "injoignable" in str(exc_info.value)


def test_ollama_output_truncated_length():
    """Vérifie que done_reason='length' lève OutputTruncated avec partial_content."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "done_reason": "length",
        "message": {
            "content": '{"contact": {"nom_complet": "Jean Troncature'
        }
    }

    with patch("requests.post", return_value=mock_resp):
        with pytest.raises(OutputTruncated) as exc_info:
            chat_json(system="sys", user="usr")
        assert exc_info.value.partial_content.startswith('{"contact"')


def test_ollama_invalid_json_output():
    """Vérifie qu'un contenu non-JSON lève InvalidModelOutput."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "done_reason": "stop",
        "message": {
            "content": "Je suis désolé, je ne peux pas traiter cela."
        }
    }

    with patch("requests.post", return_value=mock_resp):
        with pytest.raises(InvalidModelOutput):
            chat_json(system="sys", user="usr")


def test_ollama_busy_queue_timeout():
    """Vérifie que la saturation du verrou/file d'attente lève OllamaBusy."""
    with patch("ollama_client._ollama_semaphore.acquire", return_value=False):
        with pytest.raises(OllamaBusy) as exc_info:
            chat_json(system="sys", user="usr", queue_timeout=1)
        assert "occupé" in str(exc_info.value)


def test_is_available_cache():
    """Vérifie le fonctionnement du cache d'is_available."""
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 200
        # Premier appel : effectue la requête HTTP
        assert is_available(force_refresh=True) is True
        assert mock_get.call_count == 1

        # Second appel immédiat : utilise le cache sans refaire de requête HTTP
        assert is_available(force_refresh=False) is True
        assert mock_get.call_count == 1
