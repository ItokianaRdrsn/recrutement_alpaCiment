# -*- coding: utf-8 -*-
"""
Tests unitaires pour cv_ocr_extractor.py
"""

import io
import docx
import pytest
from cv_ocr_extractor import extract_text, extract_raw_text_from_bytes, detect_file_type


def test_empty_bytes_extraction():
    """Vérifie qu'un contenu vide retourne ocr_status='vide'."""
    res = extract_text(b"", "cv.pdf")
    assert res["ocr_status"] == "vide"
    assert res["text"] == ""
    assert extract_raw_text_from_bytes(b"", "cv.pdf") == ""


def test_unsupported_file_type():
    """Vérifie qu'un fichier non supporté (binaire arbitraire) retourne une erreur type_non_supporte."""
    random_binary = b"\x00\x01\x02\x03\x04\x05\x06\x07\x08"
    res = extract_text(random_binary, "document.exe")
    assert res["ocr_status"] == "echec"
    assert res["reason"] == "type_non_supporte"
    assert len(res["warnings"]) > 0


def test_doc_legacy_format_rejected():
    """Vérifie que l'ancien format Word binaire .doc est explicitement rejeté."""
    # OLE Compound File Header : D0 CF 11 E0
    ole_header = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1" + b"\x00" * 64
    res = extract_text(ole_header, "ancien_cv.doc")
    assert res["ocr_status"] == "echec"
    assert res["reason"] == "format_non_supporte"


def test_docx_extraction_success():
    """Vérifie la bonne extraction de texte depuis un fichier .docx valide."""
    doc = docx.Document()
    doc.add_paragraph("Jean Dupont - Ingénieur Cimenterie")
    doc.add_paragraph("Compétences : Maintenance préventive, Gestion d'équipe.")
    
    table = doc.add_table(rows=1, cols=2)
    row_cells = table.rows[0].cells
    row_cells[0].text = "2020-2024"
    row_cells[1].text = "Responsable d'exploitation Tamatave"

    buffer = io.BytesIO()
    doc.save(buffer)
    docx_bytes = buffer.getvalue()

    res = extract_text(docx_bytes, "cv_candidat.docx")
    assert res["ocr_status"] == "ok"
    assert res["method"] == "docx"
    assert "Jean Dupont" in res["text"]
    assert "Maintenance préventive" in res["text"]
    assert "Responsable d'exploitation" in res["text"]

    # Vérification enveloppe extract_raw_text_from_bytes
    raw = extract_raw_text_from_bytes(docx_bytes, "cv_candidat.docx")
    assert "Jean Dupont" in raw


def test_docx_empty_content():
    """Vérifie qu'un .docx sans aucun paragraphe retourne ocr_status='vide'."""
    doc = docx.Document()
    buffer = io.BytesIO()
    doc.save(buffer)
    empty_docx_bytes = buffer.getvalue()

    res = extract_text(empty_docx_bytes, "vide.docx")
    assert res["ocr_status"] == "vide"
    assert res["reason"] == "aucun_texte"
