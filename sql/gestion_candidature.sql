-- ============================================================
-- SCRIPT COMPLET : GESTION DES CANDIDATURES
-- ============================================================

\c postgres

DROP DATABASE IF EXISTS gestion_candidature;

CREATE DATABASE gestion_candidature
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    TEMPLATE = template0;

\c gestion_candidature

SET client_encoding TO 'UTF8';

-- ============================================================
-- 1. DIRECTION
-- ============================================================

CREATE TABLE direction (
    id_direction BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_direction VARCHAR(150) NOT NULL UNIQUE
);

-- ============================================================
-- 2. UTILISATEUR (cree avant domaine car reference)
-- ============================================================

CREATE TABLE utilisateur (
    id_utilisateur BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL DEFAULT 'rh'
        CHECK (role IN ('rh', 'admin', 'manager')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. DOMAINE (avec colonne valide)
-- ============================================================

CREATE TABLE domaine (
    id_domaine BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_domaine VARCHAR(150) NOT NULL UNIQUE,
    id_direction BIGINT NOT NULL
        REFERENCES direction(id_direction)
        ON DELETE RESTRICT,
    valide BOOLEAN NOT NULL DEFAULT FALSE,
    date_validation TIMESTAMPTZ,
    valide_par BIGINT
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_domaine_direction ON domaine(id_direction);
CREATE INDEX idx_domaine_valide ON domaine(valide) WHERE valide = FALSE;

-- ============================================================
-- 4. TYPE DE DEMANDE
-- ============================================================

CREATE TABLE type_demande (
    id_type_demande BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO type_demande (libelle) VALUES
    ('Offre'),
    ('Spontanee');

-- ============================================================
-- 5. STATUT DE L'OFFRE
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
-- 6. OFFRE
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
-- 7. CANDIDAT
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
-- 8. COMPETENCE
-- ============================================================

CREATE TABLE competence (
    id_competence BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_competence VARCHAR(150) NOT NULL UNIQUE
);

-- ============================================================
-- 9. CANDIDAT_COMPETENCE
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
-- 10. STATUT DE CANDIDATURE
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
-- 19. DONNEES DE TEST
-- ============================================================

-- Insertion des directions
INSERT INTO direction (nom_direction) VALUES
    ('Informatique'),
    ('Ressources Humaines'),
    ('Finance'),
    ('Marketing'),
    ('Commercial');

-- Insertion des utilisateurs
INSERT INTO utilisateur (nom, email, role) VALUES
    ('Dupont Jean', 'jean.dupont@entreprise.com', 'admin'),
    ('Martin Sophie', 'sophie.martin@entreprise.com', 'rh'),
    ('Bernard Pierre', 'pierre.bernard@entreprise.com', 'manager'),
    ('Durand Marie', 'marie.durand@entreprise.com', 'rh'),
    ('Petit Luc', 'luc.petit@entreprise.com', 'manager');

-- Insertion des domaines (certains en attente de validation)
INSERT INTO domaine (nom_domaine, id_direction, valide) VALUES
    ('Developpement Web', 1, TRUE),
    ('Developpement Mobile', 1, TRUE),
    ('Base de Donnees', 1, FALSE),
    ('Recrutement', 2, TRUE),
    ('Formation', 2, FALSE),
    ('Comptabilite', 3, TRUE),
    ('Tresorerie', 3, FALSE),
    ('Communication Digitale', 4, TRUE),
    ('Relations Publiques', 4, FALSE),
    ('Ventes B2B', 5, TRUE);

-- Insertion des offres
INSERT INTO offre (titre_poste, id_direction, date_publication, date_limite, id_statut_offre) VALUES
    ('Developpeur Full Stack', 1, '2026-01-15', '2026-03-15', 2),
    ('Developpeur React Native', 1, '2026-02-01', '2026-04-01', 2),
    ('Data Engineer', 1, '2026-01-20', '2026-03-20', 2),
    ('Responsable Recrutement', 2, '2026-01-10', '2026-02-10', 3),
    ('Comptable', 3, '2026-02-01', '2026-04-01', 1),
    ('Chargé de Marketing Digital', 4, '2026-01-25', '2026-03-25', 2),
    ('Commercial Senior', 5, '2026-01-15', '2026-03-15', 2);

-- Insertion des competences
INSERT INTO competence (nom_competence) VALUES
    ('Java'),
    ('Python'),
    ('JavaScript'),
    ('React'),
    ('Node.js'),
    ('SQL'),
    ('MongoDB'),
    ('Docker'),
    ('Git'),
    ('Angular'),
    ('Vue.js'),
    ('Spring Boot'),
    ('Django'),
    ('Flask'),
    ('Recrutement'),
    ('Gestion de Projet'),
    ('Communication'),
    ('Negociation'),
    ('Finance'),
    ('Comptabilite');

-- Insertion des candidats
INSERT INTO candidat (nom, prenom, email, telephone, adresse, date_naissance) VALUES
    ('Dubois', 'Thomas', 'thomas.dubois@gmail.com', '0612345678', '12 rue de Paris, 75001 Paris', '1995-03-15'),
    ('Lambert', 'Emma', 'emma.lambert@gmail.com', '0623456789', '45 avenue des Lilas, 69000 Lyon', '1993-07-22'),
    ('Rousseau', 'Lucas', 'lucas.rousseau@gmail.com', '0634567890', '78 boulevard du Nord, 13000 Marseille', '1997-11-01'),
    ('Girard', 'Lea', 'lea.girard@gmail.com', '0645678901', '23 rue de la Mer, 33000 Bordeaux', '1994-05-18'),
    ('Vincent', 'Hugo', 'hugo.vincent@gmail.com', '0656789012', '56 avenue des Roses, 59000 Lille', '1996-09-30'),
    ('Roux', 'Chloe', 'chloe.roux@gmail.com', '0667890123', '34 rue de l''Eglise, 67000 Strasbourg', '1998-02-14'),
    ('Henry', 'Maxime', 'maxime.henry@gmail.com', '0678901234', '67 boulevard du Sud, 31000 Toulouse', '1995-08-25'),
    ('Marie', 'Camille', 'camille.marie@gmail.com', '0689012345', '89 avenue du Centre, 44000 Nantes', '1993-12-10'),
    ('Renaud', 'Juliette', 'juliette.renaud@gmail.com', '0690123456', '12 impasse des Fleurs, 06000 Nice', '1997-04-20'),
    ('Fontaine', 'Antoine', 'antoine.fontaine@gmail.com', '0601234567', '45 chemin des Oliviers, 34000 Montpellier', '1994-06-05');

-- Insertion des candidatures
INSERT INTO candidature (
    id_candidat, id_type_demande, id_offre, id_domaine, id_statut_candidature, 
    dans_vivier, poste_souhaite, message
) VALUES
    -- Candidatures sur offres
    (1, 1, 1, NULL, 2, FALSE, NULL, 'Je suis tres interesse par ce poste'),
    (2, 1, 1, NULL, 4, FALSE, NULL, NULL),
    (3, 1, 2, NULL, 2, FALSE, NULL, 'Experience en React Native'),
    (4, 1, 3, NULL, 1, FALSE, NULL, NULL),
    (5, 1, 4, NULL, 5, TRUE, NULL, '10 ans d''experience en recrutement'),
    (6, 1, 6, NULL, 3, FALSE, NULL, NULL),
    (7, 1, 7, NULL, 2, FALSE, NULL, 'Bon relationnel'),
    
    -- Candidatures spontanees
    (8, 2, NULL, 1, 1, FALSE, 'Developpeur Web', 'Candidature spontanee'),
    (9, 2, NULL, 4, 1, TRUE, 'Responsable RH', 'En recherche active'),
    (10, 2, NULL, 8, 1, FALSE, 'Charge de Marketing', NULL);

-- Insertion des competences des candidats
INSERT INTO candidat_competence (id_candidat, id_competence, niveau) VALUES
    (1, 3, 'Expert'),
    (1, 4, 'Expert'),
    (1, 2, 'Avance'),
    (2, 3, 'Avance'),
    (2, 4, 'Avance'),
    (2, 11, 'Intermediaire'),
    (3, 3, 'Expert'),
    (3, 4, 'Expert'),
    (3, 8, 'Avance'),
    (4, 5, 'Expert'),
    (4, 7, 'Avance'),
    (5, 15, 'Expert'),
    (5, 16, 'Avance'),
    (6, 17, 'Expert'),
    (6, 18, 'Avance'),
    (7, 18, 'Expert'),
    (7, 17, 'Avance'),
    (8, 3, 'Avance'),
    (8, 5, 'Intermediaire'),
    (9, 15, 'Avance'),
    (10, 17, 'Expert');

-- Insertion dans l'historique des statuts
INSERT INTO historique_statut (id_candidature, id_statut_candidature, commentaire, id_utilisateur) VALUES
    (1, 1, 'Candidature recue', 2),
    (1, 2, 'Preselectionnee', 2),
    (2, 1, 'Candidature recue', 2),
    (2, 4, 'Entretien prevu le 15/02', 3),
    (3, 1, 'Candidature recue', 2),
    (3, 2, 'Preselectionnee', 2),
    (4, 1, 'Candidature recue', 4),
    (5, 1, 'Candidature recue', 2),
    (5, 5, 'Recrutement accepte', 2),
    (6, 1, 'Candidature recue', 4),
    (6, 3, 'Test technique en ligne', 4),
    (7, 1, 'Candidature recue', 2),
    (7, 2, 'Preselectionnee', 2),
    (8, 1, 'Spontanee', 2),
    (9, 1, 'Spontanee', 4),
    (10, 1, 'Spontanee', 2);

-- ============================================================
-- 20. REQUETES DE VERIFICATION
-- ============================================================

-- Afficher les domaines en attente de validation
SELECT 'Domaines en attente de validation :' AS info;
SELECT d.id_domaine, d.nom_domaine, dir.nom_direction, d.created_at
FROM domaine d
JOIN direction dir ON d.id_direction = dir.id_direction
WHERE d.valide = FALSE;

-- Afficher les candidatures par statut
SELECT 'Candidatures par statut :' AS info;
SELECT sc.libelle, COUNT(*) AS nombre
FROM candidature c
JOIN statut_candidature sc ON c.id_statut_candidature = sc.id_statut_candidature
GROUP BY sc.libelle
ORDER BY sc.ordre_workflow;

-- Afficher les 5 derniers candidats
SELECT '5 derniers candidats :' AS info;
SELECT id_candidat, nom, prenom, email, created_at
FROM candidat
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================