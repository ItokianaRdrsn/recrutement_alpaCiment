import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    Plus,
    RefreshCw,
    Search,
    UserCheck,
    Video,
} from 'lucide-react';
import { getJson, sendJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/common/FeedbackStates';
import { RendezVousModal } from '../components/modals/RendezVousModal';

export function AgendaView() {
    const calendarRef = useRef(null);

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [calendarTitle, setCalendarTitle] = useState('');

    // Référentiels
    const [referentiels, setReferentiels] = useState({
        types: [
            { id_type_rendez_vous: 1, libelle: 'Test' },
            { id_type_rendez_vous: 2, libelle: 'Entretien' },
        ],
        statuts: [
            { id_statut_rendez_vous: 1, libelle: 'A venir' },
            { id_statut_rendez_vous: 2, libelle: 'Realise' },
            { id_statut_rendez_vous: 3, libelle: 'Annule' },
        ],
        modes: [
            { id_mode_realisation: 1, libelle: 'Presentiel' },
            { id_mode_realisation: 2, libelle: 'Visioconference' },
            { id_mode_realisation: 3, libelle: 'Telephone' },
        ],
        responsables: [],
    });

    // Filtres
    const [filterType, setFilterType] = useState('');
    const [filterStatut, setFilterStatut] = useState('');
    const [filterMode, setFilterMode] = useState('');
    const [filterResponsable, setFilterResponsable] = useState('');

    // Modale de planification / modification
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRdv, setSelectedRdv] = useState(null);

    // Charger les référentiels
    useEffect(() => {
        const fetchRefs = async () => {
            try {
                const res = await getJson('/api/rendez-vous/referentiels');
                if (res?.data) {
                    setReferentiels(res.data);
                }
            } catch (err) {
                console.error('Erreur chargement référentiels RDV', err);
            }
        };
        fetchRefs();
    }, []);

    // Charger les événements
    const loadEvents = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (filterType) params.set('id_type_rendez_vous', filterType);
            if (filterStatut) params.set('id_statut_rendez_vous', filterStatut);
            if (filterMode) params.set('id_mode_realisation', filterMode);
            if (filterResponsable) params.set('id_utilisateur', filterResponsable);

            const res = await getJson(`/api/rendez-vous?${params.toString()}`);
            if (res?.data) {
                // Transformer pour FullCalendar
                const mappedEvents = res.data.map((rdv) => {
                    const isEntretien = rdv.id_type_rendez_vous === 2;
                    const isAnnule = rdv.id_statut_rendez_vous === 3;
                    const isRealise = rdv.id_statut_rendez_vous === 2;

                    let bg = isEntretien ? '#3b82f6' : '#8b5cf6'; // Bleu entretien, Violet test
                    let border = isEntretien ? '#2563eb' : '#7c3aed';
                    if (isRealise) {
                        bg = '#10b981';
                        border = '#059669';
                    } else if (isAnnule) {
                        bg = '#94a3b8';
                        border = '#64748b';
                    }

                    // Formatage demandé : Direction et prénom (sans afficher l'heure brute)
                    const prenom = rdv.candidat?.prenom || rdv.candidat?.nom || 'Candidat';
                    const directionLabel = rdv.direction?.alias || rdv.direction?.nom_direction || (rdv.offre?.reference?.split('-')[0]) || 'RH';
                    const typeLibelle = rdv.type_rendez_vous?.libelle || (isEntretien ? 'Entretien' : 'Test');

                    // Titre concis : "[IT] Faniry (Entretien)"
                    const eventTitle = `[${directionLabel}] ${prenom} (${typeLibelle})`;

                    return {
                        id: String(rdv.id_rendez_vous),
                        title: eventTitle,
                        start: rdv.date_debut,
                        end: rdv.date_fin,
                        backgroundColor: bg,
                        borderColor: border,
                        textColor: '#ffffff',
                        extendedProps: {
                            raw: rdv,
                            directionLabel,
                            prenom,
                        },
                    };
                });
                setEvents(mappedEvents);
            }
        } catch (err) {
            setError(err.message || 'Impossible de charger les rendez-vous.');
        } finally {
            setLoading(false);
        }
    }, [filterType, filterStatut, filterMode, filterResponsable]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    // Clic sur un événement : édition
    const handleEventClick = (clickInfo) => {
        const raw = clickInfo.event.extendedProps?.raw;
        if (raw) {
            setSelectedRdv(raw);
            setModalOpen(true);
        }
    };

    // Glisser-déposer d'événement (Reprogrammation rapide)
    const handleEventDrop = async (dropInfo) => {
        const raw = dropInfo.event.extendedProps?.raw;
        if (!raw) return;

        const newStart = dropInfo.event.start?.toISOString();
        const newEnd = dropInfo.event.end?.toISOString();

        if (!window.confirm(`Confirmez-vous le déplacement de ce rendez-vous au ${new Date(newStart).toLocaleString('fr-FR')} ?`)) {
            dropInfo.revert();
            return;
        }

        try {
            await sendJson(`/api/rendez-vous/${raw.id_rendez_vous}`, {
                method: 'PUT',
                body: {
                    date_debut: newStart,
                    date_fin: newEnd,
                },
            });
            loadEvents();
        } catch (err) {
            alert(err.message || 'Erreur lors du déplacement du rendez-vous.');
            dropInfo.revert();
        }
    };

    // Redimensionnement de la durée
    const handleEventResize = async (resizeInfo) => {
        const raw = resizeInfo.event.extendedProps?.raw;
        if (!raw) return;

        const newStart = resizeInfo.event.start?.toISOString();
        const newEnd = resizeInfo.event.end?.toISOString();

        try {
            await sendJson(`/api/rendez-vous/${raw.id_rendez_vous}`, {
                method: 'PUT',
                body: {
                    date_debut: newStart,
                    date_fin: newEnd,
                },
            });
            loadEvents();
        } catch (err) {
            alert(err.message || 'Erreur lors du redimensionnement du rendez-vous.');
            resizeInfo.revert();
        }
    };

    // Contrôles personnalisés de l'agenda
    const handlePrev = () => {
        const api = calendarRef.current?.getApi();
        if (api) {
            api.prev();
            setCalendarTitle(api.view.title);
        }
    };

    const handleNext = () => {
        const api = calendarRef.current?.getApi();
        if (api) {
            api.next();
            setCalendarTitle(api.view.title);
        }
    };

    const handleToday = () => {
        const api = calendarRef.current?.getApi();
        if (api) {
            api.today();
            setCalendarTitle(api.view.title);
        }
    };

    const handleViewChange = (viewName) => {
        const api = calendarRef.current?.getApi();
        if (api) {
            api.changeView(viewName);
            setCalendarTitle(api.view.title);
        }
    };

    const handleCalendarMount = () => {
        const api = calendarRef.current?.getApi();
        if (api) {
            setCalendarTitle(api.view.title);
        }
    };

    return (
        <div className="agenda-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarDays size={24} className="text-primary" /> Agenda des Entretiens & Tests RH
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        Planification des entretiens candidats, tests techniques et suivi du calendrier des recruteurs.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="action-button secondary"
                        onClick={loadEvents}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <RefreshCw size={16} className={loading ? 'spin' : ''} /> Actualiser
                    </button>
                    <button
                        className="action-button primary"
                        onClick={() => {
                            setSelectedRdv(null);
                            setModalOpen(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Plus size={16} /> Planifier un rendez-vous
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem' }}>
                    <Filter size={16} />
                    <strong>Filtrer :</strong>
                </div>

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                    <option value="">Tous les types</option>
                    {referentiels.types.map((t) => (
                        <option key={t.id_type_rendez_vous} value={t.id_type_rendez_vous}>
                            {t.libelle}
                        </option>
                    ))}
                </select>

                <select
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                    <option value="">Tous les statuts</option>
                    {referentiels.statuts.map((s) => (
                        <option key={s.id_statut_rendez_vous} value={s.id_statut_rendez_vous}>
                            {s.libelle}
                        </option>
                    ))}
                </select>

                <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                    <option value="">Toutes les modalités</option>
                    {referentiels.modes.map((m) => (
                        <option key={m.id_mode_realisation} value={m.id_mode_realisation}>
                            {m.libelle}
                        </option>
                    ))}
                </select>

                <select
                    value={filterResponsable}
                    onChange={(e) => setFilterResponsable(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                    <option value="">Tous les responsables</option>
                    {referentiels.responsables.map((u) => (
                        <option key={u.id_utilisateur} value={u.id_utilisateur}>
                            {u.nom}
                        </option>
                    ))}
                </select>

                {/* Légende couleurs */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '14px', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                        Entretien
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                        Test
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        Réalisé
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                        Annulé
                    </span>
                </div>
            </div>

            {error && <ErrorState message={error} />}

            {/* Calendar Container */}
            <div
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                {/* Header Custom Navigation */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            className="action-button secondary"
                            onClick={handlePrev}
                            style={{ padding: '6px 10px' }}
                            title="Précédent"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            className="action-button secondary"
                            onClick={handleNext}
                            style={{ padding: '6px 10px' }}
                            title="Suivant"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            className="action-button secondary"
                            onClick={handleToday}
                            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                        >
                            Aujourd’hui
                        </button>
                        <h3 style={{ margin: '0 0 0 12px', fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
                            {calendarTitle}
                        </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            className="action-button secondary"
                            onClick={() => handleViewChange('dayGridMonth')}
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                        >
                            Mois
                        </button>
                        <button
                            className="action-button secondary"
                            onClick={() => handleViewChange('timeGridWeek')}
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                        >
                            Semaine
                        </button>
                        <button
                            className="action-button secondary"
                            onClick={() => handleViewChange('timeGridDay')}
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                        >
                            Jour
                        </button>
                    </div>
                </div>

                {/* FullCalendar Component */}
                <div style={{ minHeight: '650px' }}>
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={false} // On utilise notre propre barre d'en-tête personnalisée
                        locale="fr"
                        slotMinTime="07:00:00"
                        slotMaxTime="20:00:00"
                        allDaySlot={false}
                        height="auto"
                        editable={true}
                        selectable={true}
                        displayEventTime={false}
                        dayMaxEvents={2}
                        dayMaxEventRows={true}
                        moreLinkClick="popover"
                        events={events}
                        eventClick={handleEventClick}
                        eventDrop={handleEventDrop}
                        eventResize={handleEventResize}
                        datesSet={(arg) => setCalendarTitle(arg.view.title)}
                        nowIndicator={true}
                    />
                </div>
            </div>

            {/* Modal Planification / Modification */}
            <RendezVousModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={() => loadEvents()}
                initialData={selectedRdv}
                referentiels={referentiels}
            />
        </div>
    );
}
