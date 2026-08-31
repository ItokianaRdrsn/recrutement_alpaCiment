import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ meta, onChangePage }) {
    const currentPage = meta.current_page ?? 1;
    const lastPage = meta.last_page ?? 1;

    return (
        <div className="pagination">
            <button disabled={currentPage <= 1} onClick={() => onChangePage(currentPage - 1)} type="button">
                <ChevronLeft aria-hidden="true" size={17} />
                <span>Precedent</span>
            </button>
            <span>
                Page {currentPage} / {lastPage}
            </span>
            <button disabled={currentPage >= lastPage} onClick={() => onChangePage(currentPage + 1)} type="button">
                <span>Suivant</span>
                <ChevronRight aria-hidden="true" size={17} />
            </button>
        </div>
    );
}
