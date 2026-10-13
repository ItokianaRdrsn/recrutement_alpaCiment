"""
API FastAPI Locale pour le Test & Apprentissage de n8n
Projet : Plateforme de Recrutement AlpA Ciment
Fonctionne 100% Hors Connexion (Localhost)
"""

import re
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Configuration des logs
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("AlpaCimentAPI")

app = FastAPI(
    title="AlpA Ciment - API Mock RH pour n8n",
    description="API locale hors-connexion pour apprendre à orchestrer des flux RH avec n8n.",
    version="1.0.0"
)

# Autoriser les requêtes CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Modèles de Données Pydantic ---

class Candidat(BaseModel):
    id: int
    nom: str
    email: str
    poste: str
    annees_experience: int
    competences: List[str]
    score_qcm_initial: int  # Note sur 100
    statut: str = "EN_ATTENTE"

class EvaluationInput(BaseModel):
    id: int
    nom: str
    email: str
    poste: str
    annees_experience: int
    competences: List[str]
    score_qcm_initial: int

class EvaluationResult(BaseModel):
    candidat_id: int
    nom: str
    email: str
    poste: str
    score_global: int
    decision: str  # 'RETENU' ou 'REFUSE'
    motif: str

class StatutUpdateInput(BaseModel):
    nouveau_statut: str
    remarque: Optional[str] = None

class NotificationInput(BaseModel):
    destinataire_email: str
    destinataire_nom: str
    objet: str
    contenu: str
    type_notification: str  # 'CONVOCATION_ENTRETIEN' ou 'REJET'

class EmailAnalysisInput(BaseModel):
    sender: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    # Alias français optionnels
    expediteur: Optional[str] = None
    sujet: Optional[str] = None
    corps_message: Optional[str] = None


# --- Base de Données en Mémoire Locale (Mock) ---

BASE_CANDIDATS: List[dict] = [
    {
        "id": 1,
        "nom": "Jean Rakoto",
        "email": "jean.rakoto@example.local",
        "poste": "Développeur Fullstack Laravel / React",
        "annees_experience": 4,
        "competences": ["PHP", "Laravel", "React", "PostgreSQL", "Docker"],
        "score_qcm_initial": 85,
        "statut": "EN_ATTENTE"
    },
    {
        "id": 2,
        "nom": "Marie Rasoa",
        "email": "marie.rasoa@example.local",
        "poste": "Développeur Fullstack Laravel / React",
        "annees_experience": 1,
        "competences": ["HTML", "CSS", "WordPress"],
        "score_qcm_initial": 45,
        "statut": "EN_ATTENTE"
    },
    {
        "id": 3,
        "nom": "Toky Andria",
        "email": "toky.andria@example.local",
        "poste": "Ingénieur DevOps & Automatisation",
        "annees_experience": 5,
        "competences": ["Docker", "Kubernetes", "CI/CD", "Linux", "Python"],
        "score_qcm_initial": 92,
        "statut": "EN_ATTENTE"
    },
    {
        "id": 4,
        "nom": "Sarah Razafy",
        "email": "sarah.razafy@example.local",
        "poste": "Développeur Fullstack Laravel / React",
        "annees_experience": 2,
        "competences": ["PHP", "JavaScript", "MySQL"],
        "score_qcm_initial": 68,
        "statut": "EN_ATTENTE"
    }
]

BOITE_NOTIFICATIONS_SIMULEES: List[dict] = []


# --- Endpoints API ---

@app.get("/")
def racine():
    """Point d'entrée pour vérifier que l'API est active."""
    return {
        "service": "AlpA Ciment - API Mock RH",
        "statut": "actif",
        "mode": "100% Hors-Connexion",
        "endpoints_disponibles": [
            "GET /api/candidats",
            "GET /api/candidats/en-attente",
            "POST /api/evaluer-candidat",
            "POST /api/candidats/{id}/statut",
            "POST /api/notifications/envoyer",
            "GET /api/notifications/boite-envois"
        ]
    }


@app.get("/api/candidats")
def liste_candidats():
    """Récupère l'ensemble des candidats."""
    return {"total": len(BASE_CANDIDATS), "candidats": BASE_CANDIDATS}


