import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Briefcase,
    Check,
    Edit3,
    Factory,
    Maximize2,
    Minimize2,
    Move,
    Plus,
    Printer,
    RefreshCw,
    RotateCcw,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import { generatePosterData } from '../../utils/posterContentGenerator';

const defaultPositions = {
    hero: { top: 11.8, left: 25 },
    accroche: { top: 31.6, left: 10 },
    missions: { top: 42.6, left: 11.2 },
    profil: { top: 66.2, left: 11.2 },
    candidature: { top: 86.1, left: 9.8 },
};

export function AfficheOffreModal({
    allCompetences = [],
    offer,
    onClose,
    onSaveToOffer = null,
    referentiels = {},
}) {
    if (!offer) return null;

    const initialData = useMemo(
        () => generatePosterData(offer, referentiels, allCompetences),
        [offer, referentiels, allCompetences]
    );

    // Thème de fond : office (bureau/siège) ou factory (usine/silo)
    const [bgTheme, setBgTheme] = useState('office');
    const [isEditing, setIsEditing] = useState(false);
    const [isMoveMode, setIsMoveMode] = useState(false);
    const [activeDraggingBlock, setActiveDraggingBlock] = useState(null);
    const [selectedBlock, setSelectedBlock] = useState(null);

    // Contenu éditable
    const [posterData, setPosterData] = useState(initialData);

    // Découpage automatique ou manuel du titre de poste par ligne (ex: "Directrice\nCommerciale")
    const titleLines = useMemo(() => {
        const text = (posterData.jobTitle || '').trim();
        if (!text) return [];
        if (text.includes('\n')) {
            return text.split('\n').map((l) => l.trim()).filter(Boolean);
        }
        const words = text.split(/\s+/);
        if (words.length === 2) {
            return [words[0], words[1]];
        }
        if (words.length === 3 && words[1].length <= 3) {
            return [`${words[0]} ${words[1]}`, words[2]];
        }
        if (words.length === 3) {
            return words;
        }
        return [text];
    }, [posterData.jobTitle]);

    // Positions personnalisées des blocs de texte
    const [positions, setPositions] = useState(defaultPositions);

    // Zoom / Échelle pour affichage écran
    const [scaleMode, setScaleMode] = useState('fit'); // 'fit' ou '100'
    const [customScale, setCustomScale] = useState(0.7);

    const scrollContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const dragDataRef = useRef(null);

    // Isolation stricte des styles d'impression pour l'affiche
    useEffect(() => {
        document.body.classList.add('affiche-modal-open');
        const styleEl = document.createElement('style');
        styleEl.id = 'affiche-print-page-style';
        styleEl.innerHTML = '@media print { @page { size: A4 portrait; margin: 0 !important; } }';
        document.head.appendChild(styleEl);

        return () => {
            document.body.classList.remove('affiche-modal-open');
            const el = document.getElementById('affiche-print-page-style');
            if (el) el.remove();
        };
    }, []);

    // Calcul automatique du zoom pour faire tenir la page A4 entière à l'écran
    useEffect(() => {
        function updateFitScale() {
            if (!scrollContainerRef.current) return;
            const availableHeight = scrollContainerRef.current.clientHeight - 40;
            if (availableHeight > 200) {
                const fit = Math.min(1.0, Math.max(0.4, availableHeight / 1146));
                setCustomScale(fit);
            }
        }

        updateFitScale();
        window.addEventListener('resize', updateFitScale);
        return () => window.removeEventListener('resize', updateFitScale);
    }, [scaleMode]);

    // Ajustement millimétré aux touches fléchées du clavier lorsqu'un bloc est sélectionné
    useEffect(() => {
        function handleKeyDown(e) {
            if (!isMoveMode || !selectedBlock) return;
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

            const step = e.shiftKey ? 0.1 : 0.5;
            let deltaX = 0;
            let deltaY = 0;

            if (e.key === 'ArrowUp') deltaY = -step;
            else if (e.key === 'ArrowDown') deltaY = step;
            else if (e.key === 'ArrowLeft') deltaX = -step;
            else if (e.key === 'ArrowRight') deltaX = step;
            else return;

            e.preventDefault();
            setPositions((prev) => {
                const current = prev[selectedBlock] || { top: 0, left: 0 };
                return {
                    ...prev,
                    [selectedBlock]: {
                        left: Math.round(Math.max(-5, Math.min(85, current.left + deltaX)) * 10) / 10,
                        top: Math.round(Math.max(0, Math.min(95, current.top + deltaY)) * 10) / 10,
                    },
                };
            });
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMoveMode, selectedBlock]);

    // Gestion du déplacement libre (Drag & Drop) à la souris
    function handleStartDrag(blockKey, event) {
        if (!isMoveMode) return;

        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.closest('button')) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        setActiveDraggingBlock(blockKey);
        setSelectedBlock(blockKey);

        dragDataRef.current = {
            blockKey,
            startX: event.clientX,
            startY: event.clientY,
            initialTop: positions[blockKey].top,
            initialLeft: positions[blockKey].left,
            canvasWidth: canvasRect.width,
            canvasHeight: canvasRect.height,
        };

        function onMouseMove(e) {
            if (!dragDataRef.current) return;
            const { blockKey: bKey, startX, startY, initialTop, initialLeft, canvasWidth, canvasHeight } = dragDataRef.current;
            const dxPercent = ((e.clientX - startX) / canvasWidth) * 100;
            const dyPercent = ((e.clientY - startY) / canvasHeight) * 100;

            const newLeft = Math.round((initialLeft + dxPercent) * 10) / 10;
            const newTop = Math.round((initialTop + dyPercent) * 10) / 10;

            setPositions((prev) => ({
                ...prev,
                [bKey]: {
                    left: Math.max(-5, Math.min(85, newLeft)),
                    top: Math.max(0, Math.min(95, newTop)),
                },
            }));
        }

        function onMouseUp() {
            dragDataRef.current = null;
            setActiveDraggingBlock(null);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    function handleResetText() {
        if (window.confirm('Réinitialiser le texte aux données exactes de l’offre ?')) {
            setPosterData(generatePosterData(offer, referentiels, allCompetences));
        }
    }

    function handleResetPositions() {
        setPositions(defaultPositions);
        setSelectedBlock(null);
    }

    function handlePrint() {
        window.print();
    }

    const currentScale = scaleMode === '100' ? 1.0 : customScale;

    const bgUrl = bgTheme === 'office'
        ? '/images/affiche/poster_office_clean.png'
        : '/images/affiche/poster_factory_clean.png';

    return (
        <div className="affiche-modal-overlay">
            {/* Barre d'outils supérieure (masquée lors de l'impression) */}
            <div className="affiche-toolbar-bar no-print">
                <div className="affiche-toolbar-left">
                    <span className="affiche-toolbar-title">
                        📄 Affiche Officielle de Recrutement
                    </span>
                    <span className="affiche-toolbar-subtitle">
                        Format A4 • Alpha Ciment Madagascar
                    </span>
                </div>

                <div className="affiche-toolbar-center">
                    <div className="theme-toggle-group">
                        <button
                            className={`theme-btn ${bgTheme === 'office' ? 'active' : ''}`}
                            onClick={() => setBgTheme('office')}
                            title="Thème Bureau / Siège & Management"
                            type="button"
                        >
                            <Briefcase size={14} />
                            <span>Bureau / Équipe</span>
                        </button>
                        <button
                            className={`theme-btn ${bgTheme === 'factory' ? 'active' : ''}`}
                            onClick={() => setBgTheme('factory')}
                            title="Thème Usine / Site Industriel"
                            type="button"
                        >
                            <Factory size={14} />
                            <span>Site Usine</span>
                        </button>
                    </div>

                    <div className="zoom-toggle-group">
                        <button
                            className={`theme-btn ${scaleMode === 'fit' ? 'active' : ''}`}
                            onClick={() => setScaleMode('fit')}
                            title="Ajuster pour voir l'affiche entière à l'écran"
                            type="button"
                        >
                            <Minimize2 size={13} />
                            <span>Page entière</span>
                        </button>
                        <button
                            className={`theme-btn ${scaleMode === '100' ? 'active' : ''}`}
                            onClick={() => setScaleMode('100')}
                            title="Afficher à 100% de la taille réelle"
                            type="button"
                        >
                            <Maximize2 size={13} />
                            <span>100%</span>
                        </button>
                    </div>

                    {/* Mode Déplacement des blocs */}
                    <button
                        className={`action-btn-ghost ${isMoveMode ? 'active' : ''}`}
                        onClick={() => {
                            const next = !isMoveMode;
                            setIsMoveMode(next);
                            if (!next) setSelectedBlock(null);
                            if (next && isEditing) setIsEditing(false);
                        }}
                        style={isMoveMode ? { background: '#dbeafe', borderColor: '#2563eb', color: '#1d4ed8', fontWeight: 700 } : {}}
                        title="Activer/désactiver le déplacement libre des blocs à la souris"
                        type="button"
                    >
                        {isMoveMode ? <Check size={14} /> : <Move size={14} />}
                        <span>{isMoveMode ? 'Terminer déplacement' : 'Déplacer les blocs'}</span>
                    </button>

                    {/* Mode Édition de texte */}
                    <button
                        className={`action-btn-ghost ${isEditing ? 'active' : ''}`}
                        onClick={() => {
                            const next = !isEditing;
                            setIsEditing(next);
                            if (next && isMoveMode) setIsMoveMode(false);
                        }}
                        title={isEditing ? 'Terminer les modifications de texte' : 'Modifier les textes de l’affiche'}
                        type="button"
                    >
                        {isEditing ? <Check size={14} /> : <Edit3 size={14} />}
                        <span>{isEditing ? 'Valider texte' : 'Ajuster texte'}</span>
                    </button>

                    {/* Enregistrer / Synchroniser dans l'offre */}
                    {onSaveToOffer && (
                        <button
                            className="action-btn-ghost"
                            onClick={() => onSaveToOffer(posterData)}
                            style={{
                                background: '#ecfdf5',
                                color: '#059669',
                                borderColor: '#a7f3d0',
                                fontWeight: 700,
                            }}
                            title="Synchroniser et enregistrer ces textes dans l'offre d'emploi"
                            type="button"
                        >
                            <Save size={14} />
                            <span>Enregistrer dans l'offre</span>
                        </button>
                    )}

                    {/* Réinitialisation positions */}
                    <button
                        className="action-btn-ghost"
                        onClick={handleResetPositions}
                        title="Remettre tous les blocs à leurs coordonnées par défaut"
                        type="button"
                    >
                        <RotateCcw size={13} />
                        <span>Réinit. positions</span>
                    </button>

                    {/* Régénération automatique */}
                    <button
                        className="action-btn-ghost"
                        onClick={handleResetText}
                        title="Régénérer automatiquement les phrases à partir de l'offre"
                        type="button"
                    >
                        <RefreshCw size={13} />
                        <span>Régénérer texte</span>
                    </button>
                </div>

                <div className="affiche-toolbar-right">
                    <button
                        className="action-btn-primary"
                        onClick={handlePrint}
                        title="Imprimer ou enregistrer au format PDF A4"
                        type="button"
                    >
                        <Printer size={15} />
                        <span>Imprimer / Exporter PDF</span>
                    </button>

                    <button
                        className="action-btn-close"
                        onClick={onClose}
                        title="Fermer la prévisualisation"
                        type="button"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Bannière d'aide mode déplacement */}
            {isMoveMode && (
                <div className="affiche-move-helper-banner no-print">
                    <Move size={13} />
                    <span>
                        <strong>Mode Déplacement actif :</strong> Glissez les blocs de texte à la souris, ou sélectionnez un bloc et utilisez les flèches du clavier (↑ ↓ ← →) pour ajuster au millimètre.
                    </span>
                </div>
            )}

            {/* Bannière d'aide mode édition */}
            {isEditing && (
                <div
                    className="no-print"
                    style={{
                        background: 'linear-gradient(90deg, #1e293b, #334155)',
                        color: '#ffffff',
                        fontSize: '12px',
                        padding: '6px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        zIndex: 100,
                    }}
                >
                    <span>
                        <strong>Mode Édition actif :</strong> Vous pouvez modifier directement tous les textes sur l'affiche (titre, accroche, missions, profil, candidature).
                    </span>
                </div>
            )}

            {/* Zone de défilement / centrage de la page A4 */}
            <div className="affiche-scroll-container" ref={scrollContainerRef}>
                <div
                    className="affiche-page-scale-wrapper"
                    style={{
                        width: `${794 * currentScale}px`,
                        height: `${1146 * currentScale}px`,
                        transition: 'width 0.2s ease, height 0.2s ease',
                    }}
                >
                    {/* LE CANVAS A4 OFFICIEL */}
                    <div
                        className={`affiche-a4-canvas ${isMoveMode ? 'canvas-move-mode' : ''}`}
                        id="affiche-to-print"
                        onClick={(e) => {
                            if (e.target === canvasRef.current) {
                                setSelectedBlock(null);
                            }
                        }}
                        ref={canvasRef}
                        style={{
                            backgroundImage: `url("${bgUrl}")`,
                            transform: `scale(${currentScale})`,
                            transformOrigin: 'top left',
                        }}
                    >
                        {/* 1. CARTE CENTRALE FLOTTANTE (HERO) */}
                        <div
                            className={`affiche-hero-content-box draggable-block ${isMoveMode ? 'is-movable' : ''} ${isMoveMode && selectedBlock === 'hero' ? 'is-selected' : ''} ${isMoveMode && activeDraggingBlock === 'hero' ? 'is-dragging' : ''}`}
                            onClick={() => { if (isMoveMode) setSelectedBlock('hero'); }}
                            onMouseDown={(e) => { if (isMoveMode) handleStartDrag('hero', e); }}
                            style={{
                                top: `${positions.hero.top}%`,
                                left: `${positions.hero.left}%`,
                            }}
                        >
                            {isMoveMode && (
                                <span className="drag-handle-badge no-print" onMouseDown={(e) => handleStartDrag('hero', e)}>
                                    <Move size={11} /> Titre <span className="coord-indicator">{positions.hero.left}% , {positions.hero.top}%</span>
                                </span>
                            )}
                            <div className="affiche-hero-prefix">
                                {isEditing ? (
                                    <input
                                        className="edit-hero-prefix-input"
                                        onChange={(e) => setPosterData({ ...posterData, prefix: e.target.value })}
                                        style={{ width: '80px', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase' }}
                                        type="text"
                                        value={posterData.prefix}
                                    />
                                ) : (
                                    posterData.prefix
                                )}
                            </div>
                            <div className="affiche-hero-title">
                                {isEditing ? (
                                    <textarea
                                        className="edit-hero-title-input"
                                        onChange={(e) => setPosterData({ ...posterData, jobTitle: e.target.value })}
                                        placeholder="Ex: Directrice&#10;Commerciale"
                                        rows={2}
                                        style={{
                                            width: '100%',
                                            maxWidth: '280px',
                                            textAlign: 'center',
                                            fontWeight: 800,
                                            fontSize: '15px',
                                            textTransform: 'uppercase',
                                            lineHeight: '1.2',
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                            padding: '4px',
                                            border: '1px dashed #D40B00',
                                            borderRadius: '6px',
                                            background: 'rgba(255, 255, 255, 0.95)',
                                        }}
                                        value={posterData.jobTitle}
                                    />
                                ) : (
                                    <div className="affiche-hero-title-lines">
                                        {titleLines.map((line, idx) => (
                                            <div key={idx} className="affiche-hero-title-line">
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="affiche-hero-lieu">
                                {isEditing ? (
                                    <input
                                        className="edit-hero-lieu-input"
                                        onChange={(e) => setPosterData({ ...posterData, lieu: e.target.value })}
                                        style={{ width: '220px', textAlign: 'center', fontWeight: 600 }}
                                        type="text"
                                        value={posterData.lieu}
                                    />
                                ) : (
                                    posterData.lieu
                                )}
                            </div>
                            <div className="affiche-hero-contrat">
                                {isEditing ? (
                                    <input
                                        className="edit-hero-contrat-input"
                                        onChange={(e) => setPosterData({ ...posterData, contrat: e.target.value })}
                                        style={{ width: '220px', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase' }}
                                        type="text"
                                        value={posterData.contrat}
                                    />
                                ) : (
                                    posterData.contrat
                                )}
                            </div>
                        </div>

                        {/* 2. PHRASE D'ACCROCHE */}
                        <div
                            className={`affiche-accroche-content-box draggable-block ${isMoveMode ? 'is-movable' : ''} ${isMoveMode && selectedBlock === 'accroche' ? 'is-selected' : ''} ${isMoveMode && activeDraggingBlock === 'accroche' ? 'is-dragging' : ''}`}
                            onClick={() => { if (isMoveMode) setSelectedBlock('accroche'); }}
                            onMouseDown={(e) => { if (isMoveMode) handleStartDrag('accroche', e); }}
                            style={{
                                top: `${positions.accroche.top}%`,
                                left: `${positions.accroche.left}%`,
                            }}
                        >
                            {isMoveMode && (
                                <span className="drag-handle-badge no-print" onMouseDown={(e) => handleStartDrag('accroche', e)}>
                                    <Move size={11} /> Accroche <span className="coord-indicator">{positions.accroche.left}% , {positions.accroche.top}%</span>
                                </span>
                            )}
                            {isEditing ? (
                                <textarea
                                    className="edit-textarea"
                                    onChange={(e) => setPosterData({ ...posterData, accroche: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%' }}
                                    value={posterData.accroche}
                                />
                            ) : (
                                <div className="affiche-accroche-text-wrapper">
                                    {(posterData.accroche || '')
                                        .split(/\r?\n/)
                                        .map((line) => line.trim())
                                        .filter(Boolean)
                                        .map((line, idx) => (
                                            <p key={idx} className="affiche-accroche-p">{line}</p>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* 3. LISTE DES MISSIONS */}
                        <div
                            className={`affiche-missions-content-box draggable-block ${isMoveMode ? 'is-movable' : ''} ${isMoveMode && selectedBlock === 'missions' ? 'is-selected' : ''} ${isMoveMode && activeDraggingBlock === 'missions' ? 'is-dragging' : ''}`}
                            onClick={() => { if (isMoveMode) setSelectedBlock('missions'); }}
                            onMouseDown={(e) => { if (isMoveMode) handleStartDrag('missions', e); }}
                            style={{
                                top: `${positions.missions.top}%`,
                                left: `${positions.missions.left}%`,
                            }}
                        >
                            {isMoveMode && (
                                <span className="drag-handle-badge no-print" onMouseDown={(e) => handleStartDrag('missions', e)}>
                                    <Move size={11} /> Missions <span className="coord-indicator">{positions.missions.left}% , {positions.missions.top}%</span>
                                </span>
                            )}
                            <ul className="affiche-bullets-clean">
                                {posterData.missions.map((mission, idx) => (
                                    <li key={`m-${idx}`}>
                                        <span className="bullet-sym">•</span>
                                        {isEditing ? (
                                            <div className="edit-bullet-row">
                                                <input
                                                    className="edit-bullet-input"
                                                    onChange={(e) => {
                                                        const updated = [...posterData.missions];
                                                        updated[idx] = e.target.value;
                                                        setPosterData({ ...posterData, missions: updated });
                                                    }}
                                                    type="text"
                                                    value={mission}
                                                />
                                                {posterData.missions.length > 1 && (
                                                    <button
                                                        className="btn-bullet-del no-print"
                                                        onClick={() => {
                                                            setPosterData({
                                                                ...posterData,
                                                                missions: posterData.missions.filter((_, i) => i !== idx),
                                                            });
                                                        }}
                                                        title="Supprimer cette mission"
                                                        type="button"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="bullet-text">{mission}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {isEditing && (
                                <button
                                    className="btn-add-bullet-inline no-print"
                                    onClick={() => setPosterData({ ...posterData, missions: [...posterData.missions, ''] })}
                                    type="button"
                                >
                                    <Plus size={11} />
                                    <span>Ajouter une mission</span>
                                </button>
                            )}
                        </div>

                        {/* 4. LISTE DU PROFIL */}
                        <div
                            className={`affiche-profil-content-box draggable-block ${isMoveMode ? 'is-movable' : ''} ${isMoveMode && selectedBlock === 'profil' ? 'is-selected' : ''} ${isMoveMode && activeDraggingBlock === 'profil' ? 'is-dragging' : ''}`}
                            onClick={() => { if (isMoveMode) setSelectedBlock('profil'); }}
                            onMouseDown={(e) => { if (isMoveMode) handleStartDrag('profil', e); }}
                            style={{
                                top: `${positions.profil.top}%`,
                                left: `${positions.profil.left}%`,
                            }}
                        >
                            {isMoveMode && (
                                <span className="drag-handle-badge no-print" onMouseDown={(e) => handleStartDrag('profil', e)}>
                                    <Move size={11} /> Profil <span className="coord-indicator">{positions.profil.left}% , {positions.profil.top}%</span>
                                </span>
                            )}
                            <ul className="affiche-bullets-clean">
                                {posterData.profils.map((profilItem, idx) => (
                                    <li key={`p-${idx}`}>
                                        <span className="bullet-sym">•</span>
                                        {isEditing ? (
                                            <div className="edit-bullet-row">
                                                <input
                                                    className="edit-bullet-input"
                                                    onChange={(e) => {
                                                        const updated = [...posterData.profils];
                                                        updated[idx] = e.target.value;
                                                        setPosterData({ ...posterData, profils: updated });
                                                    }}
                                                    type="text"
                                                    value={profilItem}
                                                />
                                                {posterData.profils.length > 1 && (
                                                    <button
                                                        className="btn-bullet-del no-print"
                                                        onClick={() => {
                                                            setPosterData({
                                                                ...posterData,
                                                                profils: posterData.profils.filter((_, i) => i !== idx),
                                                            });
                                                        }}
                                                        title="Supprimer ce critère"
                                                        type="button"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="bullet-text">{profilItem}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {isEditing && (
                                <button
                                    className="btn-add-bullet-inline no-print"
                                    onClick={() => setPosterData({ ...posterData, profils: [...posterData.profils, ''] })}
                                    type="button"
                                >
                                    <Plus size={11} />
                                    <span>Ajouter un critère profil</span>
                                </button>
                            )}
                        </div>

                        {/* 5. APPEL À CANDIDATURE */}
                        <div
                            className={`affiche-candidature-content-box draggable-block ${isMoveMode ? 'is-movable' : ''} ${isMoveMode && selectedBlock === 'candidature' ? 'is-selected' : ''} ${isMoveMode && activeDraggingBlock === 'candidature' ? 'is-dragging' : ''}`}
                            onClick={() => { if (isMoveMode) setSelectedBlock('candidature'); }}
                            onMouseDown={(e) => { if (isMoveMode) handleStartDrag('candidature', e); }}
                            style={{
                                top: `${positions.candidature.top}%`,
                                left: `${positions.candidature.left}%`,
                            }}
                        >
                            {isMoveMode && (
                                <span className="drag-handle-badge no-print" onMouseDown={(e) => handleStartDrag('candidature', e)}>
                                    <Move size={11} /> Candidature <span className="coord-indicator">{positions.candidature.left}% , {positions.candidature.top}%</span>
                                </span>
                            )}
                            {isEditing ? (
                                <textarea
                                    className="edit-textarea"
                                    onChange={(e) => setPosterData({ ...posterData, candidatureText: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%' }}
                                    value={posterData.candidatureText}
                                />
                            ) : (
                                <p>
                                    {posterData.candidatureText || (
                                        <>
                                            Si vous êtes prêt à relever ces challenges avec nous, merci d’envoyer votre dossier de candidature (CV, références, prétentions salariales) à l’adresse{' '}
                                            <span className="candidature-email">mdg-service-rh@alphaciment.com</span> sous la référence{' '}
                                            <strong>{posterData.reference}</strong> avant le <strong>{posterData.dateLimiteTexte}</strong>.
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AfficheOffreModal;
