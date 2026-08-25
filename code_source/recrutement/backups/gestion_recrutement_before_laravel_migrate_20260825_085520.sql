--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: valider_domaine(bigint, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.valider_domaine(p_id_domaine bigint, p_id_utilisateur bigint) RETURNS boolean
    LANGUAGE plpgsql
    AS $$ BEGIN
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
$$;


ALTER FUNCTION public.valider_domaine(p_id_domaine bigint, p_id_utilisateur bigint) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache OWNER TO postgres;

--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache_locks OWNER TO postgres;

--
-- Name: candidat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidat (
    id_candidat bigint NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(200) NOT NULL,
    telephone character varying(30),
    adresse text,
    date_naissance date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.candidat OWNER TO postgres;

--
-- Name: candidat_competence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidat_competence (
    id_candidat bigint NOT NULL,
    id_competence bigint NOT NULL,
    niveau character varying(30),
    source character varying(20) DEFAULT 'manuel'::character varying NOT NULL,
    score_confiance numeric(4,3),
    id_document bigint,
    valide boolean DEFAULT false NOT NULL,
    date_validation timestamp with time zone,
    valide_par bigint,
    CONSTRAINT candidat_competence_source_check CHECK (((source)::text = ANY ((ARRAY['manuel'::character varying, 'cv_ocr'::character varying])::text[]))),
    CONSTRAINT chk_candidat_competence_validation CHECK (((valide = false) OR ((valide_par IS NOT NULL) AND (date_validation IS NOT NULL))))
);


ALTER TABLE public.candidat_competence OWNER TO postgres;

--
-- Name: candidat_id_candidat_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.candidat ALTER COLUMN id_candidat ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.candidat_id_candidat_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: candidature; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidature (
    id_candidature bigint NOT NULL,
    id_candidat bigint NOT NULL,
    id_type_demande bigint NOT NULL,
    id_offre bigint,
    id_domaine bigint,
    id_statut_candidature bigint NOT NULL,
    dans_vivier boolean DEFAULT false NOT NULL,
    poste_souhaite character varying(200),
    message text,
    canal_depot character varying(20) DEFAULT 'site_externe'::character varying NOT NULL,
    id_utilisateur_depot bigint,
    date_candidature timestamp with time zone DEFAULT now() NOT NULL,
    date_maj timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT candidature_canal_depot_check CHECK (((canal_depot)::text = ANY ((ARRAY['site_externe'::character varying, 'rh_manuel'::character varying])::text[]))),
    CONSTRAINT chk_candidature_canal CHECK ((((canal_depot)::text = 'site_externe'::text) OR (id_utilisateur_depot IS NOT NULL)))
);


ALTER TABLE public.candidature OWNER TO postgres;

--
-- Name: candidature_id_candidature_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.candidature ALTER COLUMN id_candidature ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.candidature_id_candidature_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: communication; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communication (
    id_communication bigint NOT NULL,
    id_candidature bigint NOT NULL,
    id_modele_message bigint,
    id_type_message bigint NOT NULL,
    objet character varying(255) NOT NULL,
    contenu text,
    mode_envoi character varying(10) DEFAULT 'manuel'::character varying NOT NULL,
    date_envoi timestamp with time zone DEFAULT now() NOT NULL,
    id_utilisateur bigint,
    CONSTRAINT chk_communication_manuel CHECK ((((mode_envoi)::text = 'auto'::text) OR (id_utilisateur IS NOT NULL))),
    CONSTRAINT communication_mode_envoi_check CHECK (((mode_envoi)::text = ANY ((ARRAY['auto'::character varying, 'manuel'::character varying])::text[])))
);


ALTER TABLE public.communication OWNER TO postgres;

--
-- Name: communication_id_communication_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.communication ALTER COLUMN id_communication ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.communication_id_communication_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: competence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competence (
    id_competence integer NOT NULL,
    nom_competence character varying(150) NOT NULL,
    id_type_competence integer NOT NULL
);


ALTER TABLE public.competence OWNER TO postgres;

--
-- Name: competence_alias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competence_alias (
    id_alias bigint NOT NULL,
    texte_brut character varying(150) NOT NULL,
    id_competence bigint NOT NULL,
    id_utilisateur bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.competence_alias OWNER TO postgres;

--
-- Name: competence_alias_id_alias_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.competence_alias ALTER COLUMN id_alias ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.competence_alias_id_alias_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: competence_id_competence_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.competence_id_competence_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.competence_id_competence_seq OWNER TO postgres;

--
-- Name: competence_id_competence_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.competence_id_competence_seq OWNED BY public.competence.id_competence;


--
-- Name: direction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.direction (
    id_direction bigint NOT NULL,
    nom_direction character varying(150) NOT NULL
);


ALTER TABLE public.direction OWNER TO postgres;

--
-- Name: direction_id_direction_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.direction ALTER COLUMN id_direction ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.direction_id_direction_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: document; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document (
    id_document bigint NOT NULL,
    id_candidature bigint NOT NULL,
    type_document character varying(50) NOT NULL,
    nom_fichier character varying(255) NOT NULL,
    chemin_fichier text NOT NULL,
    mime_type character varying(100),
    taille_octets bigint,
    mode_acquisition character varying(20) DEFAULT 'fichier'::character varying NOT NULL,
    contenu_texte_extrait text,
    recherche_texte tsvector GENERATED ALWAYS AS (to_tsvector('french'::regconfig, COALESCE(contenu_texte_extrait, ''::text))) STORED,
    date_upload timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT document_mode_acquisition_check CHECK (((mode_acquisition)::text = ANY ((ARRAY['fichier'::character varying, 'photo_ocr'::character varying])::text[])))
);


ALTER TABLE public.document OWNER TO postgres;

--
-- Name: document_id_document_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.document ALTER COLUMN id_document ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.document_id_document_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: domaine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.domaine (
    id_domaine bigint NOT NULL,
    nom_domaine character varying(150) NOT NULL,
    id_direction bigint NOT NULL,
    valide boolean DEFAULT false NOT NULL,
    date_validation timestamp with time zone,
    valide_par bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.domaine OWNER TO postgres;

--
-- Name: domaine_id_domaine_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.domaine ALTER COLUMN id_domaine ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.domaine_id_domaine_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: experience_professionnelle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.experience_professionnelle (
    id_experience bigint NOT NULL,
    id_candidat bigint NOT NULL,
    poste character varying(200) NOT NULL,
    entreprise character varying(200),
    date_debut date,
    date_fin date,
    poste_actuel boolean DEFAULT false NOT NULL,
    description text,
    source character varying(20) DEFAULT 'manuel'::character varying NOT NULL,
    score_confiance numeric(4,3),
    id_document bigint,
    valide boolean DEFAULT false NOT NULL,
    date_validation timestamp with time zone,
    valide_par bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_experience_dates CHECK (((date_fin IS NULL) OR (date_debut IS NULL) OR (date_fin >= date_debut))),
    CONSTRAINT chk_experience_validation CHECK (((valide = false) OR ((valide_par IS NOT NULL) AND (date_validation IS NOT NULL)))),
    CONSTRAINT experience_professionnelle_source_check CHECK (((source)::text = ANY ((ARRAY['manuel'::character varying, 'cv_ocr'::character varying])::text[])))
);


ALTER TABLE public.experience_professionnelle OWNER TO postgres;

--
-- Name: experience_professionnelle_id_experience_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.experience_professionnelle ALTER COLUMN id_experience ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.experience_professionnelle_id_experience_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection character varying(255) NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.failed_jobs OWNER TO postgres;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.failed_jobs_id_seq OWNER TO postgres;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: formation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formation (
    id_formation bigint NOT NULL,
    id_candidat bigint NOT NULL,
    diplome character varying(200) NOT NULL,
    etablissement character varying(200),
    domaine_etude character varying(150),
    niveau character varying(50),
    date_obtention date,
    source character varying(20) DEFAULT 'manuel'::character varying NOT NULL,
    score_confiance numeric(4,3),
    id_document bigint,
    valide boolean DEFAULT false NOT NULL,
    date_validation timestamp with time zone,
    valide_par bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_formation_validation CHECK (((valide = false) OR ((valide_par IS NOT NULL) AND (date_validation IS NOT NULL)))),
    CONSTRAINT formation_source_check CHECK (((source)::text = ANY ((ARRAY['manuel'::character varying, 'cv_ocr'::character varying])::text[])))
);


ALTER TABLE public.formation OWNER TO postgres;

--
-- Name: formation_id_formation_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.formation ALTER COLUMN id_formation ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.formation_id_formation_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: historique_statut; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historique_statut (
    id_historique bigint NOT NULL,
    id_candidature bigint NOT NULL,
    id_statut_candidature bigint NOT NULL,
    date_changement timestamp with time zone DEFAULT now() NOT NULL,
    commentaire text,
    id_utilisateur bigint
);


ALTER TABLE public.historique_statut OWNER TO postgres;

--
-- Name: historique_statut_id_historique_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.historique_statut ALTER COLUMN id_historique ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.historique_statut_id_historique_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


ALTER TABLE public.job_batches OWNER TO postgres;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: mission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mission (
    id_mission bigint NOT NULL,
    id_offre bigint NOT NULL,
    description text NOT NULL,
    ordre integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_mission_ordre CHECK ((ordre > 0))
);


ALTER TABLE public.mission OWNER TO postgres;

--
-- Name: mission_id_mission_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.mission ALTER COLUMN id_mission ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mission_id_mission_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mode_realisation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mode_realisation (
    id_mode_realisation bigint NOT NULL,
    libelle character varying(50) NOT NULL
);


ALTER TABLE public.mode_realisation OWNER TO postgres;

--
-- Name: mode_realisation_id_mode_realisation_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.mode_realisation ALTER COLUMN id_mode_realisation ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mode_realisation_id_mode_realisation_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: modele_message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modele_message (
    id_modele_message bigint NOT NULL,
    id_type_message bigint NOT NULL,
    id_statut_candidature bigint,
    nom_modele character varying(150) NOT NULL,
    objet character varying(255) NOT NULL,
    contenu text NOT NULL,
    envoi_automatique boolean DEFAULT false NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_modele_auto_necessite_statut CHECK (((envoi_automatique = false) OR (id_statut_candidature IS NOT NULL)))
);


ALTER TABLE public.modele_message OWNER TO postgres;

--
-- Name: modele_message_id_modele_message_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.modele_message ALTER COLUMN id_modele_message ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.modele_message_id_modele_message_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: offre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offre (
    id_offre bigint NOT NULL,
    titre_poste character varying(200) NOT NULL,
    id_direction bigint NOT NULL,
    description text,
    lieu character varying(200),
    type_contrat character varying(50),
    date_publication date,
    date_limite date,
    id_statut_offre bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_offre_dates CHECK (((date_limite IS NULL) OR (date_publication IS NULL) OR (date_limite >= date_publication)))
);


ALTER TABLE public.offre OWNER TO postgres;

--
-- Name: offre_id_offre_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.offre ALTER COLUMN id_offre ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.offre_id_offre_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: profil_competence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profil_competence (
    id_offre bigint NOT NULL,
    id_competence bigint NOT NULL,
    niveau_requis character varying(30)
);


ALTER TABLE public.profil_competence OWNER TO postgres;

--
-- Name: profil_formation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profil_formation (
    id_profil_formation bigint NOT NULL,
    id_profil_offre bigint NOT NULL,
    niveau_min character varying(50),
    niveau_max character varying(50),
    domaine character varying(150),
    obligatoire boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_profil_formation_niveau CHECK (((niveau_min IS NOT NULL) OR (niveau_max IS NOT NULL) OR (domaine IS NOT NULL)))
);


ALTER TABLE public.profil_formation OWNER TO postgres;

--
-- Name: profil_formation_id_profil_formation_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.profil_formation ALTER COLUMN id_profil_formation ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.profil_formation_id_profil_formation_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: profil_offre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profil_offre (
    id_profil_offre bigint NOT NULL,
    id_offre bigint NOT NULL,
    description text,
    experience_min_annees numeric(4,1),
    experience_max_annees numeric(4,1),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_profil_experience_max CHECK (((experience_max_annees IS NULL) OR (experience_max_annees >= COALESCE(experience_min_annees, (0)::numeric)))),
    CONSTRAINT chk_profil_experience_min CHECK (((experience_min_annees IS NULL) OR (experience_min_annees >= (0)::numeric)))
);


ALTER TABLE public.profil_offre OWNER TO postgres;

--
-- Name: profil_offre_id_profil_offre_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.profil_offre ALTER COLUMN id_profil_offre ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.profil_offre_id_profil_offre_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rendez_vous; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rendez_vous (
    id_rendez_vous bigint NOT NULL,
    id_candidature bigint NOT NULL,
    id_utilisateur bigint NOT NULL,
    id_type_rendez_vous bigint NOT NULL,
    id_statut_rendez_vous bigint NOT NULL,
    id_mode_realisation bigint NOT NULL,
    date_debut timestamp without time zone NOT NULL,
    date_fin timestamp without time zone NOT NULL,
    details_lieu text,
    commentaire text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_rendez_vous_dates CHECK ((date_fin > date_debut))
);


ALTER TABLE public.rendez_vous OWNER TO postgres;

--
-- Name: rendez_vous_id_rendez_vous_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.rendez_vous ALTER COLUMN id_rendez_vous ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rendez_vous_id_rendez_vous_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: statut_candidature; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.statut_candidature (
    id_statut_candidature bigint NOT NULL,
    libelle character varying(100) NOT NULL,
    ordre_workflow integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.statut_candidature OWNER TO postgres;

--
-- Name: statut_candidature_id_statut_candidature_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.statut_candidature ALTER COLUMN id_statut_candidature ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.statut_candidature_id_statut_candidature_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: statut_offre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.statut_offre (
    id_statut_offre bigint NOT NULL,
    libelle character varying(50) NOT NULL
);


ALTER TABLE public.statut_offre OWNER TO postgres;

--
-- Name: statut_offre_id_statut_offre_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.statut_offre ALTER COLUMN id_statut_offre ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.statut_offre_id_statut_offre_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: statut_rendez_vous; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.statut_rendez_vous (
    id_statut_rendez_vous bigint NOT NULL,
    libelle character varying(50) NOT NULL
);


ALTER TABLE public.statut_rendez_vous OWNER TO postgres;

--
-- Name: statut_rendez_vous_id_statut_rendez_vous_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.statut_rendez_vous ALTER COLUMN id_statut_rendez_vous ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.statut_rendez_vous_id_statut_rendez_vous_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: type_competence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_competence (
    id_type_competence integer NOT NULL,
    libelle character varying(100) NOT NULL
);


ALTER TABLE public.type_competence OWNER TO postgres;

--
-- Name: type_competence_id_type_competence_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.type_competence_id_type_competence_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.type_competence_id_type_competence_seq OWNER TO postgres;

--
-- Name: type_competence_id_type_competence_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.type_competence_id_type_competence_seq OWNED BY public.type_competence.id_type_competence;


--
-- Name: type_demande; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_demande (
    id_type_demande bigint NOT NULL,
    libelle character varying(50) NOT NULL
);


ALTER TABLE public.type_demande OWNER TO postgres;

--
-- Name: type_demande_id_type_demande_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.type_demande ALTER COLUMN id_type_demande ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.type_demande_id_type_demande_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: type_message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_message (
    id_type_message bigint NOT NULL,
    libelle character varying(100) NOT NULL
);


ALTER TABLE public.type_message OWNER TO postgres;

--
-- Name: type_message_id_type_message_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.type_message ALTER COLUMN id_type_message ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.type_message_id_type_message_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: type_rendez_vous; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_rendez_vous (
    id_type_rendez_vous bigint NOT NULL,
    libelle character varying(50) NOT NULL
);


ALTER TABLE public.type_rendez_vous OWNER TO postgres;

--
-- Name: type_rendez_vous_id_type_rendez_vous_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.type_rendez_vous ALTER COLUMN id_type_rendez_vous ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.type_rendez_vous_id_type_rendez_vous_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(30) DEFAULT 'rh'::character varying NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilisateur (
    id_utilisateur bigint NOT NULL,
    nom character varying(150) NOT NULL,
    email character varying(200) NOT NULL,
    role character varying(30) DEFAULT 'rh'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT utilisateur_role_check CHECK (((role)::text = ANY ((ARRAY['rh'::character varying, 'admin'::character varying, 'manager'::character varying])::text[])))
);


ALTER TABLE public.utilisateur OWNER TO postgres;

--
-- Name: utilisateur_id_utilisateur_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.utilisateur ALTER COLUMN id_utilisateur ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.utilisateur_id_utilisateur_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vue_dashboard_kpis; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vue_dashboard_kpis AS
 SELECT ( SELECT count(*) AS count
           FROM (public.candidature c
             JOIN public.type_demande td ON ((td.id_type_demande = c.id_type_demande)))
          WHERE ((td.libelle)::text = 'Offre'::text)) AS candidatures_sur_offre,
    ( SELECT count(*) AS count
           FROM (public.offre o
             JOIN public.statut_offre so ON ((so.id_statut_offre = o.id_statut_offre)))
          WHERE ((so.libelle)::text = 'Publiee'::text)) AS offres_en_cours,
    ( SELECT count(*) AS count
           FROM (public.candidature c
             JOIN public.type_demande td ON ((td.id_type_demande = c.id_type_demande)))
          WHERE ((td.libelle)::text = 'Spontanee'::text)) AS candidatures_spontanees;


ALTER VIEW public.vue_dashboard_kpis OWNER TO postgres;

--
-- Name: vue_stats_candidatures_par_mois; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vue_stats_candidatures_par_mois AS
 SELECT (date_trunc('month'::text, date_candidature))::date AS mois,
    count(*) AS nombre_candidatures
   FROM public.candidature
  GROUP BY ((date_trunc('month'::text, date_candidature))::date)
  ORDER BY ((date_trunc('month'::text, date_candidature))::date);


ALTER VIEW public.vue_stats_candidatures_par_mois OWNER TO postgres;

--
-- Name: vue_stats_delai_traitement; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vue_stats_delai_traitement AS
 WITH premiere_reception AS (
         SELECT hs.id_candidature,
            min(hs.date_changement) AS date_reception
           FROM (public.historique_statut hs
             JOIN public.statut_candidature sc ON ((sc.id_statut_candidature = hs.id_statut_candidature)))
          WHERE ((sc.libelle)::text = 'Recue'::text)
          GROUP BY hs.id_candidature
        ), statut_final AS (
         SELECT hs.id_candidature,
            min(hs.date_changement) AS date_decision
           FROM (public.historique_statut hs
             JOIN public.statut_candidature sc ON ((sc.id_statut_candidature = hs.id_statut_candidature)))
          WHERE ((sc.libelle)::text = ANY ((ARRAY['Retenue'::character varying, 'Non retenue'::character varying])::text[]))
          GROUP BY hs.id_candidature
        )
 SELECT (date_trunc('month'::text, pr.date_reception))::date AS mois,
    round(avg((EXTRACT(epoch FROM (sf.date_decision - pr.date_reception)) / (86400)::numeric)), 1) AS delai_moyen_jours,
    count(*) AS nombre_candidatures_terminees
   FROM (premiere_reception pr
     JOIN statut_final sf ON ((sf.id_candidature = pr.id_candidature)))
  GROUP BY ((date_trunc('month'::text, pr.date_reception))::date)
  ORDER BY ((date_trunc('month'::text, pr.date_reception))::date);


ALTER VIEW public.vue_stats_delai_traitement OWNER TO postgres;

--
-- Name: vue_stats_repartition_statut_mois_courant; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vue_stats_repartition_statut_mois_courant AS
 SELECT sc.libelle AS statut,
    sc.ordre_workflow,
    count(*) AS nombre
   FROM (public.candidature c
     JOIN public.statut_candidature sc ON ((sc.id_statut_candidature = c.id_statut_candidature)))
  WHERE (date_trunc('month'::text, c.date_candidature) = date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))
  GROUP BY sc.libelle, sc.ordre_workflow
  ORDER BY sc.ordre_workflow;


ALTER VIEW public.vue_stats_repartition_statut_mois_courant OWNER TO postgres;

--
-- Name: vue_stats_taux_transformation_mensuel; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vue_stats_taux_transformation_mensuel AS
 SELECT (date_trunc('month'::text, c.date_candidature))::date AS mois,
    count(*) AS total_candidatures,
    count(*) FILTER (WHERE ((sc.libelle)::text = 'Retenue'::text)) AS candidatures_retenues,
    round((((count(*) FILTER (WHERE ((sc.libelle)::text = 'Retenue'::text)))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 2) AS taux_transformation_pct
   FROM (public.candidature c
     JOIN public.statut_candidature sc ON ((sc.id_statut_candidature = c.id_statut_candidature)))
  GROUP BY ((date_trunc('month'::text, c.date_candidature))::date)
  ORDER BY ((date_trunc('month'::text, c.date_candidature))::date);


ALTER VIEW public.vue_stats_taux_transformation_mensuel OWNER TO postgres;

--
-- Name: competence id_competence; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competence ALTER COLUMN id_competence SET DEFAULT nextval('public.competence_id_competence_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: type_competence id_type_competence; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_competence ALTER COLUMN id_type_competence SET DEFAULT nextval('public.type_competence_id_type_competence_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cache (key, value, expiration) FROM stdin;
\.


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cache_locks (key, owner, expiration) FROM stdin;
\.


--
-- Data for Name: candidat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidat (id_candidat, nom, prenom, email, telephone, adresse, date_naissance, created_at, updated_at) FROM stdin;
1	Dubois	Thomas	thomas.dubois@gmail.com	0612345678	12 rue de Paris, 75001 Paris	1995-03-15	2026-08-24 10:50:06.593342+03	2026-08-24 10:50:06.593342+03
2	Lambert	Emma	emma.lambert@gmail.com	0623456789	45 avenue des Lilas, 69000 Lyon	1993-07-22	2026-08-24 10:50:06.593342+03	2026-08-24 10:50:06.593342+03
3	Rousseau	Lucas	lucas.rousseau@gmail.com	0634567890	78 boulevard du Nord, 13000 Marseille	1997-11-01	2026-08-24 10:50:06.593342+03	2026-08-24 10:50:06.593342+03
4	Girard	Lea	lea.girard@gmail.com	0645678901	23 rue de la Mer, 33000 Bordeaux	1994-05-18	2026-08-24 10:50:06.593342+03	2026-08-24 10:50:06.593342+03
5	Vincent	Hugo	hugo.vincent@gmail.com	0656789012	56 avenue des Roses, 59000 Lille	1996-09-30	2026-08-24 10:50:06.593342+03	2026-08-24 10:50:06.593342+03
6	Roux	Chloe	chloe.roux@gmail.com	0667890123	34 rue de l'Eglise, 67000 Strasbourg	1998-02-14	2026-08-24 10:50:06.593342+03	2026-08-24 10:50:06.593342+03
7	Henry	Maxime	maxime.henry@gmail.com	0678901234	67 boulevard du Sud, 31000 Toulouse	1995-08-25	2026-08-24 10:50:06.593342+03	2026-08-24 10:50:06.593342+03
8	Marie	Camille	camille.marie@gmail.com	0689012345	89 avenue du Centre, 44000 Nantes	1993-12-10	2026-08-24 10:50:06.593342+03	2026-08-24 10:50:06.593342+03
9	Renaud	Juliette	juliette.renaud@gmail.com	0690123456	12 impasse des Fleurs, 06000 Nice	1997-04-20	2026-08-24 10:50:06.593342+03	2026-08-24 10:50:06.593342+03
10	Fontaine	Antoine	antoine.fontaine@gmail.com	0601234567	45 chemin des Oliviers, 34000 Montpellier	1994-06-05	2026-08-24 10:50:06.593342+03	2026-08-24 10:50:06.593342+03
\.


--
-- Data for Name: candidat_competence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidat_competence (id_candidat, id_competence, niveau, source, score_confiance, id_document, valide, date_validation, valide_par) FROM stdin;
1	3	Expert	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
1	4	Expert	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
1	2	Avance	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
2	3	Avance	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
2	4	Avance	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
2	11	Intermediaire	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
3	3	Expert	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
3	4	Expert	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
3	8	Avance	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
4	5	Expert	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
4	7	Avance	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
5	15	Expert	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
5	16	Avance	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
6	17	Expert	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
6	18	Avance	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
7	18	Expert	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
7	17	Avance	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
8	3	Avance	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
8	5	Intermediaire	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
9	15	Avance	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
10	17	Expert	manuel	\N	\N	t	2026-08-24 10:50:06.613515+03	2
\.


--
-- Data for Name: candidature; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidature (id_candidature, id_candidat, id_type_demande, id_offre, id_domaine, id_statut_candidature, dans_vivier, poste_souhaite, message, canal_depot, id_utilisateur_depot, date_candidature, date_maj) FROM stdin;
1	1	1	1	\N	2	f	\N	Je suis tres interesse par ce poste	site_externe	\N	2026-08-24 10:50:06.59851+03	2026-08-24 10:50:06.59851+03
2	2	1	1	\N	4	f	\N	\N	site_externe	\N	2026-08-24 10:50:06.59851+03	2026-08-24 10:50:06.59851+03
3	3	1	2	\N	2	f	\N	Experience en React Native	site_externe	\N	2026-08-24 10:50:06.59851+03	2026-08-24 10:50:06.59851+03
4	4	1	3	\N	1	f	\N	\N	site_externe	\N	2026-08-24 10:50:06.59851+03	2026-08-24 10:50:06.59851+03
5	5	1	4	\N	5	t	\N	10 ans d'experience en recrutement	site_externe	\N	2026-08-24 10:50:06.59851+03	2026-08-24 10:50:06.59851+03
6	6	1	6	\N	3	f	\N	\N	site_externe	\N	2026-08-24 10:50:06.59851+03	2026-08-24 10:50:06.59851+03
7	7	1	7	\N	2	f	\N	Bon relationnel	site_externe	\N	2026-08-24 10:50:06.59851+03	2026-08-24 10:50:06.59851+03
8	8	2	\N	1	1	t	Developpeur Web	Candidature spontanee	site_externe	\N	2026-08-24 10:50:06.59851+03	2026-08-24 10:50:06.59851+03
9	9	2	\N	4	1	t	Responsable RH	En recherche active	site_externe	\N	2026-08-24 10:50:06.59851+03	2026-08-24 10:50:06.59851+03
10	10	2	\N	8	1	t	Charge de Marketing	\N	site_externe	\N	2026-08-24 10:50:06.59851+03	2026-08-24 10:50:06.59851+03
\.


--
-- Data for Name: communication; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communication (id_communication, id_candidature, id_modele_message, id_type_message, objet, contenu, mode_envoi, date_envoi, id_utilisateur) FROM stdin;
\.


--
-- Data for Name: competence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.competence (id_competence, nom_competence, id_type_competence) FROM stdin;
1	Java	1
2	Python	1
3	JavaScript	1
4	React	1
5	Node.js	1
6	SQL	1
7	MongoDB	1
8	Docker	3
9	Git	3
10	Angular	1
11	Vue.js	1
12	Spring Boot	1
13	Django	1
14	Flask	1
15	Recrutement	5
16	Gestion de Projet	4
17	Communication	5
18	Negociation	5
19	Finance	5
20	Comptabilite	5
\.


--
-- Data for Name: competence_alias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.competence_alias (id_alias, texte_brut, id_competence, id_utilisateur, created_at) FROM stdin;
\.


--
-- Data for Name: direction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.direction (id_direction, nom_direction) FROM stdin;
1	Informatique
2	Ressources Humaines
3	Finance
4	Marketing
5	Commercial
\.


--
-- Data for Name: document; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document (id_document, id_candidature, type_document, nom_fichier, chemin_fichier, mime_type, taille_octets, mode_acquisition, contenu_texte_extrait, date_upload) FROM stdin;
\.


--
-- Data for Name: domaine; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.domaine (id_domaine, nom_domaine, id_direction, valide, date_validation, valide_par, created_at, updated_at) FROM stdin;
1	Developpement Web	1	t	\N	\N	2026-08-24 10:50:06.566293+03	2026-08-24 10:50:06.566293+03
2	Developpement Mobile	1	t	\N	\N	2026-08-24 10:50:06.566293+03	2026-08-24 10:50:06.566293+03
3	Base de Donnees	1	f	\N	\N	2026-08-24 10:50:06.566293+03	2026-08-24 10:50:06.566293+03
4	Recrutement	2	t	\N	\N	2026-08-24 10:50:06.566293+03	2026-08-24 10:50:06.566293+03
5	Formation	2	f	\N	\N	2026-08-24 10:50:06.566293+03	2026-08-24 10:50:06.566293+03
6	Comptabilite	3	t	\N	\N	2026-08-24 10:50:06.566293+03	2026-08-24 10:50:06.566293+03
7	Tresorerie	3	f	\N	\N	2026-08-24 10:50:06.566293+03	2026-08-24 10:50:06.566293+03
8	Communication Digitale	4	t	\N	\N	2026-08-24 10:50:06.566293+03	2026-08-24 10:50:06.566293+03
9	Relations Publiques	4	f	\N	\N	2026-08-24 10:50:06.566293+03	2026-08-24 10:50:06.566293+03
10	Ventes B2B	5	t	\N	\N	2026-08-24 10:50:06.566293+03	2026-08-24 10:50:06.566293+03
\.


--
-- Data for Name: experience_professionnelle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.experience_professionnelle (id_experience, id_candidat, poste, entreprise, date_debut, date_fin, poste_actuel, description, source, score_confiance, id_document, valide, date_validation, valide_par, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
\.


--
-- Data for Name: formation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formation (id_formation, id_candidat, diplome, etablissement, domaine_etude, niveau, date_obtention, source, score_confiance, id_document, valide, date_validation, valide_par, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: historique_statut; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historique_statut (id_historique, id_candidature, id_statut_candidature, date_changement, commentaire, id_utilisateur) FROM stdin;
1	1	1	2026-08-24 10:50:06.61926+03	Candidature recue	2
2	1	2	2026-08-24 10:50:06.61926+03	Preselectionnee	2
3	2	1	2026-08-24 10:50:06.61926+03	Candidature recue	2
4	2	4	2026-08-24 10:50:06.61926+03	Entretien prevu le 15/02	3
5	3	1	2026-08-24 10:50:06.61926+03	Candidature recue	2
6	3	2	2026-08-24 10:50:06.61926+03	Preselectionnee	2
7	4	1	2026-08-24 10:50:06.61926+03	Candidature recue	4
8	5	1	2026-08-24 10:50:06.61926+03	Candidature recue	2
9	5	5	2026-08-24 10:50:06.61926+03	Recrutement accepte	2
10	6	1	2026-08-24 10:50:06.61926+03	Candidature recue	4
11	6	3	2026-08-24 10:50:06.61926+03	Test technique en ligne	4
12	7	1	2026-08-24 10:50:06.61926+03	Candidature recue	2
13	7	2	2026-08-24 10:50:06.61926+03	Preselectionnee	2
14	8	1	2026-08-24 10:50:06.61926+03	Spontanee	2
15	9	1	2026-08-24 10:50:06.61926+03	Spontanee	4
16	10	1	2026-08-24 10:50:06.61926+03	Spontanee	2
\.


--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
\.


--
-- Data for Name: mission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mission (id_mission, id_offre, description, ordre, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mode_realisation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mode_realisation (id_mode_realisation, libelle) FROM stdin;
1	Presentiel
2	Visioconference
3	Telephone
\.


--
-- Data for Name: modele_message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modele_message (id_modele_message, id_type_message, id_statut_candidature, nom_modele, objet, contenu, envoi_automatique, actif, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: offre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offre (id_offre, titre_poste, id_direction, description, lieu, type_contrat, date_publication, date_limite, id_statut_offre, created_at, updated_at) FROM stdin;
1	Developpeur Full Stack	1	\N	\N	\N	2026-01-15	2026-03-15	2	2026-08-24 10:50:06.575425+03	2026-08-24 10:50:06.575425+03
2	Developpeur React Native	1	\N	\N	\N	2026-02-01	2026-04-01	2	2026-08-24 10:50:06.575425+03	2026-08-24 10:50:06.575425+03
3	Data Engineer	1	\N	\N	\N	2026-01-20	2026-03-20	2	2026-08-24 10:50:06.575425+03	2026-08-24 10:50:06.575425+03
4	Responsable Recrutement	2	\N	\N	\N	2026-01-10	2026-02-10	3	2026-08-24 10:50:06.575425+03	2026-08-24 10:50:06.575425+03
5	Comptable	3	\N	\N	\N	2026-02-01	2026-04-01	1	2026-08-24 10:50:06.575425+03	2026-08-24 10:50:06.575425+03
6	Chargé de Marketing Digital	4	\N	\N	\N	2026-01-25	2026-03-25	2	2026-08-24 10:50:06.575425+03	2026-08-24 10:50:06.575425+03
7	Commercial Senior	5	\N	\N	\N	2026-01-15	2026-03-15	2	2026-08-24 10:50:06.575425+03	2026-08-24 10:50:06.575425+03
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
\.


--
-- Data for Name: profil_competence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profil_competence (id_offre, id_competence, niveau_requis) FROM stdin;
\.


--
-- Data for Name: profil_formation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profil_formation (id_profil_formation, id_profil_offre, niveau_min, niveau_max, domaine, obligatoire, created_at) FROM stdin;
\.


--
-- Data for Name: profil_offre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profil_offre (id_profil_offre, id_offre, description, experience_min_annees, experience_max_annees, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rendez_vous; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rendez_vous (id_rendez_vous, id_candidature, id_utilisateur, id_type_rendez_vous, id_statut_rendez_vous, id_mode_realisation, date_debut, date_fin, details_lieu, commentaire, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, ip_address, user_agent, payload, last_activity) FROM stdin;
\.


--
-- Data for Name: statut_candidature; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.statut_candidature (id_statut_candidature, libelle, ordre_workflow) FROM stdin;
1	Recue	1
2	Preselectionnee	2
3	Test	3
4	Entretien	4
5	Retenue	5
6	Non retenue	6
\.


--
-- Data for Name: statut_offre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.statut_offre (id_statut_offre, libelle) FROM stdin;
1	Brouillon
2	Publiee
3	Cloturee
\.


--
-- Data for Name: statut_rendez_vous; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.statut_rendez_vous (id_statut_rendez_vous, libelle) FROM stdin;
1	A venir
2	Realise
3	Annule
\.


--
-- Data for Name: type_competence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_competence (id_type_competence, libelle) FROM stdin;
1	Technique
2	Langue
3	Logiciel
4	Méthodologie
5	Autre
\.


--
-- Data for Name: type_demande; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_demande (id_type_demande, libelle) FROM stdin;
1	Offre
2	Spontanee
\.


--
-- Data for Name: type_message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_message (id_type_message, libelle) FROM stdin;
1	Accuse de reception
2	Convocation
3	Demande information
4	Demande document
5	Issue recrutement
6	Autre
\.


--
-- Data for Name: type_rendez_vous; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_rendez_vous (id_type_rendez_vous, libelle) FROM stdin;
1	Test
2	Entretien
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, role, email_verified_at, password, remember_token, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilisateur (id_utilisateur, nom, email, role, created_at, updated_at) FROM stdin;
1	Dupont Jean	jean.dupont@entreprise.com	admin	2026-08-24 10:50:06.561957+03	2026-08-24 10:50:06.561957+03
2	Martin Sophie	sophie.martin@entreprise.com	rh	2026-08-24 10:50:06.561957+03	2026-08-24 10:50:06.561957+03
3	Bernard Pierre	pierre.bernard@entreprise.com	manager	2026-08-24 10:50:06.561957+03	2026-08-24 10:50:06.561957+03
4	Durand Marie	marie.durand@entreprise.com	rh	2026-08-24 10:50:06.561957+03	2026-08-24 10:50:06.561957+03
5	Petit Luc	luc.petit@entreprise.com	manager	2026-08-24 10:50:06.561957+03	2026-08-24 10:50:06.561957+03
\.


--
-- Name: candidat_id_candidat_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidat_id_candidat_seq', 10, true);


--
-- Name: candidature_id_candidature_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidature_id_candidature_seq', 10, true);


--
-- Name: communication_id_communication_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.communication_id_communication_seq', 1, false);


--
-- Name: competence_alias_id_alias_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.competence_alias_id_alias_seq', 1, false);


--
-- Name: competence_id_competence_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.competence_id_competence_seq', 20, true);


--
-- Name: direction_id_direction_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.direction_id_direction_seq', 5, true);


--
-- Name: document_id_document_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_id_document_seq', 1, false);


--
-- Name: domaine_id_domaine_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.domaine_id_domaine_seq', 10, true);


--
-- Name: experience_professionnelle_id_experience_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.experience_professionnelle_id_experience_seq', 1, false);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: formation_id_formation_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.formation_id_formation_seq', 1, false);


--
-- Name: historique_statut_id_historique_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historique_statut_id_historique_seq', 16, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 3, true);


--
-- Name: mission_id_mission_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mission_id_mission_seq', 1, false);


--
-- Name: mode_realisation_id_mode_realisation_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mode_realisation_id_mode_realisation_seq', 3, true);


--
-- Name: modele_message_id_modele_message_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.modele_message_id_modele_message_seq', 1, false);


--
-- Name: offre_id_offre_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.offre_id_offre_seq', 7, true);


--
-- Name: profil_formation_id_profil_formation_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profil_formation_id_profil_formation_seq', 1, false);


--
-- Name: profil_offre_id_profil_offre_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profil_offre_id_profil_offre_seq', 1, false);


--
-- Name: rendez_vous_id_rendez_vous_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rendez_vous_id_rendez_vous_seq', 1, false);


--
-- Name: statut_candidature_id_statut_candidature_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.statut_candidature_id_statut_candidature_seq', 6, true);


--
-- Name: statut_offre_id_statut_offre_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.statut_offre_id_statut_offre_seq', 3, true);


--
-- Name: statut_rendez_vous_id_statut_rendez_vous_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.statut_rendez_vous_id_statut_rendez_vous_seq', 3, true);


--
-- Name: type_competence_id_type_competence_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_competence_id_type_competence_seq', 5, true);


--
-- Name: type_demande_id_type_demande_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_demande_id_type_demande_seq', 2, true);


--
-- Name: type_message_id_type_message_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_message_id_type_message_seq', 6, true);


--
-- Name: type_rendez_vous_id_type_rendez_vous_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_rendez_vous_id_type_rendez_vous_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: utilisateur_id_utilisateur_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilisateur_id_utilisateur_seq', 5, true);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: candidat_competence candidat_competence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat_competence
    ADD CONSTRAINT candidat_competence_pkey PRIMARY KEY (id_candidat, id_competence);


--
-- Name: candidat candidat_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat
    ADD CONSTRAINT candidat_email_key UNIQUE (email);


--
-- Name: candidat candidat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat
    ADD CONSTRAINT candidat_pkey PRIMARY KEY (id_candidat);


--
-- Name: candidature candidature_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidature
    ADD CONSTRAINT candidature_pkey PRIMARY KEY (id_candidature);


--
-- Name: communication communication_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication
    ADD CONSTRAINT communication_pkey PRIMARY KEY (id_communication);


--
-- Name: competence_alias competence_alias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competence_alias
    ADD CONSTRAINT competence_alias_pkey PRIMARY KEY (id_alias);


--
-- Name: competence_alias competence_alias_texte_brut_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competence_alias
    ADD CONSTRAINT competence_alias_texte_brut_key UNIQUE (texte_brut);


--
-- Name: competence competence_nom_competence_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competence
    ADD CONSTRAINT competence_nom_competence_key UNIQUE (nom_competence);


--
-- Name: competence competence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competence
    ADD CONSTRAINT competence_pkey PRIMARY KEY (id_competence);


--
-- Name: direction direction_nom_direction_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direction
    ADD CONSTRAINT direction_nom_direction_key UNIQUE (nom_direction);


--
-- Name: direction direction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direction
    ADD CONSTRAINT direction_pkey PRIMARY KEY (id_direction);


--
-- Name: document document_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_pkey PRIMARY KEY (id_document);


--
-- Name: domaine domaine_nom_domaine_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine
    ADD CONSTRAINT domaine_nom_domaine_key UNIQUE (nom_domaine);


--
-- Name: domaine domaine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine
    ADD CONSTRAINT domaine_pkey PRIMARY KEY (id_domaine);


--
-- Name: experience_professionnelle experience_professionnelle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experience_professionnelle
    ADD CONSTRAINT experience_professionnelle_pkey PRIMARY KEY (id_experience);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: formation formation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formation
    ADD CONSTRAINT formation_pkey PRIMARY KEY (id_formation);


--
-- Name: historique_statut historique_statut_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_statut
    ADD CONSTRAINT historique_statut_pkey PRIMARY KEY (id_historique);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: mission mission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mission
    ADD CONSTRAINT mission_pkey PRIMARY KEY (id_mission);


--
-- Name: mode_realisation mode_realisation_libelle_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mode_realisation
    ADD CONSTRAINT mode_realisation_libelle_key UNIQUE (libelle);


--
-- Name: mode_realisation mode_realisation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mode_realisation
    ADD CONSTRAINT mode_realisation_pkey PRIMARY KEY (id_mode_realisation);


--
-- Name: modele_message modele_message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modele_message
    ADD CONSTRAINT modele_message_pkey PRIMARY KEY (id_modele_message);


--
-- Name: offre offre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offre
    ADD CONSTRAINT offre_pkey PRIMARY KEY (id_offre);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: profil_competence profil_competence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_competence
    ADD CONSTRAINT profil_competence_pkey PRIMARY KEY (id_offre, id_competence);


--
-- Name: profil_formation profil_formation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_formation
    ADD CONSTRAINT profil_formation_pkey PRIMARY KEY (id_profil_formation);


--
-- Name: profil_offre profil_offre_id_offre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_offre
    ADD CONSTRAINT profil_offre_id_offre_key UNIQUE (id_offre);


--
-- Name: profil_offre profil_offre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_offre
    ADD CONSTRAINT profil_offre_pkey PRIMARY KEY (id_profil_offre);


--
-- Name: rendez_vous rendez_vous_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_pkey PRIMARY KEY (id_rendez_vous);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: statut_candidature statut_candidature_libelle_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_candidature
    ADD CONSTRAINT statut_candidature_libelle_key UNIQUE (libelle);


--
-- Name: statut_candidature statut_candidature_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_candidature
    ADD CONSTRAINT statut_candidature_pkey PRIMARY KEY (id_statut_candidature);


--
-- Name: statut_offre statut_offre_libelle_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_offre
    ADD CONSTRAINT statut_offre_libelle_key UNIQUE (libelle);


--
-- Name: statut_offre statut_offre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_offre
    ADD CONSTRAINT statut_offre_pkey PRIMARY KEY (id_statut_offre);


--
-- Name: statut_rendez_vous statut_rendez_vous_libelle_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_rendez_vous
    ADD CONSTRAINT statut_rendez_vous_libelle_key UNIQUE (libelle);


--
-- Name: statut_rendez_vous statut_rendez_vous_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_rendez_vous
    ADD CONSTRAINT statut_rendez_vous_pkey PRIMARY KEY (id_statut_rendez_vous);


--
-- Name: type_competence type_competence_libelle_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_competence
    ADD CONSTRAINT type_competence_libelle_key UNIQUE (libelle);


--
-- Name: type_competence type_competence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_competence
    ADD CONSTRAINT type_competence_pkey PRIMARY KEY (id_type_competence);


--
-- Name: type_demande type_demande_libelle_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_demande
    ADD CONSTRAINT type_demande_libelle_key UNIQUE (libelle);


--
-- Name: type_demande type_demande_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_demande
    ADD CONSTRAINT type_demande_pkey PRIMARY KEY (id_type_demande);


--
-- Name: type_message type_message_libelle_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_message
    ADD CONSTRAINT type_message_libelle_key UNIQUE (libelle);


--
-- Name: type_message type_message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_message
    ADD CONSTRAINT type_message_pkey PRIMARY KEY (id_type_message);


--
-- Name: type_rendez_vous type_rendez_vous_libelle_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_rendez_vous
    ADD CONSTRAINT type_rendez_vous_libelle_key UNIQUE (libelle);


--
-- Name: type_rendez_vous type_rendez_vous_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_rendez_vous
    ADD CONSTRAINT type_rendez_vous_pkey PRIMARY KEY (id_type_rendez_vous);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);


--
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: failed_jobs_connection_queue_failed_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX failed_jobs_connection_queue_failed_at_index ON public.failed_jobs USING btree (connection, queue, failed_at);


--
-- Name: idx_candidat_nom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidat_nom ON public.candidat USING btree (nom);


--
-- Name: idx_candidature_canal; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidature_canal ON public.candidature USING btree (canal_depot);


--
-- Name: idx_candidature_candidat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidature_candidat ON public.candidature USING btree (id_candidat);


--
-- Name: idx_candidature_domaine; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidature_domaine ON public.candidature USING btree (id_domaine);


--
-- Name: idx_candidature_offre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidature_offre ON public.candidature USING btree (id_offre);


--
-- Name: idx_candidature_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidature_statut ON public.candidature USING btree (id_statut_candidature);


--
-- Name: idx_candidature_type_demande; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidature_type_demande ON public.candidature USING btree (id_type_demande);


--
-- Name: idx_candidature_vivier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidature_vivier ON public.candidature USING btree (dans_vivier) WHERE (dans_vivier = true);


--
-- Name: idx_communication_candidature; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_candidature ON public.communication USING btree (id_candidature);


--
-- Name: idx_communication_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_type ON public.communication USING btree (id_type_message);


--
-- Name: idx_competence_alias_competence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_competence_alias_competence ON public.competence_alias USING btree (id_competence);


--
-- Name: idx_competence_nom_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_competence_nom_trgm ON public.competence USING gin (nom_competence public.gin_trgm_ops);


--
-- Name: idx_document_candidature; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_candidature ON public.document USING btree (id_candidature);


--
-- Name: idx_document_recherche_texte; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_recherche_texte ON public.document USING gin (recherche_texte);


--
-- Name: idx_domaine_direction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_domaine_direction ON public.domaine USING btree (id_direction);


--
-- Name: idx_domaine_valide; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_domaine_valide ON public.domaine USING btree (valide) WHERE (valide = false);


--
-- Name: idx_experience_candidat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_experience_candidat ON public.experience_professionnelle USING btree (id_candidat);


--
-- Name: idx_formation_candidat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_formation_candidat ON public.formation USING btree (id_candidat);


--
-- Name: idx_historique_candidature; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historique_candidature ON public.historique_statut USING btree (id_candidature);


--
-- Name: idx_mission_offre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mission_offre ON public.mission USING btree (id_offre);


--
-- Name: idx_modele_message_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modele_message_statut ON public.modele_message USING btree (id_statut_candidature);


--
-- Name: idx_modele_message_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modele_message_type ON public.modele_message USING btree (id_type_message);


--
-- Name: idx_modele_unique_auto_par_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_modele_unique_auto_par_statut ON public.modele_message USING btree (id_statut_candidature) WHERE ((envoi_automatique = true) AND (actif = true));


--
-- Name: idx_offre_direction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offre_direction ON public.offre USING btree (id_direction);


--
-- Name: idx_offre_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offre_statut ON public.offre USING btree (id_statut_offre);


--
-- Name: idx_profil_formation_profil; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profil_formation_profil ON public.profil_formation USING btree (id_profil_offre);


--
-- Name: idx_profil_offre_offre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profil_offre_offre ON public.profil_offre USING btree (id_offre);


--
-- Name: idx_rendez_vous_candidature; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rendez_vous_candidature ON public.rendez_vous USING btree (id_candidature);


--
-- Name: idx_rendez_vous_date_debut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rendez_vous_date_debut ON public.rendez_vous USING btree (date_debut);


--
-- Name: idx_rendez_vous_mode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rendez_vous_mode ON public.rendez_vous USING btree (id_mode_realisation);


--
-- Name: idx_rendez_vous_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rendez_vous_statut ON public.rendez_vous USING btree (id_statut_rendez_vous);


--
-- Name: idx_rendez_vous_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rendez_vous_type ON public.rendez_vous USING btree (id_type_rendez_vous);


--
-- Name: idx_rendez_vous_utilisateur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rendez_vous_utilisateur ON public.rendez_vous USING btree (id_utilisateur);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: candidat_competence candidat_competence_id_candidat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat_competence
    ADD CONSTRAINT candidat_competence_id_candidat_fkey FOREIGN KEY (id_candidat) REFERENCES public.candidat(id_candidat) ON DELETE CASCADE;


--
-- Name: candidat_competence candidat_competence_id_competence_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat_competence
    ADD CONSTRAINT candidat_competence_id_competence_fkey FOREIGN KEY (id_competence) REFERENCES public.competence(id_competence) ON DELETE CASCADE;


--
-- Name: candidat_competence candidat_competence_id_document_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat_competence
    ADD CONSTRAINT candidat_competence_id_document_fkey FOREIGN KEY (id_document) REFERENCES public.document(id_document) ON DELETE SET NULL;


--
-- Name: candidat_competence candidat_competence_valide_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat_competence
    ADD CONSTRAINT candidat_competence_valide_par_fkey FOREIGN KEY (valide_par) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL;


--
-- Name: candidature candidature_id_candidat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidature
    ADD CONSTRAINT candidature_id_candidat_fkey FOREIGN KEY (id_candidat) REFERENCES public.candidat(id_candidat) ON DELETE CASCADE;


--
-- Name: candidature candidature_id_domaine_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidature
    ADD CONSTRAINT candidature_id_domaine_fkey FOREIGN KEY (id_domaine) REFERENCES public.domaine(id_domaine) ON DELETE RESTRICT;


--
-- Name: candidature candidature_id_offre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidature
    ADD CONSTRAINT candidature_id_offre_fkey FOREIGN KEY (id_offre) REFERENCES public.offre(id_offre) ON DELETE RESTRICT;


--
-- Name: candidature candidature_id_statut_candidature_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidature
    ADD CONSTRAINT candidature_id_statut_candidature_fkey FOREIGN KEY (id_statut_candidature) REFERENCES public.statut_candidature(id_statut_candidature) ON DELETE RESTRICT;


--
-- Name: candidature candidature_id_type_demande_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidature
    ADD CONSTRAINT candidature_id_type_demande_fkey FOREIGN KEY (id_type_demande) REFERENCES public.type_demande(id_type_demande) ON DELETE RESTRICT;


--
-- Name: candidature candidature_id_utilisateur_depot_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidature
    ADD CONSTRAINT candidature_id_utilisateur_depot_fkey FOREIGN KEY (id_utilisateur_depot) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL;


--
-- Name: communication communication_id_candidature_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication
    ADD CONSTRAINT communication_id_candidature_fkey FOREIGN KEY (id_candidature) REFERENCES public.candidature(id_candidature) ON DELETE CASCADE;


--
-- Name: communication communication_id_modele_message_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication
    ADD CONSTRAINT communication_id_modele_message_fkey FOREIGN KEY (id_modele_message) REFERENCES public.modele_message(id_modele_message) ON DELETE SET NULL;


--
-- Name: communication communication_id_type_message_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication
    ADD CONSTRAINT communication_id_type_message_fkey FOREIGN KEY (id_type_message) REFERENCES public.type_message(id_type_message) ON DELETE RESTRICT;


--
-- Name: communication communication_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication
    ADD CONSTRAINT communication_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL;


--
-- Name: competence_alias competence_alias_id_competence_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competence_alias
    ADD CONSTRAINT competence_alias_id_competence_fkey FOREIGN KEY (id_competence) REFERENCES public.competence(id_competence) ON DELETE CASCADE;


--
-- Name: competence_alias competence_alias_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competence_alias
    ADD CONSTRAINT competence_alias_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL;


--
-- Name: document document_id_candidature_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_id_candidature_fkey FOREIGN KEY (id_candidature) REFERENCES public.candidature(id_candidature) ON DELETE CASCADE;


--
-- Name: domaine domaine_id_direction_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine
    ADD CONSTRAINT domaine_id_direction_fkey FOREIGN KEY (id_direction) REFERENCES public.direction(id_direction) ON DELETE RESTRICT;


--
-- Name: domaine domaine_valide_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine
    ADD CONSTRAINT domaine_valide_par_fkey FOREIGN KEY (valide_par) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL;


--
-- Name: experience_professionnelle experience_professionnelle_id_candidat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experience_professionnelle
    ADD CONSTRAINT experience_professionnelle_id_candidat_fkey FOREIGN KEY (id_candidat) REFERENCES public.candidat(id_candidat) ON DELETE CASCADE;


--
-- Name: experience_professionnelle experience_professionnelle_id_document_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experience_professionnelle
    ADD CONSTRAINT experience_professionnelle_id_document_fkey FOREIGN KEY (id_document) REFERENCES public.document(id_document) ON DELETE SET NULL;


--
-- Name: experience_professionnelle experience_professionnelle_valide_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experience_professionnelle
    ADD CONSTRAINT experience_professionnelle_valide_par_fkey FOREIGN KEY (valide_par) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL;


--
-- Name: competence fk_competence_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competence
    ADD CONSTRAINT fk_competence_type FOREIGN KEY (id_type_competence) REFERENCES public.type_competence(id_type_competence);


--
-- Name: formation formation_id_candidat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formation
    ADD CONSTRAINT formation_id_candidat_fkey FOREIGN KEY (id_candidat) REFERENCES public.candidat(id_candidat) ON DELETE CASCADE;


--
-- Name: formation formation_id_document_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formation
    ADD CONSTRAINT formation_id_document_fkey FOREIGN KEY (id_document) REFERENCES public.document(id_document) ON DELETE SET NULL;


--
-- Name: formation formation_valide_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formation
    ADD CONSTRAINT formation_valide_par_fkey FOREIGN KEY (valide_par) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL;


--
-- Name: historique_statut historique_statut_id_candidature_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_statut
    ADD CONSTRAINT historique_statut_id_candidature_fkey FOREIGN KEY (id_candidature) REFERENCES public.candidature(id_candidature) ON DELETE CASCADE;


--
-- Name: historique_statut historique_statut_id_statut_candidature_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_statut
    ADD CONSTRAINT historique_statut_id_statut_candidature_fkey FOREIGN KEY (id_statut_candidature) REFERENCES public.statut_candidature(id_statut_candidature) ON DELETE RESTRICT;


--
-- Name: historique_statut historique_statut_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_statut
    ADD CONSTRAINT historique_statut_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL;


--
-- Name: mission mission_id_offre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mission
    ADD CONSTRAINT mission_id_offre_fkey FOREIGN KEY (id_offre) REFERENCES public.offre(id_offre) ON DELETE CASCADE;


--
-- Name: modele_message modele_message_id_statut_candidature_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modele_message
    ADD CONSTRAINT modele_message_id_statut_candidature_fkey FOREIGN KEY (id_statut_candidature) REFERENCES public.statut_candidature(id_statut_candidature) ON DELETE SET NULL;


--
-- Name: modele_message modele_message_id_type_message_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modele_message
    ADD CONSTRAINT modele_message_id_type_message_fkey FOREIGN KEY (id_type_message) REFERENCES public.type_message(id_type_message) ON DELETE RESTRICT;


--
-- Name: offre offre_id_direction_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offre
    ADD CONSTRAINT offre_id_direction_fkey FOREIGN KEY (id_direction) REFERENCES public.direction(id_direction) ON DELETE RESTRICT;


--
-- Name: offre offre_id_statut_offre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offre
    ADD CONSTRAINT offre_id_statut_offre_fkey FOREIGN KEY (id_statut_offre) REFERENCES public.statut_offre(id_statut_offre) ON DELETE RESTRICT;


--
-- Name: profil_competence profil_competence_id_competence_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_competence
    ADD CONSTRAINT profil_competence_id_competence_fkey FOREIGN KEY (id_competence) REFERENCES public.competence(id_competence) ON DELETE CASCADE;


--
-- Name: profil_competence profil_competence_id_offre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_competence
    ADD CONSTRAINT profil_competence_id_offre_fkey FOREIGN KEY (id_offre) REFERENCES public.offre(id_offre) ON DELETE CASCADE;


--
-- Name: profil_formation profil_formation_id_profil_offre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_formation
    ADD CONSTRAINT profil_formation_id_profil_offre_fkey FOREIGN KEY (id_profil_offre) REFERENCES public.profil_offre(id_profil_offre) ON DELETE CASCADE;


--
-- Name: profil_offre profil_offre_id_offre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_offre
    ADD CONSTRAINT profil_offre_id_offre_fkey FOREIGN KEY (id_offre) REFERENCES public.offre(id_offre) ON DELETE CASCADE;


--
-- Name: rendez_vous rendez_vous_id_candidature_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_id_candidature_fkey FOREIGN KEY (id_candidature) REFERENCES public.candidature(id_candidature) ON DELETE CASCADE;


--
-- Name: rendez_vous rendez_vous_id_mode_realisation_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_id_mode_realisation_fkey FOREIGN KEY (id_mode_realisation) REFERENCES public.mode_realisation(id_mode_realisation) ON DELETE RESTRICT;


--
-- Name: rendez_vous rendez_vous_id_statut_rendez_vous_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_id_statut_rendez_vous_fkey FOREIGN KEY (id_statut_rendez_vous) REFERENCES public.statut_rendez_vous(id_statut_rendez_vous) ON DELETE RESTRICT;


--
-- Name: rendez_vous rendez_vous_id_type_rendez_vous_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_id_type_rendez_vous_fkey FOREIGN KEY (id_type_rendez_vous) REFERENCES public.type_rendez_vous(id_type_rendez_vous) ON DELETE RESTRICT;


--
-- Name: rendez_vous rendez_vous_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

