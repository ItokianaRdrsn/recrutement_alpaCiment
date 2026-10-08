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
def analyser_email(payload: EmailAnalysisInput):
    """
    Analyse le contenu d'un email envoyé par n8n :
    - Détecte s'il s'agit d'une candidature ou d'un spam/newsletter.
    - Extrait l'adresse email et les compétences techniques mentionnées.
    - Détermine une décision de filtrage RH.
    """
    expediteur = payload.sender or payload.expediteur or "Inconnu"
    sujet = payload.subject or payload.sujet or ""
    contenu = payload.content or payload.corps_message or ""

    texte_complet = f"{sujet} {contenu}".lower()

    # Extraction regex de l'adresse email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', expediteur)
    email_trouve = email_match.group(0) if email_match else expediteur

    # Mots-clés de candidature RH
    mots_cles_rh = [
        "candidature", "cv", "recrutement", "postule", "poste", "stage",
        "emploi", "développeur", "ingenieur", "profil", "motivation"
    ]
    score_pertinence = sum(15 for mot in mots_cles_rh if mot in texte_complet)

    # Détection des compétences techniques
    competences_dispos = ["php", "laravel", "react", "python", "docker", "javascript", "vue", "sql", "git"]
    competences_trouvees = [comp.upper() for comp in competences_dispos if comp in texte_complet]
    score_pertinence += len(competences_trouvees) * 10
    score_pertinence = min(score_pertinence, 100)

    # Est-ce une candidature ?
    est_candidature = score_pertinence >= 30

    if est_candidature:
        decision = "CANDIDATURE_VALIDEE"
        action_recommandee = "Transférer au parsing de CV et planifier l'entretien"
        motif = f"Email qualifié comme candidature RH (Score: {score_pertinence}%). Compétences: {', '.join(competences_trouvees) if competences_trouvees else 'Non spécifiées'}."
    else:
        decision = "IGNORE_NON_PERTINENT"
        action_recommandee = "Classer sans suite (probablement une newsletter ou un email général)"
        motif = f"Aucun élément probant de candidature RH détecté (Score: {score_pertinence}%)."

    logger.info(f"Analyse email de [{expediteur}] -> {decision} ({score_pertinence}%)")

    return {
        "succes": True,
        "est_candidature": est_candidature,
        "email_expediteur": email_trouve,
        "sujet_analyse": sujet,
        "score_pertinence": score_pertinence,
        "competences_detectees": competences_trouvees,
        "decision": decision,
        "action_recommandee": action_recommandee,
        "motif": motif
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
