import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BriefcaseBusiness, Check, Link2, Search, X } from 'lucide-react';
import { getJson, sendJson } from '../../api/client';

export function RelierOffreModal({ candidature, onClose, onSuccess }) {
    const [offres, setOffres] = useState([]);
    const [loadingOffres, setLoadingOffres] = useState(true);
    const [selectedOffreId, setSelectedOffreId] = useState('');
    const [commentaire, setCommentaire] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const getOffreId = (o) => o?.id_offre ?? o?.id;
    const getOffreTitre = (o) => o?.titre_poste ?? o?.titre ?? 'Poste sans titre';
    const getOffreDirection = (o) => o?.direction?.nom_direction ?? o?.direction?.nom ?? 'Direction non spécifiée';

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        let isMounted = true;
        async function fetchOffres() {
            setLoadingOffres(true);
            try {
                const res = await getJson('/api/offres?per_page=100');
                if (isMounted) {
                    const list = res?.data ?? (Array.isArray(res) ? res : []);
                    // Filtrer idéalement sur les offres publiées ou actives (exclure clôturée)
                    const activeOffres = list.filter((o) => {
                        const statut = (o.statut?.libelle ?? o.statut ?? '').toLowerCase();
                        return statut !== 'cloturee' && statut !== 'clôturée';
                    });
                    setOffres(activeOffres.length ? activeOffres : list);
                }
            } catch (err) {
                if (isMounted) setError('Impossible de charger la liste des offres d\'emploi : ' + err.message);
            } finally {
                if (isMounted) setLoadingOffres(false);
            }
        }
        fetchOffres();
        return () => {
            isMounted = false;
        };
    }, []);

    const filteredOffres = offres.filter((o) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const titre = getOffreTitre(o).toLowerCase();
        const ref = (o.reference ?? '').toLowerCase();
        const dir = getOffreDirection(o).toLowerCase();
        return titre.includes(q) || ref.includes(q) || dir.includes(q);
    });

    async function handleSubmit(e) {
        e.preventDefault();
        const offreIdNum = Number(selectedOffreId);
        if (!selectedOffreId || isNaN(offreIdNum) || offreIdNum <= 0) {
            setError('Veuillez sélectionner une offre d\'emploi.');
            return;
        }

        const idCand = candidature?.id_candidature ?? candidature?.id;
        if (!idCand) {
            setError('Identifiant de la candidature introuvable.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await sendJson(`/api/candidature/${idCand}/relier-offre`, {
                method: 'POST',
                body: {
                    id_offre: offreIdNum,
                    commentaire: commentaire.trim() || null,
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

    const candidatNom = candidature?.candidat
        ? `${candidature.candidat.prenom} ${candidature.candidat.nom}`
        : `#${candidature?.id_candidature}`;

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '92%' }}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-icon-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
                            <Link2 size={22} />
                        </div>
                        <div>
                            <h3 className="modal-title">Relier la candidature à une offre</h3>
                            <p className="modal-subtitle">
                                Candidat : <strong>{candidatNom}</strong>
                                {candidature?.dans_vivier ? ' (En Vivier RH)' : ' (Candidature Spontanée)'}
                            </p>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', padding: '20px 24px' }}>
                    {candidature?.dans_vivier && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                            ℹ️ Cette candidature sera automatiquement affectée au poste sélectionné et <strong>retirée du vivier</strong>.
                        </div>
                    )}

                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                            Rechercher une offre d'emploi active :
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                placeholder="Filtrer par titre, référence ou direction..."
                                style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px' }}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                            Offre de destination <span style={{ color: '#ef4444' }}>*</span> :
                        </label>
                        {loadingOffres ? (
                            <p style={{ fontSize: '13px', color: '#64748b' }}>Chargement des offres en cours...</p>
                        ) : filteredOffres.length === 0 ? (
                            <p style={{ fontSize: '13px', color: '#ef4444' }}>Aucune offre d'emploi active trouvée.</p>
                        ) : (
                            <select
                                required
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#fff' }}
                                value={selectedOffreId}
                                onChange={(e) => {
                                    setSelectedOffreId(e.target.value);
                                    setError('');
                                }}
                            >
                                <option value="">-- Sélectionnez une offre d'emploi --</option>
                                {filteredOffres.map((o) => {
                                    const id = getOffreId(o);
                                    const titre = getOffreTitre(o);
                                    const ref = o.reference ? `(${o.reference})` : '';
                                    const dir = getOffreDirection(o);
                                    return (
                                        <option key={id} value={id}>
                                            {titre} {ref} — {dir}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>

                    <div style={{ display: 'grid', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                            Motif / Commentaire de rattachement (optionnel) :
                        </label>
                        <textarea
                            placeholder="Ex : Profil identifié suite à recherche vivier pour renforcer l'équipe maintenance..."
                            rows={3}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', resize: 'vertical' }}
                            value={commentaire}
                            onChange={(e) => setCommentaire(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                        <button className="ghost-button" disabled={submitting} onClick={onClose} type="button">
                            Annuler
                        </button>
                        <button
                            className="primary-button"
                            disabled={submitting || !selectedOffreId}
                            style={{ background: '#059669', gap: '8px' }}
                            type="submit"
                        >
                            <Link2 size={16} />
                            <span>{submitting ? 'Rattachement...' : 'Confirmer le rattachement'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
