import React, { useEffect, useState } from 'react';
import {
    AlertCircle,
    Calendar,
    Clock,
    FileText,
    MapPin,
    Phone,
    Trash2,
    User,
    Video,
    X,
} from 'lucide-react';
import { getJson, sendJson } from '../../api/client';

export function RendezVousModal({
    isOpen,
    onClose,
    onSuccess,
    initialData = null,
    defaultCandidature = null,
    referentiels = null,
}) {
    const isEditing = Boolean(initialData?.id_rendez_vous);

    // Fallbacks robustes immédiats
    const defaultTypes = [
        { id_type_rendez_vous: 1, libelle: 'Test' },
        { id_type_rendez_vous: 2, libelle: 'Entretien' },
    ];
    const defaultStatuts = [
        { id_statut_rendez_vous: 1, libelle: 'A venir' },
        { id_statut_rendez_vous: 2, libelle: 'Realise' },
        { id_statut_rendez_vous: 3, libelle: 'Annule' },
    ];
    const defaultModes = [
        { id_mode_realisation: 1, libelle: 'Presentiel' },
        { id_mode_realisation: 2, libelle: 'Visioconference' },
        { id_mode_realisation: 3, libelle: 'Telephone' },
    ];

    const [types, setTypes] = useState(referentiels?.types?.length ? referentiels.types : defaultTypes);
    const [statuts, setStatuts] = useState(referentiels?.statuts?.length ? referentiels.statuts : defaultStatuts);
    const [modes, setModes] = useState(referentiels?.modes?.length ? referentiels.modes : defaultModes);
    const [responsables, setResponsables] = useState(referentiels?.responsables || []);
    const [candidatures, setCandidatures] = useState([]);
    const [loadingRefs, setLoadingRefs] = useState(false);

    // Form fields
    const [idCandidature, setIdCandidature] = useState(
        initialData?.id_candidature || defaultCandidature?.id_candidature || ''
    );
    const [idTypeRendezVous, setIdTypeRendezVous] = useState(initialData?.id_type_rendez_vous || '2'); // 2 = Entretien
    const [idStatutRendezVous, setIdStatutRendezVous] = useState(initialData?.id_statut_rendez_vous || '1'); // 1 = A venir
    const [idModeRealisation, setIdModeRealisation] = useState(initialData?.id_mode_realisation || '1'); // 1 = Presentiel
    const [idUtilisateur, setIdUtilisateur] = useState(initialData?.id_utilisateur || '');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [detailsLieu, setDetailsLieu] = useState(initialData?.details_lieu || '');
    const [commentaire, setCommentaire] = useState(initialData?.commentaire || '');
    const [updateCandidatureStatut, setUpdateCandidatureStatut] = useState(false);
    const [envoyerNotificationEmail, setEnvoyerNotificationEmail] = useState(true);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Format local datetime for input (YYYY-MM-DDTHH:mm)
    const toLocalInputString = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    useEffect(() => {
        if (!isOpen) return;

        setError('');
        if (initialData) {
            setIdCandidature(initialData.id_candidature || '');
            setIdTypeRendezVous(String(initialData.id_type_rendez_vous || '2'));
            setIdStatutRendezVous(String(initialData.id_statut_rendez_vous || '1'));
            setIdModeRealisation(String(initialData.id_mode_realisation || '1'));
            setIdUtilisateur(initialData.id_utilisateur ? String(initialData.id_utilisateur) : '');
            setDateDebut(toLocalInputString(initialData.date_debut));
            setDateFin(toLocalInputString(initialData.date_fin));
            setDetailsLieu(initialData.details_lieu || '');
            setCommentaire(initialData.commentaire || '');
        } else {
            setIdCandidature(defaultCandidature?.id_candidature ? String(defaultCandidature.id_candidature) : '');
            setIdTypeRendezVous('2');
            setIdStatutRendezVous('1');
            setIdModeRealisation('1');
            setIdUtilisateur('');
            // Par défaut créneau de 1 heure demain à 09:00
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            const endTomorrow = new Date(tomorrow);
            endTomorrow.setHours(10, 0, 0, 0);
            setDateDebut(toLocalInputString(tomorrow.toISOString()));
            setDateFin(toLocalInputString(endTomorrow.toISOString()));
            setDetailsLieu('');
            setCommentaire('');
            setUpdateCandidatureStatut(false);
        }

        // Charger les référentiels systématiquement pour avoir types, statuts, modes et responsables
        const fetchRefsAndCandidatures = async () => {
            try {
                const needsRefs = !referentiels?.types || referentiels.types.length === 0;
                if (needsRefs) {
                    const refsRes = await getJson('/api/rendez-vous/referentiels');
                    if (refsRes?.data) {
                        setTypes(refsRes.data.types || []);
                        setStatuts(refsRes.data.statuts || []);
                        setModes(refsRes.data.modes || []);
                        setResponsables(refsRes.data.responsables || []);
                    }
                } else {
                    setTypes(referentiels.types || []);
                    setStatuts(referentiels.statuts || []);
                    setModes(referentiels.modes || []);
                    setResponsables(referentiels.responsables || []);
                }

                // Charger la liste des candidatures si on n'a pas de candidature figée
                if (!defaultCandidature) {
                    const candsRes = await getJson('/api/candidatures?per_page=100');
                    if (candsRes?.data) {
                        setCandidatures(candsRes.data);
                    }
                }
            } catch (err) {
                console.error('Erreur chargement référentiels RDV', err);
            } finally {
                setLoadingRefs(false);
            }
        };

        fetchRefsAndCandidatures();
    }, [isOpen, initialData, defaultCandidature, referentiels]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!idCandidature) {
            setError('Veuillez sélectionner un candidat / une candidature.');
            return;
        }

        if (!dateDebut || !dateFin) {
            setError('Veuillez renseigner les dates et heures de début et de fin.');
            return;
        }

        if (new Date(dateFin) <= new Date(dateDebut)) {
            setError('L’heure de fin doit être postérieure à l’heure de début.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                id_candidature: parseInt(idCandidature, 10),
                id_type_rendez_vous: parseInt(idTypeRendezVous, 10),
                id_statut_rendez_vous: parseInt(idStatutRendezVous, 10),
                id_mode_realisation: parseInt(idModeRealisation, 10),
                id_utilisateur: idUtilisateur ? parseInt(idUtilisateur, 10) : null,
                date_debut: new Date(dateDebut).toISOString(),
                date_fin: new Date(dateFin).toISOString(),
                details_lieu: detailsLieu.trim() || null,
                commentaire: commentaire.trim() || null,
                envoyer_notification_email: envoyerNotificationEmail,
            };

            // Statut cible : si coché, statut 3 = Test ou statut 4 = Entretien
            if (updateCandidatureStatut) {
                payload.id_statut_candidature_cible = parseInt(idTypeRendezVous, 10) === 1 ? 3 : 4;
            }

            let response;
            if (isEditing) {
                response = await sendJson(`/api/rendez-vous/${initialData.id_rendez_vous}`, {
                    method: 'PUT',
                    body: payload,
                });
            } else {
                response = await sendJson('/api/rendez-vous', {
                    method: 'POST',
                    body: payload,
                });
            }

            if (onSuccess) {
                onSuccess(response?.data || response);
            }
            onClose();
        } catch (err) {
            setError(err.message || 'Une erreur est survenue lors de l’enregistrement du rendez-vous.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelRdv = async () => {
        if (!isEditing) return;
        if (!window.confirm('Confirmez-vous l’annulation de ce rendez-vous ?')) return;

        setSaving(true);
        try {
            const res = await sendJson(`/api/rendez-vous/${initialData.id_rendez_vous}/annuler`, {
                method: 'POST',
                body: { motif: 'Annulé depuis l’agenda RH' },
            });
            if (onSuccess) onSuccess(res?.data || res);
            onClose();
        } catch (err) {
            setError(err.message || 'Impossible d’annuler le rendez-vous.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRdv = async () => {
        if (!isEditing) return;
        if (!window.confirm('Voulez-vous supprimer définitivement ce rendez-vous ?')) return;

        setSaving(true);
        try {
            await sendJson(`/api/rendez-vous/${initialData.id_rendez_vous}`, {
                method: 'DELETE',
            });
            if (onSuccess) onSuccess({ deleted: true, id_rendez_vous: initialData.id_rendez_vous });
            onClose();
        } catch (err) {
            setError(err.message || 'Impossible de supprimer le rendez-vous.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '16px',
            }}
        >
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    maxWidth: '650px',
                    width: '100%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f8fafc',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                            style={{
                                background: '#eff6ff',
                                color: '#2563eb',
                                padding: '8px',
                                borderRadius: '8px',
                                display: 'flex',
                            }}
                        >
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#0f172a' }}>
                                {isEditing ? 'Modifier le Rendez-vous' : 'Planifier un Test ou Entretien'}
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                Agenda RH AlpA Ciment
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {error && (
                            <div
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#b91c1c',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Candidature / Candidat */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                                Candidat / Candidature <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            {defaultCandidature ? (
                                <div
                                    style={{
                                        padding: '10px 14px',
                                        background: '#f1f5f9',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        color: '#1e293b',
                                        fontWeight: 500,
                                    }}
                                >
                                    👤 {defaultCandidature.candidat ? `${defaultCandidature.candidat.prenom} ${defaultCandidature.candidat.nom}` : `Candidature #${defaultCandidature.id_candidature}`}
                                    {defaultCandidature.offre && <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '6px' }}>({defaultCandidature.offre.titre})</span>}
                                </div>
                            ) : (
                                <select
                                    value={idCandidature}
                                    onChange={(e) => setIdCandidature(e.target.value)}
                                    disabled={isEditing}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.875rem',
                                    }}
                                    required
                                >
                                    <option value="">-- Sélectionner un candidat --</option>
                                    {candidatures.map((c) => {
                                        const candidatName = c.candidat ? `${c.candidat.prenom} ${c.candidat.nom}` : `Candidature #${c.id_candidature}`;
                                        const posteName = c.offre?.titre_poste || c.offre?.titre || c.poste_souhaite || 'Candidature spontanée';
                                        return (
                                            <option key={c.id_candidature} value={c.id_candidature}>
                                                #{c.id_candidature} - {candidatName} ({posteName})
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                        </div>

                        {/* Type & Mode */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                                    Type d’événement <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <select
                                    value={idTypeRendezVous}
                                    onChange={(e) => setIdTypeRendezVous(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.875rem',
                                    }}
                                    required
                                >
                                    {types.map((t) => (
                                        <option key={t.id_type_rendez_vous} value={t.id_type_rendez_vous}>
                                            {t.libelle}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                                    Modalité / Mode <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <select
                                    value={idModeRealisation}
                                    onChange={(e) => setIdModeRealisation(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.875rem',
                                    }}
                                    required
                                >
                                    {modes.map((m) => (
                                        <option key={m.id_mode_realisation} value={m.id_mode_realisation}>
                                            {m.libelle}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date Début & Date Fin */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                                    Date et heure de début <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={dateDebut}
                                    onChange={(e) => setDateDebut(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.875rem',
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                                    Date et heure de fin <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={dateFin}
                                    onChange={(e) => setDateFin(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.875rem',
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Responsable RH & Statut */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                                    Responsable RH / Évaluateur
                                </label>
                                <select
                                    value={idUtilisateur}
                                    onChange={(e) => setIdUtilisateur(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    <option value="">Moi-même (utilisateur connecté)</option>
                                    {responsables.map((u) => (
                                        <option key={u.id_utilisateur} value={u.id_utilisateur}>
                                            {u.nom} ({u.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                                    Statut du rendez-vous
                                </label>
                                <select
                                    value={idStatutRendezVous}
                                    onChange={(e) => setIdStatutRendezVous(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    {statuts.map((s) => (
                                        <option key={s.id_statut_rendez_vous} value={s.id_statut_rendez_vous}>
                                            {s.libelle}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Lieu ou Lien visio */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                                Lieu, Salle, Lien Visioconférence ou Téléphone
                            </label>
                            <input
                                type="text"
                                placeholder={
                                    idModeRealisation === '2'
                                        ? 'https://meet.google.com/xyz-abc'
                                        : idModeRealisation === '3'
                                        ? '+261 34 00 000 00'
                                        : 'Salle de réunion RH - Usine AlpA Ciment'
                                }
                                value={detailsLieu}
                                onChange={(e) => setDetailsLieu(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.875rem',
                                }}
                            />
                        </div>

                        {/* Commentaire / Consignes */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                                Consignes / Commentaires pour le candidat ou le recruteur
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Apporter les originaux des diplômes, préparer une présentation de 15 minutes..."
                                value={commentaire}
                                onChange={(e) => setCommentaire(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.875rem',
                                }}
                            />
                        </div>

                        {/* Checkbox mise à jour statut candidature */}
                        {!isEditing && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        id="update-status"
                                        checked={updateCandidatureStatut}
                                        onChange={(e) => setUpdateCandidatureStatut(e.target.checked)}
                                        style={{ width: '16px', height: '16px' }}
                                    />
                                    <label htmlFor="update-status" style={{ fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                                        Mettre à jour automatiquement le statut de la candidature (passer à <em>{idTypeRendezVous === '1' ? 'Test technique' : 'Entretien RH'}</em>)
                                    </label>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        id="notify-email"
                                        checked={envoyerNotificationEmail}
                                        onChange={(e) => setEnvoyerNotificationEmail(e.target.checked)}
                                        style={{ width: '16px', height: '16px' }}
                                    />
                                    <label htmlFor="notify-email" style={{ fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                                        Envoyer automatiquement une convocation par e-mail au candidat avec les détails du créneau
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div
                        style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: isEditing ? 'space-between' : 'flex-end',
                            alignItems: 'center',
                            background: '#f8fafc',
                        }}
                    >
                        {isEditing && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={handleCancelRdv}
                                    disabled={saving || initialData.id_statut_rendez_vous === 3}
                                    className="action-button danger"
                                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                >
                                    Annuler le RDV
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteRdv}
                                    disabled={saving}
                                    className="action-button text"
                                    style={{ fontSize: '0.8rem', color: '#dc2626' }}
                                >
                                    <Trash2 size={14} /> Supprimer
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="action-button secondary"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="action-button primary"
                            >
                                {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Planifier'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
