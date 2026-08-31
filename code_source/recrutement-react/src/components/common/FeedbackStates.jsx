import React from 'react';
import { RefreshCw } from 'lucide-react';

export function LoadingState() {
    return <div className="feedback-state">Chargement...</div>;
}

export function ErrorState({ message, onRetry }) {
    return (
        <div className="feedback-state error">
            <strong>Impossible de charger les donnees.</strong>
            <span>{message}</span>
            {onRetry ? (
                <button className="ghost-button" onClick={onRetry} type="button">
                    <RefreshCw aria-hidden="true" size={17} />
                    <span>Reessayer</span>
                </button>
            ) : null}
        </div>
    );
}