@app.get("/api/candidats/en-attente")
def candidats_en_attente():
    """
    Récupère uniquement les candidats dont le statut est 'EN_ATTENTE'.
    C'est ce endpoint que n8n appellera au début du workflow.
    """
    en_attente = [c for c in BASE_CANDIDATS if c["statut"] == "EN_ATTENTE"]
    logger.info(f"Appel /api/candidats/en-attente : {len(en_attente)} candidat(s) trouvé(s).")
    return en_attente


@app.post("/api/evaluer-candidat", response_model=EvaluationResult)
def evaluer_candidat(candidat: EvaluationInput):
    """
    Simule l'évaluation algorithmique d'un profil par FastAPI.
    Calcule un score pondéré :
    - 50% QCM initial
    - 30% Années d'expérience (10 pts par année, max 30)
    - 20% Compétences clés requises
    """
    bonus_experience = min(candidat.annees_experience * 10, 30)
    
    # Vérification des compétences recherchées selon le poste
    competences_cherchees = ["Laravel", "React", "Docker", "Python", "PHP", "CI/CD"]
    nb_competences_valides = sum(1 for comp in candidat.competences if any(req.lower() in comp.lower() for req in competences_cherchees))
    bonus_competences = min(nb_competences_valides * 5, 20)

    score_global = int((candidat.score_qcm_initial * 0.5) + bonus_experience + bonus_competences)
    score_global = min(max(score_global, 0), 100)

    # Seuil d'admission pour entretien : 70/100
    if score_global >= 70:
        decision = "RETENU"
        motif = f"Score global de {score_global}/100 suffisant (QCM: {candidat.score_qcm_initial}, Expérience: {candidat.annees_experience} ans)."
    else:
        decision = "REFUSE"
        motif = f"Score global de {score_global}/100 inférieur au seuil requis de 70/100."

    logger.info(f"Évaluation terminée pour {candidat.nom} : {decision} ({score_global}/100)")

    return EvaluationResult(
        candidat_id=candidat.id,
        nom=candidat.nom,
        email=candidat.email,
        poste=candidat.poste,
        score_global=score_global,
        decision=decision,
        motif=motif
    )


@app.post("/api/candidats/{candidat_id}/statut")
def mettre_a_jour_statut(candidat_id: int, payload: StatutUpdateInput):
    """
    Met à jour le statut d'un candidat dans la base mock.
    n8n appelle ce endpoint après la condition 'IF'.
    """
    for candidat in BASE_CANDIDATS:
        if candidat["id"] == candidat_id:
            ancien_statut = candidat["statut"]
            candidat["statut"] = payload.nouveau_statut
            logger.info(f"Candidat #{candidat_id} ({candidat['nom']}) : Statut changé '{ancien_statut}' -> '{payload.nouveau_statut}'")
            return {
                "succes": True,
                "candidat_id": candidat_id,
                "nom": candidat["nom"],
                "nouveau_statut": payload.nouveau_statut,
                "remarque": payload.remarque
            }
    
    raise HTTPException(status_code=404, detail=f"Candidat #{candidat_id} introuvable.")


@app.post("/api/notifications/envoyer")
def envoyer_notification(notification: NotificationInput):
    """
    Simule l'envoi hors-connexion d'un e-mail ou d'une notification RH.
    Enregistre le message dans une boîte d'envoi locale consultable.
    """
    entry = {
        "destinataire_email": notification.destinataire_email,
        "destinataire_nom": notification.destinataire_nom,
        "objet": notification.objet,
        "contenu": notification.contenu,
        "type_notification": notification.type_notification
    }
    BOITE_NOTIFICATIONS_SIMULEES.append(entry)
    logger.info(f"Notification simulée envoyée à {notification.destinataire_nom} <{notification.destinataire_email}> | Objet: {notification.objet}")
    
    return {
        "succes": True,
        "message": "Notification enregistrée dans la boîte d'envoi locale.",
        "details": entry
    }


