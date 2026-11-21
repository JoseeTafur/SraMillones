import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { EyeIcon } from '../../components/common/Icons';
import { auditoriaService } from '../../services/auditoriaService';
import './AuditoriaPage.css';

const formatearFechaHora = (fechaIso) => {
  if (!fechaIso) return '—';
  const fecha = new Date(fechaIso);
  return fecha.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const AuditoriaPage = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroModulo, setFiltroModulo] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [eventoDetalle, setEventoDetalle] = useState(null);

  const COLUMNAS_AUDITORIA = [
    { header: 'FECHA / HORA', width: '175px' },
    { header: 'USUARIO / ROL', width: '195px' },
    { header: 'MÓDULO', width: '145px' },
    { header: 'ACCIÓN', width: '155px' },
    { header: 'DESCRIPCIÓN' },
    { header: 'DETALLE', width: '85px', align: 'center' }
  ];

  const cargarAuditoria = async () => {
    setLoading(true);
    try {
      const res = await auditoriaService.listarRecientes();
      if (res && res.success) {
        setEventos(res.data || []);
      }
    } catch (error) {
      setToast({
        type: 'error',
        title: 'Error de Auditoría',
        message: error.response?.data?.message || 'No se pudo cargar la bitácora del sistema.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAuditoria();
  }, []);

  const modulosDisponibles = useMemo(() => {
    const setMod = new Set(eventos.map(e => e.modulo).filter(Boolean));
    return ['TODOS', ...Array.from(setMod)];
  }, [eventos]);

  const eventosFiltrados = useMemo(() => {
    return eventos.filter(ev => {
      const coincideModulo = filtroModulo === 'TODOS' || ev.modulo === filtroModulo;
      const txt = searchTerm.trim().toLowerCase();
      const coincideTexto =
        !txt ||
        (ev.usuarioNombre || '').toLowerCase().includes(txt) ||
        (ev.rolUsuario || '').toLowerCase().includes(txt) ||
        (ev.accion || '').toLowerCase().includes(txt) ||
        (ev.descripcion || '').toLowerCase().includes(txt) ||
        String(ev.idEntidad || '').includes(txt);
      return coincideModulo && coincideTexto;
    });
  }, [eventos, filtroModulo, searchTerm]);

  return (
    <div className="auditoria-container">
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

      {/* Filtros por Módulo */}
      <div className="auditoria-filtros-bar">
        {modulosDisponibles.map(mod => (
          <button
            key={mod}
            type="button"
            onClick={() => setFiltroModulo(mod)}
            className={`auditoria-filtro-btn ${filtroModulo === mod ? 'active' : ''}`}
          >
            {mod.replace('_', ' ')}
          </button>
        ))}
      </div>

      <DataTable
        title="Bitácora de Auditoría del Sistema"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        }
        actionButtonText={loading ? 'Actualizando...' : 'Actualizar Bitácora'}
        onActionClick={cargarAuditoria}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por usuario, acción, ID o descripción..."
        columns={COLUMNAS_AUDITORIA}
        data={eventosFiltrados}
        itemsPerPage={8}
        emptyMessage={
          loading ? 'Cargando registros de auditoría...' : 'No hay eventos registrados con este filtro.'
        }
        renderRow={(ev) => (
          <tr key={ev.id}>
            <td className="auditoria-fecha">{formatearFechaHora(ev.fechaHora)}</td>
            <td>
              <div className="auditoria-usuario">{ev.usuarioNombre || 'SISTEMA'}</div>
              <span className="auditoria-rol-tag">{ev.rolUsuario || '—'}</span>
            </td>
            <td>
              <span className="auditoria-modulo-pill">{ev.modulo || 'GENERAL'}</span>
            </td>
            <td>
              <span className={`auditoria-accion-pill ${(ev.accion || '').toLowerCase()}`}>
                {ev.accion || 'EVENTO'}
              </span>
            </td>
            <td className="auditoria-desc">{ev.descripcion}</td>
            <td style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="btn-action-icon view"
                title="Ver cambios (Antes / Después)"
                onClick={() => setEventoDetalle(ev)}
              >
                <EyeIcon />
              </button>
            </td>
          </tr>
        )}
      />

      {/* Modal de Inspección Antes / Después */}
      <Modal
        isOpen={Boolean(eventoDetalle)}
        onClose={() => setEventoDetalle(null)}
        title={eventoDetalle ? `Evento de Auditoría #${eventoDetalle.id}` : 'Detalle de Auditoría'}
        maxWidth="560px"
        icon={<EyeIcon />}
      >
        {eventoDetalle && (
          <>
            <div className="modal-body-custom compact">
              <div className="auditoria-meta-grid">
                <div>
                  <span className="detalle-label">Responsable:</span>{' '}
                  <strong>{eventoDetalle.usuarioNombre}</strong> ({eventoDetalle.rolUsuario})
                </div>
                <div>
                  <span className="detalle-label">Fecha:</span>{' '}
                  <strong>{formatearFechaHora(eventoDetalle.fechaHora)}</strong>
                </div>
                <div>
                  <span className="detalle-label">Entidad:</span>{' '}
                  <strong>
                    {eventoDetalle.entidad || '—'}
                    {eventoDetalle.idEntidad ? ` #${eventoDetalle.idEntidad}` : ''}
                  </strong>
                </div>
                <div>
                  <span className="detalle-label">Acción:</span>{' '}
                  <strong>{eventoDetalle.accion}</strong>
                </div>
              </div>

              <div className="auditoria-box">
                <div className="auditoria-box-label">Descripción</div>
                <p className="auditoria-box-text">{eventoDetalle.descripcion}</p>
              </div>

              <div className="auditoria-box">
                <div className="auditoria-box-label">Estado Anterior</div>
                <pre className="auditoria-pre">{eventoDetalle.datosAntes || 'Sin registro previo'}</pre>
              </div>

              <div className="auditoria-box">
                <div className="auditoria-box-label">Estado Nuevo</div>
                <pre className="auditoria-pre">{eventoDetalle.datosDespues || 'Sin datos posteriores'}</pre>
              </div>
            </div>

            <div className="modal-footer-custom elder-footer compact">
              <button
                type="button"
                className="btn-save-senior"
                onClick={() => setEventoDetalle(null)}
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AuditoriaPage;