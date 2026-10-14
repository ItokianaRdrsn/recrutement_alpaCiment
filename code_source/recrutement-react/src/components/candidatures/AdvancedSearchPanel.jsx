import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getJson } from '../../api/client';

export default function AdvancedSearchPanel({
    filters = {},
    onChange,
    onReset,
    onApply,
    isExpandedDefault = false,
    competencesList: propCompetencesList = null,
}) {
    const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
    const [competencesList, setCompetencesList] = useState(
        Array.isArray(propCompetencesList) && propCompetencesList.length > 0 ? propCompetencesList : []
    );
    const [compInput, setCompInput] = useState('');
    const [showCompDropdown, setShowCompDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Synchronisation si le prop competencesList arrive ou est mis à jour
    useEffect(() => {
        if (Array.isArray(propCompetencesList) && propCompetencesList.length > 0) {
            setCompetencesList(propCompetencesList);
        }
    }, [propCompetencesList]);

    // États locaux temporisés (debounce) pour la saisie fluide sans marteler l'API
    const [cvKeywordLocal, setCvKeywordLocal] = useState(filters.cv_keyword || '');
    const [posteKeywordLocal, setPosteKeywordLocal] = useState(filters.poste_keyword || '');

    useEffect(() => {
        setCvKeywordLocal(filters.cv_keyword || '');
    }, [filters.cv_keyword]);

    useEffect(() => {
        setPosteKeywordLocal(filters.poste_keyword || '');
    }, [filters.poste_keyword]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (cvKeywordLocal !== (filters.cv_keyword || '')) {
                handleFilterChange('cv_keyword', cvKeywordLocal);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [cvKeywordLocal]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (posteKeywordLocal !== (filters.poste_keyword || '')) {
                handleFilterChange('poste_keyword', posteKeywordLocal);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [posteKeywordLocal]);

    // Charger le référentiel des compétences uniquement si non fourni par le parent
    useEffect(() => {
        if (Array.isArray(propCompetencesList) && propCompetencesList.length > 0) return;
        let isMounted = true;
        async function fetchCompetences() {
            try {
                const res = await getJson('/api/competences');
                const raw = res?.data?.competences ?? (Array.isArray(res?.data) ? res.data : []);
                if (isMounted) {
                    setCompetencesList(Array.isArray(raw) ? raw : []);
                }
            } catch (err) {
                console.error('Erreur chargement référentiel compétences:', err);
            }
        }
        fetchCompetences();
        return () => {
            isMounted = false;
        };
    }, [propCompetencesList]);

    // Fermer le dropdown d'autocomplétion en cas de clic extérieur
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowCompDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Compétences actuellement sélectionnées (tableau d'IDs ou noms)
    const selectedCompIds = useMemo(() => {
        if (!filters.competences) return [];
        if (Array.isArray(filters.competences)) return filters.competences.map(String);
        return String(filters.competences)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }, [filters.competences]);

    // Liste des objets compétences sélectionnés pour affichage des tags
    const selectedCompObjects = useMemo(() => {
        return selectedCompIds.map((idOrName) => {
            const found = competencesList.find(
                (c) => String(c.id_competence) === String(idOrName) || c.nom_competence?.toLowerCase() === idOrName.toLowerCase()
            );
            return found || { id_competence: idOrName, nom_competence: idOrName };
        });
    }, [selectedCompIds, competencesList]);

    // Suggestions filtrées pour le dropdown d'ajout de compétence
    const filteredCompSuggestions = useMemo(() => {
        if (!compInput.trim()) return competencesList.slice(0, 10);
        const q = compInput.toLowerCase().trim();
        return competencesList
            .filter((c) => {
                const name = (c.nom_competence || '').toLowerCase();
                const type = (c.type?.libelle || '').toLowerCase();
                const alreadySelected = selectedCompIds.includes(String(c.id_competence));
                return !alreadySelected && (name.includes(q) || type.includes(q));
            })
            .slice(0, 12);
    }, [compInput, competencesList, selectedCompIds]);

    // Calcul du nombre de filtres avancés actifs
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.cv_keyword?.trim()) count++;
        if (selectedCompIds.length > 0) count++;
        if (filters.niveau_etude?.trim()) count++;
        if (filters.annees_exp_min && Number(filters.annees_exp_min) > 0) count++;
        if (filters.poste_keyword?.trim()) count++;
        return count;
    }, [filters, selectedCompIds]);

    const handleFilterChange = (key, value) => {
        if (onChange) {
            onChange({
                ...filters,
                [key]: value,
            });
        }
    };

    const handleApply = () => {
        const nextFilters = {
            ...filters,
            cv_keyword: cvKeywordLocal,
            poste_keyword: posteKeywordLocal,
        };
        if (onChange) {
            onChange(nextFilters);
        }
        if (onApply) {
            onApply(nextFilters);
        }
    };

    const handleAddCompetence = (comp) => {
        const idToAdd = String(comp.id_competence ?? comp.nom_competence);
        if (!selectedCompIds.includes(idToAdd)) {
            const newComps = [...selectedCompIds, idToAdd];
            handleFilterChange('competences', newComps.join(','));
        }
        setCompInput('');
        setShowCompDropdown(false);
    };

    const handleRemoveCompetence = (idToRemove) => {
        const newComps = selectedCompIds.filter((id) => id !== String(idToRemove));
        handleFilterChange('competences', newComps.join(','));
    };

    const handleResetAll = () => {
        setCvKeywordLocal('');
        setPosteKeywordLocal('');
        if (onReset) {
            onReset();
        } else if (onChange) {
            onChange({
                ...filters,
                cv_keyword: '',
                competences: '',
                competence_mode: 'any',
                niveau_etude: '',
                annees_exp_min: '',
                poste_keyword: '',
            });
        }
    };

    return (
        <div className="advanced-search-container" style={{ marginBottom: '14px' }}>
            {/* Barre de toggle du panneau */}
            <div
                className="advanced-search-header"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    backgroundColor: isExpanded ? '#fff1f0' : '#f8fafc',
                    border: `1px solid ${isExpanded ? '#fecaca' : '#e2e8f0'}`,
                    borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px' }}>🔍</span>
                    <span style={{ fontSize: '12.5px', fontWeight: '600', color: isExpanded ? '#b91c1c' : '#334155' }}>
                        Recherche avancée CV & Compétences
                    </span>
                    {activeFiltersCount > 0 && (
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '1px 7px',
                                fontSize: '11px',
                                fontWeight: '700',
                                borderRadius: '10px',
                                backgroundColor: '#FF0D00',
                                color: '#fff',
                            }}
                        >
                            {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {activeFiltersCount > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleResetAll();
                            }}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#ef4444',
                                fontSize: '11.5px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                textDecoration: 'underline',
                            }}
                        >
                            Réinitialiser
                        </button>
                    )}
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {isExpanded ? '▲ Réduire' : '▼ Déplier'}
                    </span>
                </div>
            </div>

            {/* Contenu déployé du panneau */}
            {isExpanded && (
                <div
                    className="advanced-search-body"
                    style={{
                        padding: '12px 14px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #fecaca',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}
                >
                    {/* Grille des critères */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                            gap: '12px',
                        }}
                    >
                        {/* 1. Mot-clé plein texte dans le CV */}
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '11.5px',
                                    fontWeight: '600',
                                    color: '#475569',
                                    marginBottom: '4px',
                                }}
                            >
                                📄 Mot-clé plein texte dans le CV
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Ex: broyeur, maintenance, béton, SAP..."
                                    value={cvKeywordLocal}
                                    onChange={(e) => setCvKeywordLocal(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleApply();
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '7px 9px',
                                        fontSize: '12px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                                {cvKeywordLocal && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCvKeywordLocal('');
                                            handleFilterChange('cv_keyword', '');
                                        }}
                                        style={{
                                            position: 'absolute',
                                            right: '6px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                        }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <span style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', display: 'block' }}>
                                Recherche directement dans le texte extrait (OCR) du CV avec surbrillance d'extrait.
                            </span>
                        </div>

                        {/* 2. Poste / Métier souhaité ou exercé */}
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '11.5px',
                                    fontWeight: '600',
                                    color: '#475569',
                                    marginBottom: '4px',
                                }}
                            >
                                💼 Métier / Poste
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: Électromécanicien, Chef de projet..."
                                value={posteKeywordLocal}
                                onChange={(e) => setPosteKeywordLocal(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleApply();
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '7px 9px',
                                    fontSize: '12px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* 3. Niveau d'études minimum */}
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '11.5px',
                                    fontWeight: '600',
                                    color: '#475569',
                                    marginBottom: '4px',
                                }}
                            >
                                🎓 Niveau d'études & Diplôme
                            </label>
                            <select
                                value={filters.niveau_etude || ''}
                                onChange={(e) => handleFilterChange('niveau_etude', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '7px 9px',
                                    fontSize: '12px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    backgroundColor: '#fff',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <option value="">Tous niveaux</option>
                                <option value="CAP">CAP / BEP</option>
                                <option value="Bac">Baccalauréat</option>
                                <option value="Bac+2">Bac+2 (BTS, DUT)</option>
                                <option value="Bac+3">Bac+3 (Licence)</option>
                                <option value="Bac+4">Bac+4 (Master 1)</option>
                                <option value="Bac+5">Bac+5 (Master 2, Ingénieur)</option>
                                <option value="Bac+8">Bac+8 (Doctorat)</option>
                            </select>
                        </div>

                        {/* 4. Années d'expérience minimum */}
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '11.5px',
                                    fontWeight: '600',
                                    color: '#475569',
                                    marginBottom: '4px',
                                }}
                            >
                                ⏳ Expérience cumulée minimum
                            </label>
                            <select
                                value={filters.annees_exp_min || ''}
                                onChange={(e) => handleFilterChange('annees_exp_min', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '7px 9px',
                                    fontSize: '12px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    backgroundColor: '#fff',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <option value="">Toutes durées</option>
                                <option value="1">Au moins 1 an</option>
                                <option value="2">Au moins 2 ans</option>
                                <option value="3">Au moins 3 ans</option>
                                <option value="5">Au moins 5 ans (Senior)</option>
                                <option value="10">Au moins 10 ans (Expert)</option>
                            </select>
                        </div>
                    </div>

                    {/* Section Sélection Compétences avec Tags et Mode OU / ET */}
                    <div
                        style={{
                            padding: '10px 12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                                flexWrap: 'wrap',
                                gap: '8px',
                            }}
                        >
                            <label
                                style={{
                                    fontSize: '11.5px',
                                    fontWeight: '600',
                                    color: '#334155',
                                }}
                            >
                                🏷️ Compétences requises
                            </label>

                            {/* Mode de correspondance : OU vs ET */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>Mode :</span>
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange('competence_mode', 'any')}
                                    style={{
                                        padding: '2px 8px',
                                        fontSize: '11px',
                                        borderRadius: '4px',
                                        border: '1px solid #cbd5e1',
                                        backgroundColor:
                                            (filters.competence_mode || 'any') === 'any' ? '#e2e8f0' : '#ffffff',
                                        fontWeight: (filters.competence_mode || 'any') === 'any' ? '700' : '400',
                                        color: (filters.competence_mode || 'any') === 'any' ? '#0f172a' : '#64748b',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Au moins une (OU)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange('competence_mode', 'all')}
                                    style={{
                                        padding: '2px 8px',
                                        fontSize: '11px',
                                        borderRadius: '4px',
                                        border: '1px solid #cbd5e1',
                                        backgroundColor:
                                            filters.competence_mode === 'all' ? '#e2e8f0' : '#ffffff',
                                        fontWeight: filters.competence_mode === 'all' ? '700' : '400',
                                        color: filters.competence_mode === 'all' ? '#0f172a' : '#64748b',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Toutes requises (ET)
                                </button>
                            </div>
                        </div>

                        {/* Autocomplétion et ajout de compétence */}
                        <div style={{ position: 'relative', marginBottom: '8px' }} ref={dropdownRef}>
                            <input
                                type="text"
                                placeholder="Rechercher et ajouter une compétence (ex: Python, Électricité, Soudure...)"
                                value={compInput}
                                onFocus={() => setShowCompDropdown(true)}
                                onChange={(e) => {
                                    setCompInput(e.target.value);
                                    setShowCompDropdown(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && compInput.trim()) {
                                        e.preventDefault();
                                        handleAddCompetence({ id_competence: compInput.trim(), nom_competence: compInput.trim() });
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '7px 9px',
                                    fontSize: '12px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    backgroundColor: '#fff',
                                    boxSizing: 'border-box',
                                }}
                            />

                            {showCompDropdown && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        zIndex: 40,
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        marginTop: '3px',
                                        maxHeight: '180px',
                                        overflowY: 'auto',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    {filteredCompSuggestions.length > 0 ? (
                                        filteredCompSuggestions.map((comp) => (
                                            <div
                                                key={comp.id_competence || comp.nom_competence}
                                                onClick={() => handleAddCompetence(comp)}
                                                style={{
                                                    padding: '6px 10px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    borderBottom: '1px solid #f1f5f9',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                                            >
                                                <span style={{ fontWeight: '500', color: '#1e293b' }}>
                                                    {comp.nom_competence}
                                                </span>
                                                {comp.type?.libelle && (
                                                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                                                        {comp.type.libelle}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div
                                            style={{
                                                padding: '8px 10px',
                                                fontSize: '11.5px',
                                                color: '#64748b',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => {
                                                if (compInput.trim()) {
                                                    handleAddCompetence({ id_competence: compInput.trim(), nom_competence: compInput.trim() });
                                                }
                                            }}
                                        >
                                            Ajouter <strong>"{compInput}"</strong> comme critère libre
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tags des compétences sélectionnées */}
                        {selectedCompObjects.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {selectedCompObjects.map((comp) => (
                                    <span
                                        key={comp.id_competence}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '3px 8px',
                                            backgroundColor: '#fee2e2',
                                            border: '1px solid #fca5a5',
                                            color: '#991b1b',
                                            borderRadius: '14px',
                                            fontSize: '11.5px',
                                            fontWeight: '600',
                                        }}
                                    >
                                        {comp.nom_competence}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCompetence(comp.id_competence)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                color: '#991b1b',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                padding: '0 2px',
                                                fontWeight: 'bold',
                                                lineHeight: 1,
                                            }}
                                            title="Retirer cette compétence"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                                Aucune compétence sélectionnée (tous profils inclus).
                            </span>
                        )}
                    </div>

                    {/* Barre de boutons d'action du bas */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            marginTop: '2px',
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleResetAll}
                            style={{
                                padding: '6px 12px',
                                fontSize: '11.5px',
                                color: '#475569',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: '500',
                            }}
                        >
                            Réinitialiser
                        </button>
                        {onApply && (
                            <button
                                type="button"
                                onClick={handleApply}
                                style={{
                                    padding: '6px 14px',
                                    fontSize: '11.5px',
                                    color: '#ffffff',
                                    backgroundColor: '#FF0D00',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                }}
                            >
                                Appliquer les filtres
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
