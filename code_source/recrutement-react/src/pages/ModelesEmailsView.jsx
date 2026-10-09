import React, { useCallback, useEffect, useState } from 'react';
import {
    CheckCircle2,
    Clock,
    Copy,
    Edit2,
    Eye,
    FileText,
    Filter,
    Mail,
    Plus,
    RefreshCw,
    Search,
    Send,
    Trash2,
    X,
} from 'lucide-react';
import { getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';

export function ModelesEmailsView() {
    const [modeles, setModeles] = useState([]);
    const [referentiels, setReferentiels] = useState({ types: [], statuts: [], variables_disponibles: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtres
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterActif, setFilterActif] = useState('');

    // Modal Création / Édition
    const [modalOpen, setModalOpen] = useState(false);
    const [editingModele, setEditingModele] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        nom_modele: '',
        id_type_message: '',
        id_statut_candidature: '',
        objet: '',
        contenu: '',
        envoi_automatique: false,
        actif: true,
    });

    // Modal Aperçu
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Charger les référentiels et la liste
    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [refRes, listRes] = await Promise.all([
                getJson('/api/modeles-messages/referentiels'),
                getJson('/api/modeles-messages'),
            ]);

            if (refRes?.data) setReferentiels(refRes.data);
            if (listRes?.data) setModeles(listRes.data);
        } catch (err) {
            setError(err.message || 'Impossible de charger les modèles de messages.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Ouvrir modal création
    const handleOpenCreate = () => {
        setEditingModele(null);
        setFormData({
            nom_modele: '',
            id_type_message: referentiels.types?.[0]?.id_type_message || '1',
            id_statut_candidature: '',
            objet: '',
            contenu: '',
            envoi_automatique: false,
            actif: true,
        });
        setFormError('');
        setModalOpen(true);
    };

    // Ouvrir modal édition
    const handleOpenEdit = (mod) => {
        setEditingModele(mod);
        setFormData({
            nom_modele: mod.nom_modele,
            id_type_message: String(mod.id_type_message || ''),
            id_statut_candidature: mod.id_statut_candidature ? String(mod.id_statut_candidature) : '',
            objet: mod.objet,
            contenu: mod.contenu,
            envoi_automatique: Boolean(mod.envoi_automatique),
            actif: Boolean(mod.actif),
        });
        setFormError('');
        setModalOpen(true);
    };

    // Insérer une variable dans le curseur ou à la fin
    const handleInsertTag = (tag) => {
        setFormData((prev) => ({
            ...prev,
            contenu: prev.contenu + (prev.contenu ? ' ' : '') + tag,
        }));
    };

    // Sauvegarder
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        if (formData.envoi_automatique && !formData.id_statut_candidature) {
            setFormError('Pour un envoi automatique, vous devez obligatoirement sélectionner un statut déclencheur.');
            setSaving(false);
            return;
        }

        try {
            const payload = {
                nom_modele: formData.nom_modele.trim(),
                id_type_message: Number(formData.id_type_message),
                id_statut_candidature: formData.id_statut_candidature ? Number(formData.id_statut_candidature) : null,
                objet: formData.objet.trim(),
                contenu: formData.contenu.trim(),
                envoi_automatique: formData.envoi_automatique,
                actif: formData.actif,
            };

            if (editingModele) {
                await sendJson(`/api/modeles-messages/${editingModele.id_modele_message}`, {
                    method: 'PUT',
                    body: payload,
                });
            } else {
                await sendJson('/api/modeles-messages', {
                    method: 'POST',
                    body: payload,
                });
            }

            setModalOpen(false);
            loadData();
        } catch (err) {
            setFormError(err.message || 'Erreur lors de l’enregistrement du modèle.');
        } finally {
            setSaving(false);
        }
    };

    // Supprimer
    const handleDelete = async (mod) => {
        if (!window.confirm(`Confirmez-vous la suppression du modèle "${mod.nom_modele}" ?`)) return;

        try {
            await sendJson(`/api/modeles-messages/${mod.id_modele_message}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            alert(err.message || 'Erreur lors de la suppression.');
        }
    };

    // Ouvrir aperçu d'un modèle
    const handleOpenPreview = async (mod) => {
        setPreviewLoading(true);
        setPreviewOpen(true);
        try {
            const res = await sendJson('/api/modeles-messages/apercu', {
                method: 'POST',
                body: {
                    objet: mod.objet,
                    contenu: mod.contenu,
                },
            });
            setPreviewData(res?.data || null);
        } catch (err) {
            console.error('Erreur prévisualisation', err);
        } finally {
            setPreviewLoading(false);
        }
    };

    // Filtrage local
    const filteredModeles = modeles.filter((m) => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchName = m.nom_modele?.toLowerCase().includes(q);
            const matchSubject = m.objet?.toLowerCase().includes(q);
            if (!matchName && !matchSubject) return false;
        }
        if (filterType && String(m.id_type_message) !== String(filterType)) {
            return false;
        }
        if (filterActif === 'true' && !m.actif) return false;
        if (filterActif === 'false' && m.actif) return false;
        return true;
    });

    if (loading) return <LoadingState message="Chargement des modèles d'e-mails..." />;
    if (error) return <ErrorState message={error} onRetry={loadData} />;

    return (
        <div className="view-container" style={{ padding: '24px' }}>
            {/* EN-TÊTE DE LA PAGE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Modèles d'E-mails RH
                    </h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                        Créez et personnalisez les templates de communication automatique et manuelle avec variables dynamiques.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="action-button secondary"
                        onClick={loadData}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        title="Actualiser"
                    >
                        <RefreshCw size={16} />
                        <span>Actualiser</span>
                    </button>
                    <button
                        className="action-button primary"
                        onClick={handleOpenCreate}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Plus size={16} />
                        <span>Nouveau modèle</span>
                    </button>
                </div>
            </div>

            {/* BARRE DE RECHERCHE ET FILTRES */}
            <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-field" style={{ flex: '1 1 280px' }}>
                    <Search size={16} />
                    <input
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher par nom ou objet d’e-mail..."
                        style={{ width: '100%', height: '40px', padding: '0 12px 0 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        type="search"
                        value={searchQuery}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <select
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff' }}
                        value={filterType}
                    >
                        <option value="">Tous les types de messages</option>
                        {referentiels.types?.map((t) => (
                            <option key={t.id_type_message} value={t.id_type_message}>
                                {t.libelle}
                            </option>
                        ))}
                    </select>

                    <select
                        onChange={(e) => setFilterActif(e.target.value)}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff' }}
                        value={filterActif}
                    >
                        <option value="">Tous les statuts</option>
                        <option value="true">Actifs uniquement</option>
                        <option value="false">Inactifs</option>
                    </select>
                </div>
            </div>

            {/* LISTE DES MODÈLES */}
            {!filteredModeles.length ? (
                <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0', color: '#64748b' }}>
                    <Mail size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Aucun modèle trouvé</h3>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem' }}>Modifiez vos critères de recherche ou créez un nouveau modèle d'e-mail.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {filteredModeles.map((mod) => (
                        <div
                            key={mod.id_modele_message}
                            style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                                opacity: mod.actif ? 1 : 0.65,
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <span className="badge blue" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                                        {mod.type_message?.libelle || 'Message'}
                                    </span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {mod.envoi_automatique ? (
                                            <span className="badge green" style={{ fontSize: '11px' }}>Envoi Auto</span>
                                        ) : null}
                                        {!mod.actif ? (
                                            <span className="badge gray" style={{ fontSize: '11px' }}>Inactif</span>
                                        ) : null}
                                    </div>
                                </div>

                                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                                    {mod.nom_modele}
                                </h3>

                                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                                    <strong>Objet :</strong> <span style={{ color: '#1e293b' }}>{mod.objet}</span>
                                </div>

                                {mod.statut_candidature ? (
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                                        ⚡ Déclencheur : Statut candidature <strong>"{mod.statut_candidature.libelle}"</strong>
                                    </div>
                                ) : null}

                                <div
                                    style={{
                                        fontSize: '13px',
                                        color: '#64748b',
                                        background: '#f8fafc',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        maxHeight: '110px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'pre-line',
                                        lineHeight: '1.45',
                                        border: '1px solid #f1f5f9',
                                    }}
                                >
                                    {mod.contenu}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                                <button
                                    className="ghost-button"
                                    onClick={() => handleOpenPreview(mod)}
                                    style={{ fontSize: '12.5px', padding: '4px 8px', color: '#2563eb' }}
                                    title="Aperçu avec données réelles"
                                    type="button"
                                >
                                    <Eye size={15} />
                                    <span>Aperçu</span>
                                </button>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="action-button secondary"
                                        onClick={() => handleOpenEdit(mod)}
                                        style={{ padding: '6px 10px', fontSize: '12.5px' }}
                                        title="Modifier"
                                        type="button"
                                    >
                                        <Edit2 size={14} />
                                        <span>Modifier</span>
                                    </button>
                                    <button
                                        className="ghost-button danger"
                                        onClick={() => handleDelete(mod)}
                                        style={{ padding: '6px', borderRadius: '6px' }}
                                        title="Supprimer"
                                        type="button"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL CRÉATION / MODIFICATION */}
            {modalOpen ? (
                <div className="modal-backdrop" onClick={() => setModalOpen(false)} role="dialog" aria-modal="true">
                    <div
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '720px',
                            width: '94%',
                            maxHeight: '92vh',
                            overflowY: 'auto',
                            padding: '24px',
                            borderRadius: '12px',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                                {editingModele ? 'Modifier le modèle de message' : 'Nouveau modèle de message'}
                            </h2>
                            <button
                                className="ghost-button"
                                onClick={() => setModalOpen(false)}
                                style={{ padding: '6px', borderRadius: '50%' }}
                                type="button"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {formError ? (
                            <div className="status-pill danger" style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px' }}>
                                {formError}
                            </div>
                        ) : null}

                        <form onSubmit={handleSave} style={{ display: 'grid', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                    Intitulé du modèle *
                                </label>
                                <input
                                    onChange={(e) => setFormData({ ...formData, nom_modele: e.target.value })}
                                    placeholder="Ex: Convocation Entretien RH"
                                    required
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    type="text"
                                    value={formData.nom_modele}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                        Type de message *
                                    </label>
                                    <select
                                        onChange={(e) => setFormData({ ...formData, id_type_message: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                                        value={formData.id_type_message}
                                    >
                                        {referentiels.types?.map((t) => (
                                            <option key={t.id_type_message} value={t.id_type_message}>
                                                {t.libelle}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                        Statut déclencheur (pour envoi auto)
                                    </label>
                                    <select
                                        onChange={(e) => setFormData({ ...formData, id_statut_candidature: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                                        value={formData.id_statut_candidature}
                                    >
                                        <option value="">-- Aucun statut associé --</option>
                                        {referentiels.statuts?.map((s) => (
                                            <option key={s.id_statut_candidature} value={s.id_statut_candidature}>
                                                {s.libelle}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                    Objet de l'e-mail *
                                </label>
                                <input
                                    onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                                    placeholder="Ex: AlpA Ciment - Convocation : Entretien pour {poste}"
                                    required
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    type="text"
                                    value={formData.objet}
                                />
                            </div>

                            {/* INSERTION DES BALISES DE FUSION */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                    Insérer une variable dynamique dans le message :
                                </label>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    {referentiels.variables_disponibles?.map((v) => (
                                        <button
                                            key={v.cle}
                                            className="action-button secondary"
                                            onClick={() => handleInsertTag(v.cle)}
                                            style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '6px' }}
                                            title={v.description}
                                            type="button"
                                        >
                                            + {v.cle}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                    Corps du message *
                                </label>
                                <textarea
                                    onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                                    placeholder="Rédigez le texte du message..."
                                    required
                                    rows={9}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit', lineHeight: '1.5' }}
                                    value={formData.contenu}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', cursor: 'pointer', fontWeight: 500 }}>
                                    <input
                                        checked={formData.envoi_automatique}
                                        onChange={(e) => setFormData({ ...formData, envoi_automatique: e.target.checked })}
                                        type="checkbox"
                                    />
                                    <span>Déclencher l’envoi automatique sur passage au statut</span>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', cursor: 'pointer', fontWeight: 500 }}>
                                    <input
                                        checked={formData.actif}
                                        onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                                        type="checkbox"
                                    />
                                    <span>Modèle actif</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                                <button
                                    className="action-button secondary"
                                    disabled={saving}
                                    onClick={() => setModalOpen(false)}
                                    type="button"
                                >
                                    Annuler
                                </button>
                                <button
                                    className="action-button primary"
                                    disabled={saving}
                                    type="submit"
                                >
                                    {saving ? 'Enregistrement...' : editingModele ? 'Mettre à jour' : 'Créer le modèle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {/* MODAL APERÇU */}
            {previewOpen ? (
                <div className="modal-backdrop" onClick={() => setPreviewOpen(false)} role="dialog" aria-modal="true">
                    <div
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '620px',
                            width: '92%',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            padding: '24px',
                            borderRadius: '12px',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Eye color="#2563eb" size={20} />
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                                    Aperçu du message (Simulation)
                                </h3>
                            </div>
                            <button
                                className="ghost-button"
                                onClick={() => setPreviewOpen(false)}
                                style={{ padding: '6px', borderRadius: '50%' }}
                                type="button"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {previewLoading ? (
                            <LoadingState message="Génération de l'aperçu..." />
                        ) : previewData ? (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                                    <div><strong>Objet généré :</strong> {previewData.objet}</div>
                                    {previewData.candidat ? (
                                        <div style={{ marginTop: '4px', color: '#64748b' }}>
                                            <strong>Exemple candidat test :</strong> {previewData.candidat.prenom} {previewData.candidat.nom} ({previewData.candidat.email})
                                        </div>
                                    ) : null}
                                </div>

                                <div
                                    style={{
                                        background: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        padding: '18px',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        whiteSpace: 'pre-line',
                                        color: '#1e293b',
                                    }}
                                >
                                    {previewData.contenu}
                                </div>
                            </div>
                        ) : null}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button
                                className="action-button secondary"
                                onClick={() => setPreviewOpen(false)}
                                type="button"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
