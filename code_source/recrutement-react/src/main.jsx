import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { backendPath, getJson, getPublicJson, sendPublicFormData } from './api/client';
import { ErrorState, LoadingState } from './components/common/FeedbackStates';
import { AppShell } from './components/layout/AppShell';

// Code-splitting lazy loading for all heavy page modules
const DashboardView = lazy(() => import('./pages/DashboardView').then((m) => ({ default: m.DashboardView })));
const OffersView = lazy(() => import('./pages/OffersView').then((m) => ({ default: m.OffersView })));
const CandidaturesView = lazy(() => import('./pages/CandidaturesView').then((m) => ({ default: m.CandidaturesView })));
const ReferentialsView = lazy(() => import('./pages/ReferentialsView').then((m) => ({ default: m.ReferentialsView })));
const VivierView = lazy(() => import('./pages/VivierView').then((m) => ({ default: m.VivierView })));

const CandidatureSpontaneePage = lazy(() => import('./frontOffice/CandidatureSpontaneePage'));
const PostulerOffrePage = lazy(() => import('./frontOffice/PostulerOffrePage'));
const PublicOffresPage = lazy(() => import('./frontOffice/PublicOffresPage'));

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

    const loadedRef = useRef(false);

    const isPublicPath =
        path.startsWith('/candidat/offres') ||
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

    // Back-Office Load Base Data (Guarded against duplicate calls)
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
        if (loadedRef.current) return;
        loadedRef.current = true;
        if (!isPublicPath) {
            loadBaseData();
        } else {
            setBootstrapLoading(false);
        }
    }, [loadBaseData, isPublicPath]);

    // Front-Office Routing (Public Candidates)
    if (path.startsWith('/candidat/offres')) {
        return (
            <Suspense fallback={<LoadingState />}>
                <PublicOffresPage getJson={getPublicJson} onNavigate={navigate} />
            </Suspense>
        );
    }

    if (path.startsWith('/candidature-spontanee')) {
        return (
            <Suspense fallback={<LoadingState />}>
                <CandidatureSpontaneePage getJson={getPublicJson} onNavigate={navigate} sendFormData={sendPublicFormData} />
            </Suspense>
        );
    }

    const offreSlugMatch = path.match(/\/offre\/([^\/]+)/);
    const postulerMatch = path.match(/\/offres\/(\d+)\/postuler/);
    const targetSlugOrId = offreSlugMatch ? offreSlugMatch[1] : (postulerMatch ? postulerMatch[1] : null);

    if (targetSlugOrId) {
        return (
            <Suspense fallback={<LoadingState />}>
                <PostulerOffrePage
                    backendPath={backendPath}
                    getJson={getPublicJson}
                    idOffre={targetSlugOrId}
                    onNavigate={navigate}
                    sendFormData={sendPublicFormData}
                />
            </Suspense>
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
        <AppShell activePath={path} activeView={activeView} onNavigate={navigate} user={user}>
            {bootstrapError ? (
                <ErrorState message={bootstrapError} />
            ) : bootstrapLoading ? (
                <LoadingState />
            ) : (
                <Suspense fallback={<LoadingState />}>
                    {activeView === 'offres' ? (
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
                </Suspense>
            )}
        </AppShell>
    );
}

const rootElement = document.getElementById('recrutement-app') || document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
