import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Eye,
    Filter,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    UserPlus,
} from 'lucide-react';
import { getCachedJson, getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState, TableSkeleton, CandidaturesSpontaneesSkeleton } from '../components/common/FeedbackStates';
import { Pagination } from '../components/common/Pagination';
import { SaisirRhCandidatureModal } from '../components/modals/SaisirRhCandidatureModal';
import { formatDate } from '../utils/formatters';
import { CandidatureDetailView } from './CandidatureDetailView';
import AdvancedSearchPanel from '../components/candidatures/AdvancedSearchPanel';

export function CandidaturesSpontaneesView({ referentiels, competencesData }) {
    const [candidatures, setCandidatures] = useState([]);
    const [statutsList, setStatutsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCandidatureId, setSelectedCandidatureId] = useState(null);
    const [showSaisirModal, setShowSaisirModal] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const urlCandidatureId = searchParams.get('candidature') || searchParams.get('id');

    useEffect(() => {
        if (urlCandidatureId) {
            setSelectedCandidatureId(Number(urlCandidatureId));
        }
    }, [urlCandidatureId]);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [paginationMeta, setPaginationMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 });

    const initialFilters = {
        q: '',
        statut: '',
        canal_depot: '',
        direction: '',
        cv_keyword: '',
        competences: '',
        competence_mode: 'any',
        niveau_etude: '',
        annees_exp_min: '',
        poste_keyword: '',
    };

    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);

    const handleApplyFilters = useCallback((filtersOverride = null) => {
        const toApply = filtersOverride && typeof filtersOverride === 'object' && !filtersOverride.nativeEvent
            ? filtersOverride
            : filters;
        setAppliedFilters({ ...toApply });
        setPage(1);
    }, [filters]);

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

    const resetFilters = useCallback(() => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setPage(1);
    }, []);

    // Charger les statuts une seule fois au montage
    useEffect(() => {
        let isMounted = true;
        async function loadStatuts() {
            try {
                const statutsResponse = await getCachedJson('/api/referentiels/statuts-candidature');
                if (isMounted) {
                    setStatutsList(statutsResponse?.data ?? []);
                }
            } catch (err) {
                console.error('Erreur chargement statuts:', err);
            }
        }
        loadStatuts();
        return () => {
            isMounted = false;
        };
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('per_page', String(perPage));
            params.set('type_demande', 'spontanee');

            if (appliedFilters.q) params.set('q', appliedFilters.q);
            if (appliedFilters.statut) params.set('statut', appliedFilters.statut);
            if (appliedFilters.canal_depot) params.set('canal_depot', appliedFilters.canal_depot);
            if (appliedFilters.direction) params.set('direction', appliedFilters.direction);
            if (appliedFilters.cv_keyword) params.set('cv_keyword', appliedFilters.cv_keyword);
            if (appliedFilters.competences) params.set('competences', appliedFilters.competences);
            if (appliedFilters.competence_mode) params.set('competence_mode', appliedFilters.competence_mode);
            if (appliedFilters.niveau_etude) params.set('niveau_etude', appliedFilters.niveau_etude);
            if (appliedFilters.annees_exp_min) params.set('annees_exp_min', appliedFilters.annees_exp_min);
            if (appliedFilters.poste_keyword) params.set('poste_keyword', appliedFilters.poste_keyword);

            const candResponse = await getJson(`/api/candidatures?${params.toString()}`);

            setCandidatures(candResponse?.data ?? []);
            setPaginationMeta({
                current_page: candResponse?.current_page ?? page,
                last_page: candResponse?.last_page ?? 1,
                total: candResponse?.total ?? (candResponse?.data?.length ?? 0),
                from: candResponse?.from ?? 1,
                to: candResponse?.to ?? (candResponse?.data?.length ?? 0),
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [appliedFilters, page, perPage]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (selectedCandidatureId) {
        return (
            <CandidatureDetailView
                idCandidature={selectedCandidatureId}
                onBack={() => {
                    setSelectedCandidatureId(null);
                    setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.delete('candidature');
                        next.delete('id');
                        return next;
                    });
                }}
                onRefreshList={loadData}
                referentiels={referentiels}
                statutsList={statutsList}
            />
        );
    }

    if (loading && candidatures.length === 0) {
        return <CandidaturesSpontaneesSkeleton />;
    }

    return (
        <div className="view-stack">
            {/* BARRE DE FILTRES GLOBALE */}
            <section className="filter-bar" style={{ gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
                <label className="search-field" style={{ minWidth: '240px', flex: 1 }}>
                    <Search size={18} />
                    <input
                        onChange={(e) => setFilters((curr) => ({ ...curr, q: e.target.value }))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyFilters();
                            }
                        }}
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

                <label style={{ minWidth: '180px' }}>
                    <span>Direction suggérée</span>
                    <select
                        onChange={(e) => setFilters((curr) => ({ ...curr, direction: e.target.value }))}
                        value={filters.direction}
                    >
                        <option value="">Toutes les directions</option>
                        {(referentiels?.directions ?? []).map((dir) => (
                            <option key={dir.id_direction ?? dir.id} value={dir.id_direction ?? dir.id}>
                                {dir.nom_direction ?? dir.nom}
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
                    <button className="filter-button" onClick={() => handleApplyFilters()} type="button">
                        <Filter size={16} />
                        <span>Filtrer</span>
                    </button>
                    <button className="ghost-button" onClick={resetFilters} title="Réinitialiser" type="button">
                        <RotateCcw size={16} />
                        <span>Réinitialiser</span>
                    </button>
                </div>
            </section>

            {/* PANNEAU DE RECHERCHE AVANCÉE (CV, COMPÉTENCES, NIVEAU D'ÉTUDES, EXPÉRIENCE) */}
            <AdvancedSearchPanel
                competencesList={competencesData?.competences || []}
                filters={filters}
                onApply={handleApplyFilters}
                onChange={(newFilters) => setFilters(newFilters)}
                onReset={resetFilters}
            />

            {/* CONTENU PRINCIPAL : VUE SPONTANÉES UNIQUE */}
            <div className="data-section" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                        Dossiers de Candidatures Spontanées
                        <span className="badge amber" style={{ marginLeft: '10px' }}>{paginationMeta.total} dossiers</span>
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="ghost-button" onClick={loadData} type="button">
                        <RefreshCw size={16} />
                        <span>Actualiser</span>
                    </button>
                    <button
                        onClick={() => setShowSaisirModal(true)}
                        style={{
                            background: '#ede9fe',
                            color: '#6d28d9',
                            border: '1px solid #ddd6fe',
                            borderRadius: '8px',
                            height: '40px',
                            padding: '0 14px',
                            fontWeight: '600',
                            fontSize: '13.5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 2px rgba(109, 40, 217, 0.08)',
                            transition: 'all 0.15s ease',
                        }}
                        type="button"
                    >
                        <UserPlus size={16} />
                        <span>+ Candidature RH</span>
                    </button>
                </div>
                </div>

                {loading ? (
                    <TableSkeleton rows={6} cols={5} />
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
                                    <th>Domaine</th>
                                    <th>Direction Suggérée</th>
                                    <th>Date de Dépôt</th>
                                    <th>Statut RH</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidatures.map((c) => {
                                    const isUnread = !c.vue;

                                    return (
                                        <tr
                                            key={c.id_candidature}
                                            onClick={() => handleOpenDossier(c.id_candidature)}
                                            style={{
                                                background: isUnread ? '#eff6ff' : '#ffffff',
                                                borderLeft: isUnread ? '4px solid #2563eb' : 'none',
                                                fontWeight: isUnread ? '600' : 'normal',
                                                cursor: 'pointer',
                                            }}
                                            title="Cliquer pour consulter le dossier de cette candidature spontanée"
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
                                                        {c.cv_snippet && (
                                                            <div style={{ marginTop: '5px', fontSize: '11px', color: '#b91c1c', backgroundColor: '#fff1f0', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '5px', display: 'inline-block' }}>
                                                                📄 <strong>Extrait CV :</strong> <em>{c.cv_snippet}</em>
                                                            </div>
                                                        )}
                                                        {c.competences && c.competences.length > 0 && (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
                                                                {c.competences.slice(0, 3).map((comp, idx) => (
                                                                    <span key={comp.id_competence || idx} style={{ fontSize: '10px', backgroundColor: '#f1f5f9', color: '#475569', padding: '1px 5px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                                                                        {comp.nom_competence}
                                                                    </span>
                                                                ))}
                                                                {c.competences.length > 3 && (
                                                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>+{c.competences.length - 3}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <strong>{c.poste_souhaite ?? 'Spontanée'}</strong>
                                            </td>
                                            <td>
                                                <span>{c.domaine?.nom_domaine ?? 'Non spécifié'}</span>
                                            </td>
                                            <td>
                                                <span style={{ color: (c.domaine?.direction?.nom_direction || c.direction?.nom_direction || c.offre?.direction?.nom_direction) ? '#0f172a' : '#64748b' }}>
                                                    {c.domaine?.direction?.nom_direction ?? c.direction?.nom_direction ?? c.offre?.direction?.nom_direction ?? 'Non spécifiée'}
                                                </span>
                                            </td>
                                            <td>{formatDate(c.created_at)}</td>
                                            <td>
                                                <span className="status-pill success">{c.statut?.libelle ?? 'Reçue'}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination
                    meta={paginationMeta}
                    onChangePage={(p) => setPage(p)}
                    onChangePerPage={(n) => {
                        setPerPage(n);
                        setPage(1);
                    }}
                    perPage={perPage}
                />
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
