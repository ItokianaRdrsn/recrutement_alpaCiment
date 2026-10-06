import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Save, X } from 'lucide-react';
import { sendJson } from '../../api/client';

export function DirectionModal({ direction = null, onClose, onSuccess }) {
    const [nomDirection, setNomDirection] = useState(direction?.nom_direction ?? '');
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
        const name = nomDirection.trim();
        if (!name) return;

        setSubmitting(true);
        setError('');

        try {
            const endpoint = direction
                ? `/api/referentiels/directions/${direction.id}`
                : '/api/referentiels/directions';
            const method = direction ? 'PUT' : 'POST';

            const res = await sendJson(endpoint, {
                method,
                body: { nom_direction: name },
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
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '90%' }}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-icon-badge">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h3 className="modal-title">
                                {direction ? 'Modifier la Direction' : 'Nouvelle Direction'}
                            </h3>
                            <p className="modal-subtitle">Définir ou ajuster une direction organisationnelle</p>
                        </div>
                    </div>
                    <button className="icon-button" onClick={onClose} type="button" aria-label="Fermer">
                        <X size={18} />
                    </button>
                </div>

                {error ? <p className="form-error" style={{ marginBottom: '14px', padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</p> : null}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Nom de la direction *</span>
                        <input
                            autoFocus
                            onChange={(e) => setNomDirection(e.target.value)}
                            placeholder="Ex : Direction Informatique & SI"
                            required
                            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                            value={nomDirection}
                        />
                    </label>

                    <div className="modal-footer">
                        <button className="ghost-button" onClick={onClose} type="button">
                            <span>Annuler</span>
                        </button>
                        <button className="modal-submit-btn" disabled={submitting} type="submit">
                            <Save size={16} />
                            <span>{submitting ? 'Enregistrement...' : direction ? 'Mettre à jour' : 'Créer la direction'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
