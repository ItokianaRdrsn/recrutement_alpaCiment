import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Award,
    BriefcaseBusiness,
    CheckCircle2,
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
import { SaisirRhCandidatureModal } from '../components/modals/SaisirRhCandidatureModal';
import { emptyOfferForm, offerPayload } from '../utils/formatters';
import { OffersTable } from './OffersTable';

export function OffersView({ canManage, competencesData, initialEditingOffer = null, onClearEditingOffer = null, onNavigate = null, referentiels }) {
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
        setOfferForm((curr) => {
            const exists = curr.competences.find((c) => c.id_competence === id_competence);
            if (exists) {
                return {
                    ...curr,
                    competences: curr.competences.filter((c) => c.id_competence !== id_competence),
                };
            }
            return {
                ...curr,
                competences: [...curr.competences, { id_competence, niveau_requis: 'Intermediaire' }],
            };
        });
    }

    function updateCompetenceNiveau(id_competence, niveau_requis) {
        setOfferForm((curr) => ({
            ...curr,
            competences: curr.competences.map((c) => (c.id_competence === id_competence ? { ...c, niveau_requis } : c)),
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
            await sendJson(offerForm.id ? `/api/offres/${offerForm.id}` : '/api/offres', {
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
            await sendJson(`/api/offres/${offre.id}`, { method: 'DELETE' });
            await loadOffers();
        } catch (caughtError) {
            setFormError(caughtError.message);
        }
    }

    async function changeOfferStatus(offre, action) {
        setFormError('');

        try {
            await sendJson(`/api/offres/${offre.id}/${action}`, { method: 'PATCH' });
            await loadOffers();
        } catch (caughtError) {
            setFormError(caughtError.message);
        }
    }

    const renderOfferActions = canManage
        ? (offre) => {
              const currentStatusObj = referentiels.statuts_offre?.find((s) => s.id_statut_offre === offre.statut?.id);
              const currentOrder = currentStatusObj?.ordre_workflow ?? 0;
              const publieeOrder = referentiels.statuts_offre?.find((s) => s.libelle === 'Publiee' || s.libelle === 'Publiée')?.ordre_workflow ?? 2;
              const clotureeOrder = referentiels.statuts_offre?.find((s) => s.libelle === 'Cloturee' || s.libelle === 'Clôturée')?.ordre_workflow ?? 3;

              const canPublish = currentOrder < publieeOrder;
              const canClose = currentOrder < clotureeOrder;

              return (
                  <RowActions
                      extra={
                          <>
                              {canPublish ? (
                                  <button
                                      className="row-button success"
                                      onClick={() => changeOfferStatus(offre, 'publier')}
                                      title="Publier l'offre"
                                      type="button"
                                  >
                                      <CheckCircle2 aria-hidden="true" size={16} />
                                  </button>
                              ) : null}
                              {canClose ? (
                                  <button
                                      className="row-button"
                                      onClick={() => changeOfferStatus(offre, 'cloturer')}
                                      title="Cloturer l'offre"
                                      type="button"
                                  >
                                      <X aria-hidden="true" size={16} />
                                  </button>
                              ) : null}
                          </>
                      }
                      onDelete={() => deleteOffer(offre)}
                      onEdit={() => editOffer(offre)}
                  />
              );
          }
        : null;

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
                            <span>Poste</span>
                            <input
                                name="titre_poste"
                                onChange={(event) => updateOfferForm('titre_poste', event.target.value)}
                                required
                                type="text"
                                value={offerForm.titre_poste}
                            />
                        </label>

                        <label>
                            <span>Direction</span>
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
                            <span>Statut</span>
                            <select
                                name="id_statut_offre"
                                onChange={(event) => updateOfferForm('id_statut_offre', event.target.value)}
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
                            <span>Lieu</span>
                            <input
                                name="lieu"
                                onChange={(event) => updateOfferForm('lieu', event.target.value)}
                                type="text"
                                value={offerForm.lieu}
                            />
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
                                    <input
                                        onChange={(e) => updateFormation(index, 'niveau_min', e.target.value)}
                                        placeholder="Niveau (ex: Bac+5, Master)"
                                        value={formation.niveau_min}
                                    />
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

                        <div className="form-sub-header">
                            <Award size={18} />
                            <span>Competences requises</span>
                        </div>

                        <div className="competence-selector">
                            {(competencesData.competences ?? []).map((comp) => {
                                const selectedObj = offerForm.competences.find((c) => c.id_competence === comp.id);
                                const isSelected = Boolean(selectedObj);

                                return (
                                    <div className={`competence-item ${isSelected ? 'selected' : ''}`} key={comp.id}>
                                        <div className="competence-item-header">
                                            <span>{comp.nom}</span>
                                            <input
                                                checked={isSelected}
                                                onChange={() => toggleCompetence(comp.id)}
                                                type="checkbox"
                                            />
                                        </div>
                                        {isSelected ? (
                                            <select
                                                onChange={(e) => updateCompetenceNiveau(comp.id, e.target.value)}
                                                style={{ height: '32px', fontSize: '12px' }}
                                                value={selectedObj.niveau_requis ?? 'Intermediaire'}
                                            >
                                                <option value="Debutant">Debutant</option>
                                                <option value="Intermediaire">Intermediaire</option>
                                                <option value="Avance">Avance</option>
                                                <option value="Expert">Expert</option>
                                            </select>
                                        ) : null}
                                    </div>
                                );
                            })}
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
        </div>
    );
}
