import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Database,
    Edit3,
    Filter,
    LayoutDashboard,
    LogOut,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react';

const backendUrl = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/$/, '');

function backendPath(path) {
    return backendUrl ? `${backendUrl}${path}` : path;
}

async function getJson(url) {
    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    if (response.status === 401) {
        window.location.href = backendPath('/login');
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
        window.location.href = backendPath('/login');
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
    };
}

async function submitLogout() {
    try {
        await sendJson('/logout', { method: 'POST' });
    } finally {
        window.location.href = backendPath('/login');
    }
}

function App() {
    const [path, setPath] = useState(window.location.pathname);
    const [user, setUser] = useState(null);
    const [referentiels, setReferentiels] = useState({
        directions: [],
        statuts_offre: [],
        types_contrat: [],
    });
    const [bootstrapLoading, setBootstrapLoading] = useState(true);
    const [bootstrapError, setBootstrapError] = useState('');

    useEffect(() => {
        const handlePopState = () => setPath(window.location.pathname);

        window.addEventListener('popstate', handlePopState);

        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        let active = true;

        async function loadBaseData() {
            try {
                const [meResponse, referentielResponse] = await Promise.all([
                    getJson('/api/me'),
                    getJson('/api/referentiels/recrutement'),
                ]);

                if (!active || !meResponse || !referentielResponse) {
                    return;
                }

                setUser(meResponse.data);
                setReferentiels(referentielResponse.data);
            } catch (error) {
                setBootstrapError(error.message);
            } finally {
                if (active) {
                    setBootstrapLoading(false);
                }
            }
        }

        loadBaseData();

        return () => {
            active = false;
        };
    }, []);

    const navigate = useCallback((target) => {
        window.history.pushState({}, '', target);
        setPath(target);
    }, []);

    const activeView = path.startsWith('/offres') ? 'offres' : path.startsWith('/referentiels') ? 'referentiels' : 'dashboard';

    return (
        <AppShell activeView={activeView} user={user} onNavigate={navigate}>
            {bootstrapError ? (
                <ErrorState message={bootstrapError} />
            ) : bootstrapLoading ? (
                <LoadingState />
            ) : activeView === 'offres' ? (
                <OffersView canManage={user?.permissions?.includes('manage_offres') ?? false} referentiels={referentiels} />
            ) : activeView === 'referentiels' ? (
                <ReferentialsView canManage={user?.permissions?.includes('manage_referentiels') ?? false} />
            ) : (
                <DashboardView />
            )}
        </AppShell>
    );
}

