import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Plus, RefreshCw } from 'lucide-react';
import { getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { Pagination } from '../components/common/Pagination';
import { RowActions } from '../components/common/RowActions';
import { SimpleTable } from '../components/common/SimpleTable';
import { CompetenceModal } from '../components/modals/CompetenceModal';
import { DirectionModal } from '../components/modals/DirectionModal';
import { DomaineModal } from '../components/modals/DomaineModal';

export function ReferentialsView({ canManage, competencesData, initialSubTab = 'all', onRefreshBase }) {
    const [subTab, setSubTab] = useState(initialSubTab);
    const [directions, setDirections] = useState([]);
    const [domaines, setDomaines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDirectionModal, setShowDirectionModal] = useState(false);
    const [showDomaineModal, setShowDomaineModal] = useState(false);
    const [showCompetenceModal, setShowCompetenceModal] = useState(false);

    const [dirPage, setDirPage] = useState(1);
    const [domPage, setDomPage] = useState(1);
    const [compPage, setCompPage] = useState(1);
    const perPage = 10;

    useEffect(() => {
        setSubTab(initialSubTab);
    }, [initialSubTab]);

    const loadReferentials = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [directionsResponse, domainesResponse] = await Promise.all([
                getJson('/api/directions?per_page=50'),
                getJson('/api/domaines?per_page=50'),
            ]);

            setDirections(directionsResponse?.data ?? []);
            setDomaines(domainesResponse?.data ?? []);
            if (onRefreshBase) {
                await onRefreshBase();
            }
        } catch (caughtError) {
            setError(caughtError.message);
        } finally {
            setLoading(false);
        }
    }, [onRefreshBase]);

    useEffect(() => {
        loadReferentials();
    }, [loadReferentials]);

    async function deleteDirection(direction) {
        const confirmed = window.confirm(`Supprimer la direction "${direction.nom_direction}" ?`);
        if (!confirmed) return;

        try {
            await sendJson(`/api/direction/${direction.id}`, { method: 'DELETE' });
            await loadReferentials();
        } catch (caughtError) {
            setError(caughtError.message);
        }
    }

    async function validateDomaine(domaine) {
        try {
            await sendJson(`/api/domaine/${domaine.id}/valider`, { method: 'PATCH' });
            await loadReferentials();
        } catch (caughtError) {
            setError(caughtError.message);
        }
    }

    async function deleteDomaine(domaine) {
        const confirmed = window.confirm(`Supprimer le domaine "${domaine.nom_domaine}" ?`);
        if (!confirmed) return;

        try {
            await sendJson(`/api/domaines/${domaine.id}`, { method: 'DELETE' });
            await loadReferentials();
        } catch (caughtError) {
            setError(caughtError.message);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    return (
        <div className="view-stack">
            {error ? <ErrorState message={error} onRetry={loadReferentials} /> : null}

            {/* Sub-menu navigation for Referentials */}
            <div className="sub-nav-tabs">
                <button
                    className={`sub-nav-tab ${subTab === 'all' ? 'active' : ''}`}
                    onClick={() => setSubTab('all')}
                    type="button"
                >
                    Tous les referentiels
                </button>
                <button
                    className={`sub-nav-tab ${subTab === 'directions' ? 'active' : ''}`}
                    onClick={() => setSubTab('directions')}
                    type="button"
                >
                    Directions ({directions.length})
                </button>
                <button
                    className={`sub-nav-tab ${subTab === 'domaines' ? 'active' : ''}`}
                    onClick={() => setSubTab('domaines')}
                    type="button"
                >
                    Domaines ({domaines.length})
                </button>
                <button
                    className={`sub-nav-tab ${subTab === 'competences' ? 'active' : ''}`}
                    onClick={() => setSubTab('competences')}
                    type="button"
                >
                    Competences ({competencesData.competences?.length ?? 0})
                </button>
            </div>

            {(subTab === 'all' || subTab === 'directions' || subTab === 'domaines') ? (
                <section className="management-grid">
                    {(subTab === 'all' || subTab === 'directions') ? (
                        <div className="data-section">
                            <div className="section-heading">
                                <div>
                                    <h2>Directions</h2>
                                    <p>{directions.length} direction(s)</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {canManage ? (
                                        <button
                                            onClick={() => setShowDirectionModal({ direction: null })}
                                            style={{
                                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 14px',
                                                fontWeight: '600',
                                                fontSize: '13px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
                                                cursor: 'pointer',
                                            }}
                                            type="button"
                                        >
                                            <Plus size={16} />
                                            <span>Nouvelle Direction</span>
                                        </button>
                                    ) : null}
                                    <button className="ghost-button" onClick={loadReferentials} type="button">
                                        <RefreshCw aria-hidden="true" size={17} />
                                        <span>Actualiser</span>
                                    </button>
                                </div>
                            </div>

                            <SimpleTable
                                columns={['Direction', 'Domaines', 'Offres', 'Actions']}
                                emptyLabel="Aucune direction."
                                rows={directions.slice((dirPage - 1) * perPage, dirPage * perPage).map((direction) => [
                                    <strong>{direction.nom_direction}</strong>,
                                    direction.domaines_count ?? 0,
                                    direction.offres_count ?? 0,
                                    canManage ? (
                                        <RowActions
                                            onDelete={() => deleteDirection(direction)}
                                            onEdit={() => setShowDirectionModal({ direction })}
                                        />
                                    ) : (
                                        '-'
                                    ),
                                ])}
                            />
                            <Pagination
                                meta={{ current_page: dirPage, last_page: Math.ceil(directions.length / perPage) || 1, total: directions.length }}
                                onChangePage={(p) => setDirPage(p)}
                                perPage={perPage}
                            />
                        </div>
                    ) : null}

                    {(subTab === 'all' || subTab === 'domaines') ? (
                        <div className="data-section">
                            <div className="section-heading">
                                <div>
                                    <h2>Domaines</h2>
                                    <p>{domaines.filter((domaine) => !domaine.valide).length} en attente</p>
                                </div>
                                {canManage ? (
                                    <button
                                        onClick={() => setShowDomaineModal({ domaine: null })}
                                        style={{
                                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 14px',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
                                            cursor: 'pointer',
                                        }}
                                        type="button"
                                    >
                                        <Plus size={16} />
                                        <span>Nouveau Domaine</span>
                                    </button>
                                ) : null}
                            </div>

                            <SimpleTable
                                columns={['Domaine', 'Direction', 'Statut', 'Actions']}
                                emptyLabel="Aucun domaine."
                                rows={domaines.slice((domPage - 1) * perPage, domPage * perPage).map((domaine) => [
                                    <strong>{domaine.nom_domaine}</strong>,
                                    domaine.direction?.nom ?? '-',
                                    <span className={domaine.valide ? 'status-pill success' : 'status-pill warning'}>
                                        {domaine.valide ? 'Valide' : 'En attente'}
                                    </span>,
                                    canManage ? (
                                        <RowActions
                                            extra={
                                                !domaine.valide ? (
                                                    <button className="row-button success" onClick={() => validateDomaine(domaine)} title="Valider" type="button">
                                                        <CheckCircle2 aria-hidden="true" size={16} />
                                                    </button>
                                                ) : null
                                            }
                                            onDelete={() => deleteDomaine(domaine)}
                                            onEdit={() => setShowDomaineModal({ domaine })}
                                        />
                                    ) : (
                                        '-'
                                    ),
                                ])}
                            />
                            <Pagination
                                meta={{ current_page: domPage, last_page: Math.ceil(domaines.length / perPage) || 1, total: domaines.length }}
                                onChangePage={(p) => setDomPage(p)}
                                perPage={perPage}
                            />
                        </div>
                    ) : null}
                </section>
            ) : null}

            {(subTab === 'all' || subTab === 'competences') ? (
                <section className="data-section">
                    <div className="section-heading">
                        <div>
                            <h2>Referentiel des Competences</h2>
                            <p>{competencesData.competences?.length ?? 0} competence(s) enregistree(s)</p>
                        </div>
                        {canManage ? (
                            <button
                                onClick={() => setShowCompetenceModal({ competence: null })}
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 14px',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
                                    cursor: 'pointer',
                                }}
                                type="button"
                            >
                                <Plus size={16} />
                                <span>Nouvelle Compétence</span>
                            </button>
                        ) : null}
                    </div>

                    <SimpleTable
                        columns={['Competence', 'Type', 'Statut']}
                        emptyLabel="Aucune competence enregistree."
                        rows={(competencesData.competences ?? []).slice((compPage - 1) * perPage, compPage * perPage).map((c) => [
                            <strong>{c.nom}</strong>,
                            <span className="badge">{c.type ?? 'Technique'}</span>,
                            <span className="badge green">Actif</span>,
                        ])}
                    />
                    <Pagination
                        meta={{
                            current_page: compPage,
                            last_page: Math.ceil((competencesData.competences?.length ?? 0) / perPage) || 1,
                            total: competencesData.competences?.length ?? 0,
                        }}
                        onChangePage={(p) => setCompPage(p)}
                        perPage={perPage}
                    />
                </section>
            ) : null}

            {showDirectionModal ? (
                <DirectionModal
                    direction={showDirectionModal.direction}
                    onClose={() => setShowDirectionModal(false)}
                    onSuccess={loadReferentials}
                />
            ) : null}

            {showDomaineModal ? (
                <DomaineModal
                    directionsList={directions}
                    domaine={showDomaineModal.domaine}
                    onClose={() => setShowDomaineModal(false)}
                    onSuccess={loadReferentials}
                />
            ) : null}

            {showCompetenceModal ? (
                <CompetenceModal
                    competence={showCompetenceModal.competence}
                    onClose={() => setShowCompetenceModal(false)}
                    onSuccess={loadReferentials}
                    typesList={competencesData.types ?? []}
                />
            ) : null}
        </div>
    );
}
