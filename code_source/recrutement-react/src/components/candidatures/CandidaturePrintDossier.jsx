import React from 'react';
import { backendPath } from '../../api/client';
import { formatDate, formatTime, formatDateTime } from '../../utils/formatters';

export function CandidaturePrintDossier({ details, profileData, rendezVousList = [] }) {
    if (!details) return null;

    const currentStatus = details.statut?.libelle ?? 'Reçue';
    const photoDoc = (details.documents ?? []).find(
        (d) => d.type_document === 'Photo' || (d.mime_type && d.mime_type.startsWith('image/'))
    );
    const cvDoc = (details.documents ?? []).find(
        (d) => d.type_document === 'CV' || (d.nom_fichier && d.nom_fichier.toLowerCase().includes('cv')) || d.mime_type === 'application/pdf'
    );

    const isSpontanee = details.id_type_demande === 2 || !details.id_offre;
    const typeDemandeLabel = isSpontanee ? 'Candidature Spontanée' : 'Candidature sur Offre';
    const canalDepotLabel = details.canal_depot === 'rh_manuel' ? 'Saisie Manuelle RH' : 'Portail Web Carrières';
    const posteLabel = details.offre?.titre_poste ?? details.poste_souhaite ?? 'Poste non spécifié';
    const directionLabel = details.offre?.direction?.nom_direction ?? details.domaine?.direction?.nom_direction ?? 'Direction Générale / Non spécifiée';
    const domaineLabel = details.domaine?.nom_domaine ?? 'Général';

    const competences = profileData?.competences ?? [];
    const experiences = profileData?.experiences ?? [];
    const formations = profileData?.formations ?? [];
    const projets = profileData?.projets ?? [];
    const historiques = details.historique ?? [];

    const dateEdition = new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date());

    return (
        <aside className="print-candidat-dossier" aria-label="Dossier de candidature officiel imprimable">
            {/* 1. EN-TÊTE INSTITUTIONNEL OFFICIEL */}
            <div className="print-doc-header">
                <div className="print-doc-header-left">
                    <img
                        src="/themes/custom/apiqa/images/logo-cut.png"
                        alt="AlpA Ciment"
                        className="print-doc-logo"
                    />
                    <div className="print-doc-header-text">
                        <span className="print-doc-company">ALPA CIMENT MADAGASCAR</span>
                        <span className="print-doc-direction">Direction des Ressources Humaines • Gestion des Talents</span>
                    </div>
                </div>
                <div className="print-doc-header-right">
                    <div className="print-doc-badge-ref">RÉF. DOSSIER : #{String(details.id_candidature).padStart(5, '0')}</div>
                    <div className="print-doc-meta-item"><strong>Date d'édition :</strong> {dateEdition}</div>
                    <div className="print-doc-meta-item"><strong>Statut RH actuel :</strong> <span className="print-doc-status-tag">{currentStatus}</span></div>
                </div>
            </div>

            {/* BANDEAU TITRE PRINCIPAL */}
            <div className="print-doc-banner">
                <h1>DOSSIER DE CANDIDATURE &amp; FICHE D'ÉVALUATION RH</h1>
                <span className="print-doc-subbanner">Document officiel confidentiel • Réservé aux évaluateurs et décideurs RH</span>
            </div>

            {/* 2. CARTOUCHE D'IDENTITÉ ET POSTE VISÉ */}
            <section className="print-doc-section print-doc-identity-grid">
                <div className="print-doc-identity-left">
                    {photoDoc ? (
                        <img
                            src={backendPath(`/storage/${photoDoc.chemin_fichier}`)}
                            alt="Portrait candidat"
                            className="print-doc-photo"
                        />
                    ) : (
                        <div className="print-doc-photo-placeholder">
                            <span>SANS PHOTO</span>
                        </div>
                    )}
                    <div className="print-doc-candidate-names">
                        <h2>{details.candidat?.prenom} {details.candidat?.nom?.toUpperCase()}</h2>
                        <div className="print-doc-target-role">{posteLabel}</div>
                        <div className="print-doc-target-direction">Rattachement : {directionLabel}</div>
                    </div>
                </div>

                <div className="print-doc-identity-right">
                    <table className="print-doc-keyval-table">
                        <tbody>
                            <tr>
                                <th>Email :</th>
                                <td>{details.candidat?.email || '—'}</td>
                            </tr>
                            <tr>
                                <th>Téléphone :</th>
                                <td>{details.candidat?.telephone || '—'}</td>
                            </tr>
                            <tr>
                                <th>Type de candidature :</th>
                                <td>{typeDemandeLabel} ({canalDepotLabel})</td>
                            </tr>
                            <tr>
                                <th>Domaine :</th>
                                <td>{domaineLabel}</td>
                            </tr>
                            <tr>
                                <th>Date de dépôt :</th>
                                <td>{formatDate(details.created_at)}</td>
                            </tr>
                            <tr>
                                <th>Situation Vivier RH :</th>
                                <td>{details.dans_vivier ? 'Oui (Actuellement dans le vivier de compétences)' : 'Non (Candidature active en traitement)'}</td>
                            </tr>
                            <tr>
                                <th>Document CV :</th>
                                <td>{cvDoc?.nom_fichier ? `${cvDoc.nom_fichier} (Joint au dossier)` : 'Non fourni'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 3. MESSAGE DE MOTIVATION DU CANDIDAT */}
            {(details.message_motivation || details.message) && (
                <section className="print-doc-section">
                    <h3 className="print-doc-section-title">1. Présentation &amp; Motivation du Candidat</h3>
                    <div className="print-doc-textbox">
                        {details.message_motivation || details.message}
                    </div>
                </section>
            )}

            {/* 4. COMPÉTENCES ET NIVEAUX DE MAÎTRISE */}
            <section className="print-doc-section">
                <h3 className="print-doc-section-title">
                    2. Compétences Clés &amp; Niveaux de Maîtrise ({competences.length})
                </h3>
                {competences.length === 0 ? (
                    <div className="print-doc-empty">Aucune compétence spécifique enregistrée dans ce profil.</div>
                ) : (
                    <table className="print-doc-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Intitulé de la Compétence</th>
                                <th style={{ width: '30%' }}>Niveau de Maîtrise</th>
                                <th style={{ width: '30%' }}>Source / Origine</th>
                            </tr>
                        </thead>
                        <tbody>
                            {competences.map((c, i) => (
                                <tr key={c.id_competence ?? i}>
                                    <td><strong>{c.nom_competence ?? c.nom}</strong></td>
                                    <td>
                                        <span className={`print-doc-level-pill level-${String(c.niveau || '').toLowerCase()}`}>
                                            {c.niveau || 'Non précisé'}
                                        </span>
                                    </td>
                                    <td>{c.source_extraction ?? c.source ?? 'Validation RH'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* 5. EXPÉRIENCES PROFESSIONNELLES */}
            <section className="print-doc-section">
                <h3 className="print-doc-section-title">
                    3. Expériences Professionnelles Significatives ({experiences.length})
                </h3>
                {experiences.length === 0 ? (
                    <div className="print-doc-empty">Aucune expérience professionnelle renseignée.</div>
                ) : (
                    <table className="print-doc-table">
                        <thead>
                            <tr>
                                <th style={{ width: '22%' }}>Période</th>
                                <th style={{ width: '30%' }}>Poste &amp; Entreprise</th>
                                <th style={{ width: '48%' }}>Missions &amp; Réalisations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {experiences.map((exp, i) => (
                                <tr key={exp.id_experience ?? i}>
                                    <td className="print-doc-cell-muted">
                                        {exp.date_debut ? formatDate(exp.date_debut) : '—'} au {exp.date_fin ? formatDate(exp.date_fin) : 'À ce jour'}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{exp.poste ?? exp.intitule_poste}</div>
                                        <div style={{ color: '#475569', fontSize: '8.5pt' }}>{exp.entreprise}</div>
                                    </td>
                                    <td style={{ whiteSpace: 'pre-line' }}>{exp.description || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* 6. FORMATIONS & DIPLÔMES */}
            <section className="print-doc-section">
                <h3 className="print-doc-section-title">
                    4. Cursus Académique &amp; Diplômes ({formations.length})
                </h3>
                {formations.length === 0 ? (
                    <div className="print-doc-empty">Aucune formation enregistrée.</div>
                ) : (
                    <table className="print-doc-table">
                        <thead>
                            <tr>
                                <th style={{ width: '15%' }}>Année</th>
                                <th style={{ width: '35%' }}>Diplôme / Titre Obtenu</th>
                                <th style={{ width: '30%' }}>Établissement &amp; Domaine</th>
                                <th style={{ width: '20%' }}>Niveau Requis</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formations.map((f, i) => (
                                <tr key={f.id_formation ?? i}>
                                    <td className="print-doc-cell-muted">{f.annee_obtention || '—'}</td>
                                    <td><strong>{f.diplome}</strong></td>
                                    <td>
                                        <div>{f.etablissement}</div>
                                        {f.domaine_etude && <div style={{ fontSize: '8pt', color: '#64748b' }}>{f.domaine_etude}</div>}
                                    </td>
                                    <td>{f.niveau || f.id_niveau ? `Bac+${f.id_niveau || ''}` : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* 7. PROJETS & RÉALISATIONS (SI EXISTANTS) */}
            {projets.length > 0 && (
                <section className="print-doc-section">
                    <h3 className="print-doc-section-title">5. Projets &amp; Réalisations Clés ({projets.length})</h3>
                    <table className="print-doc-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Projet &amp; Rôle</th>
                                <th style={{ width: '30%' }}>Technologies / Outils</th>
                                <th style={{ width: '40%' }}>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projets.map((p, i) => (
                                <tr key={p.id_projet ?? i}>
                                    <td>
                                        <strong>{p.titre_projet}</strong>
                                        {p.role && <div style={{ fontSize: '8.5pt', color: '#475569' }}>Rôle : {p.role}</div>}
                                    </td>
                                    <td>{p.technologies || '—'}</td>
                                    <td style={{ whiteSpace: 'pre-line' }}>{p.description || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* 8. SESSIONS D'ÉVALUATION & ENTRETIENS RH */}
            <section className="print-doc-section">
                <h3 className="print-doc-section-title">
                    {projets.length > 0 ? '6' : '5'}. Planning des Entretiens &amp; Tests RH ({rendezVousList.length})
                </h3>
                {rendezVousList.length === 0 ? (
                    <div className="print-doc-empty">Aucun entretien ou test programmé pour cette candidature à la date d'impression.</div>
                ) : (
                    <table className="print-doc-table">
                        <thead>
                            <tr>
                                <th style={{ width: '18%' }}>Nature RDV</th>
                                <th style={{ width: '28%' }}>Date &amp; Plage Horaire</th>
                                <th style={{ width: '18%' }}>Modalité &amp; Lieu</th>
                                <th style={{ width: '20%' }}>Responsable RH</th>
                                <th style={{ width: '16%' }}>Statut RDV</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rendezVousList.map((rdv) => (
                                <tr key={rdv.id_rendez_vous}>
                                    <td><strong>{rdv.type_rendez_vous?.libelle || (rdv.id_type_rendez_vous === 1 ? 'Test' : 'Entretien')}</strong></td>
                                    <td>
                                        <div>{formatDate(rdv.date_debut)}</div>
                                        <div style={{ fontSize: '8.5pt', color: '#475569' }}>
                                            De {formatTime(rdv.date_debut)} à {formatTime(rdv.date_fin)}
                                        </div>
                                    </td>
                                    <td>
                                        <div>{rdv.mode_realisation?.libelle || 'Présentiel'}</div>
                                        {rdv.details_lieu && <div style={{ fontSize: '8pt', color: '#64748b' }}>{rdv.details_lieu}</div>}
                                    </td>
                                    <td>{rdv.responsable?.nom || 'Équipe Recrutement'}</td>
                                    <td>
                                        <span className="print-doc-status-badge">
                                            {rdv.statut_rendez_vous?.libelle || 'A venir'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* 9. HISTORIQUE DU WORKFLOW & DÉCISIONS RH */}
            <section className="print-doc-section">
                <h3 className="print-doc-section-title">
                    {projets.length > 0 ? '7' : '6'}. Historique des Décisions &amp; Traçabilité du Workflow RH ({historiques.length})
                </h3>
                {historiques.length === 0 ? (
                    <div className="print-doc-empty">Aucune modification de statut enregistrée.</div>
                ) : (
                    <table className="print-doc-table">
                        <thead>
                            <tr>
                                <th style={{ width: '22%' }}>Date du Changement</th>
                                <th style={{ width: '28%' }}>Statut Attribué</th>
                                <th style={{ width: '25%' }}>Opérateur / Responsable</th>
                                <th style={{ width: '25%' }}>Commentaire RH</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historiques.map((h, i) => (
                                <tr key={h.id_historique ?? i}>
                                    <td className="print-doc-cell-muted">{formatDateTime(h.date_changement ?? h.created_at)}</td>
                                    <td><span className="print-doc-status-badge">{h.statut?.libelle ?? 'Changement statut'}</span></td>
                                    <td>{h.utilisateur?.nom || 'Système RH'}</td>
                                    <td>{h.commentaire || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* 10. CADRE DE VISA & SIGNATURES RH */}
            <section className="print-doc-section print-doc-signatures-section">
                <div className="print-doc-signature-box">
                    <div className="print-doc-sign-title">Visa du Chargé de Recrutement RH</div>
                    <div className="print-doc-sign-date">Date : ____ / ____ / 2026</div>
                    <div className="print-doc-sign-zone">Signature &amp; Avis :</div>
                </div>
                <div className="print-doc-signature-box">
                    <div className="print-doc-sign-title">Visa de la Direction des Ressources Humaines</div>
                    <div className="print-doc-sign-date">Date : ____ / ____ / 2026</div>
                    <div className="print-doc-sign-zone">Décision finale :</div>
                </div>
            </section>

            {/* 11. PIED DE PAGE OFFICIEL */}
            <footer className="print-doc-footer">
                <div className="print-doc-footer-legal">
                    AlpA Ciment Madagascar — Société Anonyme • Direction des Ressources Humaines
                </div>
                <div className="print-doc-footer-confidentiality">
                    Document strictement confidentiel • Réservé aux membres autorisés de la commission de recrutement AlpA Ciment.
                </div>
            </footer>
        </aside>
    );
}
