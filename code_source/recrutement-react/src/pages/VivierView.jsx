import React, { useCallback, useEffect, useState } from 'react';
import {
    BookmarkCheck,
    BriefcaseBusiness,
    Check,
    CheckCircle2,
    Filter,
    GraduationCap,
    Layers,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Sparkles,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { formatDate } from '../utils/formatters';

export function VivierView({ competencesData, referentiels }) {
    const [vivierList, setVivierList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCandidat, setSelectedCandidat] = useState(null);
    const [profileData, setProfileData] = useState(null);

    // Modal state for searching & adding candidature to Vivier
    const [showAddModal, setShowAddModal] = useState(false);
    const [candSearchQuery, setCandSearchQuery] = useState('');
    const [candSearchResults, setCandSearchResults] = useState([]);
    const [searchingCands, setSearchingCands] = useState(false);
    const [addingCandId, setAddingCandId] = useState(null);

    const [filters, setFilters] = useState({ q: '', direction: '', domaine: '', statut: '' });

    const [newComp, setNewComp] = useState({ id_competence: '', niveau: 'Intermédiaire' });
    const [newExp, setNewExp] = useState({ intitule_poste: '', entreprise: '', date_debut: '', date_fin: '', description: '' });
    const [newForm, setNewForm] = useState({ diplome: '', etablissement: '', annee_obtention: '', domaine_etude: '' });

    const loadVivier = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (filters.q) params.set('q', filters.q);
            if (filters.direction) params.set('direction', filters.direction);
            if (filters.domaine) params.set('domaine', filters.domaine);
            if (filters.statut) params.set('statut', filters.statut);

            const vivRes = await getJson(`/api/vivier?${params.toString()}`);
            setVivierList(vivRes?.data ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadVivier();
    }, [loadVivier]);

    // Live search candidatures for Add Modal
    const searchCandidaturesModal = useCallback(async (query = '') => {
        setSearchingCands(true);
        try {
            const params = new URLSearchParams({ per_page: '30' });
            if (query.trim()) params.set('q', query.trim());
            const res = await getJson(`/api/candidatures?${params.toString()}`);
            setCandSearchResults(res?.data ?? []);
        } catch (err) {
            console.error('Erreur recherche candidatures modal:', err);
        } finally {
            setSearchingCands(false);
        }
    }, []);

    useEffect(() => {
        if (showAddModal) {
            searchCandidaturesModal(candSearchQuery);
        }
    }, [showAddModal, candSearchQuery, searchCandidaturesModal]);

    const loadCandidateProfile = useCallback(async (idCandidat) => {
        try {
            const res = await getJson(`/api/vivier/candidat/${idCandidat}/profile`);
            setProfileData(res?.data ?? null);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    async function handleAddCandidatureToVivier(idCandidature) {
        setAddingCandId(idCandidature);
        try {
            await sendJson(`/api/candidatures/${idCandidature}/vivier`, {
                method: 'PATCH',
                body: { dans_vivier: true },
            });
            await loadVivier();
            await searchCandidaturesModal(candSearchQuery);
        } catch (err) {
            setError(err.message);
        } finally {
            setAddingCandId(null);
        }
    }

    async function handleRemoveFromVivier(item) {
        if (!window.confirm('Retirer cette candidature/candidat du vivier ?')) return;
        try {
            if (item.id_candidature) {
                await sendJson(`/api/candidatures/${item.id_candidature}/vivier`, {
                    method: 'PATCH',
                    body: { dans_vivier: false },
                });
            } else if (item.id_vivier_candidat && !String(item.id_vivier_candidat).startsWith('cand_')) {
                await sendJson(`/api/vivier/${item.id_vivier_candidat}`, { method: 'DELETE' });
            }
            await loadVivier();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAddCompetence(e) {
        e.preventDefault();
        if (!selectedCandidat || !newComp.id_competence) return;
        try {
            await sendJson(`/api/vivier/candidat/${selectedCandidat.id_candidat}/competences`, {
                body: {
                    id_competence: Number(newComp.id_competence),
                    niveau: newComp.niveau,
                },
            });
            setNewComp({ id_competence: '', niveau: 'Intermédiaire' });
            await loadCandidateProfile(selectedCandidat.id_candidat);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAddExperience(e) {
        e.preventDefault();
        if (!selectedCandidat || !newExp.intitule_poste) return;
        try {
            await sendJson(`/api/vivier/candidat/${selectedCandidat.id_candidat}/experiences`, {
                body: {
                    intitule_poste: newExp.intitule_poste.trim(),
                    entreprise: newExp.entreprise.trim() || null,
                    date_debut: newExp.date_debut || null,
                    date_fin: newExp.date_fin || null,
                    description: newExp.description.trim() || null,
                },
            });
            setNewExp({ intitule_poste: '', entreprise: '', date_debut: '', date_fin: '', description: '' });
            await loadCandidateProfile(selectedCandidat.id_candidat);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAddFormation(e) {
        e.preventDefault();
        if (!selectedCandidat || !newForm.diplome) return;
        try {
            await sendJson(`/api/vivier/candidat/${selectedCandidat.id_candidat}/formations`, {
                body: {
                    diplome: newForm.diplome.trim(),
                    etablissement: newForm.etablissement.trim() || null,
                    annee_obtention: newForm.annee_obtention ? Number(newForm.annee_obtention) : null,
                    domaine_etude: newForm.domaine_etude.trim() || null,
                },
            });
            setNewForm({ diplome: '', etablissement: '', annee_obtention: '', domaine_etude: '' });
            await loadCandidateProfile(selectedCandidat.id_candidat);
        } catch (err) {
            setError(err.message);
        }
    }

    const resetVivierFilters = () => {
        setFilters({ q: '', direction: '', domaine: '', statut: '' });
    };

    return (
        <div className="view-stack">
            {/* BARRE DE FILTRES ET BOUTON AJOUTER AU VIVIER STYLISÉ */}
            <section className="filter-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', flex: 1 }}>
                    <label className="search-field" style={{ flex: '1 1 240px', minWidth: '200px' }}>
                        <Search size={18} />
                        <input
                            onChange={(e) => setFilters((curr) => ({ ...curr, q: e.target.value }))}
                            placeholder="Rechercher dans le vivier (nom, email)..."
                            type="search"
                            value={filters.q}
                        />
                    </label>

                    <label style={{ minWidth: '180px' }}>
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

                    <label style={{ minWidth: '180px' }}>
                        <span>Domaine d'expertise</span>
                        <select
                            onChange={(e) => setFilters((curr) => ({ ...curr, domaine: e.target.value }))}
                            value={filters.domaine}
                        >
                            <option value="">Tous les domaines validés</option>
                            {referentiels.domaines?.filter((d) => d.valide !== false).map((dom) => (
                                <option key={dom.id_domaine} value={dom.id_domaine}>
                                    {dom.nom_domaine}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="filter-button" onClick={loadVivier} type="button">
                            <Filter size={17} />
                            <span>Filtrer</span>
                        </button>
                        <button className="ghost-button" onClick={resetVivierFilters} title="Réinitialiser les filtres" type="button">
                            <RotateCcw size={16} />
                            <span>Réinitialiser</span>
                        </button>
                    </div>
                </div>

                {/* BOUTON AJOUTER AU VIVIER HAUTEMENT STYLISÉ (VIBRANT GRADIENT & OMBERE GLOUIANTE) */}
                <button
                    className="primary-button"
                    onClick={() => setShowAddModal(true)}
                    style={{
                        padding: '12px 20px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '14px',
                        boxShadow: '0 6px 18px rgba(99, 102, 241, 0.35)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'transform 0.15s ease, boxShadow 0.15s ease',
                    }}
                    type="button"
                >
                    <Plus size={18} />
                    <span>Ajouter au vivier RH</span>
                </button>
            </section>

            <section className="data-section">
                <div className="section-heading">
                    <div>
                        <h2>Vivier de Talents RH & Candidatures Sélectionnées</h2>
                        <p>Gestion des candidatures qualifiées conservées en vivier pour de futurs recrutements.</p>
                    </div>
                    <button className="ghost-button" onClick={loadVivier} type="button">
                        <RefreshCw size={17} />
                        <span>Actualiser</span>
                    </button>
                </div>

                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState message={error} onRetry={loadVivier} />
                ) : !vivierList.length ? (
                    <div className="empty-state">Aucune candidature dans le vivier avec les filtres actuels.</div>
                ) : (
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
                                {vivierList.map((item) => (
                                    <tr key={item.id_vivier_candidat ?? `cand_${item.id_candidature}`}>
                                        <td>
                                            <strong>{item.candidat?.prenom} {item.candidat?.nom}</strong>
                                            <br />
                                            <small>{item.candidat?.email}</small>
                                        </td>
                                        <td>
                                            <strong>{item.direction?.nom_direction ?? 'Toutes directions'}</strong>
                                            <br />
                                            <small>{item.domaine?.nom_domaine ?? 'Tous domaines'}</small>
                                        </td>
                                        <td>{item.motif_ajout ?? 'En vivier'}</td>
                                        <td>{formatDate(item.created_at)}</td>
                                        <td><span className="status-pill success">{item.statut ?? 'Actif'}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {item.candidat?.id_candidat ? (
                                                    <button
                                                        className="filter-button"
                                                        onClick={() => {
                                                            setSelectedCandidat(item.candidat);
                                                            loadCandidateProfile(item.candidat.id_candidat);
                                                        }}
                                                        style={{ padding: '6px 12px', fontSize: '13px' }}
                                                        type="button"
                                                    >
                                                        <User size={15} />
                                                        <span>Profil & Compétences</span>
                                                    </button>
                                                ) : null}
                                                <button
                                                    className="row-button danger"
                                                    onClick={() => handleRemoveFromVivier(item)}
                                                    title="Retirer du vivier"
                                                    type="button"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* POPUP MODAL : RECHERCHE ET SELECTION DE CANDIDATURE A METTRE EN VIVIER */}
            {showAddModal && (
                <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                    <Layers size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>Ajouter une candidature au vivier RH</h3>
                                    <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                                        Recherchez une candidature par nom, e-mail ou intitulé de poste pour l'ajouter au vivier.
                                    </p>
                                </div>
                            </div>
                            <button className="ghost-button" onClick={() => setShowAddModal(false)} type="button">
                                <X size={18} />
                            </button>
                        </div>

                        {/* RECHERCHE DE CANDIDATURE DANS LE POPUP */}
                        <div style={{ padding: '16px 20px 8px 20px' }}>
                            <div className="search-field" style={{ width: '100%' }}>
                                <Search size={18} />
                                <input
                                    autoFocus
                                    onChange={(e) => setCandSearchQuery(e.target.value)}
                                    placeholder="Rechercher une candidature (nom, email, offre, poste)..."
                                    type="search"
                                    value={candSearchQuery}
                                />
                            </div>
                        </div>

                        {/* LISTE DES CANDIDATURES TROUVÉES */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' }}>
                            {searchingCands ? (
                                <LoadingState />
                            ) : !candSearchResults.length ? (
                                <div className="empty-state" style={{ padding: '30px 20px' }}>
                                    Aucune candidature trouvée avec ce critère de recherche.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '10px', marginTop: '8px' }}>
                                    {candSearchResults.map((cand) => {
                                        const isInVivier = cand.dans_vivier === true || cand.dans_vivier === 1;
                                        const isRetenue = cand.statut?.libelle?.toLowerCase() === 'retenue' || cand.statut?.libelle?.toLowerCase() === 'retenu';
                                        const isAdding = addingCandId === cand.id_candidature;

                                        return (
                                            <div
                                                key={cand.id_candidature}
                                                style={{
                                                    background: isInVivier || isRetenue ? '#f8fafc' : '#ffffff',
                                                    border: isInVivier || isRetenue ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                                                    borderRadius: '10px',
                                                    padding: '14px 16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '14px',
                                                    boxShadow: isInVivier || isRetenue ? 'none' : '0 2px 6px rgba(0,0,0,0.03)',
                                                }}
                                            >
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                        <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>
                                                            {cand.candidat?.prenom} {cand.candidat?.nom}
                                                        </strong>
                                                        <span className="badge" style={{ fontSize: '11px' }}>
                                                            {cand.statut?.libelle ?? 'Reçue'}
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                                                        <strong>{cand.offre ? `Offre : ${cand.offre.titre_poste}` : `Poste : ${cand.poste_souhaite ?? 'Spontanée'}`}</strong>
                                                    </p>
                                                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                                                        {cand.candidat?.email} • Déposée le {formatDate(cand.created_at)}
                                                    </p>
                                                </div>

                                                <div>
                                                    {isInVivier ? (
                                                        <span
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontSize: '12.5px',
                                                                fontWeight: '600',
                                                                color: '#059669',
                                                                background: '#ecfdf5',
                                                                padding: '6px 12px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #a7f3d0',
                                                            }}
                                                        >
                                                            <CheckCircle2 size={15} />
                                                            <span>Déjà en vivier</span>
                                                        </span>
                                                    ) : isRetenue ? (
                                                        <span
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: '500',
                                                                color: '#94a3b8',
                                                                background: '#f1f5f9',
                                                                padding: '6px 10px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e2e8f0',
                                                            }}
                                                            title="Règle de gestion : une candidature retenue ne peut pas être mise en vivier"
                                                        >
                                                            <span>Non éligible (Retenue)</span>
                                                        </span>
                                                    ) : (
                                                        <button
                                                            className="primary-button"
                                                            disabled={isAdding}
                                                            onClick={() => handleAddCandidatureToVivier(cand.id_candidature)}
                                                            style={{
                                                                fontSize: '13px',
                                                                padding: '8px 14px',
                                                                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                                                border: 'none',
                                                            }}
                                                            type="button"
                                                        >
                                                            <Plus size={15} />
                                                            <span>{isAdding ? 'Ajout...' : 'Ajouter au vivier'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="ghost-button" onClick={() => setShowAddModal(false)} type="button">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DRAWER PROFIL COMPÉTENCES & PARCOURS CANDIDAT */}
            {selectedCandidat && (
                <div className="modal-backdrop" onClick={() => setSelectedCandidat(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3>Profil & Fiche Compétences : {selectedCandidat.prenom} {selectedCandidat.nom}</h3>
                            <button className="ghost-button" onClick={() => setSelectedCandidat(null)} type="button">
                                <X size={18} />
                            </button>
                        </div>

                        {!profileData ? (
                            <LoadingState />
                        ) : (
                            <div style={{ display: 'grid', gap: '20px', marginTop: '14px' }}>
                                {/* COMPÉTENCES */}
                                <div className="data-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Sparkles size={16} />
                                        <span>Compétences Validées ({profileData.competences?.length ?? 0})</span>
                                    </h4>

                                    <div className="tags-list" style={{ marginBottom: '12px' }}>
                                        {(profileData.competences ?? []).map((c) => (
                                            <span key={c.id_competence} className="badge green" style={{ fontSize: '13px', padding: '6px 10px' }}>
                                                {c.nom_competence} - {c.niveau} ({c.source_extraction})
                                            </span>
                                        ))}
                                    </div>

                                    <form onSubmit={handleAddCompetence} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <select
                                            onChange={(e) => setNewComp((curr) => ({ ...curr, id_competence: e.target.value }))}
                                            style={{ padding: '6px 10px', fontSize: '13px' }}
                                            value={newComp.id_competence}
                                        >
                                            <option value="">Sélectionner une compétence</option>
                                            {(competencesData.competences ?? []).map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.nom} ({c.type})
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            onChange={(e) => setNewComp((curr) => ({ ...curr, niveau: e.target.value }))}
                                            style={{ padding: '6px 10px', fontSize: '13px' }}
                                            value={newComp.niveau}
                                        >
                                            <option value="Débutant">Débutant</option>
                                            <option value="Intermédiaire">Intermédiaire</option>
                                            <option value="Avancé">Avancé</option>
                                            <option value="Expert">Expert</option>
                                        </select>
                                        <button className="filter-button" type="submit">
                                            <Plus size={14} />
                                            <span>Ajouter</span>
                                        </button>
                                    </form>
                                </div>

                                {/* EXPÉRIENCES */}
                                <div className="data-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <BriefcaseBusiness size={16} />
                                        <span>Expériences Professionnelles ({profileData.experiences?.length ?? 0})</span>
                                    </h4>
                                    {(profileData.experiences ?? []).map((exp) => (
                                        <div key={exp.id_experience} style={{ background: '#fff', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '8px' }}>
                                            <strong>{exp.intitule_poste}</strong> - <span>{exp.entreprise}</span>
                                            {exp.description ? <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{exp.description}</p> : null}
                                        </div>
                                    ))}
                                    <form onSubmit={handleAddExperience} style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
                                        <input
                                            onChange={(e) => setNewExp((curr) => ({ ...curr, intitule_poste: e.target.value }))}
                                            placeholder="Intitulé du poste (ex: Chef de Projet)..."
                                            required
                                            type="text"
                                            value={newExp.intitule_poste}
                                        />
                                        <input
                                            onChange={(e) => setNewExp((curr) => ({ ...curr, entreprise: e.target.value }))}
                                            placeholder="Entreprise..."
                                            type="text"
                                            value={newExp.entreprise}
                                        />
                                        <button className="filter-button" type="submit">
                                            <Plus size={14} />
                                            <span>Ajouter l'expérience</span>
                                        </button>
                                    </form>
                                </div>

                                {/* FORMATIONS */}
                                <div className="data-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <GraduationCap size={16} />
                                        <span>Formations & Diplômes ({profileData.formations?.length ?? 0})</span>
                                    </h4>
                                    {(profileData.formations ?? []).map((f) => (
                                        <div key={f.id_formation} style={{ background: '#fff', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '8px' }}>
                                            <strong>{f.diplome}</strong> - <span>{f.etablissement}</span> ({f.annee_obtention ?? '-'})
                                        </div>
                                    ))}
                                    <form onSubmit={handleAddFormation} style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
                                        <input
                                            onChange={(e) => setNewForm((curr) => ({ ...curr, diplome: e.target.value }))}
                                            placeholder="Diplôme (ex: Master 2 Informatique)..."
                                            required
                                            type="text"
                                            value={newForm.diplome}
                                        />
                                        <input
                                            onChange={(e) => setNewForm((curr) => ({ ...curr, etablissement: e.target.value }))}
                                            placeholder="Établissement / Université..."
                                            type="text"
                                            value={newForm.etablissement}
                                        />
                                        <button className="filter-button" type="submit">
                                            <Plus size={14} />
                                            <span>Ajouter la formation</span>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
