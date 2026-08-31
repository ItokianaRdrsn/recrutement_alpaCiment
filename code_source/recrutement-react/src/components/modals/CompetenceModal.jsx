import React, { useState } from 'react';
import { Save, Sparkles, X } from 'lucide-react';
import { sendJson } from '../../api/client';

export function CompetenceModal({ competence = null, onClose, onSuccess, typesList = [] }) {
    const [nomCompetence, setNomCompetence] = useState(competence?.nom ?? '');
    const [idTypeCompetence, setIdTypeCompetence] = useState(competence?.id_type_competence ? String(competence.id_type_competence) : '1');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        const name = nomCompetence.trim();
        if (!name || !idTypeCompetence) return;

        setSubmitting(true);
        setError('');

        try {
            await sendJson('/api/competences', {
                body: {
                    nom_competence: name,
                    id_type_competence: Number(idTypeCompetence),
                },
            });
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
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ede9fe', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles color="#6d28d9" size={22} />
                        </div>
                        <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '18px', fontWeight: '700' }}>
                            Nouvelle Compétence
                        </h3>
                    </div>
                    <button className="icon-button" onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                {error ? <p className="form-error" style={{ marginBottom: '14px', padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</p> : null}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Nom de la compétence *</span>
                        <input
                            onChange={(e) => setNomCompetence(e.target.value)}
                            placeholder="Ex : React.js, Management, Anglais courant..."
                            required
                            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                            value={nomCompetence}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Type de compétence *</span>
                        <select
                            onChange={(e) => setIdTypeCompetence(e.target.value)}
                            required
                            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
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
                            <span>{submitting ? 'Enregistrement...' : 'Ajouter la compétence'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
