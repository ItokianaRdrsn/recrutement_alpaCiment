\c postgres

DROP DATABASE IF EXISTS gestion_candidature;

CREATE DATABASE gestion_candidature
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    TEMPLATE = template0;

\c gestion_candidature


-- ============================================================
-- BASE DE DONNÉES : GESTION DES CANDIDATURES
-- ============================================================

-- ============================================================
-- BASE DE DONNÉES : GESTION DES CANDIDATURES
-- ============================================================

SET client_encoding TO 'UTF8';

-- ============================================================
-- 1. DIRECTION
-- ============================================================

CREATE TABLE direction (
    id_direction BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_direction VARCHAR(150) NOT NULL UNIQUE
);

-- ============================================================
-- 2. DOMAINE (avec colonne valide)
-- ============================================================

CREATE TABLE domaine (
    id_domaine BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_domaine VARCHAR(150) NOT NULL UNIQUE,
    id_direction BIGINT NOT NULL
        REFERENCES direction(id_direction)
        ON DELETE RESTRICT,
    valide BOOLEAN NOT NULL DEFAULT FALSE,  -- FALSE = en attente de validation, TRUE = validé
    date_validation TIMESTAMPTZ,            -- Date de validation (optionnelle)
    valide_par BIGINT                       -- ID de l'utilisateur qui a validé (optionnel)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_domaine_direction ON domaine(id_direction);
CREATE INDEX idx_domaine_valide ON domaine(valide) WHERE valide = FALSE;  -- Pour trouver facilement les domaines en attente

-- ============================================================
-- 3. TYPE DE DEMANDE
-- ============================================================

CREATE TABLE type_demande (
    id_type_demande BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO type_demande (libelle) VALUES
    ('Offre'),
    ('Spontanee');

-- ============================================================
-- 4. STATUT DE L'OFFRE
-- ============================================================

CREATE TABLE statut_offre (
    id_statut_offre BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO statut_offre (libelle) VALUES
    ('Brouillon'),
    ('Publiee'),
    ('Cloturee');

-- ============================================================
-- 5. OFFRE
-- ============================================================

CREATE TABLE offre (
    id_offre BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titre_poste VARCHAR(200) NOT NULL,
    id_direction BIGINT NOT NULL
        REFERENCES direction(id_direction)
        ON DELETE RESTRICT,
    date_publication DATE,
    date_limite DATE,
    id_statut_offre BIGINT NOT NULL
        REFERENCES statut_offre(id_statut_offre)
        ON DELETE RESTRICT
);

CREATE INDEX idx_offre_direction ON offre(id_direction);
CREATE INDEX idx_offre_statut ON offre(id_statut_offre);

-- ============================================================
-- 6. CANDIDAT
-- ============================================================

CREATE TABLE candidat (
    id_candidat BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    telephone VARCHAR(30),
    adresse TEXT,
    date_naissance DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidat_nom ON candidat(nom);
CREATE INDEX idx_candidat_email ON candidat(email);

-- ============================================================
-- 7. COMPETENCE
-- ============================================================

CREATE TABLE competence (
    id_competence BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_competence VARCHAR(150) NOT NULL UNIQUE
);

-- ============================================================
-- 8. CANDIDAT_COMPETENCE
-- ============================================================

CREATE TABLE candidat_competence (
    id_candidat BIGINT NOT NULL
        REFERENCES candidat(id_candidat)
        ON DELETE CASCADE,
    id_competence BIGINT NOT NULL
        REFERENCES competence(id_competence)
        ON DELETE CASCADE,
    niveau VARCHAR(30),
    PRIMARY KEY (id_candidat, id_competence)
);

-- ============================================================
-- 9. STATUT DE CANDIDATURE
-- ============================================================

CREATE TABLE statut_candidature (
    id_statut_candidature BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE,
    ordre_workflow INTEGER NOT NULL DEFAULT 0
);

INSERT INTO statut_candidature (libelle, ordre_workflow) VALUES
    ('Recue', 1),
    ('Preselectionnee', 2),
    ('Test', 3),
    ('Entretien', 4),
    ('Retenue', 5),
    ('Non retenue', 6);

-- ============================================================
-- 10. UTILISATEUR
-- ============================================================

CREATE TABLE utilisateur (
    id_utilisateur BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL DEFAULT 'rh'
        CHECK (role IN ('rh', 'admin', 'manager'))
);

-- ============================================================
-- 11. CANDIDATURE
-- ============================================================

CREATE TABLE candidature (
    id_candidature BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_candidat BIGINT NOT NULL
        REFERENCES candidat(id_candidat)
        ON DELETE CASCADE,
    id_type_demande BIGINT NOT NULL
        REFERENCES type_demande(id_type_demande)
        ON DELETE RESTRICT,
    id_offre BIGINT
        REFERENCES offre(id_offre)
        ON DELETE RESTRICT,
    id_domaine BIGINT
        REFERENCES domaine(id_domaine)
        ON DELETE RESTRICT,
    id_statut_candidature BIGINT NOT NULL
        REFERENCES statut_candidature(id_statut_candidature)
        ON DELETE RESTRICT,
    dans_vivier BOOLEAN NOT NULL DEFAULT FALSE,
    poste_souhaite VARCHAR(200),
    message TEXT,
    date_candidature TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_maj TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidature_candidat ON candidature(id_candidat);
CREATE INDEX idx_candidature_offre ON candidature(id_offre);
CREATE INDEX idx_candidature_domaine ON candidature(id_domaine);
CREATE INDEX idx_candidature_type_demande ON candidature(id_type_demande);
CREATE INDEX idx_candidature_statut ON candidature(id_statut_candidature);
CREATE INDEX idx_candidature_vivier ON candidature(dans_vivier) WHERE dans_vivier = TRUE;

-- ============================================================
-- 12. FONCTION DE VERIFICATION DU TYPE DE DEMANDE
-- ============================================================

CREATE OR REPLACE FUNCTION verifier_type_demande_candidature()
RETURNS TRIGGER AS $$
DECLARE
    type_demande_libelle VARCHAR(50);
BEGIN
    SELECT libelle INTO type_demande_libelle
    FROM type_demande
    WHERE id_type_demande = NEW.id_type_demande;

    IF type_demande_libelle IS NULL THEN
        RAISE EXCEPTION 'Le type de demande % n''existe pas', NEW.id_type_demande;
    END IF;

    IF type_demande_libelle = 'Offre' THEN
        IF NEW.id_offre IS NULL THEN
            RAISE EXCEPTION 'Une candidature de type Offre doit avoir une offre';
        END IF;
        IF NEW.id_domaine IS NOT NULL THEN
            RAISE EXCEPTION 'Une candidature de type Offre ne doit pas avoir de domaine';
        END IF;
    END IF;

    IF type_demande_libelle = 'Spontanee' THEN
        IF NEW.id_domaine IS NULL THEN
            RAISE EXCEPTION 'Une candidature spontanee doit avoir un domaine';
        END IF;
        IF NEW.id_offre IS NOT NULL THEN
            RAISE EXCEPTION 'Une candidature spontanee ne doit pas avoir d''offre';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verifier_type_demande_candidature
BEFORE INSERT OR UPDATE ON candidature
FOR EACH ROW
EXECUTE FUNCTION verifier_type_demande_candidature();

-- ============================================================
-- 13. HISTORIQUE DES STATUTS
-- ============================================================

CREATE TABLE historique_statut (
    id_historique BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_candidature BIGINT NOT NULL
        REFERENCES candidature(id_candidature)
        ON DELETE CASCADE,
    id_statut_candidature BIGINT NOT NULL
        REFERENCES statut_candidature(id_statut_candidature)
        ON DELETE RESTRICT,
    date_changement TIMESTAMPTZ NOT NULL DEFAULT now(),
    commentaire TEXT,
    id_utilisateur BIGINT
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE SET NULL
);

CREATE INDEX idx_historique_candidature ON historique_statut(id_candidature);

-- ============================================================
-- 14. DOCUMENT
-- ============================================================

CREATE TABLE document (
    id_document BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_candidature BIGINT NOT NULL
        REFERENCES candidature(id_candidature)
        ON DELETE CASCADE,
    type_document VARCHAR(50) NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier TEXT NOT NULL,
    date_upload TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_candidature ON document(id_candidature);

-- ============================================================
-- 15. COMMUNICATION
-- ============================================================

CREATE TABLE communication (
    id_communication BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_candidature BIGINT NOT NULL
        REFERENCES candidature(id_candidature)
        ON DELETE CASCADE,
    objet VARCHAR(255) NOT NULL,
    contenu TEXT,
    mode_envoi VARCHAR(10) NOT NULL DEFAULT 'manuel'
        CHECK (mode_envoi IN ('auto', 'manuel')),
    date_envoi TIMESTAMPTZ NOT NULL DEFAULT now(),
    id_utilisateur BIGINT
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE SET NULL,
    CONSTRAINT chk_communication_manuel
    CHECK (mode_envoi = 'auto' OR id_utilisateur IS NOT NULL)
);

CREATE INDEX idx_communication_candidature ON communication(id_candidature);

-- ============================================================
-- 16. TRIGGER : DATE DE MISE A JOUR (pour domaine)
-- ============================================================

CREATE OR REPLACE FUNCTION set_date_maj_domaine()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER domaine_set_date_maj
BEFORE UPDATE ON domaine
FOR EACH ROW
EXECUTE FUNCTION set_date_maj_domaine();

-- ============================================================
-- 17. TRIGGER : DATE DE MISE A JOUR (pour candidature)
-- ============================================================

CREATE OR REPLACE FUNCTION set_date_maj_candidature()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_maj := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidature_set_date_maj
BEFORE UPDATE ON candidature
FOR EACH ROW
EXECUTE FUNCTION set_date_maj_candidature();

-- ============================================================
-- 18. FONCTION POUR VALIDER UN DOMAINE
-- ============================================================

CREATE OR REPLACE FUNCTION valider_domaine(
    p_id_domaine BIGINT,
    p_id_utilisateur BIGINT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE domaine
    SET 
        valide = TRUE,
        date_validation = now(),
        valide_par = p_id_utilisateur
    WHERE 
        id_domaine = p_id_domaine
        AND valide = FALSE;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================