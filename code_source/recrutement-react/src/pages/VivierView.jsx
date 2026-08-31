import React, { useCallback, useEffect, useState } from 'react';
import {
    BriefcaseBusiness,
    Filter,
    GraduationCap,
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
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ id_candidat: '', id_direction: '', id_domaine: '', motif_ajout: '' });
    const [filters, setFilters] = useState({ q: '', direction: '', domaine: '', statut: '' });
    const [allCandidats, setAllCandidats] = useState([]);

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

            const [vivRes, candRes] = await Promise.all([
                getJson(`/api/vivier?${params.toString()}`),
                getJson('/api/candidatures?per_page=100'),
            ]);

            setVivierList(vivRes?.data ?? []);
            const candidatsExtracted = (candRes?.data ?? []).map((c) => c.candidat).filter(Boolean);
            const uniqueCandidats = Array.from(new Map(candidatsExtracted.map((item) => [item.id_candidat, item])).values());
            setAllCandidats(uniqueCandidats);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadVivier();
    }, [loadVivier]);

    const loadCandidateProfile = useCallback(async (idCandidat) => {
        try {
            const res = await getJson(`/api/vivier/candidat/${idCandidat}/profile`);
            setProfileData(res?.data ?? null);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    async function handleAddToVivier(e) {
        e.preventDefault();
        if (!addForm.id_candidat) return;
        try {
            await sendJson('/api/vivier', {
                body: {
                    id_candidat: Number(addForm.id_candidat),
                    id_direction: addForm.id_direction ? Number(addForm.id_direction) : null,
                    id_domaine: addForm.id_domaine ? Number(addForm.id_domaine) : null,
                    motif_ajout: addForm.motif_ajout.trim() || 'Ajouté au vivier RH',
                },
            });
            setShowAddModal(false);
            setAddForm({ id_candidat: '', id_direction: '', id_domaine: '', motif_ajout: '' });
            await loadVivier();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleRemoveFromVivier(idVivier) {
        if (!window.confirm('Retirer ce candidat du vivier ?')) return;
        try {
            await sendJson(`/api/vivier/${idVivier}`, { method: 'DELETE' });
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
            {/* Header & Button */}
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

                <button className="primary-button" onClick={() => setShowAddModal(true)} type="button">
                    <Plus size={17} />
                    <span>Ajouter au vivier</span>
                </button>
            </section>

            <section className="data-section">
                <div className="section-heading">
                    <div>
                        <h2>Vivier de Talents RH & Compétences</h2>
                        <p>Gestion des candidats qualifiés conservés en vivier pour de futurs recrutements.</p>
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
                    <div className="empty-state">Aucun candidat dans le vivier avec les filtres actuels.</div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Candidat</th>
                                    <th>Direction & Domaine Target</th>
                                    <th>Motif d'ajout</th>
                                    <th>Date d'ajout</th>
                                    <th>Statut</th>
                                    <th>Actions RH</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vivierList.map((item) => (
                                    <tr key={item.id_vivier_candidat}>
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
                                                <button
                                                    className="row-button danger"
                                                    onClick={() => handleRemoveFromVivier(item.id_vivier_candidat)}
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

            {/* MODAL AJOUT CANDIDAT VIVIER */}
            {showAddModal && (
                <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%' }}>
                        <div className="modal-header">
                            <h3>Ajouter un candidat au vivier</h3>
                            <button className="ghost-button" onClick={() => setShowAddModal(false)} type="button">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddToVivier} style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
                            <label>
                                <span>Candidat *</span>
                                <select
                                    onChange={(e) => setAddForm((curr) => ({ ...curr, id_candidat: e.target.value }))}
                                    required
                                    value={addForm.id_candidat}
                                >
                                    <option value="">Sélectionner un candidat</option>
                                    {allCandidats.map((c) => (
                                        <option key={c.id_candidat} value={c.id_candidat}>
                                            {c.prenom} {c.nom} ({c.email})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span>Direction suggérée</span>
                                <select
                                    onChange={(e) => setAddForm((curr) => ({ ...curr, id_direction: e.target.value }))}
                                    value={addForm.id_direction}
                                >
                                    <option value="">Toutes directions</option>
                                    {referentiels.directions?.map((d) => (
                                        <option key={d.id_direction} value={d.id_direction}>
                                            {d.nom_direction}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span>Motif d'ajout RH</span>
                                <input
                                    onChange={(e) => setAddForm((curr) => ({ ...curr, motif_ajout: e.target.value }))}
                                    placeholder="Ex: Excellent profil technique, à recontacter..."
                                    type="text"
                                    value={addForm.motif_ajout}
                                />
                            </label>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button className="ghost-button" onClick={() => setShowAddModal(false)} type="button">
                                    Annuler
                                </button>
                                <button className="primary-button" type="submit">
                                    Enregistrer dans le vivier
                                </button>
                            </div>
                        </form>
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
