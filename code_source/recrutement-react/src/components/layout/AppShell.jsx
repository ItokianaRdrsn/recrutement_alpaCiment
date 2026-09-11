import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    BriefcaseBusiness,
    Building2,
    ChevronDown,
    ChevronUp,
    Layers,
    LayoutDashboard,
    LogOut,
    Sparkles,
    UserCheck,
} from 'lucide-react';
import { submitLogout } from '../../api/client';

export function AppShell({ children, user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const activePath = location.pathname;

    useEffect(() => {
        // Enforce hiding the custom dot cursor in the back office
        const cursor = document.querySelector('.cb-cursor');
        if (cursor) {
            cursor.style.display = 'none';
        }
        document.body.classList.add('in-backoffice');

        return () => {
            if (cursor) {
                cursor.style.display = '';
            }
            document.body.classList.remove('in-backoffice');
        };
    }, []);

    const activeView = activePath.startsWith('/offres')
        ? 'offres'
        : activePath.startsWith('/candidatures')
        ? 'candidatures'
        : activePath.startsWith('/vivier')
        ? 'vivier'
        : activePath.startsWith('/referentiels')
        ? 'referentiels'
        : 'dashboard';

    const [referentielsOpen, setReferentielsOpen] = useState(activeView === 'referentiels');

    useEffect(() => {
        if (activeView === 'referentiels') {
            setReferentielsOpen(true);
        }
    }, [activeView]);

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
                    <img
                        src="/themes/custom/apiqa/images/logo-cut.png"
                        alt="AlpA Ciment Logo"
                        className="sidebar-logo-img"
                    />
                    <div>
                        <strong>AlpA Ciment</strong>
                        <span>Portail Recrutement RH</span>
                    </div>
                </div>

                <nav className="main-nav" aria-label="Navigation principale">
                    {/* TABLEAU DE BORD */}
                    <a
                        aria-current={activePath === '/dashboard' ? 'page' : undefined}
                        className={activePath === '/dashboard' ? 'nav-link active' : 'nav-link'}
                        href="/dashboard"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/dashboard');
                        }}
                    >
                        <LayoutDashboard aria-hidden="true" size={18} />
                        <span>Tableau de bord</span>
                    </a>

                    {/* OFFRES */}
                    <a
                        aria-current={activePath.startsWith('/offres') && !activePath.startsWith('/candidatures') ? 'page' : undefined}
                        className={activePath.startsWith('/offres') && !activePath.startsWith('/candidatures') ? 'nav-link active' : 'nav-link'}
                        href="/offres"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/offres');
                        }}
                    >
                        <BriefcaseBusiness aria-hidden="true" size={18} />
                        <span>Offres d'emploi</span>
                    </a>

                    {/* CANDIDATURES SUR OFFRE */}
                    <a
                        aria-current={activePath === '/candidatures/offres' ? 'page' : undefined}
                        className={activePath === '/candidatures/offres' ? 'nav-link active' : 'nav-link'}
                        href="/candidatures/offres"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/candidatures/offres');
                        }}
                    >
                        <UserCheck aria-hidden="true" size={18} />
                        <span>Candidatures sur offre</span>
                    </a>

                    {/* CANDIDATURES SPONTANÉES */}
                    <a
                        aria-current={activePath === '/candidatures/spontanees' ? 'page' : undefined}
                        className={activePath === '/candidatures/spontanees' ? 'nav-link active' : 'nav-link'}
                        href="/candidatures/spontanees"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/candidatures/spontanees');
                        }}
                    >
                        <Sparkles aria-hidden="true" size={18} />
                        <span>Candidatures spontanées</span>
                    </a>

                    {/* VIVIER & OCR */}
                    <a
                        aria-current={activePath === '/vivier' ? 'page' : undefined}
                        className={activePath === '/vivier' ? 'nav-link active' : 'nav-link'}
                        href="/vivier"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/vivier');
                        }}
                    >
                        <Layers aria-hidden="true" size={18} />
                        <span>Vivier</span>
                    </a>

                    {/* RÉFÉRENTIELS (CLIC SUR LE HEADER AFFICHE / MASQUE UNIQUEMENT LE MENU DÉROULANT SANS REDIRECTION AUTOMATIQUE) */}
                    <div
                        className={activeView === 'referentiels' ? 'nav-link active' : 'nav-link'}
                        onClick={() => setReferentielsOpen((curr) => !curr)}
                        style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Building2 aria-hidden="true" size={18} />
                            <span>Référentiels</span>
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
                                            navigate(sub.href);
                                        }}
                                    >
                                        <span>• {sub.label}</span>
                                    </a>
                                );
                            })}
                        </div>
                    ) : null}
                </nav>

                
            </aside>

            <div className="content-area">
                <header className="topbar">
                    <div>
                        <h1>
                            {activePath === '/candidatures/offres'
                                ? 'Candidatures sur offre'
                                : activePath === '/candidatures/spontanees'
                                ? 'Candidatures spontanées'
                                : activeView === 'offres'
                                ? "Offres d'emploi"
                                : activeView === 'vivier'
                                ? 'Vivier'
                                : activeView === 'referentiels'
                                ? 'Référentiels'
                                : 'Tableau de bord'}
                        </h1>
                    </div>

                    <div className="topbar-actions">
                        <div className="user-chip">
                            <span>{user?.name ?? 'Utilisateur'}</span>
                            <small>{user?.role ?? '-'}</small>
                        </div>
                        <button className="icon-button danger" onClick={submitLogout} title="Se déconnecter" type="button">
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
