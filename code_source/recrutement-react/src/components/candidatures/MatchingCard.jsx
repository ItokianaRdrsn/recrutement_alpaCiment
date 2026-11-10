import React, { useEffect, useState } from 'react';
import { Target } from 'lucide-react';
import { getJson } from '../../api/client';

const LABELS = {
    competences: 'Compétences',
    formation: 'Formation',
    experience: 'Expérience',
};

function couleur(score) {
    if (score >= 75) return '#16a34a';
    if (score >= 50) return '#d97706';
    return '#dc2626';
}

function Barre({ label, score, poids }) {
    return (
        <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>
                    {label} <span style={{ color: '#94a3b8' }}>(poids {poids})</span>
                </span>
                <strong>{score} / 100</strong>
            </div>
            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${score}%`, height: '100%', background: couleur(score) }} />
            </div>
        </div>
    );
}

/**
 * Score de matching explicable d'une candidature sur offre : global + détail par critère.
 * N'affiche rien pour une candidature spontanée (pas d'offre à comparer).
 */
export function MatchingCard({ idCandidature, idOffre }) {
    const [data, setData] = useState(null);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!idCandidature || !idOffre) return;
        let annule = false;
        getJson(`/api/candidature/${idCandidature}/matching`)
            .then((res) => !annule && setData(res?.data ?? null))
            .catch((err) => !annule && setError(err.message || 'Matching indisponible.'));
        return () => {
            annule = true;
        };
    }, [idCandidature, idOffre]);

    const cadre = { marginBottom: '16px', padding: '14px 16px', background: '#fff', border: '1px solid var(--border)', borderRadius: '12px' };

    if (!idOffre) {
        return (
            <div className="card no-print" style={cadre}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Target size={18} />
                    <strong>Adéquation avec l'offre</strong>
                    <span style={{ marginLeft: 'auto', color: '#64748b' }}>n/a</span>
                </div>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>
                    Candidature spontanée : aucune offre à comparer. Utilisez « Relier à une offre » pour calculer le score d'adéquation.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card no-print" style={cadre}>
                <strong>Adéquation avec l'offre</strong>
                <p style={{ margin: '8px 0 0', color: '#b91c1c', fontSize: '13px' }}>Calcul indisponible : {error}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="card no-print" style={cadre}>
                <strong>Adéquation avec l'offre</strong>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>Calcul en cours…</p>
            </div>
        );
    }

    const criteres = Object.entries(data.criteres ?? {}).filter(([, c]) => c);

    return (
        <div className="card no-print" style={cadre}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Target size={18} />
                <strong>Adéquation avec l'offre</strong>
                <span style={{ marginLeft: 'auto', fontSize: '22px', fontWeight: 700, color: data.score == null ? '#64748b' : couleur(data.score) }}>
                    {data.score == null ? 'n/a' : `${data.score} / 100`}
                </span>
            </div>

            {data.score == null ? (
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>
                    L'offre ne précise ni compétences, ni formation, ni expérience : aucun score calculable.
                </p>
            ) : (
                <>
                    <div style={{ marginTop: '12px' }}>
                        {criteres.map(([nom, c]) => (
                            <Barre key={nom} label={LABELS[nom] ?? nom} score={c.score} poids={c.poids} />
                        ))}
                    </div>
                    <button type="button" className="ghost-button" onClick={() => setOpen((v) => !v)} style={{ marginTop: '4px' }}>
                        {open ? 'Masquer le détail' : 'Voir le détail'}
                    </button>
                    {open && (
                        <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '13px', color: '#334155' }}>
                            {(data.criteres.competences?.detail ?? []).map((d, i) => (
                                <li key={`c${i}`}>
                                    {d.competence} : {d.present ? `présente (${d.niveau_candidat ?? 'niveau non précisé'})` : 'absente'}
                                    {d.niveau_requis ? `, requis : ${d.niveau_requis}` : ''}
                                </li>
                            ))}
                            {(data.criteres.formation?.detail ?? []).map((d, i) => (
                                <li key={`f${i}`}>
                                    Formation {d.niveau_min ? `min. ${d.niveau_min}` : ''}
                                    {d.domaine ? ` en ${d.domaine}` : ''} : {Math.round(d.score * 100)} %
                                </li>
                            ))}
                            {(data.criteres.experience?.detail ?? []).map((d, i) => (
                                <li key={`e${i}`}>
                                    Expérience : {d.annees_candidat} an(s) pour {d.annees_requises} an(s) requis
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}
