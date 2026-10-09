import React, { useEffect, useState } from 'react';
import { Eye, Mail, Send, X } from 'lucide-react';
import { getJson, sendJson } from '../../api/client';

export function EnvoyerMessageModal({ isOpen, onClose, onSuccess, candidature }) {
    const [modeles, setModeles] = useState([]);
    const [selectedModeleId, setSelectedModeleId] = useState('');
    const [objet, setObjet] = useState('');
    const [contenu, setContenu] = useState('');
    const [idTypeMessage, setIdTypeMessage] = useState('6'); // 6 = Autre
    const [loadingModeles, setLoadingModeles] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSelectedModeleId('');
            setObjet('');
            setContenu('');
            setError('');
            setSuccessMsg('');
            return;
        }

        const fetchModeles = async () => {
            setLoadingModeles(true);
            try {
                const res = await getJson('/api/modeles-messages?actif=true');
                if (res?.data) {
                    setModeles(res.data);
                }
            } catch (err) {
                console.error('Erreur chargement modèles d\'emails', err);
            } finally {
                setLoadingModeles(false);
            }
        };

        fetchModeles();
    }, [isOpen]);

    // Lorsqu'on sélectionne un modèle dans la liste
    const handleSelectModele = async (e) => {
        const id = e.target.value;
        setSelectedModeleId(id);
        if (!id) return;

        const found = modeles.find((m) => String(m.id_modele_message) === String(id));
        if (found) {
            setIdTypeMessage(found.id_type_message || '6');
            // Appel à l'API d'aperçu pour injecter immédiatement les variables du candidat courant
            try {
                setPreviewing(true);
                const res = await sendJson('/api/modeles-messages/apercu', {
                    method: 'POST',
                    body: {
                        id_candidature: candidature?.id_candidature,
                        objet: found.objet,
                        contenu: found.contenu,
                    },
                });
                if (res?.data) {
                    setObjet(res.data.objet || found.objet);
                    setContenu(res.data.contenu || found.contenu);
                } else {
                    setObjet(found.objet);
                    setContenu(found.contenu);
                }
            } catch {
                setObjet(found.objet);
                setContenu(found.contenu);
            } finally {
                setPreviewing(false);
            }
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!candidature?.id_candidature) return;

        if (!objet.trim() || !contenu.trim()) {
            setError('L’objet et le corps du message sont obligatoires.');
            return;
        }

        setSending(true);
        setError('');
        try {
            await sendJson(`/api/candidature/${candidature.id_candidature}/communications`, {
                method: 'POST',
                body: {
                    id_modele_message: selectedModeleId || null,
                    id_type_message: idTypeMessage || 6,
                    objet: objet.trim(),
                    contenu: contenu.trim(),
                    mode_envoi: 'manuel',
                },
            });

            setSuccessMsg('E-mail envoyé avec succès.');
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1000);
        } catch (err) {
            setError(err.message || 'Erreur lors de l’envoi de l’e-mail.');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    const candidatEmail = candidature?.candidat?.email || 'Inconnu';
    const candidatNom = `${candidature?.candidat?.prenom || ''} ${candidature?.candidat?.nom || ''}`.trim() || 'Candidat';

    return (
        <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '650px',
                    width: '92%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail color="#2563eb" size={22} />
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                            Envoyer un message au candidat
                        </h2>
                    </div>
                    <button
                        className="ghost-button"
                        onClick={onClose}
                        style={{ padding: '6px', borderRadius: '50%' }}
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13.5px' }}>
                    <div><strong>Destinataire :</strong> {candidatNom} &lt;{candidatEmail}&gt;</div>
                    {candidature?.offre?.titre_poste ? (
                        <div style={{ marginTop: '4px', color: '#64748b' }}>
                            <strong>Offre concernée :</strong> {candidature.offre.titre_poste}
                        </div>
                    ) : null}
                </div>

                {error ? (
                    <div className="status-pill danger" style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px' }}>
                        {error}
                    </div>
                ) : null}

                {successMsg ? (
                    <div className="status-pill success" style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px' }}>
                        {successMsg}
                    </div>
                ) : null}

                <form onSubmit={handleSend} style={{ display: 'grid', gap: '14px' }}>
                    {/* CHOIX DU MODÈLE */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Partir d’un modèle existant (optionnel)
                        </label>
                        <select
                            disabled={loadingModeles || sending}
                            onChange={handleSelectModele}
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px',
                                backgroundColor: '#ffffff',
                            }}
                            value={selectedModeleId}
                        >
                            <option value="">-- Message libre personnalisé --</option>
                            {modeles.map((m) => (
                                <option key={m.id_modele_message} value={m.id_modele_message}>
                                    {m.nom_modele} ({m.type_message?.libelle || 'Type'})
                                </option>
                            ))}
                        </select>
                        {previewing ? (
                            <small style={{ color: '#2563eb', display: 'block', marginTop: '4px' }}>
                                Remplacement automatique des variables en cours...
                            </small>
                        ) : null}
                    </div>

                    {/* OBJET DU MESSAGE */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Objet de l’e-mail *
                        </label>
                        <input
                            disabled={sending}
                            onChange={(e) => setObjet(e.target.value)}
                            placeholder="Objet du message..."
                            required
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px',
                            }}
                            type="text"
                            value={objet}
                        />
                    </div>

                    {/* CORPS DU MESSAGE */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Corps de l’e-mail *
                        </label>
                        <textarea
                            disabled={sending}
                            onChange={(e) => setContenu(e.target.value)}
                            placeholder="Rédigez votre message ici..."
                            required
                            rows={8}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                lineHeight: '1.5',
                            }}
                            value={contenu}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                        <button
                            className="action-button secondary"
                            disabled={sending}
                            onClick={onClose}
                            type="button"
                        >
                            Annuler
                        </button>
                        <button
                            className="action-button primary"
                            disabled={sending || previewing}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            type="submit"
                        >
                            <Send size={16} />
                            <span>{sending ? 'Envoi en cours...' : 'Envoyer l’e-mail'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
