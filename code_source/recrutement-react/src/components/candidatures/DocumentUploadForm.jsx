import React, { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { sendFormData } from '../../api/client';

// Libellé affiché -> type enregistré (CV | Photo | Autre) + description conservée dans la fiche
const TYPES = [
    { value: 'cv', label: 'CV (version à jour)', type_document: 'CV', description: 'CV' },
    { value: 'lettre', label: 'Lettre de motivation', type_document: 'Autre', description: 'Lettre de motivation' },
    { value: 'diplome', label: 'Diplôme / attestation', type_document: 'Autre', description: 'Diplôme / attestation' },
    { value: 'photo', label: 'Photo d\'identité', type_document: 'Photo', description: 'Photo d\'identité' },
    { value: 'autre', label: 'Autre document', type_document: 'Autre', description: '' },
];

const TAILLE_MAX_MO = 10;
const ACCEPT = '.pdf,.doc,.docx,.odt,.jpg,.jpeg,.png,.webp';

/**
 * Ajout d'un nouveau document à une candidature existante.
 * onUploaded() est appelé après un envoi réussi pour rafraîchir la liste.
 */
export function DocumentUploadForm({ idCandidature, onUploaded }) {
    const [choix, setChoix] = useState('lettre');
    const [fichier, setFichier] = useState(null);
    const [libelle, setLibelle] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const [message, setMessage] = useState('');
    const [erreur, setErreur] = useState('');
    const inputRef = useRef(null);

    const type = TYPES.find((t) => t.value === choix) ?? TYPES[0];

    const choisirFichier = (e) => {
        const f = e.target.files?.[0] ?? null;
        setMessage('');
        setErreur('');
        if (f && f.size > TAILLE_MAX_MO * 1024 * 1024) {
            setFichier(null);
            setErreur(`Le fichier dépasse ${TAILLE_MAX_MO} Mo.`);
            return;
        }
        setFichier(f);
    };

    const envoyer = async (e) => {
        e.preventDefault();
        if (!fichier) return;

        setEnvoi(true);
        setMessage('');
        setErreur('');
        try {
            const formData = new FormData();
            formData.append('fichier', fichier);
            formData.append('type_document', type.type_document);
            const description = libelle.trim() || type.description;
            if (description) formData.append('description', description);

            await sendFormData(`/api/candidature/${idCandidature}/documents`, formData);

            setMessage(`« ${fichier.name} » ajouté.`);
            setFichier(null);
            setLibelle('');
            if (inputRef.current) inputRef.current.value = '';
            await onUploaded?.();
        } catch (err) {
            setErreur(err.message || 'Échec de l\'envoi du document.');
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <form
            className="no-print"
            onSubmit={envoyer}
            style={{ display: 'grid', gap: '10px', padding: '16px', marginBottom: '20px', background: '#f8fafc', border: '1px dashed var(--border)', borderRadius: '10px' }}
        >
            <strong style={{ fontSize: '14px' }}>Ajouter un document</strong>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={choix} onChange={(e) => setChoix(e.target.value)} disabled={envoi} aria-label="Type de document">
                    {TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>

                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT}
                    onChange={choisirFichier}
                    disabled={envoi}
                    aria-label="Fichier à ajouter"
                />

                {choix === 'autre' && (
                    <input
                        type="text"
                        value={libelle}
                        onChange={(e) => setLibelle(e.target.value)}
                        placeholder="Libellé (ex. Certificat de travail)"
                        maxLength={150}
                        disabled={envoi}
                        style={{ minWidth: '220px' }}
                    />
                )}

                <button type="submit" className="filter-button" disabled={!fichier || envoi} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {envoi ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                    <span>{envoi ? 'Envoi…' : 'Ajouter'}</span>
                </button>
            </div>

            <small style={{ color: 'var(--muted)' }}>PDF, Word, ODT ou image (JPG, PNG, WebP) · {TAILLE_MAX_MO} Mo maximum</small>
            {message && <span style={{ color: '#166534', fontSize: '13px' }}>{message}</span>}
            {erreur && <span style={{ color: '#b91c1c', fontSize: '13px' }}>{erreur}</span>}
        </form>
    );
}
