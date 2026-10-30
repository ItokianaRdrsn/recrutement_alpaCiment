# -*- coding: utf-8 -*-
"""
schemas.py
==========
Modèles Pydantic pour la validation stricte des données du CV et de la classification.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


# =============================================================================
# SCHÉMA CV & EXTRACTION NER
# =============================================================================

class ContactSchema(BaseModel):
    nom_complet: Optional[str] = Field(None, description="Nom et prénom complets du candidat")
    email: Optional[str] = Field(None, description="Adresse email valide du candidat")
    telephone: Optional[str] = Field(None, description="Numéro de téléphone du candidat")
    ville: Optional[str] = Field(None, description="Ville ou région de résidence du candidat")


class CompetenceItemSchema(BaseModel):
    nom: str = Field(..., description="Nom de la compétence ou technologie")
    niveau: Optional[str] = Field(
        None,
        description="Niveau déclaré explicitement dans le CV ('Débutant', 'Intermédiaire', 'Avancé', 'Expert'). null si non précisé."
    )


class ExperienceItemSchema(BaseModel):
    poste: str = Field(..., description="Intitulé du poste occupé en entreprise")
    entreprise: Optional[str] = Field(None, description="Nom de l'entreprise ou employeur")
    date_debut: Optional[str] = Field(None, description="Date de début au format YYYY-MM-DD ou YYYY-01-01")
    date_fin: Optional[str] = Field(None, description="Date de fin au format YYYY-MM-DD ou null si en cours")
    description: Optional[str] = Field(None, description="Synthèse des missions réalisées")


class ProjetItemSchema(BaseModel):
    titre_projet: str = Field(..., description="Titre ou nom du projet / réalisation")
    role: Optional[str] = Field(None, description="Rôle dans le projet")
    technologies: Optional[str] = Field(None, description="Technologies utilisées séparées par des virgules")
    url_projet: Optional[str] = Field(None, description="Lien web ou GitHub du projet")
    date_debut: Optional[str] = Field(None, description="Date de début au format YYYY-MM-DD")
    date_fin: Optional[str] = Field(None, description="Date de fin au format YYYY-MM-DD")
    description: Optional[str] = Field(None, description="Description synthétique du projet")


class FormationItemSchema(BaseModel):
    diplome: str = Field(..., description="Nom du diplôme ou certificat obtenu")
    etablissement: Optional[str] = Field(None, description="Nom de l'établissement d'enseignement")
    date_obtention: Optional[str] = Field(None, description="Date d'obtention (YYYY-MM-DD ou YYYY-01-01)")
    domaine_etude: Optional[str] = Field(None, description="Filière ou domaine d'étude")
    niveau: Optional[str] = Field(None, description="Niveau d'études (ex: Bac+3, Bac+5, Master)")


class CvStructuredSchema(BaseModel):
    contact: ContactSchema = Field(default_factory=ContactSchema)
    profil: Optional[str] = Field(None, description="Bref résumé professionnel")
    competences: List[CompetenceItemSchema] = Field(default_factory=list)
    experiences: List[ExperienceItemSchema] = Field(default_factory=list)
    projets: List[ProjetItemSchema] = Field(default_factory=list)
    formations: List[FormationItemSchema] = Field(default_factory=list)


# =============================================================================
# SCHÉMA CLASSIFICATION E-MAILS
# =============================================================================

class EmailTypeEnum(str, Enum):
    DEMANDE_OFFRE = "demande_offre"
    DEMANDE_SPONTANEE = "demande_spontanee"
    DEMANDE_INFORMATION = "demande_information"
    HORS_SUJET = "hors_sujet"


class EmailClassificationResultSchema(BaseModel):
    type: EmailTypeEnum = Field(..., description="Catégorie d'intention de l'email")
    id_offre: Optional[int] = Field(None, description="ID numérique de l'offre si demande_offre")
    reference_offre: Optional[str] = Field(None, description="Référence officielle de l'offre (ex: IT-1)")
    offre_ciblee: Optional[str] = Field(None, description="Intitulé du poste ciblé")
    domaine_souhaite: Optional[str] = Field(None, description="Domaine d'activité déduit")
    question_resume: Optional[str] = Field(None, description="Résumé de la question posée si demande_information")
    confiance: float = Field(0.0, description="Indice de confiance de 0.0 à 1.0")
    justification: Optional[str] = Field(None, description="Justification de la décision")
