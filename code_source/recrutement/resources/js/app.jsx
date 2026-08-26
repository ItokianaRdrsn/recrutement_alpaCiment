import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    BriefcaseBusiness,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Database,
    Filter,
    LayoutDashboard,
    LogOut,
    RefreshCw,
    Search,
    Users,
} from 'lucide-react';

const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

async function getJson(url) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
        },
    });

    if (response.status === 401) {
        window.location.href = '/login';
        return null;
    }

    if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
    }

    return response.json();
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('fr-FR').format(new Date(value));
}

function submitLogout() {
    const form = document.getElementById('logout-form');

    if (form instanceof HTMLFormElement) {
        form.submit();
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

    const activeView = path.startsWith('/offres') ? 'offres' : 'dashboard';

    return (
        <AppShell activeView={activeView} user={user} onNavigate={navigate}>
            {bootstrapError ? (
                <ErrorState message={bootstrapError} />
            ) : bootstrapLoading ? (
                <LoadingState />
            ) : activeView === 'offres' ? (
                <OffersView referentiels={referentiels} />
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
                        <h1>{activeView === 'offres' ? "Offres d'emploi" : 'Tableau de bord'}</h1>
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

function OffersView({ referentiels }) {
    const [filters, setFilters] = useState({
        q: '',
        direction: '',
        statut: '',
        type_contrat: '',
        page: 1,
    });
    const [offersResponse, setOffersResponse] = useState({ data: [], meta: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const meta = offersResponse.meta;

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
                    <button className="ghost-button" onClick={loadOffers} type="button">
                        <RefreshCw aria-hidden="true" size={17} />
                        <span>Actualiser</span>
                    </button>
                </div>

                {error ? <ErrorState message={error} onRetry={loadOffers} /> : loading ? <LoadingState /> : <OffersTable offers={offersResponse.data} />}

                {meta ? <Pagination meta={meta} onChangePage={changePage} /> : null}
            </section>
        </div>
    );
}

function OffersTable({ compact = false, offers }) {
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

if (csrfToken) {
    window.recrutementCsrfToken = csrfToken;
}

createRoot(document.getElementById('recrutement-app')).render(<App />);
