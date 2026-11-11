import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, GitMerge, TriangleAlert } from 'lucide-react';
import { getJson, sendJson } from '../../api/client';

const CRITERES = {
    telephone: 'Même téléphone',
    email: 'Même e-mail',
    nom_prenom: 'Même nom et prénom',
};

/**
 * Bandeau « doublons probables » : le système signale, le RH décide.
 * Pour chaque groupe, « Garder celui-ci » fusionne les autres fiches dans le candidat choisi.
 */
export function DoublonsPanel({ onMerged }) {
    const [groupes, setGroupes] = useState([]);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await getJson('/api/candidats/doublons');
            setGroupes(res?.data ?? []);
        } catch {
            setGroupes([]); // le bandeau est optionnel : pas d'erreur bloquante
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const fusionner = async (groupe, principal) => {
        const autres = groupe.candidats.filter((c) => c.id_candidat !== principal.id_candidat);
        const noms = autres.map((c) => `${c.prenom} ${c.nom}`).join(', ');
        const ok = window.confirm(
            `Fusionner ${noms} dans ${principal.prenom} ${principal.nom} ?\n` +
                'Leurs candidatures seront rattachées à la fiche conservée. Cette action est définitive.'
        );
        if (!ok) return;

        setBusy(true);
        setError('');
        setMessage('');
        try {
            for (const autre of autres) {
                await sendJson(`/api/candidat/${principal.id_candidat}/fusionner`, {
                    body: { id_doublon: autre.id_candidat },
                });
            }
            setMessage(`${autres.length} fiche(s) fusionnée(s) dans ${principal.prenom} ${principal.nom}.`);
            await load();
            onMerged?.();
        } catch (err) {
            setError(err.message || 'La fusion a échoué.');
        } finally {
            setBusy(false);
        }
    };

    if (!groupes.length && !message) return null;

    return (
        <div
            className="card"
            style={{ marginBottom: '16px', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px' }}
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: 'none', border: 0, cursor: 'pointer', font: 'inherit', color: '#92400e' }}
            >
                <TriangleAlert size={18} />
                <strong>{groupes.length} groupe(s) de doublons probables</strong>
                <span style={{ marginLeft: 'auto' }}>{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
            </button>

            {message && <p style={{ margin: '8px 0 0', color: '#166534' }}>{message}</p>}
            {error && <p style={{ margin: '8px 0 0', color: '#b91c1c' }}>{error}</p>}

            {open &&
                groupes.map((groupe, i) => (
                    <div key={`${groupe.critere}-${groupe.valeur}-${i}`} style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #fde68a' }}>
                        <div style={{ fontSize: '13px', color: '#78350f', marginBottom: '8px' }}>
                            {CRITERES[groupe.critere] ?? groupe.critere}{' '}
                            <em>({groupe.confiance === 'forte' ? 'confiance forte' : 'confiance faible : homonymes possibles'})</em>
                        </div>
                        {groupe.candidats.map((c) => (
                            <div key={c.id_candidat} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', flexWrap: 'wrap' }}>
                                <span style={{ minWidth: '180px', fontWeight: 600 }}>
                                    {c.prenom} {c.nom}
                                </span>
                                <span style={{ color: '#475569', fontSize: '13px' }}>
                                    {c.email}
                                    {c.telephone ? ` · ${c.telephone}` : ''}
                                    {c.nb_candidatures != null ? ` · ${c.nb_candidatures} candidature(s)` : ''}
                                </span>
                                <button
                                    type="button"
                                    className="ghost-button"
                                    disabled={busy}
                                    onClick={() => fusionner(groupe, c)}
                                    style={{ marginLeft: 'auto' }}
                                >
                                    <GitMerge size={15} />
                                    <span>Garder celui-ci</span>
                                </button>
                            </div>
                        ))}
                    </div>
                ))}
        </div>
    );
}
