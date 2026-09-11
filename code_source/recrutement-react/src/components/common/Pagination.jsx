import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ meta, onChangePage, perPage }) {
    if (!meta) return null;

    const currentPage = meta.current_page ?? meta.page ?? 1;
    const itemsPerPage = perPage || meta.per_page || 10;
    const total = meta.total ?? 0;
    const lastPage = meta.last_page ?? (total ? Math.ceil(total / itemsPerPage) : 1);
    
    if (total <= 0) return null;

    const from = meta.from ?? (total > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0);
    const to = meta.to ?? Math.min(currentPage * itemsPerPage, total);

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px', padding: '8px 4px' }}>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
                Affichage de <strong style={{ color: '#0f172a' }}>{from}</strong> à <strong style={{ color: '#0f172a' }}>{to}</strong> sur <strong style={{ color: '#0f172a' }}>{total}</strong> éléments
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                    disabled={currentPage <= 1}
                    onClick={() => onChangePage(currentPage - 1)}
                    style={{
                        padding: '6px 12px',
                        fontSize: '12.5px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: currentPage <= 1 ? '#f1f5f9' : '#ffffff',
                        color: currentPage <= 1 ? '#94a3b8' : '#334155',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                    type="button"
                >
                    <ChevronLeft size={16} />
                    <span>Précédent</span>
                </button>

                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', padding: '0 8px' }}>
                    Page {currentPage} / {lastPage || 1}
                </span>

                <button
                    disabled={currentPage >= lastPage}
                    onClick={() => onChangePage(currentPage + 1)}
                    style={{
                        padding: '6px 12px',
                        fontSize: '12.5px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: currentPage >= lastPage ? '#f1f5f9' : '#ffffff',
                        color: currentPage >= lastPage ? '#94a3b8' : '#334155',
                        cursor: currentPage >= lastPage ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                    type="button"
                >
                    <span>Suivant</span>
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
