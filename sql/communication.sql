
-- ============================================================
-- 15. TYPE_MESSAGE (referentiel)
-- ============================================================

CREATE TABLE type_message (
    id_type_message BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO type_message (libelle) VALUES
    ('Accuse de reception'),
    ('Convocation'),
    ('Demande information'),
    ('Demande document'),
    ('Issue recrutement'),
    ('Autre');   -- message libre, sans modele

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
    id_type_message BIGINT NOT NULL
        REFERENCES type_message(id_type_message)
        ON DELETE RESTRICT,

    -- Statut qui declenche l'envoi automatique de ce modele (pertinent seulement
    -- si envoi_automatique = TRUE). Ex : "Accuse de reception" -> statut "Recue".
    id_statut_candidature BIGINT
        REFERENCES statut_candidature(id_statut_candidature)
        ON DELETE SET NULL,

    nom_modele VARCHAR(150) NOT NULL,
    objet VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,              -- peut contenir des variables, ex: {{nom_candidat}}
    envoi_automatique BOOLEAN NOT NULL DEFAULT FALSE,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_modele_auto_necessite_statut CHECK (
        envoi_automatique = FALSE OR id_statut_candidature IS NOT NULL
    )
);

CREATE INDEX idx_modele_message_type ON modele_message(id_type_message);
CREATE INDEX idx_modele_message_statut ON modele_message(id_statut_candidature);

-- Un seul modele actif + automatique par statut : evite toute ambiguite sur
-- "quel modele envoyer" si l'automatisme est implemente plus tard.
CREATE UNIQUE INDEX idx_modele_unique_auto_par_statut
    ON modele_message(id_statut_candidature)
    WHERE envoi_automatique = TRUE AND actif = TRUE;

-- ============================================================
-- 17. COMMUNICATION
-- ============================================================
-- NB (pas de trigger) : id_type_message doit etre fourni explicitement par
-- l'application a l'insertion (deduit du modele choisi si il y en a un, ou
-- choisi manuellement — type "Autre" — pour un message libre). Pas de deduction
-- automatique ici puisqu'on n'utilise aucun trigger.

CREATE TABLE communication (
    id_communication BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_candidature BIGINT NOT NULL
        REFERENCES candidature(id_candidature)
        ON DELETE CASCADE,
    id_modele_message BIGINT
        REFERENCES modele_message(id_modele_message)
        ON DELETE SET NULL,
    id_type_message BIGINT NOT NULL
        REFERENCES type_message(id_type_message)
        ON DELETE RESTRICT,

    -- Copie figee du contenu reellement envoye (independante du modele,
    -- permet la personnalisation avant envoi sans jamais alterer l'historique)
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
CREATE INDEX idx_communication_type ON communication(id_type_message);
