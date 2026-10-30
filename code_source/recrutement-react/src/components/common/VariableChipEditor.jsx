import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Eye, Code, Tag, Sparkles } from 'lucide-react';

// Formate un tag en HTML de puce (chip)
function createChipHtml(tag) {
    return `<span class="variable-chip" contenteditable="false" data-variable="${tag}" title="Variable dynamique : ${tag}">` +
        `<span class="variable-chip-icon">🏷️</span>` +
        `<span class="variable-chip-text">${tag}</span>` +
        `<span class="variable-chip-remove" role="button" title="Supprimer ce bloc variable">&times;</span>` +
    `</span>`;
}

// Convertit le texte brut avec {variable} en HTML avec puces interactives
function renderTemplateHtml(text) {
    if (!text) return '';
    const normalized = String(text).replace(/\r\n/g, '\n');
    const escaped = normalized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const regex = /\{{1,2}\s*([a-zA-Z0-9_-]+)\s*\}{1,2}/g;
    const withChips = escaped.replace(regex, (match, varName) => {
        return createChipHtml(`{${varName}}`);
    });

    return withChips.replace(/\n/g, '<br>');
}

// Sérialise le contenu HTML du contenteditable en texte brut avec les balises {variable}
function serializeEditor(node) {
    if (!node) return '';
    const clone = node.cloneNode(true);

    // Remplacer chaque puce de variable par son tag {cle}
    const chips = clone.querySelectorAll('.variable-chip');
    chips.forEach((chip) => {
        const tag = chip.getAttribute('data-variable') || chip.innerText.trim();
        chip.replaceWith(document.createTextNode(tag));
    });

    // Remplacer les <br> par des retours à la ligne
    clone.querySelectorAll('br').forEach((br) => br.replaceWith(document.createTextNode('\n')));

    // Remplacer les balises bloc (div, p) générées par la touche Entrée
    clone.querySelectorAll('div, p').forEach((block) => {
        if (block !== clone.firstElementChild) {
            block.prepend(document.createTextNode('\n'));
        }
    });

    let text = clone.textContent || '';
    text = text.replace(/\u00A0/g, ' ');
    text = text.replace(/\r\n/g, '\n');
    return text;
}

