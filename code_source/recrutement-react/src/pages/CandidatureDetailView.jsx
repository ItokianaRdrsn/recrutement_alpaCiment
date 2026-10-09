import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    BookmarkCheck,
    BriefcaseBusiness,
    CalendarDays,
    Check,
    CheckCircle2,
    Cpu,
    Download,
    Edit3,
    FileText,
    FolderGit2,
    GraduationCap,
    Layers,
    Lock,
    Mail,
    Plus,
    Printer,
    Save,
    Search,
    Send,
    Sparkles,
    User,
    X,
} from 'lucide-react';
import { backendPath, getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { CompetenceModal } from '../components/modals/CompetenceModal';
import { RendezVousModal } from '../components/modals/RendezVousModal';
import { EnvoyerMessageModal } from '../components/modals/EnvoyerMessageModal';
import { formatDate } from '../utils/formatters';

export function CandidatureDetailView({ idCandidature, onBack, onRefreshList, statutsList, referentiels }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('informations'); // 'informations', 'documents', 'historique_statuts', 'communications', 'rendez_vous'
    const [targetStatusId, setTargetStatusId] = useState(null);
    const [commentaire, setCommentaire] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [updatingVivier, setUpdatingVivier] = useState(false);

    // Rendez-vous / Entretiens
    const [rendezVousList, setRendezVousList] = useState([]);
    const [loadingRdv, setLoadingRdv] = useState(false);
    const [rdvModalOpen, setRdvModalOpen] = useState(false);
    const [selectedRdv, setSelectedRdv] = useState(null);

    // Communications / Emails
    const [communicationsList, setCommunicationsList] = useState([]);
    const [loadingCommunications, setLoadingCommunications] = useState(false);
    const [messageModalOpen, setMessageModalOpen] = useState(false);

    // Extraction OCR
    const [ocrExtracting, setOcrExtracting] = useState(false);
    const [ocrData, setOcrData] = useState(null);
    const [ocrSuccessMsg, setOcrSuccessMsg] = useState('');
    const [ocrCommentaireRh, setOcrCommentaireRh] = useState('');
    const [isEditingOcr, setIsEditingOcr] = useState(false);
    const [statusSuccessMsg, setStatusSuccessMsg] = useState('');

    // Profil candidat RH (Compétences, Expériences, Formations)
    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [allCompetences, setAllCompetences] = useState([]);
    const [compSearchQuery, setCompSearchQuery] = useState('');
    const [showCompetenceCreateModal, setShowCompetenceCreateModal] = useState(false);
    const [newComp, setNewComp] = useState({ id_competence: '', niveau: 'Intermédiaire' });
    const [newExp, setNewExp] = useState({ intitule_poste: '', entreprise: '', date_debut: '', date_fin: '', description: '' });
    const [newProj, setNewProj] = useState({ titre_projet: '', role: '', technologies: '', url_projet: '', date_debut: '', date_fin: '', description: '' });
    const [newForm, setNewForm] = useState({ diplome: '', etablissement: '', annee_obtention: '', domaine_etude: '', id_niveau: '', niveau: '' });
    const [profileMsg, setProfileMsg] = useState('');

    const fallbackNiveaux = useMemo(() => [
        { id_niveau: 1, libelle: 'CAP / BEP' },
        { id_niveau: 2, libelle: 'Baccalauréat' },
        { id_niveau: 3, libelle: 'Bac+2' },
        { id_niveau: 4, libelle: 'Bac+3' },
        { id_niveau: 5, libelle: 'Bac+4' },
        { id_niveau: 6, libelle: 'Bac+5' },
        { id_niveau: 7, libelle: 'Bac+8' },
    ], []);

    const niveauxList = useMemo(() => (
        referentiels?.niveaux?.length ? referentiels.niveaux : fallbackNiveaux
    ), [referentiels?.niveaux, fallbackNiveaux]);

    const filteredCompsInDetail = useMemo(() => {
        const list = allCompetences;
        if (!compSearchQuery.trim()) return list;
        const q = compSearchQuery.toLowerCase().trim();
        return list.filter((c) => {
            const name = (c.nom_competence ?? c.nom ?? '').toLowerCase();
            const type = (c.type?.libelle ?? c.type ?? '').toLowerCase();
            return name.includes(q) || type.includes(q);
        });
    }, [allCompetences, compSearchQuery]);

    const effectiveSelectedCompId = useMemo(() => {
        if (newComp.id_competence) {
            const exists = filteredCompsInDetail.some((c) => String(c.id_competence ?? c.id) === String(newComp.id_competence));
            if (exists) return newComp.id_competence;
        }
        if (filteredCompsInDetail.length > 0) {
            return String(filteredCompsInDetail[0].id_competence ?? filteredCompsInDetail[0].id);
        }
        return '';
    }, [filteredCompsInDetail, newComp.id_competence]);

    const loadDetails = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const res = await getJson(`/api/candidature/${idCandidature}`);
            const data = res?.data ?? null;
            setDetails(data);
            if (data?.statut?.id_statut_candidature) {
                setTargetStatusId(data.statut.id_statut_candidature);
            }
            if (data?.cv_extraction_ocr) {
                setOcrData({
                    texte_brut: data.cv_extraction_ocr.texte_brut_ocr,
                    donnees_json: data.cv_extraction_ocr.donnees_json,
                    competences: data.cv_extraction_ocr.donnees_json?.competences ?? [],
                    experiences: data.cv_extraction_ocr.donnees_json?.experiences ?? [],
                    formations: data.cv_extraction_ocr.donnees_json?.formations ?? [],
                    projets: data.cv_extraction_ocr.donnees_json?.projets ?? [],
                    contact: data.cv_extraction_ocr.donnees_json?.contact ?? null,
                    profil: data.cv_extraction_ocr.donnees_json?.profil ?? null,
                    statut_validation: data.cv_extraction_ocr.statut_validation ?? 'en_attente',
                    commentaire_rh: data.cv_extraction_ocr.commentaire_rh ?? '',
                });
                setOcrCommentaireRh(data.cv_extraction_ocr.commentaire_rh ?? '');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [idCandidature]);

    useEffect(() => {
        loadDetails();
    }, [loadDetails]);

    const loadCandidateProfile = useCallback(async (targetId) => {
        if (!targetId) return;
        setLoadingProfile(true);
        try {
            const [profileRes, compRes] = await Promise.all([
                getJson(`/api/candidature/${targetId}/profile`),
                getJson('/api/competences'),
            ]);
            setProfileData(profileRes?.data ?? null);
            const compList = compRes?.data?.competences ?? (Array.isArray(compRes?.data) ? compRes.data : (Array.isArray(compRes) ? compRes : []));
            setAllCompetences(Array.isArray(compList) ? compList : []);
        } catch (err) {
            console.error('Erreur chargement profil candidature:', err);
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    const loadRendezVous = useCallback(async (targetId) => {
        if (!targetId) return;
        setLoadingRdv(true);
        try {
            const res = await getJson(`/api/rendez-vous?id_candidature=${targetId}`);
            if (res?.data) {
                setRendezVousList(res.data);
            }
        } catch (err) {
            console.error('Erreur chargement rendez-vous candidature:', err);
        } finally {
            setLoadingRdv(false);
        }
    }, []);

    const loadCommunications = useCallback(async (targetId) => {
        if (!targetId) return;
        setLoadingCommunications(true);
        try {
            const res = await getJson(`/api/candidature/${targetId}/communications`);
            if (res?.data) {
                setCommunicationsList(res.data);
            }
        } catch (err) {
            console.error('Erreur chargement communications candidature:', err);
        } finally {
            setLoadingCommunications(false);
        }
    }, []);

    useEffect(() => {
        if (idCandidature) {
            loadCandidateProfile(idCandidature);
            loadRendezVous(idCandidature);
            loadCommunications(idCandidature);
        } else if (details?.id_candidature) {
            loadCandidateProfile(details.id_candidature);
            loadRendezVous(details.id_candidature);
            loadCommunications(details.id_candidature);
        }
    }, [idCandidature, details?.id_candidature, loadCandidateProfile, loadRendezVous, loadCommunications]);

    async function handleAddCompetence(e) {
        e.preventDefault();
        const targetId = idCandidature || details?.id_candidature;
        const targetCompId = newComp.id_competence || effectiveSelectedCompId;
        if (!targetId || !targetCompId) return;
        setProfileMsg('');
        try {
            await sendJson(`/api/candidature/${targetId}/competences`, {
                body: {
                    id_competence: Number(targetCompId),
                    niveau: newComp.niveau,
                },
            });
            setNewComp({ id_competence: '', niveau: 'Intermédiaire' });
            setCompSearchQuery('');
            setProfileMsg('Compétence ajoutée à la candidature !');
            await loadCandidateProfile(targetId);
        } catch (err) {
            setError(err.message);
        }
    }

    const handleCompetenceCreated = (createdComp) => {
        setShowCompetenceCreateModal(false);
        if (createdComp) {
            setAllCompetences((prev) => [...prev, createdComp]);
            setNewComp((curr) => ({ ...curr, id_competence: String(createdComp.id_competence ?? createdComp.id) }));
        }
        const targetId = idCandidature || details?.id_candidature;
        if (targetId) {
            loadCandidateProfile(targetId);
        }
    };

    async function handleAddExperience(e) {
        e.preventDefault();
        const targetId = idCandidature || details?.id_candidature;
        if (!targetId || !newExp.intitule_poste) return;
        setProfileMsg('');
        try {
            await sendJson(`/api/candidature/${targetId}/experiences`, {
                body: newExp,
            });
            setNewExp({ intitule_poste: '', entreprise: '', date_debut: '', date_fin: '', description: '' });
            setProfileMsg('Expérience ajoutée à la candidature !');
            await loadCandidateProfile(targetId);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAddProjet(e) {
        e.preventDefault();
        const targetId = idCandidature || details?.id_candidature;
        if (!targetId || !newProj.titre_projet) return;
        setProfileMsg('');
        try {
            await sendJson(`/api/candidature/${targetId}/projets`, {
                body: newProj,
            });
            setNewProj({ titre_projet: '', role: '', technologies: '', url_projet: '', date_debut: '', date_fin: '', description: '' });
            setProfileMsg('Projet / Réalisation ajouté(e) à la candidature !');
            await loadCandidateProfile(targetId);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAddFormation(e) {
        e.preventDefault();
        const targetId = idCandidature || details?.id_candidature;
        if (!targetId || !newForm.diplome) return;
        setProfileMsg('');
        try {
            await sendJson(`/api/candidature/${targetId}/formations`, {
                body: newForm,
            });
            setNewForm({ diplome: '', etablissement: '', annee_obtention: '', domaine_etude: '', id_niveau: '', niveau: '' });
            setProfileMsg('Diplôme/Formation ajouté(e) à la candidature !');
            await loadCandidateProfile(targetId);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleExtractOcr() {
        setOcrExtracting(true);
        setOcrSuccessMsg('');
        try {
            const res = await sendJson(`/api/candidature/${idCandidature}/ocr/extract`, { method: 'POST' });
            setOcrData(res?.data?.donnees_json ?? null);
            setOcrSuccessMsg('Extraction PaddleOCR & IA effectuée avec succès !');
        } catch (err) {
            setError(err.message);
        } finally {
            setOcrExtracting(false);
        }
    }

    async function handleValidateOcr(statusVal) {
        if (!ocrData) return;
        try {
            setError('');
            const res = await sendJson(`/api/candidature/${idCandidature}/ocr/validate`, {
                body: {
                    statut_validation: statusVal,
                    commentaire_rh: ocrCommentaireRh.trim() || null,
                    competences: ocrData.competences ?? [],
                    experiences: ocrData.experiences ?? [],
                    formations: ocrData.formations ?? [],
                    projets: ocrData.projets ?? [],
                },
            });
            const actionLabel = statusVal === 'valide' 
                ? 'validées et intégrées au profil' 
                : statusVal === 'corrige' 
                    ? 'corrigées et enregistrées' 
                    : 'rejetées';
            setOcrSuccessMsg(`Données du CV ${actionLabel} avec succès !`);
            setIsEditingOcr(false);
            setOcrData((prev) => ({
                ...prev,
                statut_validation: statusVal,
                commentaire_rh: ocrCommentaireRh,
            }));
            if (details?.id_candidat) {
                await loadCandidateProfile(details.id_candidat);
            }
        } catch (err) {
            setError(err.message);
        }
    }

    function removeExtractedComp(index) {
        setOcrData((prev) => {
            const list = [...(prev.competences ?? [])];
            list.splice(index, 1);
            return { ...prev, competences: list };
        });
    }

    function removeExtractedExp(index) {
        setOcrData((prev) => {
            const list = [...(prev.experiences ?? [])];
            list.splice(index, 1);
            return { ...prev, experiences: list };
        });
    }

    function removeExtractedProj(index) {
        setOcrData((prev) => {
            const list = [...(prev.projets ?? [])];
            list.splice(index, 1);
            return { ...prev, projets: list };
        });
    }

    function removeExtractedForm(index) {
        setOcrData((prev) => {
            const list = [...(prev.formations ?? [])];
            list.splice(index, 1);
            return { ...prev, formations: list };
        });
    }

    async function handleStatusSubmit(e) {
        e.preventDefault();
        if (!targetStatusId || targetStatusId === details?.id_statut_candidature) return;

        setUpdatingStatus(true);
        setStatusSuccessMsg('');
        setError('');

        try {
            await sendJson(`/api/candidature/${idCandidature}/statut`, {
                method: 'PATCH',
                body: {
                    id_statut_candidature: Number(targetStatusId),
                    commentaire: commentaire.trim() || null,
                },
            });
            setCommentaire('');
            setStatusSuccessMsg('Statut de la candidature mis à jour avec succès !');
            await loadDetails();
            if (onRefreshList) onRefreshList();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingStatus(false);
        }
    }

    async function handleToggleVivier(targetVivierState) {
        setUpdatingVivier(true);
        setError('');
        try {
            await sendJson(`/api/candidature/${idCandidature}/vivier`, {
                method: 'PATCH',
                body: { dans_vivier: targetVivierState },
            });
            await loadDetails();
            if (onRefreshList) onRefreshList();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingVivier(false);
        }
    }

    const handlePrintPdf = () => {
        if (activeTab !== 'informations') {
            setActiveTab('informations');
            setTimeout(() => {
                window.print();
            }, 150);
        } else {
            window.print();
        }
    };

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadDetails} />;
    }

    if (!details) {
        return <div className="empty-state">Dossier introuvable.</div>;
    }

    const currentStatus = details.statut;
    const currentWorkflowOrder = Number(currentStatus?.ordre_workflow ?? 10);
    const sortedStatuts = [...statutsList].sort((a, b) => Number(a.ordre_workflow) - Number(b.ordre_workflow));

    const photoDoc = (details.documents ?? []).find(
        (d) => d.type_document === 'Photo' || (d.mime_type && d.mime_type.startsWith('image/'))
    );
    const cvDoc = (details.documents ?? []).find(
        (d) => d.type_document === 'CV' || (d.nom_fichier && d.nom_fichier.toLowerCase().includes('cv')) || d.mime_type === 'application/pdf'
    ) || (details.documents ?? []).find((d) => d.id_document !== photoDoc?.id_document);

    return (
        <div className="view-stack">
            {/* EN-TÊTE IMPRESSION PAPIER / PDF OFFICIEL */}
            <div className="print-only-header">
                <div className="print-brand">
                    <img
                        src="/themes/custom/apiqa/images/logo-cut.png"
                        alt="AlpA Ciment"
                        style={{ height: '42px', width: 'auto' }}
                    />
                    <div>
                        <strong style={{ fontSize: '18pt', display: 'block', color: '#0f172a' }}>AlpA Ciment</strong>
                        <span style={{ fontSize: '10pt', color: '#64748b' }}>Direction des Ressources Humaines • Dossier de Candidature</span>
                    </div>
                </div>
                <div className="print-header-meta">
                    <div><strong>Dossier N° :</strong> #{details.id_candidature}</div>
                    <div><strong>Date d'édition :</strong> {new Date().toLocaleDateString('fr-FR')}</div>
                    <div><strong>Statut actuel :</strong> {currentStatus?.libelle ?? 'Reçue'}</div>
                </div>
            </div>

            {/* EN-TÊTE FICHE CANDIDATURE ÉCRAN */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <button className="ghost-button" onClick={onBack} type="button">
                    <ArrowLeft size={18} />
                    <span>Retour aux candidatures</span>
                </button>
                <div className="section-heading-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="filter-button" onClick={handlePrintPdf} style={{ gap: '6px', fontSize: '13px' }} type="button">
                        <Printer size={16} />
                        <span>Exporter en PDF / Imprimer</span>
                    </button>
                    <span className="status-pill success" style={{ fontSize: '14px', padding: '6px 14px' }}>
                        Statut actuel : {currentStatus?.libelle ?? 'Reçue'} 
                    </span>
                </div>
            </div>

            {/* SECTIONS TABS (MASQUÉES À L'IMPRESSION) */}
            <div className="candidature-tabs-header no-print" style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', background: '#fff', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <button
                    className={`ghost-button ${activeTab === 'informations' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('informations')}
                    style={{
                        fontWeight: activeTab === 'informations' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'informations' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <User size={16} />
                    <span>Informations & Profil RH</span>
                </button>

                <button
                    className={`ghost-button ${activeTab === 'documents' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('documents')}
                    style={{
                        fontWeight: activeTab === 'documents' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'documents' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <FileText size={16} />
                    <span>Documents ({details.documents?.length ?? 0})</span>
                </button>

                <button
                    className={`ghost-button ${activeTab === 'historique_statuts' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('historique_statuts')}
                    style={{
                        fontWeight: activeTab === 'historique_statuts' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'historique_statuts' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <CalendarDays size={16} />
                    <span>Parcours ({details.historique?.length ?? 0})</span>
                </button>

                <button
                    className={`ghost-button ${activeTab === 'rendez_vous' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('rendez_vous')}
                    style={{
                        fontWeight: activeTab === 'rendez_vous' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'rendez_vous' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <CalendarDays size={16} />
                    <span>Rendez-vous ({rendezVousList.length})</span>
                </button>

                <button
                    className={`ghost-button ${activeTab === 'communications' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('communications')}
                    style={{
                        fontWeight: activeTab === 'communications' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'communications' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <Send size={16} />
                    <span>Communications ({communicationsList.length})</span>
                </button>

                <button
                    className={`ghost-button ${activeTab === 'extraction_cv' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('extraction_cv')}
                    style={{
                        fontWeight: activeTab === 'extraction_cv' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'extraction_cv' ? '2px solid var(--primary)' : 'none',
                        borderRadius: 0,
                    }}
                    type="button"
                >
                    <Cpu size={16} />
                    <span>Extraction CV</span>
                </button>
            </div>

            {/* TAB INFORMATIONS (INCLUANT TOUTE LA GESTION DES COMPÉTENCES, EXPÉRIENCES ET FORMATIONS) */}
            {activeTab === 'informations' && (
                <div className="candidature-detail-grid">
                    {/* CARTE CANDIDAT & WORKFLOW SIDEBAR GAUCHE */}
                    <div className="data-section candidate-sidebar-card" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div className="candidate-profile-top" style={{ textAlign: 'center', marginBottom: '20px' }}>
                            {photoDoc ? (
                                <img
                                    alt="Photo candidat"
                                    className="candidate-avatar"
                                    src={backendPath(`/storage/${photoDoc.chemin_fichier}`)}
                                    style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', margin: '0 auto' }}
                                />
                            ) : (
                                <div
                                    className="candidate-avatar candidate-avatar-placeholder"
                                    style={{
                                        width: '90px',
                                        height: '90px',
                                        borderRadius: '50%',
                                        background: 'var(--soft-blue)',
                                        color: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto',
                                    }}
                                >
                                    <User size={44} />
                                </div>
                            )}
                            <div className="candidate-name-block">
                                <h2 style={{ fontSize: '19px', margin: '12px 0 4px 0', color: 'var(--text)' }}>
                                    {details.candidat?.prenom} {details.candidat?.nom}
                                </h2>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                                    <span className={`badge ${details.id_type_demande === 2 || !details.id_offre ? 'amber' : 'blue'}`}>
                                        {details.id_type_demande === 2 || !details.id_offre ? 'Spontanée' : 'Sur offre'}
                                    </span>
                                    <span className={`badge ${details.canal_depot === 'rh_manuel' ? 'purple' : 'gray'}`}>
                                        {details.canal_depot === 'rh_manuel' ? 'Saisie RH' : 'Portail Web'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-block candidate-coords-block" style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', gap: '8px' }}>
                            <strong>Coordonnées du candidat</strong>
                            <p style={{ margin: 0, fontSize: '13.5px' }}><strong>Email:</strong> {details.candidat?.email}</p>
                            <p style={{ margin: 0, fontSize: '13.5px' }}><strong>Téléphone:</strong> {details.candidat?.telephone ?? '-'}</p>
                        </div>

                        {/* SECTION 1: WORKFLOW RH DES STATUTS (MASQUÉE À L'IMPRESSION) */}
                        <div className="no-print" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                            <strong style={{ color: 'var(--primary)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                                Progression du Statut RH
                            </strong>
                            
                            {details.dans_vivier ? (
                                <div style={{ background: '#fef3c7', border: '1px solid #fde047', color: '#92400e', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Lock size={14} />
                                    <span>Règle de gestion : statut verrouillé car la candidature est en vivier RH. Retirez-la du vivier pour modifier son statut.</span>
                                </div>
                            ) : (
                                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b' }}>
                                    Règle de gestion : impossible de revenir à un statut d'ordre workflow inférieur ou égal ({currentWorkflowOrder}).
                                </p>
                            )}

                            <form onSubmit={handleStatusSubmit} style={{ display: 'grid', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {sortedStatuts.map((s) => {
                                        const isCurrent = Number(s.id_statut_candidature) === Number(details.id_statut_candidature);
                                        const isSelected = Number(s.id_statut_candidature) === Number(targetStatusId);
                                        const isDisabled = details.dans_vivier || Number(s.ordre_workflow) <= currentWorkflowOrder;

                                        let bg = '#ffffff';
                                        let border = '1px solid #cbd5e1';
                                        let textColor = '#334155';

                                        if (isCurrent) {
                                            bg = '#dbeafe';
                                            border = '2px solid #2563eb';
                                            textColor = '#1e40af';
                                        } else if (isSelected) {
                                            bg = '#e0e7ff';
                                            border = '2px solid #4f46e5';
                                            textColor = '#3730a3';
                                        } else if (isDisabled) {
                                            bg = '#f1f5f9';
                                            border = '1px solid #e2e8f0';
                                            textColor = '#94a3b8';
                                        }

                                        return (
                                            <button
                                                disabled={isDisabled}
                                                key={s.id_statut_candidature}
                                                onClick={() => setTargetStatusId(s.id_statut_candidature)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '10px 12px',
                                                    borderRadius: '8px',
                                                    background: bg,
                                                    border: border,
                                                    color: textColor,
                                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                    opacity: isDisabled && !isCurrent ? 0.7 : 1,
                                                    transition: 'all 0.15s ease',
                                                    fontSize: '13px',
                                                    fontWeight: isCurrent || isSelected ? '700' : '500',
                                                    textAlign: 'left',
                                                }}
                                                title={details.dans_vivier ? "Statut verrouillé car la candidature est en vivier" : isDisabled ? `Ordre workflow (${s.ordre_workflow}) <= Actuel (${currentWorkflowOrder}). Règle de non-retour appliquée.` : `Passer au statut ${s.libelle}`}
                                                type="button"
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span
                                                        style={{
                                                            width: '24px',
                                                            height: '24px',
                                                            borderRadius: '50%',
                                                            background: isCurrent ? '#2563eb' : isSelected ? '#4f46e5' : isDisabled ? '#cbd5e1' : '#f1f5f9',
                                                            color: isCurrent || isSelected ? '#ffffff' : '#475569',
                                                            fontSize: '11px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        {/* {s.ordre_workflow} */}
                                                    </span>
                                                    <span>{s.libelle}</span>
                                                </div>

                                                {isCurrent ? (
                                                    <span className="badge blue" style={{ fontSize: '11px' }}>Actuel</span>
                                                ) : isDisabled ? (
                                                    <Lock size={14} style={{ color: '#94a3b8' }} />
                                                ) : isSelected ? (
                                                    <Check size={16} style={{ color: '#4f46e5' }} />
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>

                                {!details.dans_vivier && targetStatusId && Number(targetStatusId) !== Number(details.id_statut_candidature) ? (
                                    <div style={{ marginTop: '4px', display: 'grid', gap: '8px' }}>
                                        <textarea
                                            onChange={(e) => setCommentaire(e.target.value)}
                                            placeholder="Commentaire sur ce changement de statut (optionnel)..."
                                            rows={2}
                                            style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                                            value={commentaire}
                                        />
                                        <button className="primary-button" disabled={updatingStatus} style={{ width: '100%', padding: '10px', fontSize: '13px', justifyContent: 'center' }} type="submit">
                                            <Save size={15} />
                                            <span>{updatingStatus ? 'Enregistrement...' : 'Valider la transition'}</span>
                                        </button>
                                    </div>
                                ) : null}

                                {statusSuccessMsg ? (
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#166534', fontWeight: '500' }}>
                                        {statusSuccessMsg}
                                    </p>
                                ) : null}
                            </form>
                        </div>

                        {/* SECTION 2: BOUTON & GESTION EN VIVIER DE LA CANDIDATURE (MASQUÉE À L'IMPRESSION) */}
                        <div className="no-print" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                            <strong style={{ color: '#334155', fontSize: '13.5px', display: 'block', marginBottom: '8px' }}>
                                Conservation en Vivier RH
                            </strong>

                            {details.dans_vivier ? (
                                <div
                                    style={{
                                        background: '#ecfdf5',
                                        border: '1px solid #a7f3d0',
                                        borderRadius: '10px',
                                        padding: '12px',
                                        display: 'grid',
                                        gap: '8px',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontSize: '13px', fontWeight: '600' }}>
                                        <BookmarkCheck size={18} />
                                        <span>Cette candidature est en vivier RH</span>
                                    </div>
                                    <button
                                        className="ghost-button danger"
                                        disabled={updatingVivier}
                                        onClick={() => handleToggleVivier(false)}
                                        style={{ fontSize: '12px', padding: '6px 10px', width: '100%', justifyContent: 'center' }}
                                        type="button"
                                    >
                                        <span>{updatingVivier ? 'Mise à jour...' : 'Retirer cette candidature du vivier'}</span>
                                    </button>
                                </div>
                            ) : (currentStatus?.libelle?.toLowerCase() === 'retenue' || currentStatus?.libelle?.toLowerCase() === 'retenu') ? (
                                <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Lock size={15} style={{ color: '#94a3b8' }} />
                                    <span>Règle de gestion : une candidature retenue ne peut pas être mise en vivier.</span>
                                </div>
                            ) : (
                                <button
                                    className="primary-button"
                                    disabled={updatingVivier}
                                    onClick={() => handleToggleVivier(true)}
                                    style={{
                                        width: '100%',
                                        padding: '11px',
                                        fontSize: '13.5px',
                                        justifyContent: 'center',
                                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                                    }}
                                    type="button"
                                >
                                    <Layers size={17} />
                                    <span>{updatingVivier ? 'Enregistrement...' : 'Mettre cette candidature en vivier'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* DÉTAILS CANDIDATURE DROITE : INCLUANT INFORMATIONS + GESTION COMPÉTENCES, EXPÉRIENCES ET FORMATIONS */}
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {/* INFOS DOSSIER */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px' }}>Informations sur le dossier de candidature</h3>
                            <p style={{ margin: '6px 0' }}>
                                <strong>Type de demande :</strong>{' '}
                                {!details.offre || details.id_type_demande === 2 ? (
                                    <span className="badge amber">Candidature Spontanée</span>
                                ) : (
                                    <span className="badge blue">Candidature sur offre</span>
                                )}
                            </p>
                            <p style={{ margin: '6px 0' }}>
                                <strong>Statut Vivier :</strong>{' '}
                                {details.dans_vivier ? (
                                    <span className="badge green">En Vivier RH</span>
                                ) : (
                                    <span className="badge gray">Hors Vivier</span>
                                )}
                            </p>
                            <p style={{ margin: '6px 0' }}>
                                <strong>Canal de dépôt :</strong>{' '}
                                <span className={`badge ${details.canal_depot === 'rh_manuel' ? 'purple' : 'gray'}`}>
                                    {details.canal_depot === 'rh_manuel' ? 'Saisie Manuelle RH' : 'Portail Web'}
                                </span>
                            </p>
                            {details.offre ? (
                                <>
                                    <p style={{ margin: '6px 0' }}>
                                        <strong>Offre postulée :</strong>{' '}
                                        <strong style={{ color: 'var(--primary)' }}>{details.offre.titre_poste}</strong>
                                    </p>
                                    <p style={{ margin: '6px 0' }}>
                                        <strong>Direction de rattachement :</strong>{' '}
                                        {details.offre.direction?.nom_direction ?? 'Non spécifiée'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p style={{ margin: '6px 0' }}>
                                        <strong>Poste souhaité :</strong>{' '}
                                        <strong>{details.poste_souhaite ?? 'Non spécifié'}</strong>
                                    </p>
                                    <p style={{ margin: '6px 0' }}>
                                        <strong>Domaine :</strong>{' '}
                                        {details.domaine && (details.domaine.valide === true || details.domaine.valide === 1) ? (
                                            <span>{details.domaine.nom_domaine}</span>
                                        ) : details.domaine?.nom_domaine ? (
                                            <span>{details.domaine.nom_domaine} <span className="badge amber" style={{ marginLeft: '6px' }}>En attente de validation RH</span></span>
                                        ) : (
                                            <span>Non spécifié</span>
                                        )}
                                    </p>
                                    <p style={{ margin: '6px 0' }}>
                                        <strong>Direction suggérée :</strong>{' '}
                                        {details.domaine?.direction?.nom_direction ?? details.direction?.nom_direction ?? 'Non spécifiée (En attente de validation RH)'}
                                    </p>
                                </>
                            )}
                            <p style={{ margin: '6px 0' }}><strong>Date de dépôt :</strong> {formatDate(details.created_at)}</p>

                            <div style={{ marginTop: '16px' }}>
                                <strong style={{ display: 'block', marginBottom: '6px' }}>Message de présentation / Lettre de motivation :</strong>
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', lineHeight: '1.6' }}>
                                    {details.message_motivation ?? details.message ?? 'Aucun message spécifique fourni.'}
                                </div>
                            </div>
                        </div>

                        {/* SECTION DIRECTE : GESTION DES COMPÉTENCES ET NIVEAUX DE MAÎTRISE */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Sparkles size={18} />
                                <span>Gestion des Compétences ({profileData?.competences?.length ?? 0})</span>
                            </h3>

                            {profileMsg ? (
                                <div className="status-pill success no-print" style={{ padding: '8px 12px', marginBottom: '12px', display: 'inline-block', fontSize: '13px' }}>
                                    {profileMsg}
                                </div>
                            ) : null}

                            <div className="tags-list" style={{ marginBottom: '16px' }}>
                                {(Array.isArray(profileData?.competences) ? profileData.competences : []).map((c) => (
                                    <span key={c.id_competence} className="badge green" style={{ fontSize: '13.5px', padding: '6px 12px' }}>
                                        <strong>{c.nom_competence ?? c.nom}</strong> — <em>{c.niveau}</em> ({c.source_extraction ?? c.source ?? 'Manuelle'})
                                    </span>
                                ))}
                            </div>

                            <form className="no-print" onSubmit={handleAddCompetence} style={{ display: 'grid', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Ajouter une compétence au profil candidat :</strong>

                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                                    {/* 1. Input de recherche */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 220px', minWidth: '200px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                                            Rechercher une compétence
                                        </label>
                                        <div className="search-field" style={{ width: '100%' }}>
                                            <Search size={16} />
                                            <input
                                                onChange={(e) => setCompSearchQuery(e.target.value)}
                                                placeholder="Tapez le nom de la compétence (ex: PHP, React...)"
                                                style={{ width: '100%', height: '42px', padding: '0 12px 0 38px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                                type="search"
                                                value={compSearchQuery}
                                            />
                                        </div>
                                    </div>

                                    {/* 2. Select des résultats */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1.2 1 240px', minWidth: '220px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                                            Compétence correspondante ({filteredCompsInDetail.length} trouvée{filteredCompsInDetail.length > 1 ? 's' : ''})
                                        </label>
                                        <select
                                            onChange={(e) => setNewComp((curr) => ({ ...curr, id_competence: e.target.value }))}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                            value={effectiveSelectedCompId}
                                        >
                                            {filteredCompsInDetail.length ? (
                                                filteredCompsInDetail.map((c) => (
                                                    <option key={c.id_competence ?? c.id} value={c.id_competence ?? c.id}>
                                                        {c.nom_competence ?? c.nom} ({c.type?.libelle ?? c.type ?? 'Technique'})
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
                                            Niveau de maîtrise
                                        </label>
                                        <select
                                            onChange={(e) => setNewComp((curr) => ({ ...curr, niveau: e.target.value }))}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                            value={newComp.niveau}
                                        >
                                            <option value="Débutant">Débutant</option>
                                            <option value="Intermédiaire">Intermédiaire</option>
                                            <option value="Avancé">Avancé</option>
                                            <option value="Expert">Expert</option>
                                        </select>
                                    </div>
                                </div>

                                {/* BOUTONS D'ACTION AU BAS DE LA DIV DE SÉLECTION */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                    <button
                                        className="ghost-button"
                                        disabled={!effectiveSelectedCompId}
                                        style={{ justifySelf: 'start' }}
                                        type="submit"
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
                            </form>
                        </div>

                        {/* SECTION DIRECTE : EXPÉRIENCES PROFESSIONNELLES */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BriefcaseBusiness size={18} />
                                <span>Expériences Professionnelles ({profileData?.experiences?.length ?? 0})</span>
                            </h3>

                            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                                {(profileData?.experiences ?? []).map((exp) => (
                                    <div key={exp.id_experience} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{exp.poste ?? exp.intitule_poste}</strong>
                                            <small style={{ color: '#64748b' }}>
                                                {exp.date_debut ? formatDate(exp.date_debut) : ''} - {exp.date_fin ? formatDate(exp.date_fin) : 'Présent'}
                                            </small>
                                        </div>
                                        <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '500' }}>{exp.entreprise}</span>
                                        {exp.description ? <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#334155' }}>{exp.description}</p> : null}
                                    </div>
                                ))}
                            </div>

                            <form className="no-print" onSubmit={handleAddExperience} style={{ display: 'grid', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Saisir une nouvelle expérience :</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <input
                                        onChange={(e) => setNewExp((curr) => ({ ...curr, intitule_poste: e.target.value }))}
                                        placeholder="Intitulé du poste (ex: Chef de Projet)..."
                                        required
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="text"
                                        value={newExp.intitule_poste}
                                    />
                                    <input
                                        onChange={(e) => setNewExp((curr) => ({ ...curr, entreprise: e.target.value }))}
                                        placeholder="Entreprise / Organisation..."
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="text"
                                        value={newExp.entreprise}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <input
                                        onChange={(e) => setNewExp((curr) => ({ ...curr, date_debut: e.target.value }))}
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="date"
                                        value={newExp.date_debut}
                                    />
                                    <input
                                        onChange={(e) => setNewExp((curr) => ({ ...curr, date_fin: e.target.value }))}
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="date"
                                        value={newExp.date_fin}
                                    />
                                </div>
                                <textarea
                                    onChange={(e) => setNewExp((curr) => ({ ...curr, description: e.target.value }))}
                                    placeholder="Description des missions réalisées..."
                                    rows={2}
                                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                    value={newExp.description}
                                />
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <button className="ghost-button" style={{ justifySelf: 'start' }} type="submit">
                                        <Plus size={16} />
                                        <span>Ajouter l'expérience</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* SECTION DIRECTE : PROJETS & RÉALISATIONS */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FolderGit2 size={18} />
                                <span>Projets & Réalisations ({profileData?.projets?.length ?? 0})</span>
                            </h3>

                            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                                {(profileData?.projets ?? []).map((p) => (
                                    <div key={p.id_projet} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{p.titre_projet}</strong>
                                                {p.role && <span className="badge blue" style={{ fontSize: '11px' }}>{p.role}</span>}
                                            </div>
                                            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                                {p.date_debut || p.date_fin ? `${p.date_debut ?? '?'} → ${p.date_fin ?? 'Présent'}` : ''}
                                            </span>
                                        </div>
                                        {p.technologies && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                                                {p.technologies.split(',').map((tech, ti) => (
                                                    <span key={ti} className="badge gray" style={{ fontSize: '11px', padding: '2px 8px' }}>
                                                        {tech.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {p.url_projet && (
                                            <div style={{ fontSize: '12px', color: '#0284c7', margin: '2px 0' }}>
                                                <a href={p.url_projet} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                                                    {p.url_projet}
                                                </a>
                                            </div>
                                        )}
                                        {p.description && <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#475569' }}>{p.description}</p>}
                                    </div>
                                ))}
                                {(!profileData?.projets || profileData.projets.length === 0) && (
                                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontStyle: 'italic', padding: '6px 0' }}>
                                        Aucun projet ou réalisation enregistré pour l'instant.
                                    </div>
                                )}
                            </div>

                            <form className="no-print" onSubmit={handleAddProjet} style={{ display: 'grid', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Saisir un nouveau projet / réalisation :</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <input
                                        onChange={(e) => setNewProj((curr) => ({ ...curr, titre_projet: e.target.value }))}
                                        placeholder="Titre du projet (ex: ERP AlpA Ciment)..."
                                        required
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="text"
                                        value={newProj.titre_projet}
                                    />
                                    <input
                                        onChange={(e) => setNewProj((curr) => ({ ...curr, role: e.target.value }))}
                                        placeholder="Rôle (ex: Lead Developer, Créateur)..."
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="text"
                                        value={newProj.role}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <input
                                        onChange={(e) => setNewProj((curr) => ({ ...curr, technologies: e.target.value }))}
                                        placeholder="Technologies (ex: React, Laravel, Docker)..."
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="text"
                                        value={newProj.technologies}
                                    />
                                    <input
                                        onChange={(e) => setNewProj((curr) => ({ ...curr, url_projet: e.target.value }))}
                                        placeholder="Lien / Dépôt (ex: https://github.com/...)..."
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="url"
                                        value={newProj.url_projet}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <input
                                        onChange={(e) => setNewProj((curr) => ({ ...curr, date_debut: e.target.value }))}
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="date"
                                        value={newProj.date_debut}
                                    />
                                    <input
                                        onChange={(e) => setNewProj((curr) => ({ ...curr, date_fin: e.target.value }))}
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="date"
                                        value={newProj.date_fin}
                                    />
                                </div>
                                <textarea
                                    onChange={(e) => setNewProj((curr) => ({ ...curr, description: e.target.value }))}
                                    placeholder="Description de la réalisation, architecture, objectifs atteints..."
                                    rows={2}
                                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                    value={newProj.description}
                                />
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <button className="ghost-button" style={{ justifySelf: 'start' }} type="submit">
                                        <Plus size={16} />
                                        <span>Ajouter le projet</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* SECTION DIRECTE : FORMATIONS ET DIPLÔMES */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <GraduationCap size={18} />
                                <span>Formations & Diplômes ({profileData?.formations?.length ?? 0})</span>
                            </h3>

                            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                                {(profileData?.formations ?? []).map((f) => (
                                    <div key={f.id_formation} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{f.diplome}</strong>
                                                {(f.niveauRel?.libelle || f.niveau) && (
                                                    <span className="badge green" style={{ fontSize: '11px' }}>
                                                        {f.niveauRel?.libelle ?? f.niveau}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="badge blue">{f.annee_obtention ?? 'Année non précisée'}</span>
                                        </div>
                                        <span style={{ fontSize: '13px', color: '#64748b' }}>{f.etablissement} {f.domaine_etude ? `(${f.domaine_etude})` : ''}</span>
                                    </div>
                                ))}
                            </div>

                            <form className="no-print" onSubmit={handleAddFormation} style={{ display: 'grid', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Saisir une nouvelle formation :</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <input
                                        onChange={(e) => setNewForm((curr) => ({ ...curr, diplome: e.target.value }))}
                                        placeholder="Diplôme obtenu (ex: Master 2 Génie Software)..."
                                        required
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="text"
                                        value={newForm.diplome}
                                    />
                                    <select
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            const sel = niveauxList.find((n) => String(n.id_niveau ?? n.id) === String(selectedId));
                                            setNewForm((curr) => ({
                                                ...curr,
                                                id_niveau: selectedId,
                                                niveau: sel ? sel.libelle : '',
                                            }));
                                        }}
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        value={newForm.id_niveau}
                                    >
                                        <option value="">-- Niveau d'études (Référentiel) --</option>
                                        {niveauxList.map((n) => (
                                            <option key={n.id_niveau ?? n.id} value={n.id_niveau ?? n.id}>
                                                {n.libelle}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <input
                                        onChange={(e) => setNewForm((curr) => ({ ...curr, etablissement: e.target.value }))}
                                        placeholder="Établissement / Université..."
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="text"
                                        value={newForm.etablissement}
                                    />
                                    <input
                                        onChange={(e) => setNewForm((curr) => ({ ...curr, annee_obtention: e.target.value }))}
                                        placeholder="Année d'obtention (ex: 2023)..."
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="number"
                                        value={newForm.annee_obtention}
                                    />
                                    <input
                                        onChange={(e) => setNewForm((curr) => ({ ...curr, domaine_etude: e.target.value }))}
                                        placeholder="Domaine d'étude (ex: Informatique)..."
                                        style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#ffffff' }}
                                        type="text"
                                        value={newForm.domaine_etude}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <button className="ghost-button" style={{ justifySelf: 'start' }} type="submit">
                                        <Plus size={16} />
                                        <span>Ajouter la formation</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB DOCUMENTS */}
            {activeTab === 'documents' && (
                <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px' }}>
                        Documents & Pièces Jointes du Candidat ({details.documents?.length ?? 0})
                    </h3>
                    {!details.documents?.length ? (
                        <div className="empty-state">Aucun document joint à cette candidature.</div>
                    ) : (
                        <div className="document-grid">
                            {(details.documents ?? []).map((doc) => (
                                <div className="document-card" key={doc.id_document} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div className="document-card-info" style={{ marginBottom: '10px' }}>
                                        <strong style={{ display: 'block', fontSize: '15px' }}>{doc.nom_fichier}</strong>
                                        <span className="badge" style={{ marginTop: '4px' }}>{doc.type_document}</span>
                                        <small style={{ display: 'block', color: 'var(--muted)', marginTop: '4px' }}>
                                            {doc.taille_octets ? `${Math.round(doc.taille_octets / 1024)} KB` : ''} - {doc.mime_type ?? 'Fichier'}
                                        </small>
                                    </div>
                                    <a
                                        className="filter-button"
                                        href={backendPath(`/storage/${doc.chemin_fichier}`)}
                                        rel="noreferrer"
                                        style={{ padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        target="_blank"
                                        title="Télécharger / Consulter le document"
                                    >
                                        <Download size={15} />
                                        <span>Consulter / Télécharger</span>
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB HISTORIQUE STATUTS */}
            {activeTab === 'historique_statuts' && (
                <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px' }}>Historique Chronologique des Statuts RH</h3>
                    {!details.historique?.length ? (
                        <div className="empty-state">Aucun historique enregistré pour le moment.</div>
                    ) : (
                        <div className="history-timeline" style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '16px', display: 'grid', gap: '16px' }}>
                            {(details.historique ?? []).map((h, idx) => (
                                <div className="history-item" key={h.id_historique ?? idx} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: 'var(--primary)', fontSize: '15px' }}>{h.statut?.libelle ?? 'Changement de statut'}</strong>
                                        <small style={{ color: 'var(--muted)' }}>{formatDate(h.date_changement ?? h.created_at)}</small>
                                    </div>
                                    {h.commentaire ? (
                                        <p style={{ margin: '6px 0 0 0', fontSize: '14px', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                            {h.commentaire}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB COMMUNICATIONS */}
            {activeTab === 'communications' && (
                <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mail size={20} />
                                <span>Historique des Communications ({communicationsList.length})</span>
                            </h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                                Trace intégrale des e-mails envoyés (accusés de réception, convocations, messages manuels).
                            </p>
                        </div>
                        <button
                            className="action-button primary"
                            onClick={() => setMessageModalOpen(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            type="button"
                        >
                            <Send size={16} />
                            <span>Envoyer un nouvel e-mail</span>
                        </button>
                    </div>

                    {loadingCommunications ? (
                        <LoadingState message="Chargement de l'historique des échanges..." />
                    ) : !communicationsList.length ? (
                        <div className="empty-state" style={{ textAlign: 'left', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <CheckCircle2 color="green" size={20} />
                                <strong>Aucun e-mail consigné pour cette candidature.</strong>
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                                Utilisez le bouton ci-dessus pour envoyer une communication directe ou une convocation.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {communicationsList.map((comm) => (
                                <div
                                    key={comm.id_communication}
                                    style={{
                                        background: '#f8fafc',
                                        padding: '16px 20px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        borderLeft: comm.mode_envoi === 'auto' ? '4px solid #10b981' : '4px solid #2563eb',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span className={`badge ${comm.mode_envoi === 'auto' ? 'green' : 'blue'}`} style={{ fontSize: '11px' }}>
                                                    {comm.mode_envoi === 'auto' ? 'Automatique' : 'Manuel'}
                                                </span>
                                                <span className="badge gray" style={{ fontSize: '11px' }}>
                                                    {comm.type_message?.libelle || 'Message'}
                                                </span>
                                                {comm.modele_message?.nom_modele ? (
                                                    <small style={{ color: '#64748b' }}>
                                                        (Modèle: {comm.modele_message.nom_modele})
                                                    </small>
                                                ) : null}
                                            </div>
                                            <h4 style={{ margin: '8px 0 2px 0', fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                                                {comm.objet}
                                            </h4>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '12.5px', color: '#64748b' }}>
                                            <div>{formatDate(comm.date_envoi)}</div>
                                            {comm.utilisateur?.nom ? (
                                                <small>Par : {comm.utilisateur.nom}</small>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            background: '#ffffff',
                                            padding: '14px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '13.5px',
                                            lineHeight: '1.5',
                                            whiteSpace: 'pre-line',
                                            color: '#334155',
                                        }}
                                    >
                                        {comm.contenu}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB EXTRACTION CV */}
            {activeTab === 'extraction_cv' && (
                <div style={{ display: 'grid', gridTemplateColumns: '0.82fr 1.18fr', gap: '20px', alignItems: 'start' }}>
                    {/* COLONNE GAUCHE : APERÇU DU FICHIER CV (FORMAT A4 EN HAUTEUR) */}
                    <div className="data-section" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} />
                                <span>CV Original du Candidat (Format A4)</span>
                            </h3>
                            {cvDoc ? (
                                <a
                                    className="filter-button"
                                    href={backendPath(`/storage/${cvDoc.chemin_fichier}`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                    title="Télécharger / Consulter"
                                >
                                    <Download size={14} />
                                    <span>Télécharger</span>
                                </a>
                            ) : null}
                        </div>

                        {cvDoc ? (
                            cvDoc.mime_type === 'application/pdf' || cvDoc.chemin_fichier?.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={backendPath(`/storage/${cvDoc.chemin_fichier}`)}
                                    style={{ width: '100%', height: '840px', border: '1px solid var(--border)', borderRadius: '8px', background: '#f8fafc' }}
                                    title="Aperçu CV PDF A4"
                                />
                            ) : cvDoc.mime_type?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(cvDoc.chemin_fichier) ? (
                                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', maxHeight: '840px', overflowY: 'auto' }}>
                                    <img
                                        src={backendPath(`/storage/${cvDoc.chemin_fichier}`)}
                                        alt="Document CV"
                                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ padding: '32px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                    <FileText size={48} color="var(--primary)" style={{ margin: '0 auto 12px auto', display: 'block' }} />
                                    <strong style={{ fontSize: '15px', display: 'block', marginBottom: '4px' }}>{cvDoc.nom_fichier}</strong>
                                    <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>Format : {cvDoc.mime_type ?? 'Fichier'}</p>
                                    <a
                                        className="primary-button"
                                        href={backendPath(`/storage/${cvDoc.chemin_fichier}`)}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                                    >
                                        <Download size={16} />
                                        <span>Consulter le document CV</span>
                                    </a>
                                </div>
                            )
                        ) : (
                            <div className="empty-state" style={{ padding: '48px 16px', textAlign: 'center' }}>
                                <FileText size={40} color="var(--muted)" style={{ margin: '0 auto 12px auto', display: 'block' }} />
                                <span>Aucun document CV rattaché à cette candidature.</span>
                            </div>
                        )}
                    </div>

                    {/* COLONNE DROITE : RÉSULTATS DE L'EXTRACTION OCR & IA */}
                    <div className="data-section" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Cpu size={18} />
                                    <span>Résultats Extraction (PaddleOCR & IA)</span>
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                                    Données analysées et structurées du CV.
                                </p>
                            </div>
                            <button className="primary-button" disabled={ocrExtracting} onClick={handleExtractOcr} style={{ gap: '6px' }} type="button">
                                <Sparkles size={16} />
                                <span>{ocrExtracting ? 'Analyse OCR...' : 'Lancer Extraction CV'}</span>
                            </button>
                        </div>

                        {ocrSuccessMsg ? (
                            <div className="status-pill success" style={{ padding: '8px 14px', marginBottom: '12px', display: 'inline-block' }}>
                                {ocrSuccessMsg}
                            </div>
                        ) : null}

                        {ocrData ? (
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gap: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--primary)' }}>Données Extraites (PaddleOCR & LLM)</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={`badge ${ocrData.statut_validation === 'valide' ? 'green' : ocrData.statut_validation === 'rejete' ? 'red' : ocrData.statut_validation === 'corrige' ? 'blue' : 'gray'}`}>
                                            Statut : {ocrData.statut_validation === 'valide' ? 'Validé' : ocrData.statut_validation === 'corrige' ? 'Corrigé' : ocrData.statut_validation === 'rejete' ? 'Rejeté' : 'En attente'}
                                        </span>
                                        <button
                                            type="button"
                                            className="filter-button"
                                            onClick={() => setIsEditingOcr(!isEditingOcr)}
                                            style={{ fontSize: '12px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <Edit3 size={13} />
                                            <span>{isEditingOcr ? 'Quitter correction' : 'Corriger les éléments'}</span>
                                        </button>
                                    </div>
                                </div>
                                
                                {ocrData.texte_brut ? (
                                    <div>
                                        <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Texte Brut OCR Extrait :</strong>
                                        <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '12px', borderRadius: '6px', fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '160px', overflowY: 'auto' }}>
                                            {ocrData.texte_brut}
                                        </pre>
                                    </div>
                                ) : null}

                                {ocrData.contact && (
                                    <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                        <strong style={{ fontSize: '13px', color: '#1e40af', display: 'block', marginBottom: '6px' }}>Coordonnées extraites (NER) :</strong>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12.5px', color: '#1e293b' }}>
                                            {ocrData.contact.nom_complet && <div><strong>Nom :</strong> {ocrData.contact.nom_complet}</div>}
                                            {ocrData.contact.email && <div><strong>Email :</strong> {ocrData.contact.email}</div>}
                                            {ocrData.contact.telephone && <div><strong>Tél :</strong> {ocrData.contact.telephone}</div>}
                                            {ocrData.contact.ville && <div><strong>Ville :</strong> {ocrData.contact.ville}</div>}
                                        </div>
                                    </div>
                                )}

                                {ocrData.profil && (
                                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                                        <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '2px' }}>Profil / Résumé :</strong>
                                        <p style={{ margin: 0, color: 'var(--text)', fontStyle: 'italic' }}>{ocrData.profil}</p>
                                    </div>
                                )}

                                <div>
                                    <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Données Structurées Extraites :</strong>
                                    <div style={{ display: 'grid', gap: '12px', fontSize: '13px', background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div>
                                            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f766e' }}>
                                                <BookmarkCheck size={16} />
                                                Compétences identifiées ({(ocrData.competences ?? []).length}) :
                                            </strong>
                                            <div className="tags-list" style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {(ocrData.competences ?? []).map((c, i) => (
                                                    <span key={i} className="badge green" style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                        <span>{c.nom ?? c.nom_competence}</span>
                                                        {c.niveau ? <span style={{ opacity: 0.8 }}>• {c.niveau}</span> : null}
                                                        {isEditingOcr && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeExtractedComp(i)}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', padding: 0 }}
                                                                title="Supprimer cette compétence"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1d4ed8' }}>
                                                <BriefcaseBusiness size={16} />
                                                Expériences identifiées ({(ocrData.experiences ?? []).length}) :
                                            </strong>
                                            <div style={{ display: 'grid', gap: '8px', marginTop: '6px' }}>
                                                {(ocrData.experiences ?? []).map((exp, i) => (
                                                    <div key={i} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <strong style={{ color: '#0f172a' }}>{exp.poste ?? exp.intitule_poste}</strong>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                                                                    {exp.date_debut || exp.date_fin ? `${exp.date_debut ?? '?'} → ${exp.date_fin ?? 'Présent'}` : ''}
                                                                </span>
                                                                {isEditingOcr && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeExtractedExp(i)}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}
                                                                        title="Supprimer cette expérience"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {exp.entreprise && <div style={{ fontSize: '12px', color: '#475569' }}>Entreprise / Organisation : {exp.entreprise}</div>}
                                                        {exp.description && <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>{exp.description}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7c3aed' }}>
                                                <GraduationCap size={16} />
                                                Formations identifiées ({(ocrData.formations ?? []).length}) :
                                            </strong>
                                            <div style={{ display: 'grid', gap: '8px', marginTop: '6px' }}>
                                                {(ocrData.formations ?? []).map((f, i) => (
                                                    <div key={i} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <strong style={{ color: '#0f172a' }}>{f.diplome}</strong>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                                                                    {f.annee_obtention ?? f.date_obtention ?? ''}
                                                                </span>
                                                                {isEditingOcr && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeExtractedForm(i)}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}
                                                                        title="Supprimer cette formation"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {f.etablissement && <div style={{ fontSize: '12px', color: '#475569' }}>Établissement : {f.etablissement}</div>}
                                                        {f.domaine_etude && f.domaine_etude !== 'null' && <div style={{ fontSize: '11.5px', color: '#64748b' }}>Domaine : {f.domaine_etude}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7' }}>
                                                <FolderGit2 size={16} />
                                                Projets & Réalisations identifiés ({(ocrData.projets ?? []).length}) :
                                            </strong>
                                            <div style={{ display: 'grid', gap: '8px', marginTop: '6px' }}>
                                                {(ocrData.projets ?? []).map((p, i) => (
                                                    <div key={i} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <strong style={{ color: '#0f172a' }}>{p.titre_projet ?? p.titre ?? p.nom}</strong>
                                                                {p.role && <span className="badge blue" style={{ fontSize: '10.5px' }}>{p.role}</span>}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                                                                    {p.date_debut || p.date_fin ? `${p.date_debut ?? '?'} → ${p.date_fin ?? 'Présent'}` : ''}
                                                                </span>
                                                                {isEditingOcr && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeExtractedProj(i)}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}
                                                                        title="Supprimer ce projet"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {p.technologies && (
                                                            <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                                                                <strong>Technologies :</strong> {Array.isArray(p.technologies) ? p.technologies.join(', ') : p.technologies}
                                                            </div>
                                                        )}
                                                        {p.url_projet && <div style={{ fontSize: '11.5px', color: '#0284c7' }}>Lien : {p.url_projet}</div>}
                                                        {p.description && <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>{p.description}</div>}
                                                    </div>
                                                ))}
                                                {(!ocrData.projets || ocrData.projets.length === 0) && (
                                                    <div style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>
                                                        Aucun projet distinct détecté dans ce CV.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COMMENTAIRE RH */}
                                <div style={{ marginTop: '4px' }}>
                                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                                        Commentaire RH sur l'extraction :
                                    </label>
                                    <input
                                        type="text"
                                        className="search-input"
                                        value={ocrCommentaireRh}
                                        onChange={(e) => setOcrCommentaireRh(e.target.value)}
                                        placeholder="Ex: Expériences vérifiées, doublon retiré..."
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>

                                {/* BOUTONS D'ACTION DU WORKFLOW RH (Valider, Corriger, Rejeter) */}
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="filter-button"
                                        onClick={() => handleValidateOcr('rejete')}
                                        style={{ fontSize: '13px', padding: '8px 14px', color: '#ffffff', borderColor: '#fca5a5', gap: '6px', display: 'inline-flex', alignItems: 'center' }}
                                    >
                                        <X size={16} />
                                        <span>Rejeter les données</span>
                                    </button>

                                    {isEditingOcr && (
                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() => handleValidateOcr('corrige')}
                                            style={{ fontSize: '13px', padding: '8px 14px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}
                                        >
                                            <Save size={16} />
                                            <span>Enregistrer les corrections</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={() => handleValidateOcr('valide')}
                                        style={{ fontSize: '13px', padding: '8px 16px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}
                                    >
                                        <Check size={16} />
                                        <span>Valider & Importer au profil</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '48px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                                <Cpu size={36} color="var(--muted)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                                <span style={{ fontSize: '13.5px' }}>Cliquez sur "Lancer Extraction CV" pour analyser le CV du candidat avec PaddleOCR & l'IA.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB RENDEZ-VOUS & ENTRETIENS */}
            {activeTab === 'rendez_vous' && (
                <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CalendarDays size={20} className="text-primary" /> Entretiens et Tests Planifiés
                            </h3>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                                Liste des créneaux passés ou à venir pour cette candidature.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                                setSelectedRdv(null);
                                setRdvModalOpen(true);
                            }}
                            style={{ gap: '6px', display: 'inline-flex', alignItems: 'center' }}
                        >
                            <Plus size={16} />
                            <span>Planifier un entretien / test</span>
                        </button>
                    </div>

                    {loadingRdv ? (
                        <LoadingState message="Chargement des rendez-vous..." />
                    ) : rendezVousList.length === 0 ? (
                        <div className="empty-state" style={{ padding: '48px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                            <CalendarDays size={36} color="var(--muted)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                            <p style={{ margin: 0, fontWeight: 500, color: '#475569' }}>Aucun rendez-vous planifié pour cette candidature.</p>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>Cliquez sur "Planifier un entretien / test" pour définir un créneau.</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {rendezVousList.map((rdv) => {
                                const isEntretien = rdv.id_type_rendez_vous === 2;
                                const isRealise = rdv.id_statut_rendez_vous === 2;
                                const isAnnule = rdv.id_statut_rendez_vous === 3;

                                return (
                                    <div
                                        key={rdv.id_rendez_vous}
                                        style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: isAnnule ? '#f8fafc' : '#ffffff',
                                            opacity: isAnnule ? 0.75 : 1,
                                            borderLeft: `4px solid ${isAnnule ? '#94a3b8' : isRealise ? '#10b981' : isEntretien ? '#3b82f6' : '#8b5cf6'}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                                                    {rdv.type_rendez_vous?.libelle || (isEntretien ? 'Entretien' : 'Test')}
                                                </strong>
                                                <span
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontWeight: 600,
                                                        background: isRealise ? '#dcfce7' : isAnnule ? '#fee2e2' : '#dbeafe',
                                                        color: isRealise ? '#166534' : isAnnule ? '#991b1b' : '#1e40af',
                                                    }}
                                                >
                                                    {rdv.statut_rendez_vous?.libelle || 'A venir'}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    • {rdv.mode_realisation?.libelle || 'Présentiel'}
                                                </span>
                                            </div>

                                            <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                <span>
                                                    📅 Du <strong>{formatDate(rdv.date_debut)}</strong> au <strong>{formatDate(rdv.date_fin)}</strong>
                                                </span>
                                                {rdv.details_lieu && <span>📍 {rdv.details_lieu}</span>}
                                                {rdv.responsable && <span>👤 Responsable : {rdv.responsable.nom}</span>}
                                            </div>

                                            {rdv.commentaire && (
                                                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                                                    "{rdv.commentaire}"
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className="action-button secondary"
                                            onClick={() => {
                                                setSelectedRdv(rdv);
                                                setRdvModalOpen(true);
                                            }}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        >
                                            Modifier
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL PLANIFICATION RDV */}
            <RendezVousModal
                isOpen={rdvModalOpen}
                onClose={() => setRdvModalOpen(false)}
                onSuccess={() => {
                    loadRendezVous(details?.id_candidature || idCandidature);
                    loadCommunications(details?.id_candidature || idCandidature);
                    loadDetails();
                }}
                initialData={selectedRdv}
                defaultCandidature={details}
                referentiels={referentiels}
            />

            {/* MODAL ENVOI D'E-MAIL AU CANDIDAT */}
            <EnvoyerMessageModal
                isOpen={messageModalOpen}
                onClose={() => setMessageModalOpen(false)}
                onSuccess={() => {
                    loadCommunications(details?.id_candidature || idCandidature);
                }}
                candidature={details}
            />

            {/* MODAL CRÉATION DE COMPÉTENCE */}
            {showCompetenceCreateModal && (
                <CompetenceModal
                    onClose={() => setShowCompetenceCreateModal(false)}
                    onSuccess={handleCompetenceCreated}
                />
            )}
        </div>
    );
}
