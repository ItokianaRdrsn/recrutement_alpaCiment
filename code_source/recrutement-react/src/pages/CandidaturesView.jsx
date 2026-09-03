import React, { useCallback, useEffect, useState } from 'react';
import {
    BriefcaseBusiness,
    Building2,
    Eye,
    Filter,
    Layers,
    ListChecks,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    UserCheck,
    Users,
} from 'lucide-react';
import { getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { SaisirRhCandidatureModal } from '../components/modals/SaisirRhCandidatureModal';
import { formatDate } from '../utils/formatters';
import { CandidatureDetailView } from './CandidatureDetailView';

// Helpers universels pour extraire les identifiants sans risquer les discordances de nommage (id_direction vs id, id_offre vs id)
const getDirId = (d) => Number(d?.id_direction ?? d?.id ?? 0);
const getOffreDirId = (o) => Number(o?.id_direction ?? o?.direction?.id_direction ?? o?.direction?.id ?? 0);
const getOffreId = (o) => Number(o?.id_offre ?? o?.id ?? 0);
const getCandOffreId = (c) => Number(c?.id_offre ?? c?.offre?.id_offre ?? c?.offre?.id ?? 0);
const getCandDirId = (c) => Number(c?.offre?.id_direction ?? c?.offre?.direction?.id_direction ?? c?.offre?.direction?.id ?? c?.direction?.id_direction ?? c?.direction?.id ?? c?.id_direction ?? 0);

export function CandidaturesView({ mode = 'offres', referentiels }) {
    const [candidatures, setCandidatures] = useState([]);
    const [allCandidaturesSurOffre, setAllCandidaturesSurOffre] = useState([]);
    const [offresList, setOffresList] = useState([]);
    const [statutsList, setStatutsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCandidatureId, setSelectedCandidatureId] = useState(null);
    const [showSaisirModal, setShowSaisirModal] = useState(false);

    // Sélection de direction & sous-mode de vue : 'toutes_candidatures' (par défaut) vs 'offres_candidatures'
    const [selectedDirectionId, setSelectedDirectionId] = useState(null);
    const [directionSubMode, setDirectionSubMode] = useState('toutes_candidatures'); // 'toutes_candidatures' | 'offres_candidatures'
    const [searchOffreQuery, setSearchOffreQuery] = useState('');
    const [expandedOffresInRightCol, setExpandedOffresInRightCol] = useState({});

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [paginationMeta, setPaginationMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 });

    const [filters, setFilters] = useState({
        q: '',
        statut: '',
        direction: '',
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
        setFilters({ q: '', statut: '', direction: '', canal_depot: '' });
        setSelectedDirectionId(null);
        setDirectionSubMode('toutes_candidatures');
        setSearchOffreQuery('');
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('per_page', String(perPage));
            params.set('type_demande', mode === 'spontanees' ? 'spontanee' : 'offre');

            if (filters.q) params.set('q', filters.q);
            if (filters.statut) params.set('statut', filters.statut);
            if (filters.canal_depot) params.set('canal_depot', filters.canal_depot);

            if (mode === 'offres') {
                if (selectedDirectionId) {
                    params.set('direction', String(selectedDirectionId));
                } else if (filters.direction) {
                    params.set('direction', filters.direction);
                }
            } else if (filters.direction) {
                params.set('direction', filters.direction);
            }

            const [candResponse, statutsResponse, offresResponse, allCandsResponse] = await Promise.all([
                getJson(`/api/candidatures?${params.toString()}`),
                getJson('/api/referentiels/statuts-candidature'),
                getJson('/api/offres?per_page=150'),
                getJson('/api/candidatures?type_demande=offre&per_page=500'),
            ]);

            setCandidatures(candResponse?.data ?? []);
            setAllCandidaturesSurOffre(allCandsResponse?.data ?? []);
            setPaginationMeta({
                current_page: candResponse?.current_page ?? page,
                last_page: candResponse?.last_page ?? 1,
                total: candResponse?.total ?? (candResponse?.data?.length ?? 0),
                from: candResponse?.from ?? 1,
                to: candResponse?.to ?? (candResponse?.data?.length ?? 0),
            });
            setStatutsList(statutsResponse?.data ?? []);

            const rawOffres = offresResponse?.data ?? (Array.isArray(offresResponse) ? offresResponse : []);
            setOffresList(rawOffres);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters, page, perPage, mode, selectedDirectionId]);

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

    const toggleOffreDropdownInRightCol = (offreId) => {
        setExpandedOffresInRightCol((prev) => ({
            ...prev,
            [offreId]: !prev[offreId],
        }));
    };

    // Sélectionner une direction avec un sous-mode d'affichage spécifique
    const handleSelectDirectionWithSubMode = (dirId, subMode) => {
        setSelectedDirectionId(dirId);
        setDirectionSubMode(subMode);
    };

    // Filtrer les offres pour le sous-mode 'offres_candidatures'
    const filteredOffresForRightCol = offresList.filter((o) => {
        if (selectedDirectionId && getOffreDirId(o) !== selectedDirectionId) {
            return false;
        }
        if (searchOffreQuery.trim()) {
            const query = searchOffreQuery.toLowerCase().trim();
            const title = (o.titre_poste ?? '').toLowerCase();
            const desc = (o.description ?? '').toLowerCase();
            return title.includes(query) || desc.includes(query);
        }
        return true;
    });

    const activeDirectionName = referentiels.directions?.find((d) => getDirId(d) === selectedDirectionId)?.nom_direction ?? 'Toutes les directions';

    return (
        <div className="view-stack">
            {/* HAUT DE PAGE : TITRE ET BOUTON SAISIR RH */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
                        {mode === 'spontanees' ? 'Candidatures Spontanées' : 'Candidatures sur Offres d\'Emploi'}
                    </h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        {mode === 'spontanees'
                            ? 'Liste et traitement des candidatures spontanées soumises sans offre spécifique.'
                            : 'Sélectionnez une direction et basculez entre Toutes les candidatures ou Offres & candidatures.'}
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

            {/* CONTENU PRINCIPAL : DISPOSITION 2 COLONNES POUR 'OFFRES' ET SIMPLE POUR 'SPONTANÉES' */}
            {mode === 'offres' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '330px 1fr', gap: '20px', alignItems: 'start' }}>
                    {/* COLONNE 1 (GAUCHE) : DIRECTIONS AVEC LES 2 BOUTONS ("Toutes les candidatures" ET "Offres & candidatures") */}
                    <div className="data-section" style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Building2 size={18} />
                                <span>Directions & Pôles</span>
                            </h3>
                        </div>

                        {/* BOUTON : TOUTES LES DIRECTIONS & CANDIDATURES */}
                        <button
                            onClick={() => {
                                setSelectedDirectionId(null);
                                setDirectionSubMode('toutes_candidatures');
                            }}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: !selectedDirectionId ? '#e0e7ff' : '#f8fafc',
                                border: !selectedDirectionId ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                                color: !selectedDirectionId ? '#4338ca' : '#334155',
                                fontWeight: !selectedDirectionId ? '700' : '500',
                                fontSize: '13px',
                                cursor: 'pointer',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                            type="button"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ListChecks size={16} />
                                <span>Toutes les directions</span>
                            </div>
                            <span className="badge blue" style={{ fontSize: '11px' }}>{allCandidaturesSurOffre.length} cand.</span>
                        </button>

                        {/* LISTE DES DIRECTIONS AVEC LES 2 BOUTONS REQUIS PAR DIRECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {referentiels.directions?.map((dir) => {
                                const currentDirId = getDirId(dir);

                                const dirCands = allCandidaturesSurOffre.filter(
                                    (c) => getCandDirId(c) === currentDirId
                                );
                                const dirCandCount = dirCands.length;

                                const dirOffres = offresList.filter(
                                    (o) => getOffreDirId(o) === currentDirId
                                );
                                const dirOffreCount = dirOffres.length;

                                const isDirSelected = selectedDirectionId === currentDirId;
                                const isToutesActive = isDirSelected && directionSubMode === 'toutes_candidatures';
                                const isOffresActive = isDirSelected && directionSubMode === 'offres_candidatures';

                                return (
                                    <div
                                        key={currentDirId}
                                        style={{
                                            border: isDirSelected ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                                            borderRadius: '9px',
                                            background: isDirSelected ? '#eff6ff' : '#ffffff',
                                            padding: '12px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <strong style={{ fontSize: '14px', color: isDirSelected ? '#1d4ed8' : '#0f172a' }}>
                                                {dir.nom_direction ?? dir.nom}
                                            </strong>
                                            <span className="badge blue" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                {dirCandCount} cand.
                                            </span>
                                        </div>

                                        {/* LES 2 BOUTONS EXIGÉS PAR DIRECTION */}
                                        <div style={{ display: 'grid', gap: '6px' }}>
                                            {/* BOUTON 1 : TOUTES LES CANDIDATURES (PAR DÉFAUT / DE BASE) */}
                                            <button
                                                onClick={() => handleSelectDirectionWithSubMode(currentDirId, 'toutes_candidatures')}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '7px 10px',
                                                    borderRadius: '6px',
                                                    background: isToutesActive ? '#2563eb' : '#ffffff',
                                                    border: isToutesActive ? 'none' : '1px solid #cbd5e1',
                                                    color: isToutesActive ? '#ffffff' : '#334155',
                                                    fontWeight: isToutesActive ? '700' : '500',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                                type="button"
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Users size={13} />
                                                    <span>Toutes les candidatures</span>
                                                </div>
                                                <span className={`badge ${isToutesActive ? 'white' : 'gray'}`} style={{ fontSize: '10px', color: isToutesActive ? '#1e40af' : '#475569' }}>
                                                    {dirCandCount}
                                                </span>
                                            </button>

                                            {/* BOUTON 2 : OFFRES & CANDIDATURES */}
                                            <button
                                                onClick={() => handleSelectDirectionWithSubMode(currentDirId, 'offres_candidatures')}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '7px 10px',
                                                    borderRadius: '6px',
                                                    background: isOffresActive ? '#4f46e5' : '#ffffff',
                                                    border: isOffresActive ? 'none' : '1px solid #cbd5e1',
                                                    color: isOffresActive ? '#ffffff' : '#334155',
                                                    fontWeight: isOffresActive ? '700' : '500',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                                type="button"
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <BriefcaseBusiness size={13} />
                                                    <span>Offres & candidatures</span>
                                                </div>
                                                <span className={`badge ${isOffresActive ? 'white' : 'gray'}`} style={{ fontSize: '10px', color: isOffresActive ? '#3730a3' : '#475569' }}>
                                                    {dirOffreCount} offre{dirOffreCount > 1 ? 's' : ''}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* COLONNE 2 (DROITE) : AFFICHE SOIT 'TOUTES LES CANDIDATURES' (DE BASE), SOIT 'OFFRES & CANDIDATURES' */}
                    <div className="data-section" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        {directionSubMode === 'offres_candidatures' ? (
                            /* VUE OFFRES & CANDIDATURES AVEC RECHERCHE OFFRE ET DEROULEUR */
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>
                                            Offres d'Emploi & Candidats - {activeDirectionName}
                                        </h3>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                                            Dépliez l'offre de votre choix pour consulter la liste de ses candidats.
                                        </p>
                                    </div>

                                    {/* CHAMP DE RECHERCHE DÉDIÉ AUX OFFRES */}
                                    <div className="search-field" style={{ minWidth: '240px' }}>
                                        <Search size={17} />
                                        <input
                                            onChange={(e) => setSearchOffreQuery(e.target.value)}
                                            placeholder="Rechercher une offre d'emploi..."
                                            type="search"
                                            value={searchOffreQuery}
                                        />
                                    </div>
                                </div>

                                {loading ? (
                                    <LoadingState />
                                ) : error ? (
                                    <ErrorState message={error} onRetry={loadData} />
                                ) : !filteredOffresForRightCol.length ? (
                                    <div className="empty-state">
                                        Aucune offre d'emploi trouvée pour cette recherche ou direction.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        {filteredOffresForRightCol.map((o) => {
                                            const currentOffreId = getOffreId(o);
                                            const isExpanded = expandedOffresInRightCol[currentOffreId] ?? false;

                                            const offreCands = allCandidaturesSurOffre.filter(
                                                (c) => getCandOffreId(c) === currentOffreId
                                            );
                                            const offreCandCount = offreCands.length;

                                            return (
                                                <div
                                                    key={currentOffreId}
                                                    style={{
                                                        border: isExpanded ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                                                        borderRadius: '10px',
                                                        background: '#ffffff',
                                                        boxShadow: isExpanded ? '0 4px 12px rgba(79, 70, 229, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {/* CARTE EN-TÊTE D'OFFRE AVEC BOUTON DÉROULANT POUR LES CANDIDATS */}
                                                    <div
                                                        style={{
                                                            padding: '14px 16px',
                                                            background: isExpanded ? '#f5f3ff' : '#f8fafc',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            gap: '14px',
                                                            flexWrap: 'wrap',
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                                                                    {o.titre_poste}
                                                                </strong>
                                                                <span className="badge blue" style={{ fontSize: '11px' }}>
                                                                    {o.direction?.nom ?? o.direction?.nom_direction ?? 'Direction'}
                                                                </span>
                                                                {o.date_publication ? (
                                                                    <small style={{ color: '#64748b' }}>Publiée le {formatDate(o.date_publication)}</small>
                                                                ) : null}
                                                            </div>
                                                        </div>

                                                        {/* BOUTON DÉROULANT POUR AFFICHER LES CANDIDATS DE L'OFFRE */}
                                                        <button
                                                            onClick={() => toggleOffreDropdownInRightCol(currentOffreId)}
                                                            style={{
                                                                padding: '8px 14px',
                                                                borderRadius: '8px',
                                                                fontSize: '12.5px',
                                                                fontWeight: '600',
                                                                background: isExpanded ? '#4f46e5' : '#ffffff',
                                                                color: isExpanded ? '#ffffff' : '#4338ca',
                                                                border: isExpanded ? 'none' : '1.5px solid #6366f1',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.15)',
                                                                transition: 'all 0.15s ease',
                                                            }}
                                                            type="button"
                                                        >
                                                            <Users size={15} />
                                                            <span>{isExpanded ? 'Masquer candidats' : `Voir candidats (${offreCandCount})`}</span>
                                                        </button>
                                                    </div>

                                                    {/* SOUS-LISTE DÉROULANTE DES CANDIDATS DE CETTE OFFRE */}
                                                    {isExpanded ? (
                                                        <div style={{ padding: '12px 16px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                                                            {!offreCands.length ? (
                                                                <div className="empty-state" style={{ padding: '16px' }}>
                                                                    Aucune candidature déposée pour cette offre pour le moment.
                                                                </div>
                                                            ) : (
                                                                <div className="table-wrap">
                                                                    <table>
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Candidat</th>
                                                                                <th>Email & Téléphone</th>
                                                                                <th>Date de Dépôt</th>
                                                                                <th>Statut RH</th>
                                                                                <th>Actions</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {offreCands.map((c) => {
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
                                                                                                <strong style={{ color: '#0f172a' }}>{c.candidat?.prenom} {c.candidat?.nom}</strong>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td>
                                                                                            <span>{c.candidat?.email}</span>
                                                                                            {c.candidat?.telephone ? <small style={{ display: 'block', color: '#64748b' }}>{c.candidat.telephone}</small> : null}
                                                                                        </td>
                                                                                        <td>{formatDate(c.created_at)}</td>
                                                                                        <td>
                                                                                            <span className="status-pill success">{c.statut?.libelle ?? 'Reçue'}</span>
                                                                                        </td>
                                                                                        <td>
                                                                                            <button
                                                                                                className="filter-button"
                                                                                                onClick={() => handleOpenDossier(c.id_candidature)}
                                                                                                style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
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
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* VUE PAR DÉFAUT : TOUTES LES CANDIDATURES DE LA DIRECTION EN CLAIR (TABLEAU UNIQUE) */
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                                        {selectedDirectionId
                                            ? `Candidatures sur offre - ${activeDirectionName}`
                                            : `Toutes les candidatures sur offre (Toutes directions)`}
                                        <span className="badge blue" style={{ marginLeft: '10px' }}>{paginationMeta.total} dossiers</span>
                                    </h3>
                                </div>

                                {loading ? (
                                    <LoadingState />
                                ) : error ? (
                                    <ErrorState message={error} onRetry={loadData} />
                                ) : !candidatures.length ? (
                                    <div className="empty-state">Aucune candidature trouvée pour cette sélection.</div>
                                ) : (
                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Candidat</th>
                                                    <th>Offre / Poste</th>
                                                    <th>Direction</th>
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
                                                                <strong>{c.offre?.titre_poste ?? c.poste_souhaite ?? 'Sans intitulé'}</strong>
                                                            </td>
                                                            <td>
                                                                <span>{c.offre?.direction?.nom_direction ?? c.offre?.direction?.nom ?? 'Générale'}</span>
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
                                                                    <Eye size={15} />
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
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* MODE SPONTANÉES : SIMPLE LISTE UNIQUE */
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
                </div>
            )}

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
