import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import PostulerOffrePage from './frontOffice/PostulerOffrePage';
import CandidatureSpontaneePage from './frontOffice/CandidatureSpontaneePage';
import PublicOffresPage from './frontOffice/PublicOffresPage';
import {
    ArrowLeft,
    Award,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    CheckCircle2,
    Copy,
    Database,
    Download,
    Edit3,
    ExternalLink,
    Eye,
    FileText,
    Filter,
    GraduationCap,
    LayoutDashboard,
    ListChecks,
    LogOut,
    Plus,
    RefreshCw,
    Save,
    Search,
    Send,
    Share2,
    Trash2,
    Upload,
    User,
    UserCheck,
    Users,
    X,
} from 'lucide-react';

const backendUrl = (import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

let redirectingToLogin = false;

function backendPath(path) {
    return backendUrl ? `${backendUrl}${path}` : path;
}

function redirectToLogin() {
    const loginUrl = backendPath('/login');

    if (redirectingToLogin || window.location.href === loginUrl) {
        return;
    }

    redirectingToLogin = true;
    window.location.replace(loginUrl);
}

async function getPublicJson(url) {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
    }

    return response.json();
}

async function sendPublicFormData(url, formData, method = 'POST') {
    const response = await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
        },
        body: formData,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        let msg = payload.message ?? `Erreur HTTP ${response.status}`;
        if (payload.errors) {
            const errList = Object.values(payload.errors).flat().join(' | ');
            msg += ` (${errList})`;
        }
        throw new Error(msg);
    }

    return payload;
}

async function getJson(url) {
    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    if (response.status === 401) {
        redirectToLogin();
        return null;
    }

    if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
    }

    return response.json();
}

let csrfToken = null;

async function getCsrfToken() {
    if (csrfToken) {
        return csrfToken;
    }

    const response = await getJson('/api/csrf-token');
    csrfToken = response?.data?.token ?? '';

    return csrfToken;
}

async function sendJson(url, { body, method = 'POST' } = {}) {
    const token = await getCsrfToken();
    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': token,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
        redirectToLogin();
        return null;
    }

    if (response.status === 204) {
        return null;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload.message ?? `Erreur HTTP ${response.status}`);
    }

    return payload;
}

async function sendFormData(url, formData, method = 'POST') {
    const token = await getCsrfToken();
    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': token,
        },
        body: formData,
    });

    if (response.status === 401) {
        redirectToLogin();
        return null;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        let msg = payload.message ?? `Erreur HTTP ${response.status}`;
        if (payload.errors) {
            const errList = Object.values(payload.errors).flat().join(' | ');
            msg += ` (${errList})`;
        }
        throw new Error(msg);
    }

    return payload;
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('fr-FR').format(new Date(value));
}

const emptyOfferForm = {
    id: null,
    titre_poste: '',
    id_direction: '',
    description: '',
    lieu: '',
    id_type_contrat: '',
    date_publication: '',
    date_limite: '',
    id_statut_offre: '',
    profils: [{ description: '', type_valeur: '', valeur_min: '', valeur_max: '', valeur_attendue: '', unite_valeur: '' }],
    missions: [{ description: '', ordre: 1 }],
    formations: [{ niveau_min: '', niveau_max: '', domaine: '', obligatoire: true }],
    competences: [],
};

function offerPayload(form) {
    return {
        titre_poste: form.titre_poste.trim(),
        id_direction: form.id_direction ? Number(form.id_direction) : '',
        description: form.description.trim() || null,
        lieu: form.lieu.trim() || null,
        id_type_contrat: form.id_type_contrat ? Number(form.id_type_contrat) : null,
        date_publication: form.date_publication || null,
        date_limite: form.date_limite || null,
        id_statut_offre: form.id_statut_offre ? Number(form.id_statut_offre) : null,
        profils: form.profils.filter((p) => p.description.trim() || p.valeur_attendue.trim()),
        missions: form.missions.filter((m) => m.description.trim()),
        formations: form.formations.filter((f) => f.niveau_min.trim() || f.domaine.trim()),
        competences: form.competences,
    };
}

async function submitLogout() {
    try {
        await sendJson('/logout', { method: 'POST' });
    } finally {
        csrfToken = null;
        redirectToLogin();
    }
}

function App() {
    const [path, setPath] = useState(window.location.pathname);
    const [user, setUser] = useState(null);
    const [editingOffer, setEditingOffer] = useState(null);
    const [referentiels, setReferentiels] = useState({
        directions: [],
        statuts_offre: [],
        types_contrat: [],
    });
    const [competencesData, setCompetencesData] = useState({ competences: [], types: [] });
    const [bootstrapLoading, setBootstrapLoading] = useState(true);
    const [bootstrapError, setBootstrapError] = useState('');

    const isPublicPath = path.startsWith('/candidat/offres') ||
                         path.startsWith('/candidature-spontanee') ||
                         Boolean(path.match(/\/offres\/(\d+)\/postuler/)) ||
                         Boolean(path.match(/\/offre\/([^\/]+)/));

    useEffect(() => {
        const handlePopState = () => setPath(window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = useCallback((target) => {
        window.history.pushState({}, '', target);
        setPath(target);
    }, []);

    // Back-Office Load Base Data
    const loadBaseData = useCallback(async () => {
        if (isPublicPath) {
            setBootstrapLoading(false);
            return;
        }
        try {
            const [meResponse, referentielResponse, competencesResponse] = await Promise.all([
                getJson('/api/me'),
                getJson('/api/referentiels/recrutement'),
                getJson('/api/competences'),
            ]);

            if (!meResponse || !referentielResponse) {
                return;
            }

            setUser(meResponse.data);
            setReferentiels(referentielResponse.data);
            if (competencesResponse?.data) {
                setCompetencesData(competencesResponse.data);
            }
        } catch (error) {
            setBootstrapError(error.message);
        } finally {
            setBootstrapLoading(false);
        }
    }, [isPublicPath]);

    useEffect(() => {
        if (!isPublicPath) {
            loadBaseData();
        } else {
            setBootstrapLoading(false);
        }
    }, [loadBaseData, isPublicPath]);

    // Front-Office Routing (Public Candidates) - Placed AFTER ALL hooks to adhere to React Rules of Hooks
    if (path.startsWith('/candidat/offres')) {
        return <PublicOffresPage getJson={getPublicJson} onNavigate={navigate} />;
    }

    if (path.startsWith('/candidature-spontanee')) {
        return <CandidatureSpontaneePage getJson={getPublicJson} onNavigate={navigate} sendFormData={sendPublicFormData} />;
    }

    const offreSlugMatch = path.match(/\/offre\/([^\/]+)/);
    const postulerMatch = path.match(/\/offres\/(\d+)\/postuler/);
    const targetSlugOrId = offreSlugMatch ? offreSlugMatch[1] : (postulerMatch ? postulerMatch[1] : null);

    if (targetSlugOrId) {
        return (
            <PostulerOffrePage
                backendPath={backendPath}
                getJson={getPublicJson}
                idOffre={targetSlugOrId}
                onNavigate={navigate}
                sendFormData={sendPublicFormData}
            />
        );
    }

    const activeView = path.startsWith('/offres')
        ? 'offres'
        : path.startsWith('/candidatures')
        ? 'candidatures'
        : path.startsWith('/referentiels')
        ? 'referentiels'
        : 'dashboard';

    const referentielSubTab = path === '/referentiels/directions'
        ? 'directions'
        : path === '/referentiels/domaines'
        ? 'domaines'
        : path === '/referentiels/competences'
        ? 'competences'
        : 'all';

    function handleSelectOfferFromDashboard(offre) {
        setEditingOffer(offre);
        navigate('/offres');
    }

    return (
        <AppShell
            activePath={path}
            activeView={activeView}
            onNavigate={navigate}
            user={user}
        >
            {bootstrapError ? (
                <ErrorState message={bootstrapError} />
            ) : bootstrapLoading ? (
                <LoadingState />
            ) : activeView === 'offres' ? (
                <OffersView
                    canManage={user?.permissions?.includes('manage_offres') ?? false}
                    competencesData={competencesData}
                    initialEditingOffer={editingOffer}
                    onClearEditingOffer={() => setEditingOffer(null)}
                    onNavigate={navigate}
                    referentiels={referentiels}
                />
            ) : activeView === 'candidatures' ? (
                <CandidaturesView referentiels={referentiels} />
            ) : activeView === 'referentiels' ? (
                <ReferentialsView
                    canManage={user?.permissions?.includes('manage_referentiels') ?? false}
                    competencesData={competencesData}
                    initialSubTab={referentielSubTab}
                    onRefreshBase={loadBaseData}
                />
            ) : (
                <DashboardView onSelectOffer={handleSelectOfferFromDashboard} />
            )}
        </AppShell>
    );
}

function AppShell({ activePath, activeView, children, onNavigate, user }) {
    const [referentielsOpen, setReferentielsOpen] = useState(activeView === 'referentiels');

    useEffect(() => {
        if (activeView === 'referentiels') {
            setReferentielsOpen(true);
        }
    }, [activeView]);

    const navItems = [
        { id: 'dashboard', label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
        { id: 'offres', label: 'Offres', href: '/offres', icon: BriefcaseBusiness },
        { id: 'candidatures', label: 'Candidatures', href: '/candidatures', icon: UserCheck },
        { id: 'referentiels', label: 'Referentiels', href: '/referentiels', icon: Building2, hasSub: true },
    ];

    const referentielSubLinks = [
        { id: 'all', label: 'Tous les referentiels', href: '/referentiels' },
        { id: 'directions', label: 'Directions', href: '/referentiels/directions' },
        { id: 'domaines', label: 'Domaines', href: '/referentiels/domaines' },
        { id: 'competences', label: 'Competences', href: '/referentiels/competences' },
    ];

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand-block">
                    <span className="brand-mark">AC</span>
                    <div>
                        <strong>AlpA Ciment</strong>
                        <span>Recrutement</span>
                    </div>
                </div>

                <nav className="main-nav" aria-label="Navigation principale">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;

                        if (item.hasSub) {
                            return (
                                <React.Fragment key={item.id}>
                                    <div
                                        className={isActive ? 'nav-link active' : 'nav-link'}
                                        onClick={() => {
                                            if (!isActive) {
                                                onNavigate(item.href);
                                            }
                                            setReferentielsOpen((curr) => !curr);
                                        }}
                                        style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Icon aria-hidden="true" size={18} />
                                            <span>{item.label}</span>
                                        </div>
                                        {referentielsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>

                                    {referentielsOpen ? (
                                        <div className="sidebar-sub-menu">
                                            {referentielSubLinks.map((sub) => {
                                                const isSubActive = activePath === sub.href;

                                                return (
                                                    <a
                                                        className={isSubActive ? 'sub-nav-link active' : 'sub-nav-link'}
                                                        href={sub.href}
                                                        key={sub.id}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            onNavigate(sub.href);
                                                        }}
                                                    >
                                                        <span>• {sub.label}</span>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : null}
                                </React.Fragment>
                            );
                        }

                        return (
                            <a
                                aria-current={isActive ? 'page' : undefined}
                                className={isActive ? 'nav-link active' : 'nav-link'}
                                href={item.href}
                                key={item.id}
                                onClick={(event) => {
                                    event.preventDefault();
                                    onNavigate(item.href);
                                }}
                            >
                                <Icon aria-hidden="true" size={18} />
                                <span>{item.label}</span>
                            </a>
                        );
                    })}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #243746' }}>
                    <button
                        className="ghost-button"
                        onClick={() => onNavigate('/candidat/offres')}
                        style={{ width: '100%', justifyContent: 'center', color: '#f2b84b' }}
                        type="button"
                    >
                        <ExternalLink size={16} />
                        <span>Portail Candidats (Front)</span>
                    </button>
                </div>
            </aside>

            <div className="content-area">
                <header className="topbar">
                    <div>
                        <p className="eyebrow">Back-office RH</p>
                        <h1>
                            {activeView === 'offres'
                                ? "Offres d'emploi"
                                : activeView === 'candidatures'
                                ? 'Candidatures'
                                : activeView === 'referentiels'
                                ? 'Referentiels'
                                : 'Tableau de bord'}
                        </h1>
                    </div>

                    <div className="topbar-actions">
                        <div className="user-chip">
                            <span>{user?.name ?? 'Utilisateur'}</span>
                            <small>{user?.role ?? '-'}</small>
                        </div>
                        <button className="icon-button danger" onClick={submitLogout} title="Se deconnecter" type="button">
                            <LogOut aria-hidden="true" size={18} />
                            <span>Sortir</span>
                        </button>
                    </div>
                </header>

                <main className="workspace">{children}</main>
            </div>
        </div>
    );
}

function CandidaturesView({ referentiels }) {
    const [candidatures, setCandidatures] = useState([]);
    const [statutsList, setStatutsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCandidatureId, setSelectedCandidatureId] = useState(null);
    const [filters, setFilters] = useState({ q: '', statut: '', direction: '' });

    const loadCandidatures = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (filters.q) params.set('q', filters.q);
            if (filters.statut) params.set('statut', filters.statut);
            if (filters.direction) params.set('direction', filters.direction);

            const [candResponse, statutsResponse] = await Promise.all([
                getJson(`/api/candidatures?${params.toString()}`),
                getJson('/api/referentiels/statuts-candidature'),
            ]);

            setCandidatures(candResponse?.data ?? []);
            setStatutsList(statutsResponse?.data ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadCandidatures();
    }, [loadCandidatures]);

    if (selectedCandidatureId) {
        return (
            <CandidatureDetailView
                idCandidature={selectedCandidatureId}
                onBack={() => setSelectedCandidatureId(null)}
                onRefreshList={loadCandidatures}
                statutsList={statutsList}
            />
        );
    }

    return (
        <div className="view-stack">
            <section className="filter-bar">
                <label className="search-field">
                    <Search size={18} />
                    <input
                        onChange={(e) => setFilters((curr) => ({ ...curr, q: e.target.value }))}
                        placeholder="Rechercher un candidat (nom, email)..."
                        type="search"
                        value={filters.q}
                    />
                </label>

                <label>
                    <span>Statut</span>
                    <select
                        onChange={(e) => setFilters((curr) => ({ ...curr, statut: e.target.value }))}
                        value={filters.statut}
                    >
                        <option value="">Tous les statuts</option>
                        {statutsList.map((st) => (
                            <option key={st.id_statut_candidature} value={st.id_statut_candidature}>
                                {st.libelle}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Direction</span>
                    <select
                        onChange={(e) => setFilters((curr) => ({ ...curr, direction: e.target.value }))}
                        value={filters.direction}
                    >
                        <option value="">Toutes</option>
                        {referentiels.directions?.map((dir) => (
                            <option key={dir.id_direction} value={dir.id_direction}>
                                {dir.nom_direction}
                            </option>
                        ))}
                    </select>
                </label>

                <button className="filter-button" onClick={loadCandidatures} type="button">
                    <Filter size={17} />
                    <span>Filtrer</span>
                </button>
            </section>

            <section className="data-section">
                <div className="section-heading">
                    <div>
                        <h2>Candidatures reçues</h2>
                        <p>Gestion et suivi des dossiers de candidatures sur offre et spontanées.</p>
                    </div>
                    <button className="ghost-button" onClick={loadCandidatures} type="button">
                        <RefreshCw size={17} />
                        <span>Actualiser</span>
                    </button>
                </div>

                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState message={error} onRetry={loadCandidatures} />
                ) : !candidatures.length ? (
                    <div className="empty-state">Aucune candidature trouvée.</div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Candidat</th>
                                    <th>Type / Poste / Direction</th>
                                    <th>Date</th>
                                    <th>Documents</th>
                                    <th>Origine</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidatures.map((c) => (
                                    <tr key={c.id_candidature}>
                                        <td>
                                            <strong>{c.candidat?.prenom} {c.candidat?.nom}</strong>
                                            <span>{c.candidat?.email}</span>
                                        </td>
                                        <td>
                                            {c.offre ? (
                                                <strong style={{ color: 'var(--primary)' }}>Offre: {c.offre.titre_poste}</strong>
                                            ) : (
                                                <span className="badge amber">Spontanee ({c.direction?.nom_direction ?? 'Generale'})</span>
                                            )}
                                        </td>
                                        <td>{formatDate(c.date_candidature ?? c.created_at)}</td>
                                        <td>
                                            <span className="badge">{c.documents?.length ?? 0} fichier(s)</span>
                                        </td>
                                        <td>
                                            <small>{c.postule_depuis ?? 'Web'}</small>
                                        </td>
                                        <td>
                                            <span className="status-pill success">{c.statut?.libelle ?? 'Reçue'}</span>
                                        </td>
                                        <td>
                                            <button
                                                className="filter-button"
                                                onClick={() => setSelectedCandidatureId(c.id_candidature)}
                                                style={{ padding: '6px 12px', fontSize: '13px' }}
                                                type="button"
                                            >
                                                <Eye size={15} />
                                                <span>Voir dossier</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

function CandidatureDetailView({ idCandidature, onBack, onRefreshList, statutsList }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newStatusId, setNewStatusId] = useState('');
    const [commentaire, setCommentaire] = useState('');
    const [updating, setUpdating] = useState(false);

    const loadDetails = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const res = await getJson(`/api/candidatures/${idCandidature}`);
            setDetails(res?.data ?? null);
            if (res?.data?.statut?.id_statut_candidature) {
                setNewStatusId(String(res.data.statut.id_statut_candidature));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [idCandidature]);

    useEffect(() => {
        loadDetails();
    }, [loadDetails]);

    async function handleStatusUpdate(e) {
        e.preventDefault();
        if (!newStatusId) return;

        setUpdating(true);
        try {
            await sendJson(`/api/candidatures/${idCandidature}/statut`, {
                method: 'PATCH',
                body: {
                    id_statut_candidature: Number(newStatusId),
                    commentaire: commentaire.trim() || null,
                },
            });
            setCommentaire('');
            await loadDetails();
            if (onRefreshList) onRefreshList();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadDetails} />;
    }

    if (!details) {
        return <div className="empty-state">Dossier introuvable.</div>;
    }

    const photoDoc = (details.documents ?? []).find(
        (d) => d.type_document === 'Photo' || (d.mime_type && d.mime_type.startsWith('image/'))
    );

    return (
        <div className="view-stack">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <button className="ghost-button" onClick={onBack} type="button">
                    <ArrowLeft size={18} />
                    <span>Retour a la liste des candidatures</span>
                </button>
                <div className="section-heading-actions">
                    <span className="status-pill success" style={{ fontSize: '14px', padding: '6px 14px' }}>
                        Statut actuel : {details.statut?.libelle ?? 'Reçue'}
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
                {/* COLONNE GAUCHE: Image/Avatar, Nom, Coordonnées & Statut RH */}
                <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        {photoDoc ? (
                            <img
                                alt="Photo candidat"
                                src={backendPath(`/storage/${photoDoc.chemin_fichier}`)}
                                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', margin: '0 auto' }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    background: 'var(--soft-blue)',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto',
                                }}
                            >
                                <User size={48} />
                            </div>
                        )}
                        <h2 style={{ fontSize: '20px', margin: '12px 0 4px 0', color: 'var(--text)' }}>
                            {details.candidat?.prenom} {details.candidat?.nom}
                        </h2>
                        <span className="badge">{details.postule_depuis ?? 'Candidature Web'}</span>
                    </div>

                    <div className="detail-block" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', gap: '10px' }}>
                        <strong>Coordonnées du candidat</strong>
                        <p style={{ margin: 0 }}><strong>Email:</strong> {details.candidat?.email}</p>
                        <p style={{ margin: 0 }}><strong>Telephone:</strong> {details.candidat?.telephone ?? '-'}</p>
                        <p style={{ margin: 0 }}><strong>Ville:</strong> {details.candidat?.ville ?? '-'}</p>
                        {details.candidat?.linkedin_url ? (
                            <p style={{ margin: 0 }}>
                                <strong>LinkedIn:</strong>{' '}
                                <a href={details.candidat.linkedin_url} rel="noreferrer" target="_blank">
                                    Voir profil <ExternalLink size={13} />
                                </a>
                            </p>
                        ) : null}
                    </div>

                    <div className="detail-block" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                        <strong>Mise a jour du statut RH</strong>
                        <form onSubmit={handleStatusUpdate} style={{ display: 'grid', gap: '10px', marginTop: '8px' }}>
                            <select
                                onChange={(e) => setNewStatusId(e.target.value)}
                                value={newStatusId}
                            >
                                {statutsList.map((st) => (
                                    <option key={st.id_statut_candidature} value={st.id_statut_candidature}>
                                        {st.libelle}
                                    </option>
                                ))}
                            </select>
                            <textarea
                                onChange={(e) => setCommentaire(e.target.value)}
                                placeholder="Note ou commentaire d'evaluation RH..."
                                rows={3}
                                value={commentaire}
                            />
                            <button className="filter-button" disabled={updating} style={{ width: '100%' }} type="submit">
                                <Save size={16} />
                                <span>{updating ? 'Enregistrement...' : 'Valider le nouveau statut'}</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* COLONNE DROITE: Détails Candidature, Documents & Historique */}
                <div style={{ display: 'grid', gap: '20px' }}>
                    <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px' }}>Details de la candidature</h3>
                        <p>
                            <strong>Intitule :</strong>{' '}
                            {details.offre ? (
                                <strong style={{ color: 'var(--primary)' }}>Offre d'emploi : {details.offre.titre_poste}</strong>
                            ) : (
                                <span className="badge amber">Candidature Spontanee {details.domaine ? `(${details.domaine.nom_domaine})` : ''}</span>
                            )}
                        </p>
                        {details.direction ? <p><strong>Direction :</strong> {details.direction.nom_direction}</p> : null}
                        <p><strong>Date de soumission :</strong> {formatDate(details.date_candidature ?? details.created_at)}</p>

                        <div style={{ marginTop: '14px' }}>
                            <strong style={{ display: 'block', marginBottom: '6px' }}>Message de presentation / motivation :</strong>
                            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', lineHeight: '1.5' }}>
                                {details.message_motivation ?? 'Aucun message specifique fourni.'}
                            </div>
                        </div>
                    </div>

                    <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px' }}>
                            Documents & Pieces Jointes ({details.documents?.length ?? 0})
                        </h3>
                        <div className="document-grid">
                            {(details.documents ?? []).map((doc) => (
                                <div className="document-card" key={doc.id_document} style={{ padding: '14px' }}>
                                    <div className="document-card-info">
                                        <strong>{doc.nom_fichier}</strong>
                                        <span className="badge" style={{ marginTop: '4px' }}>{doc.type_document}</span>
                                    </div>
                                    <a
                                        className="filter-button"
                                        href={backendPath(`/storage/${doc.chemin_fichier}`)}
                                        rel="noreferrer"
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                        target="_blank"
                                        title="Telecharger / Consulter"
                                    >
                                        <Download size={15} />
                                        <span>Ouvrir</span>
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px' }}>Historique du traitement RH</h3>
                        <div className="history-timeline">
                            {(details.historique ?? []).map((h) => (
                                <div className="history-item" key={h.id_historique_statut}>
                                    <strong style={{ color: 'var(--primary)' }}>{h.statut_nouveau?.libelle ?? 'Statut mis a jour'}</strong>
                                    <small style={{ color: 'var(--text-muted)' }}>{formatDate(h.created_at)}</small>
                                    {h.commentaire ? <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{h.commentaire}</p> : null}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReferentialsView({ canManage, competencesData, initialSubTab = 'all', onRefreshBase }) {
    const [subTab, setSubTab] = useState(initialSubTab);
    const [directions, setDirections] = useState([]);
    const [domaines, setDomaines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [directionForm, setDirectionForm] = useState({ id: null, nom_direction: '' });
    const [domaineForm, setDomaineForm] = useState({ id: null, nom_domaine: '', id_direction: '', valide: false });
    const [competenceForm, setCompetenceForm] = useState({ nom_competence: '', id_type_competence: '' });

    useEffect(() => {
        setSubTab(initialSubTab);
    }, [initialSubTab]);

    const loadReferentials = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [directionsResponse, domainesResponse] = await Promise.all([
                getJson('/api/directions?per_page=50'),
                getJson('/api/domaines?per_page=50'),
            ]);

            setDirections(directionsResponse?.data ?? []);
            setDomaines(domainesResponse?.data ?? []);
            if (onRefreshBase) {
                await onRefreshBase();
            }
        } catch (caughtError) {
            setError(caughtError.message);
        } finally {
            setLoading(false);
        }
    }, [onRefreshBase]);

    useEffect(() => {
        loadReferentials();
    }, [loadReferentials]);

    async function saveDirection(event) {
        event.preventDefault();
        const name = directionForm.nom_direction.trim();

        if (!name) return;

        try {
            if (directionForm.id) {
                await sendJson(`/api/directions/${directionForm.id}`, {
                    method: 'PUT',
                    body: { nom_direction: name },
                });
            } else {
                await sendJson('/api/directions', {
                    body: { nom_direction: name },
                });
            }

            setDirectionForm({ id: null, nom_direction: '' });
            await loadReferentials();
        } catch (caughtError) {
            setError(caughtError.message);
        }
    }

    async function deleteDirection(direction) {
        const confirmed = window.confirm(`Supprimer la direction "${direction.nom_direction}" ?`);
        if (!confirmed) return;

        try {
            await sendJson(`/api/directions/${direction.id}`, { method: 'DELETE' });
            await loadReferentials();
        } catch (caughtError) {
            setError(caughtError.message);
        }
    }

    async function saveDomaine(event) {
        event.preventDefault();
        const name = domaineForm.nom_domaine.trim();

        if (!name || !domaineForm.id_direction) return;

        const payload = {
            nom_domaine: name,
            id_direction: Number(domaineForm.id_direction),
            valide: domaineForm.valide,
        };

        try {
            if (domaineForm.id) {
                await sendJson(`/api/domaines/${domaineForm.id}`, {
                    method: 'PUT',
                    body: payload,
                });
            } else {
                await sendJson('/api/domaines', {
                    body: payload,
                });
            }

            setDomaineForm({ id: null, nom_domaine: '', id_direction: '', valide: false });
            await loadReferentials();
        } catch (caughtError) {
            setError(caughtError.message);
        }
    }

    async function validateDomaine(domaine) {
        try {
            await sendJson(`/api/domaines/${domaine.id}/valider`, { method: 'PATCH' });
            await loadReferentials();
        } catch (caughtError) {
            setError(caughtError.message);
        }
    }

    async function deleteDomaine(domaine) {
        const confirmed = window.confirm(`Supprimer le domaine "${domaine.nom_domaine}" ?`);
        if (!confirmed) return;

        try {
            await sendJson(`/api/domaines/${domaine.id}`, { method: 'DELETE' });
            await loadReferentials();
        } catch (caughtError) {
            setError(caughtError.message);
        }
    }

    async function saveCompetence(event) {
        event.preventDefault();
        const name = competenceForm.nom_competence.trim();
        if (!name || !competenceForm.id_type_competence) return;

        try {
            await sendJson('/api/competences', {
                body: {
                    nom_competence: name,
                    id_type_competence: Number(competenceForm.id_type_competence),
                },
            });
            setCompetenceForm({ nom_competence: '', id_type_competence: '' });
            await loadReferentials();
        } catch (caughtError) {
            setError(caughtError.message);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    return (
        <div className="view-stack">
            {error ? <ErrorState message={error} onRetry={loadReferentials} /> : null}

            {/* Sub-menu navigation for Referentials */}
            <div className="sub-nav-tabs">
                <button
                    className={`sub-nav-tab ${subTab === 'all' ? 'active' : ''}`}
                    onClick={() => setSubTab('all')}
                    type="button"
                >
                    Tous les referentiels
                </button>
                <button
                    className={`sub-nav-tab ${subTab === 'directions' ? 'active' : ''}`}
                    onClick={() => setSubTab('directions')}
                    type="button"
                >
                    Directions ({directions.length})
                </button>
                <button
                    className={`sub-nav-tab ${subTab === 'domaines' ? 'active' : ''}`}
                    onClick={() => setSubTab('domaines')}
                    type="button"
                >
                    Domaines ({domaines.length})
                </button>
                <button
                    className={`sub-nav-tab ${subTab === 'competences' ? 'active' : ''}`}
                    onClick={() => setSubTab('competences')}
                    type="button"
                >
                    Competences ({competencesData.competences?.length ?? 0})
                </button>
            </div>

            {(subTab === 'all' || subTab === 'directions' || subTab === 'domaines') ? (
                <section className="management-grid">
                    {(subTab === 'all' || subTab === 'directions') ? (
                        <div className="data-section">
                            <div className="section-heading">
                                <div>
                                    <h2>Directions</h2>
                                    <p>{directions.length} direction(s)</p>
                                </div>
                                <button className="ghost-button" onClick={loadReferentials} type="button">
                                    <RefreshCw aria-hidden="true" size={17} />
                                    <span>Actualiser</span>
                                </button>
                            </div>

                            {canManage ? (
                                <form className="compact-form" onSubmit={saveDirection}>
                                    <label>
                                        <span>Nom de la direction</span>
                                        <input
                                            onChange={(event) => setDirectionForm((current) => ({ ...current, nom_direction: event.target.value }))}
                                            placeholder="Ex : Finance"
                                            value={directionForm.nom_direction}
                                        />
                                    </label>
                                    <div className="form-actions">
                                        <button className="filter-button" type="submit">
                                            {directionForm.id ? <Save aria-hidden="true" size={17} /> : <Plus aria-hidden="true" size={17} />}
                                            <span>{directionForm.id ? 'Enregistrer' : 'Ajouter'}</span>
                                        </button>
                                        {directionForm.id ? (
                                            <button className="ghost-button" onClick={() => setDirectionForm({ id: null, nom_direction: '' })} type="button">
                                                <X aria-hidden="true" size={17} />
                                                <span>Annuler</span>
                                            </button>
                                        ) : null}
                                    </div>
                                </form>
                            ) : null}

                            <SimpleTable
                                columns={['Direction', 'Domaines', 'Offres', 'Actions']}
                                emptyLabel="Aucune direction."
                                rows={directions.map((direction) => [
                                    <strong>{direction.nom_direction}</strong>,
                                    direction.domaines_count ?? 0,
                                    direction.offres_count ?? 0,
                                    canManage ? (
                                        <RowActions
                                            onDelete={() => deleteDirection(direction)}
                                            onEdit={() => setDirectionForm({ id: direction.id, nom_direction: direction.nom_direction })}
                                        />
                                    ) : (
                                        '-'
                                    ),
                                ])}
                            />
                        </div>
                    ) : null}

                    {(subTab === 'all' || subTab === 'domaines') ? (
                        <div className="data-section">
                            <div className="section-heading">
                                <div>
                                    <h2>Domaines</h2>
                                    <p>{domaines.filter((domaine) => !domaine.valide).length} en attente</p>
                                </div>
                            </div>

                            {canManage ? (
                                <form className="compact-form" onSubmit={saveDomaine}>
                                    <label>
                                        <span>Nom du domaine</span>
                                        <input
                                            onChange={(event) => setDomaineForm((current) => ({ ...current, nom_domaine: event.target.value }))}
                                            placeholder="Ex : Comptabilite"
                                            value={domaineForm.nom_domaine}
                                        />
                                    </label>
                                    <label>
                                        <span>Direction</span>
                                        <select
                                            onChange={(event) => setDomaineForm((current) => ({ ...current, id_direction: event.target.value }))}
                                            value={domaineForm.id_direction}
                                        >
                                            <option value="">Choisir</option>
                                            {directions.map((direction) => (
                                                <option key={direction.id} value={direction.id}>
                                                    {direction.nom_direction}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="checkbox-line">
                                        <input
                                            checked={domaineForm.valide}
                                            onChange={(event) => setDomaineForm((current) => ({ ...current, valide: event.target.checked }))}
                                            type="checkbox"
                                        />
                                        <span>Domaine valide</span>
                                    </label>
                                    <div className="form-actions">
                                        <button className="filter-button" type="submit">
                                            {domaineForm.id ? <Save aria-hidden="true" size={17} /> : <Plus aria-hidden="true" size={17} />}
                                            <span>{domaineForm.id ? 'Enregistrer' : 'Ajouter'}</span>
                                        </button>
                                        {domaineForm.id ? (
                                            <button className="ghost-button" onClick={() => setDomaineForm({ id: null, nom_domaine: '', id_direction: '', valide: false })} type="button">
                                                <X aria-hidden="true" size={17} />
                                                <span>Annuler</span>
                                            </button>
                                        ) : null}
                                    </div>
                                </form>
                            ) : null}

                            <SimpleTable
                                columns={['Domaine', 'Direction', 'Statut', 'Actions']}
                                emptyLabel="Aucun domaine."
                                rows={domaines.map((domaine) => [
                                    <strong>{domaine.nom_domaine}</strong>,
                                    domaine.direction?.nom ?? '-',
                                    <span className={domaine.valide ? 'status-pill success' : 'status-pill warning'}>
                                        {domaine.valide ? 'Valide' : 'En attente'}
                                    </span>,
                                    canManage ? (
                                        <RowActions
                                            extra={
                                                !domaine.valide ? (
                                                    <button className="row-button success" onClick={() => validateDomaine(domaine)} title="Valider" type="button">
                                                        <CheckCircle2 aria-hidden="true" size={16} />
                                                    </button>
                                                ) : null
                                            }
                                            onDelete={() => deleteDomaine(domaine)}
                                            onEdit={() =>
                                                setDomaineForm({
                                                    id: domaine.id,
                                                    nom_domaine: domaine.nom_domaine,
                                                    id_direction: domaine.direction?.id ? String(domaine.direction.id) : '',
                                                    valide: domaine.valide,
                                                })
                                            }
                                        />
                                    ) : (
                                        '-'
                                    ),
                                ])}
                            />
                        </div>
                    ) : null}
                </section>
            ) : null}

            {(subTab === 'all' || subTab === 'competences') ? (
                <section className="data-section">
                    <div className="section-heading">
                        <div>
                            <h2>Referentiel des Competences</h2>
                            <p>{competencesData.competences?.length ?? 0} competence(s) enregistree(s)</p>
                        </div>
                    </div>

                    {canManage ? (
                        <form className="compact-form" onSubmit={saveCompetence} style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                            <label>
                                <span>Nom de la competence</span>
                                <input
                                    onChange={(e) => setCompetenceForm((curr) => ({ ...curr, nom_competence: e.target.value }))}
                                    placeholder="Ex: Excel, Anglais, Docker..."
                                    required
                                    value={competenceForm.nom_competence}
                                />
                            </label>
                            <label>
                                <span>Type de competence</span>
                                <select
                                    onChange={(e) => setCompetenceForm((curr) => ({ ...curr, id_type_competence: e.target.value }))}
                                    required
                                    value={competenceForm.id_type_competence}
                                >
                                    <option value="">Choisir le type</option>
                                    {competencesData.types?.map((type) => (
                                        <option key={type.id_type_competence} value={type.id_type_competence}>
                                            {type.libelle}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="form-actions" style={{ alignItems: 'flex-end' }}>
                                <button className="filter-button" type="submit">
                                    <Plus aria-hidden="true" size={17} />
                                    <span>Ajouter la competence</span>
                                </button>
                            </div>
                        </form>
                    ) : null}

                    <SimpleTable
                        columns={['Competence', 'Type', 'Statut']}
                        emptyLabel="Aucune competence enregistree."
                        rows={(competencesData.competences ?? []).map((c) => [
                            <strong>{c.nom}</strong>,
                            <span className="badge">{c.type ?? 'Technique'}</span>,
                            <span className="badge green">Actif</span>,
                        ])}
                    />
                </section>
            ) : null}
        </div>
    );
}

function SimpleTable({ columns, emptyLabel, rows }) {
    if (!rows.length) {
        return <div className="empty-state">{emptyLabel}</div>;
    }

    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column}>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RowActions({ extra = null, onDelete, onEdit }) {
    return (
        <div className="row-actions">
            {extra}
            {onEdit ? (
                <button className="row-button" onClick={onEdit} title="Modifier" type="button">
                    <Edit3 aria-hidden="true" size={16} />
                </button>
            ) : null}
            {onDelete ? (
                <button className="row-button danger" onClick={onDelete} title="Supprimer" type="button">
                    <Trash2 aria-hidden="true" size={16} />
                </button>
            ) : null}
        </div>
    );
}

function DashboardView({ onSelectOffer }) {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await getJson('/api/dashboard');
            setDashboard(response?.data ?? null);
        } catch (caughtError) {
            setError(caughtError.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    if (error) {
        return <ErrorState message={error} onRetry={loadDashboard} />;
    }

    if (loading || !dashboard) {
        return <LoadingState />;
    }

    const kpis = dashboard.kpis ?? {};

    return (
        <div className="view-stack">
            <section className="kpi-grid" aria-label="Indicateurs principaux">
                <KpiCard icon={BriefcaseBusiness} label="Offres publiees" tone="blue" value={kpis.offres_publiees} />
                <KpiCard icon={Database} label="Offres total" tone="green" value={kpis.offres_total} />
                <KpiCard icon={Users} label="Candidatures sur offre" tone="neutral" value={kpis.candidatures_sur_offre} />
                <KpiCard icon={CalendarDays} label="Domaines en attente" tone="amber" value={kpis.domaines_en_attente} />
            </section>

            <section className="data-section">
                <div className="section-heading">
                    <div>
                        <h2>Offres recentes</h2>
                        <p>Cliquer sur une offre pour ouvrir son formulaire de modification complet.</p>
                    </div>
                    <button className="ghost-button" onClick={loadDashboard} type="button">
                        <RefreshCw aria-hidden="true" size={17} />
                        <span>Actualiser</span>
                    </button>
                </div>

                <OffersTable compact offers={dashboard.offres_recentes ?? []} onSelectOffer={onSelectOffer} />
            </section>
        </div>
    );
}

function KpiCard({ icon: Icon, label, tone, value }) {
    return (
        <article className={`kpi-card ${tone}`}>
            <div className="kpi-icon">
                <Icon aria-hidden="true" size={20} />
            </div>
            <span>{label}</span>
            <strong>{value ?? 0}</strong>
        </article>
    );
}

function OffersView({ canManage, competencesData, initialEditingOffer = null, onClearEditingOffer = null, onNavigate = null, referentiels }) {
    const [viewMode, setViewMode] = useState(initialEditingOffer ? 'form' : 'list');
    const [filters, setFilters] = useState({
        q: '',
        direction: '',
        statut: '',
        type_contrat: '',
        page: 1,
    });
    const [offersResponse, setOffersResponse] = useState({ data: [], meta: null });
    const [offerForm, setOfferForm] = useState(emptyOfferForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');

    const defaultStatusId = useMemo(
        () => referentiels.statuts_offre?.find((statut) => statut.libelle === 'Brouillon')?.id_statut_offre ?? '',
        [referentiels.statuts_offre],
    );

    const queryString = useMemo(() => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });

        params.set('per_page', '10');

        return params.toString();
    }, [filters]);

    const loadOffers = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await getJson(`/api/offres?${queryString}`);
            setOffersResponse(response ?? { data: [], meta: null });
        } catch (caughtError) {
            setError(caughtError.message);
        } finally {
            setLoading(false);
        }
    }, [queryString]);

    useEffect(() => {
        loadOffers();
    }, [loadOffers]);

    useEffect(() => {
        if (initialEditingOffer) {
            editOffer(initialEditingOffer);
            if (onClearEditingOffer) {
                onClearEditingOffer();
            }
        }
    }, [initialEditingOffer, onClearEditingOffer]);

    useEffect(() => {
        if (!offerForm.id && !offerForm.id_statut_offre && defaultStatusId) {
            setOfferForm((current) => ({
                ...current,
                id_statut_offre: String(defaultStatusId),
            }));
        }
    }, [defaultStatusId, offerForm.id, offerForm.id_statut_offre]);

    function updateFilter(name, value) {
        setFilters((current) => ({
            ...current,
            [name]: value,
            page: 1,
        }));
    }

    function changePage(page) {
        setFilters((current) => ({
            ...current,
            page,
        }));
    }

    function updateOfferForm(name, value) {
        setOfferForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function addProfil() {
        setOfferForm((curr) => ({
            ...curr,
            profils: [...curr.profils, { description: '', type_valeur: '', valeur_min: '', valeur_max: '', valeur_attendue: '', unite_valeur: '' }],
        }));
    }

    function updateProfil(index, field, value) {
        setOfferForm((curr) => {
            const updated = [...curr.profils];
            updated[index] = { ...updated[index], [field]: value };
            return { ...curr, profils: updated };
        });
    }

    function removeProfil(index) {
        setOfferForm((curr) => ({
            ...curr,
            profils: curr.profils.filter((_, i) => i !== index),
        }));
    }

    function addMission() {
        setOfferForm((curr) => ({
            ...curr,
            missions: [...curr.missions, { description: '', ordre: curr.missions.length + 1 }],
        }));
    }

    function updateMission(index, value) {
        setOfferForm((curr) => {
            const updated = [...curr.missions];
            updated[index] = { ...updated[index], description: value };
            return { ...curr, missions: updated };
        });
    }

    function removeMission(index) {
        setOfferForm((curr) => ({
            ...curr,
            missions: curr.missions.filter((_, i) => i !== index),
        }));
    }

    function addFormation() {
        setOfferForm((curr) => ({
            ...curr,
            formations: [...curr.formations, { niveau_min: '', niveau_max: '', domaine: '', obligatoire: true }],
        }));
    }

    function updateFormation(index, field, value) {
        setOfferForm((curr) => {
            const updated = [...curr.formations];
            updated[index] = { ...updated[index], [field]: value };
            return { ...curr, formations: updated };
        });
    }

    function removeFormation(index) {
        setOfferForm((curr) => ({
            ...curr,
            formations: curr.formations.filter((_, i) => i !== index),
        }));
    }

    function toggleCompetence(id_competence) {
        setOfferForm((curr) => {
            const exists = curr.competences.find((c) => c.id_competence === id_competence);
            if (exists) {
                return {
                    ...curr,
                    competences: curr.competences.filter((c) => c.id_competence !== id_competence),
                };
            }
            return {
                ...curr,
                competences: [...curr.competences, { id_competence, niveau_requis: 'Intermediaire' }],
            };
        });
    }

    function updateCompetenceNiveau(id_competence, niveau_requis) {
        setOfferForm((curr) => ({
            ...curr,
            competences: curr.competences.map((c) => (c.id_competence === id_competence ? { ...c, niveau_requis } : c)),
        }));
    }

    function resetOfferForm() {
        setFormError('');
        setOfferForm({
            ...emptyOfferForm,
            id_statut_offre: defaultStatusId ? String(defaultStatusId) : '',
        });
    }

    function openNewOfferForm() {
        resetOfferForm();
        setViewMode('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function editOffer(offre) {
        setFormError('');
        const mappedProfils = offre.profils?.length
            ? offre.profils.map((p) => ({
                  description: p.description ?? '',
                  type_valeur: p.type_valeur ?? '',
                  valeur_min: p.valeur_min ?? '',
                  valeur_max: p.valeur_max ?? '',
                  valeur_attendue: p.valeur_attendue ?? '',
                  unite_valeur: p.unite_valeur ?? '',
              }))
            : offre.profil
            ? [
                  {
                      description: offre.profil.description ?? '',
                      type_valeur: offre.profil.type_valeur ?? '',
                      valeur_min: offre.profil.valeur_min ?? '',
                      valeur_max: offre.profil.valeur_max ?? '',
                      valeur_attendue: offre.profil.valeur_attendue ?? '',
                      unite_valeur: offre.profil.unite_valeur ?? '',
                  },
              ]
            : emptyOfferForm.profils;

        setOfferForm({
            id: offre.id,
            titre_poste: offre.titre_poste ?? '',
            id_direction: offre.direction?.id ? String(offre.direction.id) : '',
            description: offre.description ?? '',
            lieu: offre.lieu ?? '',
            id_type_contrat: offre.type_contrat?.id ? String(offre.type_contrat.id) : '',
            date_publication: offre.date_publication ?? '',
            date_limite: offre.date_limite ?? '',
            id_statut_offre: offre.statut?.id ? String(offre.statut.id) : defaultStatusId ? String(defaultStatusId) : '',
            profils: mappedProfils,
            missions: offre.missions?.length
                ? offre.missions.map((m) => ({ description: m.description, ordre: m.ordre }))
                : [{ description: '', ordre: 1 }],
            formations: offre.formations?.length
                ? offre.formations.map((f) => ({
                      niveau_min: f.niveau_min ?? '',
                      niveau_max: f.niveau_max ?? '',
                      domaine: f.domaine ?? '',
                      obligatoire: f.obligatoire ?? true,
                  }))
                : [{ niveau_min: '', niveau_max: '', domaine: '', obligatoire: true }],
            competences: offre.competences?.length
                ? offre.competences.map((c) => ({ id_competence: c.id, niveau_requis: c.niveau_requis ?? 'Intermediaire' }))
                : [],
        });
        setViewMode('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function saveOffer(event) {
        event.preventDefault();
        setSaving(true);
        setFormError('');

        try {
            await sendJson(offerForm.id ? `/api/offres/${offerForm.id}` : '/api/offres', {
                body: offerPayload(offerForm),
                method: offerForm.id ? 'PUT' : 'POST',
            });
            resetOfferForm();
            setViewMode('list');
            await loadOffers();
        } catch (caughtError) {
            setFormError(caughtError.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteOffer(offre) {
        const confirmed = window.confirm(`Supprimer l'offre "${offre.titre_poste}" ?`);

        if (!confirmed) return;

        setFormError('');

        try {
            await sendJson(`/api/offres/${offre.id}`, { method: 'DELETE' });
            await loadOffers();
        } catch (caughtError) {
            setFormError(caughtError.message);
        }
    }

    async function changeOfferStatus(offre, action) {
        setFormError('');

        try {
            await sendJson(`/api/offres/${offre.id}/${action}`, { method: 'PATCH' });
            await loadOffers();
        } catch (caughtError) {
            setFormError(caughtError.message);
        }
    }

    const renderOfferActions = canManage
        ? (offre) => {
              const currentStatusObj = referentiels.statuts_offre?.find((s) => s.id_statut_offre === offre.statut?.id);
              const currentOrder = currentStatusObj?.ordre_workflow ?? 0;
              const publieeOrder = referentiels.statuts_offre?.find((s) => s.libelle === 'Publiee' || s.libelle === 'Publiée')?.ordre_workflow ?? 2;
              const clotureeOrder = referentiels.statuts_offre?.find((s) => s.libelle === 'Cloturee' || s.libelle === 'Clôturée')?.ordre_workflow ?? 3;

              const canPublish = currentOrder < publieeOrder;
              const canClose = currentOrder < clotureeOrder;

              return (
                  <RowActions
                      extra={
                          <>
                              {canPublish ? (
                                  <button
                                      className="row-button success"
                                      onClick={() => changeOfferStatus(offre, 'publier')}
                                      title="Publier l'offre"
                                      type="button"
                                  >
                                      <CheckCircle2 aria-hidden="true" size={16} />
                                  </button>
                              ) : null}
                              {canClose ? (
                                  <button
                                      className="row-button"
                                      onClick={() => changeOfferStatus(offre, 'cloturer')}
                                      title="Cloturer l'offre"
                                      type="button"
                                  >
                                      <X aria-hidden="true" size={16} />
                                  </button>
                              ) : null}
                          </>
                      }
                      onDelete={() => deleteOffer(offre)}
                      onEdit={() => editOffer(offre)}
                  />
              );
          }
        : null;

    const meta = offersResponse.meta;

    if (viewMode === 'form') {
        return (
            <div className="view-stack">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <button
                        className="ghost-button"
                        onClick={() => {
                            resetOfferForm();
                            setViewMode('list');
                        }}
                        type="button"
                    >
                        <ArrowLeft size={18} />
                        <span>Retour a la liste des offres</span>
                    </button>
                </div>

                <section className="data-section">
                    <div className="section-heading">
                        <div>
                            <h2>{offerForm.id ? 'Modifier une offre' : 'Nouvelle offre'}</h2>
                            <p>Formulaire de saisie complete de l'offre, des profils, missions, formations et competences.</p>
                        </div>
                    </div>

                    <form className="compact-form offer-form" onSubmit={saveOffer}>
                        <div className="form-sub-header">
                            <BriefcaseBusiness size={18} />
                            <span>Informations Principales</span>
                        </div>

                        <label>
                            <span>Poste</span>
                            <input
                                name="titre_poste"
                                onChange={(event) => updateOfferForm('titre_poste', event.target.value)}
                                required
                                type="text"
                                value={offerForm.titre_poste}
                            />
                        </label>

                        <label>
                            <span>Direction</span>
                            <select
                                name="id_direction"
                                onChange={(event) => updateOfferForm('id_direction', event.target.value)}
                                required
                                value={offerForm.id_direction}
                            >
                                <option value="">Choisir</option>
                                {referentiels.directions?.map((direction) => (
                                    <option key={direction.id_direction} value={direction.id_direction}>
                                        {direction.nom_direction}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Contrat</span>
                            <select
                                name="id_type_contrat"
                                onChange={(event) => updateOfferForm('id_type_contrat', event.target.value)}
                                value={offerForm.id_type_contrat}
                            >
                                <option value="">Non precise</option>
                                {referentiels.types_contrat?.map((contrat) => (
                                    <option key={contrat.id_type_contrat} value={contrat.id_type_contrat}>
                                        {contrat.libelle}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Statut</span>
                            <select
                                name="id_statut_offre"
                                onChange={(event) => updateOfferForm('id_statut_offre', event.target.value)}
                                value={offerForm.id_statut_offre}
                            >
                                <option value="">Brouillon par defaut</option>
                                {referentiels.statuts_offre?.map((statut) => {
                                    const currentStatusObj = referentiels.statuts_offre?.find(
                                        (s) => String(s.id_statut_offre) === String(offerForm.id_statut_offre),
                                    );
                                    const currentOrder = currentStatusObj?.ordre_workflow ?? 0;
                                    const isCurrent = String(statut.id_statut_offre) === String(offerForm.id_statut_offre);
                                    const isHigherOrder = (statut.ordre_workflow ?? 0) > currentOrder;
                                    const isDisabled = offerForm.id && !isCurrent && !isHigherOrder;

                                    return (
                                        <option
                                            disabled={isDisabled}
                                            key={statut.id_statut_offre}
                                            value={statut.id_statut_offre}
                                        >
                                            {statut.libelle} {isDisabled ? '(Non autorise - regression)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </label>

                        <label>
                            <span>Lieu</span>
                            <input
                                name="lieu"
                                onChange={(event) => updateOfferForm('lieu', event.target.value)}
                                type="text"
                                value={offerForm.lieu}
                            />
                        </label>

                        <label>
                            <span>Date publication</span>
                            <input
                                name="date_publication"
                                onChange={(event) => updateOfferForm('date_publication', event.target.value)}
                                type="date"
                                value={offerForm.date_publication}
                            />
                        </label>

                        <label>
                            <span>Date limite</span>
                            <input
                                name="date_limite"
                                onChange={(event) => updateOfferForm('date_limite', event.target.value)}
                                type="date"
                                value={offerForm.date_limite}
                            />
                        </label>

                        <label className="full-span">
                            <span>Description du poste</span>
                            <textarea
                                name="description"
                                onChange={(event) => updateOfferForm('description', event.target.value)}
                                rows={3}
                                value={offerForm.description}
                            />
                        </label>

                        <div className="form-sub-header">
                            <UserCheck size={18} />
                            <span>Criteres de profil chiffres / attendus (Multiples)</span>
                        </div>

                        <div className="full-span" style={{ display: 'grid', gap: '12px' }}>
                            {offerForm.profils.map((prof, index) => (
                                <div
                                    key={index}
                                    style={{
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        background: '#fafbfc',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                                        gap: '10px',
                                    }}
                                >
                                    <label className="full-span">
                                        <span>Exigence / Critere #{index + 1}</span>
                                        <input
                                            onChange={(e) => updateProfil(index, 'description', e.target.value)}
                                            placeholder="Ex: Experience en management d'equipe"
                                            value={prof.description}
                                        />
                                    </label>
                                    <label>
                                        <span>Valeur cible</span>
                                        <input
                                            onChange={(e) => updateProfil(index, 'valeur_attendue', e.target.value)}
                                            placeholder="Ex: 5"
                                            value={prof.valeur_attendue}
                                        />
                                    </label>
                                    <label>
                                        <span>Valeur Min</span>
                                        <input
                                            onChange={(e) => updateProfil(index, 'valeur_min', e.target.value)}
                                            placeholder="Ex: 2"
                                            value={prof.valeur_min}
                                        />
                                    </label>
                                    <label>
                                        <span>Valeur Max</span>
                                        <input
                                            onChange={(e) => updateProfil(index, 'valeur_max', e.target.value)}
                                            placeholder="Ex: 10"
                                            value={prof.valeur_max}
                                        />
                                    </label>
                                    <label>
                                        <span>Unite</span>
                                        <input
                                            onChange={(e) => updateProfil(index, 'unite_valeur', e.target.value)}
                                            placeholder="Ex: ans, score"
                                            value={prof.unite_valeur}
                                        />
                                    </label>

                                    {offerForm.profils.length > 1 ? (
                                        <div className="full-span" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button className="ghost-button danger" onClick={() => removeProfil(index)} type="button">
                                                <Trash2 size={16} />
                                                <span>Supprimer ce critere</span>
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                            <button className="ghost-button" onClick={addProfil} style={{ justifySelf: 'start' }} type="button">
                                <Plus size={16} />
                                <span>Ajouter un critere de profil</span>
                            </button>
                        </div>

                        <div className="form-sub-header">
                            <ListChecks size={18} />
                            <span>Missions du poste</span>
                        </div>

                        <div className="full-span" style={{ display: 'grid', gap: '8px' }}>
                            {offerForm.missions.map((mission, index) => (
                                <div className="dynamic-row" key={index}>
                                    <input
                                        onChange={(e) => updateMission(index, e.target.value)}
                                        placeholder={`Mission #${index + 1}...`}
                                        value={mission.description}
                                    />
                                    {offerForm.missions.length > 1 ? (
                                        <button className="row-button danger" onClick={() => removeMission(index)} type="button">
                                            <Trash2 size={16} />
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                            <button className="ghost-button" onClick={addMission} style={{ justifySelf: 'start' }} type="button">
                                <Plus size={16} />
                                <span>Ajouter une mission</span>
                            </button>
                        </div>

                        <div className="form-sub-header">
                            <GraduationCap size={18} />
                            <span>Formations requises</span>
                        </div>

                        <div className="full-span" style={{ display: 'grid', gap: '8px' }}>
                            {offerForm.formations.map((formation, index) => (
                                <div className="dynamic-row" key={index}>
                                    <input
                                        onChange={(e) => updateFormation(index, 'niveau_min', e.target.value)}
                                        placeholder="Niveau (ex: Bac+5, Master)"
                                        value={formation.niveau_min}
                                    />
                                    <input
                                        onChange={(e) => updateFormation(index, 'domaine', e.target.value)}
                                        placeholder="Domaine (ex: Informatique, Finance)"
                                        value={formation.domaine}
                                    />
                                    <label className="checkbox-line" style={{ width: 'auto' }}>
                                        <input
                                            checked={formation.obligatoire}
                                            onChange={(e) => updateFormation(index, 'obligatoire', e.target.checked)}
                                            type="checkbox"
                                        />
                                        <span>Obligatoire</span>
                                    </label>
                                    {offerForm.formations.length > 1 ? (
                                        <button className="row-button danger" onClick={() => removeFormation(index)} type="button">
                                            <Trash2 size={16} />
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                            <button className="ghost-button" onClick={addFormation} style={{ justifySelf: 'start' }} type="button">
                                <Plus size={16} />
                                <span>Ajouter une formation</span>
                            </button>
                        </div>

                        <div className="form-sub-header">
                            <Award size={18} />
                            <span>Competences requises</span>
                        </div>

                        <div className="competence-selector">
                            {(competencesData.competences ?? []).map((comp) => {
                                const selectedObj = offerForm.competences.find((c) => c.id_competence === comp.id);
                                const isSelected = Boolean(selectedObj);

                                return (
                                    <div className={`competence-item ${isSelected ? 'selected' : ''}`} key={comp.id}>
                                        <div className="competence-item-header">
                                            <span>{comp.nom}</span>
                                            <input
                                                checked={isSelected}
                                                onChange={() => toggleCompetence(comp.id)}
                                                type="checkbox"
                                            />
                                        </div>
                                        {isSelected ? (
                                            <select
                                                onChange={(e) => updateCompetenceNiveau(comp.id, e.target.value)}
                                                style={{ height: '32px', fontSize: '12px' }}
                                                value={selectedObj.niveau_requis ?? 'Intermediaire'}
                                            >
                                                <option value="Debutant">Debutant</option>
                                                <option value="Intermediaire">Intermediaire</option>
                                                <option value="Avance">Avance</option>
                                                <option value="Expert">Expert</option>
                                            </select>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="form-actions full-span" style={{ marginTop: '16px' }}>
                            <button className="filter-button" disabled={saving} type="submit">
                                <Save aria-hidden="true" size={17} />
                                <span>{saving ? 'Enregistrement...' : "Enregistrer l'offre"}</span>
                            </button>
                            <button
                                className="ghost-button"
                                onClick={() => {
                                    resetOfferForm();
                                    setViewMode('list');
                                }}
                                type="button"
                            >
                                <X aria-hidden="true" size={17} />
                                <span>Annuler</span>
                            </button>
                        </div>

                        {formError ? <p className="form-error full-span">{formError}</p> : null}
                    </form>
                </section>
            </div>
        );
    }

    return (
        <div className="view-stack">
            <section className="filter-bar" aria-label="Filtres des offres">
                <label className="search-field">
                    <Search aria-hidden="true" size={18} />
                    <input
                        name="q"
                        onChange={(event) => updateFilter('q', event.target.value)}
                        placeholder="Rechercher un poste, un lieu..."
                        type="search"
                        value={filters.q}
                    />
                </label>

                <label>
                    <span>Direction</span>
                    <select onChange={(event) => updateFilter('direction', event.target.value)} value={filters.direction}>
                        <option value="">Toutes</option>
                        {referentiels.directions?.map((direction) => (
                            <option key={direction.id_direction} value={direction.id_direction}>
                                {direction.nom_direction}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Statut</span>
                    <select onChange={(event) => updateFilter('statut', event.target.value)} value={filters.statut}>
                        <option value="">Tous</option>
                        {referentiels.statuts_offre?.map((statut) => (
                            <option key={statut.id_statut_offre} value={statut.id_statut_offre}>
                                {statut.libelle}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Contrat</span>
                    <select onChange={(event) => updateFilter('type_contrat', event.target.value)} value={filters.type_contrat}>
                        <option value="">Tous</option>
                        {referentiels.types_contrat?.map((contrat) => (
                            <option key={contrat.id_type_contrat} value={contrat.id_type_contrat}>
                                {contrat.libelle}
                            </option>
                        ))}
                    </select>
                </label>

                <button className="filter-button" onClick={loadOffers} type="button">
                    <Filter aria-hidden="true" size={17} />
                    <span>Filtrer</span>
                </button>
            </section>

            <section className="data-section">
                <div className="section-heading">
                    <div>
                        <h2>Liste des offres</h2>
                        <p>{meta?.total ?? 0} offre(s) trouvee(s)</p>
                    </div>
                    <div className="section-heading-actions">
                        {canManage ? (
                            <button className="filter-button" onClick={openNewOfferForm} type="button">
                                <Plus aria-hidden="true" size={17} />
                                <span>Nouvelle offre</span>
                            </button>
                        ) : null}
                        <button className="ghost-button" onClick={loadOffers} type="button">
                            <RefreshCw aria-hidden="true" size={17} />
                            <span>Actualiser</span>
                        </button>
                    </div>
                </div>

                {error ? (
                    <ErrorState message={error} onRetry={loadOffers} />
                ) : loading ? (
                    <LoadingState />
                ) : (
                    <OffersTable
                        offers={offersResponse.data}
                        onNavigate={onNavigate}
                        onSelectOffer={editOffer}
                        renderActions={renderOfferActions}
                    />
                )}

                {meta ? <Pagination meta={meta} onChangePage={changePage} /> : null}
            </section>
        </div>
    );
}

function OffersTable({ compact = false, offers, onNavigate = null, onSelectOffer = null, renderActions = null }) {
    const [expandedRow, setExpandedRow] = useState(null);

    if (!offers.length) {
        return <div className="empty-state">Aucune offre a afficher pour le moment.</div>;
    }

    function toggleExpand(id) {
        setExpandedRow((curr) => (curr === id ? null : id));
    }

    function copyCandidateLink(offre) {
        const slug = offre.slug || (offre.titre_poste ? offre.titre_poste.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : offre.id);
        const publicUrl = `${window.location.origin}/offre/${slug}`;
        navigator.clipboard?.writeText(publicUrl);
        window.alert(`Lien public de candidature pour "${offre.titre_poste}" :\n\n${publicUrl}\n\n(Lien copié dans le presse-papier)`);
    }

    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        {!compact ? <th style={{ width: '32px' }}></th> : null}
                        <th>Poste</th>
                        <th>Direction</th>
                        <th>Contrat</th>
                        <th>Publication</th>
                        {!compact ? <th>Limite</th> : null}
                        <th>Statut</th>
                        {renderActions || compact || onNavigate ? <th>Actions</th> : null}
                    </tr>
                </thead>
                <tbody>
                    {offers.map((offre) => {
                        const isExpanded = expandedRow === offre.id;

                        const profilsList = offre.profils?.length
                            ? offre.profils
                            : offre.profil
                            ? [offre.profil]
                            : [];

                        return (
                            <React.Fragment key={offre.id}>
                                <tr
                                    onClick={compact && onSelectOffer ? () => onSelectOffer(offre) : undefined}
                                    style={compact && onSelectOffer ? { cursor: 'pointer' } : {}}
                                >
                                    {!compact ? (
                                        <td>
                                            <button
                                                className="row-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleExpand(offre.id);
                                                }}
                                                title="Afficher les details"
                                                type="button"
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </td>
                                    ) : null}
                                    <td>
                                        <strong>{offre.titre_poste}</strong>
                                        <span>{offre.lieu ?? '-'}</span>
                                    </td>
                                    <td>{offre.direction?.nom ?? '-'}</td>
                                    <td>{offre.type_contrat?.libelle ?? '-'}</td>
                                    <td>{formatDate(offre.date_publication)}</td>
                                    {!compact ? <td>{formatDate(offre.date_limite)}</td> : null}
                                    <td>
                                        <span className="status-pill">{offre.statut?.libelle ?? '-'}</span>
                                    </td>
                                    {renderActions || compact || onNavigate ? (
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                {compact && onSelectOffer ? (
                                                    <button
                                                        className="row-button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelectOffer(offre);
                                                        }}
                                                        title="Voir / Modifier l'offre"
                                                        type="button"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                ) : null}
                                                {(offre.statut?.libelle === 'Publiee' || offre.statut?.libelle === 'Publiée') && !compact ? (
                                                    <button
                                                        className="row-button"
                                                        onClick={() => copyCandidateLink(offre)}
                                                        title="Copier le lien de candidature"
                                                        type="button"
                                                    >
                                                        <Share2 size={16} />
                                                    </button>
                                                ) : null}
                                                {renderActions && !compact ? renderActions(offre) : null}
                                            </div>
                                        </td>
                                    ) : null}
                                </tr>
                                {!compact && isExpanded ? (
                                    <tr>
                                        <td colSpan={renderActions ? 8 : 7} style={{ padding: 0 }}>
                                            <div className="expanded-details">
                                                {profilsList.length ? (
                                                    <div className="detail-block">
                                                        <strong>Criteres de profil ({profilsList.length})</strong>
                                                        <ul>
                                                            {profilsList.map((p, idx) => (
                                                                <li key={p.id ?? idx}>
                                                                    {p.description ? `${p.description} ` : ''}
                                                                    {p.valeur_attendue ? `(Cible: ${p.valeur_attendue} ${p.unite_valeur ?? ''})` : ''}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : null}

                                                {offre.missions?.length ? (
                                                    <div className="detail-block">
                                                        <strong>Missions principales</strong>
                                                        <ul>
                                                            {offre.missions.map((m) => (
                                                                <li key={m.id}>{m.description}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : null}

                                                {offre.formations?.length ? (
                                                    <div className="detail-block">
                                                        <strong>Formations requises</strong>
                                                        <ul>
                                                            {offre.formations.map((f) => (
                                                                <li key={f.id}>
                                                                    {f.niveau_min} {f.domaine ? `(${f.domaine})` : ''} -{' '}
                                                                    {f.obligatoire ? 'Obligatoire' : 'Souhaitable'}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : null}

                                                {offre.competences?.length ? (
                                                    <div className="detail-block">
                                                        <strong>Competences requises</strong>
                                                        <div className="tags-list">
                                                            {offre.competences.map((c) => (
                                                                <span className="badge green" key={c.id}>
                                                                    {c.nom} ({c.niveau_requis ?? 'Requis'})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ) : null}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function Pagination({ meta, onChangePage }) {
    const currentPage = meta.current_page ?? 1;
    const lastPage = meta.last_page ?? 1;

    return (
        <div className="pagination">
            <button disabled={currentPage <= 1} onClick={() => onChangePage(currentPage - 1)} type="button">
                <ChevronLeft aria-hidden="true" size={17} />
                <span>Precedent</span>
            </button>
            <span>
                Page {currentPage} / {lastPage}
            </span>
            <button disabled={currentPage >= lastPage} onClick={() => onChangePage(currentPage + 1)} type="button">
                <span>Suivant</span>
                <ChevronRight aria-hidden="true" size={17} />
            </button>
        </div>
    );
}

function LoadingState() {
    return <div className="feedback-state">Chargement...</div>;
}

function ErrorState({ message, onRetry }) {
    return (
        <div className="feedback-state error">
            <strong>Impossible de charger les donnees.</strong>
            <span>{message}</span>
            {onRetry ? (
                <button className="ghost-button" onClick={onRetry} type="button">
                    <RefreshCw aria-hidden="true" size={17} />
                    <span>Reessayer</span>
                </button>
            ) : null}
        </div>
    );
}

createRoot(document.getElementById('recrutement-app')).render(<App />);
