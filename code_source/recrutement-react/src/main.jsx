import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './styles.css';
import { backendPath, getJson, getPublicJson, sendPublicFormData } from './api/client';
import { ErrorState, LoadingState, PagePreloader } from './components/common/FeedbackStates';
import { AppShell } from './components/layout/AppShell';
import { PublicLayout } from './components/layout/PublicLayout';

// Code-splitting lazy loading for all heavy page modules
const DashboardView = lazy(() => import('./pages/DashboardView').then((m) => ({ default: m.DashboardView })));
const OffersView = lazy(() => import('./pages/OffersView').then((m) => ({ default: m.OffersView })));
const CandidaturesOffresView = lazy(() => import('./pages/CandidaturesOffresView').then((m) => ({ default: m.CandidaturesOffresView })));
const CandidaturesSpontaneesView = lazy(() => import('./pages/CandidaturesSpontaneesView').then((m) => ({ default: m.CandidaturesSpontaneesView })));
const ReferentialsView = lazy(() => import('./pages/ReferentialsView').then((m) => ({ default: m.ReferentialsView })));
const VivierView = lazy(() => import('./pages/VivierView').then((m) => ({ default: m.VivierView })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));

const CandidatureSpontaneePage = lazy(() => import('./frontOffice/CandidatureSpontaneePage'));
const PostulerOffrePage = lazy(() => import('./frontOffice/PostulerOffrePage'));
const PublicOffresPage = lazy(() => import('./frontOffice/PublicOffresPage'));

function BackOfficeLayout({ bootstrapError, bootstrapLoading, children, user }) {
    if (bootstrapError) return <ErrorState message={bootstrapError} />;
    if (bootstrapLoading) return <PagePreloader />;
    if (!user) {
        return <Navigate replace to="/login" />;
    }

    return <AppShell user={user}>{children}</AppShell>;
}

