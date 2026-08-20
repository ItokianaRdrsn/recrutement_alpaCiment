-- ============================================================
-- SCRIPT COMPLET : GESTION DES CANDIDATURES
-- ============================================================
\c postgres 
DROP DATABASE IF EXISTS gestion_recrutement;
CREATE DATABASE gestion_recrutement WITH OWNER = postgres ENCODING = 'UTF8' TEMPLATE = template0;
\c gestion_recrutement
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
    role VARCHAR(30) NOT NULL DEFAULT 'rh' CHECK (role IN ('rh', 'admin', 'manager')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ============================================================
-- 3. DOMAINE (avec colonne valide)
-- ============================================================
CREATE TABLE domaine (
    id_domaine BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_domaine VARCHAR(150) NOT NULL UNIQUE,
    id_direction BIGINT NOT NULL REFERENCES direction(id_direction) ON DELETE RESTRICT,
    valide BOOLEAN NOT NULL DEFAULT FALSE,
    date_validation TIMESTAMPTZ,
    valide_par BIGINT REFERENCES utilisateur(id_utilisateur) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_domaine_direction ON domaine(id_direction);
-- Plus besoin d'index séparé sur email : UNIQUE en crée un automatiquement
-- =================================================================

CREATE INDEX idx_domaine_valide ON domaine(valide)
WHERE valide = FALSE;
-- ============================================================
-- 4. TYPE DE DEMANDE
-- ============================================================
CREATE TABLE type_demande (
    id_type_demande BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO type_demande (libelle)
VALUES ('Offre'),
    ('Spontanee');
-- ============================================================
-- 5. STATUT DE L'OFFRE
-- ============================================================
CREATE TABLE statut_offre (
    id_statut_offre BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO statut_offre (libelle)
VALUES ('Brouillon'),
    ('Publiee'),
    ('Cloturee');
-- ============================================================
-- 6. OFFRE
-- ============================================================
CREATE TABLE offre (
    id_offre BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titre_poste VARCHAR(200) NOT NULL,
    id_direction BIGINT NOT NULL REFERENCES direction(id_direction) ON DELETE RESTRICT,
    description TEXT,
    lieu VARCHAR(200),
    type_contrat VARCHAR(50),
    date_publication DATE,
    date_limite DATE,
    id_statut_offre BIGINT NOT NULL REFERENCES statut_offre(id_statut_offre) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_offre_dates CHECK (
        date_limite IS NULL
        OR date_publication IS NULL
        OR date_limite >= date_publication
    )
);
CREATE INDEX idx_offre_direction ON offre(id_direction);
CREATE INDEX idx_offre_statut ON offre(id_statut_offre);
-- ============================================================
-- PROFIL RECHERCHE POUR UNE OFFRE
-- ============================================================
CREATE TABLE profil_offre (
    id_profil_offre BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_offre BIGINT NOT NULL UNIQUE REFERENCES offre(id_offre) ON DELETE CASCADE,
    description TEXT,
    experience_min_annees NUMERIC(4, 1),
    experience_max_annees NUMERIC(4, 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_profil_experience_min CHECK (
        experience_min_annees IS NULL
        OR experience_min_annees >= 0
    ),
    CONSTRAINT chk_profil_experience_max CHECK (
        experience_max_annees IS NULL
        OR experience_max_annees >= COALESCE(experience_min_annees, 0)
    )
);
CREATE INDEX idx_profil_offre_offre ON profil_offre(id_offre);
-- ============================================================
-- MISSIONS D'UNE OFFRE
-- ============================================================
CREATE TABLE mission (
    id_mission BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_offre BIGINT NOT NULL REFERENCES offre(id_offre) ON DELETE CASCADE,
    description TEXT NOT NULL,
    ordre INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_mission_ordre CHECK (ordre > 0)
);
CREATE INDEX idx_mission_offre ON mission(id_offre);
-- ============================================================
-- FORMATIONS REQUISES PAR LE PROFIL
-- ============================================================
CREATE TABLE profil_formation (
    id_profil_formation BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_profil_offre BIGINT NOT NULL REFERENCES profil_offre(id_profil_offre) ON DELETE CASCADE,
    niveau_min VARCHAR(50),
    niveau_max VARCHAR(50),
    domaine VARCHAR(150),
    obligatoire BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_profil_formation_niveau CHECK (
        niveau_min IS NOT NULL
        OR niveau_max IS NOT NULL
        OR domaine IS NOT NULL
    )
);
CREATE INDEX idx_profil_formation_profil ON profil_formation(id_profil_offre);
-- ============================================================
-- 7. CANDIDAT
-- ============================================================
CREATE TABLE candidat (
    id_candidat BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    -- unique : un candidat qui repostule est retrouvé par email, pas dupliqué
    telephone VARCHAR(30),
    adresse TEXT,
    date_naissance DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_candidat_nom ON candidat(nom);
-- Plus besoin d'index séparé sur email : UNIQUE en crée un automatiquement
-- ============================================
-- TABLE TYPE_COMPETENCE
-- ============================================

CREATE TABLE type_competence (
    id_type_competence SERIAL PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE
);

-- Données initiales
INSERT INTO type_competence (libelle) VALUES
('Technique'),
('Langue'),
('Logiciel'),
('Méthodologie'),
('Autre');


-- ============================================
-- TABLE COMPETENCE
-- ============================================

CREATE TABLE competence (
    id_competence SERIAL PRIMARY KEY,
    nom_competence VARCHAR(150) NOT NULL UNIQUE,
    id_type_competence INTEGER NOT NULL,

    CONSTRAINT fk_competence_type
        FOREIGN KEY (id_type_competence)
        REFERENCES type_competence(id_type_competence)
);
-- ============================================================
-- 8bis. MATCHING COMPETENCES : pg_trgm + COMPETENCE_ALIAS
-- ============================================================
-- pg_trgm : extension native Postgres pour le fuzzy matching (similarite par
-- trigrammes). Sert a retrouver une competence du referentiel meme si le texte
-- extrait d'un CV ne correspond pas exactement (ex: "reactjs" -> "React").
-- Pas un trigger, pas un modele entraine : une fonction/operateur SQL natif.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_competence_nom_trgm ON competence USING GIN (nom_competence gin_trgm_ops);
-- Exemple d'utilisation (a faire cote application) :
--   SELECT id_competence, nom_competence, similarity(nom_competence, 'reactjs') AS score
--   FROM competence
--   WHERE nom_competence % 'reactjs'
--   ORDER BY score DESC
--   LIMIT 1;
-- COMPETENCE_ALIAS : memorise les rattachements deja valides par un RH, pour
-- que la prochaine occurrence du meme texte brut soit matchee instantanement
-- et de facon fiable (sans repasser par le fuzzy matching).
CREATE TABLE competence_alias (
    id_alias BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    texte_brut VARCHAR(150) NOT NULL UNIQUE,
    -- texte normalise (minuscules, sans accents)
    id_competence BIGINT NOT NULL REFERENCES competence(id_competence) ON DELETE CASCADE,
    id_utilisateur BIGINT REFERENCES utilisateur(id_utilisateur) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_competence_alias_competence ON competence_alias(id_competence);
-- ============================================================
-- 9. PROFIL_COMPETENCE
-- ============================================================
-- NB : candidat_competence, experience_professionnelle et formation sont
-- definies plus loin (apres DOCUMENT), car elles referencent document(id_document)
-- pour tracer le CV source d'une extraction automatique.
CREATE TABLE profil_competence (
    id_offre BIGINT NOT NULL REFERENCES offre(id_offre) ON DELETE CASCADE,
    id_competence BIGINT NOT NULL REFERENCES competence(id_competence) ON DELETE CASCADE,
    niveau_requis VARCHAR(30),
    PRIMARY KEY (id_offre, id_competence)
);
-- ============================================================
-- 10. STATUT DE CANDIDATURE
-- ============================================================
CREATE TABLE statut_candidature (
    id_statut_candidature BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE,
    ordre_workflow INTEGER NOT NULL DEFAULT 0
);
INSERT INTO statut_candidature (libelle, ordre_workflow)
VALUES ('Recue', 1),
    ('Preselectionnee', 2),
    ('Test', 3),
    ('Entretien', 4),
    ('Retenue', 5),
    ('Non retenue', 6);
-- ============================================================
-- 11. CANDIDATURE
-- ============================================================
-- NB (pas de trigger) : la coherence "type=Offre => id_offre rempli / id_domaine NULL"
-- (et inversement pour Spontanee) N'EST PLUS VERIFIEE PAR LA BASE. C'est a l'application
-- de garantir cette regle a l'insertion/modification d'une candidature.
CREATE TABLE candidature (
    id_candidature BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_candidat BIGINT NOT NULL REFERENCES candidat(id_candidat) ON DELETE CASCADE,
    id_type_demande BIGINT NOT NULL REFERENCES type_demande(id_type_demande) ON DELETE RESTRICT,
    id_offre BIGINT REFERENCES offre(id_offre) ON DELETE RESTRICT,
    id_domaine BIGINT REFERENCES domaine(id_domaine) ON DELETE RESTRICT,
    id_statut_candidature BIGINT NOT NULL REFERENCES statut_candidature(id_statut_candidature) ON DELETE RESTRICT,
    dans_vivier BOOLEAN NOT NULL DEFAULT FALSE,
    poste_souhaite VARCHAR(200),
    message TEXT,
    -- D'ou vient ce depot : import du site externe, ou saisie manuelle par un RH
    canal_depot VARCHAR(20) NOT NULL DEFAULT 'site_externe' CHECK (canal_depot IN ('site_externe', 'rh_manuel')),
    -- Rempli uniquement si canal_depot = 'rh_manuel' : qui a saisi la candidature
    id_utilisateur_depot BIGINT REFERENCES utilisateur(id_utilisateur) ON DELETE
    SET NULL,
        date_candidature TIMESTAMPTZ NOT NULL DEFAULT now(),
        date_maj TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_candidature_canal CHECK (
            canal_depot = 'site_externe'
            OR id_utilisateur_depot IS NOT NULL
        )
);
CREATE INDEX idx_candidature_candidat ON candidature(id_candidat);
CREATE INDEX idx_candidature_offre ON candidature(id_offre);
CREATE INDEX idx_candidature_domaine ON candidature(id_domaine);
CREATE INDEX idx_candidature_type_demande ON candidature(id_type_demande);
CREATE INDEX idx_candidature_statut ON candidature(id_statut_candidature);
CREATE INDEX idx_candidature_vivier ON candidature(dans_vivier)
WHERE dans_vivier = TRUE;
CREATE INDEX idx_candidature_canal ON candidature(canal_depot);
-- ============================================================
-- 12. HISTORIQUE DES STATUTS
-- ============================================================
CREATE TABLE historique_statut (
    id_historique BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_candidature BIGINT NOT NULL REFERENCES candidature(id_candidature) ON DELETE CASCADE,
    id_statut_candidature BIGINT NOT NULL REFERENCES statut_candidature(id_statut_candidature) ON DELETE RESTRICT,
    date_changement TIMESTAMPTZ NOT NULL DEFAULT now(),
    commentaire TEXT,
    id_utilisateur BIGINT REFERENCES utilisateur(id_utilisateur) ON DELETE
    SET NULL
);
CREATE INDEX idx_historique_candidature ON historique_statut(id_candidature);
-- ============================================================
-- 13. DOCUMENT
-- ============================================================
-- NB : contenu_texte_extrait et recherche_texte ne sont PAS remplis par un trigger.
-- recherche_texte est une colonne "generated" (calcul natif PostgreSQL, pas de
-- trigger PL/pgSQL, pas de logique metier) — a valider avec toi si tu preferes
-- que meme ce calcul reste cote application plutot qu'en base.
CREATE TABLE document (
    id_document BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_candidature BIGINT NOT NULL REFERENCES candidature(id_candidature) ON DELETE CASCADE,
    type_document VARCHAR(50) NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier TEXT NOT NULL,
    mime_type VARCHAR(100),
    taille_octets BIGINT,
    -- Comment le document est entre dans le systeme
    mode_acquisition VARCHAR(20) NOT NULL DEFAULT 'fichier' CHECK (mode_acquisition IN ('fichier', 'photo_ocr')),
    -- Texte extrait (OCR sur photo/scan, ou extraction directe si PDF natif) —
    -- alimente la recherche full-text et le pipeline de matching (competences,
    -- experiences, formation) discute plus tot
    contenu_texte_extrait TEXT,
    recherche_texte tsvector GENERATED ALWAYS AS (
        to_tsvector('french', coalesce(contenu_texte_extrait, ''))
    ) STORED,
    date_upload TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_document_candidature ON document(id_candidature);
CREATE INDEX idx_document_recherche_texte ON document USING GIN (recherche_texte);
-- ============================================================
-- 13bis. CANDIDAT_COMPETENCE
-- ============================================================
-- NB : source/score_confiance/valide suivent le meme pattern que domaine.valide.
-- valide = FALSE par defaut : une competence extraite d'un CV n'est utilisable
-- pour le matching qu'apres validation RH. Placee ici (apres DOCUMENT) car elle
-- reference document(id_document) pour tracer le CV source d'une extraction.
CREATE TABLE candidat_competence (
    id_candidat BIGINT NOT NULL REFERENCES candidat(id_candidat) ON DELETE CASCADE,
    id_competence BIGINT NOT NULL REFERENCES competence(id_competence) ON DELETE CASCADE,
    niveau VARCHAR(30),
    source VARCHAR(20) NOT NULL DEFAULT 'manuel' CHECK (source IN ('manuel', 'cv_ocr')),
    score_confiance NUMERIC(4, 3),
    -- 0 a 1, pertinent si source = 'cv_ocr'
    id_document BIGINT REFERENCES document(id_document) ON DELETE
    SET NULL,
        -- CV source si extrait automatiquement
        valide BOOLEAN NOT NULL DEFAULT FALSE,
        date_validation TIMESTAMPTZ,
        valide_par BIGINT REFERENCES utilisateur(id_utilisateur) ON DELETE
    SET NULL,
        PRIMARY KEY (id_candidat, id_competence),
        CONSTRAINT chk_candidat_competence_validation CHECK (
            valide = FALSE
            OR (
                valide_par IS NOT NULL
                AND date_validation IS NOT NULL
            )
        )
);
-- ============================================================
-- 13ter. EXPERIENCE_PROFESSIONNELLE
-- ============================================================
CREATE TABLE experience_professionnelle (
    id_experience BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_candidat BIGINT NOT NULL REFERENCES candidat(id_candidat) ON DELETE CASCADE,
    poste VARCHAR(200) NOT NULL,
    entreprise VARCHAR(200),
    date_debut DATE,
    date_fin DATE,
    -- NULL si poste actuel
    poste_actuel BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    source VARCHAR(20) NOT NULL DEFAULT 'manuel' CHECK (source IN ('manuel', 'cv_ocr')),
    score_confiance NUMERIC(4, 3),
    id_document BIGINT REFERENCES document(id_document) ON DELETE
    SET NULL,
        valide BOOLEAN NOT NULL DEFAULT FALSE,
        date_validation TIMESTAMPTZ,
        valide_par BIGINT REFERENCES utilisateur(id_utilisateur) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_experience_dates CHECK (
            date_fin IS NULL
            OR date_debut IS NULL
            OR date_fin >= date_debut
        ),
        CONSTRAINT chk_experience_validation CHECK (
            valide = FALSE
            OR (
                valide_par IS NOT NULL
                AND date_validation IS NOT NULL
            )
        )
);
CREATE INDEX idx_experience_candidat ON experience_professionnelle(id_candidat);
-- ============================================================
-- 13quater. FORMATION
-- ============================================================
CREATE TABLE formation (
    id_formation BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_candidat BIGINT NOT NULL REFERENCES candidat(id_candidat) ON DELETE CASCADE,
    diplome VARCHAR(200) NOT NULL,
    etablissement VARCHAR(200),
    domaine_etude VARCHAR(150),
    niveau VARCHAR(50),
    -- ex: Bac+3, Bac+5, Doctorat...
    date_obtention DATE,
    source VARCHAR(20) NOT NULL DEFAULT 'manuel' CHECK (source IN ('manuel', 'cv_ocr')),
    score_confiance NUMERIC(4, 3),
    id_document BIGINT REFERENCES document(id_document) ON DELETE
    SET NULL,
        valide BOOLEAN NOT NULL DEFAULT FALSE,
        date_validation TIMESTAMPTZ,
        valide_par BIGINT REFERENCES utilisateur(id_utilisateur) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_formation_validation CHECK (
            valide = FALSE
            OR (
                valide_par IS NOT NULL
                AND date_validation IS NOT NULL
            )
        )
);
CREATE INDEX idx_formation_candidat ON formation(id_candidat);
-- ============================================================
-- 14. RENDEZ-VOUS (test / entretien)
-- ============================================================
CREATE TABLE type_rendez_vous (
    id_type_rendez_vous BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO type_rendez_vous (libelle)
VALUES ('Test'),
    ('Entretien');
CREATE TABLE statut_rendez_vous (
    id_statut_rendez_vous BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO statut_rendez_vous (libelle)
VALUES ('A venir'),
    ('Realise'),
    ('Annule');
CREATE TABLE mode_realisation (
    id_mode_realisation BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO mode_realisation (libelle)
VALUES ('Presentiel'),
    ('Visioconference'),
    ('Telephone');
CREATE TABLE rendez_vous (
    id_rendez_vous BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Candidature concernee
    id_candidature BIGINT NOT NULL REFERENCES candidature(id_candidature) ON DELETE CASCADE,
    -- Utilisateur responsable du test ou de l'entretien
    id_utilisateur BIGINT NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE RESTRICT,
    -- Test ou entretien
    id_type_rendez_vous BIGINT NOT NULL REFERENCES type_rendez_vous(id_type_rendez_vous) ON DELETE RESTRICT,
    -- A venir, Realise ou Annule
    id_statut_rendez_vous BIGINT NOT NULL REFERENCES statut_rendez_vous(id_statut_rendez_vous) ON DELETE RESTRICT,
    -- Presentiel, Visioconference ou Telephone
    id_mode_realisation BIGINT NOT NULL REFERENCES mode_realisation(id_mode_realisation) ON DELETE RESTRICT,
    -- Date et heure completes
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP NOT NULL,
    -- Salle, adresse, lien de visioconference,
    -- numero de telephone, etc.
    details_lieu TEXT,
    -- Informations supplementaires
    commentaire TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- La date de fin doit etre apres la date de debut
    CONSTRAINT chk_rendez_vous_dates CHECK (date_fin > date_debut)
);
CREATE INDEX idx_rendez_vous_candidature ON rendez_vous(id_candidature);
CREATE INDEX idx_rendez_vous_utilisateur ON rendez_vous(id_utilisateur);
CREATE INDEX idx_rendez_vous_type ON rendez_vous(id_type_rendez_vous);
CREATE INDEX idx_rendez_vous_statut ON rendez_vous(id_statut_rendez_vous);
CREATE INDEX idx_rendez_vous_mode ON rendez_vous(id_mode_realisation);
CREATE INDEX idx_rendez_vous_date_debut ON rendez_vous(date_debut);
-- ============================================================
-- 15. TYPE_MESSAGE (referentiel)
-- ============================================================
CREATE TABLE type_message (
    id_type_message BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE
);
INSERT INTO type_message (libelle)
VALUES ('Accuse de reception'),
    ('Convocation'),
    ('Demande information'),
    ('Demande document'),
    ('Issue recrutement'),
    ('Autre');
-- message libre, sans modele
-- ============================================================
-- 16. MODELE_MESSAGE
-- ============================================================
-- NB (pas de trigger) : envoi_automatique=TRUE sans id_statut_candidature est bloque
-- par CHECK (pas besoin de trigger, id_statut_candidature est une colonne de cette
-- meme table). En revanche, le DECLENCHEMENT reel de l'envoi automatique (au moment
-- ou une candidature change de statut) n'est fait par aucun trigger : a gerer cote
-- application pour l'instant.
CREATE TABLE modele_message (
    id_modele_message BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_type_message BIGINT NOT NULL REFERENCES type_message(id_type_message) ON DELETE RESTRICT,
    -- Statut qui declenche l'envoi automatique de ce modele (pertinent seulement
    -- si envoi_automatique = TRUE). Ex : "Accuse de reception" -> statut "Recue".
    id_statut_candidature BIGINT REFERENCES statut_candidature(id_statut_candidature) ON DELETE
    SET NULL,
        nom_modele VARCHAR(150) NOT NULL,
        objet VARCHAR(255) NOT NULL,
        contenu TEXT NOT NULL,
        -- peut contenir des variables, ex: {{nom_candidat}}
        envoi_automatique BOOLEAN NOT NULL DEFAULT FALSE,
        actif BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_modele_auto_necessite_statut CHECK (
            envoi_automatique = FALSE
            OR id_statut_candidature IS NOT NULL
        )
);
CREATE INDEX idx_modele_message_type ON modele_message(id_type_message);
CREATE INDEX idx_modele_message_statut ON modele_message(id_statut_candidature);
-- Un seul modele actif + automatique par statut : evite toute ambiguite sur
-- "quel modele envoyer" si l'automatisme est implemente plus tard.
CREATE UNIQUE INDEX idx_modele_unique_auto_par_statut ON modele_message(id_statut_candidature)
WHERE envoi_automatique = TRUE
    AND actif = TRUE;
-- ============================================================
-- 17. COMMUNICATION
-- ============================================================
-- NB (pas de trigger) : id_type_message doit etre fourni explicitement par
-- l'application a l'insertion (deduit du modele choisi si il y en a un, ou
-- choisi manuellement — type "Autre" — pour un message libre). Pas de deduction
-- automatique ici puisqu'on n'utilise aucun trigger.
CREATE TABLE communication (
    id_communication BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_candidature BIGINT NOT NULL REFERENCES candidature(id_candidature) ON DELETE CASCADE,
    id_modele_message BIGINT REFERENCES modele_message(id_modele_message) ON DELETE
    SET NULL,
        id_type_message BIGINT NOT NULL REFERENCES type_message(id_type_message) ON DELETE RESTRICT,
        -- Copie figee du contenu reellement envoye (independante du modele,
        -- permet la personnalisation avant envoi sans jamais alterer l'historique)
        objet VARCHAR(255) NOT NULL,
        contenu TEXT,
        mode_envoi VARCHAR(10) NOT NULL DEFAULT 'manuel' CHECK (mode_envoi IN ('auto', 'manuel')),
        date_envoi TIMESTAMPTZ NOT NULL DEFAULT now(),
        id_utilisateur BIGINT REFERENCES utilisateur(id_utilisateur) ON DELETE
    SET NULL,
        CONSTRAINT chk_communication_manuel CHECK (
            mode_envoi = 'auto'
            OR id_utilisateur IS NOT NULL
        )
);
CREATE INDEX idx_communication_candidature ON communication(id_candidature);
CREATE INDEX idx_communication_type ON communication(id_type_message);
-- ============================================================
-- 18. FONCTION POUR VALIDER UN DOMAINE
-- ============================================================
-- NB : ce n'est PAS un trigger — une fonction appelee explicitement par
-- l'application (SELECT valider_domaine(...)), rien d'automatique.
CREATE OR REPLACE FUNCTION valider_domaine(
        p_id_domaine BIGINT,
        p_id_utilisateur BIGINT
    ) RETURNS BOOLEAN AS $$ BEGIN
UPDATE domaine
SET valide = TRUE,
    date_validation = now(),
    valide_par = p_id_utilisateur,
    updated_at = now()
WHERE id_domaine = p_id_domaine
    AND valide = FALSE;
IF FOUND THEN RETURN TRUE;
ELSE RETURN FALSE;
END IF;
END;
$$ LANGUAGE plpgsql;
-- ============================================================
-- 19. DONNEES DE TEST
-- ============================================================
-- Insertion des directions
INSERT INTO direction (nom_direction)
VALUES ('Informatique'),
    ('Ressources Humaines'),
    ('Finance'),
    ('Marketing'),
    ('Commercial');
-- Insertion des utilisateurs
INSERT INTO utilisateur (nom, email, role)
VALUES (
        'Dupont Jean',
        'jean.dupont@entreprise.com',
        'admin'
    ),
    (
        'Martin Sophie',
        'sophie.martin@entreprise.com',
        'rh'
    ),
    (
        'Bernard Pierre',
        'pierre.bernard@entreprise.com',
        'manager'
    ),
    (
        'Durand Marie',
        'marie.durand@entreprise.com',
        'rh'
    ),
    (
        'Petit Luc',
        'luc.petit@entreprise.com',
        'manager'
    );
-- Insertion des domaines (certains en attente de validation)
INSERT INTO domaine (nom_domaine, id_direction, valide)
VALUES ('Developpement Web', 1, TRUE),
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
INSERT INTO offre (
        titre_poste,
        id_direction,
        date_publication,
        date_limite,
        id_statut_offre
    )
VALUES (
        'Developpeur Full Stack',
        1,
        '2026-01-15',
        '2026-03-15',
        2
    ),
    (
        'Developpeur React Native',
        1,
        '2026-02-01',
        '2026-04-01',
        2
    ),
    (
        'Data Engineer',
        1,
        '2026-01-20',
        '2026-03-20',
        2
    ),
    (
        'Responsable Recrutement',
        2,
        '2026-01-10',
        '2026-02-10',
        3
    ),
    ('Comptable', 3, '2026-02-01', '2026-04-01', 1),
    (
        'Chargé de Marketing Digital',
        4,
        '2026-01-25',
        '2026-03-25',
        2
    ),
    (
        'Commercial Senior',
        5,
        '2026-01-15',
        '2026-03-15',
        2
    );
-- Insertion des competences
INSERT INTO competence (nom_competence)
VALUES ('Java'),
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
INSERT INTO candidat (
        nom,
        prenom,
        email,
        telephone,
        adresse,
        date_naissance
    )
VALUES (
        'Dubois',
        'Thomas',
        'thomas.dubois@gmail.com',
        '0612345678',
        '12 rue de Paris, 75001 Paris',
        '1995-03-15'
    ),
    (
        'Lambert',
        'Emma',
        'emma.lambert@gmail.com',
        '0623456789',
        '45 avenue des Lilas, 69000 Lyon',
        '1993-07-22'
    ),
    (
        'Rousseau',
        'Lucas',
        'lucas.rousseau@gmail.com',
        '0634567890',
        '78 boulevard du Nord, 13000 Marseille',
        '1997-11-01'
    ),
    (
        'Girard',
        'Lea',
        'lea.girard@gmail.com',
        '0645678901',
        '23 rue de la Mer, 33000 Bordeaux',
        '1994-05-18'
    ),
    (
        'Vincent',
        'Hugo',
        'hugo.vincent@gmail.com',
        '0656789012',
        '56 avenue des Roses, 59000 Lille',
        '1996-09-30'
    ),
    (
        'Roux',
        'Chloe',
        'chloe.roux@gmail.com',
        '0667890123',
        '34 rue de l''Eglise, 67000 Strasbourg',
        '1998-02-14'
    ),
    (
        'Henry',
        'Maxime',
        'maxime.henry@gmail.com',
        '0678901234',
        '67 boulevard du Sud, 31000 Toulouse',
        '1995-08-25'
    ),
    (
        'Marie',
        'Camille',
        'camille.marie@gmail.com',
        '0689012345',
        '89 avenue du Centre, 44000 Nantes',
        '1993-12-10'
    ),
    (
        'Renaud',
        'Juliette',
        'juliette.renaud@gmail.com',
        '0690123456',
        '12 impasse des Fleurs, 06000 Nice',
        '1997-04-20'
    ),
    (
        'Fontaine',
        'Antoine',
        'antoine.fontaine@gmail.com',
        '0601234567',
        '45 chemin des Oliviers, 34000 Montpellier',
        '1994-06-05'
    );
-- Insertion des candidatures
INSERT INTO candidature (
        id_candidat,
        id_type_demande,
        id_offre,
        id_domaine,
        id_statut_candidature,
        dans_vivier,
        poste_souhaite,
        message
    )
VALUES -- Candidatures sur offres
    (
        1,
        1,
        1,
        NULL,
        2,
        FALSE,
        NULL,
        'Je suis tres interesse par ce poste'
    ),
    (2, 1, 1, NULL, 4, FALSE, NULL, NULL),
    (
        3,
        1,
        2,
        NULL,
        2,
        FALSE,
        NULL,
        'Experience en React Native'
    ),
    (4, 1, 3, NULL, 1, FALSE, NULL, NULL),
    (
        5,
        1,
        4,
        NULL,
        5,
        TRUE,
        NULL,
        '10 ans d''experience en recrutement'
    ),
    (6, 1, 6, NULL, 3, FALSE, NULL, NULL),
    (7, 1, 7, NULL, 2, FALSE, NULL, 'Bon relationnel'),
    -- Candidatures spontanees
    (
        8,
        2,
        NULL,
        1,
        1,
        FALSE,
        'Developpeur Web',
        'Candidature spontanee'
    ),
    (
        9,
        2,
        NULL,
        4,
        1,
        TRUE,
        'Responsable RH',
        'En recherche active'
    ),
    (
        10,
        2,
        NULL,
        8,
        1,
        FALSE,
        'Charge de Marketing',
        NULL
    );
-- Insertion des competences des candidats
INSERT INTO candidat_competence (id_candidat, id_competence, niveau)
VALUES (1, 3, 'Expert'),
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
INSERT INTO historique_statut (
        id_candidature,
        id_statut_candidature,
        commentaire,
        id_utilisateur
    )
VALUES (1, 1, 'Candidature recue', 2),
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
SELECT d.id_domaine,
    d.nom_domaine,
    dir.nom_direction,
    d.created_at
FROM domaine d
    JOIN direction dir ON d.id_direction = dir.id_direction
WHERE d.valide = FALSE;
-- Afficher les candidatures par statut
SELECT 'Candidatures par statut :' AS info;
SELECT sc.libelle,
       COUNT(*) AS nombre
FROM candidature c
JOIN statut_candidature sc
    ON c.id_statut_candidature = sc.id_statut_candidature
GROUP BY sc.libelle, sc.ordre_workflow
ORDER BY sc.ordre_workflow;
-- Afficher les 5 derniers candidats
SELECT '5 derniers candidats :' AS info;
SELECT id_candidat,
    nom,
    prenom,
    email,
    created_at
FROM candidat
ORDER BY created_at DESC
LIMIT 5;
-- ============================================================
-- 21. VUES POUR LE TABLEAU DE BORD
-- ============================================================
-- Ce sont des VUES (requetes sauvegardees), pas des triggers : rien n'est
-- precalcule ni ecrit automatiquement, tout est recalcule a chaque lecture.
-- Les 3 compteurs "haut de page"
CREATE VIEW vue_dashboard_kpis AS
SELECT (
        SELECT COUNT(*)
        FROM candidature c
            JOIN type_demande td ON td.id_type_demande = c.id_type_demande
        WHERE td.libelle = 'Offre'
    ) AS candidatures_sur_offre,
    (
        SELECT COUNT(*)
        FROM offre o
            JOIN statut_offre so ON so.id_statut_offre = o.id_statut_offre
        WHERE so.libelle = 'Publiee'
    ) AS offres_en_cours,
    (
        SELECT COUNT(*)
        FROM candidature c
            JOIN type_demande td ON td.id_type_demande = c.id_type_demande
        WHERE td.libelle = 'Spontanee'
    ) AS candidatures_spontanees;
-- Statistiques mensuelles (1/4) : tendance du nombre de candidatures par mois
CREATE VIEW vue_stats_candidatures_par_mois AS
SELECT date_trunc('month', date_candidature)::date AS mois,
    COUNT(*) AS nombre_candidatures
FROM candidature
GROUP BY 1
ORDER BY 1;
-- Statistiques mensuelles (2/4) : repartition par statut sur le mois en cours
CREATE VIEW vue_stats_repartition_statut_mois_courant AS
SELECT sc.libelle AS statut,
    sc.ordre_workflow,
    COUNT(*) AS nombre
FROM candidature c
    JOIN statut_candidature sc ON sc.id_statut_candidature = c.id_statut_candidature
WHERE date_trunc('month', c.date_candidature) = date_trunc('month', CURRENT_DATE)
GROUP BY sc.libelle,
    sc.ordre_workflow
ORDER BY sc.ordre_workflow;
-- Statistiques mensuelles (3/4) : taux de transformation (retenues / total) par mois
CREATE VIEW vue_stats_taux_transformation_mensuel AS
SELECT date_trunc('month', c.date_candidature)::date AS mois,
    COUNT(*) AS total_candidatures,
    COUNT(*) FILTER (
        WHERE sc.libelle = 'Retenue'
    ) AS candidatures_retenues,
    ROUND(
        COUNT(*) FILTER (
            WHERE sc.libelle = 'Retenue'
        )::numeric / NULLIF(COUNT(*), 0) * 100,
        2
    ) AS taux_transformation_pct
FROM candidature c
    JOIN statut_candidature sc ON sc.id_statut_candidature = c.id_statut_candidature
GROUP BY 1
ORDER BY 1;
-- Statistiques mensuelles (4/4) : delai moyen de traitement (Recue -> statut final)
CREATE VIEW vue_stats_delai_traitement AS WITH premiere_reception AS (
    SELECT hs.id_candidature,
        MIN(hs.date_changement) AS date_reception
    FROM historique_statut hs
        JOIN statut_candidature sc ON sc.id_statut_candidature = hs.id_statut_candidature
    WHERE sc.libelle = 'Recue'
    GROUP BY hs.id_candidature
),
statut_final AS (
    SELECT hs.id_candidature,
        MIN(hs.date_changement) AS date_decision
    FROM historique_statut hs
        JOIN statut_candidature sc ON sc.id_statut_candidature = hs.id_statut_candidature
    WHERE sc.libelle IN ('Retenue', 'Non retenue')
    GROUP BY hs.id_candidature
)
SELECT date_trunc('month', pr.date_reception)::date AS mois,
    ROUND(
        AVG(
            EXTRACT(
                EPOCH
                FROM (sf.date_decision - pr.date_reception)
            ) / 86400
        )::numeric,
        1
    ) AS delai_moyen_jours,
    COUNT(*) AS nombre_candidatures_terminees
FROM premiere_reception pr
    JOIN statut_final sf ON sf.id_candidature = pr.id_candidature
GROUP BY 1
ORDER BY 1;
-- ============================================================
-- FIN DU SCRIPT
-- ============================================================