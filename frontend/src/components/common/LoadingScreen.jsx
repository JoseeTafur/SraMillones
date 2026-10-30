import React from 'react';
import './LoadingScreen.css';

export const LoadingScreen = ({ message = 'Cargando datos de La Jama...' }) => {
  return (
    <div className="global-loading-overlay">
      <div className="loading-content-box">
        <svg className="loading-spinner-svg" viewBox="25 25 50 50">
          <circle className="loading-spinner-circle" r="20" cy="50" cx="50"></circle>
        </svg>
        {message && <p className="loading-message-text">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingScreen;