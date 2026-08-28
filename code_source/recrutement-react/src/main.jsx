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
    Cpu,
    Database,
    Download,
    Edit3,
    ExternalLink,
    Eye,
    FileText,
    Filter,
    GraduationCap,
    Layers,
    LayoutDashboard,
    ListChecks,
    LogOut,
    Plus,
    Printer,
    RefreshCw,
    RotateCcw,
    Save,
    Search,
    Send,
    Share2,
    Sparkles,
    Trash2,
    Upload,
    User,
    UserCheck,
    UserPlus,
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
        : path.startsWith('/vivier')
        ? 'vivier'
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
            ) : activeView === 'vivier' ? (
                <VivierView competencesData={competencesData} referentiels={referentiels} />
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
        { id: 'vivier', label: 'Vivier & OCR', href: '/vivier', icon: Layers },
        { id: 'referentiels', label: 'Référentiels', href: '/referentiels', icon: Building2, hasSub: true },
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

function SaisirRhCandidatureModal({ initialOffreId = '', onClose, onSuccess, referentiels }) {
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        id_offre: initialOffreId ? String(initialOffreId) : '',
        id_domaine: '',
        poste_souhaite: '',
        message_motivation: '',
    });
    const [cvFile, setCvFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [offresList, setOffresList] = useState([]);

    useEffect(() => {
        getJson('/api/offres?per_page=100')
            .then((res) => setOffresList(res?.data ?? []))
            .catch(() => {});
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('nom', form.nom.trim());
            formData.append('prenom', form.prenom.trim());
            formData.append('email', form.email.trim());
            if (form.telephone) formData.append('telephone', form.telephone.trim());
            if (form.id_offre) formData.append('id_offre', form.id_offre);
            if (form.id_domaine) formData.append('id_domaine', form.id_domaine);
            if (form.poste_souhaite) formData.append('poste_souhaite', form.poste_souhaite.trim());
            if (form.message_motivation) formData.append('message_motivation', form.message_motivation.trim());
            if (cvFile) formData.append('cv', cvFile);

            await sendFormData('/api/candidatures/saisir-rh', formData);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    const meDomaines = referentiels?.domaines ?? [];

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%', zIndex: 1101, background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ede9fe', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserPlus color="#6d28d9" size={22} />
                        </div>
                        <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '18px', fontWeight: '700' }}>Saisie Manuelle d'une Candidature (RH)</h3>
                    </div>
                    <button className="icon-button" onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                {error ? <p className="form-error" style={{ marginBottom: '14px', padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</p> : null}

                <form className="compact-form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Nom du candidat *</span>
                        <input
                            onChange={(e) => setForm((c) => ({ ...c, nom: e.target.value }))}
                            placeholder="Nom"
                            required
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            value={form.nom}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Prénom du candidat *</span>
                        <input
                            onChange={(e) => setForm((c) => ({ ...c, prenom: e.target.value }))}
                            placeholder="Prénom"
                            required
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            value={form.prenom}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Adresse E-mail *</span>
                        <input
                            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                            placeholder="email@exemple.com"
                            required
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            type="email"
                            value={form.email}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Téléphone</span>
                        <input
                            onChange={(e) => setForm((c) => ({ ...c, telephone: e.target.value }))}
                            placeholder="+261 34 00 000 00"
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            value={form.telephone}
                        />
                    </label>

                    <label style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Rattachement à une Offre de recrutement</span>
                        <select
                            onChange={(e) => setForm((c) => ({ ...c, id_offre: e.target.value }))}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            value={form.id_offre}
                        >
                            <option value="">Candidature Spontanée (Aucune offre spécifique)</option>
                            {offresList.map((off) => (
                                <option key={off.id ?? off.id_offre} value={off.id ?? off.id_offre}>
                                    Offre: {off.titre_poste} ({off.direction?.nom ?? off.direction?.nom_direction ?? 'Générale'})
                                </option>
                            ))}
                        </select>
                    </label>

                    {!form.id_offre ? (
                        <>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '600' }}>Domaine (si spontanée)</span>
                                <select
                                    onChange={(e) => setForm((c) => ({ ...c, id_domaine: e.target.value }))}
                                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                    value={form.id_domaine}
                                >
                                    <option value="">Domaines validés RH</option>
                                    {meDomaines.filter((d) => d.valide !== false).map((dom) => (
                                        <option key={dom.id_domaine} value={dom.id_domaine}>
                                            {dom.nom_domaine}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '600' }}>Poste souhaité</span>
                                <input
                                    onChange={(e) => setForm((c) => ({ ...c, poste_souhaite: e.target.value }))}
                                    placeholder="Ex: Chef de projet IT"
                                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                    value={form.poste_souhaite}
                                />
                            </label>
                        </>
                    ) : null}

                    <label style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Document CV (PDF, DOC, DOCX)</span>
                        <input
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            type="file"
                        />
                    </label>

                    <label style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Message de présentation / Note RH</span>
                        <textarea
                            onChange={(e) => setForm((c) => ({ ...c, message_motivation: e.target.value }))}
                            placeholder="Saisir un commentaire ou la lettre de motivation du candidat..."
                            rows={3}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            value={form.message_motivation}
                        />
                    </label>

                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                        <button className="ghost-button" onClick={onClose} type="button">
                            <span>Annuler</span>
                        </button>
                        <button
                            disabled={submitting}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '9px 18px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                                cursor: 'pointer',
                            }}
                            type="submit"
                        >
                            <Save size={16} />
                            <span>{submitting ? 'Enregistrement...' : 'Enregistrer la candidature RH'}</span>
                        </button>
                    </div>
                </form>
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
    const [showSaisirModal, setShowSaisirModal] = useState(false);
    const [viewMode, setViewMode] = useState('toutes'); // 'toutes', 'par_offre', 'spontanees'
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [paginationMeta, setPaginationMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 });
    const [filters, setFilters] = useState({
        q: '',
        statut: '',
        direction: '',
        type_demande: '',
        canal_depot: '',
        date_debut: '',
        date_fin: '',
    });

    const resetFilters = () => {
        setFilters({
            q: '',
            statut: '',
            direction: '',
            type_demande: '',
            canal_depot: '',
            date_debut: '',
            date_fin: '',
        });
    };

    const loadCandidatures = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('per_page', String(perPage));
            if (filters.q) params.set('q', filters.q);
            if (filters.statut) params.set('statut', filters.statut);
            if (filters.direction) params.set('direction', filters.direction);
            if (filters.type_demande) params.set('type_demande', filters.type_demande);
            if (filters.canal_depot) params.set('canal_depot', filters.canal_depot);
            if (filters.date_debut) params.set('date_debut', filters.date_debut);
            if (filters.date_fin) params.set('date_fin', filters.date_fin);

            const [candResponse, statutsResponse] = await Promise.all([
                getJson(`/api/candidatures?${params.toString()}`),
                getJson('/api/referentiels/statuts-candidature'),
            ]);

            setCandidatures(candResponse?.data ?? []);
            setPaginationMeta({
                current_page: candResponse?.current_page ?? page,
                last_page: candResponse?.last_page ?? 1,
                total: candResponse?.total ?? (candResponse?.data?.length ?? 0),
                from: candResponse?.from ?? 1,
                to: candResponse?.to ?? (candResponse?.data?.length ?? 0),
            });
            setStatutsList(statutsResponse?.data ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters, page, perPage]);

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

    // Grouping for Direction -> Offre -> Candidats
    const candidaturesSurOffre = candidatures.filter((c) => c.type_candidature === 'offre' || c.offre);
    const candidaturesSpontanees = candidatures.filter((c) => c.type_candidature === 'spontanee' || !c.offre);

    // Tree mapping for Direction -> Offre
    const treeByOffre = {};
    candidaturesSurOffre.forEach((c) => {
        const dirName = c.offre?.direction?.nom_direction ?? 'Direction Générale';
        const offreTitle = c.offre?.titre_poste ?? 'Offre sans titre';
        if (!treeByOffre[dirName]) treeByOffre[dirName] = {};
        if (!treeByOffre[dirName][offreTitle]) treeByOffre[dirName][offreTitle] = [];
        treeByOffre[dirName][offreTitle].push(c);
    });

    // Tree mapping for Direction -> Domaine
    const treeByDomaine = {};
    candidaturesSpontanees.forEach((c) => {
        const isValide = c.domaine && (c.domaine.valide === true);
        const dirName = isValide && c.domaine?.direction?.nom_direction ? c.domaine.direction.nom_direction : 'Non spécifiée';
        const domaineName = isValide && c.domaine?.nom_domaine ? c.domaine.nom_domaine : 'Non spécifiée';
        if (!treeByDomaine[dirName]) treeByDomaine[dirName] = {};
        if (!treeByDomaine[dirName][domaineName]) treeByDomaine[dirName][domaineName] = [];
        treeByDomaine[dirName][domaineName].push(c);
    });

    return (
        <div className="view-stack">
            {/* SUB-NAVIGATION TABS FOR SPRINT 4 */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                <button
                    className={`ghost-button ${viewMode === 'toutes' ? 'primary' : ''}`}
                    onClick={() => setViewMode('toutes')}
                    style={{
                        fontWeight: viewMode === 'toutes' ? 'bold' : 'normal',
                        borderBottom: viewMode === 'toutes' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <ListChecks size={17} />
                    <span>Toutes les candidatures ({candidatures.length})</span>
                </button>
                <button
                    className={`ghost-button ${viewMode === 'par_offre' ? 'primary' : ''}`}
                    onClick={() => setViewMode('par_offre')}
                    style={{
                        fontWeight: viewMode === 'par_offre' ? 'bold' : 'normal',
                        borderBottom: viewMode === 'par_offre' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <BriefcaseBusiness size={17} />
                    <span>Direction → Offre → Candidats ({candidaturesSurOffre.length})</span>
                </button>
                <button
                    className={`ghost-button ${viewMode === 'spontanees' ? 'primary' : ''}`}
                    onClick={() => setViewMode('spontanees')}
                    style={{
                        fontWeight: viewMode === 'spontanees' ? 'bold' : 'normal',
                        borderBottom: viewMode === 'spontanees' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <Building2 size={17} />
                    <span>Direction → Domaine → Candidatures ({candidaturesSpontanees.length})</span>
                </button>
            </div>

            {/* FULL FILTERS BAR (Statut, Direction, Période, Type, Canal, Mot-clé) */}
            <section className="filter-bar" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                <label className="search-field" style={{ minWidth: '220px' }}>
                    <Search size={18} />
                    <input
                        onChange={(e) => setFilters((curr) => ({ ...curr, q: e.target.value }))}
                        placeholder="Candidat (nom, email, tel)..."
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
                        <option value="">Toutes les directions</option>
                        {referentiels.directions?.map((dir) => (
                            <option key={dir.id_direction} value={dir.id_direction}>
                                {dir.nom_direction}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Type de demande</span>
                    <select
                        onChange={(e) => setFilters((curr) => ({ ...curr, type_demande: e.target.value }))}
                        value={filters.type_demande}
                    >
                        <option value="">Tous les types</option>
                        <option value="offre">Sur offre</option>
                        <option value="spontanee">Spontanée</option>
                    </select>
                </label>

                <label>
                    <span>Canal de dépôt</span>
                    <select
                        onChange={(e) => setFilters((curr) => ({ ...curr, canal_depot: e.target.value }))}
                        value={filters.canal_depot}
                    >
                        <option value="">Tous les canaux</option>
                        <option value="site_externe">Portail Web</option>
                        <option value="rh_manuel">Saisie RH</option>
                    </select>
                </label>

                <label>
                    <span>Date début</span>
                    <input
                        onChange={(e) => setFilters((curr) => ({ ...curr, date_debut: e.target.value }))}
                        type="date"
                        value={filters.date_debut}
                    />
                </label>

                <label>
                    <span>Date fin</span>
                    <input
                        onChange={(e) => setFilters((curr) => ({ ...curr, date_fin: e.target.value }))}
                        type="date"
                        value={filters.date_fin}
                    />
                </label>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="filter-button" onClick={loadCandidatures} type="button">
                        <Filter size={17} />
                        <span>Filtrer</span>
                    </button>
                    <button className="ghost-button" onClick={resetFilters} title="Réinitialiser tous les filtres" type="button">
                        <RotateCcw size={16} />
                        <span>Réinitialiser</span>
                    </button>
                </div>
            </section>

            <section className="data-section">
                <div className="section-heading">
                    <div>
                        <h2>
                            {viewMode === 'toutes'
                                ? 'Liste générale des candidatures'
                                : viewMode === 'par_offre'
                                ? 'Arborescence des candidatures par Offre'
                                : 'Arborescence des candidatures Spontanées par Domaine'}
                        </h2>
                        <p>Gestion RH des dossiers de candidatures avec suivi du workflow de statut et pièces jointes.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => setShowSaisirModal(true)}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '9px 18px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }}
                            type="button"
                        >
                            <UserPlus size={18} />
                            <span>Saisir une candidature (RH)</span>
                        </button>
                        <button className="ghost-button" onClick={loadCandidatures} type="button">
                            <RefreshCw size={17} />
                            <span>Actualiser</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState message={error} onRetry={loadCandidatures} />
                ) : !candidatures.length ? (
                    <div className="empty-state">Aucune candidature trouvée avec les filtres sélectionnés.</div>
                ) : viewMode === 'toutes' ? (
                    /* MODE 1: LISTE GÉNÉRALE AVEC PAGINATION */
                    <>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Candidat</th>
                                        <th>Poste / Domaine & Direction</th>
                                        <th>Type de Demande</th>
                                        <th>Canal de Dépôt</th>
                                        <th>Date</th>
                                        <th>Documents</th>
                                        <th>Statut RH</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidatures.map((c) => (
                                        <tr key={c.id_candidature}>
                                            <td>
                                                <strong>{c.candidat?.prenom} {c.candidat?.nom}</strong>
                                                <br />
                                                <small>{c.candidat?.email}</small>
                                            </td>
                                            <td>
                                                {c.offre ? (
                                                    <strong style={{ color: 'var(--primary)' }}>Offre: {c.offre.titre_poste}</strong>
                                                ) : c.domaine && (c.domaine.valide === true || c.domaine.valide === 1) ? (
                                                    <span className="badge blue">Domaine: {c.domaine.nom_domaine}</span>
                                                ) : (
                                                    <span className="badge amber">
                                                        {c.poste_souhaite ? `Poste: ${c.poste_souhaite}` : 'Non spécifié'}
                                                    </span>
                                                )}
                                                <br />
                                                <small style={{ color: 'var(--text-muted)' }}>
                                                    Direction: {c.offre?.direction?.nom_direction ?? (c.domaine && (c.domaine.valide === true || c.domaine.valide === 1) ? c.domaine?.direction?.nom_direction : 'Non spécifiée')}
                                                </small>
                                            </td>
                                            <td>
                                                <span className={`badge ${c.id_type_demande === 2 || c.type_demande?.libelle === 'Spontanee' || !c.id_offre ? 'amber' : 'blue'}`}>
                                                    {c.id_type_demande === 2 || c.type_demande?.libelle === 'Spontanee' || !c.id_offre ? 'Spontanée' : 'Sur offre'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${c.canal_depot === 'rh_manuel' ? 'purple' : 'gray'}`}>
                                                    {c.canal_depot === 'rh_manuel' ? 'Saisie RH' : 'Portail Web'}
                                                </span>
                                            </td>
                                            <td>{formatDate(c.created_at)}</td>
                                            <td>
                                                <span className="badge">{c.documents?.length ?? 0} fichier(s)</span>
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

                        {/* BARRE DE PAGINATION INTERACTIVE */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', padding: '12px 16px', background: '#fff', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                    Affichage de {paginationMeta.from ?? 1} à {paginationMeta.to ?? candidatures.length} sur {paginationMeta.total ?? candidatures.length} candidature(s)
                                </span>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                    <span>Par page :</span>
                                    <select
                                        onChange={(e) => {
                                            setPerPage(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                                        value={perPage}
                                    >
                                        <option value={15}>15</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                    className="ghost-button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                    type="button"
                                >
                                    <ChevronLeft size={16} />
                                    <span>Précédent</span>
                                </button>
                                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                    Page {paginationMeta.current_page} / {paginationMeta.last_page}
                                </span>
                                <button
                                    className="ghost-button"
                                    disabled={page >= paginationMeta.last_page}
                                    onClick={() => setPage((p) => p + 1)}
                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                    type="button"
                                >
                                    <span>Suivant</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : viewMode === 'par_offre' ? (
                    /* MODE 2: ARBORESCENCE DIRECTION -> OFFRE -> CANDIDATS */
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {Object.entries(treeByOffre).map(([dirName, offresMap]) => (
                            <div key={dirName} className="data-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <h3 style={{ margin: '0 0 12px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Building2 size={18} />
                                    <span>Direction : {dirName}</span>
                                </h3>
                                <div style={{ display: 'grid', gap: '16px', paddingLeft: '12px' }}>
                                    {Object.entries(offresMap).map(([offreTitle, items]) => (
                                        <div key={offreTitle} style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <strong style={{ fontSize: '15px' }}>Offre : {offreTitle}</strong>
                                                <span className="status-pill success">{items.length} candidat(s)</span>
                                            </div>
                                            <div className="table-wrap">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Candidat</th>
                                                            <th>Email & Tel</th>
                                                            <th>Date de dépôt</th>
                                                            <th>Statut RH</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map((item) => (
                                                            <tr key={item.id_candidature}>
                                                                <td><strong>{item.candidat?.prenom} {item.candidat?.nom}</strong></td>
                                                                <td>{item.candidat?.email} ({item.candidat?.telephone ?? '-'})</td>
                                                                <td>{formatDate(item.created_at)}</td>
                                                                <td><span className="status-pill success">{item.statut?.libelle ?? 'Reçue'}</span></td>
                                                                <td>
                                                                    <button
                                                                        className="filter-button"
                                                                        onClick={() => setSelectedCandidatureId(item.id_candidature)}
                                                                        style={{ padding: '4px 10px', fontSize: '12px' }}
                                                                        type="button"
                                                                    >
                                                                        <Eye size={13} />
                                                                        <span>Consulter</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* MODE 3: ARBORESCENCE DIRECTION -> DOMAINE -> CANDIDATURES SPONTANÉES */
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {Object.entries(treeByDomaine).map(([dirName, domainesMap]) => (
                            <div key={dirName} className="data-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <h3 style={{ margin: '0 0 12px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Building2 size={18} />
                                    <span>Direction : {dirName}</span>
                                </h3>
                                <div style={{ display: 'grid', gap: '16px', paddingLeft: '12px' }}>
                                    {Object.entries(domainesMap).map(([domaineName, items]) => (
                                        <div key={domaineName} style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <strong style={{ fontSize: '15px' }}>Domaine / Poste souhaité : {domaineName}</strong>
                                                <span className="status-pill warning">{items.length} candidature(s) spontanée(s)</span>
                                            </div>
                                            <div className="table-wrap">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Candidat</th>
                                                            <th>Coordonnées</th>
                                                            <th>Date</th>
                                                            <th>Statut RH</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map((item) => (
                                                            <tr key={item.id_candidature}>
                                                                <td><strong>{item.candidat?.prenom} {item.candidat?.nom}</strong></td>
                                                                <td>{item.candidat?.email} ({item.candidat?.telephone ?? '-'})</td>
                                                                <td>{formatDate(item.created_at)}</td>
                                                                <td><span className="status-pill success">{item.statut?.libelle ?? 'Reçue'}</span></td>
                                                                <td>
                                                                    <button
                                                                        className="filter-button"
                                                                        onClick={() => setSelectedCandidatureId(item.id_candidature)}
                                                                        style={{ padding: '4px 10px', fontSize: '12px' }}
                                                                        type="button"
                                                                    >
                                                                        <Eye size={13} />
                                                                        <span>Consulter</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {showSaisirModal ? (
                <SaisirRhCandidatureModal
                    onClose={() => setShowSaisirModal(false)}
                    onSuccess={loadCandidatures}
                    referentiels={referentiels}
                />
            ) : null}
        </div>
    );
}

function CandidatureDetailView({ idCandidature, onBack, onRefreshList, statutsList }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('informations'); // 'informations', 'documents', 'statut', 'historique_statuts', 'communications'
    const [newStatusId, setNewStatusId] = useState('');
    const [commentaire, setCommentaire] = useState('');
    const [updating, setUpdating] = useState(false);
    const [ocrExtracting, setOcrExtracting] = useState(false);
    const [ocrData, setOcrData] = useState(null);
    const [ocrSuccessMsg, setOcrSuccessMsg] = useState('');

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

    async function handleExtractOcr() {
        setOcrExtracting(true);
        setOcrSuccessMsg('');
        try {
            const res = await sendJson(`/api/candidatures/${idCandidature}/extract-ocr`, { method: 'POST' });
            setOcrData(res?.data?.donnees_json ?? null);
            setOcrSuccessMsg('Extraction PaddleOCR & IA effectuée avec succès !');
        } catch (err) {
            setError(err.message);
        } finally {
            setOcrExtracting(false);
        }
    }

    async function handleValidateOcr(statusVal) {
        if (!ocrData) return;
        try {
            await sendJson(`/api/candidatures/${idCandidature}/validate-ocr`, {
                body: {
                    statut_validation: statusVal,
                    competences: ocrData.competences ?? [],
                    experiences: ocrData.experiences ?? [],
                    formations: ocrData.formations ?? [],
                },
            });
            setOcrSuccessMsg(`Données du CV ${statusVal === 'valide' ? 'validées' : statusVal} et enregistrées dans le profil candidat !`);
        } catch (err) {
            setError(err.message);
        }
    }

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
            {/* EN-TÊTE FICHE CANDIDAT & BOUTON IMPRESSIONS / RETOUR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <button className="ghost-button" onClick={onBack} type="button">
                    <ArrowLeft size={18} />
                    <span>Retour à la liste des candidatures</span>
                </button>
                <div className="section-heading-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="filter-button" onClick={() => window.print()} style={{ gap: '6px', fontSize: '13px' }} type="button">
                        <Printer size={16} />
                        <span>Exporter en PDF / Imprimer</span>
                    </button>
                    <span className="status-pill success" style={{ fontSize: '14px', padding: '6px 14px' }}>
                        Statut actuel : {details.statut?.libelle ?? 'Reçue'}
                    </span>
                </div>
            </div>

            {/* DEUXIÈME BARRE DE NAVIGATION PAR SECTIONS FICHE CANDIDAT (Informations, Documents, Statut, Historique statuts, Communications) */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', background: '#fff', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <button
                    className={`ghost-button ${activeTab === 'informations' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('informations')}
                    style={{
                        fontWeight: activeTab === 'informations' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'informations' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <User size={16} />
                    <span>Informations</span>
                </button>

                <button
                    className={`ghost-button ${activeTab === 'documents' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('documents')}
                    style={{
                        fontWeight: activeTab === 'documents' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'documents' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <FileText size={16} />
                    <span>Documents ({details.documents?.length ?? 0})</span>
                </button>

                <button
                    className={`ghost-button ${activeTab === 'historique_statuts' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('historique_statuts')}
                    style={{
                        fontWeight: activeTab === 'historique_statuts' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'historique_statuts' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <CalendarDays size={16} />
                    <span>Historique statuts ({details.historique?.length ?? 0})</span>
                </button>

                <button
                    className={`ghost-button ${activeTab === 'communications' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('communications')}
                    style={{
                        fontWeight: activeTab === 'communications' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'communications' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <Send size={16} />
                    <span>Communications</span>
                </button>
            </div>

            {/* CONTENU PRINCIPAL DE LA SECTION SÉLECTIONNÉE */}
            {activeTab === 'informations' && (
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
                    {/* CARTE CANDIDAT GAUCHE */}
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
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                                <span className={`badge ${details.id_type_demande === 2 || !details.id_offre ? 'amber' : 'blue'}`}>
                                    {details.id_type_demande === 2 || !details.id_offre ? 'Spontanée' : 'Sur offre'}
                                </span>
                                <span className={`badge ${details.canal_depot === 'rh_manuel' ? 'purple' : 'gray'}`}>
                                    {details.canal_depot === 'rh_manuel' ? 'Saisie RH' : 'Portail Web'}
                                </span>
                            </div>
                        </div>

                        <div className="detail-block" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', gap: '10px' }}>
                            <strong>Coordonnées du candidat</strong>
                            <p style={{ margin: 0 }}><strong>Email:</strong> {details.candidat?.email}</p>
                            <p style={{ margin: 0 }}><strong>Téléphone:</strong> {details.candidat?.telephone ?? '-'}</p>
                        </div>

                        {/* FORMULAIRE DE MISE À JOUR DU STATUT RH INCLUS DANS INFORMATIONS */}
                        <div className="detail-block" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                            <strong style={{ color: 'var(--primary)' }}>Mise à jour du statut RH</strong>
                            <form onSubmit={handleStatusUpdate} style={{ display: 'grid', gap: '10px', marginTop: '8px' }}>
                                <select
                                    onChange={(e) => setNewStatusId(e.target.value)}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                                    value={newStatusId}
                                >
                                    {statutsList.map((s) => (
                                        <option key={s.id_statut_candidature} value={s.id_statut_candidature}>
                                            {s.libelle}
                                        </option>
                                    ))}
                                </select>
                                <textarea
                                    onChange={(e) => setCommentaire(e.target.value)}
                                    placeholder="Commentaire de changement de statut (optionnel)..."
                                    rows={2}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                                    value={commentaire}
                                />
                                <button className="filter-button" disabled={updating} style={{ width: '100%', padding: '10px', fontSize: '13px' }} type="submit">
                                    <Save size={15} />
                                    <span>{updating ? 'Enregistrement...' : 'Valider le statut'}</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* DÉTAILS CANDIDATURE DROITE */}
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px' }}>Informations sur le dossier de candidature</h3>
                            <p style={{ margin: '6px 0' }}>
                                <strong>Type de demande :</strong>{' '}
                                {!details.offre || details.id_type_demande === 2 ? (
                                    <span className="badge amber">Candidature Spontanée</span>
                                ) : (
                                    <span className="badge blue">Candidature sur offre</span>
                                )}
                            </p>
                            <p style={{ margin: '6px 0' }}>
                                <strong>Canal de dépôt :</strong>{' '}
                                <span className={`badge ${details.canal_depot === 'rh_manuel' ? 'purple' : 'gray'}`}>
                                    {details.canal_depot === 'rh_manuel' ? 'Saisie Manuelle RH' : 'Portail Web'}
                                </span>
                            </p>
                            <p style={{ margin: '6px 0' }}>
                                <strong>Poste / Domaine :</strong>{' '}
                                {details.offre ? (
                                    <strong style={{ color: 'var(--primary)' }}>Offre : {details.offre.titre_poste}</strong>
                                ) : details.domaine && (details.domaine.valide === true || details.domaine.valide === 1) ? (
                                    <strong>Domaine : {details.domaine.nom_domaine}</strong>
                                ) : (
                                    <span>Poste souhaité : {details.poste_souhaite ?? 'Non spécifié'} <span className="badge amber" style={{ marginLeft: '6px' }}>En attente de validation RH</span></span>
                                )}
                            </p>
                            <p style={{ margin: '6px 0' }}>
                                <strong>Direction de rattachement :</strong>{' '}
                                {details.offre?.direction?.nom_direction ?? (details.domaine && (details.domaine.valide === true || details.domaine.valide === 1) ? details.domaine?.direction?.nom_direction : 'Non spécifiée (En attente de validation RH)')}
                            </p>
                            <p style={{ margin: '6px 0' }}><strong>Date de dépôt :</strong> {formatDate(details.created_at)}</p>

                            <div style={{ marginTop: '16px' }}>
                                <strong style={{ display: 'block', marginBottom: '6px' }}>Message de présentation / Lettre de motivation :</strong>
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', lineHeight: '1.6' }}>
                                    {details.message_motivation ?? 'Aucun message spécifique fourni.'}
                                </div>
                            </div>
                        </div>

                        {/* PIÈCES JOINTES ET DOCUMENTS INCLUS DANS INFORMATIONS */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '17px' }}>
                                Documents & Pièces Jointes du Candidat ({details.documents?.length ?? 0})
                            </h3>
                            {!details.documents?.length ? (
                                <div className="empty-state">Aucun document joint.</div>
                            ) : (
                                <div className="document-grid">
                                    {(details.documents ?? []).map((doc) => (
                                        <div className="document-card" key={doc.id_document} style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div className="document-card-info" style={{ marginBottom: '8px' }}>
                                                <strong style={{ display: 'block', fontSize: '14px' }}>{doc.nom_fichier}</strong>
                                                <span className="badge" style={{ marginTop: '2px' }}>{doc.type_document}</span>
                                            </div>
                                            <a
                                                className="filter-button"
                                                href={backendPath(`/storage/${doc.chemin_fichier}`)}
                                                rel="noreferrer"
                                                style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                target="_blank"
                                                title="Consulter le document"
                                            >
                                                <Download size={14} />
                                                <span>Consulter / Ouvrir</span>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SECTION EXTRACTION OCR & IA PADDLEOCR */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Cpu size={18} />
                                        <span>Extraction Automatique CV (PaddleOCR & IA)</span>
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                                        Extraire les compétences, diplômes et expériences directement du fichier CV.
                                    </p>
                                </div>
                                <button className="primary-button" disabled={ocrExtracting} onClick={handleExtractOcr} style={{ gap: '6px' }} type="button">
                                    <Sparkles size={16} />
                                    <span>{ocrExtracting ? 'Analyse OCR...' : 'Lancer Extraction CV'}</span>
                                </button>
                            </div>

                            {ocrSuccessMsg ? (
                                <div className="status-pill success" style={{ padding: '8px 14px', marginBottom: '12px', display: 'inline-block' }}>
                                    {ocrSuccessMsg}
                                </div>
                            ) : null}

                            {ocrData ? (
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--primary)' }}>Données Extraites (À valider par le RH)</h4>
                                    
                                    <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                                        <div>
                                            <strong>Compétences identifiées :</strong>
                                            <div className="tags-list" style={{ marginTop: '4px' }}>
                                                {ocrData.competences?.map((c, i) => (
                                                    <span key={i} className="badge green">{c.nom} ({c.niveau})</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <strong>Expériences identifiées :</strong>
                                            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                                {ocrData.experiences?.map((exp, i) => (
                                                    <li key={i}><strong>{exp.intitule_poste}</strong> chez {exp.entreprise} ({exp.date_debut} à {exp.date_fin})</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <strong>Formations identifiées :</strong>
                                            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                                {ocrData.formations?.map((f, i) => (
                                                    <li key={i}><strong>{f.diplome}</strong> - {f.etablissement} ({f.annee_obtention})</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                                        <button className="primary-button" onClick={() => handleValidateOcr('valide')} style={{ padding: '6px 14px', fontSize: '13px' }} type="button">
                                            <CheckCircle2 size={15} />
                                            <span>Valider & Importer au profil</span>
                                        </button>
                                        <button className="ghost-button" onClick={() => handleValidateOcr('corrige')} style={{ padding: '6px 14px', fontSize: '13px' }} type="button">
                                            <Edit3 size={15} />
                                            <span>Corriger</span>
                                        </button>
                                        <button className="ghost-button danger" onClick={() => handleValidateOcr('rejete')} style={{ padding: '6px 14px', fontSize: '13px' }} type="button">
                                            <X size={15} />
                                            <span>Rejeter</span>
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* SECTION DOCUMENTS */}
            {activeTab === 'documents' && (
                <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px' }}>
                        Documents & Pièces Jointes du Candidat ({details.documents?.length ?? 0})
                    </h3>
                    {!details.documents?.length ? (
                        <div className="empty-state">Aucun document joint à cette candidature.</div>
                    ) : (
                        <div className="document-grid">
                            {(details.documents ?? []).map((doc) => (
                                <div className="document-card" key={doc.id_document} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div className="document-card-info" style={{ marginBottom: '10px' }}>
                                        <strong style={{ display: 'block', fontSize: '15px' }}>{doc.nom_fichier}</strong>
                                        <span className="badge" style={{ marginTop: '4px' }}>{doc.type_document}</span>
                                        <small style={{ display: 'block', color: 'var(--muted)', marginTop: '4px' }}>
                                            {doc.taille_octets ? `${Math.round(doc.taille_octets / 1024)} KB` : ''} - {doc.mime_type ?? 'Fichier'}
                                        </small>
                                    </div>
                                    <a
                                        className="filter-button"
                                        href={backendPath(`/storage/${doc.chemin_fichier}`)}
                                        rel="noreferrer"
                                        style={{ padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        target="_blank"
                                        title="Télécharger / Consulter le document"
                                    >
                                        <Download size={15} />
                                        <span>Consulter / Télécharger</span>
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SECTION HISTORIQUE STATUTS */}
            {activeTab === 'historique_statuts' && (
                <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px' }}>Historique Chronologique des Statuts RH</h3>
                    {!details.historique?.length ? (
                        <div className="empty-state">Aucun historique enregistré pour le moment.</div>
                    ) : (
                        <div className="history-timeline" style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '16px', display: 'grid', gap: '16px' }}>
                            {(details.historique ?? []).map((h, idx) => (
                                <div className="history-item" key={h.id_historique ?? idx} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: 'var(--primary)', fontSize: '15px' }}>{h.statut?.libelle ?? 'Changement de statut'}</strong>
                                        <small style={{ color: 'var(--muted)' }}>{formatDate(h.date_changement ?? h.created_at)}</small>
                                    </div>
                                    {h.commentaire ? (
                                        <p style={{ margin: '6px 0 0 0', fontSize: '14px', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                            {h.commentaire}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SECTION COMMUNICATIONS */}
            {activeTab === 'communications' && (
                <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px' }}>Historique des Communications avec le Candidat</h3>
                    <div className="empty-state" style={{ textAlign: 'left', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <CheckCircle2 color="green" size={20} />
                            <strong>E-mail automatique d'accusé de réception envoyé lors du dépôt.</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                            Date d'envoi : {formatDate(details.created_at)} | Destinataire : {details.candidat?.email}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function DirectionModal({ direction = null, onClose, onSuccess }) {
    const [nomDirection, setNomDirection] = useState(direction?.nom_direction ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        const name = nomDirection.trim();
        if (!name) return;

        setSubmitting(true);
        setError('');

        try {
            if (direction?.id) {
                await sendJson(`/api/directions/${direction.id}`, {
                    method: 'PUT',
                    body: { nom_direction: name },
                });
            } else {
                await sendJson('/api/directions', {
                    body: { nom_direction: name },
                });
            }
            if (onSuccess) await onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ede9fe', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 color="#6d28d9" size={22} />
                        </div>
                        <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '18px', fontWeight: '700' }}>
                            {direction ? 'Modifier la Direction' : 'Nouvelle Direction'}
                        </h3>
                    </div>
                    <button className="icon-button" onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                {error ? <p className="form-error" style={{ marginBottom: '14px', padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</p> : null}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Nom de la direction *</span>
                        <input
                            onChange={(e) => setNomDirection(e.target.value)}
                            placeholder="Ex : Direction Informatique & SI"
                            required
                            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                            value={nomDirection}
                        />
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <button className="ghost-button" onClick={onClose} type="button">
                            <span>Annuler</span>
                        </button>
                        <button
                            disabled={submitting}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '9px 18px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                                cursor: 'pointer',
                            }}
                            type="submit"
                        >
                            <Save size={16} />
                            <span>{submitting ? 'Enregistrement...' : direction ? 'Mettre à jour' : 'Créer la direction'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DomaineModal({ directionsList = [], domaine = null, onClose, onSuccess }) {
    const [nomDomaine, setNomDomaine] = useState(domaine?.nom_domaine ?? '');
    const [idDirection, setIdDirection] = useState(domaine?.direction?.id ? String(domaine.direction.id) : '');
    const [valide, setValide] = useState(domaine?.valide ?? true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        const name = nomDomaine.trim();
        if (!name || !idDirection) return;

        setSubmitting(true);
        setError('');

        const payload = {
            nom_domaine: name,
            id_direction: Number(idDirection),
            valide: valide,
        };

        try {
            if (domaine?.id) {
                await sendJson(`/api/domaines/${domaine.id}`, {
                    method: 'PUT',
                    body: payload,
                });
            } else {
                await sendJson('/api/domaines', {
                    body: payload,
                });
            }
            if (onSuccess) await onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '90%', background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ede9fe', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers color="#6d28d9" size={22} />
                        </div>
                        <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '18px', fontWeight: '700' }}>
                            {domaine ? 'Modifier le Domaine' : 'Nouveau Domaine d\'Expertise'}
                        </h3>
                    </div>
                    <button className="icon-button" onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                {error ? <p className="form-error" style={{ marginBottom: '14px', padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</p> : null}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Nom du domaine *</span>
                        <input
                            onChange={(e) => setNomDomaine(e.target.value)}
                            placeholder="Ex : Développement Web & Mobile"
                            required
                            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                            value={nomDomaine}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Direction de rattachement *</span>
                        <select
                            onChange={(e) => setIdDirection(e.target.value)}
                            required
                            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                            value={idDirection}
                        >
                            <option value="">Sélectionner une direction</option>
                            {directionsList.map((dir) => (
                                <option key={dir.id} value={dir.id}>
                                    {dir.nom_direction}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="checkbox-line" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', marginTop: '4px' }}>
                        <input
                            checked={valide}
                            onChange={(e) => setValide(e.target.checked)}
                            type="checkbox"
                        />
                        <span>Domaine validé par la Direction RH</span>
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <button className="ghost-button" onClick={onClose} type="button">
                            <span>Annuler</span>
                        </button>
                        <button
                            disabled={submitting}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '9px 18px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                                cursor: 'pointer',
                            }}
                            type="submit"
                        >
                            <Save size={16} />
                            <span>{submitting ? 'Enregistrement...' : domaine ? 'Mettre à jour' : 'Créer le domaine'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CompetenceModal({ competence = null, onClose, onSuccess, typesList = [] }) {
    const [nomCompetence, setNomCompetence] = useState(competence?.nom ?? '');
    const [idTypeCompetence, setIdTypeCompetence] = useState(competence?.id_type_competence ? String(competence.id_type_competence) : '1');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        const name = nomCompetence.trim();
        if (!name || !idTypeCompetence) return;

        setSubmitting(true);
        setError('');

        try {
            await sendJson('/api/competences', {
                body: {
                    nom_competence: name,
                    id_type_competence: Number(idTypeCompetence),
                },
            });
            if (onSuccess) await onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ede9fe', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles color="#6d28d9" size={22} />
                        </div>
                        <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '18px', fontWeight: '700' }}>
                            Nouvelle Compétence
                        </h3>
                    </div>
                    <button className="icon-button" onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                {error ? <p className="form-error" style={{ marginBottom: '14px', padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</p> : null}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Nom de la compétence *</span>
                        <input
                            onChange={(e) => setNomCompetence(e.target.value)}
                            placeholder="Ex : React.js, Management, Anglais courant..."
                            required
                            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                            value={nomCompetence}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Type de compétence *</span>
                        <select
                            onChange={(e) => setIdTypeCompetence(e.target.value)}
                            required
                            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                            value={idTypeCompetence}
                        >
                            {typesList.length ? (
                                typesList.map((t) => (
                                    <option key={t.id_type_competence} value={t.id_type_competence}>
                                        {t.libelle}
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value="1">Savoir-faire Technique</option>
                                    <option value="2">Soft Skill / Humaine</option>
                                    <option value="3">Langue vivante</option>
                                </>
                            )}
                        </select>
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <button className="ghost-button" onClick={onClose} type="button">
                            <span>Annuler</span>
                        </button>
                        <button
                            disabled={submitting}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '9px 18px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                                cursor: 'pointer',
                            }}
                            type="submit"
                        >
                            <Save size={16} />
                            <span>{submitting ? 'Enregistrement...' : 'Ajouter la compétence'}</span>
                        </button>
                    </div>
                </form>
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
    const [showDirectionModal, setShowDirectionModal] = useState(false);
    const [showDomaineModal, setShowDomaineModal] = useState(false);
    const [showCompetenceModal, setShowCompetenceModal] = useState(false);

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
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {canManage ? (
                                        <button
                                            onClick={() => setShowDirectionModal({ direction: null })}
                                            style={{
                                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 14px',
                                                fontWeight: '600',
                                                fontSize: '13px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
                                                cursor: 'pointer',
                                            }}
                                            type="button"
                                        >
                                            <Plus size={16} />
                                            <span>Nouvelle Direction</span>
                                        </button>
                                    ) : null}
                                    <button className="ghost-button" onClick={loadReferentials} type="button">
                                        <RefreshCw aria-hidden="true" size={17} />
                                        <span>Actualiser</span>
                                    </button>
                                </div>
                            </div>

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
                                            onEdit={() => setShowDirectionModal({ direction })}
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
                                {canManage ? (
                                    <button
                                        onClick={() => setShowDomaineModal({ domaine: null })}
                                        style={{
                                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 14px',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
                                            cursor: 'pointer',
                                        }}
                                        type="button"
                                    >
                                        <Plus size={16} />
                                        <span>Nouveau Domaine</span>
                                    </button>
                                ) : null}
                            </div>

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
                                            onEdit={() => setShowDomaineModal({ domaine })}
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
                        {canManage ? (
                            <button
                                onClick={() => setShowCompetenceModal({ competence: null })}
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 14px',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
                                    cursor: 'pointer',
                                }}
                                type="button"
                            >
                                <Plus size={16} />
                                <span>Nouvelle Compétence</span>
                            </button>
                        ) : null}
                    </div>

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

            {showDirectionModal ? (
                <DirectionModal
                    direction={showDirectionModal.direction}
                    onClose={() => setShowDirectionModal(false)}
                    onSuccess={loadReferentials}
                />
            ) : null}

            {showDomaineModal ? (
                <DomaineModal
                    directionsList={directions}
                    domaine={showDomaineModal.domaine}
                    onClose={() => setShowDomaineModal(false)}
                    onSuccess={loadReferentials}
                />
            ) : null}

            {showCompetenceModal ? (
                <CompetenceModal
                    competence={showCompetenceModal.competence}
                    onClose={() => setShowCompetenceModal(false)}
                    onSuccess={loadReferentials}
                    typesList={competencesData.types ?? []}
                />
            ) : null}
        </div>
    );
}

function VivierView({ competencesData, referentiels }) {
    const [vivierList, setVivierList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCandidat, setSelectedCandidat] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ id_candidat: '', id_direction: '', id_domaine: '', motif_ajout: '' });
    const [filters, setFilters] = useState({ q: '', direction: '', domaine: '', statut: '' });
    const [allCandidats, setAllCandidats] = useState([]);

    const [newComp, setNewComp] = useState({ id_competence: '', niveau: 'Intermédiaire' });
    const [newExp, setNewExp] = useState({ intitule_poste: '', entreprise: '', date_debut: '', date_fin: '', description: '' });
    const [newForm, setNewForm] = useState({ diplome: '', etablissement: '', annee_obtention: '', domaine_etude: '' });

    const loadVivier = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (filters.q) params.set('q', filters.q);
            if (filters.direction) params.set('direction', filters.direction);
            if (filters.domaine) params.set('domaine', filters.domaine);
            if (filters.statut) params.set('statut', filters.statut);

            const [vivRes, candRes] = await Promise.all([
                getJson(`/api/vivier?${params.toString()}`),
                getJson('/api/candidatures?per_page=100'),
            ]);

            setVivierList(vivRes?.data ?? []);
            const candidatsExtracted = (candRes?.data ?? []).map((c) => c.candidat).filter(Boolean);
            const uniqueCandidats = Array.from(new Map(candidatsExtracted.map((item) => [item.id_candidat, item])).values());
            setAllCandidats(uniqueCandidats);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadVivier();
    }, [loadVivier]);

    const loadCandidateProfile = useCallback(async (idCandidat) => {
        try {
            const res = await getJson(`/api/vivier/candidat/${idCandidat}/profile`);
            setProfileData(res?.data ?? null);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    async function handleAddToVivier(e) {
        e.preventDefault();
        if (!addForm.id_candidat) return;
        try {
            await sendJson('/api/vivier', {
                body: {
                    id_candidat: Number(addForm.id_candidat),
                    id_direction: addForm.id_direction ? Number(addForm.id_direction) : null,
                    id_domaine: addForm.id_domaine ? Number(addForm.id_domaine) : null,
                    motif_ajout: addForm.motif_ajout.trim() || 'Ajouté au vivier RH',
                },
            });
            setShowAddModal(false);
            setAddForm({ id_candidat: '', id_direction: '', id_domaine: '', motif_ajout: '' });
            await loadVivier();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleRemoveFromVivier(idVivier) {
        if (!window.confirm('Retirer ce candidat du vivier ?')) return;
        try {
            await sendJson(`/api/vivier/${idVivier}`, { method: 'DELETE' });
            await loadVivier();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAddCompetence(e) {
        e.preventDefault();
        if (!selectedCandidat || !newComp.id_competence) return;
        try {
            await sendJson(`/api/vivier/candidat/${selectedCandidat.id_candidat}/competences`, {
                body: {
                    id_competence: Number(newComp.id_competence),
                    niveau: newComp.niveau,
                },
            });
            setNewComp({ id_competence: '', niveau: 'Intermédiaire' });
            await loadCandidateProfile(selectedCandidat.id_candidat);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAddExperience(e) {
        e.preventDefault();
        if (!selectedCandidat || !newExp.intitule_poste) return;
        try {
            await sendJson(`/api/vivier/candidat/${selectedCandidat.id_candidat}/experiences`, {
                body: {
                    intitule_poste: newExp.intitule_poste.trim(),
                    entreprise: newExp.entreprise.trim() || null,
                    date_debut: newExp.date_debut || null,
                    date_fin: newExp.date_fin || null,
                    description: newExp.description.trim() || null,
                },
            });
            setNewExp({ intitule_poste: '', entreprise: '', date_debut: '', date_fin: '', description: '' });
            await loadCandidateProfile(selectedCandidat.id_candidat);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAddFormation(e) {
        e.preventDefault();
        if (!selectedCandidat || !newForm.diplome) return;
        try {
            await sendJson(`/api/vivier/candidat/${selectedCandidat.id_candidat}/formations`, {
                body: {
                    diplome: newForm.diplome.trim(),
                    etablissement: newForm.etablissement.trim() || null,
                    annee_obtention: newForm.annee_obtention ? Number(newForm.annee_obtention) : null,
                    domaine_etude: newForm.domaine_etude.trim() || null,
                },
            });
            setNewForm({ diplome: '', etablissement: '', annee_obtention: '', domaine_etude: '' });
            await loadCandidateProfile(selectedCandidat.id_candidat);
        } catch (err) {
            setError(err.message);
        }
    }

    const resetVivierFilters = () => {
        setFilters({ q: '', direction: '', domaine: '', statut: '' });
    };

    return (
        <div className="view-stack">
            {/* Header & Button */}
            <section className="filter-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', flex: 1 }}>
                    <label className="search-field" style={{ flex: '1 1 240px', minWidth: '200px' }}>
                        <Search size={18} />
                        <input
                            onChange={(e) => setFilters((curr) => ({ ...curr, q: e.target.value }))}
                            placeholder="Rechercher dans le vivier (nom, email)..."
                            type="search"
                            value={filters.q}
                        />
                    </label>

                    <label style={{ minWidth: '180px' }}>
                        <span>Direction</span>
                        <select
                            onChange={(e) => setFilters((curr) => ({ ...curr, direction: e.target.value }))}
                            value={filters.direction}
                        >
                            <option value="">Toutes les directions</option>
                            {referentiels.directions?.map((dir) => (
                                <option key={dir.id_direction} value={dir.id_direction}>
                                    {dir.nom_direction}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={{ minWidth: '180px' }}>
                        <span>Domaine d'expertise</span>
                        <select
                            onChange={(e) => setFilters((curr) => ({ ...curr, domaine: e.target.value }))}
                            value={filters.domaine}
                        >
                            <option value="">Tous les domaines validés</option>
                            {referentiels.domaines?.filter((d) => d.valide !== false).map((dom) => (
                                <option key={dom.id_domaine} value={dom.id_domaine}>
                                    {dom.nom_domaine}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="filter-button" onClick={loadVivier} type="button">
                            <Filter size={17} />
                            <span>Filtrer</span>
                        </button>
                        <button className="ghost-button" onClick={resetVivierFilters} title="Réinitialiser les filtres" type="button">
                            <RotateCcw size={16} />
                            <span>Réinitialiser</span>
                        </button>
                    </div>
                </div>

                <button className="primary-button" onClick={() => setShowAddModal(true)} type="button">
                    <Plus size={17} />
                    <span>Ajouter au vivier</span>
                </button>
            </section>

            <section className="data-section">
                <div className="section-heading">
                    <div>
                        <h2>Vivier de Talents RH & Compétences</h2>
                        <p>Gestion des candidats qualifiés conservés en vivier pour de futurs recrutements.</p>
                    </div>
                    <button className="ghost-button" onClick={loadVivier} type="button">
                        <RefreshCw size={17} />
                        <span>Actualiser</span>
                    </button>
                </div>

                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState message={error} onRetry={loadVivier} />
                ) : !vivierList.length ? (
                    <div className="empty-state">Aucun candidat dans le vivier avec les filtres actuels.</div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Candidat</th>
                                    <th>Direction & Domaine Target</th>
                                    <th>Motif d'ajout</th>
                                    <th>Date d'ajout</th>
                                    <th>Statut</th>
                                    <th>Actions RH</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vivierList.map((item) => (
                                    <tr key={item.id_vivier_candidat}>
                                        <td>
                                            <strong>{item.candidat?.prenom} {item.candidat?.nom}</strong>
                                            <br />
                                            <small>{item.candidat?.email}</small>
                                        </td>
                                        <td>
                                            <strong>{item.direction?.nom_direction ?? 'Toutes directions'}</strong>
                                            <br />
                                            <small>{item.domaine?.nom_domaine ?? 'Tous domaines'}</small>
                                        </td>
                                        <td>{item.motif_ajout ?? 'En vivier'}</td>
                                        <td>{formatDate(item.created_at)}</td>
                                        <td><span className="status-pill success">{item.statut ?? 'Actif'}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    className="filter-button"
                                                    onClick={() => {
                                                        setSelectedCandidat(item.candidat);
                                                        loadCandidateProfile(item.candidat.id_candidat);
                                                    }}
                                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                                    type="button"
                                                >
                                                    <User size={15} />
                                                    <span>Profil & Compétences</span>
                                                </button>
                                                <button
                                                    className="row-button danger"
                                                    onClick={() => handleRemoveFromVivier(item.id_vivier_candidat)}
                                                    title="Retirer du vivier"
                                                    type="button"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* MODAL AJOUT CANDIDAT VIVIER */}
            {showAddModal && (
                <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%' }}>
                        <div className="modal-header">
                            <h3>Ajouter un candidat au vivier</h3>
                            <button className="ghost-button" onClick={() => setShowAddModal(false)} type="button">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddToVivier} style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
                            <label>
                                <span>Candidat *</span>
                                <select
                                    onChange={(e) => setAddForm((curr) => ({ ...curr, id_candidat: e.target.value }))}
                                    required
                                    value={addForm.id_candidat}
                                >
                                    <option value="">Sélectionner un candidat</option>
                                    {allCandidats.map((c) => (
                                        <option key={c.id_candidat} value={c.id_candidat}>
                                            {c.prenom} {c.nom} ({c.email})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span>Direction suggérée</span>
                                <select
                                    onChange={(e) => setAddForm((curr) => ({ ...curr, id_direction: e.target.value }))}
                                    value={addForm.id_direction}
                                >
                                    <option value="">Toutes directions</option>
                                    {referentiels.directions?.map((d) => (
                                        <option key={d.id_direction} value={d.id_direction}>
                                            {d.nom_direction}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span>Motif d'ajout RH</span>
                                <input
                                    onChange={(e) => setAddForm((curr) => ({ ...curr, motif_ajout: e.target.value }))}
                                    placeholder="Ex: Excellent profil technique, à recontacter..."
                                    type="text"
                                    value={addForm.motif_ajout}
                                />
                            </label>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button className="ghost-button" onClick={() => setShowAddModal(false)} type="button">
                                    Annuler
                                </button>
                                <button className="primary-button" type="submit">
                                    Enregistrer dans le vivier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DRAWER PROFIL COMPÉTENCES & PARCOURS CANDIDAT */}
            {selectedCandidat && (
                <div className="modal-backdrop" onClick={() => setSelectedCandidat(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3>Profil & Fiche Compétences : {selectedCandidat.prenom} {selectedCandidat.nom}</h3>
                            <button className="ghost-button" onClick={() => setSelectedCandidat(null)} type="button">
                                <X size={18} />
                            </button>
                        </div>

                        {!profileData ? (
                            <LoadingState />
                        ) : (
                            <div style={{ display: 'grid', gap: '20px', marginTop: '14px' }}>
                                {/* COMPÉTENCES */}
                                <div className="data-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Sparkles size={16} />
                                        <span>Compétences Validées ({profileData.competences?.length ?? 0})</span>
                                    </h4>

                                    <div className="tags-list" style={{ marginBottom: '12px' }}>
                                        {(profileData.competences ?? []).map((c) => (
                                            <span key={c.id_competence} className="badge green" style={{ fontSize: '13px', padding: '6px 10px' }}>
                                                {c.nom_competence} - {c.niveau} ({c.source_extraction})
                                            </span>
                                        ))}
                                    </div>

                                    <form onSubmit={handleAddCompetence} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <select
                                            onChange={(e) => setNewComp((curr) => ({ ...curr, id_competence: e.target.value }))}
                                            style={{ padding: '6px 10px', fontSize: '13px' }}
                                            value={newComp.id_competence}
                                        >
                                            <option value="">Sélectionner une compétence</option>
                                            {(competencesData.competences ?? []).map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.nom} ({c.type})
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            onChange={(e) => setNewComp((curr) => ({ ...curr, niveau: e.target.value }))}
                                            style={{ padding: '6px 10px', fontSize: '13px' }}
                                            value={newComp.niveau}
                                        >
                                            <option value="Débutant">Débutant</option>
                                            <option value="Intermédiaire">Intermédiaire</option>
                                            <option value="Avancé">Avancé</option>
                                            <option value="Expert">Expert</option>
                                        </select>
                                        <button className="filter-button" type="submit">
                                            <Plus size={14} />
                                            <span>Ajouter</span>
                                        </button>
                                    </form>
                                </div>

                                {/* EXPÉRIENCES */}
                                <div className="data-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <BriefcaseBusiness size={16} />
                                        <span>Expériences Professionnelles ({profileData.experiences?.length ?? 0})</span>
                                    </h4>
                                    {(profileData.experiences ?? []).map((exp) => (
                                        <div key={exp.id_experience} style={{ background: '#fff', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '8px' }}>
                                            <strong>{exp.intitule_poste}</strong> - <span>{exp.entreprise}</span>
                                            {exp.description ? <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{exp.description}</p> : null}
                                        </div>
                                    ))}
                                    <form onSubmit={handleAddExperience} style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
                                        <input
                                            onChange={(e) => setNewExp((curr) => ({ ...curr, intitule_poste: e.target.value }))}
                                            placeholder="Intitulé du poste (ex: Chef de Projet)..."
                                            required
                                            type="text"
                                            value={newExp.intitule_poste}
                                        />
                                        <input
                                            onChange={(e) => setNewExp((curr) => ({ ...curr, entreprise: e.target.value }))}
                                            placeholder="Entreprise..."
                                            type="text"
                                            value={newExp.entreprise}
                                        />
                                        <button className="filter-button" type="submit">
                                            <Plus size={14} />
                                            <span>Ajouter l'expérience</span>
                                        </button>
                                    </form>
                                </div>

                                {/* FORMATIONS */}
                                <div className="data-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <GraduationCap size={16} />
                                        <span>Formations & Diplômes ({profileData.formations?.length ?? 0})</span>
                                    </h4>
                                    {(profileData.formations ?? []).map((f) => (
                                        <div key={f.id_formation} style={{ background: '#fff', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '8px' }}>
                                            <strong>{f.diplome}</strong> - <span>{f.etablissement}</span> ({f.annee_obtention ?? '-'})
                                        </div>
                                    ))}
                                    <form onSubmit={handleAddFormation} style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
                                        <input
                                            onChange={(e) => setNewForm((curr) => ({ ...curr, diplome: e.target.value }))}
                                            placeholder="Diplôme (ex: Master 2 Informatique)..."
                                            required
                                            type="text"
                                            value={newForm.diplome}
                                        />
                                        <input
                                            onChange={(e) => setNewForm((curr) => ({ ...curr, etablissement: e.target.value }))}
                                            placeholder="Établissement / Université..."
                                            type="text"
                                            value={newForm.etablissement}
                                        />
                                        <button className="filter-button" type="submit">
                                            <Plus size={14} />
                                            <span>Ajouter la formation</span>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
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
    const [saisirRhOffreId, setSaisirRhOffreId] = useState(null);
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

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="filter-button" onClick={loadOffers} type="button">
                        <Filter aria-hidden="true" size={17} />
                        <span>Filtrer</span>
                    </button>
                    <button
                        className="ghost-button"
                        onClick={() => setFilters({ q: '', direction: '', statut: '', type_contrat: '', page: 1 })}
                        title="Réinitialiser les filtres"
                        type="button"
                    >
                        <RotateCcw aria-hidden="true" size={16} />
                        <span>Réinitialiser</span>
                    </button>
                </div>
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
                        onSaisirRh={(id) => setSaisirRhOffreId(id)}
                        onSelectOffer={editOffer}
                        renderActions={renderOfferActions}
                    />
                )}

                {meta ? <Pagination meta={meta} onChangePage={changePage} /> : null}
            </section>

            {saisirRhOffreId ? (
                <SaisirRhCandidatureModal
                    initialOffreId={saisirRhOffreId}
                    onClose={() => setSaisirRhOffreId(null)}
                    onSuccess={loadOffers}
                    referentiels={referentiels}
                />
            ) : null}
        </div>
    );
}

function OffersTable({ compact = false, offers, onNavigate = null, onSaisirRh = null, onSelectOffer = null, renderActions = null }) {
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
                                                {!compact ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onSaisirRh) onSaisirRh(offre.id);
                                                        }}
                                                        style={{
                                                            background: '#ede9fe',
                                                            color: '#6d28d9',
                                                            border: '1px solid #ddd6fe',
                                                            borderRadius: '6px',
                                                            padding: '6px 10px',
                                                            fontWeight: '600',
                                                            fontSize: '12px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 1px 2px rgba(109, 40, 217, 0.08)',
                                                        }}
                                                        title="Saisir manuellement une candidature RH pour cette offre"
                                                        type="button"
                                                    >
                                                        <UserPlus size={14} />
                                                        <span>+ Candidature RH</span>
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
