import React, { useState, useMemo } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { EditIcon, HideIcon, SearchIcon, ClearIcon } from '../../components/common/Icons';
import './PreciosPage.css';

export const PreciosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Categorías base del menú del restaurante
  const CATEGORIAS_MENU = [
    { id: 'PLATOS FUERTES', nombre: 'Platos Fuertes' },
    { id: 'ENTRADAS', nombre: 'Entradas' },
    { id: 'MARISCOS', nombre: 'Mariscos' },
    { id: 'BEBIDAS', nombre: 'Bebidas' },
    { id: 'POSTRES', nombre: 'Postres' }
  ];

  // Estados para Modal de Edición Individual de Precio
  const [showEditModal, setShowEditModal] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [nuevoPrecio, setNuevoPrecio] = useState('');

  // Estados para Modal de Ajuste Masivo
  const [showAjusteMasivoModal, setShowAjusteMasivoModal] = useState(false);
  const [operacionMasiva, setOperacionMasiva] = useState('SUMAR'); // 'SUMAR', 'RESTAR', 'FIJO'
  const [valorAjuste, setValorAjuste] = useState('');
  const [filtroMasivoText, setFiltroMasivoText] = useState('');
  
  // FILTROS COMBINADOS PARA EL MODAL MASIVO
  const [insumoMasivoFilter, setInsumoMasivoFilter] = useState('TODOS');
  const [categoriaMasivaFilter, setCategoriaMasivaFilter] = useState('TODAS');
  
  const [selectedIds, setSelectedIds] = useState([]);

  // Estado para ConfirmDialog de Baja
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  // Lista simulada de productos
  const [productos, setProductos] = useState([
    { id: 1, nombre: 'Lomo saltado', categoria: 'PLATOS FUERTES', insumos: ['Carne', 'Arroz', 'Papa'], precio: 35.00, disponible: true, imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=80' },
    { id: 2, nombre: 'Causa Limeña', categoria: 'ENTRADAS', insumos: ['Pollo', 'Arroz', 'Papa'], precio: 20.00, disponible: true, imagen: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=150&auto=format&fit=crop&q=80' },
    { id: 3, nombre: 'Ají de Gallina', categoria: 'PLATOS FUERTES', insumos: ['Pollo', 'Arroz', 'Papa'], precio: 20.00, disponible: true, imagen: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&auto=format&fit=crop&q=80' },
    { id: 4, nombre: 'Ceviche de Pescado', categoria: 'MARISCOS', insumos: ['Pescado blanco', 'Papa'], precio: 30.00, disponible: true, imagen: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=150&auto=format&fit=crop&q=80' },
    { id: 5, nombre: 'Chicha Morada 1L', categoria: 'BEBIDAS', insumos: ['Maíz Morado', 'Piña'], precio: 12.00, disponible: true, imagen: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=150&auto=format&fit=crop&q=80' }
  ]);

  // Extraer automáticamente la lista de insumos únicos sin duplicados
  const listaInsumosUnicos = useMemo(() => {
    const setInsumos = new Set();
    productos.forEach(p => {
      if (Array.isArray(p.insumos)) {
        p.insumos.forEach(ins => setInsumos.add(ins));
      }
    });
    return Array.from(setInsumos);
  }, [productos]);

  // Columnas para DataTable principal
  const COLUMNAS_PRECIOS = [
    { header: 'IMAGEN', width: '85px' },
    { header: 'PRODUCTO' },
    { header: 'INSUMOS' },
    { header: 'PRECIO', width: '130px' },
    { header: 'ACCIONES', width: '120px', align: 'center' }
  ];

  // Filtrado de la tabla principal por texto
  const productosFiltrados = productos.filter(p => {
    const texto = searchTerm.toLowerCase();
    const coincideNombre = p.nombre.toLowerCase().includes(texto);
    const coincideInsumo = p.insumos.some(i => i.toLowerCase().includes(texto));
    return coincideNombre || coincideInsumo;
  });

  // Abrir Modal Edición Individual
  const handleAbrirEditar = (prod) => {
    setProductoEditar(prod);
    setNuevoPrecio(prod.precio.toFixed(2));
    setShowEditModal(true);
  };

  // Guardar Precio Individual
  const handleGuardarPrecioIndividual = (e) => {
    e.preventDefault();
    const precioNum = parseFloat(nuevoPrecio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setToast({ type: 'error', title: 'Precio Inválido', message: 'Ingrese un monto mayor a 0.' });
      return;
    }

    setProductos(prev => prev.map(p => p.id === productoEditar.id ? { ...p, precio: precioNum } : p));
    setToast({ type: 'info', title: 'Precio Actualizado', message: `El plato "${productoEditar.nombre}" ahora cuesta S/ ${precioNum.toFixed(2)}.` });
    setShowEditModal(false);
  };

  // Dar de baja plato
  const handleDarDeBaja = (id, nombre) => {
    setConfirmState({
      isOpen: true,
      title: `¿Dar de baja "${nombre}"?`,
      message: 'El plato pasará a estar inactivo, conservando todo el historial de ventas del restaurante.',
      type: 'warning',
      onConfirm: () => {
        setProductos(prev => prev.map(p => p.id === id ? { ...p, disponible: false } : p));
        setToast({ type: 'info', title: 'Plato Desactivado', message: `"${nombre}" fue dado de baja correctamente.` });
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- LÓGICA DEL MODAL MASIVO ---
  const handleAbrirAjusteMasivo = () => {
    setFiltroMasivoText('');
    setInsumoMasivoFilter('TODOS');
    setCategoriaMasivaFilter('TODAS');
    setValorAjuste('');
    setOperacionMasiva('SUMAR');
    setSelectedIds(productos.map(p => p.id)); // Todos marcados por defecto
    setShowAjusteMasivoModal(true);
  };

  // Lógica de filtrado combinado: Texto + Insumo + Categoría
  const productosMasivosVisibles = productos.filter(p => {
    const txt = filtroMasivoText.toLowerCase();
    const coincideTexto = p.nombre.toLowerCase().includes(txt) || p.insumos.some(i => i.toLowerCase().includes(txt));
    const coincideInsumo = insumoMasivoFilter === 'TODOS' || p.insumos.includes(insumoMasivoFilter);
    const coincideCat = categoriaMasivaFilter === 'TODAS' || p.categoria === categoriaMasivaFilter;

    return coincideTexto && coincideInsumo && coincideCat;
  });

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(productosMasivosVisibles.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // Simulación de precios proyectados en tiempo real
  const calcularPrecioProyectado = (precioActual) => {
    const val = parseFloat(valorAjuste);
    if (isNaN(val) || val <= 0) return precioActual;

    if (operacionMasiva === 'SUMAR') return precioActual + val;
    if (operacionMasiva === 'RESTAR') return Math.max(0, precioActual - val);
    if (operacionMasiva === 'FIJO') return val;
    return precioActual;
  };

  const handleAplicarAjusteMasivo = (e) => {
    e.preventDefault();
    const valor = parseFloat(valorAjuste);
    if (isNaN(valor) || valor <= 0) {
      setToast({ type: 'error', title: 'Valor no válido', message: 'Ingrese un monto numérico mayor a 0.' });
      return;
    }

    if (selectedIds.length === 0) {
      setToast({ type: 'error', title: 'Sin selección', message: 'Seleccione al menos un plato para aplicar el ajuste.' });
      return;
    }

    setProductos(prev => prev.map(p => {
      if (!selectedIds.includes(p.id)) return p;
      const nuevoCalculado = calcularPrecioProyectado(p.precio);
      return { ...p, precio: Math.round(nuevoCalculado * 100) / 100 };
    }));

    setToast({
      type: 'info',
      title: 'Ajuste Masivo Aplicado',
      message: `Se actualizó el precio de ${selectedIds.length} producto(s) correctamente.`
    });
    setShowAjusteMasivoModal(false);
  };

  return (
    <div className="precios-page-container">
      {/* Toast Flotante */}
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* DATATABLE UNIVERSAL DE PRECIOS */}
      <DataTable
        title="Lista de Precios del Menú"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        }
        actionButtonText="Ajuste Masivo"
        onActionClick={handleAbrirAjusteMasivo}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar plato o insumo..."
        columns={COLUMNAS_PRECIOS}
        data={productosFiltrados}
        itemsPerPage={5}
        emptyMessage="No se encontraron platos ni insumos coincidentes."
        renderRow={(prod) => (
          <tr key={prod.id} className={!prod.disponible ? 'tr-disabled' : ''}>
            <td><img src={prod.imagen} alt={prod.nombre} className="precio-img-thumb" /></td>
            <td><span className="precio-producto-nombre">{prod.nombre}</span></td>
            <td>
              <div className="insumos-pills-container">
                {prod.insumos.map((ins, i) => (
                  <span key={i} className="badge-insumo-pill">{ins}</span>
                ))}
              </div>
            </td>
            <td><span className="precio-monto-destacado">S/ {prod.precio.toFixed(2)}</span></td>
            <td>
              <div className="acciones-buttons-group">
                <button className="btn-action-icon edit" title="Editar precio" onClick={() => handleAbrirEditar(prod)}>
                  <EditIcon />
                </button>
                <button className="btn-action-icon delete" title="Dar de baja plato" onClick={() => handleDarDeBaja(prod.id, prod.nombre)}>
                  <HideIcon />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* MODAL 1: EDICIÓN INDIVIDUAL DE PRECIO */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={productoEditar ? `Editar Precio: ${productoEditar.nombre}` : 'Editar Precio'}
        maxWidth="460px"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        }
      >
        <form onSubmit={handleGuardarPrecioIndividual}>
          <div className="modal-body-custom compact">
            <div className="form-group-custom">
              <label className="label-senior">Nuevo Precio de Venta (S/)</label>
              <div className="price-input-wrapper large">
                <span className="currency-symbol">S/</span>
                <input
                  type="number"
                  step="0.50"
                  required
                  autoFocus
                  className="input-senior price-input"
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowEditModal(false)}>Cancelar</button>
            <button type="submit" className="btn-save-senior">Guardar Precio</button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: AJUSTE MASIVO CON FILTROS AGRUPADOS (INSUMOS + CATEGORÍAS) */}
      <Modal
        isOpen={showAjusteMasivoModal}
        onClose={() => setShowAjusteMasivoModal(false)}
        title="Ajuste Masivo de Precios"
        maxWidth="880px"
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        }
      >
        <form onSubmit={handleAplicarAjusteMasivo} className="form-masivo-wrapper">
          <div className="masivo-split-layout">
            
            {/* COLUMNA IZQUIERDA: CONFIGURACIÓN DE OPERACIÓN */}
            <div className="masivo-col-config">
              <div className="form-group-custom">
                <label className="label-senior">1. Operación a realizar:</label>
                <div className="operacion-buttons-vertical">
                  <button
                    type="button"
                    className={`btn-operacion-v ${operacionMasiva === 'SUMAR' ? 'active sumar' : ''}`}
                    onClick={() => setOperacionMasiva('SUMAR')}
                  >
                    <span className="op-v-icon">+</span>
                    <div className="op-v-text">
                      <strong>Sumar Monto</strong>
                      <small>Aumentar (+ S/)</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`btn-operacion-v ${operacionMasiva === 'RESTAR' ? 'active restar' : ''}`}
                    onClick={() => setOperacionMasiva('RESTAR')}
                  >
                    <span className="op-v-icon">-</span>
                    <div className="op-v-text">
                      <strong>Restar Monto</strong>
                      <small>Descuento (- S/)</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`btn-operacion-v ${operacionMasiva === 'FIJO' ? 'active fijo' : ''}`}
                    onClick={() => setOperacionMasiva('FIJO')}
                  >
                    <span className="op-v-icon">=</span>
                    <div className="op-v-text">
                      <strong>Precio Fijo</strong>
                      <small>Valor único</small>
                    </div>
                  </button>
                </div>
              </div>

              <div className="form-group-custom">
                <label className="label-senior">
                  2. {operacionMasiva === 'SUMAR' && 'Monto a Aumentar (S/)'}
                     {operacionMasiva === 'RESTAR' && 'Monto a Descontar (S/)'}
                     {operacionMasiva === 'FIJO' && 'Nuevo Precio Fijo (S/)'}
                </label>
                <div className="price-input-wrapper large">
                  <span className="currency-symbol">S/</span>
                  <input
                    type="number"
                    step="0.50"
                    required
                    placeholder="0.00"
                    className="input-senior price-input"
                    value={valorAjuste}
                    onChange={(e) => setValorAjuste(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: SELECCIÓN + FILTROS AGRUPADOS (INSUMO + CATEGORÍA) */}
            <div className="masivo-col-platos">
              <label className="label-senior">3. Seleccione los platos a modificar:</label>

              {/* BUSCADOR Y SECCIONES DE FILTROS AGRUPADAS */}
              <div className="masivo-filter-toolbar">
                <div className="datatable-search-box masivo-search-compact">
                  <span className="search-icon-wrapper">
                    <SearchIcon width={16} height={16} color="#64748b" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar plato o ingrediente..."
                    value={filtroMasivoText}
                    onChange={(e) => setFiltroMasivoText(e.target.value)}
                  />
                  {filtroMasivoText && (
                    <button type="button" className="btn-clear-search" onClick={() => setFiltroMasivoText('')}>
                      <ClearIcon width={14} height={14} />
                    </button>
                  )}
                </div>

                {/* FILTRO 1: POR INSUMO (PILLS DORADAS) */}
                <div className="filter-group-row">
                  <span className="filter-group-title">Insumo:</span>
                  <div className="pills-modal-compact-row">
                    <button
                      type="button"
                      className={`btn-filter-pill-sm ${insumoMasivoFilter === 'TODOS' ? 'active-insumo' : ''}`}
                      onClick={() => setInsumoMasivoFilter('TODOS')}
                    >
                      TODOS
                    </button>
                    {listaInsumosUnicos.map(insumo => (
                      <button
                        key={insumo}
                        type="button"
                        className={`btn-filter-pill-sm ${insumoMasivoFilter === insumo ? 'active-insumo' : ''}`}
                        onClick={() => setInsumoMasivoFilter(insumo)}
                      >
                        {insumo.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FILTRO 2: POR CATEGORÍA DEL MENÚ (PILLS GUINDA) */}
                <div className="filter-group-row">
                  <span className="filter-group-title">Categoría:</span>
                  <div className="pills-modal-compact-row">
                    <button
                      type="button"
                      className={`btn-filter-pill-sm ${categoriaMasivaFilter === 'TODAS' ? 'active-cat' : ''}`}
                      onClick={() => setCategoriaMasivaFilter('TODAS')}
                    >
                      TODAS
                    </button>
                    {CATEGORIAS_MENU.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`btn-filter-pill-sm ${categoriaMasivaFilter === cat.id ? 'active-cat' : ''}`}
                        onClick={() => setCategoriaMasivaFilter(cat.id)}
                      >
                        {cat.nombre.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* BARRA DE SELECCIÓN GENERAL Y CONTADOR */}
              <div className="masivo-select-bar">
                <label className="checkbox-senior-wrapper">
                  <input
                    type="checkbox"
                    checked={
                      productosMasivosVisibles.length > 0 &&
                      productosMasivosVisibles.every(p => selectedIds.includes(p.id))
                    }
                    onChange={handleToggleSelectAll}
                  />
                  <span>Marcar / Desmarcar Visibles</span>
                </label>
                <span className="selected-counter">
                  <strong>{selectedIds.length}</strong> seleccionados
                </span>
              </div>

              {/* CUADRÍCULA (GRID) DE TARJETAS CUADRADAS CON 1 SOLO SCROLLBAR */}
              <div className="masivo-grid-scroll-container">
                {productosMasivosVisibles.length === 0 ? (
                  <div className="masivo-empty-filter-state">
                    <p>No hay platos que coincidan con los filtros seleccionados.</p>
                  </div>
                ) : (
                  productosMasivosVisibles.map(p => {
                    const isSelected = selectedIds.includes(p.id);
                    const precioNuevoCalculado = calcularPrecioProyectado(p.precio);
                    const hayCambio = valorAjuste > 0 && isSelected;

                    return (
                      <div
                        key={p.id}
                        className={`grid-card-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleSelectOne(p.id)}
                      >
                        <div className="grid-card-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="checkbox-senior-item"
                          />
                        </div>

                        <img src={p.imagen} alt={p.nombre} className="grid-card-thumb" />

                        <div className="grid-card-info">
                          <span className="grid-card-title">{p.nombre}</span>
                          <span className="grid-card-insumos">{p.insumos.join(', ')}</span>
                        </div>

                        <div className="grid-card-precio-box">
                          {hayCambio ? (
                            <div className="grid-precio-live">
                              <span className="grid-precio-old">S/ {p.precio.toFixed(2)}</span>
                              <span className="grid-precio-new">➔ S/ {precioNuevoCalculado.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="grid-precio-base">S/ {p.precio.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* FOOTER DEL MODAL CON BOTONES SIEMPRE VISIBLES */}
          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowAjusteMasivoModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Aplicar Cambios ({selectedIds.length})
            </button>
          </div>
        </form>
      </Modal>

      {/* DIÁLOGO CONFIRMACIÓN */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText="Sí, Dar de Baja"
        cancelText="Conservar Activo"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default PreciosPage;