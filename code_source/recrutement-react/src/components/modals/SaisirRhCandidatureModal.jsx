import React, { useEffect, useState } from 'react';
import { Save, UserPlus, X } from 'lucide-react';
import { getJson, sendFormData } from '../../api/client';

export function SaisirRhCandidatureModal({ initialOffreId = '', onClose, onSuccess, referentiels }) {
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        id_offre: initialOffreId ? String(initialOffreId) : '',
        id_domaine: '',
        poste_souhaite: '',
        message_motivation: '',
    });
    const [cvFile, setCvFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [offresList, setOffresList] = useState([]);

    useEffect(() => {
        getJson('/api/offres?per_page=100')
            .then((res) => setOffresList(res?.data ?? []))
            .catch(() => {});
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('nom', form.nom.trim());
            formData.append('prenom', form.prenom.trim());
            formData.append('email', form.email.trim());
            if (form.telephone) formData.append('telephone', form.telephone.trim());
            if (form.id_offre) formData.append('id_offre', form.id_offre);
            if (form.id_domaine) formData.append('id_domaine', form.id_domaine);
            if (form.poste_souhaite) formData.append('poste_souhaite', form.poste_souhaite.trim());
            if (form.message_motivation) formData.append('message_motivation', form.message_motivation.trim());
            if (cvFile) formData.append('cv', cvFile);

            await sendFormData('/api/candidatures/saisir-rh', formData);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    const meDomaines = referentiels?.domaines ?? [];

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%', zIndex: 1101, background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ede9fe', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserPlus color="#6d28d9" size={22} />
                        </div>
                        <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '18px', fontWeight: '700' }}>Saisie Manuelle d'une Candidature (RH)</h3>
                    </div>
                    <button className="icon-button" onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                {error ? <p className="form-error" style={{ marginBottom: '14px', padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</p> : null}

                <form className="compact-form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Nom du candidat *</span>
                        <input
                            onChange={(e) => setForm((c) => ({ ...c, nom: e.target.value }))}
                            placeholder="Nom"
                            required
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            value={form.nom}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Prénom du candidat *</span>
                        <input
                            onChange={(e) => setForm((c) => ({ ...c, prenom: e.target.value }))}
                            placeholder="Prénom"
                            required
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            value={form.prenom}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Adresse E-mail *</span>
                        <input
                            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                            placeholder="email@exemple.com"
                            required
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            type="email"
                            value={form.email}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Téléphone</span>
                        <input
                            onChange={(e) => setForm((c) => ({ ...c, telephone: e.target.value }))}
                            placeholder="+261 34 00 000 00"
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            value={form.telephone}
                        />
                    </label>

                    <label style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Rattachement à une Offre de recrutement (Publiée uniquement)</span>
                        <select
                            onChange={(e) => setForm((c) => ({ ...c, id_offre: e.target.value }))}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            value={form.id_offre}
                        >
                            <option value="">Candidature Spontanée (Aucune offre spécifique)</option>
                            {offresList.filter((off) => off.statut?.libelle === 'Publiee' || off.statut?.libelle === 'Publiée').map((off) => (
                                <option key={off.id ?? off.id_offre} value={off.id ?? off.id_offre}>
                                    Offre: {off.titre_poste} ({off.direction?.nom ?? off.direction?.nom_direction ?? 'Générale'})
                                </option>
                            ))}
                        </select>
                    </label>

                    {!form.id_offre ? (
                        <>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '600' }}>Domaine (si spontanée)</span>
                                <select
                                    onChange={(e) => setForm((c) => ({ ...c, id_domaine: e.target.value }))}
                                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                    value={form.id_domaine}
                                >
                                    <option value="">Domaines validés RH</option>
                                    {meDomaines.filter((d) => d.valide !== false).map((dom) => (
                                        <option key={dom.id_domaine} value={dom.id_domaine}>
                                            {dom.nom_domaine}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '600' }}>Poste souhaité</span>
                                <input
                                    onChange={(e) => setForm((c) => ({ ...c, poste_souhaite: e.target.value }))}
                                    placeholder="Ex: Chef de projet IT"
                                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                    value={form.poste_souhaite}
                                />
                            </label>
                        </>
                    ) : null}

                    <label style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Document CV (PDF, DOC, DOCX)</span>
                        <input
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            type="file"
                        />
                    </label>

                    <label style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Message de présentation / Note RH</span>
                        <textarea
                            onChange={(e) => setForm((c) => ({ ...c, message_motivation: e.target.value }))}
                            placeholder="Saisir un commentaire ou la lettre de motivation du candidat..."
                            rows={3}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            value={form.message_motivation}
                        />
                    </label>

                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
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
                            <span>{submitting ? 'Enregistrement...' : 'Enregistrer la candidature RH'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
