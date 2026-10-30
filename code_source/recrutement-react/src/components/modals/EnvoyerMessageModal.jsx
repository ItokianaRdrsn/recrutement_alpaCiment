import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, User, Video, Mail, Send, X, PlusCircle, CheckCircle2 } from 'lucide-react';
import { getJson, sendJson } from '../../api/client';

export function EnvoyerMessageModal({ isOpen, onClose, onSuccess, candidature, rendezVousList = [] }) {
    const [modeles, setModeles] = useState([]);
    const [responsables, setResponsables] = useState([]);
    const [selectedModeleId, setSelectedModeleId] = useState('');
    const [rawTemplate, setRawTemplate] = useState({ objet: '', contenu: '' });
    
    // Champs spécifiques pour le rendez-vous / convocation
    const [dateRdv, setDateRdv] = useState('');
    const [heureRdv, setHeureRdv] = useState('09:00 à 10:00');
    const [lieuRdv, setLieuRdv] = useState('Siège AlpA Ciment - Salle de réunion RH');
    const [modeRdv, setModeRdv] = useState('Présentiel');
    const [responsable, setResponsable] = useState('');

    const [objet, setObjet] = useState('');
    const [contenu, setContenu] = useState('');
    const [idTypeMessage, setIdTypeMessage] = useState('6'); // 6 = Autre
    const [loadingModeles, setLoadingModeles] = useState(false);
    const [loadingRefs, setLoadingRefs] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Créneaux horaires types
    const creneauxHoraires = [
        '08:00 à 09:00',
        '08:30 à 09:30',
        '09:00 à 10:00',
        '09:30 à 10:30',
        '10:00 à 11:00',
        '10:30 à 11:30',
        '11:00 à 12:00',
        '14:00 à 15:00',
        '14:30 à 15:30',
        '15:00 à 16:00',
        '15:30 à 16:30',
        '16:00 à 17:00',
    ];

    // Suggestions de lieux
    const suggestionsLieux = [
        'Siège AlpA Ciment - Salle de réunion RH',
        'Siège AlpA Ciment - Direction Générale',
        'Usine AlpA Ciment - Bureau Technique',
        'Visioconférence (Lien Google Meet / Teams)',
        'Entretien téléphonique',
    ];

    // Formater la date en français (ex: Mercredi 28 octobre 2026)
    const formatFrenchDate = (isoDateStr) => {
        if (!isoDateStr) return '';
        try {
            const d = new Date(isoDateStr + 'T00:00:00');
            if (isNaN(d.getTime())) return isoDateStr;
            const formatted = d.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
        } catch {
            return isoDateStr;
        }
    };

    // Initialisation lors de l'ouverture du modal
    useEffect(() => {
        if (!isOpen) {
            setSelectedModeleId('');
            setRawTemplate({ objet: '', contenu: '' });
            setObjet('');
            setContenu('');
            setError('');
            setSuccessMsg('');
            return;
        }

        // Pré-remplissage des champs de RDV depuis un RDV existant de la candidature s'il y en a un
        const existingRdv = Array.isArray(rendezVousList) && rendezVousList.length > 0
            ? [...rendezVousList].sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut))[0]
            : null;

        if (existingRdv && existingRdv.date_debut) {
            const dDebut = new Date(existingRdv.date_debut);
            const pad = (n) => String(n).padStart(2, '0');
            setDateRdv(`${dDebut.getFullYear()}-${pad(dDebut.getMonth() + 1)}-${pad(dDebut.getDate())}`);
            
            if (existingRdv.date_fin) {
                const dFin = new Date(existingRdv.date_fin);
                const hStart = `${pad(dDebut.getHours())}:${pad(dDebut.getMinutes())}`;
                const hEnd = `${pad(dFin.getHours())}:${pad(dFin.getMinutes())}`;
                setHeureRdv(`${hStart} à ${hEnd}`);
            }

            if (existingRdv.details_lieu) {
                setLieuRdv(existingRdv.details_lieu);
            }
            if (existingRdv.mode_realisation?.libelle) {
                setModeRdv(existingRdv.mode_realisation.libelle);
            }
            if (existingRdv.utilisateur?.nom) {
                setResponsable(existingRdv.utilisateur.nom);
            }
        } else {
            // Par défaut : demain à 09:00
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const pad = (n) => String(n).padStart(2, '0');
            setDateRdv(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`);
            setHeureRdv('09:00 à 10:00');
            setModeRdv('Présentiel');
            setLieuRdv('Siège AlpA Ciment - Salle de réunion RH');
        }

        // Chargement des modèles d'emails
        const fetchModeles = async () => {
            setLoadingModeles(true);
            try {
                const res = await getJson('/api/modeles-messages?actif=true');
                if (res?.data) {
                    setModeles(res.data);
                }
            } catch (err) {
                console.error('Erreur chargement modèles d\'emails', err);
            } finally {
                setLoadingModeles(false);
            }
        };

        // Chargement des référentiels RDV pour avoir la liste des responsables
        const fetchResponsables = async () => {
            setLoadingRefs(true);
            try {
                const res = await getJson('/api/rendez-vous/referentiels');
                if (res?.data?.responsables) {
                    setResponsables(res.data.responsables);
                    // Si aucun responsable n'est sélectionné, on prend le premier RH par défaut
                    if (!responsable) {
                        const firstRh = res.data.responsables.find((r) => r.role === 'rh') || res.data.responsables[0];
                        if (firstRh) {
                            setResponsable(firstRh.nom);
                        }
                    }
                }
            } catch (err) {
                console.error('Erreur chargement responsables', err);
            } finally {
                setLoadingRefs(false);
            }
        };

        fetchModeles();
        fetchResponsables();
    }, [isOpen, candidature?.id_candidature]);

    // Remplacement local des variables dans une chaîne
    const substituteLocally = (text, customVars = {}) => {
        if (!text) return '';
        const vars = {
            nom: candidature?.candidat?.nom || '',
            prenom: candidature?.candidat?.prenom || '',
            nom_complet: `${candidature?.candidat?.prenom || ''} ${candidature?.candidat?.nom || ''}`.trim(),
            email: candidature?.candidat?.email || '',
            telephone: candidature?.candidat?.telephone || '',
            poste: candidature?.offre?.titre_poste || candidature?.poste_souhaite || 'Poste chez AlpA Ciment',
            direction: candidature?.offre?.direction?.nom_direction || 'Ressources Humaines',
            date_rdv: formatFrenchDate(customVars.dateRdv ?? dateRdv),
            heure_rdv: customVars.heureRdv ?? heureRdv,
            lieu_rdv: customVars.lieuRdv ?? lieuRdv,
            mode_rdv: customVars.modeRdv ?? modeRdv,
            responsable: customVars.responsable ?? responsable,
            nom_responsable: customVars.responsable ?? responsable,
            date_jour: formatFrenchDate(new Date().toISOString().slice(0, 10)),
        };

        let result = text;
        for (const [key, val] of Object.entries(vars)) {
            const regexDouble = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
            const regexSingle = new RegExp(`\\{\\s*${key}\\s*\\}`, 'gi');
            result = result.replace(regexDouble, val || '').replace(regexSingle, val || '');
        }
        return result;
    };

    // Actualiser le message quand un paramètre (Date, Heure, Lieu, Responsable) change
    const updatePreviewWithVars = async (newVars = {}) => {
        if (!rawTemplate.contenu && !rawTemplate.objet) return;

        const effectiveDate = newVars.dateRdv ?? dateRdv;
        const effectiveHeure = newVars.heureRdv ?? heureRdv;
        const effectiveLieu = newVars.lieuRdv ?? lieuRdv;
        const effectiveMode = newVars.modeRdv ?? modeRdv;
        const effectiveResponsable = newVars.responsable ?? responsable;

        try {
            setPreviewing(true);
            const res = await sendJson('/api/modeles-messages/apercu', {
                method: 'POST',
                body: {
                    id_candidature: candidature?.id_candidature,
                    objet: rawTemplate.objet,
                    contenu: rawTemplate.contenu,
                    extra_variables: {
                        date_rdv: formatFrenchDate(effectiveDate),
                        heure_rdv: effectiveHeure,
                        lieu_rdv: effectiveLieu,
                        mode_rdv: effectiveMode,
                        responsable: effectiveResponsable,
                    },
                },
            });
            if (res?.data) {
                setObjet(res.data.objet || rawTemplate.objet);
                setContenu(res.data.contenu || rawTemplate.contenu);
            } else {
                setObjet(substituteLocally(rawTemplate.objet, newVars));
                setContenu(substituteLocally(rawTemplate.contenu, newVars));
            }
        } catch {
            setObjet(substituteLocally(rawTemplate.objet, newVars));
            setContenu(substituteLocally(rawTemplate.contenu, newVars));
        } finally {
            setPreviewing(false);
        }
    };

    // Lorsqu'on sélectionne un modèle dans la liste
    const handleSelectModele = async (e) => {
        const id = e.target.value;
        setSelectedModeleId(id);
        if (!id) {
            setRawTemplate({ objet: '', contenu: '' });
            return;
        }

        const found = modeles.find((m) => String(m.id_modele_message) === String(id));
        if (found) {
            setIdTypeMessage(found.id_type_message || '6');
            setRawTemplate({ objet: found.objet, contenu: found.contenu });

            // Appel API d'aperçu avec les variables actuelles
            try {
                setPreviewing(true);
                const res = await sendJson('/api/modeles-messages/apercu', {
                    method: 'POST',
                    body: {
                        id_candidature: candidature?.id_candidature,
                        objet: found.objet,
                        contenu: found.contenu,
                        extra_variables: {
                            date_rdv: formatFrenchDate(dateRdv),
                            heure_rdv: heureRdv,
                            lieu_rdv: lieuRdv,
                            mode_rdv: modeRdv,
                            responsable: responsable,
                        },
                    },
                });
                if (res?.data) {
                    setObjet(res.data.objet || found.objet);
                    setContenu(res.data.contenu || found.contenu);
                } else {
                    setObjet(substituteLocally(found.objet));
                    setContenu(substituteLocally(found.contenu));
                }
            } catch {
                setObjet(substituteLocally(found.objet));
                setContenu(substituteLocally(found.contenu));
            } finally {
                setPreviewing(false);
            }
        }
    };

    // Insérer manuellement le bloc de détails du RDV dans le corps du texte
    const handleInsertDetailsInBody = () => {
        const detailsBlock = `\n\nDétails de votre rendez-vous :
- Date : ${formatFrenchDate(dateRdv)}
- Heure : ${heureRdv}
- Mode : ${modeRdv}
- Lieu : ${lieuRdv}
- Responsable : ${responsable || 'Équipe RH'}`;

        setContenu((prev) => (prev ? prev.trimEnd() + detailsBlock : detailsBlock.trimStart()));
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!candidature?.id_candidature) return;

        if (!objet.trim() || !contenu.trim()) {
            setError('L’objet et le corps du message sont obligatoires.');
            return;
        }

        setSending(true);
        setError('');
        try {
            await sendJson(`/api/candidature/${candidature.id_candidature}/communications`, {
                method: 'POST',
                body: {
                    id_modele_message: selectedModeleId || null,
                    id_type_message: idTypeMessage || 6,
                    objet: objet.trim(),
                    contenu: contenu.trim(),
                    mode_envoi: 'manuel',
                    variables: {
                        date_rdv: formatFrenchDate(dateRdv),
                        heure_rdv: heureRdv,
                        lieu_rdv: lieuRdv,
                        mode_rdv: modeRdv,
                        responsable: responsable,
                    },
                },
            });

            setSuccessMsg('E-mail envoyé avec succès au candidat.');
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1000);
        } catch (err) {
            setError(err.message || 'Erreur lors de l’envoi de l’e-mail.');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    const candidatEmail = candidature?.candidat?.email || 'Inconnu';
    const candidatNom = `${candidature?.candidat?.prenom || ''} ${candidature?.candidat?.nom || ''}`.trim() || 'Candidat';

    return (
        <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '720px',
                    width: '95%',
                    maxHeight: '92vh',
                    overflowY: 'auto',
                    padding: '24px',
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
            >
                {/* EN-TÊTE MODALE */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Mail color="#2563eb" size={20} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                                Envoyer un message au candidat
                            </h2>
                            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                                Composition manuelle ou via modèle avec injection automatique des détails
                            </p>
                        </div>
                    </div>
                    <button
                        className="ghost-button"
                        onClick={onClose}
                        style={{ padding: '6px', borderRadius: '50%' }}
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BANDEAU DESTINATAIRE */}
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13.5px' }}>
                    <div><strong>Destinataire :</strong> {candidatNom} &lt;{candidatEmail}&gt;</div>
                    {candidature?.offre?.titre_poste ? (
                        <div style={{ marginTop: '4px', color: '#64748b' }}>
                            <strong>Offre concernée :</strong> {candidature.offre.titre_poste}
                        </div>
                    ) : null}
                </div>

                {error ? (
                    <div className="status-pill danger" style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px' }}>
                        {error}
                    </div>
                ) : null}

                {successMsg ? (
                    <div className="status-pill success" style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px' }}>
                        {successMsg}
                    </div>
                ) : null}

                <form onSubmit={handleSend} style={{ display: 'grid', gap: '16px' }}>
                    {/* CHOIX DU MODÈLE */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Partir d’un modèle existant (optionnel)
                        </label>
                        <select
                            disabled={loadingModeles || sending}
                            onChange={handleSelectModele}
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px',
                                backgroundColor: '#ffffff',
                            }}
                            value={selectedModeleId}
                        >
                            <option value="">-- Message libre personnalisé --</option>
                            {modeles.map((m) => (
                                <option key={m.id_modele_message} value={m.id_modele_message}>
                                    {m.nom_modele} ({m.type_message?.libelle || 'Type'})
                                </option>
                            ))}
                        </select>
                        {previewing ? (
                            <small style={{ color: '#2563eb', display: 'block', marginTop: '4px' }}>
                                Remplacement dynamique des variables en cours...
                            </small>
                        ) : null}
                    </div>

                    {/* BLOC PARAMÈTRES DU RENDEZ-VOUS / CONVOCATION */}
                    <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={16} color="#0284c7" />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                                    Détails du rendez-vous & variables (Date, Heure, Lieu, Responsable)
                                </span>
                            </div>
                            <span style={{ fontSize: '11.5px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
                                Injection automatique
                            </span>
                        </div>

                        {/* GRILLE 2 COLONNES */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {/* DATE */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Date du rendez-vous *
                                </label>
                                <input
                                    type="date"
                                    value={dateRdv}
                                    disabled={sending}
                                    onChange={(e) => {
                                        const newDate = e.target.value;
                                        setDateRdv(newDate);
                                        updatePreviewWithVars({ dateRdv: newDate });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '13.5px',
                                        backgroundColor: '#ffffff',
                                    }}
                                />
                                {dateRdv ? (
                                    <small style={{ display: 'block', color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                                        📅 {formatFrenchDate(dateRdv)}
                                    </small>
                                ) : null}
                            </div>

                            {/* HEURE (SELECT) */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Heure / Créneau (Select) *
                                </label>
                                <select
                                    value={heureRdv}
                                    disabled={sending}
                                    onChange={(e) => {
                                        const newHeure = e.target.value;
                                        setHeureRdv(newHeure);
                                        updatePreviewWithVars({ heureRdv: newHeure });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '13.5px',
                                        backgroundColor: '#ffffff',
                                    }}
                                >
                                    {creneauxHoraires.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* LIEU (CHAMP TEXTE AVEC DATALIST) */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Lieu / Modalités (Champ) *
                                </label>
                                <input
                                    type="text"
                                    list="suggestions-lieux-message"
                                    value={lieuRdv}
                                    disabled={sending}
                                    placeholder="Ex: Siège AlpA Ciment - Salle RH"
                                    onChange={(e) => {
                                        const newLieu = e.target.value;
                                        setLieuRdv(newLieu);
                                        updatePreviewWithVars({ lieuRdv: newLieu });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '13.5px',
                                        backgroundColor: '#ffffff',
                                    }}
                                />
                                <datalist id="suggestions-lieux-message">
                                    {suggestionsLieux.map((l) => (
                                        <option key={l} value={l} />
                                    ))}
                                </datalist>
                            </div>

                            {/* RESPONSABLE (SELECT) */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Responsable en charge (Select) *
                                </label>
                                <select
                                    value={responsable}
                                    disabled={sending || loadingRefs}
                                    onChange={(e) => {
                                        const newResp = e.target.value;
                                        setResponsable(newResp);
                                        updatePreviewWithVars({ responsable: newResp });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '13.5px',
                                        backgroundColor: '#ffffff',
                                    }}
                                >
                                    <option value="">-- Aucun / Équipe RH --</option>
                                    {responsables.map((r) => (
                                        <option key={r.id_utilisateur} value={r.nom}>
                                            {r.nom} ({r.role ? r.role.toUpperCase() : 'RH'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* MODE (SELECT) */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Mode de réalisation (Select)
                                </label>
                                <select
                                    value={modeRdv}
                                    disabled={sending}
                                    onChange={(e) => {
                                        const newMode = e.target.value;
                                        setModeRdv(newMode);
                                        updatePreviewWithVars({ modeRdv: newMode });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '13.5px',
                                        backgroundColor: '#ffffff',
                                    }}
                                >
                                    <option value="Présentiel">Présentiel</option>
                                    <option value="Visioconférence">Visioconférence</option>
                                    <option value="Téléphone">Téléphone</option>
                                </select>
                            </div>

                            {/* BOUTON INSÉRER LES DÉTAILS DANS LE TEXTE */}
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={handleInsertDetailsInBody}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: '#f1f5f9',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '12.5px',
                                        fontWeight: 500,
                                        color: '#334155',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <PlusCircle size={15} color="#0284c7" />
                                    <span>Insérer le récapitulatif dans le corps</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* OBJET DU MESSAGE */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Objet de l’e-mail *
                        </label>
                        <input
                            disabled={sending}
                            onChange={(e) => setObjet(e.target.value)}
                            placeholder="Objet du message..."
                            required
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px',
                            }}
                            type="text"
                            value={objet}
                        />
                    </div>

                    {/* CORPS DU MESSAGE */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                Corps de l’e-mail *
                            </label>
                            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                Vous pouvez éditer librement le texte ci-dessous
                            </span>
                        </div>
                        <textarea
                            disabled={sending}
                            onChange={(e) => setContenu(e.target.value)}
                            placeholder="Rédigez votre message ici..."
                            required
                            rows={8}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                lineHeight: '1.5',
                            }}
                            value={contenu}
                        />
                    </div>

                    {/* ACTIONS */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                        <button
                            className="action-button secondary"
                            disabled={sending}
                            onClick={onClose}
                            type="button"
                        >
                            Annuler
                        </button>
                        <button
                            className="action-button primary"
                            disabled={sending || previewing}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            type="submit"
                        >
                            <Send size={16} />
                            <span>{sending ? 'Envoi en cours...' : 'Envoyer l’e-mail'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
