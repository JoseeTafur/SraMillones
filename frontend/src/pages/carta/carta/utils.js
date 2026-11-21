// Normaliza texto para buscar sin importar tildes ni mayúsculas
export const normalizar = (texto = '') =>
  texto
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

// Respeta la preferencia del sistema "reducir movimiento"
export const prefiereMenosMovimiento = () =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia) &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
