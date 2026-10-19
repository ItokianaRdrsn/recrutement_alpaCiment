import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
    meta,
    onChangePage,
    onChangePerPage,
    perPage = 10,
    perPageOptions = [10, 20, 50, 100],
    scrollTargetRef = null,
}) {
    const paginationRef = useRef(null);
    if (!meta) return null;

    const currentPage = meta.current_page ?? meta.page ?? 1;
    const itemsPerPage = perPage || meta.per_page || 10;
    const total = meta.total ?? 0;
    const lastPage = meta.last_page ?? (total ? Math.ceil(total / itemsPerPage) : 1);

    if (total <= 0) return null;

    const from = meta.from ?? (total > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0);
    const to = meta.to ?? Math.min(currentPage * itemsPerPage, total);

    const scrollToTop = () => {
        const doScroll = () => {
            if (scrollTargetRef?.current) {
                scrollTargetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            const target = paginationRef.current?.closest(
                '.data-section, .table-wrap, .candidatures-right-column, .audit-logs-page, .pipeline-monitoring-page, .view-stack, .workspace'
            );

            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        doScroll();
        setTimeout(doScroll, 60);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > lastPage || newPage === currentPage) return;
        if (onChangePage) {
            onChangePage(newPage);
        }
        scrollToTop();
    };

    const handlePerPageChange = (e) => {
        const nextPerPage = Number(e.target.value);
        if (onChangePerPage) {
            onChangePerPage(nextPerPage);
        }
        scrollToTop();
    };

    return (
        <div
            ref={paginationRef}
            className="pagination-bar"
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '10px 4px',
                borderTop: '1px solid #f1f5f9',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Affichage de <strong style={{ color: '#0f172a' }}>{from}</strong> à <strong style={{ color: '#0f172a' }}>{to}</strong> sur <strong style={{ color: '#0f172a' }}>{total}</strong> éléments
                </div>

                {onChangePerPage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label htmlFor="pagination-per-page-select" style={{ fontSize: '12.5px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                            Afficher :
                        </label>
                        <select
                            id="pagination-per-page-select"
                            value={itemsPerPage}
                            onChange={handlePerPageChange}
                            style={{
                                padding: '4px 8px',
                                fontSize: '12.5px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0f172a',
                                cursor: 'pointer',
                                fontWeight: 600,
                                outline: 'none',
                            }}
                        >
                            {perPageOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt} / page
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    style={{
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: currentPage <= 1 ? '#f8fafc' : '#ffffff',
                        color: currentPage <= 1 ? '#94a3b8' : '#334155',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 500,
                        transition: 'all 0.15s ease',
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    style={{
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: currentPage >= lastPage ? '#f8fafc' : '#ffffff',
                        color: currentPage >= lastPage ? '#94a3b8' : '#334155',
                        cursor: currentPage >= lastPage ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 500,
                        transition: 'all 0.15s ease',
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
