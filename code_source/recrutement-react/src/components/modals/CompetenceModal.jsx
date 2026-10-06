import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, Sparkles, X } from 'lucide-react';
import { sendJson } from '../../api/client';

export function CompetenceModal({ competence = null, onClose, onSuccess, typesList = [] }) {
    const [nomCompetence, setNomCompetence] = useState(competence?.nom ?? '');
    const [idTypeCompetence, setIdTypeCompetence] = useState(competence?.id_type_competence ? String(competence.id_type_competence) : '1');
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
        const name = nomCompetence.trim();
        if (!name || !idTypeCompetence) return;

        setSubmitting(true);
        setError('');

        try {
            const res = await sendJson('/api/competences', {
                body: {
                    nom_competence: name,
                    id_type_competence: Number(idTypeCompetence),
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
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '90%' }}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-icon-badge">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="modal-title">
                                {competence ? 'Modifier la Compétence' : 'Nouvelle Compétence'}
                            </h3>
                            <p className="modal-subtitle">Ajouter ou ajuster une compétence dans le référentiel RH</p>
                        </div>
                    </div>
                    <button className="icon-button" onClick={onClose} type="button" aria-label="Fermer">
                        <X size={18} />
                    </button>
                </div>

                {error ? <p className="form-error" style={{ marginBottom: '14px', padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</p> : null}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Nom de la compétence *</span>
                        <input
                            autoFocus
                            onChange={(e) => setNomCompetence(e.target.value)}
                            placeholder="Ex : React.js, Management, Anglais courant..."
                            required
                            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                            value={nomCompetence}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Type de compétence *</span>
                        <select
                            onChange={(e) => setIdTypeCompetence(e.target.value)}
                            required
                            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                            value={idTypeCompetence}
                        >
                            {typesList.length ? (
                                typesList.map((t) => (
                                    <option key={t.id_type_competence} value={t.id_type_competence}>
                                        {t.libelle}
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value="1">Savoir-faire Technique</option>
                                    <option value="2">Soft Skill / Humaine</option>
                                    <option value="3">Langue vivante</option>
                                </>
                            )}
                        </select>
                    </label>

                    <div className="modal-footer">
                        <button className="ghost-button" onClick={onClose} type="button">
                            <span>Annuler</span>
                        </button>
                        <button className="modal-submit-btn" disabled={submitting} type="submit">
                            <Save size={16} />
                            <span>{submitting ? 'Enregistrement...' : 'Ajouter la compétence'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
