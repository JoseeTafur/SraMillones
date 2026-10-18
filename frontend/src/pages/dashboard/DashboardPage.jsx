import React from 'react';
import './DashboardPage.css';

export const DashboardPage = () => {
  // Datos simulados con íconos SVG nativos en lugar de emojis
  const kpis = [
    {
      title: 'Ingresos de Hoy',
      value: 'S/ 1,480.50',
      sub: '+12% vs ayer',
      color: 'gold',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    {
      title: 'Comandas Activas',
      value: '8 Pedidos',
      sub: '5 en cocina, 3 listos',
      color: 'red',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      title: 'Mesas Ocupadas',
      value: '12 / 20',
      sub: '60% Capacidad',
      color: 'burgundy',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
        </svg>
      )
    },
    {
      title: 'Personal de Turno',
      value: '7 Empleados',
      sub: '3 Meseros, 2 Cocina, 2 Caja',
      color: 'dark',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    }
  ];

  const topPlatos = [
    { nombre: 'Lomo Saltado Criollo', cantidad: 28, porcentaje: '85%' },
    { nombre: 'Ceviche Mixto de la Casa', cantidad: 22, porcentaje: '70%' },
    { nombre: 'Arroz con Mariscos', cantidad: 18, porcentaje: '55%' },
    { nombre: 'Chicha Morada 1L', cantidad: 35, porcentaje: '95%' }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-container">
        {/* Banner Bienvenida */}
        <div className="welcome-banner">
          <div className="banner-text">
            <h2>¡Sazón y Eficiencia en Cocina!</h2>
            <p>Resumen operacional del restaurante en tiempo real.</p>
          </div>
          <div className="banner-tag">LA JAMA / SRA. MILLONES</div>
        </div>

        {/* Tarjetas KPI */}
        <div className="kpi-grid">
          {kpis.map((kpi, idx) => (
            <div key={idx} className={`kpi-card ${kpi.color}`}>
              <div className="kpi-icon-box">{kpi.icon}</div>
              <div className="kpi-details">
                <span className="kpi-title">{kpi.title}</span>
                <h3 className="kpi-value">{kpi.value}</h3>
                <span className="kpi-sub">{kpi.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sección Gráficos y Tablas */}
        <div className="dashboard-grid-content">
          {/* Ocupación de Mesas */}
          <div className="dash-card">
            <h3 className="dash-card-title">Estado del Salón</h3>
            <div className="donut-chart-wrapper">
              <svg viewBox="0 0 36 36" className="circular-chart burgundy">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray="60, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">60%</text>
              </svg>
              <div className="chart-legend">
                <div className="legend-item"><span className="dot occupied"></span> 12 Ocupadas</div>
                <div className="legend-item"><span className="dot free"></span> 8 Libres</div>
              </div>
            </div>
          </div>

          {/* Platos Más Pedidos */}
          <div className="dash-card">
            <h3 className="dash-card-title">Platos Más Vendidos Hoy</h3>
            <div className="top-dishes-list">
              {topPlatos.map((plato, index) => (
                <div key={index} className="dish-row">
                  <div className="dish-info">
                    <span className="dish-name">{plato.nombre}</span>
                    <span className="dish-count">{plato.cantidad} ord.</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: plato.porcentaje }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;