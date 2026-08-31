import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit3, Share2, UserPlus } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export function OffersTable({ compact = false, offers, onNavigate = null, onSaisirRh = null, onSelectOffer = null, renderActions = null }) {
    const [expandedRow, setExpandedRow] = useState(null);

    if (!offers.length) {
        return <div className="empty-state">Aucune offre a afficher pour le moment.</div>;
    }

    function toggleExpand(id) {
        setExpandedRow((curr) => (curr === id ? null : id));
    }

    function copyCandidateLink(offre) {
        const slug = offre.slug || (offre.titre_poste ? offre.titre_poste.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : offre.id);
        const publicUrl = `${window.location.origin}/offre/${slug}`;
        navigator.clipboard?.writeText(publicUrl);
        window.alert(`Lien public de candidature pour "${offre.titre_poste}" :\n\n${publicUrl}\n\n(Lien copié dans le presse-papier)`);
    }

    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        {!compact ? <th style={{ width: '32px' }}></th> : null}
                        <th>Poste</th>
                        <th>Direction</th>
                        <th>Contrat</th>
                        <th>Publication</th>
                        {!compact ? <th>Limite</th> : null}
                        <th>Statut</th>
                        {renderActions || compact || onNavigate ? <th style={{ whiteSpace: 'nowrap', width: '1%' }}>Actions</th> : null}
                    </tr>
                </thead>
                <tbody>
                    {offers.map((offre) => {
                        const isExpanded = expandedRow === offre.id;
                        const isPublished = offre.statut?.libelle === 'Publiee' || offre.statut?.libelle === 'Publiée';

                        const profilsList = offre.profils?.length
                            ? offre.profils
                            : offre.profil
                            ? [offre.profil]
                            : [];

                        return (
                            <React.Fragment key={offre.id}>
                                <tr
                                    onClick={compact && onSelectOffer ? () => onSelectOffer(offre) : undefined}
                                    style={compact && onSelectOffer ? { cursor: 'pointer' } : {}}
                                >
                                    {!compact ? (
                                        <td>
                                            <button
                                                className="row-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleExpand(offre.id);
                                                }}
                                                title="Afficher les details"
                                                type="button"
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </td>
                                    ) : null}
                                    <td>
                                        <strong>{offre.titre_poste}</strong>
                                        <span>{offre.lieu ?? '-'}</span>
                                    </td>
                                    <td>{offre.direction?.nom ?? '-'}</td>
                                    <td>{offre.type_contrat?.libelle ?? '-'}</td>
                                    <td>{formatDate(offre.date_publication)}</td>
                                    {!compact ? <td>{formatDate(offre.date_limite)}</td> : null}
                                    <td>
                                        <span className="status-pill">{offre.statut?.libelle ?? '-'}</span>
                                    </td>
                                    {renderActions || compact || onNavigate ? (
                                        <td style={{ whiteSpace: 'nowrap', width: '1%' }}>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                                                {compact && onSelectOffer ? (
                                                    <button
                                                        className="row-button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelectOffer(offre);
                                                        }}
                                                        title="Voir / Modifier l'offre"
                                                        type="button"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                ) : null}
                                                {!compact ? (
                                                    <button
                                                        className="row-button"
                                                        disabled={!isPublished}
                                                        onClick={() => {
                                                            if (isPublished) copyCandidateLink(offre);
                                                        }}
                                                        style={!isPublished ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                                        title={isPublished ? "Copier le lien de candidature" : "Lien indisponible (Offre non publiée)"}
                                                        type="button"
                                                    >
                                                        <Share2 size={16} />
                                                    </button>
                                                ) : null}
                                                {!compact ? (
                                                    <button
                                                        disabled={!isPublished}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isPublished && onSaisirRh) onSaisirRh(offre.id);
                                                        }}
                                                        style={{
                                                            background: isPublished ? '#ede9fe' : '#f1f5f9',
                                                            color: isPublished ? '#6d28d9' : '#94a3b8',
                                                            border: isPublished ? '1px solid #ddd6fe' : '1px solid #e2e8f0',
                                                            borderRadius: '6px',
                                                            padding: '4px 8px',
                                                            fontWeight: '600',
                                                            fontSize: '12px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            cursor: isPublished ? 'pointer' : 'not-allowed',
                                                            whiteSpace: 'nowrap',
                                                            boxShadow: isPublished ? '0 1px 2px rgba(109, 40, 217, 0.08)' : 'none',
                                                            opacity: isPublished ? 1 : 0.65,
                                                        }}
                                                        title={isPublished ? "Saisir manuellement une candidature RH pour cette offre" : "Saisie RH impossible (Offre non publiée)"}
                                                        type="button"
                                                    >
                                                        <UserPlus size={14} />
                                                        <span>+ Candidature RH</span>
                                                    </button>
                                                ) : null}
                                                {renderActions && !compact ? renderActions(offre) : null}
                                            </div>
                                        </td>
                                    ) : null}
                                </tr>
                                {!compact && isExpanded ? (
                                    <tr>
                                        <td colSpan={renderActions ? 8 : 7} style={{ padding: 0 }}>
                                            <div className="expanded-details">
                                                {profilsList.length ? (
                                                    <div className="detail-block">
                                                        <strong>Criteres de profil ({profilsList.length})</strong>
                                                        <ul>
                                                            {profilsList.map((p, idx) => (
                                                                <li key={p.id ?? idx}>
                                                                    {p.description ? `${p.description} ` : ''}
                                                                    {p.valeur_attendue ? `(Cible: ${p.valeur_attendue} ${p.unite_valeur ?? ''})` : ''}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : null}

                                                {offre.missions?.length ? (
                                                    <div className="detail-block">
                                                        <strong>Missions principales</strong>
                                                        <ul>
                                                            {offre.missions.map((m) => (
                                                                <li key={m.id}>{m.description}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : null}

                                                {offre.formations?.length ? (
                                                    <div className="detail-block">
                                                        <strong>Formations requises</strong>
                                                        <ul>
                                                            {offre.formations.map((f) => (
                                                                <li key={f.id}>
                                                                    {f.niveau_min} {f.domaine ? `(${f.domaine})` : ''} -{' '}
                                                                    {f.obligatoire ? 'Obligatoire' : 'Souhaitable'}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : null}

                                                {offre.competences?.length ? (
                                                    <div className="detail-block">
                                                        <strong>Competences requises</strong>
                                                        <div className="tags-list">
                                                            {offre.competences.map((c) => (
                                                                <span className="badge green" key={c.id}>
                                                                    {c.nom} ({c.niveau_requis ?? 'Requis'})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ) : null}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
