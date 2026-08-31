import React, { useCallback, useEffect, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Database, RefreshCw, Users } from 'lucide-react';
import { getJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { KpiCard } from '../components/common/KpiCard';
import { OffersTable } from './OffersTable';

export function DashboardView({ onSelectOffer }) {
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
