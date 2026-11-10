# -*- coding: utf-8 -*-
"""Tests de la recherche des compétences extraites dans le référentiel Laravel."""

from unittest.mock import MagicMock, patch

import requests

from competences_referentiel import appliquer_rapprochement, normaliser, rapprocher_competences
from cv_llm_parser import parse_cv_with_llm


def _reponse(lignes, status=200):
    r = MagicMock()
    r.status_code = status
    r.json.return_value = {"data": lignes}
    return r


def test_normaliser_ignore_casse_accents_et_espaces():
    assert normaliser("  ÉLECTROMÉCANIQUE ") == normaliser("electromecanique")


def test_rapprocher_envoie_un_seul_appel_avec_les_noms_uniques():
    lignes = [{"recherche": "python", "existe": True, "competence": "Python", "methode": "exact"}]
    with patch("competences_referentiel.requests.post", return_value=_reponse(lignes)) as post:
        res = rapprocher_competences(["python", "Python", "", "python"])
    assert post.call_count == 1
    assert post.call_args.kwargs["json"] == {"noms": ["python", "Python"]}
    assert res["python"]["competence"] == "Python"


def test_rapprocher_ne_leve_jamais_en_cas_de_panne_laravel():
    with patch("competences_referentiel.requests.post", side_effect=requests.ConnectionError("down")):
        assert rapprocher_competences(["Python"]) == {}
    with patch("competences_referentiel.requests.post", return_value=_reponse([], status=500)):
        assert rapprocher_competences(["Python"]) == {}


def test_rapprocher_sans_competence_n_appelle_pas_laravel():
    with patch("competences_referentiel.requests.post") as post:
        assert rapprocher_competences([]) == {}
    post.assert_not_called()


def test_appliquer_remplace_les_trouvees_et_compte():
    resultats = {
        "python": {"existe": True, "competence": "Python", "methode": "exact"},
        "node js": {"existe": True, "competence": "Node.js", "methode": "compact"},
        "soudure tig": {"existe": False, "competence": None, "methode": "aucune"},
    }
    res = appliquer_rapprochement(
        [{"nom": "python", "niveau": "Avancé"}, {"nom": "Node JS", "niveau": None}, {"nom": "Soudure TIG", "niveau": "Expert"}],
        resultats,
    )
    assert [c["nom"] for c in res["competences"]] == ["Python", "Node.js", "Soudure TIG"]
    assert res["existantes"] == 2 and res["nouvelles"] == 1


def test_appliquer_fusionne_les_doublons_et_garde_le_niveau():
    resultats = {"python": {"existe": True, "competence": "Python"}, "pyhton": {"existe": True, "competence": "Python"}}
    res = appliquer_rapprochement([{"nom": "python", "niveau": None}, {"nom": "Pyhton", "niveau": "Expert"}], resultats)
    assert len(res["competences"]) == 1
    assert res["competences"][0]["niveau"] == "Expert"


def test_parse_cv_applique_le_rapprochement_sans_toucher_au_prompt():
    llm = {
        "contact": {"nom_complet": "Marc Ravelo"},
        "competences": [{"nom": "python", "niveau": "Avancé"}, {"nom": "Soudure TIG", "niveau": None}],
        "experiences": [], "projets": [], "formations": [],
    }
    resultats = {"python": {"existe": True, "competence": "Python"}}
    with patch("cv_llm_parser.rapprocher_competences", return_value=resultats), \
         patch("cv_llm_parser.chat_json", return_value=llm) as m:
        res = parse_cv_with_llm("Marc Ravelo, développeur Python et soudeur TIG")

    assert "RÉFÉRENTIEL" not in m.call_args.kwargs["user"]  # le prompt n'embarque plus la liste
    assert [c["nom"] for c in res["competences"]] == ["Python", "Soudure TIG"]


def test_parse_cv_continue_si_le_rapprochement_est_indisponible():
    llm = {"contact": {"nom_complet": "Marc"}, "competences": [{"nom": "python", "niveau": None}],
           "experiences": [], "projets": [], "formations": []}
    with patch("cv_llm_parser.chat_json", return_value=llm):
        res = parse_cv_with_llm("Marc, python")
    assert res["competences"][0]["nom"] == "python"