export const VariableChipEditor = forwardRef(function VariableChipEditor(
    {
        value = '',
        onChange,
        placeholder = 'Rédigez le texte du message...',
        minHeight = '210px',
        maxHeight = '380px',
        disabled = false,
        className = '',
    },
    ref
) {
    const editorRef = useRef(null);
    const textareaRef = useRef(null);
    const isInitialized = useRef(false);
    const lastSyncedValue = useRef('');
    
    // Possibilité de basculer entre mode blocs et mode texte brut
    const [rawMode, setRawMode] = useState(false);

    // Synchronisation ascendante vers le parent
    const syncChange = () => {
        if (!editorRef.current) return;
        const serialized = serializeEditor(editorRef.current);
        lastSyncedValue.current = serialized;
        onChange?.(serialized);
    };

    // Expose les méthodes au parent via ref (notamment insertVariable)
    useImperativeHandle(ref, () => ({
        insertVariable: (tag) => {
            if (rawMode) {
                // Mode texte brut classique
                if (textareaRef.current) {
                    const el = textareaRef.current;
                    const start = el.selectionStart ?? el.value.length;
                    const end = el.selectionEnd ?? el.value.length;
                    const text = el.value;
                    const nextVal = text.substring(0, start) + ' ' + tag + ' ' + text.substring(end);
                    lastSyncedValue.current = nextVal;
                    onChange?.(nextVal);
                    setTimeout(() => {
                        el.focus();
                        el.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
                    }, 10);
                }
                return;
            }

            // Mode Blocs Visuels
            if (!editorRef.current) return;
            editorRef.current.focus();

            // Créer le nœud du chip
            const temp = document.createElement('div');
            temp.innerHTML = createChipHtml(tag);
            const chipElement = temp.firstElementChild;
            const space = document.createTextNode(' ');

            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(space);
                range.insertNode(chipElement);
                // Déplacer le curseur après l'espace suivant la puce
                range.setStartAfter(space);
                range.setEndAfter(space);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                // Si pas de sélection active dans l'éditeur, ajouter à la fin
                editorRef.current.appendChild(document.createTextNode(' '));
                editorRef.current.appendChild(chipElement);
                editorRef.current.appendChild(space);

                const newRange = document.createRange();
                newRange.setStartAfter(space);
                newRange.setEndAfter(space);
                if (sel) {
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                }
            }

            syncChange();
        },
        focus: () => {
            if (rawMode) {
                textareaRef.current?.focus();
            } else {
                editorRef.current?.focus();
            }
        },
        clear: () => {
            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }
            lastSyncedValue.current = '';
            onChange?.('');
        },
    }));

    // Initialisation et mise à jour externe de `value`
    useEffect(() => {
        if (rawMode) return;
        if (!editorRef.current) return;

        // Lors du montage initial ou si la valeur externe change (ex: ouverture de la modale avec le template)
        if (!isInitialized.current || value !== lastSyncedValue.current) {
            editorRef.current.innerHTML = renderTemplateHtml(value || '');
            lastSyncedValue.current = value || '';
            isInitialized.current = true;
        }
    }, [value, rawMode]);

    // Clic pour supprimer une variable directement via sa croix rouge/bleue
    const handleEditorClick = (e) => {
        const removeBtn = e.target.closest('.variable-chip-remove');
        if (removeBtn) {
            e.preventDefault();
            e.stopPropagation();
            const chip = removeBtn.closest('.variable-chip');
            if (chip) {
                chip.remove();
                syncChange();
            }
        }
    };

    return (
        <div className={`variable-chip-container ${className}`}>
            {/* EN-TÊTE ÉDITEUR AVEC BASCULE DE MODE */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 12px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 500 }}>
                    <Tag size={14} color="#0284c7" />
                    <span>Mode Blocs de Variables : les balises apparaissent sous forme d'étiquettes distinctes</span>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        const newMode = !rawMode;
                        setRawMode(newMode);
                        // Réinitialiser la ref pour forcer le rendu du HTML si on revient en mode blocs
                        if (!newMode) {
                            isInitialized.current = false;
                        }
                    }}
                    style={{
                        background: 'transparent',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11.5px',
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 500,
                    }}
                    title="Basculer entre la vue blocs graphiques et la vue texte brut standard"
                >
                    {rawMode ? <Eye size={13} color="#2563eb" /> : <Code size={13} color="#475569" />}
                    <span>{rawMode ? 'Passer en vue blocs' : 'Passer en texte brut'}</span>
                </button>
            </div>

            {/* CORPS DE L'ÉDITEUR */}
            {rawMode ? (
                <textarea
                    ref={textareaRef}
                    value={value}
                    disabled={disabled}
                    placeholder={placeholder}
                    onChange={(e) => {
                        lastSyncedValue.current = e.target.value;
                        onChange?.(e.target.value);
                    }}
                    rows={9}
                    style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: 'none',
                        outline: 'none',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        lineHeight: '1.6',
                        minHeight,
                        maxHeight,
                        resize: 'vertical',
                    }}
                />
            ) : (
                <div
                    ref={editorRef}
                    className="variable-chip-editor"
                    contentEditable={!disabled}
                    data-placeholder={placeholder}
                    onClick={handleEditorClick}
                    onInput={syncChange}
                    onBlur={syncChange}
                    style={{
                        minHeight,
                        maxHeight,
                    }}
                    spellCheck="false"
                />
            )}

            {/* PIED DE L'ÉDITEUR */}
            <div className="variable-chip-editor-footer">
                <span className="variable-chip-editor-hint">
                    💡 Cliquez sur <strong>+ variable</strong> pour insérer un bloc. Cliquez sur <strong>×</strong> sur le bloc pour le retirer immédiatement.
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Format template : &#123;cle&#125;
                </span>
            </div>
        </div>
    );
});
