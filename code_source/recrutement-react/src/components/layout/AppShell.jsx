import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    BriefcaseBusiness,
    Building2,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Layers,
    LayoutDashboard,
    LogOut,
    UserCheck,
} from 'lucide-react';
import { submitLogout } from '../../api/client';

export function AppShell({ children, user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const activePath = location.pathname;

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
                                                navigate(item.href);
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
                                                            navigate(sub.href);
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
                                    navigate(item.href);
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
                        onClick={() => navigate('/candidat/offres')}
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
                                : activeView === 'vivier'
                                ? 'Vivier & OCR'
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
