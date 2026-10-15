import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    BriefcaseBusiness,
    Calendar,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock,
    Download,
    Eye,
    Filter,
    Flame,
    Layers,
    LineChart as LineChartIcon,
    PieChart as PieChartIcon,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingDown,
    TrendingUp,
    UserCheck,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { getJson } from '../api/client';
import { DashboardSkeleton, ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { OffersTable } from './OffersTable';

export function DashboardView({ onSelectOffer }) {
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtres
    const [periode, setPeriode] = useState('all');
    const [directionId, setDirectionId] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');

    // État d'interaction pour les graphiques
    const [chartMode, setChartMode] = useState('area'); // 'area' | 'bars'
    const [activeMonthHover, setActiveMonthHover] = useState(null);
    const [activeDonutIndex, setActiveDonutIndex] = useState(null);
    const [activeTab, setActiveTab] = useState('global'); // 'global' | 'funnel' | 'channels'

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (directionId) params.set('direction_id', directionId);
            if (dateDebut) params.set('date_debut', dateDebut);
            if (dateFin) params.set('date_fin', dateFin);
            if (periode && !dateDebut && !dateFin && periode !== 'all') {
                params.set('periode', periode);
            }

            const response = await getJson(`/api/dashboard?${params.toString()}`);
            setDashboard(response?.data ?? null);
        } catch (caughtError) {
            setError(caughtError.message);
        } finally {
            setLoading(false);
        }
    }, [directionId, dateDebut, dateFin, periode]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const handlePresetClick = (presetId) => {
        setPeriode(presetId);
        const today = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const formatYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        if (presetId === 'all') {
            setDateDebut('');
            setDateFin('');
        } else if (presetId === 'this_month') {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setDateDebut(formatYmd(start));
            setDateFin(formatYmd(end));
        } else if (presetId === '30_days') {
            const start = new Date();
            start.setDate(today.getDate() - 29);
            setDateDebut(formatYmd(start));
            setDateFin(formatYmd(today));
        } else if (presetId === 'this_year') {
            const start = new Date(today.getFullYear(), 0, 1);
            const end = new Date(today.getFullYear(), 11, 31);
            setDateDebut(formatYmd(start));
            setDateFin(formatYmd(end));
        }
    };

    const handleResetFilters = () => {
        setPeriode('all');
        setDirectionId('');
        setDateDebut('');
        setDateFin('');
    };

    const kpis = dashboard?.kpis ?? {};
    const entonnoir = dashboard?.entonnoir ?? [];
    const evolutionMensuelle = dashboard?.evolution_mensuelle ?? [];
    const repartitionDirections = dashboard?.repartition_directions ?? [];
    const repartitionCanaux = dashboard?.repartition_canaux ?? [];
    const candidaturesATraiter = dashboard?.candidatures_a_traiter ?? [];
    const offresRecentes = dashboard?.offres_recentes ?? [];

    // =========================================================================
    // CALCULS POUR LES GRAPHIQUES SVG
    // =========================================================================

    // 1. Graphique d'aire / Spline SVG
    const maxMonthlyTotal = Math.max(5, ...evolutionMensuelle.map((m) => m.total || 0));
    const chartHeight = 125;
    const chartWidth = 560;
    const paddingX = 35;
    const paddingY = 16;
    const innerWidth = chartWidth - paddingX * 2;
    const innerHeight = chartHeight - paddingY * 2;

    const points = useMemo(() => {
        if (!evolutionMensuelle.length) return [];
        if (evolutionMensuelle.length === 1) {
            const m = evolutionMensuelle[0];
            const x = chartWidth / 2;
            const y = chartHeight - paddingY - ((m.total || 0) / maxMonthlyTotal) * innerHeight;
            return [{ x, y, ...m }];
        }
        return evolutionMensuelle.map((m, index) => {
            const x = paddingX + (index / (evolutionMensuelle.length - 1 || 1)) * innerWidth;
            const y = chartHeight - paddingY - ((m.total || 0) / maxMonthlyTotal) * innerHeight;
            return { x, y, ...m };
        });
    }, [evolutionMensuelle, maxMonthlyTotal, innerWidth, innerHeight, chartHeight]);

    // Génération du path SVG lissé (Bézier spline)
    const areaSvgPaths = useMemo(() => {
        if (!points.length) return { linePath: '', areaPath: '' };
        if (points.length === 1) {
            const p = points[0];
            const line = `M ${paddingX} ${p.y} L ${chartWidth - paddingX} ${p.y}`;
            const area = `M ${paddingX} ${p.y} L ${chartWidth - paddingX} ${p.y} L ${chartWidth - paddingX} ${chartHeight - paddingY} L ${paddingX} ${chartHeight - paddingY} Z`;
            return { linePath: line, areaPath: area };
        }

        let line = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cx = (p0.x + p1.x) / 2;
            line += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
        }

        const area = `${line} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
        return { linePath: line, areaPath: area };
    }, [points, chartHeight, paddingY]);

    // 2. Calcul Donut SVG pour les Canaux
    const totalCanaux = useMemo(() => {
        return repartitionCanaux.reduce((acc, c) => acc + (c.count || 0), 0) || 1;
    }, [repartitionCanaux]);

    const donutSegments = useMemo(() => {
        const radius = 38;
        const circumference = 2 * Math.PI * radius;
        let cumulativePct = 0;
        const palette = ['#FF0D00', '#2563eb', '#8b5cf6', '#10b981'];

        return repartitionCanaux.map((ch, idx) => {
            const pct = (ch.count || 0) / totalCanaux;
            const strokeDasharray = `${pct * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePct * circumference;
            cumulativePct += pct;
            return {
                ...ch,
                color: palette[idx % palette.length],
                strokeDasharray,
                strokeDashoffset,
                pctDisplay: Math.round(pct * 100),
            };
        });
    }, [repartitionCanaux, totalCanaux]);

    if (loading && !dashboard) {
        return <DashboardSkeleton />;
    }

    if (error && !dashboard) {
        return <ErrorState message={error} onRetry={loadDashboard} />;
    }

    const hasActiveFilters = periode !== 'all' || Boolean(directionId) || Boolean(dateDebut) || Boolean(dateFin);

    return (
        <div className="view-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* ================================================================= */}
            {/* 1. BARRE DE CONTRÔLE RH COMPACTE & DIRECTE */}
            {/* ================================================================= */}
            <header
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '6px 14px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    position: 'relative',
                }}
            >
                {/* Liseré rouge dégradé signature AlpA Ciment */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, #FF0D00 0%, #ff4d4d 40%, #0f172a 100%)',
                    }}
                />

                {/* FILTRES DYNAMIQUES VISIBLES & DIRECTS */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                    {/* SÉLECTEUR DE DATES DIRECT ET VISIBLE */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        }}
                    >
                        <Calendar size={15} color="#FF0D00" />
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Du</span>
                        <input
                            type="date"
                            value={dateDebut}
                            onChange={(e) => {
                                setDateDebut(e.target.value);
                                setPeriode('');
                            }}
                            style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '4px 7px',
                                fontSize: '0.78rem',
                                color: '#0f172a',
                                fontWeight: 600,
                                background: '#f8fafc',
                                outline: 'none',
                            }}
                            title="Date de début"
                        />
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Au</span>
                        <input
                            type="date"
                            value={dateFin}
                            onChange={(e) => {
                                setDateFin(e.target.value);
                                setPeriode('');
                            }}
                            style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '4px 7px',
                                fontSize: '0.78rem',
                                color: '#0f172a',
                                fontWeight: 600,
                                background: '#f8fafc',
                                outline: 'none',
                            }}
                            title="Date de fin"
                        />
                        {(dateDebut || dateFin) && (
                            <button
                                onClick={() => {
                                    setDateDebut('');
                                    setDateFin('');
                                    setPeriode('all');
                                }}
                                title="Effacer les dates"
                                style={{
                                    border: 'none',
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    padding: '4px 7px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                }}
                                type="button"
                            >
                                <X size={12} />
                                <span>Effacer</span>
                            </button>
                        )}
                    </div>

                    {/* Raccourcis de périodes rapides (alimentent directement les dates affichées) */}
                    <div style={{ background: '#f1f5f9', padding: '3px', borderRadius: '10px', display: 'flex', gap: '3px' }}>
                        {[
                            { id: 'all', label: 'Tout' },
                            { id: 'this_month', label: 'Ce mois' },
                            { id: '30_days', label: '30j' },
                            { id: 'this_year', label: 'Année' },
                        ].map((p) => {
                            const isSelected = periode === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => handlePresetClick(p.id)}
                                    style={{
                                        border: 'none',
                                        background: isSelected ? '#ffffff' : 'transparent',
                                        color: isSelected ? '#FF0D00' : '#475569',
                                        fontWeight: isSelected ? 700 : 500,
                                        fontSize: '0.76rem',
                                        padding: '5px 10px',
                                        borderRadius: '7px',
                                        boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                    type="button"
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ACTIONS & FILTRE DIRECTION */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Filtre Direction */}
                        <div style={{ position: 'relative' }}>
                            <select
                                value={directionId}
                                onChange={(e) => setDirectionId(e.target.value)}
                                style={{
                                    padding: '7px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.82rem',
                                    background: '#ffffff',
                                    color: '#1e293b',
                                    fontWeight: 500,
                                    outline: 'none',
                                }}
                            >
                                <option value="">Toutes les directions</option>
                                {repartitionDirections.map((dir) => (
                                    <option key={dir.id_direction} value={dir.id_direction}>
                                        {dir.nom_direction}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <button
                                className="icon-button"
                                onClick={handleResetFilters}
                                title="Réinitialiser les filtres"
                                style={{ background: '#f1f5f9', border: 'none', padding: '7px', borderRadius: '8px' }}
                                type="button"
                            >
                                <X size={15} color="#64748b" />
                            </button>
                        )}

                        <button
                            className="action-button secondary"
                            disabled={loading}
                            onClick={loadDashboard}
                            title="Actualiser les données"
                            type="button"
                            style={{ padding: '7px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                        >
                            <RefreshCw size={14} className={loading ? 'spin' : ''} />
                            <span>Actualiser</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ================================================================= */}
            {/* 1. RUBAN KPI HAUTE DENSITÉ (6 MICRO-INDICATEURS AVEC SPARKLINES) */}
            {/* ================================================================= */}
                    <section
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '10px',
                        }}
                    >
                        {/* 1. Dossiers Reçus */}
                        <div
                            onClick={() => navigate('/candidatures/offres')}
                            className="kpi-card-modern"
                            title="Voir les candidatures"
                        >
                            <div className="kpi-modern-header">
                                <span className="kpi-modern-label">Dossiers Reçus</span>
                                <div className="kpi-modern-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                    <Users size={15} />
                                </div>
                            </div>
                            <div className="kpi-modern-value">
                                {kpis.total_candidatures ?? 0}
                            </div>
                            <div className="kpi-modern-footer">
                                <span style={{ color: '#059669', fontWeight: 600 }}>
                                    {kpis.candidatures_sur_offre ?? 0} offre • {kpis.candidatures_spontanees ?? 0} sp.
                                </span>
                                <svg style={{ width: '48px', height: '16px', stroke: '#2563eb', fill: 'none', strokeWidth: 2, overflow: 'visible' }} viewBox="0 0 48 16">
                                    <path d="M 0 14 Q 12 12, 20 6 T 36 5 T 48 2" />
                                </svg>
                            </div>
                        </div>

                        {/* 2. Postes Ouverts */}
                        <div
                            onClick={() => navigate('/offres')}
                            className="kpi-card-modern"
                            title="Voir les offres d'emploi"
                        >
                            <div className="kpi-modern-header">
                                <span className="kpi-modern-label">Postes Ouverts</span>
                                <div className="kpi-modern-icon" style={{ background: '#FFF0EF', color: '#FF0D00' }}>
                                    <BriefcaseBusiness size={15} />
                                </div>
                            </div>
                            <div className="kpi-modern-value" style={{ color: '#FF0D00' }}>
                                {kpis.offres_publiees ?? 0}
                            </div>
                            <div className="kpi-modern-footer">
                                <span>{kpis.offres_total ?? 0} offres au total</span>
                                <svg style={{ width: '48px', height: '16px', stroke: '#FF0D00', fill: 'none', strokeWidth: 2, overflow: 'visible' }} viewBox="0 0 48 16">
                                    <path d="M 0 8 Q 12 10, 24 4 T 40 7 T 48 2" />
                                </svg>
                            </div>
                        </div>

                        {/* 3. Vivier Actif */}
                        <div
                            onClick={() => navigate('/vivier')}
                            className="kpi-card-modern"
                            title="Accéder au vivier"
                        >
                            <div className="kpi-modern-header">
                                <span className="kpi-modern-label">Vivier Actif</span>
                                <div className="kpi-modern-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                                    <Sparkles size={15} />
                                </div>
                            </div>
                            <div className="kpi-modern-value" style={{ color: '#7c3aed' }}>
                                {kpis.candidatures_en_vivier ?? 0}
                            </div>
                            <div className="kpi-modern-footer">
                                <span style={{ color: '#7c3aed', fontWeight: 600 }}>Profils réservés</span>
                                <svg style={{ width: '48px', height: '16px', stroke: '#7c3aed', fill: 'none', strokeWidth: 2, overflow: 'visible' }} viewBox="0 0 48 16">
                                    <path d="M 0 14 Q 15 11, 28 8 T 42 3 T 48 1" />
                                </svg>
                            </div>
                        </div>

                        {/* 4. Agenda à Venir */}
                        <div
                            onClick={() => navigate('/agenda')}
                            className="kpi-card-modern"
                            title="Voir l'agenda"
                        >
                            <div className="kpi-modern-header">
                                <span className="kpi-modern-label">Agenda à Venir</span>
                                <div className="kpi-modern-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                                    <CalendarDays size={15} />
                                </div>
                            </div>
                            <div className="kpi-modern-value" style={{ color: '#d97706' }}>
                                {kpis.rdv_a_venir ?? 0}
                            </div>
                            <div className="kpi-modern-footer">
                                <span>Entretiens & tests</span>
                                <svg style={{ width: '48px', height: '16px', stroke: '#d97706', fill: 'none', strokeWidth: 2, overflow: 'visible' }} viewBox="0 0 48 16">
                                    <path d="M 0 10 Q 15 4, 30 9 T 48 3" />
                                </svg>
                            </div>
                        </div>

                        {/* 5. Taux d'Embauche */}
                        <div className="kpi-card-modern" style={{ cursor: 'default' }}>
                            <div className="kpi-modern-header">
                                <span className="kpi-modern-label">Taux d'Embauche</span>
                                <div className="kpi-modern-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                                    <CheckCircle2 size={15} />
                                </div>
                            </div>
                            <div className="kpi-modern-value" style={{ color: '#059669' }}>
                                {kpis.taux_recrutement ?? 0}%
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginTop: '4px' }}>
                                <div style={{ width: `${Math.min(100, kpis.taux_recrutement || 0)}%`, height: '100%', background: '#059669', borderRadius: '999px' }} />
                            </div>
                        </div>

                        {/* 6. Time-to-Hire */}
                        <div className="kpi-card-modern" style={{ cursor: 'default' }}>
                            <div className="kpi-modern-header">
                                <span className="kpi-modern-label">Time-to-Hire</span>
                                <div className="kpi-modern-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>
                                    <Clock size={15} />
                                </div>
                            </div>
                            <div className="kpi-modern-value" style={{ color: '#0284c7' }}>
                                {kpis.delai_moyen_jours > 0 ? `${kpis.delai_moyen_jours}j` : '-'}
                            </div>
                            <div className="kpi-modern-footer">
                                <span>Délai moyen</span>
                                <span className="trend-badge positive" style={{ fontSize: '10px' }}>Optimal</span>
                            </div>
                        </div>
                    </section>

                    {/* ================================================================= */}
                    {/* 2. COCKPIT ANALYTICS 2 COLONNES HAUTE DENSITÉ (TOUT EN UN COUP D'ŒIL) */}
                    {/* ================================================================= */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1.22fr) minmax(0, 1fr)',
                            gap: '10px',
                            alignItems: 'stretch',
                        }}
                    >
                        {/* ------------------------------------------------------------- */}
                        {/* COLONNE GAUCHE : COURBE DE TENDANCE + DOSSIERS SLA PRIORITAIRES */}
                        {/* ------------------------------------------------------------- */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                            {/* CARTE A : COURBE DE TENDANCE */}
                            <div className="dashboard-card-panel">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Activity size={16} color="#FF0D00" />
                                        <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                                            Tendance des Candidatures
                                        </h3>
                                    </div>

                                    {/* Légende & Mode */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} /> Offre
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9333ea' }} /> Spontanée
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                                            <button
                                                onClick={() => setChartMode('area')}
                                                style={{
                                                    border: 'none',
                                                    background: chartMode === 'area' ? '#ffffff' : 'transparent',
                                                    color: chartMode === 'area' ? '#0f172a' : '#64748b',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    boxShadow: chartMode === 'area' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                                    cursor: 'pointer',
                                                }}
                                                type="button"
                                            >
                                                <LineChartIcon size={12} /> Courbe
                                            </button>
                                            <button
                                                onClick={() => setChartMode('bars')}
                                                style={{
                                                    border: 'none',
                                                    background: chartMode === 'bars' ? '#ffffff' : 'transparent',
                                                    color: chartMode === 'bars' ? '#0f172a' : '#64748b',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    boxShadow: chartMode === 'bars' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                                    cursor: 'pointer',
                                                }}
                                                type="button"
                                            >
                                                <BarChart3 size={12} /> Barres
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {evolutionMensuelle.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                                        Aucune donnée sur la période sélectionnée.
                                    </div>
                                ) : chartMode === 'area' ? (
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <svg
                                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                            style={{ width: '100%', height: '125px', overflow: 'visible' }}
                                        >
                                            <defs>
                                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                                                </linearGradient>
                                                <filter id="shadowGlow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.25" />
                                                </filter>
                                            </defs>

                                            {/* Lignes de repère horizontales */}
                                            {[0, 0.5, 1].map((ratio, idx) => {
                                                const y = chartHeight - paddingY - ratio * innerHeight;
                                                const val = Math.round(ratio * maxMonthlyTotal);
                                                return (
                                                    <g key={idx}>
                                                        <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                                                        <text x={paddingX - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                                                            {val}
                                                        </text>
                                                    </g>
                                                );
                                            })}

                                            {/* Aire sous la courbe */}
                                            {areaSvgPaths.areaPath && (
                                                <path d={areaSvgPaths.areaPath} fill="url(#areaGradient)" />
                                            )}

                                            {/* Ligne principale lissée */}
                                            {areaSvgPaths.linePath && (
                                                <path
                                                    d={areaSvgPaths.linePath}
                                                    fill="none"
                                                    stroke="#2563eb"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    filter="url(#shadowGlow)"
                                                />
                                            )}

                                            {/* Points interactifs */}
                                            {points.map((pt, idx) => {
                                                const isHovered = activeMonthHover?.cle_mois === pt.cle_mois;
                                                const labelStep = Math.max(1, Math.ceil(points.length / 8));
                                                const showLabel = points.length <= 10 || idx === 0 || idx === points.length - 1 || (idx % labelStep === 0);
                                                return (
                                                    <g key={pt.cle_mois || idx}>
                                                        {isHovered && (
                                                            <line
                                                                x1={pt.x}
                                                                y1={paddingY}
                                                                x2={pt.x}
                                                                y2={chartHeight - paddingY}
                                                                stroke="#2563eb"
                                                                strokeWidth="1.5"
                                                                strokeDasharray="2 2"
                                                            />
                                                        )}
                                                        <circle
                                                            cx={pt.x}
                                                            cy={pt.y}
                                                            r={isHovered ? 6 : (points.length > 20 ? 3 : 4)}
                                                            fill="#ffffff"
                                                            stroke="#2563eb"
                                                            strokeWidth={isHovered ? 2.5 : 2}
                                                            style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                                                            onMouseEnter={() => setActiveMonthHover(pt)}
                                                            onMouseLeave={() => setActiveMonthHover(null)}
                                                        />
                                                        {showLabel && (
                                                            <text
                                                                x={pt.x}
                                                                y={chartHeight - 3}
                                                                textAnchor="middle"
                                                                fontSize="9"
                                                                fontWeight={isHovered ? '700' : '500'}
                                                                fill={isHovered ? '#0f172a' : '#64748b'}
                                                            >
                                                                {pt.label}
                                                            </text>
                                                        )}
                                                    </g>
                                                );
                                            })}
                                        </svg>

                                        {/* Infobulle Tooltip flottante */}
                                        {activeMonthHover && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '8px',
                                                    background: 'rgba(15, 23, 42, 0.94)',
                                                    backdropFilter: 'blur(6px)',
                                                    color: '#ffffff',
                                                    padding: '5px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.74rem',
                                                    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                                                    pointerEvents: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    zIndex: 10,
                                                }}
                                            >
                                                <span style={{ fontWeight: 700 }}>{activeMonthHover.label}: {activeMonthHover.total}</span>
                                                <span style={{ color: '#94a3b8' }}>|</span>
                                                <span style={{ color: '#60a5fa' }}>{activeMonthHover.sur_offre} offre</span>
                                                <span style={{ color: '#c084fc' }}>{activeMonthHover.spontanee} spont.</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* VUE BARRES COMPACTE */
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: `repeat(${evolutionMensuelle.length}, minmax(${evolutionMensuelle.length > 20 ? '14px' : '22px'}, 1fr))`,
                                            gap: '6px',
                                            alignItems: 'flex-end',
                                            height: '125px',
                                            borderBottom: '1px solid #e2e8f0',
                                            paddingBottom: '4px',
                                            overflowX: 'auto',
                                        }}
                                    >
                                        {evolutionMensuelle.map((m, idx) => {
                                            const heightPct = Math.round(((m.total || 0) / maxMonthlyTotal) * 100);
                                            const surOffrePct = m.total > 0 ? Math.round(((m.sur_offre || 0) / m.total) * 100) : 0;
                                            const spontaneePct = 100 - surOffrePct;
                                            const labelStep = Math.max(1, Math.ceil(evolutionMensuelle.length / 8));
                                            const showLabel = evolutionMensuelle.length <= 10 || idx === 0 || idx === evolutionMensuelle.length - 1 || (idx % labelStep === 0);

                                            return (
                                                <div
                                                    key={m.cle_mois || idx}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        height: '100%',
                                                        justifyContent: 'flex-end',
                                                        gap: '3px',
                                                        cursor: 'pointer',
                                                    }}
                                                    onMouseEnter={() => setActiveMonthHover(m)}
                                                    onMouseLeave={() => setActiveMonthHover(null)}
                                                >
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0f172a' }}>
                                                        {m.total}
                                                    </span>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            maxWidth: '26px',
                                                            height: `${Math.max(6, heightPct)}%`,
                                                            background: '#e2e8f0',
                                                            borderRadius: '4px 4px 0 0',
                                                            overflow: 'hidden',
                                                            display: 'flex',
                                                            flexDirection: 'column-reverse',
                                                            border: activeMonthHover?.cle_mois === m.cle_mois ? '2px solid #FF0D00' : 'none',
                                                        }}
                                                    >
                                                        <div style={{ height: `${surOffrePct}%`, background: '#2563eb' }} />
                                                        <div style={{ height: `${spontaneePct}%`, background: '#9333ea' }} />
                                                    </div>
                                                    {showLabel && (
                                                        <span style={{ fontSize: '0.66rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                            {m.label}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* CARTE B : DOSSIERS PRIORITAIRES (SLA) */}
                            <div className="dashboard-card-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <AlertCircle size={16} color="#e11d48" />
                                        <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                                            Dossiers Prioritaires (SLA)
                                        </h3>
                                        {candidaturesATraiter.length > 0 && (
                                            <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '999px' }}>
                                                {candidaturesATraiter.length} en attente
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => navigate('/candidatures/offres')}
                                        style={{
                                            border: 'none',
                                            background: '#fff0ef',
                                            color: '#FF0D00',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                        }}
                                        type="button"
                                    >
                                        Voir tout ➔
                                    </button>
                                </div>

                                {candidaturesATraiter.length === 0 ? (
                                    <div style={{ padding: '14px', textAlign: 'center', color: '#10b981', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.78rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle2 size={18} style={{ margin: '0 auto 2px', color: '#16a34a' }} />
                                        <strong>File SLA à jour !</strong> Aucune candidature non évaluée en attente.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto', paddingRight: '2px', minHeight: '160px' }}>
                                        {candidaturesATraiter.map((cand) => {
                                            const targetUrl = cand.dans_vivier
                                                ? `/vivier?candidature=${cand.id_candidature}`
                                                : cand.intitule?.toLowerCase().includes('spontanée')
                                                ? `/candidatures/spontanees?candidature=${cand.id_candidature}`
                                                : `/candidatures/offres?candidature=${cand.id_candidature}`;

                                            return (
                                                <div
                                                    key={cand.id_candidature}
                                                    onClick={() => navigate(targetUrl)}
                                                    style={{
                                                        padding: '7px 10px',
                                                        border: '1px solid #f1f5f9',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        background: '#fafafa',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                    }}
                                                    title="Cliquer pour ouvrir la fiche candidat"
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                        <div
                                                            style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '6px',
                                                                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                                                color: '#334155',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '10px',
                                                                fontWeight: 800,
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {cand.nom_complet ? cand.nom_complet.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'CD'}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {cand.nom_complet}
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                                {cand.intitule} • <span style={{ color: '#0284c7' }}>{cand.direction}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                        <span
                                                            style={{
                                                                fontSize: '0.68rem',
                                                                fontWeight: 700,
                                                                padding: '2px 6px',
                                                                borderRadius: '999px',
                                                                background: cand.jours_attente >= 5 ? '#fee2e2' : '#fef3c7',
                                                                color: cand.jours_attente >= 5 ? '#b91c1c' : '#b45309',
                                                            }}
                                                        >
                                                            {cand.jours_attente === 0 ? "Aujourd'hui" : `${cand.jours_attente}j`}
                                                        </span>
                                                        <button
                                                            className="action-button secondary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(targetUrl);
                                                            }}
                                                            style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                                                            type="button"
                                                        >
                                                            Traiter
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ------------------------------------------------------------- */}
                        {/* COLONNE DROITE : ENTONNOIR PIPELINE + CANAUX & DIRECTIONS */}
                        {/* ------------------------------------------------------------- */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* CARTE C : ENTONNOIR DE RECRUTEMENT PIPELINE */}
                            <div className="dashboard-card-panel">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Target size={16} color="#059669" />
                                        <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                                            Entonnoir & Pipeline de Qualification
                                        </h3>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                                        {kpis.total_candidatures ?? 0} dossiers
                                    </span>
                                </div>

                                {entonnoir.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                                        Aucun statut enregistré.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {entonnoir.map((step, idx) => {
                                            const isFinal = step.libelle.toLowerCase().includes('retenu');
                                            const isRejected = step.libelle.toLowerCase().includes('non');
                                            const stepColor = isRejected ? '#94a3b8' : isFinal ? '#10b981' : idx === 0 ? '#3b82f6' : idx === 1 ? '#6366f1' : idx === 2 ? '#8b5cf6' : '#f59e0b';
                                            const prevCount = idx > 0 ? entonnoir[idx - 1]?.count : null;
                                            const conversionRate = prevCount && prevCount > 0 ? Math.round((step.count / prevCount) * 100) : null;

                                            return (
                                                <div key={step.id_statut} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    {idx > 0 && conversionRate !== null && (
                                                        <div className="funnel-step-connector">
                                                            <span className="funnel-step-badge">
                                                                ↓ {conversionRate}% passage
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
                                                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                                            {step.libelle}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <strong style={{ color: stepColor }}>{step.count}</strong>
                                                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>({step.pourcentage}%)</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                                                        <div
                                                            style={{
                                                                width: `${Math.min(100, Math.max(step.count > 0 ? 5 : 0, step.pourcentage))}%`,
                                                                height: '100%',
                                                                background: stepColor,
                                                                borderRadius: '999px',
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* GRILLE 2 CARTES SÉPARÉES : CANAUX D'ACQUISITION & PRESSION PAR DIRECTION */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                                {/* CARTE D1 : CANAUX D'ACQUISITION */}
                                <div className="dashboard-card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <PieChartIcon size={15} color="#8b5cf6" />
                                            <h3 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                                                Canaux
                                            </h3>
                                        </div>
                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '999px' }}>
                                            {totalCanaux} tot.
                                        </span>
                                    </div>

                                    {/* Donut SVG Centré */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
                                        <div style={{ position: 'relative', width: '86px', height: '86px' }}>
                                            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                                                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                                                {donutSegments.map((seg, idx) => (
                                                    <circle
                                                        key={seg.code}
                                                        cx="50"
                                                        cy="50"
                                                        r="38"
                                                        fill="transparent"
                                                        stroke={seg.color}
                                                        strokeWidth={activeDonutIndex === idx ? 17 : 14}
                                                        strokeDasharray={seg.strokeDasharray}
                                                        strokeDashoffset={seg.strokeDashoffset}
                                                        style={{ transition: 'stroke-width 0.15s ease', cursor: 'pointer' }}
                                                        onMouseEnter={() => setActiveDonutIndex(idx)}
                                                        onMouseLeave={() => setActiveDonutIndex(null)}
                                                    />
                                                ))}
                                            </svg>
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    pointerEvents: 'none',
                                                }}
                                            >
                                                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                                                    {activeDonutIndex !== null ? donutSegments[activeDonutIndex]?.count : totalCanaux}
                                                </span>
                                                <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
                                                    {activeDonutIndex !== null ? donutSegments[activeDonutIndex]?.code : 'CANAUX'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mini légende Canaux */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                                        {donutSegments.map((seg) => (
                                            <span
                                                key={seg.code}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    fontSize: '0.64rem',
                                                    color: '#475569',
                                                    background: '#f8fafc',
                                                    border: '1px solid #f1f5f9',
                                                    padding: '2px 5px',
                                                    borderRadius: '6px',
                                                }}
                                            >
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: seg.color }} />
                                                <span>{seg.canal}</span>
                                                <strong style={{ color: '#0f172a' }}>{seg.count}</strong>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* CARTE D2 : PRESSION PAR DIRECTION */}
                                <div className="dashboard-card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Layers size={15} color="#0284c7" />
                                            <h3 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                                                Directions
                                            </h3>
                                        </div>
                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '999px' }}>
                                            {repartitionDirections.length} dir.
                                        </span>
                                    </div>

                                    {repartitionDirections.length === 0 ? (
                                        <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '0.74rem', color: '#94a3b8' }}>
                                            Aucune direction renseignée.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                                            {repartitionDirections.slice(0, 4).map((dir) => (
                                                <div key={dir.id_direction} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                                                        <span
                                                            style={{
                                                                fontWeight: 600,
                                                                color: '#334155',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                maxWidth: '120px',
                                                            }}
                                                            title={dir.nom_direction}
                                                        >
                                                            {dir.nom_direction}
                                                        </span>
                                                        <span style={{ color: '#64748b', fontSize: '0.68rem' }}>
                                                            <strong style={{ color: '#0f172a' }}>{dir.candidatures}</strong> ({dir.pourcentage}%)
                                                        </span>
                                                    </div>
                                                    <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                                                        <div
                                                            style={{
                                                                width: `${Math.min(100, Math.max(dir.candidatures > 0 ? 5 : 0, dir.pourcentage))}%`,
                                                                height: '100%',
                                                                background: 'linear-gradient(90deg, #FF0D00 0%, #f97316 100%)',
                                                                borderRadius: '999px',
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ================================================================= */}
                    {/* 3. SECTION INFÉRIEURE : DERNIÈRES OFFRES EN RECRUTEMENT */}
                    {/* ================================================================= */}
                    <section className="dashboard-card-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <BriefcaseBusiness size={16} color="#0f172a" />
                                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                                    Dernières Offres d'Emploi en Recrutement
                                </h3>
                            </div>
                            <button
                                onClick={() => navigate('/offres')}
                                style={{
                                    border: 'none',
                                    background: '#f1f5f9',
                                    color: '#334155',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                                type="button"
                            >
                                Gérer tout ➔
                            </button>
                        </div>

                        <OffersTable compact offers={offresRecentes} onSelectOffer={onSelectOffer} />
                    </section>
        </div>
    );
}
