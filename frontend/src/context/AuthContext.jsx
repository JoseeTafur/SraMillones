import React, { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';
import api, {
    apiAuth,
    refreshAccessToken,
    setAccessToken,
} from "../services/api";

const AuthContext = createContext();

// const API_AUTH_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;

// const apiAuth = axios.create({
//   baseURL: API_AUTH_URL,
//   withCredentials: true
// });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);

  const aplicarSesion = (data) => {
    if (!data) return false;

    // setUser({
    //   id: data.usuarioId || 1,
    //   nombre: data.usaurio || 'Usuario',
    //   rol: data.rol || 'INVITADO',
    //   empleado: data.empleadoNombre,
    //   turno: data.turno
    // });

    setUser({
      id: data.id,
      nombre: data.usuario,
      rol: data.perfil,
      empleado: data.empleadoNombre,
      turno: data.turno,
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

      await refreshAccessToken();

      const response = await api.get('/v2/auth/me');

      aplicarSesion(response.data.data);

    } catch (error) {
        setAccessToken(null);
        setUser(null);
        setPermisos([]);
    } finally {
        setLoading(false);
    }
};

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (identificador, clave) => {
    try {
        const response = await apiAuth.post('/login', { identificador, clave });

        const resultado = response.data.body;

        if (!resultado?.success) {
            return {
                success: false,
                message: resultado?.message || 'Credenciales incorrectas'
            };
        }

        setAccessToken(resultado.data.accessToken);

        const meResponse = await api.get('/v2/auth/me');
        const usuario = meResponse.data.data;

        aplicarSesion(usuario);

        return { success: true, user: usuario };

    } catch (err) {
        setAccessToken(null);
        setUser(null);
        setPermisos([]);

        return {
            success: false,
            message: err.response?.data?.body?.message ||
                     err.response?.data?.message ||
                     'Error de conexión con el servidor'
        };
    }
};

  const logout = async () => {
    try {
        await apiAuth.post('/logout');
    } finally {
        setAccessToken(null);
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