import React from 'react';

// Ícono de Búsqueda (Lupa)
export const SearchIcon = ({ width = 18, height = 18, color = 'currentColor' }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

// Ícono de Limpiar Búsqueda (X)
export const ClearIcon = ({ width = 16, height = 16, color = 'currentColor' }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Ícono de Editar (Lápiz)
export const EditIcon = ({ width = 18, height = 18, color = 'currentColor' }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

// Ícono de Ocultar / Desactivar (Ojo Tachado)
export const HideIcon = ({ width = 18, height = 18, color = 'currentColor' }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

// Ícono de Ver / Visualizar (Ojo Abierto)
export const EyeIcon = ({ width = 18, height = 18, color = 'currentColor' }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

// Ícono de Llave (Gestión de Permisos / Accesos)
export const KeyIcon = ({ width = 18, height = 18, color = 'currentColor' }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-1.5 1.5l-3 3m-2 2l-3 3m-2 2l-3 3m-2.5 2.5a2.121 2.121 0 0 1-3-3l1-1a2.121 2.121 0 0 1 3 0l1 1a2.121 2.121 0 0 1 0 3l-1 1z"></path>
    <circle cx="7.5" cy="16.5" r="3.5"></circle>
  </svg>
);

// Ícono de Agregar (+)
export const PlusIcon = ({ width = 18, height = 18, color = 'currentColor' }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

// Ícono Flecha Izquierda (Paginación)
export const ChevronLeftIcon = ({ width = 18, height = 18, color = 'currentColor' }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

// Ícono Flecha Derecha (Paginación)
export const ChevronRightIcon = ({ width = 18, height = 18, color = 'currentColor' }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);