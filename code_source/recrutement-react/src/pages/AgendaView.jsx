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
    MapPin,
    Phone,
    Plus,
    RefreshCw,
    Search,
    UserCheck,
    Video,
    X,
    CheckCircle2,
    Calendar,
    Briefcase,
} from 'lucide-react';
import { getJson, sendJson } from '../api/client';
import { AgendaSkeleton, ErrorState } from '../components/common/FeedbackStates';
import { RendezVousModal } from '../components/modals/RendezVousModal';

export function AgendaView() {
    const calendarRef = useRef(null);

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [calendarTitle, setCalendarTitle] = useState('');
    const [currentView, setCurrentView] = useState('timeGridWeek');

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
    const [searchQuery, setSearchQuery] = useState('');
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

                    let bg = isEntretien ? '#eff6ff' : '#f5f3ff';
                    let border = isEntretien ? '#2563eb' : '#7c3aed';
                    if (isRealise) {
                        bg = '#ecfdf5';
                        border = '#059669';
                    } else if (isAnnule) {
                        bg = '#f1f5f9';
                        border = '#64748b';
                    }

                    const prenom = rdv.candidat?.prenom || rdv.candidat?.nom || 'Candidat';
                    const directionLabel = rdv.direction?.alias || rdv.direction?.nom_direction || (rdv.offre?.reference?.split('-')[0]) || 'RH';
                    const typeLibelle = rdv.type_rendez_vous?.libelle || (isEntretien ? 'Entretien' : 'Test');
                    const eventTitle = `[${directionLabel}] ${prenom} (${typeLibelle})`;

                    return {
                        id: String(rdv.id_rendez_vous),
                        title: eventTitle,
                        start: rdv.date_debut,
                        end: rdv.date_fin,
                        backgroundColor: bg,
                        borderColor: border,
                        textColor: '#0f172a',
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

    // Filtrage instantané côté client par mot-clé (nom candidat, poste, lieu, etc.)
    const filteredEvents = useMemo(() => {
        if (!searchQuery.trim()) return events;
        const q = searchQuery.toLowerCase().trim();
        return events.filter((ev) => {
            const raw = ev.extendedProps?.raw;
            const candidatNom = `${raw?.candidat?.prenom || ''} ${raw?.candidat?.nom || ''}`.toLowerCase();
            const candidatEmail = (raw?.candidat?.email || '').toLowerCase();
            const candidatTel = (raw?.candidat?.telephone || '').toLowerCase();
            const offreTitre = (raw?.offre?.titre_poste || raw?.offre?.titre || raw?.poste_souhaite || '').toLowerCase();
            const direction = (ev.extendedProps?.directionLabel || '').toLowerCase();
            const lieu = (raw?.details_lieu || '').toLowerCase();
            const responsable = (raw?.responsable?.nom || '').toLowerCase();

            return (
                candidatNom.includes(q) ||
                candidatEmail.includes(q) ||
                candidatTel.includes(q) ||
                offreTitre.includes(q) ||
                direction.includes(q) ||
                lieu.includes(q) ||
                responsable.includes(q)
            );
        });
    }, [events, searchQuery]);

    // Métriques rapides KPI
    const kpiCounts = useMemo(() => {
        const total = events.length;
        const entretiens = events.filter((e) => e.extendedProps?.raw?.id_type_rendez_vous === 2).length;
        const tests = events.filter((e) => e.extendedProps?.raw?.id_type_rendez_vous === 1).length;
        const realises = events.filter((e) => e.extendedProps?.raw?.id_statut_rendez_vous === 2).length;
        const annules = events.filter((e) => e.extendedProps?.raw?.id_statut_rendez_vous === 3).length;
        return { total, entretiens, tests, realises, annules };
    }, [events]);

    // Clic sur un événement : édition
    const handleEventClick = (clickInfo) => {
        const raw = clickInfo.event.extendedProps?.raw;
        if (raw) {
            setSelectedRdv(raw);
            setModalOpen(true);
        }
    };

    const formatEventDatePayload = (date) => {
        if (!date) return null;
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    // Glisser-déposer d'événement (Reprogrammation rapide)
    const handleEventDrop = async (dropInfo) => {
        const raw = dropInfo.event.extendedProps?.raw;
        if (!raw) return;

        const newStart = formatEventDatePayload(dropInfo.event.start);
        const newEnd = formatEventDatePayload(dropInfo.event.end);

        if (!window.confirm(`Confirmez-vous le déplacement de ce rendez-vous au ${dropInfo.event.start ? dropInfo.event.start.toLocaleString('fr-FR') : ''} ?`)) {
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

        const newStart = formatEventDatePayload(resizeInfo.event.start);
        const newEnd = formatEventDatePayload(resizeInfo.event.end);

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
            setCurrentView(viewName);
            setCalendarTitle(api.view.title);
        }
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setFilterType('');
        setFilterStatut('');
        setFilterMode('');
        setFilterResponsable('');
    };

    const hasActiveFilters = Boolean(
        searchQuery || filterType || filterStatut || filterMode || filterResponsable
    );

    // Rendu personnalisé des cartes d'événements FullCalendar
    const renderEventContent = (eventInfo) => {
        const { raw, directionLabel, prenom } = eventInfo.event.extendedProps || {};
        const isEntretien = raw?.id_type_rendez_vous === 2;
        const isAnnule = raw?.id_statut_rendez_vous === 3;
        const isRealise = raw?.id_statut_rendez_vous === 2;

        const formatTime = (d) => {
            if (!d) return '';
            const date = new Date(d);
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        };

        const timeStr = `${formatTime(eventInfo.event.start)} - ${formatTime(eventInfo.event.end)}`;
        const nomComplet = raw?.candidat ? `${raw.candidat.prenom || ''} ${raw.candidat.nom || ''}`.trim() : (prenom || 'Candidat');
        const posteTitre = raw?.offre?.titre_poste || raw?.offre?.titre || raw?.poste_souhaite || '';

        // Vue Mois (dayGridMonth)
        if (eventInfo.view.type === 'dayGridMonth') {
            return (
                <div
                    className={`fc-month-event-pill ${isAnnule ? 'is-annule' : ''} ${isRealise ? 'is-realise' : ''} ${isEntretien ? 'is-entretien' : 'is-test'}`}
                    title={`${nomComplet} (${timeStr}) - ${posteTitre || directionLabel}`}
                >
                    <span className="fc-month-pill-dot" />
                    <span className="fc-month-pill-time">{formatTime(eventInfo.event.start)}</span>
                    <span className="fc-month-pill-title">[{directionLabel}] {nomComplet}</span>
                </div>
            );
        }

        // Vue Semaine & Jour (timeGrid)
        let ModeIcon = MapPin;
        if (raw?.id_mode_realisation === 2) ModeIcon = Video;
        else if (raw?.id_mode_realisation === 3) ModeIcon = Phone;

        return (
            <div
                className={`fc-custom-event-card ${isAnnule ? 'is-annule' : ''} ${isRealise ? 'is-realise' : ''} ${isEntretien ? 'is-entretien' : 'is-test'}`}
                title={`${nomComplet} - ${timeStr}\n${posteTitre ? 'Poste : ' + posteTitre + '\n' : ''}${raw?.details_lieu ? 'Lieu : ' + raw.details_lieu : ''}`}
            >
                <div className="fc-custom-event-header">
                    <span className="fc-event-mode-badge">
                        <ModeIcon size={11} />
                        <span>{raw?.mode_realisation?.libelle || 'Présentiel'}</span>
                    </span>
                    <span className="fc-event-time-badge">{timeStr}</span>
                </div>

                <div className="fc-custom-event-title">
                    <span className="fc-direction-tag">[{directionLabel}]</span>
                    <strong className="fc-candidate-name">{nomComplet}</strong>
                </div>

                {posteTitre && (
                    <div className="fc-event-subtitle">
                        {posteTitre}
                    </div>
                )}

                {raw?.details_lieu && (
                    <div className="fc-event-location">
                        <MapPin size={10} />
                        <span>{raw.details_lieu}</span>
                    </div>
                )}
            </div>
        );
    };

    if (loading && events.length === 0) {
        return <AgendaSkeleton />;
    }

    return (
        <div className="agenda-modern-wrapper">
            {/* 1. Executive Header & KPI Quick Filters */}
            <div className="agenda-header-banner">
                <div className="agenda-title-block">
                    <h2>
                        <CalendarDays size={26} className="text-primary" /> Agenda des Entretiens & Tests RH
                    </h2>
                    <p>
                        Planification des entretiens candidats, tests techniques et suivi du calendrier des recruteurs AlpA Ciment.
                    </p>
                </div>

                {/* Quick KPI Badges */}
                <div className="agenda-kpi-strip">
                    <div
                        className={`agenda-kpi-badge all ${!filterType && !filterStatut ? 'active' : ''}`}
                        onClick={() => {
                            setFilterType('');
                            setFilterStatut('');
                        }}
                        title="Afficher tous les événements"
                    >
                        <span>Tous</span>
                        <span className="agenda-kpi-count">{kpiCounts.total}</span>
                    </div>

                    <div
                        className={`agenda-kpi-badge entretien ${filterType === '2' ? 'active' : ''}`}
                        onClick={() => {
                            setFilterType(filterType === '2' ? '' : '2');
                            setFilterStatut('');
                        }}
                        title="Filtrer par Entretiens"
                    >
                        <UserCheck size={14} />
                        <span>Entretiens</span>
                        <span className="agenda-kpi-count">{kpiCounts.entretiens}</span>
                    </div>

                    <div
                        className={`agenda-kpi-badge test ${filterType === '1' ? 'active' : ''}`}
                        onClick={() => {
                            setFilterType(filterType === '1' ? '' : '1');
                            setFilterStatut('');
                        }}
                        title="Filtrer par Tests"
                    >
                        <Clock size={14} />
                        <span>Tests</span>
                        <span className="agenda-kpi-count">{kpiCounts.tests}</span>
                    </div>

                    <div
                        className={`agenda-kpi-badge realise ${filterStatut === '2' ? 'active' : ''}`}
                        onClick={() => {
                            setFilterStatut(filterStatut === '2' ? '' : '2');
                            setFilterType('');
                        }}
                        title="Filtrer par Réalisés"
                    >
                        <CheckCircle2 size={14} />
                        <span>Réalisés</span>
                        <span className="agenda-kpi-count">{kpiCounts.realises}</span>
                    </div>

                    <div
                        className={`agenda-kpi-badge annule ${filterStatut === '3' ? 'active' : ''}`}
                        onClick={() => {
                            setFilterStatut(filterStatut === '3' ? '' : '3');
                            setFilterType('');
                        }}
                        title="Filtrer par Annulés"
                    >
                        <span>Annulés</span>
                        <span className="agenda-kpi-count">{kpiCounts.annules}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        className="action-button secondary"
                        onClick={loadEvents}
                        disabled={loading}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        <span>Actualiser</span>
                    </button>
                    <button
                        className="action-button primary"
                        onClick={() => {
                            setSelectedRdv(null);
                            setModalOpen(true);
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Plus size={16} />
                        <span>Planifier un rendez-vous</span>
                    </button>
                </div>
            </div>

            {/* 2. Modern Filter & Live Search Toolbar */}
            <div className="agenda-controls-panel">
                {/* Instant Search Bar */}
                <div className="agenda-search-input-wrapper">
                    <Search size={16} className="agenda-search-icon" />
                    <input
                        type="text"
                        className="agenda-search-input"
                        placeholder="Rechercher par candidat, poste, lieu, recruteur..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                padding: '2px',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem' }}>
                    <Filter size={15} />
                    <strong>Filtres :</strong>
                </div>

                <select
                    className="agenda-select-filter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="">Tous les types</option>
                    {referentiels.types.map((t) => (
                        <option key={t.id_type_rendez_vous} value={t.id_type_rendez_vous}>
                            {t.libelle}
                        </option>
                    ))}
                </select>

                <select
                    className="agenda-select-filter"
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                >
                    <option value="">Tous les statuts</option>
                    {referentiels.statuts.map((s) => (
                        <option key={s.id_statut_rendez_vous} value={s.id_statut_rendez_vous}>
                            {s.libelle}
                        </option>
                    ))}
                </select>

                <select
                    className="agenda-select-filter"
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                >
                    <option value="">Toutes les modalités</option>
                    {referentiels.modes.map((m) => (
                        <option key={m.id_mode_realisation} value={m.id_mode_realisation}>
                            {m.libelle}
                        </option>
                    ))}
                </select>

                <select
                    className="agenda-select-filter"
                    value={filterResponsable}
                    onChange={(e) => setFilterResponsable(e.target.value)}
                >
                    <option value="">Tous les recruteurs</option>
                    {referentiels.responsables.map((u) => (
                        <option key={u.id_utilisateur} value={u.id_utilisateur}>
                            {u.nom || u.name}
                        </option>
                    ))}
                </select>

                {hasActiveFilters && (
                    <button
                        className="agenda-reset-filters-btn"
                        onClick={handleResetFilters}
                        title="Effacer tous les filtres"
                    >
                        <X size={14} />
                        <span>Réinitialiser</span>
                    </button>
                )}

                {/* Color Legend */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                        Entretien
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#7c3aed' }} />
                        Test
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
                        Réalisé
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748b' }} />
                        Annulé
                    </span>
                </div>
            </div>

            {error && <ErrorState message={error} />}

            {/* 3. Modern Calendar Container */}
            <div className="agenda-calendar-container">
                {/* Header Custom Navigation Toolbar */}
                <div className="agenda-nav-toolbar">
                    <div className="agenda-nav-left">
                        <button
                            className="agenda-nav-arrow-btn"
                            onClick={handlePrev}
                            title="Période précédente"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            className="agenda-nav-arrow-btn"
                            onClick={handleNext}
                            title="Période suivante"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            className="agenda-nav-today-btn"
                            onClick={handleToday}
                        >
                            Aujourd’hui
                        </button>
                        <h3 className="agenda-period-title">
                            {calendarTitle}
                        </h3>
                    </div>

                    {/* Segmented View Switcher */}
                    <div className="agenda-segmented-switcher">
                        <button
                            className={`agenda-segment-btn ${currentView === 'dayGridMonth' ? 'active' : ''}`}
                            onClick={() => handleViewChange('dayGridMonth')}
                        >
                            Mois
                        </button>
                        <button
                            className={`agenda-segment-btn ${currentView === 'timeGridWeek' ? 'active' : ''}`}
                            onClick={() => handleViewChange('timeGridWeek')}
                        >
                            Semaine
                        </button>
                        <button
                            className={`agenda-segment-btn ${currentView === 'timeGridDay' ? 'active' : ''}`}
                            onClick={() => handleViewChange('timeGridDay')}
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
                        headerToolbar={false}
                        locale="fr"
                        slotMinTime="07:30:00"
                        slotMaxTime="19:30:00"
                        slotDuration="00:30:00"
                        allDaySlot={false}
                        height="auto"
                        editable={true}
                        selectable={true}
                        displayEventTime={false}
                        dayMaxEvents={3}
                        dayMaxEventRows={true}
                        moreLinkClick="popover"
                        events={filteredEvents}
                        eventContent={renderEventContent}
                        eventClick={handleEventClick}
                        eventDrop={handleEventDrop}
                        eventResize={handleEventResize}
                        datesSet={(arg) => {
                            setCalendarTitle(arg.view.title);
                            setCurrentView(arg.view.type);
                        }}
                        nowIndicator={true}
                        dayHeaderContent={(arg) => {
                            const isToday = arg.isToday;
                            const weekday = arg.date.toLocaleDateString('fr-FR', { weekday: 'short' });
                            const dayNum = arg.date.getDate();
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: isToday ? '#FF0D00' : '#64748b', fontWeight: 700 }}>
                                        {weekday}
                                    </span>
                                    <span
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isToday ? '#FF0D00' : 'transparent',
                                            color: isToday ? '#ffffff' : '#1e293b',
                                            fontWeight: isToday ? 800 : 600,
                                            fontSize: '0.88rem',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {dayNum}
                                    </span>
                                </div>
                            );
                        }}
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
