import React, { useState } from 'react';
import { Layers, Save, X } from 'lucide-react';
import { sendJson } from '../../api/client';

export function DomaineModal({ directionsList = [], domaine = null, onClose, onSuccess }) {
    const [nomDomaine, setNomDomaine] = useState(domaine?.nom_domaine ?? '');
    const [idDirection, setIdDirection] = useState(domaine?.direction?.id ? String(domaine.direction.id) : '');
    const [valide, setValide] = useState(domaine?.valide ?? true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        const name = nomDomaine.trim();
        if (!name || !idDirection) return;

        setSubmitting(true);
        setError('');

        const payload = {
            nom_domaine: name,
            id_direction: Number(idDirection),
            valide: valide,
        };

        try {
            if (domaine?.id) {
                await sendJson(`/api/domaine/${domaine.id}`, {
                    method: 'PUT',
                    body: payload,
                });
            } else {
                await sendJson('/api/domaines', {
                    body: payload,
                });
            }
            if (onSuccess) await onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '90%', background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ede9fe', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers color="#6d28d9" size={22} />
                        </div>
                        <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '18px', fontWeight: '700' }}>
                            {domaine ? 'Modifier le Domaine' : 'Nouveau Domaine d\'Expertise'}
                        </h3>
                    </div>
                    <button className="icon-button" onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                {error ? <p className="form-error" style={{ marginBottom: '14px', padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</p> : null}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Nom du domaine *</span>
                        <input
                            onChange={(e) => setNomDomaine(e.target.value)}
                            placeholder="Ex : Développement Web & Mobile"
                            required
                            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                            value={nomDomaine}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Direction de rattachement *</span>
                        <select
                            onChange={(e) => setIdDirection(e.target.value)}
                            required
                            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                            value={idDirection}
                        >
                            <option value="">Sélectionner une direction</option>
                            {directionsList.map((dir) => (
                                <option key={dir.id} value={dir.id}>
                                    {dir.nom_direction}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="checkbox-line" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', marginTop: '4px' }}>
                        <input
                            checked={valide}
                            onChange={(e) => setValide(e.target.checked)}
                            type="checkbox"
                        />
                        <span>Domaine validé par la Direction RH</span>
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <button className="ghost-button" onClick={onClose} type="button">
                            <span>Annuler</span>
                        </button>
                        <button
                            disabled={submitting}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '9px 18px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                                cursor: 'pointer',
                            }}
                            type="submit"
                        >
                            <Save size={16} />
                            <span>{submitting ? 'Enregistrement...' : domaine ? 'Mettre à jour' : 'Créer le domaine'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
