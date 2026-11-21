import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificacionService } from '../../services/notificacionService';
import './NotificacionesBell.css';

const formatearTiempoRelativo = (fechaIso) => {
  if (!fechaIso) return 'Ahora';
  const fecha = new Date(fechaIso);
  const diffMin = Math.floor((Date.now() - fecha.getTime()) / 60000);
  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

export const NotificacionesBell = () => {
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const contenedorRef = useRef(null);
  const navigate = useNavigate();

  const cargarNotificaciones = useCallback(async () => {
    try {
      const res = await notificacionService.listarNoLeidas();
      if (res && res.success) {
        setNotificaciones(res.data || []);
      }
    } catch (error) {
      // Silencioso en polling para no interrumpir la operación
    }
  }, []);

  // Carga inicial + polling cada 15 segundos
  useEffect(() => {
    cargarNotificaciones();
    const intervalo = setInterval(cargarNotificaciones, 15000);
    return () => clearInterval(intervalo);
  }, [cargarNotificaciones]);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const handleAbrirNotificacion = async (notif) => {
    try {
      await notificacionService.marcarLeidoIndividual(notif.id);
      setNotificaciones(prev => prev.filter(n => n.id !== notif.id));
    } catch (error) {
      // Continuar navegación aunque falle el archivado
    }
    setAbierto(false);
    if (notif.rutaDestino) {
      navigate(notif.rutaDestino);
    }
  };

  const handleDespejarTodo = async () => {
    if (notificaciones.length === 0 || cargando) return;
    setCargando(true);
    try {
      await notificacionService.marcarTodoComoLeido();
      setNotificaciones([]);
    } finally {
      setCargando(false);
    }
  };

  const totalPendientes = notificaciones.length;

  return (
    <div className="notif-bell-wrapper" ref={contenedorRef}>
      <button
        type="button"
        className={`btn-icon-nav ${abierto ? 'active' : ''}`}
        title="Notificaciones del sistema"
        onClick={() => {
          const nuevoEstado = !abierto;
          setAbierto(nuevoEstado);
          if (nuevoEstado) cargarNotificaciones();
        }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {totalPendientes > 0 && (
          <span className="notif-count-badge">
            {totalPendientes > 9 ? '9+' : totalPendientes}
          </span>
        )}
      </button>

      {abierto && (
        <div className="notif-popover-panel">
          <div className="notif-popover-header">
            <div className="notif-header-title">
              <span>Notificaciones</span>
              {totalPendientes > 0 && (
                <span className="notif-header-pill">{totalPendientes}</span>
              )}
            </div>
            {totalPendientes > 0 && (
              <button
                type="button"
                className="notif-clear-btn"
                onClick={handleDespejarTodo}
                disabled={cargando}
              >
                {cargando ? 'Limpiando...' : 'Despejar todo'}
              </button>
            )}
          </div>

          <div className="notif-popover-body">
            {totalPendientes === 0 ? (
              <div className="notif-empty-state">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p>No tienes alertas pendientes</p>
              </div>
            ) : (
              notificaciones.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  className="notif-item-card"
                  onClick={() => handleAbrirNotificacion(notif)}
                >
                  <span className={`notif-type-dot ${(notif.tipo || '').toLowerCase()}`}></span>
                  <div className="notif-item-content">
                    <p className="notif-item-msg">{notif.mensaje}</p>
                    <div className="notif-item-meta">
                      <span className="notif-item-tag">{notif.tipo || 'ALERTA'}</span>
                      <span className="notif-item-time">
                        {formatearTiempoRelativo(notif.fechaCreacion)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificacionesBell;