import React, { useState } from 'react';
import { SearchIcon, ClearIcon, PlusIcon } from './Icons';
import Pagination from './Pagination';
import './DataTable.css';

export const DataTable = ({
  title,
  icon,
  actionButtonText,
  onActionClick,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  categories = [],
  selectedCategory,
  onCategoryChange,
  columns = [],
  data = [],
  itemsPerPage = 5,
  renderRow,
  emptyMessage = 'No se encontraron registros que coincidan.'
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Lógica de paginación
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (value) => {
    onSearchChange(value);
    setCurrentPage(1); // Reiniciar a la primera página cuando busca
  };

  const handleCategorySelect = (catId) => {
    onCategoryChange(catId);
    setCurrentPage(1);
  };

  return (
    <div className="datatable-card">
      {/* Header del Card */}
      <div className="datatable-header">
        <div className="datatable-title-box">
          {icon && <div className="datatable-icon-circle">{icon}</div>}
          <h2>{title}</h2>
        </div>

        {actionButtonText && (
          <button className="btn-datatable-primary" onClick={onActionClick}>
            <PlusIcon width={18} height={18} />
            {actionButtonText}
          </button>
        )}
      </div>

      <div className="datatable-filters-row">
  <div className="datatable-search-box">
    <span className="search-icon-wrapper">
      <SearchIcon width={18} height={18} color="#64748b" />
    </span>
    <input
      type="text"
      placeholder={searchPlaceholder}
      value={searchTerm}
      onChange={(e) => handleSearch(e.target.value)}
    />
    {searchTerm && (
      <button className="btn-clear-search" onClick={() => handleSearch('')} title="Limpiar búsqueda">
        <ClearIcon width={16} height={16} />
      </button>
    )}
  </div>

  {categories.length > 0 && (
    <div className="datatable-pills-filter">
      {/* Filtros por categorías */}
    </div>
  )}
</div>

      {/* Estructura de Tabla */}
      <div className="datatable-responsive-wrapper">
        <table className="datatable-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={{ width: col.width, textAlign: col.align || 'left' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="datatable-empty-state">
                  <p>{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador Inferior */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

export default DataTable;