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

CREATE SEQUENCE public.direction_id_direction_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.direction_id_direction_seq OWNER TO postgres;

--
-- Name: direction_id_direction_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.direction_id_direction_seq OWNED BY public.direction.id_direction;


--
-- Name: domaine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.domaine (
    id_domaine bigint NOT NULL,
    nom_domaine character varying(150) NOT NULL,
    id_direction bigint NOT NULL,
    valide boolean DEFAULT false NOT NULL,
    date_validation timestamp(0) with time zone,
    valide_par bigint,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone
);


ALTER TABLE public.domaine OWNER TO postgres;

--
-- Name: domaine_id_domaine_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.domaine_id_domaine_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.domaine_id_domaine_seq OWNER TO postgres;

--
-- Name: domaine_id_domaine_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.domaine_id_domaine_seq OWNED BY public.domaine.id_domaine;


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
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    CONSTRAINT chk_mission_ordre CHECK ((ordre > 0))
);


ALTER TABLE public.mission OWNER TO postgres;

--
-- Name: mission_id_mission_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mission_id_mission_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mission_id_mission_seq OWNER TO postgres;

--
-- Name: mission_id_mission_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mission_id_mission_seq OWNED BY public.mission.id_mission;


--
-- Name: offre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offre (
    id_offre bigint NOT NULL,
    titre_poste character varying(200) NOT NULL,
    id_direction bigint NOT NULL,
    description text,
    lieu character varying(200),
    id_type_contrat bigint,
    date_publication date,
    date_limite date,
    id_statut_offre bigint NOT NULL,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    CONSTRAINT chk_offre_dates CHECK (((date_limite IS NULL) OR (date_publication IS NULL) OR (date_limite >= date_publication)))
);


ALTER TABLE public.offre OWNER TO postgres;

--
-- Name: offre_id_offre_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.offre_id_offre_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offre_id_offre_seq OWNER TO postgres;

--
-- Name: offre_id_offre_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.offre_id_offre_seq OWNED BY public.offre.id_offre;


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
-- Name: profil_formation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profil_formation (
    id_profil_formation bigint NOT NULL,
    id_profil_offre bigint NOT NULL,
    niveau_min character varying(50),
    niveau_max character varying(50),
    domaine character varying(150),
    obligatoire boolean DEFAULT true NOT NULL,
    created_at timestamp(0) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_profil_formation_niveau CHECK (((niveau_min IS NOT NULL) OR (niveau_max IS NOT NULL) OR (domaine IS NOT NULL)))
);


ALTER TABLE public.profil_formation OWNER TO postgres;

--
-- Name: profil_formation_id_profil_formation_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.profil_formation_id_profil_formation_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profil_formation_id_profil_formation_seq OWNER TO postgres;

--
-- Name: profil_formation_id_profil_formation_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.profil_formation_id_profil_formation_seq OWNED BY public.profil_formation.id_profil_formation;


--
-- Name: profil_offre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profil_offre (
    id_profil_offre bigint NOT NULL,
    id_offre bigint NOT NULL,
    description text,
    experience_min_annees numeric(4,1),
    experience_max_annees numeric(4,1),
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    CONSTRAINT chk_profil_experience_max CHECK (((experience_max_annees IS NULL) OR (experience_max_annees >= COALESCE(experience_min_annees, (0)::numeric)))),
    CONSTRAINT chk_profil_experience_min CHECK (((experience_min_annees IS NULL) OR (experience_min_annees >= (0)::numeric)))
);


ALTER TABLE public.profil_offre OWNER TO postgres;

--
-- Name: profil_offre_id_profil_offre_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.profil_offre_id_profil_offre_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profil_offre_id_profil_offre_seq OWNER TO postgres;

--
-- Name: profil_offre_id_profil_offre_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.profil_offre_id_profil_offre_seq OWNED BY public.profil_offre.id_profil_offre;


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

CREATE SEQUENCE public.statut_candidature_id_statut_candidature_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.statut_candidature_id_statut_candidature_seq OWNER TO postgres;

