import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import './Pagination.css';

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination-wrapper">
      <span className="pagination-info">
        Mostrando <strong>{startItem}-{endItem}</strong> de <strong>{totalItems}</strong> registros
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="btn-pagination"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Página anterior"
        >
          <ChevronLeftIcon width={18} height={18} />
          Anterior
        </button>

        <span className="pagination-page-indicator">
          Página <strong>{currentPage}</strong> de {totalPages}
        </span>

        <button
          type="button"
          className="btn-pagination"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Página siguiente"
        >
          Siguiente
          <ChevronRightIcon width={18} height={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;