import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
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
    const dernieresCandidatures = dashboard?.dernieres_candidatures ?? [];
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
                {/* Liseré rouge dégradé signature Alpha Ciment */}
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

                        {/* 5. Taux d'Embauche
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
                        </div> */}

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
                        {/* COLONNE GAUCHE : COURBE DE TENDANCE + DERNIÈRES CANDIDATURES */}
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

                                    </div>
                                </div>

                                {evolutionMensuelle.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                                        Aucune donnée sur la période sélectionnée.
                                    </div>
                                ) : (
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
                                )}
                            </div>

                            {/* CARTE B : DERNIÈRES CANDIDATURES REÇUES (NON VUES) */}
                            <div className="dashboard-card-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={16} color="#0284c7" />
                                        <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                                            Dernières candidatures
                                        </h3>
                                        {dernieresCandidatures.length > 0 && (
                                            <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '999px' }}>
                                                {dernieresCandidatures.length} non vue{dernieresCandidatures.length > 1 ? 's' : ''}
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

                                {dernieresCandidatures.length === 0 ? (
                                    <div style={{ padding: '14px', textAlign: 'center', color: '#10b981', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.78rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle2 size={18} style={{ margin: '0 auto 2px', color: '#16a34a' }} />
                                        <strong>Tout est à jour !</strong> Aucune nouvelle candidature à consulter.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto', paddingRight: '2px', minHeight: '160px' }}>
                                        {dernieresCandidatures.map((cand) => {
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
                                                                background: '#e0f2fe',
                                                                color: '#0369a1',
                                                            }}
                                                        >
                                                            {cand.jours_attente === 0 ? "Aujourd'hui" : `Il y a ${cand.jours_attente}j`}
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
                                                            Ouvrir
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
                                            Status Candidat
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
                                                    {activeDonutIndex !== null ? donutSegments[activeDonutIndex]?.code?.replace('_', ' ') : 'CANAUX'}
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


// =============================================================================
// CODE DU TABLEAU DE BORD 2.0 (MULTI-ONGLETS, DRILL-DOWN, CONTRÔLE AVANCÉ)
// [TEMPORAIREMENT COMMENTÉ SELON DEMANDE UTILISATEUR DU 30/10/2026]
// Ce bloc préserve l'intégralité des 4 onglets (RH, Direction, Technique, Compétences)
// et de la modale universelle de drill-down pour réactivation ultérieure immédiate.
// =============================================================================

// ﻿import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//     Activity,
//     AlertCircle,
//     AlertTriangle,
//     ArrowDownRight,
//     ArrowRight,
//     ArrowUpRight,
//     BarChart3,
//     BrainCircuit,
//     BriefcaseBusiness,
//     Calendar,
//     CalendarDays,
//     CheckCircle2,
//     ChevronRight,
//     Clock,
//     Cpu,
//     Database,
//     Download,
//     ExternalLink,
//     Eye,
//     EyeOff,
//     FileQuestion,
//     Filter,
//     Flame,
//     Layers,
//     LineChart as LineChartIcon,
//     PieChart as PieChartIcon,
//     RefreshCw,
//     Search,
//     ShieldAlert,
//     ShieldCheck,
//     Sliders,
//     Sparkles,
//     Target,
//     TrendingDown,
//     TrendingUp,
//     UserCheck,
//     Users,
//     X,
//     Zap,
// } from 'lucide-react';
// import { getJson } from '../api/client';
// import { DashboardSkeleton, ErrorState, LoadingState } from '../components/common/FeedbackStates';
// import { OffersTable } from './OffersTable';
// 
// // =============================================================================
// // MODALE UNIVERSELLE DE DRILL-DOWN (LISTES ACTIONS CLIQUABLES)
// // =============================================================================
// function DrillDownModal({ isOpen, onClose, title, subtitle, items = [], type = 'candidatures', onNavigate }) {
//     const [searchQuery, setSearchQuery] = useState('');
// 
//     if (!isOpen) return null;
// 
//     const filteredItems = items.filter((item) => {
//         if (!searchQuery) return true;
//         const q = searchQuery.toLowerCase();
//         return (
//             (item.nom_complet && item.nom_complet.toLowerCase().includes(q)) ||
//             (item.intitule && item.intitule.toLowerCase().includes(q)) ||
//             (item.titre_poste && item.titre_poste.toLowerCase().includes(q)) ||
//             (item.direction && item.direction.toLowerCase().includes(q)) ||
//             (item.email && item.email.toLowerCase().includes(q)) ||
//             (item.statut && item.statut.toLowerCase().includes(q))
//         );
//     });
// 
//     return (
//         <div
//             style={{
//                 position: 'fixed',
//                 inset: 0,
//                 zIndex: 9999,
//                 background: 'rgba(15, 23, 42, 0.6)',
//                 backdropFilter: 'blur(4px)',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 padding: '16px',
//             }}
//             onClick={onClose}
//         >
//             <div
//                 style={{
//                     background: '#ffffff',
//                     borderRadius: '16px',
//                     width: '100%',
//                     maxWidth: '820px',
//                     maxHeight: '85vh',
//                     display: 'flex',
//                     flexDirection: 'column',
//                     boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
//                     overflow: 'hidden',
//                 }}
//                 onClick={(e) => e.stopPropagation()}
//             >
//                 {/* Header Modale */}
//                 <div
//                     style={{
//                         padding: '16px 20px',
//                         borderBottom: '1px solid #e2e8f0',
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                         background: '#f8fafc',
//                     }}
//                 >
//                     <div>
//                         <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
//                             {title}
//                         </h3>
//                         {subtitle && (
//                             <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
//                                 {subtitle} ({items.length} dossier{items.length > 1 ? 's' : ''})
//                             </p>
//                         )}
//                     </div>
//                     <button
//                         onClick={onClose}
//                         style={{
//                             border: 'none',
//                             background: '#e2e8f0',
//                             borderRadius: '50%',
//                             width: '32px',
//                             height: '32px',
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                             cursor: 'pointer',
//                         }}
//                     >
//                         <X size={16} color="#475569" />
//                     </button>
//                 </div>
// 
//                 {/* Recherche dans la liste */}
//                 <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px' }}>
//                         <Search size={15} color="#94a3b8" />
//                         <input
//                             type="text"
//                             placeholder="Filtrer par nom, poste, direction ou e-mail..."
//                             value={searchQuery}
//                             onChange={(e) => setSearchQuery(e.target.value)}
//                             style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.82rem' }}
//                         />
//                         {searchQuery && (
//                             <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
//                                 <X size={14} color="#94a3b8" />
//                             </button>
//                         )}
//                     </div>
//                 </div>
// 
//                 {/* Corps de liste scrollable */}
//                 <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
//                     {filteredItems.length === 0 ? (
//                         <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8', fontSize: '0.85rem' }}>
//                             Aucun élément ne correspond à cette recherche.
//                         </div>
//                     ) : (
//                         filteredItems.map((item, idx) => {
//                             const isCandidature = Boolean(item.id_candidature);
//                             const targetUrl = isCandidature ? `/candidatures/${item.id_candidature}` : `/offres`;
// 
//                             return (
//                                 <div
//                                     key={item.id_candidature || item.id_offre || idx}
//                                     style={{
//                                         display: 'flex',
//                                         alignItems: 'center',
//                                         justifyContent: 'space-between',
//                                         padding: '10px 14px',
//                                         borderRadius: '10px',
//                                         border: '1px solid #e2e8f0',
//                                         background: '#fafafa',
//                                         transition: 'all 0.15s ease',
//                                     }}
//                                 >
//                                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
//                                         <div
//                                             style={{
//                                                 width: '36px',
//                                                 height: '36px',
//                                                 borderRadius: '8px',
//                                                 background: item.gravite === 'critique' || item.jours_stagnation > 14 ? '#fee2e2' : '#eff6ff',
//                                                 color: item.gravite === 'critique' || item.jours_stagnation > 14 ? '#dc2626' : '#2563eb',
//                                                 display: 'flex',
//                                                 alignItems: 'center',
//                                                 justifyContent: 'center',
//                                                 fontWeight: 800,
//                                                 fontSize: '12px',
//                                                 flexShrink: 0,
//                                             }}
//                                         >
//                                             {item.nom_complet
//                                                 ? item.nom_complet.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
//                                                 : (item.titre_poste || 'AL')[0]}
//                                         </div>
// 
//                                         <div style={{ minWidth: 0 }}>
//                                             <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                                                 {item.nom_complet || item.titre_poste}
//                                             </div>
//                                             <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
//                                                 {item.intitule || item.direction} {item.email ? `• ${item.email}` : ''}
//                                             </div>
//                                         </div>
//                                     </div>
// 
//                                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
//                                         {item.statut && (
//                                             <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#e2e8f0', color: '#334155' }}>
//                                                 {item.statut}
//                                             </span>
//                                         )}
// 
//                                         {item.jours_stagnation !== undefined && (
//                                             <span
//                                                 style={{
//                                                     fontSize: '0.72rem',
//                                                     fontWeight: 700,
//                                                     padding: '2px 8px',
//                                                     borderRadius: '999px',
//                                                     background: item.jours_stagnation >= 14 ? '#fee2e2' : '#fef3c7',
//                                                     color: item.jours_stagnation >= 14 ? '#b91c1c' : '#b45309',
//                                                 }}
//                                             >
//                                                 {item.jours_stagnation}j sans mouvement
//                                             </span>
//                                         )}
// 
//                                         {item.heures_attente !== undefined && (
//                                             <span
//                                                 style={{
//                                                     fontSize: '0.72rem',
//                                                     fontWeight: 700,
//                                                     padding: '2px 8px',
//                                                     borderRadius: '999px',
//                                                     background: item.heures_attente >= 168 ? '#fee2e2' : item.heures_attente >= 48 ? '#fef3c7' : '#ecfdf5',
//                                                     color: item.heures_attente >= 168 ? '#b91c1c' : item.heures_attente >= 48 ? '#b45309' : '#059669',
//                                                 }}
//                                             >
//                                                 Attente: {Math.floor(item.heures_attente / 24)}j ({item.heures_attente}h)
//                                             </span>
//                                         )}
// 
//                                         {item.age_mois !== undefined && (
//                                             <span
//                                                 style={{
//                                                     fontSize: '0.72rem',
//                                                     fontWeight: 700,
//                                                     padding: '2px 8px',
//                                                     borderRadius: '999px',
//                                                     background: item.age_mois >= 24 ? '#fee2e2' : '#fef3c7',
//                                                     color: item.age_mois >= 24 ? '#b91c1c' : '#b45309',
//                                                 }}
//                                             >
//                                                 {item.age_mois} mois
//                                             </span>
//                                         )}
// 
//                                         <button
//                                             onClick={() => {
//                                                 onClose();
//                                                 onNavigate(targetUrl);
//                                             }}
//                                             style={{
//                                                 border: 'none',
//                                                 background: '#FF0D00',
//                                                 color: '#ffffff',
//                                                 padding: '4px 10px',
//                                                 borderRadius: '6px',
//                                                 fontSize: '0.74rem',
//                                                 fontWeight: 700,
//                                                 cursor: 'pointer',
//                                                 display: 'flex',
//                                                 alignItems: 'center',
//                                                 gap: '4px',
//                                             }}
//                                             type="button"
//                                         >
//                                             <span>Ouvrir</span>
//                                             <ExternalLink size={12} />
//                                         </button>
//                                     </div>
//                                 </div>
//                             );
//                         })
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }
// 
// // =============================================================================
// // COMPOSANT GRAPHIQUE COURBE / BARRES DE TENDANCE DES CANDIDATURES
// // =============================================================================
// function TendanceCandidaturesCard({
//     evolutionMensuelle = [],
//     chartMode = 'area',
//     setChartMode,
//     chartWidth = 560,
//     chartHeight = 125,
//     paddingX = 35,
//     paddingY = 16,
//     activeMonthHover,
//     setActiveMonthHover,
//     points = [],
//     areaSvgPaths = { linePath: '', areaPath: '' },
//     maxMonthlyTotal = 5,
// }) {
//     if (!evolutionMensuelle || evolutionMensuelle.length === 0) {
//         return (
//             <div className="dashboard-card-panel" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
//                 Aucune donnée d'évolution des candidatures sur la période sélectionnée.
//             </div>
//         );
//     }
// 
//     const innerHeight = chartHeight - paddingY * 2;
// 
//     return (
//         <div className="dashboard-card-panel">
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                     <Activity size={16} color="#FF0D00" />
//                     <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
//                         Courbe de Tendance des Candidatures
//                     </h3>
//                 </div>
// 
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                     <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem' }}>
//                         <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
//                             <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} /> Offre
//                         </span>
//                         <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
//                             <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9333ea' }} /> Spontanée
//                         </span>
//                     </div>
// 
//                     <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
//                         <button
//                             onClick={() => setChartMode('area')}
//                             style={{
//                                 border: 'none',
//                                 background: chartMode === 'area' ? '#ffffff' : 'transparent',
//                                 color: chartMode === 'area' ? '#0f172a' : '#64748b',
//                                 borderRadius: '4px',
//                                 padding: '2px 6px',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '3px',
//                                 fontSize: '0.7rem',
//                                 fontWeight: 600,
//                                 boxShadow: chartMode === 'area' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
//                                 cursor: 'pointer',
//                             }}
//                             type="button"
//                         >
//                             <LineChartIcon size={12} /> Courbe
//                         </button>
//                         <button
//                             onClick={() => setChartMode('bars')}
//                             style={{
//                                 border: 'none',
//                                 background: chartMode === 'bars' ? '#ffffff' : 'transparent',
//                                 color: chartMode === 'bars' ? '#0f172a' : '#64748b',
//                                 borderRadius: '4px',
//                                 padding: '2px 6px',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '3px',
//                                 fontSize: '0.7rem',
//                                 fontWeight: 600,
//                                 boxShadow: chartMode === 'bars' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
//                                 cursor: 'pointer',
//                             }}
//                             type="button"
//                         >
//                             <BarChart3 size={12} /> Barres
//                         </button>
//                     </div>
//                 </div>
//             </div>
// 
//             {chartMode === 'area' ? (
//                 <div style={{ position: 'relative', width: '100%' }}>
//                     <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '125px', overflow: 'visible' }}>
//                         <defs>
//                             <linearGradient id="areaGradientDash" x1="0" y1="0" x2="0" y2="1">
//                                 <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
//                                 <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
//                             </linearGradient>
//                             <filter id="shadowGlowDash" x="-20%" y="-20%" width="140%" height="140%">
//                                 <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.25" />
//                             </filter>
//                         </defs>
// 
//                         {[0, 0.5, 1].map((ratio, idx) => {
//                             const y = chartHeight - paddingY - ratio * innerHeight;
//                             const val = Math.round(ratio * maxMonthlyTotal);
//                             return (
//                                 <g key={idx}>
//                                     <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
//                                     <text x={paddingX - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
//                                         {val}
//                                     </text>
//                                 </g>
//                             );
//                         })}
// 
//                         {areaSvgPaths.areaPath && <path d={areaSvgPaths.areaPath} fill="url(#areaGradientDash)" />}
// 
//                         {areaSvgPaths.linePath && (
//                             <path
//                                 d={areaSvgPaths.linePath}
//                                 fill="none"
//                                 stroke="#2563eb"
//                                 strokeWidth="3"
//                                 strokeLinecap="round"
//                                 filter="url(#shadowGlowDash)"
//                             />
//                         )}
// 
//                         {points.map((pt, idx) => {
//                             const isHovered = activeMonthHover?.cle_mois === pt.cle_mois;
//                             const labelStep = Math.max(1, Math.ceil(points.length / 8));
//                             const showLabel = points.length <= 10 || idx === 0 || idx === points.length - 1 || idx % labelStep === 0;
//                             return (
//                                 <g key={pt.cle_mois || idx}>
//                                     {isHovered && (
//                                         <line
//                                             x1={pt.x}
//                                             y1={paddingY}
//                                             x2={pt.x}
//                                             y2={chartHeight - paddingY}
//                                             stroke="#2563eb"
//                                             strokeWidth="1.5"
//                                             strokeDasharray="2 2"
//                                         />
//                                     )}
//                                     <circle
//                                         cx={pt.x}
//                                         cy={pt.y}
//                                         r={isHovered ? 6 : points.length > 20 ? 3 : 4}
//                                         fill="#ffffff"
//                                         stroke="#2563eb"
//                                         strokeWidth={isHovered ? 2.5 : 2}
//                                         style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
//                                         onMouseEnter={() => setActiveMonthHover(pt)}
//                                         onMouseLeave={() => setActiveMonthHover(null)}
//                                     />
//                                     {showLabel && (
//                                         <text
//                                             x={pt.x}
//                                             y={chartHeight - 3}
//                                             textAnchor="middle"
//                                             fontSize="9"
//                                             fontWeight={isHovered ? '700' : '500'}
//                                             fill={isHovered ? '#0f172a' : '#64748b'}
//                                         >
//                                             {pt.label}
//                                         </text>
//                                     )}
//                                 </g>
//                             );
//                         })}
//                     </svg>
// 
//                     {activeMonthHover && (
//                         <div
//                             style={{
//                                 position: 'absolute',
//                                 top: '4px',
//                                 right: '8px',
//                                 background: 'rgba(15, 23, 42, 0.94)',
//                                 backdropFilter: 'blur(6px)',
//                                 color: '#ffffff',
//                                 padding: '5px 10px',
//                                 borderRadius: '6px',
//                                 fontSize: '0.74rem',
//                                 boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
//                                 pointerEvents: 'none',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '8px',
//                                 zIndex: 10,
//                             }}
//                         >
//                             <span style={{ fontWeight: 700 }}>
//                                 {activeMonthHover.label}: {activeMonthHover.total}
//                             </span>
//                             <span style={{ color: '#94a3b8' }}>|</span>
//                             <span style={{ color: '#60a5fa' }}>{activeMonthHover.sur_offre} offre</span>
//                             <span style={{ color: '#c084fc' }}>{activeMonthHover.spontanee} spont.</span>
//                         </div>
//                     )}
//                 </div>
//             ) : (
//                 <div
//                     style={{
//                         display: 'grid',
//                         gridTemplateColumns: `repeat(${evolutionMensuelle.length}, minmax(${evolutionMensuelle.length > 20 ? '14px' : '22px'}, 1fr))`,
//                         gap: '6px',
//                         alignItems: 'flex-end',
//                         height: '125px',
//                         borderBottom: '1px solid #e2e8f0',
//                         paddingBottom: '4px',
//                         overflowX: 'auto',
//                     }}
//                 >
//                     {evolutionMensuelle.map((m, idx) => {
//                         const heightPct = Math.round(((m.total || 0) / maxMonthlyTotal) * 100);
//                         const surOffrePct = m.total > 0 ? Math.round(((m.sur_offre || 0) / m.total) * 100) : 0;
//                         const spontaneePct = 100 - surOffrePct;
//                         const labelStep = Math.max(1, Math.ceil(evolutionMensuelle.length / 8));
//                         const showLabel = evolutionMensuelle.length <= 10 || idx === 0 || idx === evolutionMensuelle.length - 1 || idx % labelStep === 0;
// 
//                         return (
//                             <div
//                                 key={m.cle_mois || idx}
//                                 style={{
//                                     display: 'flex',
//                                     flexDirection: 'column',
//                                     alignItems: 'center',
//                                     height: '100%',
//                                     justifyContent: 'flex-end',
//                                     gap: '3px',
//                                     cursor: 'pointer',
//                                 }}
//                                 onMouseEnter={() => setActiveMonthHover(m)}
//                                 onMouseLeave={() => setActiveMonthHover(null)}
//                             >
//                                 <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0f172a' }}>{m.total}</span>
//                                 <div
//                                     style={{
//                                         width: '100%',
//                                         maxWidth: '26px',
//                                         height: `${Math.max(6, heightPct)}%`,
//                                         background: '#e2e8f0',
//                                         borderRadius: '4px 4px 0 0',
//                                         overflow: 'hidden',
//                                         display: 'flex',
//                                         flexDirection: 'column-reverse',
//                                         border: activeMonthHover?.cle_mois === m.cle_mois ? '2px solid #FF0D00' : 'none',
//                                     }}
//                                 >
//                                     <div style={{ height: `${surOffrePct}%`, background: '#2563eb' }} />
//                                     <div style={{ height: `${spontaneePct}%`, background: '#9333ea' }} />
//                                 </div>
//                                 {showLabel && (
//                                     <span style={{ fontSize: '0.66rem', color: '#64748b', whiteSpace: 'nowrap' }}>{m.label}</span>
//                                 )}
//                             </div>
//                         );
//                     })}
//                 </div>
//             )}
//         </div>
//     );
// }
// 
// // =============================================================================
// // COMPOSANT PRINCIPAL DASHBOARD VIEW 2.0
// // =============================================================================
// export function DashboardView({ onSelectOffer }) {
//     const navigate = useNavigate();
// 
//     const [dashboard, setDashboard] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
// 
//     // Rôle / Vue active : 'rh' (RH Quotidien) | 'direction' (Direction & Perf) | 'technique' (Pipeline n8n/OCR) | 'competences' (Matching)
//     const [activeTab, setActiveTab] = useState('rh');
// 
//     // Filtres
//     const [periode, setPeriode] = useState('all');
//     const [directionId, setDirectionId] = useState('');
//     const [dateDebut, setDateDebut] = useState('');
//     const [dateFin, setDateFin] = useState('');
// 
//     // État graphique & interactions
//     const [chartMode, setChartMode] = useState('area');
//     const [activeMonthHover, setActiveMonthHover] = useState(null);
//     const [activeDonutIndex, setActiveDonutIndex] = useState(null);
// 
//     // Modale de Drill-down
//     const [drillDownConfig, setDrillDownConfig] = useState({
//         isOpen: false,
//         title: '',
//         subtitle: '',
//         items: [],
//         type: 'candidatures',
//     });
// 
//     const openDrillDown = (title, subtitle, items, type = 'candidatures') => {
//         setDrillDownConfig({
//             isOpen: true,
//             title,
//             subtitle,
//             items: items || [],
//             type,
//         });
//     };
// 
//     const closeDrillDown = () => {
//         setDrillDownConfig((prev) => ({ ...prev, isOpen: false }));
//     };
// 
//     const loadDashboard = useCallback(async () => {
//         setLoading(true);
//         setError('');
// 
//         try {
//             const params = new URLSearchParams();
//             if (directionId) params.set('direction_id', directionId);
//             if (dateDebut) params.set('date_debut', dateDebut);
//             if (dateFin) params.set('date_fin', dateFin);
//             if (periode && !dateDebut && !dateFin && periode !== 'all') {
//                 params.set('periode', periode);
//             }
// 
//             const response = await getJson(`/api/dashboard?${params.toString()}`);
//             setDashboard(response?.data ?? null);
//         } catch (caughtError) {
//             setError(caughtError.message);
//         } finally {
//             setLoading(false);
//         }
//     }, [directionId, dateDebut, dateFin, periode]);
// 
//     useEffect(() => {
//         loadDashboard();
//     }, [loadDashboard]);
// 
//     const handlePresetClick = (presetId) => {
//         setPeriode(presetId);
//         const today = new Date();
//         const pad = (n) => String(n).padStart(2, '0');
//         const formatYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// 
//         if (presetId === 'all') {
//             setDateDebut('');
//             setDateFin('');
//         } else if (presetId === 'this_month') {
//             const start = new Date(today.getFullYear(), today.getMonth(), 1);
//             const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//             setDateDebut(formatYmd(start));
//             setDateFin(formatYmd(end));
//         } else if (presetId === '30_days') {
//             const start = new Date();
//             start.setDate(today.getDate() - 29);
//             setDateDebut(formatYmd(start));
//             setDateFin(formatYmd(today));
//         } else if (presetId === 'this_year') {
//             const start = new Date(today.getFullYear(), 0, 1);
//             const end = new Date(today.getFullYear(), 11, 31);
//             setDateDebut(formatYmd(start));
//             setDateFin(formatYmd(end));
//         }
//     };
// 
//     const handleResetFilters = () => {
//         setPeriode('all');
//         setDirectionId('');
//         setDateDebut('');
//         setDateFin('');
//     };
// 
//     // Extraction des blocs de données
//     const kpis = dashboard?.kpis ?? {};
//     const entonnoir = dashboard?.entonnoir ?? [];
//     const evolutionMensuelle = dashboard?.evolution_mensuelle ?? [];
//     const repartitionDirections = dashboard?.repartition_directions ?? [];
//     const repartitionCanaux = dashboard?.repartition_canaux ?? [];
//     const candidaturesATraiter = dashboard?.candidatures_a_traiter ?? [];
//     const offresRecentes = dashboard?.offres_recentes ?? [];
// 
//     // Nouveaux blocs analytiques
//     const dureesWorkflow = dashboard?.durees_workflow ?? [];
//     const dossiersStagnants = dashboard?.dossiers_stagnants ?? { total_stagnants: 0, liste: [], par_statut: [] };
//     const backlogNonConsulte = dashboard?.backlog_non_consulte ?? { total_non_consulte: 0, tranches_age: {}, liste: [] };
//     const delaiPremiereReponse = dashboard?.delai_premiere_reponse ?? {};
//     const rendementCanaux = dashboard?.rendement_canaux ?? [];
//     const santeOffres = dashboard?.sante_offres ?? { offres_en_tension: [], offres_dormantes: [], offres_a_cloturer: [] };
//     const candidatsRecurrents = dashboard?.candidats_recurrents ?? { total_candidats_multiples: 0, liste: [] };
//     const vivierReactivable = dashboard?.vivier_reactivable ?? [];
//     const competencesOffreDemande = dashboard?.competences_offre_demande ?? { top_competences_demandees: [], top_competences_candidats: [], penuries: [] };
//     const santePipeline = dashboard?.sante_pipeline ?? { flux_par_jour: [], ocr_median_s: 0, ner_median_s: 0 };
//     const conformiteSla = dashboard?.conformite_sla ?? { candidatures_rgpd: [] };
// 
//     // =========================================================================
//     // CALCULS POUR LES GRAPHIQUES SVG
//     // =========================================================================
//     const maxMonthlyTotal = Math.max(5, ...evolutionMensuelle.map((m) => m.total || 0));
//     const chartHeight = 125;
//     const chartWidth = 560;
//     const paddingX = 35;
//     const paddingY = 16;
//     const innerWidth = chartWidth - paddingX * 2;
//     const innerHeight = chartHeight - paddingY * 2;
// 
//     const points = useMemo(() => {
//         if (!evolutionMensuelle.length) return [];
//         if (evolutionMensuelle.length === 1) {
//             const m = evolutionMensuelle[0];
//             const x = chartWidth / 2;
//             const y = chartHeight - paddingY - ((m.total || 0) / maxMonthlyTotal) * innerHeight;
//             return [{ x, y, ...m }];
//         }
//         return evolutionMensuelle.map((m, index) => {
//             const x = paddingX + (index / (evolutionMensuelle.length - 1 || 1)) * innerWidth;
//             const y = chartHeight - paddingY - ((m.total || 0) / maxMonthlyTotal) * innerHeight;
//             return { x, y, ...m };
//         });
//     }, [evolutionMensuelle, maxMonthlyTotal, innerWidth, innerHeight, chartHeight]);
// 
//     const areaSvgPaths = useMemo(() => {
//         if (!points.length) return { linePath: '', areaPath: '' };
//         if (points.length === 1) {
//             const p = points[0];
//             const line = `M ${paddingX} ${p.y} L ${chartWidth - paddingX} ${p.y}`;
//             const area = `M ${paddingX} ${p.y} L ${chartWidth - paddingX} ${p.y} L ${chartWidth - paddingX} ${chartHeight - paddingY} L ${paddingX} ${chartHeight - paddingY} Z`;
//             return { linePath: line, areaPath: area };
//         }
// 
//         let line = `M ${points[0].x} ${points[0].y}`;
//         for (let i = 0; i < points.length - 1; i++) {
//             const p0 = points[i];
//             const p1 = points[i + 1];
//             const cx = (p0.x + p1.x) / 2;
//             line += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
//         }
// 
//         const area = `${line} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
//         return { linePath: line, areaPath: area };
//     }, [points, chartHeight, paddingY]);
// 
//     const totalCanaux = useMemo(() => {
//         return repartitionCanaux.reduce((acc, c) => acc + (c.count || 0), 0) || 1;
//     }, [repartitionCanaux]);
// 
//     const donutSegments = useMemo(() => {
//         const radius = 38;
//         const circumference = 2 * Math.PI * radius;
//         let cumulativePct = 0;
//         const palette = ['#FF0D00', '#2563eb', '#8b5cf6', '#10b981'];
// 
//         return repartitionCanaux.map((ch, idx) => {
//             const pct = (ch.count || 0) / totalCanaux;
//             const strokeDasharray = `${pct * circumference} ${circumference}`;
//             const strokeDashoffset = -cumulativePct * circumference;
//             cumulativePct += pct;
//             return {
//                 ...ch,
//                 color: palette[idx % palette.length],
//                 strokeDasharray,
//                 strokeDashoffset,
//                 pctDisplay: Math.round(pct * 100),
//             };
//         });
//     }, [repartitionCanaux, totalCanaux]);
// 
//     if (loading && !dashboard) {
//         return <DashboardSkeleton />;
//     }
// 
//     if (error && !dashboard) {
//         return <ErrorState message={error} onRetry={loadDashboard} />;
//     }
// 
//     const hasActiveFilters = periode !== 'all' || Boolean(directionId) || Boolean(dateDebut) || Boolean(dateFin);
// 
//     // Calcul badge alertes globales pour le RH
//     const nbAlertesRh = (dossiersStagnants.total_stagnants || 0) + (backlogNonConsulte.total_non_consulte || 0) + (conformiteSla.sla_depassement_count || 0);
// 
//     return (
//         <div className="view-stack" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//             {/* ================================================================= */}
//             {/* 1. BARRE DE COMMANDE SUPÉRIEURE : SÉLECTEUR DE VUES & FILTRES */}
//             {/* ================================================================= */}
//             <header
//                 style={{
//                     background: '#ffffff',
//                     border: '1px solid #e2e8f0',
//                     borderRadius: '12px',
//                     padding: '8px 16px',
//                     display: 'flex',
//                     flexWrap: 'wrap',
//                     justifyContent: 'space-between',
//                     alignItems: 'center',
//                     gap: '12px',
//                     boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
//                     position: 'relative',
//                 }}
//             >
//                 {/* Liseré Alpha Ciment */}
//                 <div
//                     style={{
//                         position: 'absolute',
//                         top: 0,
//                         left: 0,
//                         right: 0,
//                         height: '3px',
//                         background: 'linear-gradient(90deg, #FF0D00 0%, #ff4d4d 40%, #0f172a 100%)',
//                     }}
//                 />
// 
//                 {/* SÉLECTEUR DE VUES / RÔLES EN ONGLETS MODERNES */}
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
//                     <button
//                         onClick={() => setActiveTab('rh')}
//                         style={{
//                             border: 'none',
//                             background: activeTab === 'rh' ? '#ffffff' : 'transparent',
//                             color: activeTab === 'rh' ? '#FF0D00' : '#475569',
//                             fontWeight: activeTab === 'rh' ? 800 : 600,
//                             fontSize: '0.82rem',
//                             padding: '6px 14px',
//                             borderRadius: '8px',
//                             boxShadow: activeTab === 'rh' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
//                             cursor: 'pointer',
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '6px',
//                             transition: 'all 0.15s ease',
//                         }}
//                         type="button"
//                     >
//                         <Zap size={14} color={activeTab === 'rh' ? '#FF0D00' : '#64748b'} />
//                         <span>RH au Quotidien</span>
//                         {nbAlertesRh > 0 && (
//                             <span
//                                 style={{
//                                     background: '#FF0D00',
//                                     color: '#ffffff',
//                                     fontSize: '0.68rem',
//                                     fontWeight: 800,
//                                     padding: '1px 6px',
//                                     borderRadius: '999px',
//                                 }}
//                             >
//                                 {nbAlertesRh}
//                             </span>
//                         )}
//                     </button>
// 
//                     <button
//                         onClick={() => setActiveTab('direction')}
//                         style={{
//                             border: 'none',
//                             background: activeTab === 'direction' ? '#ffffff' : 'transparent',
//                             color: activeTab === 'direction' ? '#2563eb' : '#475569',
//                             fontWeight: activeTab === 'direction' ? 800 : 600,
//                             fontSize: '0.82rem',
//                             padding: '6px 14px',
//                             borderRadius: '8px',
//                             boxShadow: activeTab === 'direction' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
//                             cursor: 'pointer',
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '6px',
//                             transition: 'all 0.15s ease',
//                         }}
//                         type="button"
//                     >
//                         <Target size={14} color={activeTab === 'direction' ? '#2563eb' : '#64748b'} />
//                         <span>Direction & Performance</span>
//                     </button>
// 
//                     <button
//                         onClick={() => setActiveTab('technique')}
//                         style={{
//                             border: 'none',
//                             background: activeTab === 'technique' ? '#ffffff' : 'transparent',
//                             color: activeTab === 'technique' ? '#7c3aed' : '#475569',
//                             fontWeight: activeTab === 'technique' ? 800 : 600,
//                             fontSize: '0.82rem',
//                             padding: '6px 14px',
//                             borderRadius: '8px',
//                             boxShadow: activeTab === 'technique' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
//                             cursor: 'pointer',
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '6px',
//                             transition: 'all 0.15s ease',
//                         }}
//                         type="button"
//                     >
//                         <Cpu size={14} color={activeTab === 'technique' ? '#7c3aed' : '#64748b'} />
//                         <span>Pipeline Ingestion & OCR</span>
//                         {santePipeline.alerte_derive_latence && (
//                             <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} title="Dérive de latence détectée" />
//                         )}
//                     </button>
// 
//                     <button
//                         onClick={() => setActiveTab('competences')}
//                         style={{
//                             border: 'none',
//                             background: activeTab === 'competences' ? '#ffffff' : 'transparent',
//                             color: activeTab === 'competences' ? '#059669' : '#475569',
//                             fontWeight: activeTab === 'competences' ? 800 : 600,
//                             fontSize: '0.82rem',
//                             padding: '6px 14px',
//                             borderRadius: '8px',
//                             boxShadow: activeTab === 'competences' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
//                             cursor: 'pointer',
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '6px',
//                             transition: 'all 0.15s ease',
//                         }}
//                         type="button"
//                     >
//                         <BrainCircuit size={14} color={activeTab === 'competences' ? '#059669' : '#64748b'} />
//                         <span>Compétences & Matching</span>
//                     </button>
//                 </div>
// 
//                 {/* FILTRES DYNAMIQUES DU DASHBOARD */}
//                 <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
//                     {/* Dates */}
//                     <div
//                         style={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '5px',
//                             background: '#ffffff',
//                             padding: '3px 8px',
//                             borderRadius: '8px',
//                             border: '1px solid #cbd5e1',
//                         }}
//                     >
//                         <Calendar size={13} color="#FF0D00" />
//                         <input
//                             type="date"
//                             value={dateDebut}
//                             onChange={(e) => {
//                                 setDateDebut(e.target.value);
//                                 setPeriode('');
//                             }}
//                             style={{ border: 'none', fontSize: '0.74rem', color: '#0f172a', fontWeight: 600, outline: 'none' }}
//                             title="Date de début"
//                         />
//                         <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>➔</span>
//                         <input
//                             type="date"
//                             value={dateFin}
//                             onChange={(e) => {
//                                 setDateFin(e.target.value);
//                                 setPeriode('');
//                             }}
//                             style={{ border: 'none', fontSize: '0.74rem', color: '#0f172a', fontWeight: 600, outline: 'none' }}
//                             title="Date de fin"
//                         />
//                     </div>
// 
//                     {/* Raccourcis Période */}
//                     <div style={{ background: '#f1f5f9', padding: '2px', borderRadius: '8px', display: 'flex', gap: '2px' }}>
//                         {[
//                             { id: 'all', label: 'Tout' },
//                             { id: 'this_month', label: 'Ce mois' },
//                             { id: '30_days', label: '30j' },
//                             { id: 'this_year', label: 'Année' },
//                         ].map((p) => (
//                             <button
//                                 key={p.id}
//                                 onClick={() => handlePresetClick(p.id)}
//                                 style={{
//                                     border: 'none',
//                                     background: periode === p.id ? '#ffffff' : 'transparent',
//                                     color: periode === p.id ? '#0f172a' : '#64748b',
//                                     fontWeight: periode === p.id ? 700 : 500,
//                                     fontSize: '0.74rem',
//                                     padding: '4px 8px',
//                                     borderRadius: '6px',
//                                     cursor: 'pointer',
//                                 }}
//                                 type="button"
//                             >
//                                 {p.label}
//                             </button>
//                         ))}
//                     </div>
// 
//                     {/* Direction */}
//                     <select
//                         value={directionId}
//                         onChange={(e) => setDirectionId(e.target.value)}
//                         style={{
//                             padding: '5px 10px',
//                             borderRadius: '8px',
//                             border: '1px solid #cbd5e1',
//                             fontSize: '0.76rem',
//                             background: '#ffffff',
//                             color: '#1e293b',
//                             fontWeight: 600,
//                             outline: 'none',
//                         }}
//                     >
//                         <option value="">Toutes directions</option>
//                         {repartitionDirections.map((dir) => (
//                             <option key={dir.id_direction} value={dir.id_direction}>
//                                 {dir.nom_direction}
//                             </option>
//                         ))}
//                     </select>
// 
//                     {hasActiveFilters && (
//                         <button
//                             onClick={handleResetFilters}
//                             title="Réinitialiser filtres"
//                             style={{ background: '#fee2e2', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}
//                             type="button"
//                         >
//                             <X size={13} color="#dc2626" />
//                         </button>
//                     )}
// 
//                     <button
//                         onClick={loadDashboard}
//                         title="Actualiser les données"
//                         type="button"
//                         style={{
//                             background: '#f8fafc',
//                             border: '1px solid #cbd5e1',
//                             padding: '5px 10px',
//                             borderRadius: '8px',
//                             cursor: 'pointer',
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '5px',
//                             fontSize: '0.76rem',
//                             fontWeight: 600,
//                         }}
//                     >
//                         <RefreshCw size={13} className={loading ? 'spin' : ''} />
//                     </button>
//                 </div>
//             </header>
// 
//             {/* ================================================================= */}
//             {/* ONGLET 1 : RH AU QUOTIDIEN (ACTIONS PRIORITAIRES & DOSSIERS DU JOUR) */}
//             {/* ================================================================= */}
//             {activeTab === 'rh' && (
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//                     {/* Ruban des 4 Alertes Opérationnelles Actionnables */}
//                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
//                         {/* 1. Dossiers Stagnants */}
//                         <div
//                             onClick={() =>
//                                 openDrillDown(
//                                     'Dossiers Stagnants (> 7 jours)',
//                                     'Candidatures sans aucun changement de statut depuis plus de 7 jours',
//                                     dossiersStagnants.liste
//                                 )
//                             }
//                             className="kpi-card-modern"
//                             style={{ borderLeft: '4px solid #f97316' }}
//                         >
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label" style={{ color: '#c2410c' }}>
//                                     Dossiers Stagnants (&gt; 7j)
//                                 </span>
//                                 <div className="kpi-modern-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
//                                     <Clock size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value" style={{ color: '#ea580c' }}>
//                                 {dossiersStagnants.total_stagnants}
//                             </div>
//                             <div className="kpi-modern-footer">
//                                 <span>Sans mouvement récent</span>
//                                 <span style={{ color: '#c2410c', fontWeight: 700, fontSize: '0.74rem' }}>Voir la liste ➔</span>
//                             </div>
//                         </div>
// 
//                         {/* 2. Backlog Non Consulté */}
//                         <div
//                             onClick={() =>
//                                 openDrillDown(
//                                     'Backlog Non Consulté (Jamais ouvert)',
//                                     'Candidatures reçues n’ayant pas encore été consultées par un recruteur',
//                                     backlogNonConsulte.liste
//                                 )
//                             }
//                             className="kpi-card-modern"
//                             style={{ borderLeft: '4px solid #ef4444' }}
//                         >
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label" style={{ color: '#b91c1c' }}>
//                                     Backlog Non Consulté
//                                 </span>
//                                 <div className="kpi-modern-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
//                                     <EyeOff size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value" style={{ color: '#dc2626' }}>
//                                 {backlogNonConsulte.total_non_consulte}
//                             </div>
//                             <div className="kpi-modern-footer">
//                                 <span style={{ color: '#dc2626', fontWeight: 600 }}>
//                                     {backlogNonConsulte.tranches_age?.plus_7j || 0} critiques (&gt;7j)
//                                 </span>
//                                 <span style={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.74rem' }}>Traiter ➔</span>
//                             </div>
//                         </div>
// 
//                         {/* 3. Respect SLA Recrutement */}
//                         <div
//                             onClick={() =>
//                                 openDrillDown(
//                                     'Respect des Délais Cibles (SLA 7 jours)',
//                                     'Dossiers dont le premier traitement dépasse ou approche l’échéance',
//                                     candidaturesATraiter
//                                 )
//                             }
//                             className="kpi-card-modern"
//                             style={{ borderLeft: '4px solid #059669' }}
//                         >
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label" style={{ color: '#047857' }}>
//                                     Conformité SLA (7j)
//                                 </span>
//                                 <div className="kpi-modern-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
//                                     <ShieldCheck size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value" style={{ color: '#059669' }}>
//                                 {conformiteSla.sla_conformite_pct}%
//                             </div>
//                             <div className="kpi-modern-footer">
//                                 <span>{conformiteSla.sla_depassement_count || 0} dépassement(s)</span>
//                                 <span style={{ color: '#047857', fontWeight: 700, fontSize: '0.74rem' }}>Détails ➔</span>
//                             </div>
//                         </div>
// 
//                         {/* 4. Vivier Réactivable */}
//                         <div
//                             onClick={() =>
//                                 openDrillDown(
//                                     'Vivier Réactivable',
//                                     'Candidatures spontanées correspondant aux offres d’emploi actuellement publiées',
//                                     vivierReactivable
//                                 )
//                             }
//                             className="kpi-card-modern"
//                             style={{ borderLeft: '4px solid #8b5cf6' }}
//                         >
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label" style={{ color: '#6d28d9' }}>
//                                     Vivier Réactivable
//                                 </span>
//                                 <div className="kpi-modern-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
//                                     <Sparkles size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value" style={{ color: '#7c3aed' }}>
//                                 {vivierReactivable.length}
//                             </div>
//                             <div className="kpi-modern-footer">
//                                 <span>Opportunités immédiates</span>
//                                 <span style={{ color: '#6d28d9', fontWeight: 700, fontSize: '0.74rem' }}>Mobiliser ➔</span>
//                             </div>
//                         </div>
//                     </div>
// 
//                     {/* COURBE DE TENDANCE DES CANDIDATURES (VUE RH) */}
//                     <TendanceCandidaturesCard
//                         evolutionMensuelle={evolutionMensuelle}
//                         chartMode={chartMode}
//                         setChartMode={setChartMode}
//                         chartWidth={chartWidth}
//                         chartHeight={chartHeight}
//                         paddingX={paddingX}
//                         paddingY={paddingY}
//                         activeMonthHover={activeMonthHover}
//                         setActiveMonthHover={setActiveMonthHover}
//                         points={points}
//                         areaSvgPaths={areaSvgPaths}
//                         maxMonthlyTotal={maxMonthlyTotal}
//                     />
// 
//                     {/* 2 Colonnes RH : Dossiers Stagnants à gauche + Backlog Non Consulté à droite */}
//                     <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '12px' }}>
//                         {/* TABLEAU 1 : DOSSIERS STAGNANTS (ACTIONNABLE & CLIQUABLE) */}
//                         <div className="dashboard-card-panel">
//                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                     <AlertTriangle size={16} color="#ea580c" />
//                                     <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                                         Dossiers Stagnants (&gt; 7 jours sans mouvement)
//                                     </h3>
//                                 </div>
//                                 <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
//                                     {dossiersStagnants.total_stagnants} dossier{dossiersStagnants.total_stagnants > 1 ? 's' : ''}
//                                 </span>
//                             </div>
// 
//                             {dossiersStagnants.liste.length === 0 ? (
//                                 <div style={{ padding: '24px', textAlign: 'center', color: '#16a34a', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.82rem' }}>
//                                     <CheckCircle2 size={20} style={{ margin: '0 auto 4px', color: '#16a34a' }} />
//                                     <strong>Flux optimal !</strong> Aucun dossier en souffrance depuis plus de 7 jours.
//                                 </div>
//                             ) : (
//                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
//                                     {dossiersStagnants.liste.map((c) => (
//                                         <div
//                                             key={c.id_candidature}
//                                             onClick={() => navigate(`/candidatures/${c.id_candidature}`)}
//                                             style={{
//                                                 padding: '8px 12px',
//                                                 borderRadius: '8px',
//                                                 border: '1px solid #e2e8f0',
//                                                 background: '#ffffff',
//                                                 display: 'flex',
//                                                 justifyContent: 'space-between',
//                                                 alignItems: 'center',
//                                                 cursor: 'pointer',
//                                                 transition: 'all 0.15s ease',
//                                             }}
//                                             title="Cliquer pour ouvrir directement ce dossier"
//                                         >
//                                             <div style={{ minWidth: 0 }}>
//                                                 <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                                                     {c.nom_complet}
//                                                 </div>
//                                                 <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
//                                                     {c.intitule} • <span style={{ color: '#0284c7' }}>{c.direction}</span>
//                                                 </div>
//                                             </div>
// 
//                                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
//                                                 <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#f1f5f9', color: '#334155', padding: '2px 7px', borderRadius: '999px' }}>
//                                                     {c.statut}
//                                                 </span>
//                                                 <span
//                                                     style={{
//                                                         fontSize: '0.72rem',
//                                                         fontWeight: 800,
//                                                         padding: '2px 8px',
//                                                         borderRadius: '999px',
//                                                         background: c.jours_stagnation >= 14 ? '#fee2e2' : '#ffedd5',
//                                                         color: c.jours_stagnation >= 14 ? '#b91c1c' : '#c2410c',
//                                                     }}
//                                                 >
//                                                     {c.jours_stagnation}j bloqué
//                                                 </span>
//                                                 <ChevronRight size={14} color="#94a3b8" />
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
// 
//                         {/* TABLEAU 2 : BACKLOG NON CONSULTÉ */}
//                         <div className="dashboard-card-panel">
//                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                     <EyeOff size={16} color="#dc2626" />
//                                     <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                                         Backlog Non Consulté (À ouvrir)
//                                     </h3>
//                                 </div>
//                                 <div style={{ display: 'flex', gap: '4px' }}>
//                                     <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>
//                                         &gt;7j: {backlogNonConsulte.tranches_age?.plus_7j || 0}
//                                     </span>
//                                     <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
//                                         2-7j: {backlogNonConsulte.tranches_age?.entre_2_et_7j || 0}
//                                     </span>
//                                 </div>
//                             </div>
// 
//                             {backlogNonConsulte.liste.length === 0 ? (
//                                 <div style={{ padding: '24px', textAlign: 'center', color: '#16a34a', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.82rem' }}>
//                                     <CheckCircle2 size={20} style={{ margin: '0 auto 4px', color: '#16a34a' }} />
//                                     <strong>Boîte de réception à jour !</strong> Toutes les candidatures reçues ont été ouvertes.
//                                 </div>
//                             ) : (
//                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
//                                     {backlogNonConsulte.liste.map((c) => (
//                                         <div
//                                             key={c.id_candidature}
//                                             onClick={() => navigate(`/candidatures/${c.id_candidature}`)}
//                                             style={{
//                                                 padding: '8px 12px',
//                                                 borderRadius: '8px',
//                                                 border: '1px solid #e2e8f0',
//                                                 background: '#ffffff',
//                                                 display: 'flex',
//                                                 justifyContent: 'space-between',
//                                                 alignItems: 'center',
//                                                 cursor: 'pointer',
//                                             }}
//                                             title="Cliquer pour consulter et marquer comme vue"
//                                         >
//                                             <div style={{ minWidth: 0 }}>
//                                                 <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                                                     {c.nom_complet}
//                                                 </div>
//                                                 <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
//                                                     {c.intitule} • <span style={{ color: '#0284c7' }}>{c.direction}</span>
//                                                 </div>
//                                             </div>
// 
//                                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
//                                                 <span
//                                                     style={{
//                                                         fontSize: '0.7rem',
//                                                         fontWeight: 700,
//                                                         padding: '2px 7px',
//                                                         borderRadius: '999px',
//                                                         background: c.jours_attente >= 7 ? '#fee2e2' : c.jours_attente >= 2 ? '#fef3c7' : '#ecfdf5',
//                                                         color: c.jours_attente >= 7 ? '#b91c1c' : c.jours_attente >= 2 ? '#b45309' : '#059669',
//                                                     }}
//                                                 >
//                                                     {c.jours_attente === 0 ? "Aujourd'hui" : `${c.jours_attente}j`}
//                                                 </span>
//                                                 <button
//                                                     onClick={(e) => {
//                                                         e.stopPropagation();
//                                                         navigate(`/candidatures/${c.id_candidature}`);
//                                                     }}
//                                                     style={{ border: 'none', background: '#FF0D00', color: '#ffffff', padding: '3px 8px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
//                                                     type="button"
//                                                 >
//                                                     Consulter
//                                                 </button>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
//                     </div>
// 
//                     {/* Suggestions Vivier Réactivable en bas de page */}
//                     {vivierReactivable.length > 0 && (
//                         <div className="dashboard-card-panel">
//                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                     <Sparkles size={16} color="#7c3aed" />
//                                     <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                                         Vivier Réactivable pour Postes Ouverts
//                                     </h3>
//                                 </div>
//                                 <button
//                                     onClick={() => navigate('/vivier')}
//                                     style={{ border: 'none', background: '#f5f3ff', color: '#7c3aed', padding: '3px 8px', borderRadius: '5px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
//                                     type="button"
//                                 >
//                                     Explorer le Vivier Complet ➔
//                                 </button>
//                             </div>
// 
//                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
//                                 {vivierReactivable.map((v) => (
//                                     <div
//                                         key={v.id_candidature}
//                                         onClick={() => navigate(`/vivier?candidature=${v.id_candidature}`)}
//                                         style={{
//                                             padding: '10px 12px',
//                                             borderRadius: '8px',
//                                             border: '1px solid #e9d5ff',
//                                             background: '#faf5ff',
//                                             display: 'flex',
//                                             justifyContent: 'space-between',
//                                             alignItems: 'center',
//                                             cursor: 'pointer',
//                                         }}
//                                     >
//                                         <div>
//                                             <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#581c87' }}>
//                                                 {v.nom_complet}
//                                             </div>
//                                             <div style={{ fontSize: '0.74rem', color: '#7e22ce', marginTop: '2px' }}>
//                                                 Offre ciblée : <strong>{v.titre_offre_suggeree}</strong>
//                                             </div>
//                                             <div style={{ fontSize: '0.68rem', color: '#6b21a8', fontStyle: 'italic', marginTop: '2px' }}>
//                                                 {v.motif_matching}
//                                             </div>
//                                         </div>
//                                         <ChevronRight size={16} color="#a855f7" />
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             )}
// 
//             {/* ================================================================= */}
//             {/* ONGLET 2 : DIRECTION & PERFORMANCE (FUNNEL, GOULETS P50/P90, CANAUX) */}
//             {/* ================================================================= */}
//             {activeTab === 'direction' && (
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//                     {/* Ruban Exécutif avec Deltas vs Période Précédente */}
//                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
//                         {/* 1. Dossiers Reçus + Delta */}
//                         <div className="kpi-card-modern" onClick={() => navigate('/candidatures/offres')}>
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label">Dossiers Reçus</span>
//                                 <div className="kpi-modern-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
//                                     <Users size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value">{kpis.total_candidatures ?? 0}</div>
//                             <div className="kpi-modern-footer">
//                                 <span>{kpis.candidatures_sur_offre ?? 0} offre • {kpis.candidatures_spontanees ?? 0} sp.</span>
//                                 {kpis.delta_candidatures_pct !== 0 && (
//                                     <span style={{ color: kpis.delta_candidatures_pct >= 0 ? '#059669' : '#dc2626', fontWeight: 800 }}>
//                                         {kpis.delta_candidatures_pct > 0 ? `+${kpis.delta_candidatures_pct}%` : `${kpis.delta_candidatures_pct}%`}
//                                     </span>
//                                 )}
//                             </div>
//                         </div>
// 
//                         {/* 2. Taux d'Embauche */}
//                         <div className="kpi-card-modern" style={{ cursor: 'default' }}>
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label">Taux d'Embauche</span>
//                                 <div className="kpi-modern-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
//                                     <CheckCircle2 size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value" style={{ color: '#059669' }}>
//                                 {kpis.taux_recrutement ?? 0}%
//                             </div>
//                             <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginTop: '4px' }}>
//                                 <div style={{ width: `${Math.min(100, kpis.taux_recrutement || 0)}%`, height: '100%', background: '#059669', borderRadius: '999px' }} />
//                             </div>
//                         </div>
// 
//                         {/* 3. Time-to-Hire Médian (P50) */}
//                         <div className="kpi-card-modern" style={{ cursor: 'default' }}>
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label">Time-to-Hire (P50)</span>
//                                 <div className="kpi-modern-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>
//                                     <Clock size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value" style={{ color: '#0284c7' }}>
//                                 {kpis.delai_median_jours > 0 ? `${kpis.delai_median_jours}j` : `${kpis.delai_moyen_jours}j`}
//                             </div>
//                             <div className="kpi-modern-footer">
//                                 <span>Médiane (Moy: {kpis.delai_moyen_jours}j)</span>
//                                 <span className="trend-badge positive">Robuste</span>
//                             </div>
//                         </div>
// 
//                         {/* 4. Délai 1ère Réponse Médian */}
//                         <div className="kpi-card-modern" style={{ cursor: 'default' }}>
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label">1ère Réponse (P50)</span>
//                                 <div className="kpi-modern-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
//                                     <Zap size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value" style={{ color: '#d97706' }}>
//                                 {delaiPremiereReponse.delai_median_heures > 0 ? `${delaiPremiereReponse.delai_median_heures}h` : '48h'}
//                             </div>
//                             <div className="kpi-modern-footer">
//                                 <span>Expérience candidat</span>
//                                 <span>P90: {delaiPremiereReponse.delai_p90_heures || 72}h</span>
//                             </div>
//                         </div>
//                     </div>
// 
//                     {/* COURBE DE TENDANCE DES CANDIDATURES (VUE DIRECTION) */}
//                     <TendanceCandidaturesCard
//                         evolutionMensuelle={evolutionMensuelle}
//                         chartMode={chartMode}
//                         setChartMode={setChartMode}
//                         chartWidth={chartWidth}
//                         chartHeight={chartHeight}
//                         paddingX={paddingX}
//                         paddingY={paddingY}
//                         activeMonthHover={activeMonthHover}
//                         setActiveMonthHover={setActiveMonthHover}
//                         points={points}
//                         areaSvgPaths={areaSvgPaths}
//                         maxMonthlyTotal={maxMonthlyTotal}
//                     />
// 
//                     {/* Durées par Étape du Workflow (LAG SQL Médiane P50 & P90) */}
//                     <div className="dashboard-card-panel">
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
//                             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                 <Target size={16} color="#FF0D00" />
//                                 <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                                     Vitesse et Goulots : Durée par Étape (Médiane P50 &amp; P90)
//                                 </h3>
//                             </div>
//                             <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
//                                 Calculé sur l'historique complet (PostgreSQL Window LAG)
//                             </span>
//                         </div>
// 
//                         <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: '10px' }}>
//                             {dureesWorkflow.map((step) => (
//                                 <div
//                                     key={step.id_statut}
//                                     style={{
//                                         padding: '10px 12px',
//                                         borderRadius: '10px',
//                                         border: step.alerte_goulot ? '2px solid #fca5a5' : '1px solid #e2e8f0',
//                                         background: step.alerte_goulot ? '#fff1f2' : '#f8fafc',
//                                         display: 'flex',
//                                         flexDirection: 'column',
//                                         gap: '6px',
//                                     }}
//                                 >
//                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                         <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
//                                             {step.statut_libelle}
//                                         </span>
//                                         {step.alerte_goulot && (
//                                             <span style={{ background: '#dc2626', color: '#ffffff', fontSize: '0.64rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
//                                                 Goulot
//                                             </span>
//                                         )}
//                                     </div>
// 
//                                     <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
//                                         <span style={{ fontSize: '1.25rem', fontWeight: 900, color: step.alerte_goulot ? '#b91c1c' : '#0f172a' }}>
//                                             {step.median_jours}j
//                                         </span>
//                                         <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
//                                             (P50 médiane)
//                                         </span>
//                                     </div>
// 
//                                     <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
//                                         <span>P90: <strong>{step.p90_jours}j</strong></span>
//                                         <span>{step.total_transitions} passage{step.total_transitions > 1 ? 's' : ''}</span>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
// 
//                     {/* Funnel de Conversion Détaillé */}
//                     <div className="dashboard-card-panel">
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
//                             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                 <Filter size={16} color="#2563eb" />
//                                 <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                                     Entonnoir de Conversion &amp; Déperdition (Taux de passage &amp; Drop-off)
//                                 </h3>
//                             </div>
//                             <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
//                                 Base : {kpis.total_candidatures ?? 0} dossiers reçus
//                             </span>
//                         </div>
// 
//                         <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
//                             {entonnoir.map((st, idx) => {
//                                 const isFinal = st.libelle.toLowerCase().includes('retenu') && !st.libelle.toLowerCase().includes('non');
//                                 const stepColor = isFinal ? '#10b981' : idx === 0 ? '#3b82f6' : idx === 1 ? '#6366f1' : idx === 2 ? '#8b5cf6' : '#f59e0b';
// 
//                                 return (
//                                     <div key={st.id_statut} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
//                                         {idx > 0 && st.taux_passage !== undefined && (
//                                             <div style={{ display: 'flex', justifyContent: 'center', margin: '-2px 0' }}>
//                                                 <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#f8fafc', color: '#475569', padding: '1px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
//                                                     ↓ {st.taux_passage}% de passage • Perte : {st.perte} ({st.taux_perte}%)
//                                                 </span>
//                                             </div>
//                                         )}
// 
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
//                                             <span style={{ fontWeight: 700, color: '#1e293b' }}>{st.libelle}</span>
//                                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                                                 <strong style={{ color: stepColor, fontSize: '0.84rem' }}>{st.count} dossiers</strong>
//                                                 <span style={{ color: '#64748b', fontSize: '0.72rem' }}>({st.pourcentage}% du total)</span>
//                                             </div>
//                                         </div>
// 
//                                         <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
//                                             <div
//                                                 style={{
//                                                     width: `${Math.min(100, Math.max(st.count > 0 ? 5 : 0, st.pourcentage))}%`,
//                                                     height: '100%',
//                                                     background: stepColor,
//                                                     borderRadius: '999px',
//                                                 }}
//                                             />
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     </div>
// 
//                     {/* Rendement des Canaux & Santé des Offres (2 Colonnes) */}
//                     <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '12px' }}>
//                         {/* TABLEAU RENDEMENT PAR CANAL (ROI & QUALITÉ DE SOURCE) */}
//                         <div className="dashboard-card-panel">
//                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                     <PieChartIcon size={16} color="#8b5cf6" />
//                                     <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                                         Rendement Réel par Canal (ROI Sources)
//                                     </h3>
//                                 </div>
//                             </div>
// 
//                             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
//                                 <thead>
//                                     <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
//                                         <th style={{ padding: '6px 8px' }}>Canal</th>
//                                         <th style={{ padding: '6px 8px' }}>Volume</th>
//                                         <th style={{ padding: '6px 8px' }}>Présél. %</th>
//                                         <th style={{ padding: '6px 8px' }}>Embauche %</th>
//                                         <th style={{ padding: '6px 8px' }}>Délai</th>
//                                         <th style={{ padding: '6px 8px' }}>Diagnostic</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {rendementCanaux.map((c) => (
//                                         <tr key={c.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
//                                             <td style={{ padding: '8px 8px', fontWeight: 700, color: '#0f172a' }}>{c.nom}</td>
//                                             <td style={{ padding: '8px 8px', fontWeight: 800 }}>{c.total}</td>
//                                             <td style={{ padding: '8px 8px', color: '#2563eb', fontWeight: 700 }}>{c.taux_preselection}%</td>
//                                             <td style={{ padding: '8px 8px', color: '#059669', fontWeight: 800 }}>{c.taux_recrutement}%</td>
//                                             <td style={{ padding: '8px 8px', color: '#64748b' }}>{c.delai_moyen_jours > 0 ? `${c.delai_moyen_jours}j` : '-'}</td>
//                                             <td style={{ padding: '8px 8px' }}>
//                                                 <span
//                                                     style={{
//                                                         fontSize: '0.68rem',
//                                                         fontWeight: 700,
//                                                         padding: '2px 6px',
//                                                         borderRadius: '4px',
//                                                         background: c.diagnostic.includes('Coût') ? '#fee2e2' : c.diagnostic.includes('excellence') ? '#ecfdf5' : '#f1f5f9',
//                                                         color: c.diagnostic.includes('Coût') ? '#dc2626' : c.diagnostic.includes('excellence') ? '#059669' : '#475569',
//                                                     }}
//                                                 >
//                                                     {c.diagnostic}
//                                                 </span>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
// 
//                         {/* SANTÉ DES OFFRES (TENSION, DORMANTES, À CLÔTURER) */}
//                         <div className="dashboard-card-panel">
//                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                     <Flame size={16} color="#e11d48" />
//                                     <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                                         Santé &amp; Alertes sur les Offres
//                                     </h3>
//                                 </div>
//                                 <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
//                                     {santeOffres.offres_en_tension_count + santeOffres.offres_dormantes_count + santeOffres.offres_a_cloturer_count} alerte(s)
//                                 </span>
//                             </div>
// 
//                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//                                 {santeOffres.offres_en_tension.length > 0 && (
//                                     <div style={{ padding: '8px 10px', borderRadius: '8px', background: '#fff1f2', border: '1px solid #fecdd3' }}>
//                                         <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#be123c', marginBottom: '4px' }}>
//                                             ⚠️ En tension (&gt;25j avec peu de candidats qualifiés)
//                                         </div>
//                                         {santeOffres.offres_en_tension.slice(0, 3).map((o) => (
//                                             <div key={o.id_offre} style={{ fontSize: '0.74rem', color: '#9f1239', display: 'flex', justifyContent: 'space-between' }}>
//                                                 <span>{o.titre_poste} ({o.direction})</span>
//                                                 <strong>{o.jours_publication}j en ligne</strong>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
// 
//                                 {santeOffres.offres_a_cloturer.length > 0 && (
//                                     <div style={{ padding: '8px 10px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
//                                         <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#15803d', marginBottom: '4px' }}>
//                                             ✅ Prêtes à clôturer (poste pourvu ou date expirée)
//                                         </div>
//                                         {santeOffres.offres_a_cloturer.slice(0, 3).map((o) => (
//                                             <div key={o.id_offre} style={{ fontSize: '0.74rem', color: '#166534', display: 'flex', justifyContent: 'space-between' }}>
//                                                 <span>{o.titre_poste}</span>
//                                                 <span>{o.motif}</span>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
// 
//                                 {santeOffres.offres_en_tension.length === 0 && santeOffres.offres_a_cloturer.length === 0 && (
//                                     <div style={{ textAlign: 'center', padding: '20px', color: '#059669', fontSize: '0.8rem' }}>
//                                         Toutes les offres publiées ont un pipeline équilibré.
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
// 
//             {/* ================================================================= */}
//             {/* ONGLET 3 : PIPELINE TECHNIQUE & INGESTION (N8N / OCR / NER) */}
//             {/* ================================================================= */}
//             {activeTab === 'technique' && (
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//                     {/* Ruban Métriques Pipeline & Latences P50 / P95 */}
//                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
//                         {/* 1. Taux de Succès */}
//                         <div className="kpi-card-modern" style={{ cursor: 'default' }}>
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label">Succès Ingestion n8n</span>
//                                 <div className="kpi-modern-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
//                                     <CheckCircle2 size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value" style={{ color: '#059669' }}>
//                                 {santePipeline.taux_succes}%
//                             </div>
//                             <div className="kpi-modern-footer">
//                                 <span>{santePipeline.total_flux} flux traités</span>
//                                 <span className="trend-badge positive">Stable</span>
//                             </div>
//                         </div>
// 
//                         {/* 2. Latence OCR Médiane & P95 */}
//                         <div className="kpi-card-modern" style={{ cursor: 'default' }}>
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label">Latence OCR (P50 / P95)</span>
//                                 <div className="kpi-modern-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
//                                     <Clock size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value" style={{ color: '#2563eb' }}>
//                                 {santePipeline.ocr_median_s}s
//                             </div>
//                             <div className="kpi-modern-footer">
//                                 <span>P95 : <strong>{santePipeline.ocr_p95_s}s</strong></span>
//                                 {santePipeline.ocr_p95_s > 15 ? (
//                                     <span style={{ color: '#dc2626', fontWeight: 800 }}>Alerte dérive</span>
//                                 ) : (
//                                     <span style={{ color: '#059669', fontWeight: 700 }}>Conforme</span>
//                                 )}
//                             </div>
//                         </div>
// 
//                         {/* 3. Latence NER Médiane & P95 */}
//                         <div className="kpi-card-modern" style={{ cursor: 'default' }}>
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label">Latence NER (P50 / P95)</span>
//                                 <div className="kpi-modern-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
//                                     <Cpu size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value" style={{ color: '#7c3aed' }}>
//                                 {santePipeline.ner_median_s}s
//                             </div>
//                             <div className="kpi-modern-footer">
//                                 <span>P95 : <strong>{santePipeline.ner_p95_s}s</strong></span>
//                                 <span style={{ color: '#7c3aed', fontWeight: 700 }}>Extraction IA</span>
//                             </div>
//                         </div>
// 
//                         {/* 4. CVs Vides ou Anomaliques */}
//                         <div className="kpi-card-modern" style={{ cursor: 'default' }}>
//                             <div className="kpi-modern-header">
//                                 <span className="kpi-modern-label">CVs Vides / Scan Illisible</span>
//                                 <div className="kpi-modern-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
//                                     <FileQuestion size={16} />
//                                 </div>
//                             </div>
//                             <div className="kpi-modern-value" style={{ color: santePipeline.cv_extraits_vides_count > 0 ? '#dc2626' : '#059669' }}>
//                                 {santePipeline.cv_extraits_vides_count}
//                             </div>
//                             <div className="kpi-modern-footer">
//                                 <span>&lt;200 cars ou 0 compétence</span>
//                                 <span>{santePipeline.cv_extraits_vides_count === 0 ? 'Zéro échec' : 'À relire'}</span>
//                             </div>
//                         </div>
//                     </div>
// 
//                     {/* Graphique Journalier du Pipeline (14 jours) */}
//                     <div className="dashboard-card-panel">
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
//                             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                 <Database size={16} color="#7c3aed" />
//                                 <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                                     Volume Quotidien d'Ingestion n8n (14 derniers jours)
//                                 </h3>
//                             </div>
//                             <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem' }}>
//                                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
//                                     <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} /> Succès
//                                 </span>
//                                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
//                                     <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} /> Doublon ignoré
//                                 </span>
//                                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
//                                     <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} /> Erreur
//                                 </span>
//                             </div>
//                         </div>
// 
//                         {santePipeline.flux_par_jour.length === 0 ? (
//                             <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
//                                 Aucune ingestion enregistrée sur les 14 derniers jours.
//                             </div>
//                         ) : (
//                             <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '110px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', overflowX: 'auto' }}>
//                                 {santePipeline.flux_par_jour.map((j) => {
//                                     const tot = (j.succes || 0) + (j.doublon || 0) + (j.erreur || 0);
//                                     const heightPct = tot > 0 ? Math.min(100, Math.max(12, tot * 15)) : 6;
//                                     return (
//                                         <div key={j.date_complete} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', gap: '3px' }}>
//                                             <span style={{ fontSize: '0.64rem', fontWeight: 700, color: '#475569' }}>{tot}</span>
//                                             <div style={{ width: '100%', maxWidth: '28px', height: `${heightPct}%`, background: '#e2e8f0', borderRadius: '4px 4px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse' }}>
//                                                 <div style={{ height: `${tot > 0 ? (j.succes / tot) * 100 : 0}%`, background: '#059669' }} />
//                                                 <div style={{ height: `${tot > 0 ? (j.doublon / tot) * 100 : 0}%`, background: '#3b82f6' }} />
//                                                 <div style={{ height: `${tot > 0 ? (j.erreur / tot) * 100 : 0}%`, background: '#dc2626' }} />
//                                             </div>
//                                             <span style={{ fontSize: '0.62rem', color: '#64748b', whiteSpace: 'nowrap' }}>{j.date}</span>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )}
//                     </div>
// 
//                     {/* Jauge Qualité Extraction IA & Retouche Manuelle */}
//                     <div className="dashboard-card-panel">
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
//                             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                 <ShieldCheck size={16} color="#0284c7" />
//                                 <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                                     Audit Qualité Extraction IA (Taux de retouche manuelle RH)
//                                 </h3>
//                             </div>
//                             <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
//                                 Statut de validation des fiches CV
//                             </span>
//                         </div>
// 
//                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
//                             <div style={{ padding: '10px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
//                                 <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>Validés directs sans retouche</div>
//                                 <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
//                                     {santePipeline.repartition_validation?.valide || 0}
//                                 </div>
//                             </div>
// 
//                             <div style={{ padding: '10px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a' }}>
//                                 <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700 }}>Modifiés / Corrigés par RH</div>
//                                 <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#d97706', marginTop: '2px' }}>
//                                     {santePipeline.repartition_validation?.modifie || 0}
//                                 </div>
//                                 <span style={{ fontSize: '0.68rem', color: '#92400e' }}>
//                                     Taux retouche : {santePipeline.taux_validation_manuelle}%
//                                 </span>
//                             </div>
// 
//                             <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
//                                 <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700 }}>En attente de revue</div>
//                                 <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#334155', marginTop: '2px' }}>
//                                     {santePipeline.repartition_validation?.en_attente || 0}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
// 
//             {/* ================================================================= */}
//             {/* ONGLET 4 : COMPÉTENCES, MATCHING & CONFORMITÉ RGPD */}
//             {/* ================================================================= */}
//             {activeTab === 'competences' && (
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//                     {/* Baromètre Offre vs Demande de Compétences */}
//                     <div className="dashboard-card-panel">
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
//                             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                 <BrainCircuit size={16} color="#059669" />
//                                 <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                                     Baromètre Offre vs Demande de Compétences
//                                 </h3>
//                             </div>
//                             <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
//                                 Comparaison compétences recherchées vs compétences vivier
//                             </span>
//                         </div>
// 
//                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
//                             {/* Compétences Demandées */}
//                             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
//                                 <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b' }}>
//                                     📌 Compétences les Plus Demandées par Alpha Ciment
//                                 </div>
//                                 {competencesOffreDemande.top_competences_demandees.length === 0 ? (
//                                     <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Aucune compétence enregistrée sur les offres.</div>
//                                 ) : (
//                                     competencesOffreDemande.top_competences_demandees.map((c, i) => (
//                                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.74rem' }}>
//                                             <span style={{ fontWeight: 600 }}>{c.competence}</span>
//                                             <strong style={{ color: '#FF0D00' }}>{c.count} offre{c.count > 1 ? 's' : ''}</strong>
//                                         </div>
//                                     ))
//                                 )}
//                             </div>
// 
//                             {/* Compétences Apportées */}
//                             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
//                                 <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b' }}>
//                                     🌟 Compétences les Plus Présentes dans les CVs
//                                 </div>
//                                 {competencesOffreDemande.top_competences_candidats.length === 0 ? (
//                                     <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Aucune compétence extraite des candidats.</div>
//                                 ) : (
//                                     competencesOffreDemande.top_competences_candidats.map((c, i) => (
//                                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.74rem' }}>
//                                             <span style={{ fontWeight: 600 }}>{c.competence}</span>
//                                             <strong style={{ color: '#059669' }}>{c.count} candidat{c.count > 1 ? 's' : ''}</strong>
//                                         </div>
//                                     ))
//                                 )}
//                             </div>
//                         </div>
// 
//                         {/* Pénuries Détectées */}
//                         {competencesOffreDemande.penuries.length > 0 && (
//                             <div style={{ marginTop: '14px', padding: '10px 12px', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px' }}>
//                                 <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c2410c', marginBottom: '4px' }}>
//                                     ⚠️ Compétences en Pénurie Identifiées (Demande &gt; Vivier disponible)
//                                 </div>
//                                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
//                                     {competencesOffreDemande.penuries.map((p, i) => (
//                                         <span key={i} style={{ fontSize: '0.72rem', background: '#ffedd5', color: '#9a3412', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
//                                             {p.competence} (Déficit : {p.gap})
//                                         </span>
//                                     ))}
//                                 </div>
//                             </div>
//                         )}
//                     </div>
// 
//                     {/* Conformité RGPD & Conservation */}
//                     <div className="dashboard-card-panel">
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
//                             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                 <ShieldAlert size={16} color="#d97706" />
//                                 <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                                     Conformité RGPD &amp; Durée de Conservation (Limite 2 ans)
//                                 </h3>
//                             </div>
//                             <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
//                                 Réglementation données personnelles
//                             </span>
//                         </div>
// 
//                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
//                             <div style={{ padding: '12px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a' }}>
//                                 <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309' }}>
//                                     Échéance Proche (&gt; 18 mois, &lt; 24 mois)
//                                 </div>
//                                 <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d97706', margin: '4px 0' }}>
//                                     {conformiteSla.rgpd_a_surveiller || 0}
//                                 </div>
//                                 <p style={{ margin: 0, fontSize: '0.72rem', color: '#92400e' }}>
//                                     Dossiers arrivant bientôt à terme de la durée de conservation recommandée.
//                                 </p>
//                             </div>
// 
//                             <div style={{ padding: '12px', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fca5a5' }}>
//                                 <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b91c1c' }}>
//                                     Anonymisation Requise (&gt; 24 mois)
//                                 </div>
//                                 <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#dc2626', margin: '4px 0' }}>
//                                     {conformiteSla.rgpd_a_anonymiser || 0}
//                                 </div>
//                                 <p style={{ margin: 0, fontSize: '0.72rem', color: '#991b1b' }}>
//                                     Dossiers ayant dépassé la limite légale des 2 ans de conservation sans activité.
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
// 
//             {/* ================================================================= */}
//             {/* 5. TABLEAU INFÉRIEUR COMMUN : DERNIÈRES OFFRES EN COURS */}
//             {/* ================================================================= */}
//             <section className="dashboard-card-panel">
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                         <BriefcaseBusiness size={16} color="#0f172a" />
//                         <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
//                             Dernières Offres d'Emploi en Recrutement
//                         </h3>
//                     </div>
//                     <button
//                         onClick={() => navigate('/offres')}
//                         style={{
//                             border: 'none',
//                             background: '#f1f5f9',
//                             color: '#334155',
//                             fontSize: '0.74rem',
//                             fontWeight: 700,
//                             padding: '3px 8px',
//                             borderRadius: '5px',
//                             cursor: 'pointer',
//                         }}
//                         type="button"
//                     >
//                         Gérer tout ➔
//                     </button>
//                 </div>
// 
//                 <OffersTable compact offers={offresRecentes} onSelectOffer={onSelectOffer} />
//             </section>
// 
//             {/* ================================================================= */}
//             {/* MODALE UNIVERSELLE DRILL-DOWN */}
//             {/* ================================================================= */}
//             <DrillDownModal
//                 isOpen={drillDownConfig.isOpen}
//                 onClose={closeDrillDown}
//                 title={drillDownConfig.title}
//                 subtitle={drillDownConfig.subtitle}
//                 items={drillDownConfig.items}
//                 type={drillDownConfig.type}
//                 onNavigate={navigate}
//             />
//         </div>
//     );
// }
// 