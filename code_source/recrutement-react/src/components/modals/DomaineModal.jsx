import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Save, X } from 'lucide-react';
import { sendJson } from '../../api/client';

export function DomaineModal({ directionsList = [], domaine = null, onClose, onSuccess }) {
    const [nomDomaine, setNomDomaine] = useState(domaine?.nom_domaine ?? '');
    const [idDirection, setIdDirection] = useState(domaine?.id_direction ? String(domaine.id_direction) : '');
    const [valide, setValide] = useState(domaine?.valide ?? true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    async function handleSubmit(e) {
        e.preventDefault();
        const name = nomDomaine.trim();
        if (!name || !idDirection) return;

        setSubmitting(true);
        setError('');

        try {
            const endpoint = domaine
                ? `/api/referentiels/domaines/${domaine.id}`
                : '/api/referentiels/domaines';
            const method = domaine ? 'PUT' : 'POST';

            const res = await sendJson(endpoint, {
                method,
                body: {
                    nom_domaine: name,
                    id_direction: Number(idDirection),
                    valide: Boolean(valide),
                },
            });

            if (onSuccess) await onSuccess(res?.data ?? res);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '90%' }}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-icon-badge">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h3 className="modal-title">
                                {domaine ? 'Modifier le Domaine' : 'Nouveau Domaine d\'Expertise'}
                            </h3>
                            <p className="modal-subtitle">Rattacher un domaine d'activité à une direction</p>
                        </div>
                    </div>
                    <button className="icon-button" onClick={onClose} type="button" aria-label="Fermer">
                        <X size={18} />
                    </button>
                </div>

                {error ? <p className="form-error" style={{ marginBottom: '14px', padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</p> : null}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Nom du domaine *</span>
                        <input
                            autoFocus
                            onChange={(e) => setNomDomaine(e.target.value)}
                            placeholder="Ex : Développement Web & Mobile"
                            required
                            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                            value={nomDomaine}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Direction de rattachement *</span>
                        <select
                            onChange={(e) => setIdDirection(e.target.value)}
                            required
                            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
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

                    <div className="modal-footer">
                        <button className="ghost-button" onClick={onClose} type="button">
                            <span>Annuler</span>
                        </button>
                        <button className="modal-submit-btn" disabled={submitting} type="submit">
                            <Save size={16} />
                            <span>{submitting ? 'Enregistrement...' : domaine ? 'Mettre à jour' : 'Créer le domaine'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
