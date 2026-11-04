type TablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
};

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (page >= totalPages - 2) {
    return [
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [page - 2, page - 1, page, page + 1, page + 2];
}

export default function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  itemLabel = 'registros',
  onPageChange,
}: TablePaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className="table-pagination">
      <p className="table-pagination-summary">
        Mostrando {start}-{end} de {totalItems} {itemLabel}
      </p>

      <div className="table-pagination-controls">
        <button
          type="button"
          className="table-pagination-button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Anterior
        </button>

        <div className="table-pagination-pages">
          {visiblePages.map((item) => (
            <button
              key={item}
              type="button"
              className={[
                'table-pagination-button',
                item === page ? 'table-pagination-button-active' : '',
              ].join(' ')}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="table-pagination-button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
