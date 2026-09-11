import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react';

export default function CandidatureSpontaneePage({ onNavigate, sendFormData }) {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        poste_souhaite: '',
        message_motivation: '',
    });
    const [cvFile, setCvFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        if (!cvFile) {
            setErrorMessage('Veuillez sélectionner votre fichier CV (PDF, Word).');
            return;
        }

        setSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([k, v]) => {
                if (v !== '' && v !== null) {
                    data.append(k, v);
                }
            });
            data.append('cv', cvFile);

            const res = await sendFormData('/api/public/candidature/spontanee', data);
            setSuccessMessage(res?.message ?? 'Votre candidature spontanée a été soumise avec succès !');
        } catch (err) {
            setErrorMessage(err.message || 'Erreur lors de l\'envoi de la candidature.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="portal-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <button
                    className="ghost-button"
                    onClick={() => onNavigate ? onNavigate('/candidat/offres') : window.history.back()}
                    type="button"
                >
                    <ArrowLeft size={18} />
                    <span>Retour aux offres</span>
                </button>
            </div>

            <div className="data-section" style={{ background: '#ffffff', padding: '28px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                    <p className="eyebrow" style={{ color: 'var(--primary)', fontWeight: 600 }}>AlpA Ciment Recrutement</p>
                    <h1 style={{ fontSize: '24px', margin: '4px 0', color: 'var(--text)' }}>Candidature Spontanée</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        Aucune offre ne correspond exactement à votre profil ? Saisissez votre poste souhaité et transmettez votre CV.
                    </p>
                </div>

                {successMessage ? (
                    <div className="feedback-state" style={{ color: 'var(--accent-green)', padding: '30px 0', textAlign: 'center' }}>
                        <CheckCircle2 size={48} style={{ margin: '0 auto 12px auto' }} />
                        <h2 style={{ fontSize: '20px', color: 'var(--text)' }}>Candidature Spontanée Reçue !</h2>
                        <p style={{ color: 'var(--text-muted)' }}>{successMessage}</p>
                        <button
                            className="filter-button"
                            onClick={() => onNavigate ? onNavigate('/candidat/offres') : (window.location.href = '/candidat/offres')}
                            style={{ marginTop: '16px' }}
                            type="button"
                        >
                            Retourner aux offres
                        </button>
                    </div>
                ) : (
                    <form className="compact-form" onSubmit={handleSubmit} style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                        <label>
                            <span style={{ color: 'var(--text)', fontWeight: 500 }}>Nom *</span>
                            <input
                                onChange={(e) => setFormData((c) => ({ ...c, nom: e.target.value }))}
                                placeholder="Votre nom"
                                required
                                value={formData.nom}
                            />
                        </label>

                        <label>
                            <span style={{ color: 'var(--text)', fontWeight: 500 }}>Prénom *</span>
                            <input
                                onChange={(e) => setFormData((c) => ({ ...c, prenom: e.target.value }))}
                                placeholder="Votre prénom"
                                required
                                value={formData.prenom}
                            />
                        </label>

                        <label>
                            <span style={{ color: 'var(--text)', fontWeight: 500 }}>Adresse E-mail *</span>
                            <input
                                onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
                                placeholder="exemple@domaine.com"
                                required
                                type="email"
                                value={formData.email}
                            />
                        </label>

                        <label>
                            <span style={{ color: 'var(--text)', fontWeight: 500 }}>Téléphone</span>
                            <input
                                onChange={(e) => setFormData((c) => ({ ...c, telephone: e.target.value }))}
                                placeholder="+261 34 00 000 00"
                                value={formData.telephone}
                            />
                        </label>

                        <label className="full-span">
                            <span style={{ color: 'var(--text)', fontWeight: 500 }}>Poste souhaité / Domaine d'expertise</span>
                            <input
                                onChange={(e) => setFormData((c) => ({ ...c, poste_souhaite: e.target.value }))}
                                placeholder="Ex: Chef de projet IT, Responsable logistique, Ingénieur..."
                                value={formData.poste_souhaite}
                            />
                            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                                Ce poste sera enregistré dans notre référentiel des domaines en attente de validation par le service RH.
                            </small>
                        </label>

                        <label className="full-span">
                            <span style={{ color: 'var(--text)', fontWeight: 500 }}>Joindre votre CV (PDF, DOC, DOCX) *</span>
                            <input
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setCvFile(e.target.files[0])}
                                required
                                type="file"
                            />
                        </label>

                        <label className="full-span">
                            <span style={{ color: 'var(--text)', fontWeight: 500 }}>Message de présentation</span>
                            <textarea
                                onChange={(e) => setFormData((c) => ({ ...c, message_motivation: e.target.value }))}
                                placeholder="Présentez votre parcours et vos motivations..."
                                rows={4}
                                value={formData.message_motivation}
                            />
                        </label>

                        {errorMessage ? <p className="form-error full-span">{errorMessage}</p> : null}

                        <div className="form-actions full-span" style={{ marginTop: '16px' }}>
                            <button className="filter-button" disabled={submitting} style={{ padding: '12px 24px', fontSize: '15px' }} type="submit">
                                <Send size={18} />
                                <span>{submitting ? 'Envoi en cours...' : 'Envoyer ma candidature spontanée'}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