--
-- Name: statut_candidature_id_statut_candidature_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.statut_candidature_id_statut_candidature_seq OWNED BY public.statut_candidature.id_statut_candidature;


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

CREATE SEQUENCE public.statut_offre_id_statut_offre_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.statut_offre_id_statut_offre_seq OWNER TO postgres;

--
-- Name: statut_offre_id_statut_offre_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.statut_offre_id_statut_offre_seq OWNED BY public.statut_offre.id_statut_offre;


--
-- Name: type_contrat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_contrat (
    id_type_contrat bigint NOT NULL,
    libelle character varying(50) NOT NULL
);


ALTER TABLE public.type_contrat OWNER TO postgres;

--
-- Name: type_contrat_id_type_contrat_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.type_contrat_id_type_contrat_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.type_contrat_id_type_contrat_seq OWNER TO postgres;

--
-- Name: type_contrat_id_type_contrat_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.type_contrat_id_type_contrat_seq OWNED BY public.type_contrat.id_type_contrat;


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

CREATE SEQUENCE public.type_demande_id_type_demande_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.type_demande_id_type_demande_seq OWNER TO postgres;

--
-- Name: type_demande_id_type_demande_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.type_demande_id_type_demande_seq OWNED BY public.type_demande.id_type_demande;


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
-- Name: direction id_direction; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direction ALTER COLUMN id_direction SET DEFAULT nextval('public.direction_id_direction_seq'::regclass);


--
-- Name: domaine id_domaine; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine ALTER COLUMN id_domaine SET DEFAULT nextval('public.domaine_id_domaine_seq'::regclass);


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
-- Name: mission id_mission; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mission ALTER COLUMN id_mission SET DEFAULT nextval('public.mission_id_mission_seq'::regclass);


--
-- Name: offre id_offre; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offre ALTER COLUMN id_offre SET DEFAULT nextval('public.offre_id_offre_seq'::regclass);


--
-- Name: profil_formation id_profil_formation; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_formation ALTER COLUMN id_profil_formation SET DEFAULT nextval('public.profil_formation_id_profil_formation_seq'::regclass);


--
-- Name: profil_offre id_profil_offre; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_offre ALTER COLUMN id_profil_offre SET DEFAULT nextval('public.profil_offre_id_profil_offre_seq'::regclass);


--
-- Name: statut_candidature id_statut_candidature; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_candidature ALTER COLUMN id_statut_candidature SET DEFAULT nextval('public.statut_candidature_id_statut_candidature_seq'::regclass);


--
-- Name: statut_offre id_statut_offre; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_offre ALTER COLUMN id_statut_offre SET DEFAULT nextval('public.statut_offre_id_statut_offre_seq'::regclass);


--
-- Name: type_contrat id_type_contrat; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_contrat ALTER COLUMN id_type_contrat SET DEFAULT nextval('public.type_contrat_id_type_contrat_seq'::regclass);


--
-- Name: type_demande id_type_demande; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_demande ALTER COLUMN id_type_demande SET DEFAULT nextval('public.type_demande_id_type_demande_seq'::regclass);


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
-- Data for Name: domaine; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.domaine (id_domaine, nom_domaine, id_direction, valide, date_validation, valide_par, created_at, updated_at) FROM stdin;
1	Developpement Web	1	t	2026-08-25 07:20:10+03	1	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
2	Developpement Mobile	1	t	2026-08-25 07:20:10+03	1	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
3	Base de Donnees	1	f	\N	\N	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
4	Recrutement	2	t	2026-08-25 07:20:10+03	1	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
5	Formation	2	f	\N	\N	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
6	Comptabilite	3	t	2026-08-25 07:20:10+03	1	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
7	Tresorerie	3	f	\N	\N	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
8	Communication Digitale	4	t	2026-08-25 07:20:10+03	1	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
9	Relations Publiques	4	f	\N	\N	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
10	Ventes B2B	5	t	2026-08-25 07:20:10+03	1	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
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
4	2026_08_20_132539_create_directions_table	1
5	2026_08_24_000000_create_recruitment_reference_tables	1
6	2026_08_24_000100_create_domaines_table	1
7	2026_08_24_000200_create_offres_tables	1
\.


