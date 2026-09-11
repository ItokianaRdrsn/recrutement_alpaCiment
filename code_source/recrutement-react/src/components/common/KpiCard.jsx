import React from 'react';

export function KpiCard({ icon: Icon, label, tone, value }) {
    return (
        <article className={`kpi-card ${tone}`}>
            <div className="kpi-icon">
                <Icon aria-hidden="true" size={20} />
            </div>
            <span>{label}</span>
            <strong>{value ?? 0}</strong>
        </article>
    );
}
