# -*- coding: utf-8 -*-
"""Normalisation des niveaux d'études."""

import pytest

from niveaux_diplomes import NIVEAUX_CANONIQUES, appliquer_niveaux, normaliser_niveau


@pytest.mark.parametrize("niveau, diplome, attendu", [
    (None, "Master en Télécommunications", "Bac+5 (Master 2 / Ingénieur)"),
    (None, "Licence en Télécommunications", "Bac+3 (Licence)"),
    (None, "Baccalauréat Série S", "Baccalauréat"),
    (None, "Diplôme d'ingénieur en génie civil", "Bac+5 (Master 2 / Ingénieur)"),
    (None, "Master 1 en gestion", "Bac+4 (Master 1)"),
    (None, "BTS Informatique", "Bac+2 (BTS / DUT)"),
    (None, "Doctorat en physique", "Bac+8 (Doctorat)"),
    (None, "CAP électricité", "CAP / BEP"),
    ("Bac+3", "Diplôme X", "Bac+3 (Licence)"),
    ("bac + 5 Master", None, "Bac+5 (Master 2 / Ingénieur)"),
    ("Bac+3 Licence", None, "Bac+3 (Licence)"),
    ("Doctorat", None, "Bac+8 (Doctorat)"),
    ("Maîtrise", None, "Bac+4 (Master 1)"),
    (None, "Huawei Certified ICT Associate (HCIA)", None),
    (None, None, None),
])
def test_normaliser_niveau(niveau, diplome, attendu):
    assert normaliser_niveau(niveau, diplome) == attendu


def test_les_sorties_sont_toujours_des_libelles_canoniques():
    for diplome in ["Master en Télécommunications", "Licence pro", "Baccalauréat Série S", "BTS", "Doctorat"]:
        assert normaliser_niveau(None, diplome) in NIVEAUX_CANONIQUES


def test_appliquer_niveaux_sur_le_cas_reel_du_cv():
    formations = [
        {"diplome": "Master en Télécommunications", "niveau": None},
        {"diplome": "Licence en Télécommunications"},
        {"diplome": "Baccalauréat Série S", "niveau": "Bac"},
    ]
    appliquer_niveaux(formations)
    assert [f["niveau"] for f in formations] == [
        "Bac+5 (Master 2 / Ingénieur)", "Bac+3 (Licence)", "Baccalauréat",
    ]


def test_niveau_competence_par_defaut_intermediaire():
    from niveaux_diplomes import appliquer_niveaux_competences, normaliser_niveau_competence

    assert normaliser_niveau_competence(None) == "Intermédiaire"
    assert normaliser_niveau_competence("") == "Intermédiaire"
    assert normaliser_niveau_competence("avancé") == "Avancé"
    assert normaliser_niveau_competence("Expert") == "Expert"
    assert normaliser_niveau_competence("intermediaire") == "Intermédiaire"
    assert normaliser_niveau_competence("notions") == "Débutant"
    assert normaliser_niveau_competence("niveau bizarre") == "Intermédiaire"

    comps = [
        {"nom": "Réseaux mobiles", "niveau": None},
        {"nom": "Python"},
        {"nom": "SQL", "niveau": "Avancé"},
        {"nom": "Langue : Français", "niveau": "Courant"},
        {"nom": "Langue : Anglais", "niveau": None},
    ]
    appliquer_niveaux_competences(comps)
    assert [c["niveau"] for c in comps] == ["Intermédiaire", "Intermédiaire", "Avancé", "Courant", "Intermédiaire"]
