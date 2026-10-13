import React, { useCallback, useEffect, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Cpu,
    Eye,
    FileText,
    RefreshCw,
    Search,
    ShieldCheck,
    Sparkles,
    X,
    Zap,
} from 'lucide-react';
import { getJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';

export function PipelineMonitoringView() {
    const [metrics, setMetrics] = useState([]);
    const [kpis, setKpis] = useState({
        total_executions: 0,
        succes_count: 0,
        doublons_count: 0,
        erreurs_count: 0,
        taux_succes_pct: 100,
        duree_ocr_moyenne_s: 0,
        duree_ner_moyenne_s: 0,
        duree_totale_moyenne_s: 0,
        repartition_intentions: {},
    });
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtres
    const [statutFilter, setStatutFilter] = useState('');
    const [intentionFilter, setIntentionFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Modale de détail d'une exécution
    const [selectedMetric, setSelectedMetric] = useState(null);

    const loadMetrics = useCallback(
        async (page = 1) => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams();
                params.set('page', page.toString());
                if (statutFilter) params.set('statut', statutFilter);
                if (intentionFilter) params.set('intention', intentionFilter);
                if (searchQuery) params.set('q', searchQuery);

                const response = await getJson(`/api/pipeline-metrics?${params.toString()}`);
                if (response) {
                    setMetrics(response.data || []);
                    if (response.kpis) {
                        setKpis(response.kpis);
                    }
                    setMeta(response.meta || { current_page: 1, last_page: 1, total: (response.data || []).length });
                    setCurrentPage(page);
                }
            } catch (err) {
                setError(err.message || 'Impossible de charger les métriques du pipeline.');
            } finally {
                setLoading(false);
            }
        },
        [statutFilter, intentionFilter, searchQuery]
    );

    useEffect(() => {
        loadMetrics(1);
    }, [loadMetrics]);

    const handleResetFilters = () => {
        setStatutFilter('');
        setIntentionFilter('');
        setSearchQuery('');
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            return new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'medium',
                timeStyle: 'medium',
            }).format(date);
        } catch {
            return isoString;
        }
    };

    const renderStatutBadge = (statut) => {
        switch (statut) {
            case 'succes':
                return (
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#dcfce7',
                            color: '#15803d',
                        }}
                    >
                        <CheckCircle2 size={13} /> Succès
                    </span>
                );
            case 'doublon_ignore':
                return (
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#fef3c7',
                            color: '#b45309',
                        }}
                    >
                        <ShieldCheck size={13} /> Doublon évité
                    </span>
                );
            case 'erreur':
                return (
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#fee2e2',
                            color: '#b91c1c',
                        }}
                    >
                        <AlertTriangle size={13} /> Erreur DLQ
                    </span>
                );
            default:
                return (
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#f1f5f9',
                            color: '#475569',
                        }}
                    >
                        {statut || 'Inconnu'}
                    </span>
                );
        }
    };

    const renderIntentionBadge = (intention) => {
        switch (intention) {
            case 'demande_emploi':
                return (
                    <span
                        style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                        }}
                    >
                        Candidature
                    </span>
                );
            case 'information':
                return (
                    <span
                        style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#f3e8ff',
                            color: '#7e22ce',
                            border: '1px solid #e9d5ff',
                        }}
                    >
                        Information
                    </span>
                );
            case 'spam':
                return (
                    <span
                        style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #cbd5e1',
                        }}
                    >
                        Spam / Autre
                    </span>
                );
            default:
                return <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{intention || '-'}</span>;
        }
    };

    const hasFilters = Boolean(statutFilter || intentionFilter || searchQuery);

    return (
        <div className="pipeline-monitoring-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* En-tête */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cpu size={22} className="text-primary" /> Monitoring du Pipeline IA & n8n
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        Supervision en temps réel des performances OCR (DocTR/PyMuPDF), extraction NER (Qwen 2.5), idempotence et erreurs DLQ.
                    </p>
                </div>

                <button
                    className="action-button secondary"
                    onClick={() => loadMetrics(currentPage)}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    type="button"
                >
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    Actualiser
                </button>
            </div>

            {/* Cartes KPIs */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '14px',
                }}
            >
                {/* Total Exécutions */}
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                            Exécutions Pipeline
                        </span>
                        <Activity size={18} color="#0f172a" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>{kpis.total_executions}</div>
                    <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '4px' }}>
                        {kpis.succes_count} import(s) validé(s)
                    </div>
                </div>

                {/* Taux de Succès */}
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                            Taux de Fiabilité
                        </span>
                        <CheckCircle2 size={18} color="#16a34a" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16a34a' }}>{kpis.taux_succes_pct}%</div>
                    <div
                        style={{
                            width: '100%',
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '999px',
                            marginTop: '8px',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${Math.min(100, Math.max(0, kpis.taux_succes_pct))}%`,
                                height: '100%',
                                background: '#16a34a',
                            }}
                        />
                    </div>
                </div>

                {/* Temps Moyen OCR */}
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                            Durée Moy. OCR
                        </span>
                        <FileText size={18} color="#2563eb" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>{kpis.duree_ocr_moyenne_s} s</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>PyMuPDF / DocTR</div>
                </div>

                {/* Temps Moyen NER LLM */}
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                            Durée Moy. NER (IA)
                        </span>
                        <Sparkles size={18} color="#7c3aed" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>{kpis.duree_ner_moyenne_s} s</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Ollama Qwen 2.5 (JSON)</div>
                </div>

                {/* Temps Total Moyen */}
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                            Temps Total Moyen
                        </span>
                        <Clock size={18} color="#0284c7" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>{kpis.duree_totale_moyenne_s} s</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Traitement complet CV</div>
                </div>

                {/* Doublons Bloqués */}
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                            Doublons Évités
                        </span>
                        <ShieldCheck size={18} color="#d97706" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#d97706' }}>{kpis.doublons_count}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Clé d'idempotence</div>
                </div>

                {/* Erreurs DLQ */}
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                            Erreurs (DLQ)
                        </span>
                        <AlertTriangle size={18} color="#dc2626" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#dc2626' }}>{kpis.erreurs_count}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Capturées par Error Workflow</div>
                </div>
            </div>

            {/* Barre de filtres */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '240px', flex: '1' }}>
                    <Search size={16} color="#94a3b8" />
                    <input
                        type="text"
                        placeholder="Rechercher par email, sujet, message_id ou erreur..."
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

                <div style={{ minWidth: '170px' }}>
                    <select
                        value={statutFilter}
                        onChange={(e) => setStatutFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                        }}
                    >
                        <option value="">Tous les statuts</option>
                        <option value="succes">Succès</option>
                        <option value="doublon_ignore">Doublon évité (Idempotence)</option>
                        <option value="erreur">Erreur DLQ</option>
                    </select>
                </div>

                <div style={{ minWidth: '170px' }}>
                    <select
                        value={intentionFilter}
                        onChange={(e) => setIntentionFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                        }}
                    >
                        <option value="">Toutes les intentions</option>
                        <option value="demande_emploi">Demande d'emploi</option>
                        <option value="information">Demande d'information</option>
                        <option value="spam">Spam / Autre</option>
                    </select>
                </div>

                {hasFilters && (
                    <button
                        className="action-button secondary"
                        onClick={handleResetFilters}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px' }}
                        type="button"
                    >
                        <X size={15} /> Réinitialiser
                    </button>
                )}
            </div>

            {/* Contenu principal : Tableau des exécutions */}
            {error ? (
                <ErrorState message={error} />
            ) : loading ? (
                <LoadingState message="Chargement des métriques du pipeline..." />
            ) : metrics.length === 0 ? (
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '48px 24px',
                        textAlign: 'center',
                        color: '#64748b',
                    }}
                >
                    <Cpu size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: '#334155' }}>
                        Aucune exécution enregistrée pour ces critères.
                    </p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem' }}>
                        Les prochains imports de candidatures depuis n8n apparaîtront automatiquement ici avec leurs temps OCR et NER.
                    </p>
                </div>
            ) : (
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                >
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Date</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Statut</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Intention</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Expéditeur & Sujet</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Temps (OCR / NER / Total)</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Extraction IA</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Détails</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.map((item) => (
                                    <tr
                                        key={item.id_metric}
                                        style={{
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: '#475569' }}>
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            {renderStatutBadge(item.statut)}
                                        </td>
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            {renderIntentionBadge(item.intention)}
                                        </td>
                                        <td style={{ padding: '12px 16px', maxWidth: '280px' }}>
                                            <div style={{ fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.email_expediteur || '-'}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '0.78rem',
                                                    color: '#64748b',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={item.sujet_email || ''}
                                            >
                                                {item.sujet_email || (item.noeud_erreur || item.erreur_noeud ? `Nœud: ${item.noeud_erreur || item.erreur_noeud}` : '-')}
                                            </div>
                                            {item.offre?.titre && (
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        marginTop: '3px',
                                                        fontSize: '0.72rem',
                                                        background: '#f1f5f9',
                                                        color: '#334155',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                    }}
                                                >
                                                    Offre #{item.id_offre} : {item.offre.titre}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                                                <span title="Temps OCR" style={{ color: '#2563eb', fontWeight: 600 }}>
                                                    OCR: {Number(item.duree_ocr_s || 0).toFixed(2)}s
                                                </span>
                                                <span style={{ color: '#cbd5e1' }}>|</span>
                                                <span title="Temps NER LLM" style={{ color: '#7c3aed', fontWeight: 600 }}>
                                                    NER: {Number(item.duree_ner_s || 0).toFixed(2)}s
                                                </span>
                                                <span style={{ color: '#cbd5e1' }}>|</span>
                                                <span title="Temps Total" style={{ color: '#0f172a', fontWeight: 700 }}>
                                                    Σ {Number(item.duree_totale_s || 0).toFixed(2)}s
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#475569' }}>
                                            {item.statut === 'erreur' ? (
                                                <span style={{ color: '#dc2626', fontWeight: 500 }}>
                                                    {item.noeud_erreur || item.erreur_noeud || 'Erreur pipeline'}
                                                </span>
                                            ) : (
                                                <span>
                                                    <strong>{item.nb_caracteres_ocr || 0}</strong> car. •{' '}
                                                    <strong>{item.nb_competences || 0}</strong> comp. •{' '}
                                                    <strong>{item.nb_experiences || 0}</strong> exp.
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button
                                                className="action-button secondary"
                                                onClick={() => setSelectedMetric(item)}
                                                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                                                title="Inspecter les détails de l'exécution"
                                                type="button"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {meta.last_page > 1 && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                borderTop: '1px solid #e2e8f0',
                                background: '#f8fafc',
                            }}
                        >
                            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                Page {meta.current_page} sur {meta.last_page} ({meta.total} exécutions)
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="action-button secondary"
                                    disabled={meta.current_page <= 1}
                                    onClick={() => loadMetrics(meta.current_page - 1)}
                                    type="button"
                                >
                                    Précédent
                                </button>
                                <button
                                    className="action-button secondary"
                                    disabled={meta.current_page >= meta.last_page}
                                    onClick={() => loadMetrics(meta.current_page + 1)}
                                    type="button"
                                >
                                    Suivant
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modale de détail */}
            {selectedMetric && (
                <div
                    className="modal-backdrop"
                    onClick={() => setSelectedMetric(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px',
                    }}
                >
                    <div
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            maxWidth: '640px',
                            width: '100%',
                            padding: '24px',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={18} className="text-primary" /> Détail Exécution Pipeline #{selectedMetric.id_metric}
                            </h3>
                            <button
                                className="icon-button"
                                onClick={() => setSelectedMetric(null)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                                type="button"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem', marginBottom: '16px' }}>
                            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Statut & Intention</div>
                                <div style={{ marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {renderStatutBadge(selectedMetric.statut)}
                                    {renderIntentionBadge(selectedMetric.intention)}
                                </div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Horodatage</div>
                                <div style={{ marginTop: '4px', fontWeight: 600 }}>{formatDate(selectedMetric.created_at)}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Expéditeur</div>
                                <div style={{ marginTop: '4px', fontWeight: 600 }}>{selectedMetric.email_expediteur || '-'}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Candidature liée</div>
                                <div style={{ marginTop: '4px', fontWeight: 600 }}>
                                    {selectedMetric.id_candidature ? `Candidature #${selectedMetric.id_candidature}` : 'Aucune'}
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '4px' }}>Clé d'idempotence (Message-ID IMAP)</div>
                            <code style={{ wordBreak: 'break-all', color: '#0f172a', fontWeight: 600 }}>
                                {selectedMetric.cle_idempotence || 'Non renseignée'}
                            </code>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px', textAlign: 'center' }}>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Temps OCR</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2563eb' }}>
                                    {Number(selectedMetric.duree_ocr_s || 0).toFixed(2)} s
                                </div>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Temps NER (LLM)</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7c3aed' }}>
                                    {Number(selectedMetric.duree_ner_s || 0).toFixed(2)} s
                                </div>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Temps Total</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                                    {Number(selectedMetric.duree_totale_s || 0).toFixed(2)} s
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px', textAlign: 'center', fontSize: '0.8rem' }}>
                            <div style={{ background: '#f1f5f9', borderRadius: '6px', padding: '8px' }}>
                                <strong>{selectedMetric.nb_caracteres_ocr || 0}</strong>
                                <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Caractères OCR</div>
                            </div>
                            <div style={{ background: '#f1f5f9', borderRadius: '6px', padding: '8px' }}>
                                <strong>{selectedMetric.nb_competences || 0}</strong>
                                <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Compétences</div>
                            </div>
                            <div style={{ background: '#f1f5f9', borderRadius: '6px', padding: '8px' }}>
                                <strong>{selectedMetric.nb_experiences || 0}</strong>
                                <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Expériences</div>
                            </div>
                            <div style={{ background: '#f1f5f9', borderRadius: '6px', padding: '8px' }}>
                                <strong>{selectedMetric.nb_formations || 0}</strong>
                                <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Formations</div>
                            </div>
                        </div>

                        {(selectedMetric.message_erreur || selectedMetric.erreur_message) && (
                            <div
                                style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    color: '#991b1b',
                                    fontSize: '0.82rem',
                                }}
                            >
                                <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                                    Erreur capturée ({selectedMetric.noeud_erreur || selectedMetric.erreur_noeud || 'Pipeline n8n'}) :
                                </div>
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                    {selectedMetric.message_erreur || selectedMetric.erreur_message}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
