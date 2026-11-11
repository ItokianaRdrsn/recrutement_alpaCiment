# -*- coding: utf-8 -*-
"""
Tests unitaires pour document_classifier.py
"""
from document_classifier import classify_document, select_best_cv


def test_classify_explicit_cv_by_name():
    res = classify_document(text="", filename="CV_Teddy_Andria.pdf", file_size=150000)
    assert res["est_cv"] is True
    assert res["type_predit"] == "CV"
    assert res["score_cv"] >= 60


def test_classify_lettre_motivation_by_name_and_content():
    text = "Madame, Monsieur,\nJe vous soumets ma candidature au poste de développeur...\nVeuillez agréer mes salutations distinguées."
    res = classify_document(text=text, filename="Lettre_motivation.pdf", file_size=80000)
    assert res["est_cv"] is False
    assert res["type_predit"] == "LETTRE_MOTIVATION"
    assert res["score_lm"] > res["score_cv"]


def test_classify_diplome_by_content():
    text = "RÉPUBLIQUE DE MADAGASCAR\nMINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR\nLe recteur certifie que l'étudiant a satisfait aux épreuves du diplôme de Licence."
    res = classify_document(text=text, filename="Document_01.pdf", file_size=250000)
    assert res["est_cv"] is False
    assert res["type_predit"] == "DIPLOME"


def test_classify_ambiguous_names_with_cv_content():
    # Deux fichiers nommés 'Scan1.pdf' et 'Scan2.pdf'
    cv_text = "Teddy Andria\nDéveloppeur Full Stack\n034 00 000 00 - teddy@example.com\nExpériences professionnelles:\n2022 - 2024 Développeur chez Alpha\nFormations:\n2021 Licence Informatique\nCompétences: PHP, React, Python"
    lm_text = "Madame, Monsieur, j'ai l'honneur de vous adresser ma lettre de motivation pour intégrer votre équipe. Veuillez agréer..."

    doc1 = classify_document(text=lm_text, filename="Scan_01.pdf", file_size=120000)
    doc2 = classify_document(text=cv_text, filename="Scan_02.pdf", file_size=180000)

    selection = select_best_cv([doc1, doc2])
    assert selection["best_cv_filename"] == "Scan_02.pdf"
    assert selection["best_cv"]["est_cv"] is True
    assert len(selection["pieces_jointes"]) == 1
    assert selection["pieces_jointes"][0]["filename"] == "Scan_01.pdf"


if __name__ == "__main__":
    test_classify_explicit_cv_by_name()
    test_classify_lettre_motivation_by_name_and_content()
    test_classify_diplome_by_content()
    test_classify_ambiguous_names_with_cv_content()
    print("ALL 4 DOCUMENT CLASSIFIER TESTS PASSED!")

