import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Estado inicial simulado (Rol 'ADMIN' para ver todas las opciones)
  const [user, setUser] = useState({
    nombre: 'Administrador',
    rol: 'ADMIN', // Opciones: 'ADMIN', 'MESERO', 'CAJERO', 'COCINA'
    email: 'admin@lajama.pe'
  });

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);