--
-- Data for Name: mission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mission (id_mission, id_offre, description, ordre, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: offre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offre (id_offre, titre_poste, id_direction, description, lieu, id_type_contrat, date_publication, date_limite, id_statut_offre, created_at, updated_at) FROM stdin;
1	Developpeur Full Stack	1	Offre de recrutement pour le poste Developpeur Full Stack.	Antananarivo	1	2026-01-15	2026-03-15	2	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
2	Developpeur React Native	1	Offre de recrutement pour le poste Developpeur React Native.	Antananarivo	1	2026-02-01	2026-04-01	2	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
3	Data Engineer	1	Offre de recrutement pour le poste Data Engineer.	Antananarivo	1	2026-01-20	2026-03-20	2	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
4	Responsable Recrutement	2	Offre de recrutement pour le poste Responsable Recrutement.	Antananarivo	1	2026-01-10	2026-02-10	3	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
5	Comptable	3	Offre de recrutement pour le poste Comptable.	Antananarivo	1	2026-02-01	2026-04-01	1	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
6	Charge de Marketing Digital	4	Offre de recrutement pour le poste Charge de Marketing Digital.	Antananarivo	2	2026-01-25	2026-03-25	2	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
7	Commercial Senior	5	Offre de recrutement pour le poste Commercial Senior.	Antananarivo	1	2026-01-15	2026-03-15	2	2026-08-25 07:20:10+03	2026-08-25 07:20:10+03
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
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
-- Data for Name: type_contrat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_contrat (id_type_contrat, libelle) FROM stdin;
1	CDI
2	CDD
3	Stage
4	Interim
5	Consultance
\.


--
-- Data for Name: type_demande; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_demande (id_type_demande, libelle) FROM stdin;
1	Offre
2	Spontanee
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, role, email_verified_at, password, remember_token, created_at, updated_at) FROM stdin;
1	Administrateur RH	admin@alphaciment.local	admin	\N	$2y$12$TcL.IzyH7u5ehlsUuJsnHeXL9fIcAqSKkJj2.YvnV85/Ju5Wifws2	\N	2026-08-25 07:20:10	2026-08-25 07:20:10
\.


--
-- Name: direction_id_direction_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.direction_id_direction_seq', 5, true);


--
-- Name: domaine_id_domaine_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.domaine_id_domaine_seq', 10, true);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 7, true);


--
-- Name: mission_id_mission_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mission_id_mission_seq', 1, false);


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
-- Name: statut_candidature_id_statut_candidature_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.statut_candidature_id_statut_candidature_seq', 6, true);


--
-- Name: statut_offre_id_statut_offre_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.statut_offre_id_statut_offre_seq', 3, true);


--
-- Name: type_contrat_id_type_contrat_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_contrat_id_type_contrat_seq', 5, true);


--
-- Name: type_demande_id_type_demande_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_demande_id_type_demande_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


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
-- Name: direction direction_nom_direction_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direction
    ADD CONSTRAINT direction_nom_direction_unique UNIQUE (nom_direction);


--
-- Name: direction direction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direction
    ADD CONSTRAINT direction_pkey PRIMARY KEY (id_direction);


--
-- Name: domaine domaine_nom_domaine_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine
    ADD CONSTRAINT domaine_nom_domaine_unique UNIQUE (nom_domaine);


--
-- Name: domaine domaine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine
    ADD CONSTRAINT domaine_pkey PRIMARY KEY (id_domaine);


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
-- Name: profil_formation profil_formation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_formation
    ADD CONSTRAINT profil_formation_pkey PRIMARY KEY (id_profil_formation);


--
-- Name: profil_offre profil_offre_id_offre_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_offre
    ADD CONSTRAINT profil_offre_id_offre_unique UNIQUE (id_offre);


