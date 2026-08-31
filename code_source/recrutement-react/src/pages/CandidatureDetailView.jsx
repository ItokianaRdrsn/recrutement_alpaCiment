import React, { useCallback, useEffect, useState } from 'react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Cpu,
    Download,
    Edit3,
    FileText,
    Printer,
    Save,
    Send,
    Sparkles,
    User,
    X,
} from 'lucide-react';
import { backendPath, getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { formatDate } from '../utils/formatters';

export function CandidatureDetailView({ idCandidature, onBack, onRefreshList, statutsList }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('informations'); // 'informations', 'documents', 'statut', 'historique_statuts', 'communications'
    const [newStatusId, setNewStatusId] = useState('');
    const [commentaire, setCommentaire] = useState('');
    const [updating, setUpdating] = useState(false);
    const [ocrExtracting, setOcrExtracting] = useState(false);
    const [ocrData, setOcrData] = useState(null);
    const [ocrSuccessMsg, setOcrSuccessMsg] = useState('');

    const loadDetails = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const res = await getJson(`/api/candidatures/${idCandidature}`);
            setDetails(res?.data ?? null);
            if (res?.data?.statut?.id_statut_candidature) {
                setNewStatusId(String(res.data.statut.id_statut_candidature));
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

    async function handleExtractOcr() {
        setOcrExtracting(true);
        setOcrSuccessMsg('');
        try {
            const res = await sendJson(`/api/candidatures/${idCandidature}/extract-ocr`, { method: 'POST' });
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
            await sendJson(`/api/candidatures/${idCandidature}/validate-ocr`, {
                body: {
                    statut_validation: statusVal,
                    competences: ocrData.competences ?? [],
                    experiences: ocrData.experiences ?? [],
                    formations: ocrData.formations ?? [],
                },
            });
            setOcrSuccessMsg(`Données du CV ${statusVal === 'valide' ? 'validées' : statusVal} et enregistrées dans le profil candidat !`);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleStatusUpdate(e) {
        e.preventDefault();
        if (!newStatusId) return;

        setUpdating(true);
        try {
            await sendJson(`/api/candidatures/${idCandidature}/statut`, {
                method: 'PATCH',
                body: {
                    id_statut_candidature: Number(newStatusId),
                    commentaire: commentaire.trim() || null,
                },
            });
            setCommentaire('');
            await loadDetails();
            if (onRefreshList) onRefreshList();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadDetails} />;
    }

    if (!details) {
        return <div className="empty-state">Dossier introuvable.</div>;
    }

    const photoDoc = (details.documents ?? []).find(
        (d) => d.type_document === 'Photo' || (d.mime_type && d.mime_type.startsWith('image/'))
    );

    return (
        <div className="view-stack">
            {/* EN-TÊTE FICHE CANDIDAT & BOUTON IMPRESSIONS / RETOUR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <button className="ghost-button" onClick={onBack} type="button">
                    <ArrowLeft size={18} />
                    <span>Retour à la liste des candidatures</span>
                </button>
                <div className="section-heading-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="filter-button" onClick={() => window.print()} style={{ gap: '6px', fontSize: '13px' }} type="button">
                        <Printer size={16} />
                        <span>Exporter en PDF / Imprimer</span>
                    </button>
                    <span className="status-pill success" style={{ fontSize: '14px', padding: '6px 14px' }}>
                        Statut actuel : {details.statut?.libelle ?? 'Reçue'}
                    </span>
                </div>
            </div>

            {/* DEUXIÈME BARRE DE NAVIGATION PAR SECTIONS FICHE CANDIDAT (Informations, Documents, Statut, Historique statuts, Communications) */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', background: '#fff', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
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
                    <span>Informations</span>
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
                    <span>Historique statuts ({details.historique?.length ?? 0})</span>
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
                    <span>Communications</span>
                </button>
            </div>

            {/* CONTENU PRINCIPAL DE LA SECTION SÉLECTIONNÉE */}
            {activeTab === 'informations' && (
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
                    {/* CARTE CANDIDAT GAUCHE */}
                    <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            {photoDoc ? (
                                <img
                                    alt="Photo candidat"
                                    src={backendPath(`/storage/${photoDoc.chemin_fichier}`)}
                                    style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', margin: '0 auto' }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: 'var(--soft-blue)',
                                        color: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto',
                                    }}
                                >
                                    <User size={48} />
                                </div>
                            )}
                            <h2 style={{ fontSize: '20px', margin: '12px 0 4px 0', color: 'var(--text)' }}>
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

                        <div className="detail-block" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', gap: '10px' }}>
                            <strong>Coordonnées du candidat</strong>
                            <p style={{ margin: 0 }}><strong>Email:</strong> {details.candidat?.email}</p>
                            <p style={{ margin: 0 }}><strong>Téléphone:</strong> {details.candidat?.telephone ?? '-'}</p>
                        </div>

                        {/* FORMULAIRE DE MISE À JOUR DU STATUT RH INCLUS DANS INFORMATIONS */}
                        <div className="detail-block" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                            <strong style={{ color: 'var(--primary)' }}>Mise à jour du statut RH</strong>
                            <form onSubmit={handleStatusUpdate} style={{ display: 'grid', gap: '10px', marginTop: '8px' }}>
                                <select
                                    onChange={(e) => setNewStatusId(e.target.value)}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                                    value={newStatusId}
                                >
                                    {statutsList.map((s) => (
                                        <option key={s.id_statut_candidature} value={s.id_statut_candidature}>
                                            {s.libelle}
                                        </option>
                                    ))}
                                </select>
                                <textarea
                                    onChange={(e) => setCommentaire(e.target.value)}
                                    placeholder="Commentaire de changement de statut (optionnel)..."
                                    rows={2}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                                    value={commentaire}
                                />
                                <button className="filter-button" disabled={updating} style={{ width: '100%', padding: '10px', fontSize: '13px' }} type="submit">
                                    <Save size={15} />
                                    <span>{updating ? 'Enregistrement...' : 'Valider le statut'}</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* DÉTAILS CANDIDATURE DROITE */}
                    <div style={{ display: 'grid', gap: '20px' }}>
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
                                <strong>Canal de dépôt :</strong>{' '}
                                <span className={`badge ${details.canal_depot === 'rh_manuel' ? 'purple' : 'gray'}`}>
                                    {details.canal_depot === 'rh_manuel' ? 'Saisie Manuelle RH' : 'Portail Web'}
                                </span>
                            </p>
                            <p style={{ margin: '6px 0' }}>
                                <strong>Poste / Domaine :</strong>{' '}
                                {details.offre ? (
                                    <strong style={{ color: 'var(--primary)' }}>Offre : {details.offre.titre_poste}</strong>
                                ) : details.domaine && (details.domaine.valide === true || details.domaine.valide === 1) ? (
                                    <strong>Domaine : {details.domaine.nom_domaine}</strong>
                                ) : (
                                    <span>Poste souhaité : {details.poste_souhaite ?? 'Non spécifié'} <span className="badge amber" style={{ marginLeft: '6px' }}>En attente de validation RH</span></span>
                                )}
                            </p>
                            <p style={{ margin: '6px 0' }}>
                                <strong>Direction de rattachement :</strong>{' '}
                                {details.offre?.direction?.nom_direction ?? (details.domaine && (details.domaine.valide === true || details.domaine.valide === 1) ? details.domaine?.direction?.nom_direction : 'Non spécifiée (En attente de validation RH)')}
                            </p>
                            <p style={{ margin: '6px 0' }}><strong>Date de dépôt :</strong> {formatDate(details.created_at)}</p>

                            <div style={{ marginTop: '16px' }}>
                                <strong style={{ display: 'block', marginBottom: '6px' }}>Message de présentation / Lettre de motivation :</strong>
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', lineHeight: '1.6' }}>
                                    {details.message_motivation ?? 'Aucun message spécifique fourni.'}
                                </div>
                            </div>
                        </div>

                        {/* PIÈCES JOINTES ET DOCUMENTS INCLUS DANS INFORMATIONS */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '17px' }}>
                                Documents & Pièces Jointes du Candidat ({details.documents?.length ?? 0})
                            </h3>
                            {!details.documents?.length ? (
                                <div className="empty-state">Aucun document joint.</div>
                            ) : (
                                <div className="document-grid">
                                    {(details.documents ?? []).map((doc) => (
                                        <div className="document-card" key={doc.id_document} style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div className="document-card-info" style={{ marginBottom: '8px' }}>
                                                <strong style={{ display: 'block', fontSize: '14px' }}>{doc.nom_fichier}</strong>
                                                <span className="badge" style={{ marginTop: '2px' }}>{doc.type_document}</span>
                                            </div>
                                            <a
                                                className="filter-button"
                                                href={backendPath(`/storage/${doc.chemin_fichier}`)}
                                                rel="noreferrer"
                                                style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                target="_blank"
                                                title="Consulter le document"
                                            >
                                                <Download size={14} />
                                                <span>Consulter / Ouvrir</span>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SECTION EXTRACTION OCR & IA PADDLEOCR */}
                        <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Cpu size={18} />
                                        <span>Extraction Automatique CV (PaddleOCR & IA)</span>
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                                        Extraire les compétences, diplômes et expériences directement du fichier CV.
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
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--primary)' }}>Données Extraites (À valider par le RH)</h4>
                                    
                                    <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                                        <div>
                                            <strong>Compétences identifiées :</strong>
                                            <div className="tags-list" style={{ marginTop: '4px' }}>
                                                {ocrData.competences?.map((c, i) => (
                                                    <span key={i} className="badge green">{c.nom} ({c.niveau})</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <strong>Expériences identifiées :</strong>
                                            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                                {ocrData.experiences?.map((exp, i) => (
                                                    <li key={i}><strong>{exp.intitule_poste}</strong> chez {exp.entreprise} ({exp.date_debut} à {exp.date_fin})</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <strong>Formations identifiées :</strong>
                                            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                                {ocrData.formations?.map((f, i) => (
                                                    <li key={i}><strong>{f.diplome}</strong> - {f.etablissement} ({f.annee_obtention})</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                                        <button className="primary-button" onClick={() => handleValidateOcr('valide')} style={{ padding: '6px 14px', fontSize: '13px' }} type="button">
                                            <CheckCircle2 size={15} />
                                            <span>Valider & Importer au profil</span>
                                        </button>
                                        <button className="ghost-button" onClick={() => handleValidateOcr('corrige')} style={{ padding: '6px 14px', fontSize: '13px' }} type="button">
                                            <Edit3 size={15} />
                                            <span>Corriger</span>
                                        </button>
                                        <button className="ghost-button danger" onClick={() => handleValidateOcr('rejete')} style={{ padding: '6px 14px', fontSize: '13px' }} type="button">
                                            <X size={15} />
                                            <span>Rejeter</span>
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* SECTION DOCUMENTS */}
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

            {/* SECTION HISTORIQUE STATUTS */}
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

            {/* SECTION COMMUNICATIONS */}
            {activeTab === 'communications' && (
                <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '18px' }}>Historique des Communications avec le Candidat</h3>
                    <div className="empty-state" style={{ textAlign: 'left', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <CheckCircle2 color="green" size={20} />
                            <strong>E-mail automatique d'accusé de réception envoyé lors du dépôt.</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                            Date d'envoi : {formatDate(details.created_at)} | Destinataire : {details.candidat?.email}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