function MainApp() {
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;

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

    const isPublicCandidatePath =
        path.startsWith('/candidat/offres') ||
        path.startsWith('/nos-offres') ||
        path.startsWith('/candidature-spontanee') ||
        Boolean(path.match(/\/offres\/(\d+)\/postuler/)) ||
        Boolean(path.match(/\/offre\/([^\/]+)/));

    const isLoginPage = path === '/login';

    // Back-Office Load Base Data
    const loadBaseData = useCallback(async () => {
        if (isPublicCandidatePath || isLoginPage) {
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
            // Unauthenticated 401 is normal for guests, only set error for real server failures
            if (!error.message?.includes('401')) {
                setBootstrapError(error.message);
            }
        } finally {
            setBootstrapLoading(false);
        }
    }, [isPublicCandidatePath, isLoginPage]);

    useEffect(() => {
        if (loadedRef.current && !isLoginPage) return;
        if (!isPublicCandidatePath && !isLoginPage) {
            loadedRef.current = true;
            loadBaseData();
        } else {
            setBootstrapLoading(false);
        }
    }, [loadBaseData, isPublicCandidatePath, isLoginPage]);

    const handleLoginSuccess = async (userData) => {
        setUser(userData);
        loadedRef.current = false;
        await loadBaseData();
    };

    useEffect(() => {
        const preloader = document.getElementById('site-preloader');
        if (preloader) {
            preloader.classList.add('fade-out');
            const timer = setTimeout(() => {
                preloader.style.display = 'none';
            }, 550);
            return () => clearTimeout(timer);
        }
    }, []);

    function handleSelectOfferFromDashboard(offre) {
        setEditingOffer(offre);
        navigate('/offres');
    }

    return (
        <Suspense fallback={<PagePreloader />}>
            <Routes>
                {/* LOGIN ROUTE */}
                <Route
                    element={user ? <Navigate replace to="/dashboard" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
                    path="/login"
                />

                {/* PUBLIC FRONT-OFFICE ROUTES */}
                <Route
                    element={
                        <PublicLayout>
                            <PublicOffresPage getJson={getPublicJson} onNavigate={navigate} />
                        </PublicLayout>
                    }
                    path="/candidat/offres"
                />
                <Route
                    element={
                        <PublicLayout>
                            <PublicOffresPage getJson={getPublicJson} onNavigate={navigate} />
                        </PublicLayout>
                    }
                    path="/nos-offres"
                />
                <Route
                    element={
                        <PublicLayout>
                            <CandidatureSpontaneePage getJson={getPublicJson} onNavigate={navigate} sendFormData={sendPublicFormData} />
                        </PublicLayout>
                    }
                    path="/candidature-spontanee"
                />
                <Route
                    element={
                        <PublicLayout>
                            <PostulerOffrePage
                                backendPath={backendPath}
                                getJson={getPublicJson}
                                idOffre={path.match(/\/offres\/(\d+)\/postuler/)?.[1]}
                                onNavigate={navigate}
                                sendFormData={sendPublicFormData}
                            />
                        </PublicLayout>
                    }
                    path="/offres/:id/postuler"
                />
                <Route
                    element={
                        <PublicLayout>
                            <PostulerOffrePage
                                backendPath={backendPath}
                                getJson={getPublicJson}
                                idOffre={path.match(/\/offre\/([^\/]+)/)?.[1]}
                                onNavigate={navigate}
                                sendFormData={sendPublicFormData}
                            />
                        </PublicLayout>
                    }
                    path="/offre/:slug"
                />

                {/* PROTECTED BACK-OFFICE ROUTES */}
                <Route
                    element={
                        <BackOfficeLayout bootstrapError={bootstrapError} bootstrapLoading={bootstrapLoading} user={user}>
                            <DashboardView onSelectOffer={handleSelectOfferFromDashboard} />
                        </BackOfficeLayout>
                    }
                    path="/dashboard"
                />
                <Route
                    element={
                        <BackOfficeLayout bootstrapError={bootstrapError} bootstrapLoading={bootstrapLoading} user={user}>
                            <OffersView
                                canManage={user?.permissions?.includes('manage_offres') ?? false}
                                competencesData={competencesData}
                                initialEditingOffer={editingOffer}
                                onClearEditingOffer={() => setEditingOffer(null)}
                                onNavigate={navigate}
                                onRefreshBase={loadBaseData}
                                referentiels={referentiels}
                            />
                        </BackOfficeLayout>
                    }
                    path="/offres"
                />
                <Route
                    element={<Navigate replace to="/candidatures/offres" />}
                    path="/candidatures"
                />
                <Route
                    element={
                        <BackOfficeLayout bootstrapError={bootstrapError} bootstrapLoading={bootstrapLoading} user={user}>
                            <CandidaturesOffresView referentiels={referentiels} />
                        </BackOfficeLayout>
                    }
                    path="/candidatures/offres"
                />
                <Route
                    element={
                        <BackOfficeLayout bootstrapError={bootstrapError} bootstrapLoading={bootstrapLoading} user={user}>
                            <CandidaturesSpontaneesView referentiels={referentiels} />
                        </BackOfficeLayout>
                    }
                    path="/candidatures/spontanees"
                />
                <Route
                    element={
                        <BackOfficeLayout bootstrapError={bootstrapError} bootstrapLoading={bootstrapLoading} user={user}>
                            <VivierView competencesData={competencesData} referentiels={referentiels} />
                        </BackOfficeLayout>
                    }
                    path="/vivier"
                />
                <Route
                    element={
                        <BackOfficeLayout bootstrapError={bootstrapError} bootstrapLoading={bootstrapLoading} user={user}>
                            <ReferentialsView
                                canManage={user?.permissions?.includes('manage_referentiels') ?? false}
                                competencesData={competencesData}
                                initialSubTab="all"
                                onRefreshBase={loadBaseData}
                            />
                        </BackOfficeLayout>
                    }
                    path="/referentiels"
                />
                <Route
                    element={
                        <BackOfficeLayout bootstrapError={bootstrapError} bootstrapLoading={bootstrapLoading} user={user}>
                            <ReferentialsView
                                canManage={user?.permissions?.includes('manage_referentiels') ?? false}
                                competencesData={competencesData}
                                initialSubTab="directions"
                                onRefreshBase={loadBaseData}
                            />
                        </BackOfficeLayout>
                    }
                    path="/referentiels/directions"
                />
                <Route
                    element={
                        <BackOfficeLayout bootstrapError={bootstrapError} bootstrapLoading={bootstrapLoading} user={user}>
                            <ReferentialsView
                                canManage={user?.permissions?.includes('manage_referentiels') ?? false}
                                competencesData={competencesData}
                                initialSubTab="domaines"
                                onRefreshBase={loadBaseData}
                            />
                        </BackOfficeLayout>
                    }
                    path="/referentiels/domaines"
                />
                <Route
                    element={
                        <BackOfficeLayout bootstrapError={bootstrapError} bootstrapLoading={bootstrapLoading} user={user}>
                            <ReferentialsView
                                canManage={user?.permissions?.includes('manage_referentiels') ?? false}
                                competencesData={competencesData}
                                initialSubTab="competences"
                                onRefreshBase={loadBaseData}
                            />
                        </BackOfficeLayout>
                    }
                    path="/referentiels/competences"
                />

                {/* DEFAULT FALLBACK REDIRECT */}
                <Route element={<Navigate replace to="/dashboard" />} path="/" />
                <Route element={<Navigate replace to="/dashboard" />} path="*" />
            </Routes>
        </Suspense>
    );
}

export function App() {
    return (
        <BrowserRouter>
            <MainApp />
        </BrowserRouter>
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
