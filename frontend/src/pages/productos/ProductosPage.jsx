import React, { useState } from 'react';
import Toast from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import ImageUploader from '../../components/common/ImageUploader';
import { EditIcon, HideIcon } from '../../components/common/Icons';
import './ProductosPage.css';

export const ProductosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('TODAS');
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  // Estado para el cuadro modal de confirmación
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Sí, Confirmar',
    cancelText: 'Cancelar',
    onConfirm: () => {}
  });

  // Lista de categorías reales del restaurante
  const CATEGORIAS_MENU = [
    { id: 'PLATOS FUERTES', nombre: 'Platos Fuertes', color: '#881337', bg: '#ffe4e6' },
    { id: 'ENTRADAS', nombre: 'Entradas', color: '#d97706', bg: '#fef3c7' },
    { id: 'MARISCOS', nombre: 'Mariscos', color: '#0284c7', bg: '#e0f2fe' },
    { id: 'BEBIDAS', nombre: 'Bebidas', color: '#16a34a', bg: '#dcfce7' },
    { id: 'POSTRES', nombre: 'Postres', color: '#9333ea', bg: '#f3e8ff' }
  ];

  // Columnas para el componente DataTable
  const COLUMNAS_PRODUCTOS = [
    { header: 'IMAGEN', width: '85px' },
    { header: 'PRODUCTO' },
    { header: 'CATEGORÍA', width: '180px' },
    { header: 'PRECIO', width: '130px' },
    { header: 'ESTADO EN CARTA', width: '160px' },
    { header: 'ACCIONES', width: '130px', align: 'center' }
  ];

  // Lista simulada de productos
  const [productos, setProductos] = useState([
    {
      id: 1,
      nombre: 'Lomo saltado',
      descripcion: 'Jugosos trozos de lomo con cebolla, tomate y papas fritas.',
      categoria: 'PLATOS FUERTES',
      precio: 35.00,
      disponible: true,
      imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      nombre: 'Causa Limeña',
      descripcion: 'Papa amarilla prensada con ají amarillo y relleno de pollo.',
      categoria: 'ENTRADAS',
      precio: 20.00,
      disponible: true,
      imagen: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 3,
      nombre: 'Ají de Gallina',
      descripcion: 'Pechuga deshilachada en crema de ají amarillo con arroz.',
      categoria: 'PLATOS FUERTES',
      precio: 20.00,
      disponible: true,
      imagen: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 4,
      nombre: 'Ceviche Mixto de la Casa',
      descripcion: 'Pesca del día y mariscos marinados en limón con choclo y camote.',
      categoria: 'MARISCOS',
      precio: 32.00,
      disponible: true,
      imagen: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 5,
      nombre: 'Chicha Morada 1L',
      descripcion: 'Refresco natural de maíz morado con piña, manzana y canela.',
      categoria: 'BEBIDAS',
      precio: 12.00,
      disponible: true,
      imagen: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=150&auto=format&fit=crop&q=80'
    }
  ]);

  // Formulario del Modal
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'PLATOS FUERTES',
    precio: '',
    imagen: ''
  });

  // Alternar visibilidad rápida (Switch)
  const toggleDisponible = (id) => {
    setProductos(productos.map(p => {
      if (p.id === id) {
        const nuevoEstado = !p.disponible;
        setToast({
          type: 'info',
          title: 'Estado actualizado',
          message: `[${p.nombre}] ahora está ${nuevoEstado ? 'VISIBLE' : 'OCULTO'} en la carta.`
        });
        return { ...p, disponible: nuevoEstado };
      }
      return p;
    }));
  };

  // Abrir modal para crear
  const handleAbrirNuevo = () => {
    setProductoEditar(null);
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: 'PLATOS FUERTES',
      precio: '',
      imagen: ''
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleAbrirEditar = (prod) => {
    setProductoEditar(prod);
    setFormData({
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      categoria: prod.categoria,
      precio: prod.precio,
      imagen: prod.imagen
    });
    setShowModal(true);
  };

  // Solicitar dar de baja (Soft Delete)
  const handleEliminar = (id, nombre) => {
    setConfirmState({
      isOpen: true,
      title: `¿Dar de baja "${nombre}"?`,
      message: 'El plato se ocultará de la carta y comandera, pero se conservará en el historial de ventas del restaurante.',
      type: 'warning',
      confirmText: 'Sí, Dar de Baja',
      cancelText: 'Conservar Activo',
      onConfirm: () => ejecutarBajaLogica(id, nombre)
    });
  };

  const ejecutarBajaLogica = (id, nombre) => {
    setProductos(prev => prev.map(p => p.id === id ? { ...p, disponible: false } : p));
    setToast({
      type: 'info',
      title: 'Plato Desactivado',
      message: `"${nombre}" ha sido dado de baja correctamente.`
    });
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  // Guardar (Nuevo o Editar)
  const handleGuardarProducto = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.precio) {
      setToast({
        type: 'error',
        title: 'Campos incompletos',
        message: 'Por favor escriba el nombre y el precio del plato.'
      });
      return;
    }

    if (productoEditar) {
      setProductos(productos.map(p => p.id === productoEditar.id ? { ...p, ...formData, precio: parseFloat(formData.precio) } : p));
      setToast({
        type: 'info',
        title: 'Plato actualizado',
        message: `Se actualizaron los datos de "${formData.nombre}".`
      });
    } else {
      const nuevo = {
        id: Date.now(),
        ...formData,
        precio: parseFloat(formData.precio),
        disponible: true,
        imagen: formData.imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80'
      };
      setProductos([nuevo, ...productos]);
      setToast({
        type: 'info',
        title: '¡Plato Registrado!',
        message: `"${formData.nombre}" agregado con éxito.`
      });
    }

    setShowModal(false);
  };

  // Filtrado de productos por texto y categoría
  const productosFiltrados = productos.filter(p => {
    const coincideTexto = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCat = selectedCategoria === 'TODAS' || p.categoria === selectedCategoria;
    return coincideTexto && coincideCat;
  });

  const getCategoriaStyle = (catId) => {
    const cat = CATEGORIAS_MENU.find(c => c.id === catId);
    return cat ? { color: cat.color, backgroundColor: cat.bg, borderColor: cat.color } : { color: '#475569', backgroundColor: '#f1f5f9' };
  };

  return (
    <div className="productos-page-container">
      {/* Toast Flotante */}
      {toast && (
        <div className="toast-floating-container">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* DATATABLE UNIVERSAL (Con Búsqueda, Filtros y Paginación) */}
      <DataTable
        title="Lista de Productos del Menú"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        }
        actionButtonText="Nuevo Registro"
        onActionClick={handleAbrirNuevo}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar plato o categoría..."
        categories={CATEGORIAS_MENU}
        selectedCategory={selectedCategoria}
        onCategoryChange={setSelectedCategoria}
        columns={COLUMNAS_PRODUCTOS}
        data={productosFiltrados}
        itemsPerPage={5}
        emptyMessage="No se encontraron platos que coincidan con el filtro."
        renderRow={(prod) => (
          <tr key={prod.id} className={!prod.disponible ? 'tr-disabled' : ''}>
            {/* Imagen */}
            <td>
              <img
                src={prod.imagen}
                alt={prod.nombre}
                className="producto-img-thumb"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=Plato'; }}
              />
            </td>

            {/* Producto */}
            <td>
              <div className="producto-info">
                <span className="producto-nombre">{prod.nombre}</span>
                <span className="producto-descripcion">{prod.descripcion || 'Sin descripción'}</span>
              </div>
            </td>

            {/* Categoría Badge */}
            <td>
              <span className="badge-categoria-dynamic" style={getCategoriaStyle(prod.categoria)}>
                {prod.categoria}
              </span>
            </td>

            {/* Precio */}
            <td>
              <span className="producto-precio">S/ {prod.precio.toFixed(2)}</span>
            </td>

            {/* Switch Estado */}
            <td>
              <div className="status-switch-wrapper">
                <label className="switch-toggle" title="Clic para ocultar o mostrar en la carta">
                  <input
                    type="checkbox"
                    checked={prod.disponible}
                    onChange={() => toggleDisponible(prod.id)}
                  />
                  <span className="slider round"></span>
                </label>
                <span className={`switch-label-status ${prod.disponible ? 'visible' : 'oculto'}`}>
                  {prod.disponible ? 'Visible' : 'Oculto'}
                </span>
              </div>
            </td>

            {/* Acciones */}
            <td>
              <div className="acciones-buttons-group">
                <button
                  className="btn-action-icon edit"
                  title="Editar plato"
                  onClick={() => handleAbrirEditar(prod)}
                >
                  <EditIcon />
                </button>

                <button
                  className="btn-action-icon delete"
                  title="Dar de baja / Ocultar plato"
                  onClick={() => handleEliminar(prod.id, prod.nombre)}
                >
                  <HideIcon />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* MODAL UNIVERSAL PARA REGISTRO / EDICIÓN */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={productoEditar ? 'Editar Plato del Menú' : 'Nuevo Registro de Producto'}
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        }
      >
        <form onSubmit={handleGuardarProducto}>
          <div className="modal-body-custom compact">
            {/* 1. Nombre */}
            <div className="form-group-custom">
              <label className="label-senior">1. Nombre del Plato *</label>
              <input
                type="text"
                required
                className="input-senior"
                placeholder="Escriba el nombre (ej. Arroz con Mariscos)"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            {/* 2. Categorías */}
            <div className="form-group-custom">
              <label className="label-senior">2. Seleccione la Categoría *</label>
              <div className="category-selector-grid">
                {CATEGORIAS_MENU.map((cat) => {
                  const isSelected = formData.categoria === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cat-option-btn ${isSelected ? 'selected' : ''}`}
                      style={isSelected ? { backgroundColor: cat.color, borderColor: cat.color, color: '#ffffff' } : {}}
                      onClick={() => setFormData({ ...formData, categoria: cat.id })}
                    >
                      <span className="cat-btn-title">{cat.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Precio */}
            <div className="form-group-custom">
              <label className="label-senior">3. Precio de Venta (S/) *</label>
              <div className="price-input-wrapper">
                <span className="currency-symbol">S/</span>
                <input
                  type="number"
                  step="0.50"
                  required
                  className="input-senior price-input"
                  placeholder="0.00"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                />
              </div>
            </div>

            {/* 4. Descripción */}
            <div className="form-group-custom">
              <label className="label-senior">4. Descripción para el cliente (Opcional)</label>
              <textarea
                rows="2"
                className="input-senior textarea-senior"
                placeholder="Detalles sencillos o ingredientes..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              ></textarea>
            </div>

            {/* 5. Subida de Imagen Animada (ImageUploader Uiverse) */}
            <ImageUploader
              label="5. Foto / Imagen del Plato (Opcional)"
              value={formData.imagen}
              onChange={(nuevaUrl) => setFormData({ ...formData, imagen: nuevaUrl })}
            />
          </div>

          {/* Botones de acción */}
          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {productoEditar ? 'Guardar Cambios' : 'Registrar Producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DIÁLOGO UNIVERSAL DE CONFIRMACIÓN */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ProductosPage;