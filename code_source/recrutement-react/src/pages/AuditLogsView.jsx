import React, { useEffect, useState, useCallback } from 'react';
import {
    Activity,
    Calendar,
    ChevronDown,
    ChevronRight,
    Eye,
    Filter,
    RefreshCw,
    Search,
    ShieldAlert,
    User,
    X,
} from 'lucide-react';
import { getJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';

export function AuditLogsView() {
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Selected log for detailed diff modal
    const [selectedLog, setSelectedLog] = useState(null);

    const loadLogs = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            if (actionFilter) params.set('action', actionFilter);
            if (entityFilter) params.set('entite', entityFilter);
            if (searchQuery) params.set('q', searchQuery);
            if (dateDebut) params.set('date_debut', dateDebut);
            if (dateFin) params.set('date_fin', dateFin);

            const response = await getJson(`/api/audit-logs?${params.toString()}`);
            if (response?.data) {
                setLogs(response.data);
                setMeta(response.meta || { current_page: 1, last_page: 1, total: response.data.length });
                setCurrentPage(page);
            }
        } catch (err) {
            setError(err.message || 'Impossible de charger les journaux d’audit.');
        } finally {
            setLoading(false);
        }
    }, [actionFilter, entityFilter, searchQuery, dateDebut, dateFin]);

    useEffect(() => {
        loadLogs(1);
    }, [loadLogs]);

    const handleResetFilters = () => {
        setActionFilter('');
        setEntityFilter('');
        setSearchQuery('');
        setDateDebut('');
        setDateFin('');
    };

    const getActionBadgeClass = (action) => {
        if (!action) return 'badge-neutral';
        if (action.includes('CREATION') || action.includes('VALIDATION')) return 'badge-success';
        if (action.includes('MODIFICATION') || action.includes('CORRECTION') || action.includes('CHANGEMENT')) return 'badge-warning';
        if (action.includes('SUPPRESSION') || action.includes('REJET') || action.includes('CLOTURE')) return 'badge-danger';
        return 'badge-info';
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            return new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'medium',
                timeStyle: 'short',
            }).format(date);
        } catch {
            return isoString;
        }
    };

    return (
        <div className="audit-logs-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={22} className="text-primary" /> Journal d’Audit & Traçabilité RH
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        Historique immuable de toutes les actions sensibles effectuées par les recruteurs et administrateurs.
                    </p>
                </div>

                <button
                    className="action-button secondary"
                    onClick={() => loadLogs(currentPage)}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    Actualiser
                </button>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '220px', flex: '1' }}>
                    <Search size={16} color="#94a3b8" />
                    <input
                        type="text"
                        placeholder="Recherche dans la description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                        }}
                    />
                </div>

                <div style={{ minWidth: '160px' }}>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                        }}
                    >
                        <option value="">Toutes les actions</option>
                        <option value="CREATION_OFFRE">Création offre</option>
                        <option value="MODIFICATION_OFFRE">Modification offre</option>
                        <option value="PUBLICATION_OFFRE">Publication offre</option>
                        <option value="CLOTURE_OFFRE">Clôture offre</option>
                        <option value="CHANGEMENT_STATUT_CANDIDAT">Statut candidature</option>
                        <option value="VALIDATION_OCR">Validation OCR</option>
                        <option value="CORRECTION_OCR">Correction OCR</option>
                        <option value="REJET_OCR">Rejet OCR</option>
                        <option value="AJOUT_VIVIER">Ajout vivier</option>
                    </select>
                </div>

                <div style={{ minWidth: '140px' }}>
                    <select
                        value={entityFilter}
                        onChange={(e) => setEntityFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                        }}
                    >
                        <option value="">Toutes les entités</option>
                        <option value="Offre">Offre</option>
                        <option value="Candidature">Candidature</option>
                        <option value="Vivier">Vivier</option>
                        <option value="Candidat">Candidat</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                        title="Date de début"
                        style={{
                            padding: '8px 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                        }}
                    />
                    <span style={{ color: '#94a3b8' }}>-</span>
                    <input
                        type="date"
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                        title="Date de fin"
                        style={{
                            padding: '8px 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                        }}
                    />
                </div>

                {(actionFilter || entityFilter || searchQuery || dateDebut || dateFin) && (
                    <button
                        className="action-button text"
                        onClick={handleResetFilters}
                        style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <X size={14} /> Réinitialiser
                    </button>
                )}
            </div>

            {/* Error & Loading */}
            {error && <ErrorState message={error} />}

            {/* Logs Table */}
            <div
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                }}
            >
                {loading && logs.length === 0 ? (
                    <div style={{ padding: '40px' }}>
                        <LoadingState message="Chargement des journaux d’audit..." />
                    </div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                        <ShieldAlert size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>Aucune trace d'audit trouvée avec ces critères.</p>
                    </div>
                ) : (
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
                                {logs.map((log) => (
                                    <tr
                                        key={log.id_audit_log}
                                        style={{
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'background 0.15s ease',
                                        }}
                                        className="table-row-hover"
                                    >
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: '#475569' }}>
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {log.utilisateur ? (
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                                        {log.utilisateur.nom || log.utilisateur.name}
                                                    </span>
                                                    <small style={{ color: '#64748b' }}>{log.utilisateur.role}</small>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Système</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    backgroundColor: log.action?.includes('CREATION') || log.action?.includes('VALIDATION') ? '#dcfce7' : log.action?.includes('SUPPRESSION') || log.action?.includes('REJET') ? '#fee2e2' : '#e0e7ff',
                                                    color: log.action?.includes('CREATION') || log.action?.includes('VALIDATION') ? '#166534' : log.action?.includes('SUPPRESSION') || log.action?.includes('REJET') ? '#991b1b' : '#3730a3',
                                                }}
                                            >
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#334155' }}>
                                            <strong>{log.entite}</strong> {log.id_entite ? `(#${log.id_entite})` : ''}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#1e293b', maxWidth: '350px' }}>
                                            {log.description}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {(log.anciennes_valeurs || log.nouvelles_valeurs) ? (
                                                <button
                                                    className="action-button secondary"
                                                    onClick={() => setSelectedLog(log)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        fontSize: '0.75rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                    }}
                                                >
                                                    <Eye size={12} /> Diff
                                                </button>
                                            ) : (
                                                <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div
                        style={{
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid #e2e8f0',
                            background: '#f8fafc',
                        }}
                    >
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            Total : <strong>{meta.total}</strong> entrées (Page {meta.current_page} sur {meta.last_page})
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="action-button secondary"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => loadLogs(currentPage - 1)}
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                                Précédent
                            </button>
                            <button
                                className="action-button secondary"
                                disabled={currentPage >= meta.last_page || loading}
                                onClick={() => loadLogs(currentPage + 1)}
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Diff Viewer */}
            {selectedLog && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '16px',
                    }}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            maxWidth: '750px',
                            width: '100%',
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                                    Détails des modifications : {selectedLog.action}
                                </h3>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                                    {selectedLog.entite} #{selectedLog.id_entite} — {formatDate(selectedLog.created_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <strong style={{ fontSize: '0.85rem', color: '#475569' }}>Description :</strong>
                                <p style={{ margin: '4px 0 0', color: '#1e293b' }}>{selectedLog.description}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>
                                        Valeurs Précédentes
                                    </h4>
                                    <pre
                                        style={{
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            fontSize: '0.78rem',
                                            color: '#991b1b',
                                            maxHeight: '260px',
                                            overflow: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-all',
                                        }}
                                    >
                                        {selectedLog.anciennes_valeurs
                                            ? JSON.stringify(selectedLog.anciennes_valeurs, null, 2)
                                            : '(Aucune)'}
                                    </pre>
                                </div>

                                <div>
                                    <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>
                                        Nouvelles Valeurs
                                    </h4>
                                    <pre
                                        style={{
                                            background: '#f0fdf4',
                                            border: '1px solid #bbf7d0',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            fontSize: '0.78rem',
                                            color: '#166534',
                                            maxHeight: '260px',
                                            overflow: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-all',
                                        }}
                                    >
                                        {selectedLog.nouvelles_valeurs
                                            ? JSON.stringify(selectedLog.nouvelles_valeurs, null, 2)
                                            : '(Aucune)'}
                                    </pre>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                <span>IP : {selectedLog.ip_adresse || 'N/A'}</span>
                                {selectedLog.user_agent && <span> • Navigateur : {selectedLog.user_agent.substring(0, 70)}...</span>}
                            </div>
                        </div>

                        <div
                            style={{
                                padding: '12px 20px',
                                borderTop: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                background: '#f8fafc',
                                borderBottomLeftRadius: '12px',
                                borderBottomRightRadius: '12px',
                            }}
                        >
                            <button className="action-button secondary" onClick={() => setSelectedLog(null)}>
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
