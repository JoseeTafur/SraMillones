// Métodos de pago disponibles en la carta.
// Para agregar otro (por ejemplo, transferencia) basta con sumar un objeto aquí
// y colocar su QR en la carpeta /public.
export const METODOS_PAGO = [
  {
    id: 'yape',
    nombre: 'Yape',
    verbo: 'yapea',
    qr: '/qr-yape.png',
    color: '#742284',
    fondo: '#F7EEFC',
    borde: '#E6D3F2',
  },
  {
    id: 'plin',
    nombre: 'Plin',
    verbo: 'plinea',
    qr: '/qr-plin.png',
    color: '#00808F',
    fondo: '#EAF9FB',
    borde: '#BFE8EE',
  },
];

// Devuelve el método por id (o el primero si el id no existe)
export const obtenerMetodo = (id) =>
  METODOS_PAGO.find((metodo) => metodo.id === id) || METODOS_PAGO[0];