--
-- Name: profil_offre profil_offre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_offre
    ADD CONSTRAINT profil_offre_pkey PRIMARY KEY (id_profil_offre);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: statut_candidature statut_candidature_libelle_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_candidature
    ADD CONSTRAINT statut_candidature_libelle_unique UNIQUE (libelle);


--
-- Name: statut_candidature statut_candidature_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_candidature
    ADD CONSTRAINT statut_candidature_pkey PRIMARY KEY (id_statut_candidature);


--
-- Name: statut_offre statut_offre_libelle_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_offre
    ADD CONSTRAINT statut_offre_libelle_unique UNIQUE (libelle);


--
-- Name: statut_offre statut_offre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_offre
    ADD CONSTRAINT statut_offre_pkey PRIMARY KEY (id_statut_offre);


--
-- Name: type_contrat type_contrat_libelle_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_contrat
    ADD CONSTRAINT type_contrat_libelle_unique UNIQUE (libelle);


--
-- Name: type_contrat type_contrat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_contrat
    ADD CONSTRAINT type_contrat_pkey PRIMARY KEY (id_type_contrat);


--
-- Name: type_demande type_demande_libelle_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_demande
    ADD CONSTRAINT type_demande_libelle_unique UNIQUE (libelle);


--
-- Name: type_demande type_demande_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_demande
    ADD CONSTRAINT type_demande_pkey PRIMARY KEY (id_type_demande);


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
-- Name: idx_domaine_direction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_domaine_direction ON public.domaine USING btree (id_direction);


--
-- Name: idx_domaine_valide; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_domaine_valide ON public.domaine USING btree (valide);


--
-- Name: idx_mission_offre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mission_offre ON public.mission USING btree (id_offre);


--
-- Name: idx_offre_direction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offre_direction ON public.offre USING btree (id_direction);


--
-- Name: idx_offre_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offre_statut ON public.offre USING btree (id_statut_offre);


--
-- Name: idx_offre_type_contrat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offre_type_contrat ON public.offre USING btree (id_type_contrat);


--
-- Name: idx_profil_formation_profil; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profil_formation_profil ON public.profil_formation USING btree (id_profil_offre);


--
-- Name: idx_profil_offre_offre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profil_offre_offre ON public.profil_offre USING btree (id_offre);


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
-- Name: domaine domaine_id_direction_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine
    ADD CONSTRAINT domaine_id_direction_foreign FOREIGN KEY (id_direction) REFERENCES public.direction(id_direction) ON DELETE RESTRICT;


--
-- Name: domaine domaine_valide_par_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine
    ADD CONSTRAINT domaine_valide_par_foreign FOREIGN KEY (valide_par) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: mission mission_id_offre_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mission
    ADD CONSTRAINT mission_id_offre_foreign FOREIGN KEY (id_offre) REFERENCES public.offre(id_offre) ON DELETE CASCADE;


--
-- Name: offre offre_id_direction_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offre
    ADD CONSTRAINT offre_id_direction_foreign FOREIGN KEY (id_direction) REFERENCES public.direction(id_direction) ON DELETE RESTRICT;


--
-- Name: offre offre_id_statut_offre_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offre
    ADD CONSTRAINT offre_id_statut_offre_foreign FOREIGN KEY (id_statut_offre) REFERENCES public.statut_offre(id_statut_offre) ON DELETE RESTRICT;


--
-- Name: offre offre_id_type_contrat_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offre
    ADD CONSTRAINT offre_id_type_contrat_foreign FOREIGN KEY (id_type_contrat) REFERENCES public.type_contrat(id_type_contrat) ON DELETE RESTRICT;


--
-- Name: profil_formation profil_formation_id_profil_offre_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_formation
    ADD CONSTRAINT profil_formation_id_profil_offre_foreign FOREIGN KEY (id_profil_offre) REFERENCES public.profil_offre(id_profil_offre) ON DELETE CASCADE;


--
-- Name: profil_offre profil_offre_id_offre_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil_offre
    ADD CONSTRAINT profil_offre_id_offre_foreign FOREIGN KEY (id_offre) REFERENCES public.offre(id_offre) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

