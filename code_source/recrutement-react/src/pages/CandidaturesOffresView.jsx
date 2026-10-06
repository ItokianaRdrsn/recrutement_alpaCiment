import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    BookmarkCheck,
    BriefcaseBusiness,
    Building2,
    ChevronDown,
    ChevronRight,
    Eye,
    Filter,
    ListChecks,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    UserPlus,
    Users,
} from 'lucide-react';
import { getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { Pagination } from '../components/common/Pagination';
import { SaisirRhCandidatureModal } from '../components/modals/SaisirRhCandidatureModal';
import { formatDate } from '../utils/formatters';
import { CandidatureDetailView } from './CandidatureDetailView';

// Helpers universels pour extraire les identifiants sans risquer les discordances de nommage (id_direction vs id, id_offre vs id)
const getDirId = (d) => Number(d?.id_direction ?? d?.id ?? 0);
const getOffreDirId = (o) => Number(o?.id_direction ?? o?.direction?.id_direction ?? o?.direction?.id ?? 0);
const getOffreId = (o) => Number(o?.id_offre ?? o?.id ?? 0);
const getCandOffreId = (c) => Number(c?.id_offre ?? c?.offre?.id_offre ?? c?.offre?.id ?? 0);
const getCandDirId = (c) => Number(c?.offre?.id_direction ?? c?.offre?.direction?.id_direction ?? c?.offre?.direction?.id ?? c?.direction?.id_direction ?? c?.direction?.id ?? c?.id_direction ?? 0);

export function CandidaturesOffresView({ referentiels }) {
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
    const [expandedDirs, setExpandedDirs] = useState({});
    const [searchOffreQuery, setSearchOffreQuery] = useState('');
    const [expandedOffresInRightCol, setExpandedOffresInRightCol] = useState({});

    const [searchParams] = useSearchParams();
    const urlOffreId = searchParams.get('offre') || searchParams.get('id_offre');
    const [appliedUrlOffreId, setAppliedUrlOffreId] = useState(null);

    // Candidatures en vivier par direction (liées par domaine)
    const [vivierDataByDir, setVivierDataByDir] = useState({});
    const [vivierCountsByDir, setVivierCountsByDir] = useState({});
    const [loadingVivierByDir, setLoadingVivierByDir] = useState({});
    const [offerSubTab, setOfferSubTab] = useState({}); // { [offreId]: 'candidatures' | 'vivier' }

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
        setPage(1);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('per_page', String(perPage));
            params.set('type_demande', 'offre');

            if (filters.q) params.set('q', filters.q);
            if (filters.statut) params.set('statut', filters.statut);
            if (filters.canal_depot) params.set('canal_depot', filters.canal_depot);

            if (selectedDirectionId) {
                params.set('direction', String(selectedDirectionId));
            } else if (filters.direction) {
                params.set('direction', filters.direction);
            }

            const allCandsParams = new URLSearchParams();
            allCandsParams.set('type_demande', 'offre');
            allCandsParams.set('per_page', '500');
            if (filters.q) allCandsParams.set('q', filters.q);
            if (filters.statut) allCandsParams.set('statut', filters.statut);
            if (filters.canal_depot) allCandsParams.set('canal_depot', filters.canal_depot);

            const [candResponse, statutsResponse, offresResponse, allCandsResponse] = await Promise.all([
                getJson(`/api/candidatures?${params.toString()}`),
                getJson('/api/referentiels/statuts-candidature'),
                getJson('/api/offres?per_page=150'),
                getJson(`/api/candidatures?${allCandsParams.toString()}`),
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
    }, [filters, page, perPage, selectedDirectionId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!urlOffreId || !offresList.length) return;
        if (appliedUrlOffreId === urlOffreId) return;

        const targetOffreId = Number(urlOffreId);
        const targetOffre = offresList.find((o) => getOffreId(o) === targetOffreId);
        if (targetOffre) {
            setAppliedUrlOffreId(urlOffreId);
            const dirId = getOffreDirId(targetOffre);
            if (dirId) {
                setSelectedDirectionId(dirId);
                setExpandedDirs((prev) => ({ ...prev, [dirId]: true }));
            }
            setDirectionSubMode('offres_candidatures');
            setExpandedOffresInRightCol((prev) => ({ ...prev, [targetOffreId]: true }));
        }
    }, [urlOffreId, offresList, appliedUrlOffreId]);

    const loadVivierForDirection = useCallback(async (dirId) => {
        if (!dirId) return [];
        setLoadingVivierByDir((prev) => ({ ...prev, [dirId]: true }));
        try {
            const res = await getJson(`/api/vivier?direction=${dirId}&domaine_direction_only=1`);
            const items = res?.data ?? [];
            setVivierDataByDir((prev) => ({ ...prev, [dirId]: items }));
            setVivierCountsByDir((prev) => ({ ...prev, [dirId]: items.length }));
            return items;
        } catch (err) {
            console.error('Erreur chargement vivier direction:', err);
            return [];
        } finally {
            setLoadingVivierByDir((prev) => ({ ...prev, [dirId]: false }));
        }
    }, []);

    useEffect(() => {
        if (selectedDirectionId) {
            loadVivierForDirection(selectedDirectionId);
        }
    }, [selectedDirectionId, loadVivierForDirection]);

    const toggleOffreDropdownInRightCol = (offreId, dirId) => {
        setExpandedOffresInRightCol((prev) => {
            const willBeExpanded = !prev[offreId];
            if (willBeExpanded && dirId && vivierCountsByDir[dirId] === undefined) {
                loadVivierForDirection(dirId);
            }
            return {
                ...prev,
                [offreId]: willBeExpanded,
            };
        });
    };

    const handleToggleVivierForOffre = (offreId, dirId) => {
        if (dirId) {
            loadVivierForDirection(dirId);
        }
        setOfferSubTab((prev) => {
            const currentTab = prev[offreId] || 'candidatures';
            return {
                ...prev,
                [offreId]: currentTab === 'vivier' ? 'candidatures' : 'vivier',
            };
        });
    };

    const handleSelectDirectionWithSubMode = (dirId, subMode) => {
        setSelectedDirectionId(dirId);
        setDirectionSubMode(subMode);
        setPage(1);
    };

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

    if (selectedCandidatureId) {
        return (
            <CandidatureDetailView
                idCandidature={selectedCandidatureId}
                onBack={() => setSelectedCandidatureId(null)}
                onRefreshList={loadData}
                referentiels={referentiels}
                statutsList={statutsList}
            />
        );
    }

    return (
        <div className="view-stack">
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

            {/* CONTENU PRINCIPAL : DISPOSITION 2 COLONNES AVEC SCROLLS INDÉPENDANTS */}
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
                {/* COLONNE 1 (GAUCHE) : DIRECTIONS AVEC ACCORDÉON / DÉROULANT FLÈCHE ET SCROLL INDÉPENDANT STICKY */}
                <div
                    className="data-section"
                    style={{
                        background: '#ffffff',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        position: 'sticky',
                        top: '16px',
                        maxHeight: 'calc(100vh / 0.8 - 120px)',
                        overflowY: 'auto',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={18} />
                            <span>Directions & Pôles</span>
                        </h3>
                       
                    </div>

                    <button
                        onClick={() => {
                            setSelectedDirectionId(null);
                            setDirectionSubMode('toutes_candidatures');
                            setPage(1);
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
                            const isExpanded = expandedDirs[currentDirId] ?? isDirSelected;
                            const isToutesActive = isDirSelected && directionSubMode === 'toutes_candidatures';
                            const isOffresActive = isDirSelected && directionSubMode === 'offres_candidatures';

                            const toggleDirCollapse = (e) => {
                                e.stopPropagation();
                                setExpandedDirs((prev) => ({
                                    ...prev,
                                    [currentDirId]: !isExpanded,
                                }));
                            };

                            const handleSelectDirHeader = () => {
                                handleSelectDirectionWithSubMode(currentDirId, 'toutes_candidatures');
                                setExpandedDirs((prev) => ({
                                    ...prev,
                                    [currentDirId]: true,
                                }));
                            };

                            return (
                                <div
                                    key={currentDirId}
                                    style={{
                                        border: isDirSelected ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                                        borderRadius: '9px',
                                        background: isDirSelected ? '#eff6ff' : '#ffffff',
                                        padding: '10px 12px',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <div
                                        onClick={handleSelectDirHeader}
                                        style={{
                                            display: 'flex',
                                            justify: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            padding: '4px 0',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <button
                                                onClick={toggleDirCollapse}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: '2px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: isDirSelected ? '#1d4ed8' : '#64748b',
                                                }}
                                                title={isExpanded ? 'Réduire' : 'Déplier'}
                                                type="button"
                                            >
                                                {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                                            </button>
                                            <strong style={{ fontSize: '13.5px', color: isDirSelected ? '#1d4ed8' : '#0f172a' }}>
                                                {dir.nom_direction ?? dir.nom}
                                            </strong>
                                        </div>
                                        <span className="badge blue" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                            {dirCandCount} cand.
                                        </span>
                                    </div>

                                    {/* SOUS-BOUTONS ACCESSIBLES UNIVERSELLEMENT LORSQUE DÉPLIÉ VIA LA FLÈCHE OU LE CLIC */}
                                    {isExpanded && (
                                        <div style={{ display: 'grid', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
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
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* COLONNE 2 (DROITE) */}
                <div className="data-section" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    {directionSubMode === 'offres_candidatures' ? (
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
                                <LoadingState
                                    message="Chargement des offres..."
                                    subtitle="Préparation des dossiers par offre"
                                />
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

                                        const offreCands = allCandidaturesSurOffre.filter((c) => {
                                            if (getCandOffreId(c) !== currentOffreId) return false;

                                            if (filters.q) {
                                                const query = filters.q.toLowerCase().trim();
                                                const prenom = (c.candidat?.prenom ?? '').toLowerCase();
                                                const nom = (c.candidat?.nom ?? '').toLowerCase();
                                                const email = (c.candidat?.email ?? '').toLowerCase();
                                                const full = `${prenom} ${nom}`;
                                                if (!prenom.includes(query) && !nom.includes(query) && !email.includes(query) && !full.includes(query)) {
                                                    return false;
                                                }
                                            }
                                            if (filters.statut) {
                                                const candStatutId = String(c.id_statut_candidature ?? c.statut?.id_statut_candidature ?? c.statut?.id ?? '');
                                                if (candStatutId !== String(filters.statut)) {
                                                    return false;
                                                }
                                            }
                                            if (filters.canal_depot) {
                                                if (c.canal_depot !== filters.canal_depot) {
                                                    return false;
                                                }
                                            }
                                            return true;
                                        });
                                        const offreCandCount = offreCands.length;
                                        const currentDirId = getOffreDirId(o) || selectedDirectionId;
                                        const currentTab = offerSubTab[currentOffreId] || 'candidatures';
                                        const dirVivierCount = vivierCountsByDir[currentDirId] ?? 0;

                                        const filteredVivierCands = (vivierDataByDir[currentDirId] ?? []).filter((v) => {
                                            if (filters.q) {
                                                const query = filters.q.toLowerCase().trim();
                                                const prenom = (v.candidat?.prenom ?? '').toLowerCase();
                                                const nom = (v.candidat?.nom ?? '').toLowerCase();
                                                const email = (v.candidat?.email ?? '').toLowerCase();
                                                const full = `${prenom} ${nom}`;
                                                if (!prenom.includes(query) && !nom.includes(query) && !email.includes(query) && !full.includes(query)) {
                                                    return false;
                                                }
                                            }
                                            return true;
                                        });

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

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {isExpanded ? (
                                                            <button
                                                                onClick={() => handleToggleVivierForOffre(currentOffreId, currentDirId)}
                                                                style={{
                                                                    padding: '8px 14px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '12.5px',
                                                                    fontWeight: '600',
                                                                    background: currentTab === 'vivier' ? '#059669' : '#ecfdf5',
                                                                    color: currentTab === 'vivier' ? '#ffffff' : '#047857',
                                                                    border: currentTab === 'vivier' ? '1.5px solid #059669' : '1.5px solid #a7f3d0',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)',
                                                                    transition: 'all 0.15s ease',
                                                                }}
                                                                title={`Consulter les candidatures en vivier rattachées aux domaines de cette direction`}
                                                                type="button"
                                                            >
                                                                <BookmarkCheck size={15} />
                                                                <span>Vivier ({dirVivierCount})</span>
                                                            </button>
                                                        ) : null}

                                                        <button
                                                            onClick={() => toggleOffreDropdownInRightCol(currentOffreId, currentDirId)}
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
                                                </div>

                                                {isExpanded ? (
                                                    <div style={{ padding: '14px 16px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                                                        {/* ONGLET DE NAVIGATION : CANDIDATURES SUR LE POSTE VS VIVIER DE LA DIRECTION */}
                                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', flexWrap: 'wrap' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setOfferSubTab((prev) => ({ ...prev, [currentOffreId]: 'candidatures' }))}
                                                                style={{
                                                                    padding: '6px 14px',
                                                                    borderRadius: '7px',
                                                                    fontSize: '12.5px',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    border: currentTab === 'candidatures' ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                                                                    background: currentTab === 'candidatures' ? '#eff6ff' : '#f8fafc',
                                                                    color: currentTab === 'candidatures' ? '#1d4ed8' : '#64748b',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    transition: 'all 0.15s ease',
                                                                }}
                                                            >
                                                                <Users size={14} />
                                                                <span>Candidatures sur l'offre ({offreCandCount})</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOfferSubTab((prev) => ({ ...prev, [currentOffreId]: 'vivier' }));
                                                                    if (currentDirId) loadVivierForDirection(currentDirId);
                                                                }}
                                                                style={{
                                                                    padding: '6px 14px',
                                                                    borderRadius: '7px',
                                                                    fontSize: '12.5px',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    border: currentTab === 'vivier' ? '1.5px solid #059669' : '1px solid #e2e8f0',
                                                                    background: currentTab === 'vivier' ? '#ecfdf5' : '#f8fafc',
                                                                    color: currentTab === 'vivier' ? '#047857' : '#64748b',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    transition: 'all 0.15s ease',
                                                                }}
                                                            >
                                                                <BookmarkCheck size={14} />
                                                                <span>Candidatures en vivier (Direction) ({dirVivierCount})</span>
                                                            </button>
                                                        </div>

                                                        {currentTab === 'vivier' ? (
                                                            <div>
                                                                <div
                                                                    style={{
                                                                        padding: '10px 14px',
                                                                        background: '#f0fdf4',
                                                                        border: '1px solid #bbf7d0',
                                                                        borderRadius: '8px',
                                                                        marginBottom: '12px',
                                                                        fontSize: '13px',
                                                                        color: '#166534',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        gap: '8px',
                                                                        flexWrap: 'wrap',
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <BookmarkCheck size={16} />
                                                                        <span>
                                                                            Candidatures en <strong>vivier RH</strong> dont le <strong>domaine</strong> est rattaché à la direction <strong>{o.direction?.nom ?? o.direction?.nom_direction ?? 'associée'}</strong>.
                                                                        </span>
                                                                    </div>
                                                                    <span className="badge green" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                                        {filteredVivierCands.length} profil(s) éligible(s)
                                                                    </span>
                                                                </div>

                                                                {loadingVivierByDir[currentDirId] ? (
                                                                    <LoadingState
                                                                        message="Chargement des candidatures en vivier..."
                                                                        subtitle="Filtrage des talents par domaine rattaché à cette direction"
                                                                    />
                                                                ) : !filteredVivierCands.length ? (
                                                                    <div className="empty-state" style={{ padding: '24px' }}>
                                                                        Aucune candidature en vivier n'a été trouvée pour les domaines rattachés à cette direction.
                                                                    </div>
                                                                ) : (
                                                                    <div className="table-wrap">
                                                                        <table>
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>Candidat</th>
                                                                                    <th>Contact</th>
                                                                                    <th>Domaine Rattaché</th>
                                                                                    <th>Poste souhaité / Contexte</th>
                                                                                    <th>Date Vivier</th>
                                                                                    <th>Statut</th>
                                                                                    <th style={{ textAlign: 'right' }}>Action</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {filteredVivierCands.map((v) => {
                                                                                    const isUnread = !v.vue;
                                                                                    const candId = v.id_candidature;

                                                                                    return (
                                                                                        <tr
                                                                                            key={v.id_vivier_candidat ?? `cand_${candId}`}
                                                                                            onClick={() => candId && handleOpenDossier(candId)}
                                                                                            style={{
                                                                                                cursor: candId ? 'pointer' : 'default',
                                                                                                background: isUnread && candId ? '#f0fdf4' : '#ffffff',
                                                                                                transition: 'background 0.15s ease',
                                                                                            }}
                                                                                            title={candId ? 'Cliquer pour consulter le dossier complet du candidat' : undefined}
                                                                                        >
                                                                                            <td>
                                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                                    {isUnread && candId ? (
                                                                                                        <span title="Dossier non encore consulté" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
                                                                                                    ) : null}
                                                                                                    <strong style={{ color: '#0f172a' }}>
                                                                                                        {v.candidat?.prenom} {v.candidat?.nom}
                                                                                                    </strong>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td>
                                                                                                <span>{v.candidat?.email ?? '-'}</span>
                                                                                                {v.candidat?.telephone ? (
                                                                                                    <small style={{ display: 'block', color: '#64748b' }}>
                                                                                                        {v.candidat.telephone}
                                                                                                    </small>
                                                                                                ) : null}
                                                                                            </td>
                                                                                            <td>
                                                                                                <span className="badge green" style={{ fontSize: '11px', fontWeight: '600' }}>
                                                                                                    {v.domaine?.nom_domaine ?? 'Domaine relié'}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td>
                                                                                                <span style={{ fontSize: '12.5px', color: '#334155' }}>
                                                                                                    {v.poste_souhaite || v.motif_ajout || 'Candidature spontanée'}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td>{formatDate(v.created_at)}</td>
                                                                                            <td>
                                                                                                <span className="status-pill success">{v.statut ?? 'Actif'}</span>
                                                                                            </td>
                                                                                            <td style={{ textAlign: 'right' }}>
                                                                                                {candId ? (
                                                                                                    <button
                                                                                                        className="filter-button"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            handleOpenDossier(candId);
                                                                                                        }}
                                                                                                        style={{ padding: '5px 12px', fontSize: '12px', gap: '5px' }}
                                                                                                        type="button"
                                                                                                    >
                                                                                                        <Eye size={13} />
                                                                                                        <span>Consulter dossier</span>
                                                                                                    </button>
                                                                                                ) : null}
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            /* CANDIDATURES DIRECTES SUR L'OFFRE */
                                                            !offreCands.length ? (
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
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {offreCands.map((c) => {
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
                                                                                        title="Cliquer pour consulter le dossier de ce candidat"
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
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )
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
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                                    {selectedDirectionId
                                        ? `Candidatures sur offre - ${activeDirectionName}`
                                        : `Toutes les candidatures sur offre (Toutes directions)`}
                                    <span className="badge blue" style={{ marginLeft: '10px' }}>{paginationMeta.total} dossiers</span>
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
                                <LoadingState
                                    message="Chargement des candidatures sur offre..."
                                    subtitle="Extraction des dossiers par direction et statut"
                                />
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
                                                        title="Cliquer pour consulter le dossier de ce candidat"
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
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                     </table>
                                </div>
                            )}

                            <Pagination meta={paginationMeta} onChangePage={(p) => setPage(p)} perPage={perPage} />
                        </div>
                    )}
                </div>
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
