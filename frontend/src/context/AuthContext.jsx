import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_AUTH_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;

const apiAuth = axios.create({
  baseURL: API_AUTH_URL,
  withCredentials: true
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);

  const aplicarSesion = (data) => {
    if (!data || !data.success) return false;

    setUser({
      id: data.usuarioId || 1,
      nombre: data.nombreUsuario || 'Usuario',
      rol: data.rol || 'INVITADO',
      empleado: data.empleadoNombre,
      turno: data.turno
    });

    // 🟢 Mapeo DINÁMICO de permisos desde MySQL
    // Junta todas las fuentes posibles de opciones que envía Spring Boot
    const rawOpciones = [
      ...(data.opcionesIndependientes || []),
      ...(data.menuOpciones || []),
      ...(data.opciones || [])
    ];

    // Mapea y extrae la propiedad .ruta de los objetos de la DB
    const rutasDinamicas = rawOpciones
      .map(op => {
        if (typeof op === 'string') return op;
        return op?.ruta || op?.url || null;
      })
      .filter(Boolean);

    // Guarda el set de rutas habilitadas de la BD
    setPermisos([...new Set(rutasDinamicas)]);
    return true;
  };

  const checkAuth = async () => {
    try {
      const response = await apiAuth.get('/me');
      if (response.data && response.data.success) {
        aplicarSesion(response.data);
      } else {
        setUser(null);
        setPermisos([]);
      }
    } catch (error) {
      setUser(null);
      setPermisos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (usuario, clave) => {
    try {
      const response = await apiAuth.post('/login', { usuario, clave });
      if (response.data && response.data.success) {
        aplicarSesion(response.data);
        return { success: true, user: response.data };
      }
      return { success: false, message: response.data.message || 'Credenciales incorrectas' };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Error de conexión con el servidor' 
      };
    }
  };

  const logout = async () => {
    try {
      await apiAuth.post('/logout');
    } finally {
      setUser(null);
      setPermisos([]);
    }
  };

  return (
    <AuthContext.Provider value={{ user, permisos, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);