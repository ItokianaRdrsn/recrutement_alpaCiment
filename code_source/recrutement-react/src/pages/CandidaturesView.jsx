import React, { useCallback, useEffect, useState } from 'react';
import {
    BriefcaseBusiness,
    Building2,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    ListChecks,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
} from 'lucide-react';
import { getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { SaisirRhCandidatureModal } from '../components/modals/SaisirRhCandidatureModal';
import { formatDate } from '../utils/formatters';
import { CandidatureDetailView } from './CandidatureDetailView';

export function CandidaturesView({ referentiels }) {
    const [candidatures, setCandidatures] = useState([]);
    const [statutsList, setStatutsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCandidatureId, setSelectedCandidatureId] = useState(null);
    const [showSaisirModal, setShowSaisirModal] = useState(false);
    const [viewMode, setViewMode] = useState('toutes'); // 'toutes', 'par_offre', 'spontanees'
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [paginationMeta, setPaginationMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 });
    const [filters, setFilters] = useState({
        q: '',
        statut: '',
        direction: '',
        type_demande: '',
        canal_depot: '',
        date_debut: '',
        date_fin: '',
    });

    const handleOpenDossier = useCallback(async (id) => {
        setSelectedCandidatureId(id);
        setCandidatures((prev) =>
            prev.map((item) => (item.id_candidature === id ? { ...item, vue: true } : item))
        );
        try {
            await sendJson(`/api/candidatures/${id}/marquer-vue`, { method: 'PATCH' });
        } catch (err) {
            // silent
        }
    }, []);

    const resetFilters = () => {
        setFilters({
            q: '',
            statut: '',
            direction: '',
            type_demande: '',
            canal_depot: '',
            date_debut: '',
            date_fin: '',
        });
    };

    const loadCandidatures = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('per_page', String(perPage));
            if (filters.q) params.set('q', filters.q);
            if (filters.statut) params.set('statut', filters.statut);
            if (filters.direction) params.set('direction', filters.direction);
            if (filters.type_demande) params.set('type_demande', filters.type_demande);
            if (filters.canal_depot) params.set('canal_depot', filters.canal_depot);
            if (filters.date_debut) params.set('date_debut', filters.date_debut);
            if (filters.date_fin) params.set('date_fin', filters.date_fin);

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
        loadCandidatures();
    }, [loadCandidatures]);

    if (selectedCandidatureId) {
        return (
            <CandidatureDetailView
                idCandidature={selectedCandidatureId}
                onBack={() => setSelectedCandidatureId(null)}
                onRefreshList={loadCandidatures}
                statutsList={statutsList}
            />
        );
    }

    // Grouping for Direction -> Offre -> Candidats
    const candidaturesSurOffre = candidatures.filter((c) => c.type_candidature === 'offre' || c.offre);
    const candidaturesSpontanees = candidatures.filter((c) => c.type_candidature === 'spontanee' || !c.offre);

    // Tree mapping for Direction -> Offre
    const treeByOffre = {};
    candidaturesSurOffre.forEach((c) => {
        const dirName = c.offre?.direction?.nom_direction ?? 'Direction Générale';
        const offreTitle = c.offre?.titre_poste ?? 'Offre sans titre';
        if (!treeByOffre[dirName]) treeByOffre[dirName] = {};
        if (!treeByOffre[dirName][offreTitle]) treeByOffre[dirName][offreTitle] = [];
        treeByOffre[dirName][offreTitle].push(c);
    });

    // Tree mapping for Direction -> Domaine
    const treeByDomaine = {};
    candidaturesSpontanees.forEach((c) => {
        const isValide = c.domaine && (c.domaine.valide === true);
        const dirName = isValide && c.domaine?.direction?.nom_direction ? c.domaine.direction.nom_direction : 'Non spécifiée';
        const domaineName = isValide && c.domaine?.nom_domaine ? c.domaine.nom_domaine : 'Non spécifiée';
        if (!treeByDomaine[dirName]) treeByDomaine[dirName] = {};
        if (!treeByDomaine[dirName][domaineName]) treeByDomaine[dirName][domaineName] = [];
        treeByDomaine[dirName][domaineName].push(c);
    });

    return (
        <div className="view-stack">
            {/* SUB-NAVIGATION TABS FOR SPRINT 4 */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                <button
                    className={`ghost-button ${viewMode === 'toutes' ? 'primary' : ''}`}
                    onClick={() => setViewMode('toutes')}
                    style={{
                        fontWeight: viewMode === 'toutes' ? 'bold' : 'normal',
                        borderBottom: viewMode === 'toutes' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <ListChecks size={17} />
                    <span>Toutes les candidatures ({candidatures.length})</span>
                </button>
                <button
                    className={`ghost-button ${viewMode === 'par_offre' ? 'primary' : ''}`}
                    onClick={() => setViewMode('par_offre')}
                    style={{
                        fontWeight: viewMode === 'par_offre' ? 'bold' : 'normal',
                        borderBottom: viewMode === 'par_offre' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <BriefcaseBusiness size={17} />
                    <span>Direction → Offre → Candidats ({candidaturesSurOffre.length})</span>
                </button>
                <button
                    className={`ghost-button ${viewMode === 'spontanees' ? 'primary' : ''}`}
                    onClick={() => setViewMode('spontanees')}
                    style={{
                        fontWeight: viewMode === 'spontanees' ? 'bold' : 'normal',
                        borderBottom: viewMode === 'spontanees' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <Building2 size={17} />
                    <span>Direction → Domaine → Candidatures ({candidaturesSpontanees.length})</span>
                </button>
            </div>

            {/* FULL FILTERS BAR (Statut, Direction, Période, Type, Canal, Mot-clé) */}
            <section className="filter-bar" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                <label className="search-field" style={{ minWidth: '220px' }}>
                    <Search size={18} />
                    <input
                        onChange={(e) => setFilters((curr) => ({ ...curr, q: e.target.value }))}
                        placeholder="Candidat (nom, email, tel)..."
                        type="search"
                        value={filters.q}
                    />
                </label>

                <label>
                    <span>Statut</span>
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

                <label>
                    <span>Direction</span>
                    <select
                        onChange={(e) => setFilters((curr) => ({ ...curr, direction: e.target.value }))}
                        value={filters.direction}
                    >
                        <option value="">Toutes les directions</option>
                        {referentiels.directions?.map((dir) => (
                            <option key={dir.id_direction} value={dir.id_direction}>
                                {dir.nom_direction}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Type de demande</span>
                    <select
                        onChange={(e) => setFilters((curr) => ({ ...curr, type_demande: e.target.value }))}
                        value={filters.type_demande}
                    >
                        <option value="">Tous les types</option>
                        <option value="offre">Sur offre</option>
                        <option value="spontanee">Spontanée</option>
                    </select>
                </label>

                <label>
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

                <label>
                    <span>Date début</span>
                    <input
                        onChange={(e) => setFilters((curr) => ({ ...curr, date_debut: e.target.value }))}
                        type="date"
                        value={filters.date_debut}
                    />
                </label>

                <label>
                    <span>Date fin</span>
                    <input
                        onChange={(e) => setFilters((curr) => ({ ...curr, date_fin: e.target.value }))}
                        type="date"
                        value={filters.date_fin}
                    />
                </label>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="filter-button" onClick={loadCandidatures} type="button">
                        <Filter size={17} />
                        <span>Filtrer</span>
                    </button>
                    <button className="ghost-button" onClick={resetFilters} title="Réinitialiser tous les filtres" type="button">
                        <RotateCcw size={16} />
                        <span>Réinitialiser</span>
                    </button>
                </div>
            </section>

            <section className="data-section">
                <div className="section-heading">
                    <div>
                        <h2>
                            {viewMode === 'toutes'
                                ? 'Liste générale des candidatures'
                                : viewMode === 'par_offre'
                                ? 'Arborescence des candidatures par Offre'
                                : 'Arborescence des candidatures Spontanées par Domaine'}
                        </h2>
                        <p>Gestion RH des dossiers de candidatures avec suivi du workflow de statut et pièces jointes.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => setShowSaisirModal(true)}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '9px 18px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                                cursor: 'pointer',
                            }}
                            type="button"
                        >
                            <Plus size={18} />
                            <span>+ Candidature RH</span>
                        </button>

                        <button className="ghost-button" onClick={loadCandidatures} type="button">
                            <RefreshCw aria-hidden="true" size={17} />
                            <span>Actualiser</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState message={error} onRetry={loadCandidatures} />
                ) : !candidatures.length ? (
                    <div className="empty-state">Aucune candidature trouvée avec les filtres sélectionnés.</div>
                ) : viewMode === 'toutes' ? (
                    /* MODE 1: LISTE GÉNÉRALE AVEC PAGINATION */
                    <>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Candidat</th>
                                        <th>Poste / Domaine & Direction</th>
                                        <th>Type de Demande</th>
                                        <th>Canal de Dépôt</th>
                                        <th>Date</th>
                                        <th>Documents</th>
                                        <th>Statut RH</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidatures.map((c) => (
                                        <tr
                                            key={c.id_candidature}
                                            style={{
                                                borderLeft: !c.vue ? '4px solid #3b82f6' : '4px solid transparent',
                                                background: !c.vue ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                                                transition: 'all 0.2s ease',
                                            }}
                                            title={!c.vue ? 'Candidature non encore consultée' : undefined}
                                        >
                                            <td>
                                                <strong>{c.candidat?.prenom} {c.candidat?.nom}</strong>
                                                <br />
                                                <small>{c.candidat?.email}</small>
                                            </td>
                                            <td>
                                                {c.offre ? (
                                                    <strong style={{ color: 'var(--primary)' }}>Offre: {c.offre.titre_poste}</strong>
                                                ) : c.domaine && (c.domaine.valide === true || c.domaine.valide === 1) ? (
                                                    <span className="badge blue">Domaine: {c.domaine.nom_domaine}</span>
                                                ) : (
                                                    <span className="badge amber">
                                                        {c.poste_souhaite ? `Poste: ${c.poste_souhaite}` : 'Non spécifié'}
                                                    </span>
                                                )}
                                                <br />
                                                <small style={{ color: 'var(--text-muted)' }}>
                                                    Direction: {c.offre?.direction?.nom_direction ?? (c.domaine && (c.domaine.valide === true || c.domaine.valide === 1) ? c.domaine?.direction?.nom_direction : 'Non spécifiée')}
                                                </small>
                                            </td>
                                            <td>
                                                <span className={`badge ${c.id_type_demande === 2 || c.type_demande?.libelle === 'Spontanee' || !c.id_offre ? 'amber' : 'blue'}`}>
                                                    {c.id_type_demande === 2 || c.type_demande?.libelle === 'Spontanee' || !c.id_offre ? 'Spontanée' : 'Sur offre'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${c.canal_depot === 'rh_manuel' ? 'purple' : 'gray'}`}>
                                                    {c.canal_depot === 'rh_manuel' ? 'Saisie RH' : 'Portail Web'}
                                                </span>
                                            </td>
                                            <td>{formatDate(c.created_at)}</td>
                                            <td>
                                                <span className="badge">{c.documents?.length ?? 0} fichier(s)</span>
                                            </td>
                                            <td>
                                                <span className="status-pill success">{c.statut?.libelle ?? 'Reçue'}</span>
                                            </td>
                                            <td>
                                                <button
                                                    className="filter-button"
                                                    onClick={() => handleOpenDossier(c.id_candidature)}
                                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                                    type="button"
                                                >
                                                    <Eye size={15} />
                                                    <span>Voir dossier</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* BARRE DE PAGINATION INTERACTIVE */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', padding: '12px 16px', background: '#fff', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                    Affichage de {paginationMeta.from ?? 1} à {paginationMeta.to ?? candidatures.length} sur {paginationMeta.total ?? candidatures.length} candidature(s)
                                </span>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                    <span>Par page :</span>
                                    <select
                                        onChange={(e) => {
                                            setPerPage(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                                        value={perPage}
                                    >
                                        <option value={15}>15</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                    className="ghost-button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                    type="button"
                                >
                                    <ChevronLeft size={16} />
                                    <span>Précédent</span>
                                </button>
                                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                    Page {paginationMeta.current_page} / {paginationMeta.last_page}
                                </span>
                                <button
                                    className="ghost-button"
                                    disabled={page >= paginationMeta.last_page}
                                    onClick={() => setPage((p) => p + 1)}
                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                    type="button"
                                >
                                    <span>Suivant</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : viewMode === 'par_offre' ? (
                    /* MODE 2: ARBORESCENCE DIRECTION -> OFFRE -> CANDIDATS */
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {Object.entries(treeByOffre).map(([dirName, offresMap]) => (
                            <div key={dirName} className="data-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <h3 style={{ margin: '0 0 12px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Building2 size={18} />
                                    <span>Direction : {dirName}</span>
                                </h3>
                                <div style={{ display: 'grid', gap: '16px', paddingLeft: '12px' }}>
                                    {Object.entries(offresMap).map(([offreTitle, items]) => (
                                        <div key={offreTitle} style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <strong style={{ fontSize: '15px' }}>Offre : {offreTitle}</strong>
                                                <span className="status-pill success">{items.length} candidat(s)</span>
                                            </div>
                                            <div className="table-wrap">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Candidat</th>
                                                            <th>Email & Tel</th>
                                                            <th>Date de dépôt</th>
                                                            <th>Statut RH</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map((item) => (
                                                            <tr
                                                                key={item.id_candidature}
                                                                style={{
                                                                    borderLeft: !item.vue ? '4px solid #3b82f6' : '4px solid transparent',
                                                                    background: !item.vue ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                                                                    transition: 'all 0.2s ease',
                                                                }}
                                                                title={!item.vue ? 'Candidature non encore consultée' : undefined}
                                                            >
                                                                <td><strong>{item.candidat?.prenom} {item.candidat?.nom}</strong></td>
                                                                <td>{item.candidat?.email} ({item.candidat?.telephone ?? '-'})</td>
                                                                <td>{formatDate(item.created_at)}</td>
                                                                <td><span className="status-pill success">{item.statut?.libelle ?? 'Reçue'}</span></td>
                                                                <td>
                                                                    <button
                                                                        className="filter-button"
                                                                        onClick={() => handleOpenDossier(item.id_candidature)}
                                                                        style={{ padding: '4px 10px', fontSize: '12px' }}
                                                                        type="button"
                                                                    >
                                                                        <Eye size={13} />
                                                                        <span>Consulter</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* MODE 3: ARBORESCENCE DIRECTION -> DOMAINE -> CANDIDATURES SPONTANÉES */
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {Object.entries(treeByDomaine).map(([dirName, domainesMap]) => (
                            <div key={dirName} className="data-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <h3 style={{ margin: '0 0 12px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Building2 size={18} />
                                    <span>Direction : {dirName}</span>
                                </h3>
                                <div style={{ display: 'grid', gap: '16px', paddingLeft: '12px' }}>
                                    {Object.entries(domainesMap).map(([domaineName, items]) => (
                                        <div key={domaineName} style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <strong style={{ fontSize: '15px' }}>Domaine / Poste souhaité : {domaineName}</strong>
                                                <span className="status-pill warning">{items.length} candidature(s) spontanée(s)</span>
                                            </div>
                                            <div className="table-wrap">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Candidat</th>
                                                            <th>Coordonnées</th>
                                                            <th>Date</th>
                                                            <th>Statut RH</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map((item) => (
                                                            <tr
                                                                key={item.id_candidature}
                                                                style={{
                                                                    borderLeft: !item.vue ? '4px solid #3b82f6' : '4px solid transparent',
                                                                    background: !item.vue ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                                                                    transition: 'all 0.2s ease',
                                                                }}
                                                                title={!item.vue ? 'Candidature non encore consultée' : undefined}
                                                            >
                                                                <td><strong>{item.candidat?.prenom} {item.candidat?.nom}</strong></td>
                                                                <td>{item.candidat?.email} ({item.candidat?.telephone ?? '-'})</td>
                                                                <td>{formatDate(item.created_at)}</td>
                                                                <td><span className="status-pill success">{item.statut?.libelle ?? 'Reçue'}</span></td>
                                                                <td>
                                                                    <button
                                                                        className="filter-button"
                                                                        onClick={() => handleOpenDossier(item.id_candidature)}
                                                                        style={{ padding: '4px 10px', fontSize: '12px' }}
                                                                        type="button"
                                                                    >
                                                                        <Eye size={13} />
                                                                        <span>Consulter</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {showSaisirModal ? (
                <SaisirRhCandidatureModal
                    onClose={() => setShowSaisirModal(false)}
                    onSuccess={loadCandidatures}
                    referentiels={referentiels}
                />
            ) : null}
        </div>
    );
}
