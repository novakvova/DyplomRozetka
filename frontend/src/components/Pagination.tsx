import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
};

function buildPages(page: number, totalPages: number): (number | 'gap-start' | 'gap-end')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

    const pages: (number | 'gap-start' | 'gap-end')[] = [];

    if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, 'gap-end', totalPages);
    } else if (page >= totalPages - 3) {
        pages.push(1, 'gap-start', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
        pages.push(1, 'gap-start', page - 1, page, page + 1, 'gap-end', totalPages);
    }

    return pages;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <nav className="pagination" aria-label="Сторінки каталогу">
            <button
                type="button"
                className="pagination-button"
                onClick={() => onChange(page - 1)}
                disabled={page <= 1}
                aria-label="Попередня сторінка"
            >
                <ChevronLeft size={15} />
            </button>

            {buildPages(page, totalPages).map((item) =>
                typeof item === 'number' ? (
                    <button
                        key={item}
                        type="button"
                        className={`pagination-button${item === page ? ' pagination-button-active' : ''}`}
                        onClick={() => onChange(item)}
                        aria-current={item === page ? 'page' : undefined}
                    >
                        {item}
                    </button>
                ) : (
                    <span key={item} className="pagination-gap">…</span>
                ),
            )}

            <button
                type="button"
                className="pagination-button"
                onClick={() => onChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Наступна сторінка"
            >
                <ChevronRight size={15} />
            </button>
        </nav>
    );
}