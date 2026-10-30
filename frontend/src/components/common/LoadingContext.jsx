import React, { createContext, useContext, useState } from 'react';
import LoadingScreen from '../components/common/LoadingScreen';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: ''
  });

  const showLoading = (message = 'Cargando datos de La Jama...') => {
    setLoadingState({ isLoading: true, message });
  };

  const hideLoading = () => {
    setLoadingState({ isLoading: false, message: '' });
  };

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {loadingState.isLoading && (
        <LoadingScreen message={loadingState.message} />
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);