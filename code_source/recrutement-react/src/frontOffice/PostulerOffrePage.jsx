import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, Send, User } from 'lucide-react';

export default function PostulerOffrePage({ backendPath, getJson, idOffre, onNavigate, sendFormData }) {
    const [offre, setOffre] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        message_motivation: '',
    });
    const [cvFile, setCvFile] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!idOffre) return;
        setLoading(true);
        getJson(`/api/public/offre/${idOffre}`)
            .then((res) => {
                setOffre(res?.data ?? null);
            })
            .catch((err) => {
                setErrorMessage(err.message);
            })
            .finally(() => setLoading(false));
    }, [idOffre, getJson]);

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
            if (photoFile) {
                data.append('photo', photoFile);
            }

            const res = await sendFormData(`/api/public/offre/${idOffre}/postuler`, data);
            setSuccessMessage(res?.message ?? 'Votre candidature a été soumise avec succès !');
        } catch (err) {
            setErrorMessage(err.message || 'Une erreur est survenue lors de l\'envoi.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="portal-container" style={{ padding: '40px', textAlign: 'center' }}>
                <p>Chargement de l'offre d'emploi...</p>
            </div>
        );
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
                    <span>Voir toutes les offres</span>
                </button>
            </div>

            <div className="data-section" style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                    <p className="eyebrow" style={{ color: 'var(--primary)', fontWeight: 600 }}>Candidature en ligne - AlpA Ciment</p>
                    <h1 style={{ fontSize: '24px', margin: '4px 0' }}>{offre?.titre_poste ?? `Offre #${idOffre}`}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        Direction : {offre?.direction?.nom ?? 'Générale'} | Lieu : {offre?.lieu ?? 'Madagascar'} | Contrat : {offre?.type_contrat?.libelle ?? 'CDI'}
                    </p>
                </div>

                {successMessage ? (
                    <div className="feedback-state" style={{ color: 'var(--accent-green)', padding: '30px 0', textAlign: 'center' }}>
                        <CheckCircle2 size={48} style={{ margin: '0 auto 12px auto' }} />
                        <h2 style={{ fontSize: '20px', color: 'var(--text)' }}>Candidature envoyée !</h2>
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
                        <h3 className="full-span" style={{ fontSize: '16px', marginBottom: '8px' }}>1. Informations Personnelles</h3>

                        <label>
                            <span>Nom *</span>
                            <input
                                onChange={(e) => setFormData((c) => ({ ...c, nom: e.target.value }))}
                                placeholder="Votre nom"
                                required
                                value={formData.nom}
                            />
                        </label>

                        <label>
                            <span>Prénom *</span>
                            <input
                                onChange={(e) => setFormData((c) => ({ ...c, prenom: e.target.value }))}
                                placeholder="Votre prénom"
                                required
                                value={formData.prenom}
                            />
                        </label>

                        <label>
                            <span>Adresse E-mail *</span>
                            <input
                                onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
                                placeholder="exemple@domaine.com"
                                required
                                type="email"
                                value={formData.email}
                            />
                        </label>

                        <label>
                            <span>Numéro de Téléphone</span>
                            <input
                                onChange={(e) => setFormData((c) => ({ ...c, telephone: e.target.value }))}
                                placeholder="+261 34 00 000 00"
                                value={formData.telephone}
                            />
                        </label>

                        <h3 className="full-span" style={{ fontSize: '16px', margin: '16px 0 8px 0' }}>2. Curriculum Vitae et Documents</h3>

                        <label className="full-span">
                            <span>Joindre votre CV (PDF, DOC, DOCX) *</span>
                            <input
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setCvFile(e.target.files[0])}
                                required
                                type="file"
                            />
                        </label>

                        <label className="full-span">
                            <span>Photo de profil (Optionnel)</span>
                            <input
                                accept="image/*"
                                onChange={(e) => setPhotoFile(e.target.files[0])}
                                type="file"
                            />
                        </label>

                        <label className="full-span">
                            <span>Message de motivation / Présentation</span>
                            <textarea
                                onChange={(e) => setFormData((c) => ({ ...c, message_motivation: e.target.value }))}
                                placeholder="Présentez brièvement votre parcours et vos motivations..."
                                rows={4}
                                value={formData.message_motivation}
                            />
                        </label>

                        {errorMessage ? <p className="form-error full-span">{errorMessage}</p> : null}

                        <div className="form-actions full-span" style={{ marginTop: '16px' }}>
                            <button className="filter-button" disabled={submitting} style={{ padding: '12px 24px', fontSize: '15px' }} type="submit">
                                <Send size={18} />
                                <span>{submitting ? 'Envoi de votre candidature...' : 'Soumettre ma candidature'}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