@app.get("/api/notifications/boite-envois")
def consulter_boite_envois():
    """Permet de voir tous les e-mails simulés envoyés par n8n."""
    return {
        "total_envoyes": len(BOITE_NOTIFICATIONS_SIMULEES),
        "notifications": BOITE_NOTIFICATIONS_SIMULEES
    }


@app.post("/api/analyser-email")
@app.post("/api/classifier-intention")
def classifier_intention(payload: EmailAnalysisInput):
    """
    Classifie l'e-mail entrant en 3 intentions claires :
    - 'demande_emploi' : Candidat postulant (sur offre ou spontanée)
    - 'information' : Demande d'information générale ou de renseignements
    - 'spam' : Newsletter, pub, message non pertinent

    Détecte également si une référence d'offre est mentionnée (id_offre ou titre).
    """
    expediteur = payload.sender or payload.expediteur or "Inconnu"
    sujet = payload.subject or payload.sujet or ""
    contenu = payload.content or payload.corps_message or ""

    texte_complet = f"{sujet} {contenu}".lower()

    # Extraction regex de l'adresse email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', expediteur)
    email_trouve = email_match.group(0) if email_match else expediteur

    # 1. Détection de Spam / Pub / Démarchage
    mots_cles_spam = [
        "casino", "gagner de l'argent", "promo", "remise", "viagra", "crypto",
        "bitcoin", "unsubscribe", "désabonner", "offre spéciale", "partenariat b2b",
        "investissez", "seo ranking", "agrandir", "gratuit sans engagement"
    ]
    is_spam = any(sp in texte_complet for sp in mots_cles_spam)

    # 2. Détection de Demande d'Information
    mots_cles_info = [
        "renseignement", "information", "horaires", "adresse usine", "visite",
        "tarifs ciment", "catalogue produit", "devis", "question", "comment postuler",
        "dates de concours", "qui contacter", "période de stage", "contact rh"
    ]
    score_info = sum(15 for mot in mots_cles_info if mot in texte_complet)

    # 3. Détection de Candidature / Demande d'emploi
    mots_cles_candidature = [
        "candidature", "cv", "curriculum vitae", "postule", "postuler", "poste",
        "emploi", "développeur", "ingénieur", "profil", "motivation", "rejoindre",
        "opportunité", "recrutement", "embauche", "lettre de motivation"
    ]
    score_candidature = sum(15 for mot in mots_cles_candidature if mot in texte_complet)

    # Compétences informatiques / techniques
    competences_dispos = ["php", "laravel", "react", "python", "docker", "javascript", "vue", "sql", "git", "java", "ciment", "maintenance", "électromécanique", "comptabilité"]
    competences_trouvees = [comp.upper() for comp in competences_dispos if comp in texte_complet]
    score_candidature += len(competences_trouvees) * 10

    # Détection d'offre spécifique (ex: REF-1, OFF-2, Offre #3, ou id_offre)
    id_offre_detecte = None
    match_ref = re.search(r'(?:offre|ref|poste)\s*(?:#|n°|numéro)?\s*(\d+)', texte_complet)
    if match_ref:
        try:
            id_offre_detecte = int(match_ref.group(1))
        except ValueError:
            id_offre_detecte = None

    # Détermination de l'intention finale
    if is_spam and score_candidature < 30:
        intention = "spam"
        confiance = 0.90
        motif = "Contenu publicitaire ou non pertinent détecté."
    elif score_candidature >= 25 or "cv" in texte_complet or "candidature" in texte_complet:
        intention = "demande_emploi"
        confiance = min(0.60 + (score_candidature * 0.004), 0.98)
        type_candidature = "sur_offre" if id_offre_detecte else "spontanee"
        motif = f"E-mail qualifié comme candidature d'emploi ({type_candidature})."
    elif score_info > 0 or "?" in texte_complet:
        intention = "information"
        confiance = 0.85
        motif = "Demande d'information ou de renseignement."
    else:
        intention = "spam"
        confiance = 0.70
        motif = "Message sans pertinence RH claire."

    logger.info(f"Classification email de [{expediteur}] -> Intention: {intention} (Offre: {id_offre_detecte})")

    return {
        "succes": True,
        "intention": intention,
        "score_confiance": round(confiance, 2),
        "id_offre": id_offre_detecte,
        "est_spontanee": id_offre_detecte is None,
        "email_expediteur": email_trouve,
        "sujet": sujet,
        "competences_detectees": competences_trouvees,
        "motif": motif,
    }


