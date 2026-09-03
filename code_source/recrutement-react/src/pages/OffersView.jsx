import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Award,
    BriefcaseBusiness,
    CheckCircle2,
    Edit3,
    Filter,
    GraduationCap,
    ListChecks,
    Plus,
    RefreshCw,
    RotateCcw,
    Save,
    Search,
    Trash2,
    UserCheck,
    X,
} from 'lucide-react';
import { getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { Pagination } from '../components/common/Pagination';
import { RowActions } from '../components/common/RowActions';
import { CompetenceModal } from '../components/modals/CompetenceModal';
import { SaisirRhCandidatureModal } from '../components/modals/SaisirRhCandidatureModal';
import { emptyOfferForm, offerPayload } from '../utils/formatters';
import { OffersTable } from './OffersTable';

export function OffersView({ canManage, competencesData, initialEditingOffer = null, onClearEditingOffer = null, onNavigate = null, onRefreshBase = null, referentiels }) {
    const [viewMode, setViewMode] = useState(initialEditingOffer ? 'form' : 'list');
    const [filters, setFilters] = useState({
        q: '',
        direction: '',
        statut: '',
        type_contrat: '',
        page: 1,
    });
    const [saisirRhOffreId, setSaisirRhOffreId] = useState(null);
    const [offersResponse, setOffersResponse] = useState({ data: [], meta: null });
    const [offerForm, setOfferForm] = useState(emptyOfferForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [competenceSearchQuery, setCompetenceSearchQuery] = useState('');
    const [selectedAddCompId, setSelectedAddCompId] = useState('');
    const [selectedAddCompNiveau, setSelectedAddCompNiveau] = useState('Intermediaire');
    const [showCompetenceCreateModal, setShowCompetenceCreateModal] = useState(false);
    const [extraCompetences, setExtraCompetences] = useState([]);

    const getCompId = useCallback((c) => Number(c?.id_competence ?? c?.id ?? 0), []);
    const getCompName = useCallback((c) => c?.nom_competence ?? c?.nom ?? `Compétence #${getCompId(c)}`, [getCompId]);

    const allCompetences = useMemo(() => {
        const base = competencesData.competences ?? [];
        const baseIds = new Set(base.map((c) => getCompId(c)));
        const extraToAdd = extraCompetences.filter((c) => !baseIds.has(getCompId(c)));
        return [...base, ...extraToAdd];
    }, [competencesData.competences, extraCompetences, getCompId]);

    const filteredComps = useMemo(() => {
        const list = allCompetences;
        if (!competenceSearchQuery.trim()) return list;
        const q = competenceSearchQuery.toLowerCase().trim();
        return list.filter((c) => getCompName(c).toLowerCase().includes(q));
    }, [allCompetences, competenceSearchQuery, getCompName]);

    useEffect(() => {
        if (filteredComps.length > 0) {
            const firstId = String(getCompId(filteredComps[0]));
            const exists = filteredComps.some((c) => String(getCompId(c)) === String(selectedAddCompId));
            if (!exists) {
                setSelectedAddCompId(firstId);
            }
        } else {
            setSelectedAddCompId('');
        }
    }, [filteredComps, selectedAddCompId, getCompId]);

    const defaultStatusId = useMemo(
        () => referentiels.statuts_offre?.find((statut) => statut.libelle === 'Brouillon')?.id_statut_offre ?? '',
        [referentiels.statuts_offre],
    );

    const queryString = useMemo(() => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });

        params.set('per_page', '10');

        return params.toString();
    }, [filters]);

    const loadOffers = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await getJson(`/api/offres?${queryString}`);
            setOffersResponse(response ?? { data: [], meta: null });
        } catch (caughtError) {
            setError(caughtError.message);
        } finally {
            setLoading(false);
        }
    }, [queryString]);

    useEffect(() => {
        loadOffers();
    }, [loadOffers]);

    useEffect(() => {
        if (initialEditingOffer) {
            editOffer(initialEditingOffer);
            if (onClearEditingOffer) {
                onClearEditingOffer();
            }
        }
    }, [initialEditingOffer, onClearEditingOffer]);

    useEffect(() => {
        if (!offerForm.id && !offerForm.id_statut_offre && defaultStatusId) {
            setOfferForm((current) => ({
                ...current,
                id_statut_offre: String(defaultStatusId),
            }));
        }
    }, [defaultStatusId, offerForm.id, offerForm.id_statut_offre]);

    function updateFilter(name, value) {
        setFilters((current) => ({
            ...current,
            [name]: value,
            page: 1,
        }));
    }

    function changePage(page) {
        setFilters((current) => ({
            ...current,
            page,
        }));
    }

    function updateOfferForm(name, value) {
        setOfferForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function addProfil() {
        setOfferForm((curr) => ({
            ...curr,
            profils: [...curr.profils, { description: '', type_valeur: '', valeur_min: '', valeur_max: '', valeur_attendue: '', unite_valeur: '' }],
        }));
    }

    function updateProfil(index, field, value) {
        setOfferForm((curr) => {
            const updated = [...curr.profils];
            updated[index] = { ...updated[index], [field]: value };
            return { ...curr, profils: updated };
        });
    }

    function removeProfil(index) {
        setOfferForm((curr) => ({
            ...curr,
            profils: curr.profils.filter((_, i) => i !== index),
        }));
    }

    function addMission() {
        setOfferForm((curr) => ({
            ...curr,
            missions: [...curr.missions, { description: '', ordre: curr.missions.length + 1 }],
        }));
    }

    function updateMission(index, value) {
        setOfferForm((curr) => {
            const updated = [...curr.missions];
            updated[index] = { ...updated[index], description: value };
            return { ...curr, missions: updated };
        });
    }

    function removeMission(index) {
        setOfferForm((curr) => ({
            ...curr,
            missions: curr.missions.filter((_, i) => i !== index),
        }));
    }

    function addFormation() {
        setOfferForm((curr) => ({
            ...curr,
            formations: [...curr.formations, { niveau_min: '', niveau_max: '', domaine: '', obligatoire: true }],
        }));
    }

    function updateFormation(index, field, value) {
        setOfferForm((curr) => {
            const updated = [...curr.formations];
            updated[index] = { ...updated[index], [field]: value };
            return { ...curr, formations: updated };
        });
    }

    function removeFormation(index) {
        setOfferForm((curr) => ({
            ...curr,
            formations: curr.formations.filter((_, i) => i !== index),
        }));
    }

    function toggleCompetence(id_competence) {
        const numId = Number(id_competence);
        setOfferForm((curr) => {
            const exists = curr.competences.find((c) => Number(c.id_competence) === numId);
            if (exists) {
                return {
                    ...curr,
                    competences: curr.competences.filter((c) => Number(c.id_competence) !== numId),
                };
            }
            return {
                ...curr,
                competences: [...curr.competences, { id_competence: numId, niveau_requis: 'Intermediaire' }],
            };
        });
    }

    function handleAddCompetenceFromSelect() {
        const targetIdStr = selectedAddCompId || (filteredComps.length > 0 ? String(getCompId(filteredComps[0])) : '');
        if (!targetIdStr) return;

        const id_comp = Number(targetIdStr);
        setOfferForm((curr) => {
            const exists = curr.competences.find((c) => Number(c.id_competence) === id_comp);
            if (exists) {
                return {
                    ...curr,
                    competences: curr.competences.map((c) => (Number(c.id_competence) === id_comp ? { ...c, niveau_requis: selectedAddCompNiveau } : c)),
                };
            }
            return {
                ...curr,
                competences: [...curr.competences, { id_competence: id_comp, niveau_requis: selectedAddCompNiveau }],
            };
        });
        setCompetenceSearchQuery('');
    }

    function updateCompetenceNiveau(id_competence, niveau_requis) {
        const numId = Number(id_competence);
        setOfferForm((curr) => ({
            ...curr,
            competences: curr.competences.map((c) => (Number(c.id_competence) === numId ? { ...c, niveau_requis } : c)),
        }));
    }

    function resetOfferForm() {
        setFormError('');
        setOfferForm({
            ...emptyOfferForm,
            id_statut_offre: defaultStatusId ? String(defaultStatusId) : '',
        });
    }

    function openNewOfferForm() {
        resetOfferForm();
        setViewMode('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function editOffer(offre) {
        setFormError('');
        const mappedProfils = offre.profils?.length
            ? offre.profils.map((p) => ({
                  description: p.description ?? '',
                  type_valeur: p.type_valeur ?? '',
                  valeur_min: p.valeur_min ?? '',
                  valeur_max: p.valeur_max ?? '',
                  valeur_attendue: p.valeur_attendue ?? '',
                  unite_valeur: p.unite_valeur ?? '',
              }))
            : offre.profil
            ? [
                  {
                      description: offre.profil.description ?? '',
                      type_valeur: offre.profil.type_valeur ?? '',
                      valeur_min: offre.profil.valeur_min ?? '',
                      valeur_max: offre.profil.valeur_max ?? '',
                      valeur_attendue: offre.profil.valeur_attendue ?? '',
                      unite_valeur: offre.profil.unite_valeur ?? '',
                  },
              ]
            : emptyOfferForm.profils;

        setOfferForm({
            id: offre.id,
            titre_poste: offre.titre_poste ?? '',
            id_direction: offre.direction?.id ? String(offre.direction.id) : '',
            description: offre.description ?? '',
            lieu: offre.lieu ?? '',
            id_type_contrat: offre.type_contrat?.id ? String(offre.type_contrat.id) : '',
            date_publication: offre.date_publication ?? '',
            date_limite: offre.date_limite ?? '',
            id_statut_offre: offre.statut?.id ? String(offre.statut.id) : defaultStatusId ? String(defaultStatusId) : '',
            profils: mappedProfils,
            missions: offre.missions?.length
                ? offre.missions.map((m) => ({ description: m.description, ordre: m.ordre }))
                : [{ description: '', ordre: 1 }],
            formations: offre.formations?.length
                ? offre.formations.map((f) => ({
                      niveau_min: f.niveau_min ?? '',
                      niveau_max: f.niveau_max ?? '',
                      domaine: f.domaine ?? '',
                      obligatoire: f.obligatoire ?? true,
                  }))
                : [{ niveau_min: '', niveau_max: '', domaine: '', obligatoire: true }],
            competences: offre.competences?.length
                ? offre.competences.map((c) => ({ id_competence: c.id, niveau_requis: c.niveau_requis ?? 'Intermediaire' }))
                : [],
        });
        setViewMode('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function saveOffer(event) {
        event.preventDefault();
        setSaving(true);
        setFormError('');

        try {
            await sendJson(offerForm.id ? `/api/offre/${offerForm.id}` : '/api/offres', {
                body: offerPayload(offerForm),
                method: offerForm.id ? 'PUT' : 'POST',
            });
            resetOfferForm();
            setViewMode('list');
            await loadOffers();
        } catch (caughtError) {
            setFormError(caughtError.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteOffer(offre) {
        const confirmed = window.confirm(`Supprimer l'offre "${offre.titre_poste}" ?`);

        if (!confirmed) return;

        setFormError('');

        try {
            await sendJson(`/api/offre/${offre.id}`, { method: 'DELETE' });
            await loadOffers();
        } catch (caughtError) {
            setFormError(caughtError.message);
        }
    }

    async function changeOfferStatus(offre, action) {
        setFormError('');

        try {
            await sendJson(`/api/offre/${offre.id}/${action}`, { method: 'PATCH' });
            await loadOffers();
        } catch (caughtError) {
            setFormError(caughtError.message);
        }
    }

    const renderOfferActions = (offre) => {
        const currentStatusObj = referentiels.statuts_offre?.find((s) => s.id_statut_offre === offre.statut?.id);
        const currentOrder = currentStatusObj?.ordre_workflow ?? 0;
        const publieeOrder = referentiels.statuts_offre?.find((s) => s.libelle === 'Publiee' || s.libelle === 'Publiée')?.ordre_workflow ?? 2;
        const clotureeOrder = referentiels.statuts_offre?.find((s) => s.libelle === 'Cloturee' || s.libelle === 'Clôturée')?.ordre_workflow ?? 3;

        const canPublish = canManage && currentOrder < publieeOrder;
        const canClose = canManage && currentOrder < clotureeOrder;
        const canEdit = canManage;
        const canDelete = canManage;

        return (
            <div className="row-actions">
                <button
                    className={`row-button ${canPublish ? 'success' : ''}`}
                    disabled={!canPublish}
                    onClick={() => { if (canPublish) changeOfferStatus(offre, 'publier'); }}
                    style={!canPublish ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                    title={canPublish ? "Publier l'offre" : "Publication impossible (Offre déjà publiée ou clôturée)"}
                    type="button"
                >
                    <CheckCircle2 aria-hidden="true" size={15} />
                </button>
                <button
                    className="row-button"
                    disabled={!canClose}
                    onClick={() => { if (canClose) changeOfferStatus(offre, 'cloturer'); }}
                    style={!canClose ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                    title={canClose ? "Clôturer l'offre" : "Clôture impossible (Offre déjà clôturée)"}
                    type="button"
                >
                    <X aria-hidden="true" size={15} />
                </button>
                <button
                    className="row-button"
                    disabled={!canEdit}
                    onClick={() => { if (canEdit) editOffer(offre); }}
                    style={!canEdit ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                    title={canEdit ? "Modifier l'offre" : "Modification non autorisée"}
                    type="button"
                >
                    <Edit3 aria-hidden="true" size={15} />
                </button>
                <button
                    className="row-button danger"
                    disabled={!canDelete}
                    onClick={() => { if (canDelete) deleteOffer(offre); }}
                    style={!canDelete ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                    title={canDelete ? "Supprimer l'offre" : "Suppression non autorisée"}
                    type="button"
                >
                    <Trash2 aria-hidden="true" size={15} />
                </button>
            </div>
        );
    };

    const meta = offersResponse.meta;

    if (viewMode === 'form') {
        return (
            <div className="view-stack">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <button
                        className="ghost-button"
                        onClick={() => {
                            resetOfferForm();
                            setViewMode('list');
                        }}
                        type="button"
                    >
                        <ArrowLeft size={18} />
                        <span>Retour a la liste des offres</span>
                    </button>
                </div>

                <section className="data-section">
                    <div className="section-heading">
                        <div>
                            <h2>{offerForm.id ? 'Modifier une offre' : 'Nouvelle offre'}</h2>
                            <p>Formulaire de saisie complete de l'offre, des profils, missions, formations et competences.</p>
                        </div>
                    </div>

                    <form className="compact-form offer-form" onSubmit={saveOffer}>
                        <div className="form-sub-header">
                            <BriefcaseBusiness size={18} />
                            <span>Informations Principales</span>
                        </div>

                        <label>
                            <span>Poste <span style={{ color: '#ef4444' }}>*</span></span>
                            <input
                                name="titre_poste"
                                onChange={(event) => updateOfferForm('titre_poste', event.target.value)}
                                required
                                type="text"
                                value={offerForm.titre_poste}
                            />
                        </label>

                        <label>
                            <span>Direction <span style={{ color: '#ef4444' }}>*</span></span>
                            <select
                                name="id_direction"
                                onChange={(event) => updateOfferForm('id_direction', event.target.value)}
                                required
                                value={offerForm.id_direction}
                            >
                                <option value="">Choisir</option>
                                {referentiels.directions?.map((direction) => (
                                    <option key={direction.id_direction} value={direction.id_direction}>
                                        {direction.nom_direction}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Contrat</span>
                            <select
                                name="id_type_contrat"
                                onChange={(event) => updateOfferForm('id_type_contrat', event.target.value)}
                                value={offerForm.id_type_contrat}
                            >
                                <option value="">Non precise</option>
                                {referentiels.types_contrat?.map((contrat) => (
                                    <option key={contrat.id_type_contrat} value={contrat.id_type_contrat}>
                                        {contrat.libelle}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Statut <span style={{ color: '#ef4444' }}>*</span></span>
                            <select
                                name="id_statut_offre"
                                onChange={(event) => updateOfferForm('id_statut_offre', event.target.value)}
                                required
                                value={offerForm.id_statut_offre}
                            >
                                <option value="">Brouillon par defaut</option>
                                {referentiels.statuts_offre?.map((statut) => {
                                    const currentStatusObj = referentiels.statuts_offre?.find(
                                        (s) => String(s.id_statut_offre) === String(offerForm.id_statut_offre),
                                    );
                                    const currentOrder = currentStatusObj?.ordre_workflow ?? 0;
                                    const isCurrent = String(statut.id_statut_offre) === String(offerForm.id_statut_offre);
                                    const isHigherOrder = (statut.ordre_workflow ?? 0) > currentOrder;
                                    const isDisabled = offerForm.id && !isCurrent && !isHigherOrder;

                                    return (
                                        <option
                                            disabled={isDisabled}
                                            key={statut.id_statut_offre}
                                            value={statut.id_statut_offre}
                                        >
                                            {statut.libelle} {isDisabled ? '(Non autorise - regression)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </label>

                        <label>
                            <span>Lieu <span style={{ color: '#ef4444' }}>*</span></span>
                            <select
                                name="id_lieu"
                                onChange={(event) => updateOfferForm('id_lieu', event.target.value)}
                                required
                                value={offerForm.id_lieu}
                            >
                                <option value="">Choisir un lieu</option>
                                {(referentiels.lieux ?? []).map((lieu) => (
                                    <option key={lieu.id_lieu} value={lieu.id_lieu}>
                                        {lieu.libelle}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Date publication</span>
                            <input
                                name="date_publication"
                                onChange={(event) => updateOfferForm('date_publication', event.target.value)}
                                type="date"
                                value={offerForm.date_publication}
                            />
                        </label>

                        <label>
                            <span>Date limite</span>
                            <input
                                name="date_limite"
                                onChange={(event) => updateOfferForm('date_limite', event.target.value)}
                                type="date"
                                value={offerForm.date_limite}
                            />
                        </label>

                        <label className="full-span">
                            <span>Description du poste</span>
                            <textarea
                                name="description"
                                onChange={(event) => updateOfferForm('description', event.target.value)}
                                rows={3}
                                value={offerForm.description}
                            />
                        </label>

                        <div className="form-sub-header">
                            <UserCheck size={18} />
                            <span>Criteres de profil chiffres / attendus (Multiples)</span>
                        </div>

                        <div className="full-span" style={{ display: 'grid', gap: '12px' }}>
                            {offerForm.profils.map((prof, index) => (
                                <div
                                    key={index}
                                    style={{
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        background: '#fafbfc',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                                        gap: '10px',
                                    }}
                                >
                                    <label className="full-span">
                                        <span>Exigence / Critere #{index + 1}</span>
                                        <input
                                            onChange={(e) => updateProfil(index, 'description', e.target.value)}
                                            placeholder="Ex: Experience en management d'equipe"
                                            value={prof.description}
                                        />
                                    </label>
                                    <label>
                                        <span>Valeur cible</span>
                                        <input
                                            onChange={(e) => updateProfil(index, 'valeur_attendue', e.target.value)}
                                            placeholder="Ex: 5"
                                            value={prof.valeur_attendue}
                                        />
                                    </label>
                                    <label>
                                        <span>Valeur Min</span>
                                        <input
                                            onChange={(e) => updateProfil(index, 'valeur_min', e.target.value)}
                                            placeholder="Ex: 2"
                                            value={prof.valeur_min}
                                        />
                                    </label>
                                    <label>
                                        <span>Valeur Max</span>
                                        <input
                                            onChange={(e) => updateProfil(index, 'valeur_max', e.target.value)}
                                            placeholder="Ex: 10"
                                            value={prof.valeur_max}
                                        />
                                    </label>
                                    <label>
                                        <span>Unite</span>
                                        <input
                                            onChange={(e) => updateProfil(index, 'unite_valeur', e.target.value)}
                                            placeholder="Ex: ans, score"
                                            value={prof.unite_valeur}
                                        />
                                    </label>

                                    {offerForm.profils.length > 1 ? (
                                        <div className="full-span" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button className="ghost-button danger" onClick={() => removeProfil(index)} type="button">
                                                <Trash2 size={16} />
                                                <span>Supprimer ce critere</span>
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                            <button className="ghost-button" onClick={addProfil} style={{ justifySelf: 'start' }} type="button">
                                <Plus size={16} />
                                <span>Ajouter un critere de profil</span>
                            </button>
                        </div>

                        <div className="form-sub-header">
                            <ListChecks size={18} />
                            <span>Missions du poste</span>
                        </div>

                        <div className="full-span" style={{ display: 'grid', gap: '8px' }}>
                            {offerForm.missions.map((mission, index) => (
                                <div className="dynamic-row" key={index}>
                                    <input
                                        onChange={(e) => updateMission(index, e.target.value)}
                                        placeholder={`Mission #${index + 1}...`}
                                        value={mission.description}
                                    />
                                    {offerForm.missions.length > 1 ? (
                                        <button className="row-button danger" onClick={() => removeMission(index)} type="button">
                                            <Trash2 size={16} />
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                            <button className="ghost-button" onClick={addMission} style={{ justifySelf: 'start' }} type="button">
                                <Plus size={16} />
                                <span>Ajouter une mission</span>
                            </button>
                        </div>

                        <div className="form-sub-header">
                            <GraduationCap size={18} />
                            <span>Formations requises</span>
                        </div>

                        <div className="full-span" style={{ display: 'grid', gap: '8px' }}>
                            {offerForm.formations.map((formation, index) => (
                                <div className="dynamic-row" key={index}>
                                    <select
                                        onChange={(e) => updateFormation(index, 'id_niveau_min', e.target.value)}
                                        value={formation.id_niveau_min}
                                    >
                                        <option value="">Niveau Min (Optionnel)</option>
                                        {(referentiels.niveaux ?? []).map((n) => (
                                            <option key={n.id_niveau} value={n.id_niveau}>
                                                {n.libelle}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        onChange={(e) => updateFormation(index, 'id_niveau_max', e.target.value)}
                                        value={formation.id_niveau_max}
                                    >
                                        <option value="">Niveau Max (Optionnel)</option>
                                        {(referentiels.niveaux ?? []).map((n) => (
                                            <option key={n.id_niveau} value={n.id_niveau}>
                                                {n.libelle}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        onChange={(e) => updateFormation(index, 'domaine', e.target.value)}
                                        placeholder="Domaine (ex: Informatique, Finance)"
                                        value={formation.domaine}
                                    />
                                    <label className="checkbox-line" style={{ width: 'auto' }}>
                                        <input
                                            checked={formation.obligatoire}
                                            onChange={(e) => updateFormation(index, 'obligatoire', e.target.checked)}
                                            type="checkbox"
                                        />
                                        <span>Obligatoire</span>
                                    </label>
                                    {offerForm.formations.length > 1 ? (
                                        <button className="row-button danger" onClick={() => removeFormation(index)} type="button">
                                            <Trash2 size={16} />
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                            <button className="ghost-button" onClick={addFormation} style={{ justifySelf: 'start' }} type="button">
                                <Plus size={16} />
                                <span>Ajouter une formation</span>
                            </button>
                        </div>

                        <div className="form-sub-header full-span">
                            <Award size={18} />
                            <span>Competences requises</span>
                        </div>

                        <div className="full-span" style={{ display: 'grid', gap: '8px' }}>
                            {/* RANGÉE HORIZONTALE DES CONTROLES DE RECHERCHE ET SELECTION */}
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                                {/* 1. Input de recherche */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 220px', minWidth: '200px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                                        Rechercher une compétence
                                    </label>
                                    <div className="search-field" style={{ width: '100%' }}>
                                        <Search size={16} />
                                        <input
                                            onChange={(e) => setCompetenceSearchQuery(e.target.value)}
                                            placeholder="Tapez le nom de la compétence (ex: PHP, React...)"
                                            type="search"
                                            value={competenceSearchQuery}
                                        />
                                    </div>
                                </div>

                                {/* 2. Select des résultats */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1.2 1 240px', minWidth: '220px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                                        Compétence correspondante ({filteredComps.length} trouvée{filteredComps.length > 1 ? 's' : ''})
                                    </label>
                                    <select
                                        onChange={(e) => setSelectedAddCompId(e.target.value)}
                                        style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        value={selectedAddCompId}
                                    >
                                        {filteredComps.length ? (
                                            filteredComps.map((c) => (
                                                <option key={getCompId(c)} value={getCompId(c)}>
                                                    {getCompName(c)} {c.type ? `(${c.type})` : ''}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">Aucune compétence trouvée</option>
                                        )}
                                    </select>
                                </div>

                                {/* 3. Select Niveau */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '160px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                                        Niveau requis pour l'offre
                                    </label>
                                    <select
                                        onChange={(e) => setSelectedAddCompNiveau(e.target.value)}
                                        style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        value={selectedAddCompNiveau}
                                    >
                                        <option value="Debutant">Débutant</option>
                                        <option value="Intermediaire">Intermédiaire</option>
                                        <option value="Avance">Avancé</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>
                            </div>

                            {/* TABLEAU DES COMPÉTENCES RATTACHÉES À L'OFFRE */}
                            {offerForm.competences.length > 0 ? (
                                <div className="table-wrap" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '4px' }}>
                                    <table style={{ margin: 0, fontSize: '13.5px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '10px 14px' }}>Compétence Sélectionnée</th>
                                                <th style={{ padding: '10px 14px' }}>Niveau Requis</th>
                                                <th style={{ padding: '10px 14px', width: '90px', textAlign: 'center' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {offerForm.competences.map((selectedObj) => {
                                                const compRef = allCompetences.find((c) => getCompId(c) === Number(selectedObj.id_competence));
                                                const compName = compRef ? getCompName(compRef) : `Compétence #${selectedObj.id_competence}`;

                                                return (
                                                    <tr key={selectedObj.id_competence}>
                                                        <td style={{ padding: '10px 14px' }}>
                                                            <strong style={{ color: '#0f172a' }}>{compName}</strong>
                                                        </td>
                                                        <td style={{ padding: '10px 14px' }}>
                                                            <select
                                                                onChange={(e) => updateCompetenceNiveau(selectedObj.id_competence, e.target.value)}
                                                                style={{ height: '34px', fontSize: '13px', padding: '0 8px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                                                value={selectedObj.niveau_requis ?? 'Intermediaire'}
                                                            >
                                                                <option value="Debutant">Débutant</option>
                                                                <option value="Intermediaire">Intermédiaire</option>
                                                                <option value="Avance">Avancé</option>
                                                                <option value="Expert">Expert</option>
                                                            </select>
                                                        </td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                            <button
                                                                className="row-button danger"
                                                                onClick={() => toggleCompetence(selectedObj.id_competence)}
                                                                title="Retirer de l'offre"
                                                                type="button"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}

                            {/* BOUTONS AU BAS DE LA DIV, MÊME STYLE ET EMPLACEMENT QUE MISSIONS ET FORMATIONS */}
                            <div style={{ display: 'flex', gap: '8px', justifySelf: 'start', flexWrap: 'wrap' }}>
                                <button
                                    className="ghost-button"
                                    disabled={!selectedAddCompId && !filteredComps.length}
                                    onClick={handleAddCompetenceFromSelect}
                                    style={{ justifySelf: 'start' }}
                                    type="button"
                                >
                                    <Plus size={16} />
                                    <span>Ajouter la compétence</span>
                                </button>

                                <button
                                    className="ghost-button"
                                    onClick={() => setShowCompetenceCreateModal(true)}
                                    style={{ justifySelf: 'start', background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' }}
                                    type="button"
                                >
                                    <Plus size={16} />
                                    <span>Créer une nouvelle compétence</span>
                                </button>
                            </div>
                        </div>

                        <div className="form-actions full-span" style={{ marginTop: '16px' }}>
                            <button className="filter-button" disabled={saving} type="submit">
                                <Save aria-hidden="true" size={17} />
                                <span>{saving ? 'Enregistrement...' : "Enregistrer l'offre"}</span>
                            </button>
                            <button
                                className="ghost-button"
                                onClick={() => {
                                    resetOfferForm();
                                    setViewMode('list');
                                }}
                                type="button"
                            >
                                <X aria-hidden="true" size={17} />
                                <span>Annuler</span>
                            </button>
                        </div>

                        {formError ? <p className="form-error full-span">{formError}</p> : null}
                    </form>
                </section>

                {showCompetenceCreateModal ? (
                    <CompetenceModal
                        onClose={() => setShowCompetenceCreateModal(false)}
                        onSuccess={async (createdItem) => {
                            if (createdItem) {
                                setExtraCompetences((prev) => [...prev, createdItem]);
                                const newId = Number(createdItem?.id_competence ?? createdItem?.id ?? 0);
                                if (newId) {
                                    setOfferForm((curr) => {
                                        const exists = curr.competences.find((c) => Number(c.id_competence) === newId);
                                        if (!exists) {
                                            return {
                                                ...curr,
                                                competences: [...curr.competences, { id_competence: newId, niveau_requis: selectedAddCompNiveau }],
                                            };
                                        }
                                        return curr;
                                    });
                                }
                            }
                            if (onRefreshBase) await onRefreshBase();
                        }}
                        typesList={competencesData?.types ?? []}
                    />
                ) : null}
            </div>
        );
    }

    return (
        <div className="view-stack">
            <section className="filter-bar" aria-label="Filtres des offres">
                <label className="search-field">
                    <Search aria-hidden="true" size={18} />
                    <input
                        name="q"
                        onChange={(event) => updateFilter('q', event.target.value)}
                        placeholder="Rechercher un poste, un lieu..."
                        type="search"
                        value={filters.q}
                    />
                </label>

                <label>
                    <span>Direction</span>
                    <select onChange={(event) => updateFilter('direction', event.target.value)} value={filters.direction}>
                        <option value="">Toutes</option>
                        {referentiels.directions?.map((direction) => (
                            <option key={direction.id_direction} value={direction.id_direction}>
                                {direction.nom_direction}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Statut</span>
                    <select onChange={(event) => updateFilter('statut', event.target.value)} value={filters.statut}>
                        <option value="">Tous</option>
                        {referentiels.statuts_offre?.map((statut) => (
                            <option key={statut.id_statut_offre} value={statut.id_statut_offre}>
                                {statut.libelle}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Contrat</span>
                    <select onChange={(event) => updateFilter('type_contrat', event.target.value)} value={filters.type_contrat}>
                        <option value="">Tous</option>
                        {referentiels.types_contrat?.map((contrat) => (
                            <option key={contrat.id_type_contrat} value={contrat.id_type_contrat}>
                                {contrat.libelle}
                            </option>
                        ))}
                    </select>
                </label>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="filter-button" onClick={loadOffers} type="button">
                        <Filter aria-hidden="true" size={17} />
                        <span>Filtrer</span>
                    </button>
                    <button
                        className="ghost-button"
                        onClick={() => setFilters({ q: '', direction: '', statut: '', type_contrat: '', page: 1 })}
                        title="Réinitialiser les filtres"
                        type="button"
                    >
                        <RotateCcw aria-hidden="true" size={16} />
                        <span>Réinitialiser</span>
                    </button>
                </div>
            </section>

            <section className="data-section">
                <div className="section-heading">
                    <div>
                        <h2>Liste des offres</h2>
                        <p>{meta?.total ?? 0} offre(s) trouvee(s)</p>
                    </div>
                    <div className="section-heading-actions">
                        {canManage ? (
                            <button className="filter-button" onClick={openNewOfferForm} type="button">
                                <Plus aria-hidden="true" size={17} />
                                <span>Nouvelle offre</span>
                            </button>
                        ) : null}
                        <button className="ghost-button" onClick={loadOffers} type="button">
                            <RefreshCw aria-hidden="true" size={17} />
                            <span>Actualiser</span>
                        </button>
                    </div>
                </div>

                {error ? (
                    <ErrorState message={error} onRetry={loadOffers} />
                ) : loading ? (
                    <LoadingState />
                ) : (
                    <OffersTable
                        offers={offersResponse.data}
                        onNavigate={onNavigate}
                        onSaisirRh={(id) => setSaisirRhOffreId(id)}
                        onSelectOffer={editOffer}
                        renderActions={renderOfferActions}
                    />
                )}

                {meta ? <Pagination meta={meta} onChangePage={changePage} /> : null}
            </section>

            {saisirRhOffreId ? (
                <SaisirRhCandidatureModal
                    initialOffreId={saisirRhOffreId}
                    onClose={() => setSaisirRhOffreId(null)}
                    onSuccess={loadOffers}
                    referentiels={referentiels}
                />
            ) : null}

            {showCompetenceCreateModal ? (
                <CompetenceModal
                    onClose={() => setShowCompetenceCreateModal(false)}
                    onSuccess={async (createdItem) => {
                        if (onRefreshBase) await onRefreshBase();
                        const newId = Number(createdItem?.id_competence ?? createdItem?.id ?? 0);
                        if (newId) {
                            setOfferForm((curr) => {
                                const exists = curr.competences.find((c) => Number(c.id_competence) === newId);
                                if (!exists) {
                                    return {
                                        ...curr,
                                        competences: [...curr.competences, { id_competence: newId, niveau_requis: selectedAddCompNiveau }],
                                    };
                                }
                                return curr;
                            });
                        }
                    }}
                    typesList={competencesData.types ?? []}
                />
            ) : null}
        </div>
    );
}
