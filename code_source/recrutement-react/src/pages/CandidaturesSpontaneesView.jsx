import React, { useCallback, useEffect, useState } from 'react';
import {
    Eye,
    Filter,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
} from 'lucide-react';
import { getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { Pagination } from '../components/common/Pagination';
import { SaisirRhCandidatureModal } from '../components/modals/SaisirRhCandidatureModal';
import { formatDate } from '../utils/formatters';
import { CandidatureDetailView } from './CandidatureDetailView';

export function CandidaturesSpontaneesView({ referentiels }) {
    const [candidatures, setCandidatures] = useState([]);
    const [statutsList, setStatutsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCandidatureId, setSelectedCandidatureId] = useState(null);
    const [showSaisirModal, setShowSaisirModal] = useState(false);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [paginationMeta, setPaginationMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 });

    const [filters, setFilters] = useState({
        q: '',
        statut: '',
        canal_depot: '',
    });

    const handleOpenDossier = useCallback(async (id) => {
        setSelectedCandidatureId(id);
        setCandidatures((prev) =>
            prev.map((item) => (item.id_candidature === id ? { ...item, vue: true } : item))
        );
        try {
            await sendJson(`/api/candidature/${id}/marquer-vue`, { method: 'PATCH' });
        } catch (err) {
            // silent
        }
    }, []);

    const resetFilters = () => {
        setFilters({ q: '', statut: '', canal_depot: '' });
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('per_page', String(perPage));
            params.set('type_demande', 'spontanee');

            if (filters.q) params.set('q', filters.q);
            if (filters.statut) params.set('statut', filters.statut);
            if (filters.canal_depot) params.set('canal_depot', filters.canal_depot);

            const [candResponse, statutsResponse] = await Promise.all([
                getJson(`/api/candidatures?${params.toString()}`),
                getJson('/api/referentiels/statuts-candidature'),
            ]);

            setCandidatures(candResponse?.data ?? []);
            setPaginationMeta({
                current_page: candResponse?.current_page ?? page,
                last_page: candResponse?.last_page ?? 1,
                total: candResponse?.total ?? (candResponse?.data?.length ?? 0),
                from: candResponse?.from ?? 1,
                to: candResponse?.to ?? (candResponse?.data?.length ?? 0),
            });
            setStatutsList(statutsResponse?.data ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters, page, perPage]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (selectedCandidatureId) {
        return (
            <CandidatureDetailView
                idCandidature={selectedCandidatureId}
                onBack={() => setSelectedCandidatureId(null)}
                onRefreshList={loadData}
                statutsList={statutsList}
            />
        );
    }

    return (
        <div className="view-stack">
            {/* HAUT DE PAGE : TITRE ET BOUTON SAISIR RH */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
                        Candidatures Spontanées
                    </h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Liste et traitement des candidatures spontanées soumises sans offre spécifique.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="ghost-button" onClick={loadData} type="button">
                        <RefreshCw size={16} />
                        <span>Actualiser</span>
                    </button>
                    <button className="primary-button" onClick={() => setShowSaisirModal(true)} type="button">
                        <Plus size={17} />
                        <span>Saisir une candidature RH</span>
                    </button>
                </div>
            </div>

            {/* BARRE DE FILTRES GLOBALE */}
            <section className="filter-bar" style={{ gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
                <label className="search-field" style={{ minWidth: '240px', flex: 1 }}>
                    <Search size={18} />
                    <input
                        onChange={(e) => setFilters((curr) => ({ ...curr, q: e.target.value }))}
                        placeholder="Rechercher un candidat (nom, email)..."
                        type="search"
                        value={filters.q}
                    />
                </label>

                <label style={{ minWidth: '180px' }}>
                    <span>Statut RH</span>
                    <select
                        onChange={(e) => setFilters((curr) => ({ ...curr, statut: e.target.value }))}
                        value={filters.statut}
                    >
                        <option value="">Tous les statuts</option>
                        {statutsList.map((st) => (
                            <option key={st.id_statut_candidature} value={st.id_statut_candidature}>
                                {st.libelle}
                            </option>
                        ))}
                    </select>
                </label>

                <label style={{ minWidth: '160px' }}>
                    <span>Canal de dépôt</span>
                    <select
                        onChange={(e) => setFilters((curr) => ({ ...curr, canal_depot: e.target.value }))}
                        value={filters.canal_depot}
                    >
                        <option value="">Tous les canaux</option>
                        <option value="site_externe">Portail Web</option>
                        <option value="rh_manuel">Saisie RH</option>
                    </select>
                </label>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="filter-button" onClick={loadData} type="button">
                        <Filter size={16} />
                        <span>Filtrer</span>
                    </button>
                    <button className="ghost-button" onClick={resetFilters} title="Réinitialiser" type="button">
                        <RotateCcw size={16} />
                        <span>Réinitialiser</span>
                    </button>
                </div>
            </section>

            {/* CONTENU PRINCIPAL : VUE SPONTANÉES UNIQUE */}
            <div className="data-section" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                        Dossiers de Candidatures Spontanées
                        <span className="badge amber" style={{ marginLeft: '10px' }}>{paginationMeta.total} dossiers</span>
                    </h3>
                </div>

                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState message={error} onRetry={loadData} />
                ) : !candidatures.length ? (
                    <div className="empty-state">Aucune candidature spontanée enregistrée.</div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Candidat</th>
                                    <th>Poste Souhaité</th>
                                    <th>Domaine / Direction Suggérée</th>
                                    <th>Date de Dépôt</th>
                                    <th>Statut RH</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidatures.map((c) => {
                                    const isUnread = !c.vue;

                                    return (
                                        <tr
                                            key={c.id_candidature}
                                            style={{
                                                background: isUnread ? '#eff6ff' : '#ffffff',
                                                borderLeft: isUnread ? '4px solid #2563eb' : 'none',
                                                fontWeight: isUnread ? '600' : 'normal',
                                            }}
                                        >
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {isUnread ? (
                                                        <span title="Candidature non encore vue" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
                                                    ) : null}
                                                    <div>
                                                        <strong style={{ color: '#0f172a' }}>{c.candidat?.prenom} {c.candidat?.nom}</strong>
                                                        <br />
                                                        <small style={{ color: '#64748b' }}>{c.candidat?.email}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <strong>{c.poste_souhaite ?? 'Spontanée'}</strong>
                                            </td>
                                            <td>
                                                <span>{c.domaine?.nom_domaine ?? 'Spontanée'}</span>
                                            </td>
                                            <td>{formatDate(c.created_at)}</td>
                                            <td>
                                                <span className="status-pill success">{c.statut?.libelle ?? 'Reçue'}</span>
                                            </td>
                                            <td>
                                                <button
                                                    className="filter-button"
                                                    onClick={() => handleOpenDossier(c.id_candidature)}
                                                    style={{ padding: '6px 12px', fontSize: '12.5px', gap: '6px' }}
                                                    type="button"
                                                >
                                                    <Eye size={14} />
                                                    <span>Consulter dossier</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination meta={paginationMeta} onChangePage={(p) => setPage(p)} perPage={perPage} />
            </div>

            {/* MODAL SAISIR MANUELLE RH */}
            {showSaisirModal && (
                <SaisirRhCandidatureModal
                    onClose={() => setShowSaisirModal(false)}
                    onSuccess={loadData}
                    referentiels={referentiels}
                />
            )}
        </div>
    );
}
