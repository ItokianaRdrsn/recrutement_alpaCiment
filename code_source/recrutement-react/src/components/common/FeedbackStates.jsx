import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export function PagePreloader() {
    return (
        <div className="preloader-overlay">
            <div className="loading-container">
                <div className="loading"></div>
                <div id="loading-icon">
                    <img src="/themes/custom/apiqa/images/loader.png" alt="Alpha Ciment" />
                </div>
            </div>
        </div>
    );
}

export function LoadingState({
    message = "Chargement des données en cours...",
    subtitle = "Veuillez patienter un instant"
}) {
    return (
        <div className="feedback-state modern-loading-card">
            <div className="modern-spinner-wrapper">
                <div className="spinner-halo"></div>
                <Loader2 className="modern-spinner-icon animate-spin" size={34} />
            </div>
            <div className="loading-text-container">
                <div className="loading-main-text">{message}</div>
                {subtitle && <div className="loading-sub-text">{subtitle}</div>}
            </div>
            <div className="loading-bar-track">
                <div className="loading-bar-pulse"></div>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
    return (
        <div className="skeleton-table-container">
            <div className="skeleton-table-header">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="skeleton-line skeleton-head" />
                ))}
            </div>
            <div className="skeleton-table-body">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="skeleton-row">
                        {Array.from({ length: cols }).map((_, c) => (
                            <div
                                key={c}
                                className="skeleton-line"
                                style={{ width: c === 0 ? '70%' : c === cols - 1 ? '40%' : '85%' }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AgendaSkeleton() {
    return (
        <div className="agenda-skeleton-container" aria-busy="true" aria-label="Chargement de l'agenda">
            {/* Top Banner Skeleton */}
            <div className="agenda-skeleton-banner">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="skeleton-line skeleton-head" style={{ width: '280px', height: '24px' }} />
                    <div className="skeleton-line" style={{ width: '380px', height: '14px' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="skeleton-line" style={{ width: '90px', height: '36px', borderRadius: '8px' }} />
                    <div className="skeleton-line" style={{ width: '170px', height: '36px', borderRadius: '8px' }} />
                </div>
            </div>

            {/* KPI & Filter Bar Skeleton */}
            <div className="agenda-controls-panel">
                <div className="skeleton-line" style={{ width: '240px', height: '36px', borderRadius: '8px' }} />
                <div className="skeleton-line" style={{ width: '130px', height: '36px', borderRadius: '8px' }} />
                <div className="skeleton-line" style={{ width: '130px', height: '36px', borderRadius: '8px' }} />
                <div className="skeleton-line" style={{ width: '140px', height: '36px', borderRadius: '8px' }} />
                <div className="skeleton-line" style={{ width: '140px', height: '36px', borderRadius: '8px' }} />
            </div>

            {/* Calendar Card Skeleton */}
            <div className="agenda-skeleton-calendar-card">
                {/* Header nav row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="skeleton-line" style={{ width: '34px', height: '34px', borderRadius: '8px' }} />
                        <div className="skeleton-line" style={{ width: '34px', height: '34px', borderRadius: '8px' }} />
                        <div className="skeleton-line" style={{ width: '95px', height: '34px', borderRadius: '8px' }} />
                        <div className="skeleton-line skeleton-head" style={{ width: '220px', height: '22px', marginLeft: '12px' }} />
                    </div>
                    <div className="skeleton-line" style={{ width: '200px', height: '34px', borderRadius: '10px' }} />
                </div>

                {/* Week Grid Skeleton */}
                <div className="agenda-skeleton-week-grid">
                    {/* Time Gutter Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '50px 8px 10px 8px', borderRight: '1px solid #f1f5f9' }}>
                        {['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map((time) => (
                            <span key={time} style={{ fontSize: '0.72rem', color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>
                                {time}
                            </span>
                        ))}
                    </div>

                    {/* 7 Days Columns */}
                    {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((day, dayIndex) => (
                        <div key={day} className="agenda-skeleton-day-col">
                            {/* Day Header pill */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>{day}</span>
                                <div className="skeleton-line" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                            </div>

                            {/* Simulated Cards on specific days */}
                            {dayIndex === 0 && (
                                <div className="agenda-skeleton-event-block" style={{ marginTop: '40px', background: 'rgba(59, 130, 246, 0.08)', borderLeft: '4px solid rgba(59, 130, 246, 0.4)', height: '85px' }}>
                                    <div className="skeleton-line" style={{ width: '50%', height: '11px' }} />
                                    <div className="skeleton-line skeleton-head" style={{ width: '80%', height: '13px' }} />
                                    <div className="skeleton-line" style={{ width: '65%', height: '11px' }} />
                                </div>
                            )}

                            {dayIndex === 1 && (
                                <div className="agenda-skeleton-event-block" style={{ marginTop: '160px', background: 'rgba(139, 92, 246, 0.08)', borderLeft: '4px solid rgba(139, 92, 246, 0.4)', height: '90px' }}>
                                    <div className="skeleton-line" style={{ width: '55%', height: '11px' }} />
                                    <div className="skeleton-line skeleton-head" style={{ width: '75%', height: '13px' }} />
                                    <div className="skeleton-line" style={{ width: '60%', height: '11px' }} />
                                </div>
                            )}

                            {dayIndex === 2 && (
                                <div className="agenda-skeleton-event-block" style={{ marginTop: '80px', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '4px solid rgba(16, 185, 129, 0.4)', height: '75px' }}>
                                    <div className="skeleton-line" style={{ width: '45%', height: '11px' }} />
                                    <div className="skeleton-line skeleton-head" style={{ width: '85%', height: '13px' }} />
                                </div>
                            )}

                            {dayIndex === 3 && (
                                <>
                                    <div className="agenda-skeleton-event-block" style={{ marginTop: '20px', background: 'rgba(59, 130, 246, 0.08)', borderLeft: '4px solid rgba(59, 130, 246, 0.4)', height: '80px' }}>
                                        <div className="skeleton-line" style={{ width: '50%', height: '11px' }} />
                                        <div className="skeleton-line skeleton-head" style={{ width: '70%', height: '13px' }} />
                                    </div>
                                    <div className="agenda-skeleton-event-block" style={{ marginTop: '70px', background: 'rgba(139, 92, 246, 0.08)', borderLeft: '4px solid rgba(139, 92, 246, 0.4)', height: '85px' }}>
                                        <div className="skeleton-line" style={{ width: '60%', height: '11px' }} />
                                        <div className="skeleton-line skeleton-head" style={{ width: '75%', height: '13px' }} />
                                    </div>
                                </>
                            )}

                            {dayIndex === 4 && (
                                <div className="agenda-skeleton-event-block" style={{ marginTop: '110px', background: 'rgba(59, 130, 246, 0.08)', borderLeft: '4px solid rgba(59, 130, 246, 0.4)', height: '80px' }}>
                                    <div className="skeleton-line" style={{ width: '50%', height: '11px' }} />
                                    <div className="skeleton-line skeleton-head" style={{ width: '80%', height: '13px' }} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function CandidatureDetailSkeleton() {
    return (
        <div className="view-stack" aria-busy="true" aria-label="Chargement du dossier candidat">
            <div className="candidature-screen-view">
                {/* 1. BARRE SUPÉRIEURE : RETOUR + ACTIONS */}
                <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div className="skeleton-line" style={{ width: '190px', height: '36px', borderRadius: '8px' }} />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="skeleton-line" style={{ width: '180px', height: '36px', borderRadius: '8px' }} />
                        <div className="skeleton-line" style={{ width: '140px', height: '32px', borderRadius: '20px' }} />
                    </div>
                </div>

                {/* 2. EN-TÊTE D'ONGLETS PLEINE LARGEUR */}
                <div
                    className="candidature-tabs-header no-print"
                    style={{
                        display: 'flex',
                        gap: '8px',
                        borderBottom: '2px solid var(--border)',
                        marginBottom: '16px',
                        background: '#fff',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        overflowX: 'auto',
                    }}
                >
                    <div className="skeleton-line" style={{ width: '170px', height: '34px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ width: '130px', height: '34px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ width: '120px', height: '34px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ width: '140px', height: '34px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ width: '150px', height: '34px', borderRadius: '6px' }} />
                    <div className="skeleton-line" style={{ width: '120px', height: '34px', borderRadius: '6px' }} />
                </div>

                {/* 3. DISPOSITION 2 COLONNES EXACTE (.candidature-detail-grid) */}
                <div className="candidature-detail-grid">
                    {/* COLONNE GAUCHE (360px STICKY) : SIDEBAR CANDIDAT */}
                    <div className="data-section candidate-sidebar-card" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        {/* Photo + Nom + Badges */}
                        <div className="candidate-profile-top" style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div className="skeleton-line" style={{ width: '90px', height: '90px', borderRadius: '50%', margin: '0 auto 12px auto' }} />
                            <div className="skeleton-line skeleton-head" style={{ width: '180px', height: '22px', margin: '0 auto 8px auto' }} />
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '6px' }}>
                                <div className="skeleton-line" style={{ width: '80px', height: '22px', borderRadius: '10px' }} />
                                <div className="skeleton-line" style={{ width: '75px', height: '22px', borderRadius: '10px' }} />
                            </div>
                        </div>

                        {/* Coordonnées */}
                        <div className="detail-block candidate-coords-block" style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="skeleton-line skeleton-head" style={{ width: '140px', height: '14px', marginBottom: '4px' }} />
                            <div className="skeleton-line" style={{ width: '90%', height: '14px' }} />
                            <div className="skeleton-line" style={{ width: '70%', height: '14px' }} />
                        </div>

                        {/* Progression Statuts RH (5 étapes workflow) */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                            <div className="skeleton-line skeleton-head" style={{ width: '150px', height: '14px', marginBottom: '12px' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <div
                                        key={s}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: s === 1 ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                                            background: s === 1 ? '#eff6ff' : '#ffffff',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="skeleton-line" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                                            <div className="skeleton-line" style={{ width: s === 1 ? '70px' : s === 3 ? '110px' : '90px', height: '14px' }} />
                                        </div>
                                        <div className="skeleton-line" style={{ width: '40px', height: '18px', borderRadius: '4px' }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bouton Vivier */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                            <div className="skeleton-line skeleton-head" style={{ width: '140px', height: '14px', marginBottom: '10px' }} />
                            <div className="skeleton-line" style={{ width: '100%', height: '40px', borderRadius: '8px' }} />
                        </div>
                    </div>

                    {/* COLONNE DROITE : CARTES D'INFORMATIONS DU DOSSIER */}
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {/* Section 1 : Informations Dossier */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div className="skeleton-line skeleton-head" style={{ width: '280px', height: '20px', marginBottom: '16px' }} />
                            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                                <div className="skeleton-line" style={{ width: '45%', height: '14px' }} />
                                <div className="skeleton-line" style={{ width: '35%', height: '14px' }} />
                                <div className="skeleton-line" style={{ width: '40%', height: '14px' }} />
                                <div className="skeleton-line" style={{ width: '60%', height: '14px' }} />
                                <div className="skeleton-line" style={{ width: '50%', height: '14px' }} />
                            </div>
                            <div className="skeleton-line skeleton-head" style={{ width: '220px', height: '14px', marginBottom: '8px' }} />
                            <div className="skeleton-line" style={{ width: '100%', height: '64px', borderRadius: '8px' }} />
                        </div>

                        {/* Section 2 : Compétences */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div className="skeleton-line skeleton-head" style={{ width: '220px', height: '20px', marginBottom: '14px' }} />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                {[110, 140, 95, 130, 85, 120].map((w, i) => (
                                    <div key={i} className="skeleton-line" style={{ width: `${w}px`, height: '28px', borderRadius: '14px' }} />
                                ))}
                            </div>
                            <div className="skeleton-line" style={{ width: '100%', height: '70px', borderRadius: '10px' }} />
                        </div>

                        {/* Section 3 : Expériences Professionnelles */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div className="skeleton-line skeleton-head" style={{ width: '240px', height: '20px', marginBottom: '16px' }} />
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {[1, 2].map((i) => (
                                    <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div className="skeleton-line skeleton-head" style={{ width: '180px', height: '16px' }} />
                                            <div className="skeleton-line" style={{ width: '90px', height: '16px', borderRadius: '4px' }} />
                                        </div>
                                        <div className="skeleton-line" style={{ width: '130px', height: '13px', marginBottom: '6px' }} />
                                        <div className="skeleton-line" style={{ width: '90%', height: '12px' }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 4 : Formations & Diplômes */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div className="skeleton-line skeleton-head" style={{ width: '210px', height: '20px', marginBottom: '16px' }} />
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {[1, 2].map((i) => (
                                    <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div className="skeleton-line skeleton-head" style={{ width: '160px', height: '16px' }} />
                                            <div className="skeleton-line" style={{ width: '70px', height: '16px', borderRadius: '4px' }} />
                                        </div>
                                        <div className="skeleton-line" style={{ width: '200px', height: '13px' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CandidaturesOffresSkeleton() {
    return (
        <div className="view-stack" aria-busy="true" aria-label="Chargement des candidatures sur offres">
            {/* 1. BARRE DE FILTRES GLOBALE */}
            <section className="filter-bar" style={{ gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="skeleton-line" style={{ width: '130px', height: '13px' }} />
                    <div className="skeleton-line" style={{ width: '100%', height: '42px', borderRadius: '8px' }} />
                </div>
                <div style={{ minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="skeleton-line" style={{ width: '80px', height: '13px' }} />
                    <div className="skeleton-line" style={{ width: '100%', height: '42px', borderRadius: '8px' }} />
                </div>
                <div style={{ minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="skeleton-line" style={{ width: '100px', height: '13px' }} />
                    <div className="skeleton-line" style={{ width: '100%', height: '42px', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div className="skeleton-line" style={{ width: '90px', height: '42px', borderRadius: '8px' }} />
                    <div className="skeleton-line" style={{ width: '110px', height: '42px', borderRadius: '8px' }} />
                </div>
            </section>

            {/* 2. RECHERCHE AVANCÉE ACCORDÉON / BANDEAU */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 18px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="skeleton-line" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                    <div className="skeleton-line skeleton-head" style={{ width: '260px', height: '16px' }} />
                </div>
                <div className="skeleton-line" style={{ width: '130px', height: '28px', borderRadius: '6px' }} />
            </div>

            {/* 3. DISPOSITION 2 COLONNES (340px 1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
                {/* COLONNE GAUCHE (340px) */}
                <div
                    className="data-section"
                    style={{
                        background: '#ffffff',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div className="skeleton-line skeleton-head" style={{ width: '150px', height: '18px' }} />
                    </div>

                    {/* Toutes les directions */}
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#e0e7ff', border: '1.5px solid #4f46e5', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="skeleton-line" style={{ width: '140px', height: '16px' }} />
                        <div className="skeleton-line" style={{ width: '55px', height: '20px', borderRadius: '10px' }} />
                    </div>

                    {/* Directions list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[1, 2, 3, 4, 5, 6].map((dirIndex) => (
                            <div
                                key={dirIndex}
                                style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '9px',
                                    background: '#ffffff',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="skeleton-line" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                                    <div className="skeleton-line" style={{ width: dirIndex % 2 === 0 ? '130px' : '170px', height: '15px' }} />
                                </div>
                                <div className="skeleton-line" style={{ width: '50px', height: '18px', borderRadius: '10px' }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLONNE DROITE (1fr) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Header banner */}
                    <div
                        style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <div className="skeleton-line skeleton-head" style={{ width: '260px', height: '20px', marginBottom: '6px' }} />
                            <div className="skeleton-line" style={{ width: '190px', height: '13px' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div className="skeleton-line" style={{ width: '110px', height: '36px', borderRadius: '8px' }} />
                            <div className="skeleton-line" style={{ width: '140px', height: '36px', borderRadius: '8px' }} />
                        </div>
                    </div>

                    {/* Table section */}
                    <div
                        className="data-section"
                        style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '0',
                            overflow: 'hidden',
                        }}
                    >
                        <TableSkeleton rows={7} cols={6} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CandidaturesSpontaneesSkeleton() {
    return (
        <div className="view-stack" aria-busy="true" aria-label="Chargement des candidatures spontanées">
            {/* 1. BARRE DE FILTRES GLOBALE */}
            <section className="filter-bar" style={{ gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="skeleton-line" style={{ width: '130px', height: '13px' }} />
                    <div className="skeleton-line" style={{ width: '100%', height: '42px', borderRadius: '8px' }} />
                </div>
                <div style={{ minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="skeleton-line" style={{ width: '80px', height: '13px' }} />
                    <div className="skeleton-line" style={{ width: '100%', height: '42px', borderRadius: '8px' }} />
                </div>
                <div style={{ minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="skeleton-line" style={{ width: '120px', height: '13px' }} />
                    <div className="skeleton-line" style={{ width: '100%', height: '42px', borderRadius: '8px' }} />
                </div>
                <div style={{ minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="skeleton-line" style={{ width: '100px', height: '13px' }} />
                    <div className="skeleton-line" style={{ width: '100%', height: '42px', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div className="skeleton-line" style={{ width: '90px', height: '42px', borderRadius: '8px' }} />
                    <div className="skeleton-line" style={{ width: '110px', height: '42px', borderRadius: '8px' }} />
                </div>
            </section>

            {/* 2. RECHERCHE AVANCÉE ACCORDÉON / BANDEAU */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 18px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="skeleton-line" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                    <div className="skeleton-line skeleton-head" style={{ width: '260px', height: '16px' }} />
                </div>
                <div className="skeleton-line" style={{ width: '130px', height: '28px', borderRadius: '6px' }} />
            </div>

            {/* 3. SECTION PRINCIPALE & TABLEAU DE CANDIDATURES */}
            <div className="data-section" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="skeleton-line skeleton-head" style={{ width: '260px', height: '20px' }} />
                        <div className="skeleton-line" style={{ width: '90px', height: '22px', borderRadius: '12px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="skeleton-line" style={{ width: '100px', height: '38px', borderRadius: '8px' }} />
                        <div className="skeleton-line" style={{ width: '140px', height: '38px', borderRadius: '8px' }} />
                    </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <TableSkeleton rows={7} cols={6} />
                </div>
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="view-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} aria-busy="true" aria-label="Chargement du tableau de bord">
            {/* EN-TÊTE COMPACT EXACT */}
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

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                        {/* Sélecteur de dates */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#ffffff',
                                padding: '4px 10px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                            }}
                        >
                            <div className="skeleton-line" style={{ width: '15px', height: '15px', borderRadius: '3px' }} />
                            <div className="skeleton-line" style={{ width: '90px', height: '24px', borderRadius: '6px' }} />
                            <div className="skeleton-line" style={{ width: '90px', height: '24px', borderRadius: '6px' }} />
                        </div>

                        {/* Raccourcis de périodes */}
                        <div style={{ background: '#f1f5f9', padding: '3px', borderRadius: '10px', display: 'flex', gap: '3px' }}>
                            <div className="skeleton-line" style={{ width: '45px', height: '24px', borderRadius: '7px' }} />
                            <div className="skeleton-line" style={{ width: '65px', height: '24px', borderRadius: '7px' }} />
                            <div className="skeleton-line" style={{ width: '40px', height: '24px', borderRadius: '7px' }} />
                            <div className="skeleton-line" style={{ width: '55px', height: '24px', borderRadius: '7px' }} />
                        </div>
                    </div>

                    {/* Filtre Direction + Bouton Actualiser */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="skeleton-line" style={{ width: '160px', height: '32px', borderRadius: '8px' }} />
                        <div className="skeleton-line" style={{ width: '95px', height: '32px', borderRadius: '8px' }} />
                    </div>
                </div>
            </header>

            {/* 1. RUBAN KPI HAUTE DENSITÉ (6 MICRO-INDICATEURS AVEC SPARKLINES) */}
            <section
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '10px',
                }}
            >
                {[
                    'Dossiers Reçus',
                    'Postes Ouverts',
                    'Vivier Actif',
                    'En Évaluation',
                    "Taux d'Embauche",
                    'Time-to-Hire',
                ].map((kpiLabel, idx) => (
                    <div key={idx} className="kpi-card-modern" style={{ cursor: 'default' }}>
                        <div className="kpi-modern-header">
                            <span className="kpi-modern-label">{kpiLabel}</span>
                            <div className="skeleton-line" style={{ width: '22px', height: '22px', borderRadius: '6px' }} />
                        </div>
                        <div className="skeleton-line skeleton-head" style={{ width: '55px', height: '26px', margin: '6px 0 4px 0' }} />
                        <div className="kpi-modern-footer">
                            <div className="skeleton-line" style={{ width: '60px', height: '11px' }} />
                            <div className="skeleton-line" style={{ width: '40px', height: '14px', borderRadius: '4px' }} />
                        </div>
                    </div>
                ))}
            </section>

            {/* 2. COCKPIT ANALYTICS 2 COLONNES HAUTE DENSITÉ */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.22fr) minmax(0, 1fr)',
                    gap: '10px',
                    alignItems: 'stretch',
                }}
            >
                {/* COLONNE GAUCHE : COURBE + SLA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                    {/* CARTE A : COURBE DE TENDANCE */}
                    <div className="dashboard-card-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div className="skeleton-line" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                                <div className="skeleton-line skeleton-head" style={{ width: '170px', height: '14px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div className="skeleton-line" style={{ width: '90px', height: '12px' }} />
                                <div className="skeleton-line" style={{ width: '110px', height: '24px', borderRadius: '6px' }} />
                            </div>
                        </div>

                        {/* Zone Graphique */}
                        <div style={{ height: '135px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0' }}>
                            {[30, 45, 60, 40, 75, 55, 90, 65, 80, 50, 70, 85].map((h, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                                    <div className="skeleton-line" style={{ width: '100%', height: `${h}%`, borderRadius: '4px 4px 0 0' }} />
                                    <div className="skeleton-line" style={{ width: '16px', height: '8px' }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CARTE B : DOSSIERS PRIORITAIRES (SLA) */}
                    <div className="dashboard-card-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div className="skeleton-line" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                                <div className="skeleton-line skeleton-head" style={{ width: '160px', height: '14px' }} />
                                <div className="skeleton-line" style={{ width: '65px', height: '16px', borderRadius: '999px' }} />
                            </div>
                            <div className="skeleton-line" style={{ width: '65px', height: '18px', borderRadius: '5px' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    style={{
                                        padding: '7px 10px',
                                        border: '1px solid #f1f5f9',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: '#fafafa',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="skeleton-line" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                        <div>
                                            <div className="skeleton-line skeleton-head" style={{ width: item === 1 ? '130px' : '150px', height: '13px', marginBottom: '3px' }} />
                                            <div className="skeleton-line" style={{ width: '180px', height: '10px' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div className="skeleton-line" style={{ width: '38px', height: '18px', borderRadius: '999px' }} />
                                        <div className="skeleton-line" style={{ width: '45px', height: '22px', borderRadius: '5px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE : PIPELINE + CANAUX & DIRECTIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* CARTE C : ENTONNOIR DE RECRUTEMENT PIPELINE */}
                    <div className="dashboard-card-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div className="skeleton-line" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                                <div className="skeleton-line skeleton-head" style={{ width: '200px', height: '14px' }} />
                            </div>
                            <div className="skeleton-line" style={{ width: '60px', height: '13px' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {[85, 65, 45, 30, 18].map((pct, idx) => (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className="skeleton-line" style={{ width: '90px', height: '12px' }} />
                                        <div className="skeleton-line" style={{ width: '45px', height: '12px' }} />
                                    </div>
                                    <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div className="skeleton-line" style={{ width: `${pct}%`, height: '100%', borderRadius: '999px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* GRILLE 2 CARTES : CANAUX D'ACQUISITION & PRESSION PAR DIRECTION */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                        {/* CARTE D1 : CANAUX */}
                        <div className="dashboard-card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div className="skeleton-line" style={{ width: '15px', height: '15px', borderRadius: '4px' }} />
                                    <div className="skeleton-line skeleton-head" style={{ width: '60px', height: '13px' }} />
                                </div>
                                <div className="skeleton-line" style={{ width: '40px', height: '14px', borderRadius: '999px' }} />
                            </div>

                            {/* Donut SVG Centré */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
                                <div className="skeleton-line" style={{ width: '86px', height: '86px', borderRadius: '50%' }} />
                            </div>

                            {/* Mini Légende */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                                <div className="skeleton-line" style={{ width: '60px', height: '16px', borderRadius: '6px' }} />
                                <div className="skeleton-line" style={{ width: '60px', height: '16px', borderRadius: '6px' }} />
                            </div>
                        </div>

                        {/* CARTE D2 : DIRECTIONS */}
                        <div className="dashboard-card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div className="skeleton-line" style={{ width: '15px', height: '15px', borderRadius: '4px' }} />
                                    <div className="skeleton-line skeleton-head" style={{ width: '70px', height: '13px' }} />
                                </div>
                                <div className="skeleton-line" style={{ width: '35px', height: '14px', borderRadius: '999px' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                                {[70, 50, 35, 20].map((w, idx) => (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div className="skeleton-line" style={{ width: '65px', height: '10px' }} />
                                            <div className="skeleton-line" style={{ width: '30px', height: '10px' }} />
                                        </div>
                                        <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                                            <div className="skeleton-line" style={{ width: `${w}%`, height: '100%', borderRadius: '999px' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. SECTION INFÉRIEURE : DERNIÈRES OFFRES */}
            <section className="dashboard-card-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="skeleton-line" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                        <div className="skeleton-line skeleton-head" style={{ width: '260px', height: '16px' }} />
                    </div>
                    <div className="skeleton-line" style={{ width: '80px', height: '22px', borderRadius: '5px' }} />
                </div>

                <TableSkeleton rows={4} cols={5} />
            </section>
        </div>
    );
}

export function CardsGridSkeleton({ count = 6 }) {
    return (
        <div className="cards-grid-skeleton" aria-busy="true" aria-label="Chargement du catalogue">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="card-skeleton-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div className="skeleton-line" style={{ width: '70px', height: '20px', borderRadius: '10px' }} />
                        <div className="skeleton-line" style={{ width: '50px', height: '20px', borderRadius: '10px' }} />
                    </div>
                    <div className="skeleton-line skeleton-head" style={{ width: '80%', height: '18px', marginBottom: '8px' }} />
                    <div className="skeleton-line" style={{ width: '100%', height: '13px', marginBottom: '6px' }} />
                    <div className="skeleton-line" style={{ width: '65%', height: '13px', marginBottom: '16px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <div className="skeleton-line" style={{ width: '60px', height: '12px' }} />
                        <div className="skeleton-line" style={{ width: '80px', height: '28px', borderRadius: '6px' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function OffersSkeleton() {
    return (
        <div className="view-stack" aria-busy="true" aria-label="Chargement des offres">
            {/* Filter bar */}
            <section className="filter-bar" aria-label="Filtres des offres">
                <div className="search-field" style={{ minWidth: '220px', flex: '1 1 240px' }}>
                    <div className="skeleton-line" style={{ width: '100%', height: '38px', borderRadius: '8px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="skeleton-line" style={{ width: '55px', height: '14px' }} />
                    <div className="skeleton-line" style={{ width: '160px', height: '38px', borderRadius: '8px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="skeleton-line" style={{ width: '45px', height: '14px' }} />
                    <div className="skeleton-line" style={{ width: '140px', height: '38px', borderRadius: '8px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="skeleton-line" style={{ width: '50px', height: '14px' }} />
                    <div className="skeleton-line" style={{ width: '140px', height: '38px', borderRadius: '8px' }} />
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }}>
                    <div className="skeleton-line" style={{ width: '85px', height: '38px', borderRadius: '8px' }} />
                    <div className="skeleton-line" style={{ width: '110px', height: '38px', borderRadius: '8px' }} />
                </div>
            </section>

            {/* Data section */}
            <section className="data-section">
                <div className="section-heading">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className="skeleton-line skeleton-head" style={{ width: '180px', height: '22px' }} />
                        <div className="skeleton-line" style={{ width: '120px', height: '14px' }} />
                    </div>
                    <div className="section-heading-actions" style={{ display: 'flex', gap: '8px' }}>
                        <div className="skeleton-line" style={{ width: '140px', height: '36px', borderRadius: '8px' }} />
                        <div className="skeleton-line" style={{ width: '105px', height: '36px', borderRadius: '8px' }} />
                    </div>
                </div>

                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '32px' }}></th>
                                <th>Poste</th>
                                <th>Direction</th>
                                <th>Contrat</th>
                                <th style={{ textAlign: 'center' }}>Candidatures</th>
                                <th>Publication</th>
                                <th>Limite</th>
                                <th>Statut</th>
                                <th style={{ whiteSpace: 'nowrap', width: '1%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <tr key={i}>
                                    <td>
                                        <div className="skeleton-line" style={{ width: '22px', height: '22px', borderRadius: '4px' }} />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="skeleton-line" style={{ width: '65px', height: '18px', borderRadius: '4px' }} />
                                            <div className="skeleton-line" style={{ width: i % 2 === 0 ? '220px' : '160px', height: '16px' }} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="skeleton-line" style={{ width: '130px', height: '15px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton-line" style={{ width: '65px', height: '15px' }} />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <div className="skeleton-line" style={{ width: '36px', height: '22px', borderRadius: '12px' }} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="skeleton-line" style={{ width: '85px', height: '15px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton-line" style={{ width: '85px', height: '15px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton-line" style={{ width: '75px', height: '22px', borderRadius: '999px' }} />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {[1, 2, 3, 4].map((a) => (
                                                <div key={a} className="skeleton-line" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <div className="skeleton-line" style={{ width: '130px', height: '14px' }} />
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                        <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                        <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                    </div>
                </div>
            </section>
        </div>
    );
}

export function VivierSkeleton() {
    return (
        <div className="view-stack" aria-busy="true" aria-label="Chargement du vivier">
            {/* Filter bar */}
            <section className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', flex: '1 1 auto' }}>
                    <div className="search-field" style={{ minWidth: '220px', flex: '1 1 200px' }}>
                        <div className="skeleton-line" style={{ width: '100%', height: '38px', borderRadius: '8px' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>
                        <div className="skeleton-line" style={{ width: '60px', height: '14px' }} />
                        <div className="skeleton-line" style={{ width: '100%', height: '38px', borderRadius: '8px' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>
                        <div className="skeleton-line" style={{ width: '110px', height: '14px' }} />
                        <div className="skeleton-line" style={{ width: '100%', height: '38px', borderRadius: '8px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div className="skeleton-line" style={{ width: '85px', height: '38px', borderRadius: '8px' }} />
                        <div className="skeleton-line" style={{ width: '110px', height: '38px', borderRadius: '8px' }} />
                    </div>
                </div>

                <div className="skeleton-line" style={{ width: '170px', height: '38px', borderRadius: '8px' }} />
            </section>

            {/* Data section */}
            <section className="data-section">
                <div className="section-heading">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className="skeleton-line skeleton-head" style={{ width: '380px', height: '22px' }} />
                        <div className="skeleton-line" style={{ width: '480px', height: '14px' }} />
                    </div>
                    <div className="skeleton-line" style={{ width: '110px', height: '36px', borderRadius: '8px' }} />
                </div>

                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Candidat</th>
                                <th>Candidature / Direction & Domaine</th>
                                <th>Motif / Contexte d'ajout</th>
                                <th>Date d'ajout</th>
                                <th>Statut Vivier</th>
                                <th>Actions RH</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <tr key={i}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div className="skeleton-line" style={{ width: '130px', height: '15px' }} />
                                            <div className="skeleton-line" style={{ width: '170px', height: '12px' }} />
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div className="skeleton-line" style={{ width: '140px', height: '15px' }} />
                                            <div className="skeleton-line" style={{ width: '120px', height: '12px' }} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="skeleton-line" style={{ width: i % 2 === 0 ? '140px' : '90px', height: '14px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton-line" style={{ width: '90px', height: '14px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton-line" style={{ width: '60px', height: '22px', borderRadius: '999px' }} />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <div className="skeleton-line" style={{ width: '140px', height: '30px', borderRadius: '6px' }} />
                                            <div className="skeleton-line" style={{ width: '30px', height: '30px', borderRadius: '6px' }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <div className="skeleton-line" style={{ width: '130px', height: '14px' }} />
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                        <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                    </div>
                </div>
            </section>
        </div>
    );
}

export function ModelesEmailsSkeleton() {
    return (
        <div className="view-container" style={{ padding: '24px' }} aria-busy="true" aria-label="Chargement des modèles d'e-mails">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton-line skeleton-head" style={{ width: '280px', height: '28px' }} />
                    <div className="skeleton-line" style={{ width: '460px', height: '15px' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="skeleton-line" style={{ width: '105px', height: '38px', borderRadius: '8px' }} />
                    <div className="skeleton-line" style={{ width: '145px', height: '38px', borderRadius: '8px' }} />
                </div>
            </div>

            {/* Filter toolbar */}
            <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="skeleton-line" style={{ flex: '1 1 280px', height: '40px', borderRadius: '8px' }} />
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div className="skeleton-line" style={{ width: '190px', height: '40px', borderRadius: '8px' }} />
                    <div className="skeleton-line" style={{ width: '140px', height: '40px', borderRadius: '8px' }} />
                </div>
            </div>

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '260px',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div className="skeleton-line" style={{ width: '80px', height: '22px', borderRadius: '4px' }} />
                                <div className="skeleton-line" style={{ width: '70px', height: '22px', borderRadius: '4px' }} />
                            </div>

                            <div className="skeleton-line skeleton-head" style={{ width: '75%', height: '20px', marginBottom: '10px' }} />

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '12px' }}>
                                <div className="skeleton-line" style={{ width: '50px', height: '14px' }} />
                                <div className="skeleton-line" style={{ width: '160px', height: '14px' }} />
                            </div>

                            <div className="skeleton-line" style={{ width: '80%', height: '26px', borderRadius: '6px', marginBottom: '14px' }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                                <div className="skeleton-line" style={{ width: '100%', height: '12px' }} />
                                <div className="skeleton-line" style={{ width: '88%', height: '12px' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                            <div className="skeleton-line" style={{ width: '45px', height: '24px', borderRadius: '12px' }} />
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                                <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                                <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AuditLogsSkeleton() {
    return (
        <div className="audit-logs-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }} aria-busy="true" aria-label="Chargement du journal d'audit">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton-line skeleton-head" style={{ width: '320px', height: '24px' }} />
                    <div className="skeleton-line" style={{ width: '460px', height: '14px' }} />
                </div>
                <div className="skeleton-line" style={{ width: '110px', height: '36px', borderRadius: '8px' }} />
            </div>

            {/* Filter toolbar */}
            <div
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                <div className="skeleton-line" style={{ flex: '1', minWidth: '220px', height: '38px', borderRadius: '8px' }} />
                <div className="skeleton-line" style={{ width: '160px', height: '38px', borderRadius: '8px' }} />
                <div className="skeleton-line" style={{ width: '140px', height: '38px', borderRadius: '8px' }} />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div className="skeleton-line" style={{ width: '120px', height: '38px', borderRadius: '8px' }} />
                    <div className="skeleton-line" style={{ width: '120px', height: '38px', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div className="skeleton-line" style={{ width: '85px', height: '38px', borderRadius: '8px' }} />
                    <div className="skeleton-line" style={{ width: '105px', height: '38px', borderRadius: '8px' }} />
                </div>
            </div>

            {/* Table */}
            <div
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                }}
            >
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date & Heure</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Utilisateur</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Entité / ID</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Description</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Détails</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div className="skeleton-line" style={{ width: '110px', height: '14px' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div className="skeleton-line" style={{ width: '100px', height: '14px' }} />
                                            <div className="skeleton-line" style={{ width: '60px', height: '11px' }} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div className="skeleton-line" style={{ width: '120px', height: '22px', borderRadius: '4px' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div className="skeleton-line" style={{ width: '90px', height: '14px' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div className="skeleton-line" style={{ width: i % 2 === 0 ? '260px' : '180px', height: '14px' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div className="skeleton-line" style={{ width: '30px', height: '30px', borderRadius: '6px' }} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <div className="skeleton-line" style={{ width: '130px', height: '14px' }} />
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                        <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function PipelineMonitoringSkeleton() {
    return (
        <div className="pipeline-monitoring-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }} aria-busy="true" aria-label="Chargement du monitoring IA">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton-line skeleton-head" style={{ width: '340px', height: '24px' }} />
                    <div className="skeleton-line" style={{ width: '520px', height: '14px' }} />
                </div>
                <div className="skeleton-line" style={{ width: '110px', height: '36px', borderRadius: '8px' }} />
            </div>

            {/* 7 KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                {[1, 2, 3, 4, 5, 6, 7].map((k) => (
                    <div
                        key={k}
                        style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div className="skeleton-line" style={{ width: '110px', height: '12px' }} />
                            <div className="skeleton-line" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                        </div>
                        <div className="skeleton-line skeleton-head" style={{ width: '65px', height: '28px', margin: '8px 0 6px 0' }} />
                        <div className="skeleton-line" style={{ width: '120px', height: '12px' }} />
                    </div>
                ))}
            </div>

            {/* Filter toolbar */}
            <div
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                <div className="skeleton-line" style={{ flex: '1', minWidth: '240px', height: '38px', borderRadius: '6px' }} />
                <div className="skeleton-line" style={{ width: '170px', height: '38px', borderRadius: '6px' }} />
                <div className="skeleton-line" style={{ width: '170px', height: '38px', borderRadius: '6px' }} />
            </div>

            {/* Table */}
            <div
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                }}
            >
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date & Heure</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Statut</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Intention</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Expéditeur & Sujet</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Temps Traitement</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Doublon</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div className="skeleton-line" style={{ width: '130px', height: '14px' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div className="skeleton-line" style={{ width: '80px', height: '22px', borderRadius: '999px' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div className="skeleton-line" style={{ width: '110px', height: '22px', borderRadius: '6px' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div className="skeleton-line" style={{ width: '160px', height: '14px' }} />
                                            <div className="skeleton-line" style={{ width: '220px', height: '12px' }} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div className="skeleton-line" style={{ width: '90px', height: '14px' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div className="skeleton-line" style={{ width: '60px', height: '14px' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <div className="skeleton-line" style={{ width: '130px', height: '14px' }} />
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                        <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function PublicOffersSkeleton({ count = 3 }) {
    return (
        <div className="public-offers-skeleton" aria-busy="true" aria-label="Chargement des offres">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="card p-0 mb-3 border-1 shadow-sm"
                    style={{
                        background: '#ffffff',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        overflow: 'hidden',
                    }}
                >
                    <div className="card-body" style={{ padding: '16px 20px' }}>
                        <div className="row justify-content-between align-items-center" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div className="col-md-5" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="skeleton-line" style={{ width: '50px', height: '26px', borderRadius: '4px', flexShrink: 0 }} />
                                <div className="skeleton-line skeleton-head" style={{ width: i % 2 === 0 ? '240px' : '180px', height: '18px' }} />
                            </div>

                            <div className="col-5 col-md-3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="skeleton-line" style={{ width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0 }} />
                                <div className="skeleton-line" style={{ width: '130px', height: '14px' }} />
                            </div>

                            <div className="col-7 col-md-3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="skeleton-line" style={{ width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0 }} />
                                <div className="skeleton-line" style={{ width: '160px', height: '14px' }} />
                            </div>

                            <div className="col-1 text-center" style={{ display: 'flex', justifyContent: 'center' }}>
                                <div className="skeleton-line" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ReferentialsSkeleton() {
    return (
        <div className="view-stack" aria-busy="true" aria-label="Chargement des référentiels">
            {/* Sub-menu navigation tabs */}
            <div className="sub-nav-tabs">
                <div className="skeleton-line" style={{ width: '160px', height: '36px', borderRadius: '8px' }} />
                <div className="skeleton-line" style={{ width: '130px', height: '36px', borderRadius: '8px' }} />
                <div className="skeleton-line" style={{ width: '130px', height: '36px', borderRadius: '8px' }} />
                <div className="skeleton-line" style={{ width: '150px', height: '36px', borderRadius: '8px' }} />
            </div>

            {/* Management Grid (2 cards: Directions and Domaines) */}
            <section className="management-grid">
                {[
                    { title: 'Directions', btnWidth: '150px', cols: ['Direction', 'Domaines', 'Offres', 'Actions'] },
                    { title: 'Domaines', btnWidth: '140px', cols: ['Domaine', 'Direction', 'Validation', 'Actions'] },
                ].map((sec, idx) => (
                    <div key={idx} className="data-section">
                        <div className="section-heading">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div className="skeleton-line skeleton-head" style={{ width: '140px', height: '20px' }} />
                                <div className="skeleton-line" style={{ width: '90px', height: '14px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div className="skeleton-line" style={{ width: sec.btnWidth, height: '34px', borderRadius: '8px' }} />
                                <div className="skeleton-line" style={{ width: '90px', height: '34px', borderRadius: '8px' }} />
                            </div>
                        </div>

                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        {sec.cols.map((col, cIdx) => (
                                            <th key={cIdx}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <tr key={r}>
                                            <td>
                                                <div className="skeleton-line" style={{ width: '120px', height: '15px' }} />
                                            </td>
                                            <td>
                                                <div className="skeleton-line" style={{ width: '70px', height: '15px' }} />
                                            </td>
                                            <td>
                                                <div className="skeleton-line" style={{ width: '60px', height: '22px', borderRadius: '999px' }} />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <div className="skeleton-line" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                                    <div className="skeleton-line" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                            <div className="skeleton-line" style={{ width: '110px', height: '14px' }} />
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <div className="skeleton-line" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                <div className="skeleton-line" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                            </div>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}

export function ErrorState({ message, onRetry }) {
    return (
        <div className="feedback-state error">
            <strong>Impossible de charger les données.</strong>
            <span>{message}</span>
            {onRetry ? (
                <button className="ghost-button" onClick={onRetry} type="button">
                    <RefreshCw aria-hidden="true" size={17} />
                    <span>Réessayer</span>
                </button>
            ) : null}
        </div>
    );
}