function AppShell({ activeView, children, onNavigate, user }) {
    const navItems = [
        { id: 'dashboard', label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
        { id: 'offres', label: 'Offres', href: '/offres', icon: BriefcaseBusiness },
        { id: 'referentiels', label: 'Referentiels', href: '/referentiels', icon: Building2 },
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
            </aside>

            <div className="content-area">
                <header className="topbar">
                    <div>
                        <p className="eyebrow">Back-office RH</p>
                        <h1>{activeView === 'offres' ? "Offres d'emploi" : activeView === 'referentiels' ? 'Referentiels' : 'Tableau de bord'}</h1>
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

function ReferentialsView({ canManage }) {
    const [directions, setDirections] = useState([]);
    const [domaines, setDomaines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [directionForm, setDirectionForm] = useState({ id: null, nom_direction: '' });
    const [domaineForm, setDomaineForm] = useState({ id: null, nom_domaine: '', id_direction: '', valide: false });

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
        } catch (caughtError) {
            setError(caughtError.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadReferentials();
    }, [loadReferentials]);

    async function saveDirection(event) {
        event.preventDefault();
        const name = directionForm.nom_direction.trim();

        if (!name) {
            return;
        }

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

        if (!name || !domaineForm.id_direction) {
            return;
        }

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
        try {
            await sendJson(`/api/domaines/${domaine.id}`, { method: 'DELETE' });
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

            <section className="management-grid">
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
            </section>
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
            <button className="row-button" onClick={onEdit} title="Modifier" type="button">
                <Edit3 aria-hidden="true" size={16} />
            </button>
            <button className="row-button danger" onClick={onDelete} title="Supprimer" type="button">
                <Trash2 aria-hidden="true" size={16} />
            </button>
        </div>
    );
}

function DashboardView() {
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
                <KpiCard icon={BriefcaseBusiness} label="Offres publiees" value={kpis.offres_publiees} tone="blue" />
                <KpiCard icon={Database} label="Offres total" value={kpis.offres_total} tone="green" />
                <KpiCard icon={Users} label="Candidatures sur offre" value={kpis.candidatures_sur_offre} tone="neutral" />
                <KpiCard icon={CalendarDays} label="Domaines en attente" value={kpis.domaines_en_attente} tone="amber" />
            </section>

            <section className="data-section">
                <div className="section-heading">
                    <div>
                        <h2>Offres recentes</h2>
                        <p>Suivi rapide des dernieres offres alimentees dans le socle.</p>
                    </div>
                    <button className="ghost-button" onClick={loadDashboard} type="button">
                        <RefreshCw aria-hidden="true" size={17} />
                        <span>Actualiser</span>
                    </button>
                </div>

                <OffersTable offers={dashboard.offres_recentes ?? []} compact />
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

function OffersView({ canManage, referentiels }) {
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

    function resetOfferForm() {
        setFormError('');
        setOfferForm({
            ...emptyOfferForm,
            id_statut_offre: defaultStatusId ? String(defaultStatusId) : '',
        });
    }

    function editOffer(offre) {
        setFormError('');
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
        });
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
            await loadOffers();
        } catch (caughtError) {
            setFormError(caughtError.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteOffer(offre) {
        const confirmed = window.confirm(`Supprimer l'offre "${offre.titre_poste}" ?`);

        if (!confirmed) {
            return;
        }

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
              const status = offre.statut?.libelle;

              return (
                  <RowActions
                      extra={
                          <>
                              <button
                                  className="row-button success"
                                  disabled={status === 'Publiee'}
                                  onClick={() => changeOfferStatus(offre, 'publier')}
                                  title="Publier"
                                  type="button"
                              >
                                  <CheckCircle2 aria-hidden="true" size={16} />
                              </button>
                              <button
                                  className="row-button"
                                  disabled={status === 'Cloturee'}
                                  onClick={() => changeOfferStatus(offre, 'cloturer')}
                                  title="Cloturer"
                                  type="button"
                              >
                                  <X aria-hidden="true" size={16} />
                              </button>
                          </>
                      }
                      onDelete={() => deleteOffer(offre)}
                      onEdit={() => editOffer(offre)}
                  />
              );
          }
        : null;

    const meta = offersResponse.meta;

    return (
        <div className="view-stack">
            {canManage ? (
                <section className="data-section">
                    <div className="section-heading">
                        <div>
                            <h2>{offerForm.id ? 'Modifier une offre' : 'Nouvelle offre'}</h2>
                            <p>Creation et mise a jour des offres d'emploi.</p>
                        </div>
                    </div>

                    <form className="compact-form offer-form" onSubmit={saveOffer}>
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
                                {referentiels.statuts_offre?.map((statut) => (
                                    <option key={statut.id_statut_offre} value={statut.id_statut_offre}>
                                        {statut.libelle}
                                    </option>
                                ))}
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
                            <span>Description</span>
                            <textarea
                                name="description"
                                onChange={(event) => updateOfferForm('description', event.target.value)}
                                rows={4}
                                value={offerForm.description}
                            />
                        </label>

                        <div className="form-actions full-span">
                            <button className="filter-button" disabled={saving} type="submit">
                                <Save aria-hidden="true" size={17} />
                                <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
                            </button>
                            {offerForm.id ? (
                                <button className="ghost-button" onClick={resetOfferForm} type="button">
                                    <X aria-hidden="true" size={17} />
                                    <span>Annuler</span>
                                </button>
                            ) : null}
                        </div>

                        {formError ? <p className="form-error full-span">{formError}</p> : null}
                    </form>
                </section>
            ) : null}

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
                    <button className="ghost-button" onClick={loadOffers} type="button">
                        <RefreshCw aria-hidden="true" size={17} />
                        <span>Actualiser</span>
                    </button>
                </div>

                {error ? (
                    <ErrorState message={error} onRetry={loadOffers} />
                ) : loading ? (
                    <LoadingState />
                ) : (
                    <OffersTable offers={offersResponse.data} renderActions={renderOfferActions} />
                )}

                {meta ? <Pagination meta={meta} onChangePage={changePage} /> : null}
            </section>
        </div>
    );
}

function OffersTable({ compact = false, offers, renderActions = null }) {
    if (!offers.length) {
        return <div className="empty-state">Aucune offre a afficher pour le moment.</div>;
    }

    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Poste</th>
                        <th>Direction</th>
                        <th>Contrat</th>
                        <th>Publication</th>
                        {!compact ? <th>Limite</th> : null}
                        <th>Statut</th>
                        {renderActions ? <th>Actions</th> : null}
                    </tr>
                </thead>
                <tbody>
                    {offers.map((offre) => (
                        <tr key={offre.id}>
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
                            {renderActions ? <td>{renderActions(offre)}</td> : null}
                        </tr>
                    ))}
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
