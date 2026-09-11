import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export function PagePreloader() {
    return (
        <div className="preloader-overlay">
            <div className="loading-container">
                <div className="loading"></div>
                <div id="loading-icon">
                    <img src="/themes/custom/apiqa/images/loader.png" alt="Alpha Ciment" />
                </div>
            </div>
        </div>
    );
}

export function LoadingState({
    message = "Chargement des données en cours...",
    subtitle = "Veuillez patienter un instant"
}) {
    return (
        <div className="feedback-state modern-loading-card">
            <div className="modern-spinner-wrapper">
                <div className="spinner-halo"></div>
                <Loader2 className="modern-spinner-icon animate-spin" size={34} />
            </div>
            <div className="loading-text-container">
                <div className="loading-main-text">{message}</div>
                {subtitle && <div className="loading-sub-text">{subtitle}</div>}
            </div>
            <div className="loading-bar-track">
                <div className="loading-bar-pulse"></div>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
    return (
        <div className="skeleton-table-container">
            <div className="skeleton-table-header">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="skeleton-line skeleton-head" />
                ))}
            </div>
            <div className="skeleton-table-body">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="skeleton-row">
                        {Array.from({ length: cols }).map((_, c) => (
                            <div
                                key={c}
                                className="skeleton-line"
                                style={{ width: c === 0 ? '70%' : c === cols - 1 ? '40%' : '85%' }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ErrorState({ message, onRetry }) {
    return (
        <div className="feedback-state error">
            <strong>Impossible de charger les données.</strong>
            <span>{message}</span>
            {onRetry ? (
                <button className="ghost-button" onClick={onRetry} type="button">
                    <RefreshCw aria-hidden="true" size={17} />
                    <span>Réessayer</span>
                </button>
            ) : null}
        </div>
    );
}
