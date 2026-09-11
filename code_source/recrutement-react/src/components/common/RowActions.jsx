import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

export function RowActions({ extra = null, onDelete, onEdit }) {
    return (
        <div className="row-actions">
            {extra}
            {onEdit ? (
                <button className="row-button" onClick={onEdit} title="Modifier" type="button">
                    <Edit3 aria-hidden="true" size={16} />
                </button>
            ) : null}
            {onDelete ? (
                <button className="row-button danger" onClick={onDelete} title="Supprimer" type="button">
                    <Trash2 aria-hidden="true" size={16} />
                </button>
            ) : null}
        </div>
    );
}
