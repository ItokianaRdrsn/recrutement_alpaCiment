CREATE TABLE type_rendez_vous (
    id_type_rendez_vous BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    libelle VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO type_rendez_vous (libelle)
VALUES
    ('Test'),
    ('Entretien');


-- ============================================================
-- 2. STATUT DU RENDEZ-VOUS
-- ============================================================

CREATE TABLE statut_rendez_vous (
    id_statut_rendez_vous BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    libelle VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO statut_rendez_vous (libelle)
VALUES
    ('A venir'),
    ('Realise'),
    ('Annule');


-- ============================================================
-- 3. MODE DE REALISATION
-- ============================================================

CREATE TABLE mode_realisation (
    id_mode_realisation BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    libelle VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO mode_realisation (libelle)
VALUES
    ('Presentiel'),
    ('Visioconference'),
    ('Telephone');


-- ============================================================
-- 4. RENDEZ-VOUS
-- ============================================================

CREATE TABLE rendez_vous (
    id_rendez_vous BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Candidature concernee
    id_candidature BIGINT NOT NULL
        REFERENCES candidature(id_candidature)
        ON DELETE CASCADE,

    -- Utilisateur responsable du test ou de l'entretien
    id_utilisateur BIGINT NOT NULL
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE RESTRICT,

    -- Test ou entretien
    id_type_rendez_vous BIGINT NOT NULL
        REFERENCES type_rendez_vous(id_type_rendez_vous)
        ON DELETE RESTRICT,

    -- A venir, Realise ou Annule
    id_statut_rendez_vous BIGINT NOT NULL
        REFERENCES statut_rendez_vous(id_statut_rendez_vous)
        ON DELETE RESTRICT,

    -- Presentiel, Visioconference ou Telephone
    id_mode_realisation BIGINT NOT NULL
        REFERENCES mode_realisation(id_mode_realisation)
        ON DELETE RESTRICT,

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
    CONSTRAINT chk_rendez_vous_dates
        CHECK (date_fin > date_debut)
);


-- ============================================================
-- 5. INDEX
-- ============================================================

CREATE INDEX idx_rendez_vous_candidature
    ON rendez_vous(id_candidature);

CREATE INDEX idx_rendez_vous_utilisateur
    ON rendez_vous(id_utilisateur);

CREATE INDEX idx_rendez_vous_type
    ON rendez_vous(id_type_rendez_vous);

CREATE INDEX idx_rendez_vous_statut
    ON rendez_vous(id_statut_rendez_vous);

CREATE INDEX idx_rendez_vous_mode
    ON rendez_vous(id_mode_realisation);

CREATE INDEX idx_rendez_vous_date_debut
    ON rendez_vous(date_debut);