@app.post("/api/extraire-cv-ocr")
def extraire_cv_ocr(payload: dict):
    """
    Simulation du parsing OCR + LLM d'un CV en extrayant distinctement :
    - contact (nom, prenom, email, telephone, ville)
    - competences (liste avec niveau)
    - experiences (postes en entreprise, contrats officiels)
    - projets (réalisations pratiques, académiques, open-source - SÉPARATION EXPLICITE)
    - formations (diplômes, établissements)
    """
    texte = payload.get("texte", "") or payload.get("content", "") or ""
    nom_fichier = payload.get("nom_fichier", "CV_candidat.pdf")

    logger.info(f"Extraction CV OCR & LLM sur {nom_fichier} (longueur texte: {len(texte)})")

    # Modèle structuré standardisé renvoyé à n8n pour Laravel
    return {
        "succes": True,
        "contact": {
            "nom_complet": payload.get("nom_complet") or "Rakoto Jean",
            "nom": payload.get("nom") or "Rakoto",
            "prenom": payload.get("prenom") or "Jean",
            "email": payload.get("email") or "jean.rakoto@example.local",
            "telephone": payload.get("telephone") or "+261 34 12 345 67",
            "ville": payload.get("ville") or "Antananarivo"
        },
        "competences": [
            {"nom": "Laravel", "niveau": "Avancé"},
            {"nom": "React", "niveau": "Avancé"},
            {"nom": "PostgreSQL", "niveau": "Intermédiaire"},
            {"nom": "Docker", "niveau": "Intermédiaire"}
        ],
        "experiences": [
            {
                "poste": "Développeur Web Fullstack",
                "entreprise": "Tech Solutions Madagascar",
                "date_debut": "2023-01-01",
                "date_fin": "2024-06-30",
                "description": "Développement et maintenance d'applications web d'entreprise avec Laravel et Vue.js."
            }
        ],
        "projets": [
            {
                "titre_projet": "Plateforme Logistique AlpA Tracking",
                "role": "Concepteur & Lead Développeur",
                "technologies": "React, Node.js, PostgreSQL",
                "url_projet": "https://github.com/example/alpa-tracking",
                "date_debut": "2022-03-01",
                "date_fin": "2022-09-30",
                "description": "Projet académique de fin d'études : système IoT de traçabilité des camions de livraison de ciment."
            },
            {
                "titre_projet": "Portfolio & Micro-services Docker",
                "role": "Développeur Open Source",
                "technologies": "Docker, FastAPI, Nginx",
                "url_projet": "https://portfolio.example.local",
                "date_debut": "2024-01-01",
                "date_fin": None,
                "description": "Déploiement de micro-services conteneurisés en environnement local."
            }
        ],
        "formations": [
            {
                "diplome": "Master 2 en Ingénierie Logicielle",
                "etablissement": "IT University (ITU)",
                "domaine_etude": "Informatique & Systèmes Distribués",
                "date_obtention": "2023-11-15",
                "niveau": "Bac+5"
            }
        ],
        "texte_brut_ocr": texte or f"Curriculum Vitae de Jean Rakoto. Ingénieur Logiciel. Projets : AlpA Tracking. Expérience : Tech Solutions."
    }


@app.post("/api/reinitialiser")
def reinitialiser_donnees():
    """Réinitialise les candidats et la boîte d'envoi pour recommencer les tests n8n."""
    for c in BASE_CANDIDATS:
        c["statut"] = "EN_ATTENTE"
    BOITE_NOTIFICATIONS_SIMULEES.clear()
    logger.info("Données de test réinitialisées avec succès.")
    return {"message": "Données réinitialisées avec succès."}


if __name__ == "__main__":
    logger.info("Démarrage du serveur FastAPI local sur http://0.0.0.0:8000...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
