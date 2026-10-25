import React, { useState, useEffect } from 'react';
import productoService from '../../services/productoService'; // ↵ Importamos tu nuevo servicio de API
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
  
  // Estados Dinámicos enlazados al Backend
  const [productos, setProductos] = useState([]); //
  const [categoriasMenu, setCategoriasMenu] = useState([]); // ↵ Cargado desde Base de Datos dinámicamente
  const [archivoImagen, setArchivoImagen] = useState(null); // ↵ Almacena temporalmente el archivo binario seleccionado

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Sí, Confirmar',
    cancelText: 'Cancelar',
    onConfirm: () => {}
  });

  const COLUMNAS_PRODUCTOS = [
    { header: 'IMAGEN', width: '85px' },
    { header: 'PRODUCTO' },
    { header: 'CATEGORÍA', width: '180px' },
    { header: 'PRECIO', width: '130px' },
    { header: 'ESTADO EN CARTA', width: '160px' },
    { header: 'ACCIONES', width: '130px', align: 'center' }
  ];

  // Formulario del Modal alineado al DTO del backend
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoriaId: '', //
    precio: '',
    imagen: ''
  });

  // 🔄 Cargar catálogo inicial desde el Backend al montar el componente
  const cargarDatosCatalogo = async () => {
    try {
      const data = await productoService.obtenerCatalogoInicial();
      setProductos(data.productos || []);
      setCategoriasMenu(data.categorias || []);
    } catch (error) {
      mostrarToast('error', 'Error de red', 'No se pudieron recuperar los productos del servidor.');
    }
  };

  useEffect(() => {
    cargarDatosCatalogo();
  }, []);

  const mostrarToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  // 🔄 Alternar visibilidad rápida (Switch interactivo comunicado al Backend)
  const toggleDisponible = async (id, nombreActual, estadoActual) => {
    try {
      const nuevoEstadoNum = estadoActual === 1 ? 2 : 1; // Supongamos: 1 = Activo/Visible, 2 = Oculto
      await productoService.cambiarEstado(id, nuevoEstadoNum);
      
      setProductos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstadoNum } : p));
      mostrarToast('info', 'Estado actualizado', `[${nombreActual}] ahora está ${nuevoEstadoNum === 1 ? 'VISIBLE' : 'OCULTO'} en la carta.`);
    } catch (error) {
      mostrarToast('error', 'Error al actualizar', 'No se pudo guardar el cambio de estado en el servidor.');
    }
  };

  // Abrir modal para crear
  const handleAbrirNuevo = () => {
    setProductoEditar(null);
    setArchivoImagen(null); // Limpiamos selección de imágenes previas
    setFormData({
      nombre: '',
      descripcion: '',
      categoriaId: categoriasMenu[0]?.id || '', // Selecciona la primera de la BD por defecto
      precio: '',
      imagen: ''
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleAbrirEditar = (prod) => {
    setProductoEditar(prod);
    setArchivoImagen(null);
    setFormData({
      id: prod.id,
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      categoriaId: prod.categoria?.id || '', // Mapeamos el id de la relación del modelo
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

  const ejecutarBajaLogica = async (id, nombre) => {
    try {
      await productoService.eliminarLogico(id);
      setProductos(prev => prev.map(p => p.id === id ? { ...p, estado: 0 } : p)); // Estado 0 es inactivo definitivo
      mostrarToast('info', 'Plato Desactivado', `"${nombre}" ha sido dado de baja correctamente.`);
    } catch (error) {
      mostrarToast('error', 'Error de baja', 'Hubo un inconveniente al remover el producto de la carta.');
    } finally {
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Guardar (Nuevo o Editar con envío asíncrono Multipart)
  const handleGuardarProducto = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.precio) {
      mostrarToast('error', 'Campos incompletos', 'Por favor escriba el nombre y el precio del plato.');
      return;
    }

    try {
      const productoPayload = {
        ...formData,
        precio: parseFloat(formData.precio)
      };

      const productoGuardado = await productoService.guardarOEditar(productoPayload, archivoImagen);

      if (productoEditar) {
        setProductos(prev => prev.map(p => p.id === productoGuardado.id ? productoGuardado : p));
        mostrarToast('info', 'Plato actualizado', `Se actualizaron los datos de "${productoGuardado.nombre}".`);
      } else {
        setProductos(prev => [productoGuardado, ...prev]);
        mostrarToast('info', '¡Plato Registrado!', `"${productoGuardado.nombre}" agregado con éxito.`);
      }
      setShowModal(false);
    } catch (error) {
      const msgError = error.response?.data?.error || 'Verifica los campos y el tamaño de la imagen (Máx 2MB).';
      mostrarToast('error', 'Error al procesar registro', msgError);
    }
  };

  // Filtrado reactivo en memoria combinando backend y búsquedas
  const productosFiltrados = productos.filter(p => {
  if (p.estado === 0) return false; // Omitir eliminados lógicos

  const nombrePlato = (p.nombre || '').toLowerCase();
  const nombreCat = (p.categoria?.nombre || '').toLowerCase();
  const busqueda = searchTerm.toLowerCase();

  const coincideTexto = nombrePlato.includes(busqueda) || nombreCat.includes(busqueda);
  const coincideCat = selectedCategoria === 'TODAS' || String(p.categoria?.id) === String(selectedCategoria);
  
  return coincideTexto && coincideCat;
});

  const getCategoriaStyle = (categoriaObj) => {
  // Si el producto no tiene categoría asignada en la BD
  if (!categoriaObj) {
    return { color: '#475569', backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' };
  }
  
  // Estilo elegante, neutro y automático para CUALQUIER categoría de LA-JAMA
  return { 
    color: '#1e293b', 
    backgroundColor: '#f1f5f9', 
    borderColor: '#e2e8f0',
    border: '1px solid'
  };
};

  return (
    <div className="productos-page-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      <DataTable
        title="Lista de Productos del Menú"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        }
        actionButtonText="Nuevo Registro"
        onActionClick={handleAbrirNuevo}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar plato o categoría..."
        categories={categoriasMenu} //
        selectedCategory={selectedCategoria}
        onCategoryChange={setSelectedCategoria}
        columns={COLUMNAS_PRODUCTOS}
        data={productosFiltrados}
        itemsPerPage={5}
        emptyMessage="No se encontraron platos que coincidan con el filtro."
        renderRow={(prod) => {
          const isVisible = prod.estado === 1; // 1 = Visible, 2 = Oculto
          return (
            <tr key={prod.id} className={!isVisible ? 'tr-disabled' : ''}>
              <td>
                <img
                  src={prod.imagen || 'https://placeholder.com'}
                  alt={prod.nombre}
                  className="producto-img-thumb"
                  onError={(e) => { e.target.src = 'https://placeholder.com'; }}
                />
              </td>
              <td>
                <div className="producto-info">
                  <span className="producto-nombre">{prod.nombre}</span>
                  <span className="producto-descripcion">{prod.descripcion || 'Sin descripción'}</span>
                </div>
              </td>
              <td>
  <span className="badge-categoria-dynamic" style={getCategoriaStyle(prod.categoria)}>
    {prod.categoria?.nombre || 'Sin Categoría'}
  </span>
</td>
              <td>
                <span className="producto-precio">S/ {prod.precio.toFixed(2)}</span>
              </td>
              <td>
                <div className="status-switch-wrapper">
                  <label className="switch-toggle" title="Clic para ocultar o mostrar en la carta">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => toggleDisponible(prod.id, prod.nombre, prod.estado)}
                    />
                                        <span className="slider round"></span>
                  </label>
                  <span className={`switch-label-status ${isVisible ? 'visible' : 'oculto'}`}>
                    {isVisible ? 'Visible' : 'Oculto'}
                  </span>
                </div>
              </td>

              {/* Acciones */}
              <td>
                <div className="acciones-buttons-group">
                  <button className="btn-action-icon edit" title="Editar plato" onClick={() => handleAbrirEditar(prod)}>
                    <EditIcon />
                  </button>
                  <button className="btn-action-icon delete" title="Dar de baja" onClick={() => handleEliminar(prod.id, prod.nombre)}>
                    <HideIcon />
                  </button>
                </div>
              </td>
            </tr>
          );
        }}
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
                type="text" required className="input-senior"
                placeholder="Escriba el nombre (ej. Arroz con Mariscos)"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            {/* 2. Categorías Dinámicas */}
            <div className="form-group-custom">
              <label className="label-senior">2. Seleccione la Categoría *</label>
              <div className="category-selector-grid">
                {categoriasMenu.map((cat) => {
                  const isSelected = String(formData.categoriaId) === String(cat.id);
                  return (
                    <button
                      key={cat.id} type="button"
                      className={`cat-option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, categoriaId: cat.id })}
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
                  type="number" step="0.50" required className="input-senior price-input"
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
                rows="2" className="input-senior textarea-senior"
                placeholder="Detalles sencillos o ingredientes..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              ></textarea>
            </div>

            {/* 5. Subida de Imagen Animada */}
            <ImageUploader
              label="5. Foto / Imagen del Plato (Opcional)"
              value={formData.imagen}
              onChange={(archivoBinario) => {
                setArchivoImagen(archivoBinario);
                if (archivoBinario) {
                  setFormData({ ...formData, imagen: URL.createObjectURL(archivoBinario) });
                }
              }}
            />
          </div>

          {/* Botones de acción del Modal */}
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

