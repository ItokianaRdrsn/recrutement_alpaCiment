import React, { useEffect, useState } from 'react';
import { BriefcaseBusiness, MapPin, Send } from 'lucide-react';

export default function PublicOffresPage({ getJson, onNavigate }) {
    const [offres, setOffres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        getJson('/api/public/offres?per_page=100')
            .then((res) => setOffres(res?.data ?? []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [getJson]);

    return (
        <div className="portal-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', margin: 0 }}>Offres d'emploi disponibles</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>AlpA Ciment - Espace Candidat</p>
                </div>
                <button
                    className="filter-button"
                    onClick={() => onNavigate('/candidature-spontanee')}
                    style={{ background: 'var(--primary-hover)' }}
                    type="button"
                >
                    <Send size={16} />
                    <span>Candidature spontanée</span>
                </button>
            </div>

            {loading ? (
                <div className="feedback-state">Chargement des offres en cours...</div>
            ) : error ? (
                <div className="feedback-state error">{error}</div>
            ) : !offres.length ? (
                <div className="empty-state">Aucune offre d'emploi publiée pour le moment.</div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {offres.map((o) => (
                        <div
                            key={o.id}
                            style={{
                                background: '#fff',
                                border: '1px solid var(--border)',
                                borderRadius: '10px',
                                padding: '20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '16px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            }}
                        >
                            <div>
                                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: 'var(--primary)' }}>{o.titre_poste}</h3>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <BriefcaseBusiness size={14} /> {o.direction?.nom ?? 'Générale'}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MapPin size={14} /> {o.lieu ?? 'Madagascar'}
                                    </span>
                                    <span className="badge">{o.type_contrat?.libelle ?? 'CDI'}</span>
                                </div>
                            </div>
                            <button
                                className="filter-button"
                                onClick={() => onNavigate(`/offre/${o.slug || o.id}`)}
                                type="button"
                            >
                                <Send size={15} />
                                <span>Postuler</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
