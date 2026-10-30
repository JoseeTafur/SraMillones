import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CajaTurnoView from './CajaTurnoView';
import CajaGeneralView from './CajaGeneralView';
import './CajaPage.css';

export const CajaPage = ({ tabInicial }) => {
  const location = useLocation();
  const [subTab, setSubTab] = useState('TURNO');

  // Sincronizar subtab dinámicamente según la ruta
  useEffect(() => {
    if (location.pathname.includes('/admin/caja-general')) {
      setSubTab('GENERAL');
    } else if (location.pathname.includes('/admin/caja')) {
      setSubTab('TURNO');
    } else if (tabInicial) {
      setSubTab(tabInicial);
    }
  }, [location.pathname, tabInicial]);

  return (
    <div className="caja-page-container">
      {subTab === 'TURNO' && <CajaTurnoView />}

      {subTab === 'GENERAL' && <CajaGeneralView />}
    </div>
  );
};

export default CajaPage;