import React, { useCallback, useEffect, useState } from 'react';
import {
    BriefcaseBusiness,
    Calendar,
    ChevronRight,
    Eye,
    FileText,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Search,
    User,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { getJson } from '../api/client';
import { ErrorState, LoadingState, TableSkeleton } from '../components/common/FeedbackStates';
import { Pagination } from '../components/common/Pagination';
import { DoublonsPanel } from '../components/candidatures/DoublonsPanel';
import { formatDate } from '../utils/formatters';
import { CandidatureDetailView } from './CandidatureDetailView';

export function CandidatsListView() {
    const [candidats, setCandidats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [meta, setMeta] = useState(null);

    // Selected candidate for modal detail / drawer
    const [selectedCandidat, setSelectedCandidat] = useState(null);
    const [loadingCandidatDetail, setLoadingCandidatDetail] = useState(false);

    // If viewing a specific candidature full-screen
    const [selectedCandidatureId, setSelectedCandidatureId] = useState(null);

    const loadCandidats = useCallback(async (targetPage = 1, query = '', currentPerPage = perPage) => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.set('page', targetPage);
            params.set('per_page', currentPerPage);
            if (query.trim()) params.set('q', query.trim());

            const res = await getJson(`/api/candidats?${params.toString()}`);
            setCandidats(res?.data ?? []);
            setMeta({
                current_page: res?.current_page ?? targetPage,
                last_page: res?.last_page ?? 1,
                total: res?.total ?? 0,
                per_page: res?.per_page ?? currentPerPage,
                from: res?.from ?? (res?.total > 0 ? (targetPage - 1) * currentPerPage + 1 : 0),
                to: res?.to ?? Math.min(targetPage * currentPerPage, res?.total ?? 0),
            });
            setPage(res?.current_page ?? targetPage);
        } catch (err) {
            setError(err.message || 'Erreur lors du chargement des candidats.');
        } finally {
            setLoading(false);
        }
    }, [perPage]);

    useEffect(() => {
        loadCandidats(1, searchQuery);
    }, [loadCandidats]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        loadCandidats(1, searchQuery);
    };

    const handleOpenCandidatModal = async (id) => {
        setLoadingCandidatDetail(true);
        try {
            const res = await getJson(`/api/candidat/${id}`);
            setSelectedCandidat(res?.data ?? res);
        } catch (err) {
            alert('Impossible de charger les détails du candidat : ' + err.message);
        } finally {
            setLoadingCandidatDetail(false);
        }
    };

    // Si on a ouvert une candidature précise en plein écran
    if (selectedCandidatureId) {
        return (
            <CandidatureDetailView
                idCandidature={selectedCandidatureId}
                onBack={() => setSelectedCandidatureId(null)}
                onRefreshList={() => loadCandidats(page, searchQuery)}
                statutsList={[]}
            />
        );
    }

    return (
        <div className="view-stack">
            {/* EN-TÊTE PAGE */}
            <div className="section-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users className="text-primary" size={26} />
                        <span>Répertoire des Candidats</span>
                    </h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                        Annuaire centralisé des personnes physiques ayant postulé au sein d'Alpha Ciment
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        className="ghost-button"
                        onClick={() => loadCandidats(page, searchQuery)}
                        style={{ gap: '6px', fontSize: '13px' }}
                        type="button"
                    >
                        <RefreshCw size={15} />
                        <span>Actualiser</span>
                    </button>
                    <span className="badge blue" style={{ fontSize: '13px', padding: '6px 14px' }}>
                        Total : {meta?.total ?? 0} candidat(s)
                    </span>
                </div>
            </div>

            {/* FILTRE DE RECHERCHE */}
            <div className="card" style={{ padding: '16px 20px', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            placeholder="Rechercher par nom, prénom, e-mail ou téléphone..."
                            style={{
                                width: '100%',
                                padding: '10px 14px 10px 38px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                fontSize: '14px',
                            }}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="primary-button" style={{ padding: '10px 18px', gap: '8px' }} type="submit">
                        <Search size={16} />
                        <span>Filtrer</span>
                    </button>
                    {searchQuery && (
                        <button
                            className="ghost-button"
                            onClick={() => {
                                setSearchQuery('');
                                loadCandidats(1, '');
                            }}
                            type="button"
                        >
                            <X size={15} />
                            <span>Effacer</span>
                        </button>
                    )}
                </form>
            </div>

            <DoublonsPanel onMerged={() => loadCandidats(1, searchQuery)} />

            {/* CONTENU PRINCIPAL */}
            {loading && !candidats.length ? (
                <TableSkeleton columns={5} rows={6} />
            ) : error ? (
                <ErrorState message={error} onRetry={() => loadCandidats(1, searchQuery)} />
            ) : candidats.length === 0 ? (
                <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <Users size={48} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                    <h3 style={{ margin: '0 0 6px 0', color: 'var(--text)' }}>Aucun candidat trouvé</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                        {searchQuery ? 'Aucun profil ne correspond à vos critères de recherche.' : 'Aucun candidat n\'a encore été enregistré.'}
                    </p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div className="table-responsive">
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '14px 18px' }}>Candidat</th>
                                    <th style={{ padding: '14px 18px' }}>Coordonnées</th>
                                    <th style={{ padding: '14px 18px' }}>Localisation</th>
                                    <th style={{ padding: '14px 18px' }}>Candidatures déposées</th>
                                    <th style={{ padding: '14px 18px' }}>Dernière postulation</th>
                                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidats.map((c) => {
                                    const latestCand = c.candidatures && c.candidatures.length ? c.candidatures[0] : null;
                                    const totalCount = c.candidatures_count ?? (c.candidatures?.length ?? 0);

                                    return (
                                        <tr key={c.id_candidat} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                                            color: '#fff',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 'bold',
                                                            fontSize: '14px',
                                                        }}
                                                    >
                                                        {c.prenom?.[0]?.toUpperCase() || c.nom?.[0]?.toUpperCase() || 'C'}
                                                    </div>
                                                    <div>
                                                        <strong style={{ fontSize: '14.5px', color: 'var(--text)', display: 'block' }}>
                                                            {c.prenom} {c.nom}
                                                        </strong>
                                                        <small style={{ color: '#64748b', fontSize: '12px' }}>
                                                            Inscrit le {formatDate(c.created_at)}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>

                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'grid', gap: '3px', fontSize: '13px' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                                                        <Mail size={14} style={{ color: '#94a3b8' }} />
                                                        <span>{c.email}</span>
                                                    </span>
                                                    {c.telephone && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                                            <Phone size={14} style={{ color: '#94a3b8' }} />
                                                            <span>{c.telephone}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td style={{ padding: '14px 18px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#475569' }}>
                                                    <MapPin size={14} style={{ color: '#94a3b8' }} />
                                                    <span>{c.adresse || 'Madagascar'}</span>
                                                </span>
                                            </td>

                                            <td style={{ padding: '14px 18px' }}>
                                                <span className={`badge ${totalCount > 1 ? 'purple' : 'gray'}`} style={{ fontSize: '12px', fontWeight: '600' }}>
                                                    {totalCount} dossier{totalCount > 1 ? 's' : ''}
                                                </span>
                                            </td>

                                            <td style={{ padding: '14px 18px' }}>
                                                {latestCand ? (
                                                    <div style={{ display: 'grid', gap: '2px', fontSize: '13px' }}>
                                                        <strong>{latestCand.offre?.titre_poste || latestCand.offre?.titre || 'Candidature Spontanée'}</strong>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span className="status-pill success" style={{ fontSize: '11px', padding: '2px 8px' }}>
                                                                {latestCand.statut?.libelle || 'Reçue'}
                                                            </span>
                                                            <small style={{ color: '#94a3b8', fontSize: '11.5px' }}>
                                                                {formatDate(latestCand.created_at)}
                                                            </small>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Aucune postulation</span>
                                                )}
                                            </td>

                                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                                <button
                                                    className="filter-button"
                                                    onClick={() => handleOpenCandidatModal(c.id_candidat)}
                                                    style={{ padding: '7px 14px', fontSize: '13px', gap: '6px' }}
                                                    type="button"
                                                >
                                                    <Eye size={15} />
                                                    <span>Consulter profil</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {meta && (
                        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
                            <Pagination
                                meta={meta}
                                onChangePage={(newPage) => {
                                    setPage(newPage);
                                    loadCandidats(newPage, searchQuery, perPage);
                                }}
                                onChangePerPage={(newPerPage) => {
                                    setPerPage(newPerPage);
                                    setPage(1);
                                    loadCandidats(1, searchQuery, newPerPage);
                                }}
                                perPage={perPage}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* MODAL FICHE CANDIDAT & HISTORIQUE DES DOSSIERS */}
            {selectedCandidat && (
                <div className="modal-backdrop" onClick={() => setSelectedCandidat(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '92%' }}>
                        <div className="modal-header">
                            <div className="modal-header-left">
                                <div className="modal-icon-badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                                    <User size={22} />
                                </div>
                                <div>
                                    <h3 className="modal-title">
                                        {selectedCandidat.prenom} {selectedCandidat.nom}
                                    </h3>
                                    <p className="modal-subtitle">Profil candidat enregistré au sein du vivier d'Alpha Ciment</p>
                                </div>
                            </div>
                            <button className="modal-close-btn" onClick={() => setSelectedCandidat(null)} type="button">
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px', display: 'grid', gap: '20px' }}>
                            {/* COORDONNÉES */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <div>
                                    <small style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Email :</small>
                                    <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>{selectedCandidat.email}</strong>
                                </div>
                                <div>
                                    <small style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Téléphone :</small>
                                    <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>{selectedCandidat.telephone || 'Non renseigné'}</strong>
                                </div>
                                <div>
                                    <small style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Adresse :</small>
                                    <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>{selectedCandidat.adresse || 'Madagascar'}</strong>
                                </div>
                            </div>

                            {/* HISTORIQUE DES CANDIDATURES */}
                            <div>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={18} />
                                    <span>Historique des candidatures ({selectedCandidat.candidatures?.length || 0})</span>
                                </h4>

                                {!selectedCandidat.candidatures || selectedCandidat.candidatures.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontSize: '13.5px', margin: 0 }}>Aucune candidature liée.</p>
                                ) : (
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {selectedCandidat.candidatures.map((cand) => (
                                            <div
                                                key={cand.id_candidature}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px 16px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)',
                                                    background: '#ffffff',
                                                    gap: '12px',
                                                }}
                                            >
                                                <div>
                                                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                                                        {cand.offre?.titre_poste || cand.offre?.titre || 'Candidature Spontanée'}
                                                    </strong>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                        <span className="badge blue" style={{ fontSize: '11px' }}>
                                                            {cand.offre?.direction?.nom_direction || cand.offre?.direction?.nom || cand.domaine?.nom_domaine || 'Direction non spécifiée'}
                                                        </span>
                                                        <span className="status-pill success" style={{ fontSize: '11px', padding: '2px 8px' }}>
                                                            {cand.statut?.libelle || 'Reçue'}
                                                        </span>
                                                        {cand.dans_vivier && (
                                                            <span className="badge green" style={{ fontSize: '11px' }}>En Vivier</span>
                                                        )}
                                                        <small style={{ color: '#94a3b8', fontSize: '12px' }}>
                                                            Déposé le {formatDate(cand.created_at)}
                                                        </small>
                                                    </div>
                                                </div>

                                                <button
                                                    className="primary-button"
                                                    onClick={() => {
                                                        setSelectedCandidat(null);
                                                        setSelectedCandidatureId(cand.id_candidature);
                                                    }}
                                                    style={{ padding: '6px 12px', fontSize: '12.5px', gap: '6px' }}
                                                    type="button"
                                                >
                                                    <span>Ouvrir dossier</span>
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 24px', borderTop: '1px solid var(--border)' }}>
                            <button className="ghost-button" onClick={() => setSelectedCandidat(null)} type="button">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
