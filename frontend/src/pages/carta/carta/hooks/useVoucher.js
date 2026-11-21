import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const MAX_VOUCHER_BYTES = 4 * 1024 * 1024; // 4 MB
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

const useVoucher = (total) => {
  const [voucherFile, setVoucherFile] = useState(null);
  const [voucherPreview, setVoucherPreview] = useState(null);
  const [analizandoVoucher, setAnalizandoVoucher] = useState(false);
  const [errorVoucher, setErrorVoucher] = useState('');
  const [montoDetectado, setMontoDetectado] = useState(null);
  const [voucherValido, setVoucherValido] = useState(false);
  const [metodoUsado, setMetodoUsado] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => () => {
    if (voucherPreview) URL.revokeObjectURL(voucherPreview);
  }, [voucherPreview]);

  // Si el usuario modifica los platos del carrito después de validar, invalida el voucher anterior
  useEffect(() => {
    if (voucherValido && montoDetectado !== null && Math.abs(montoDetectado - total) >= 0.01) {
      setVoucherValido(false);
      setErrorVoucher(`El total cambió a S/ ${total.toFixed(2)}. Sube el voucher por el nuevo monto.`);
    }
  }, [total, voucherValido, montoDetectado]);

  const handleVoucherUpload = async (e, metodoId) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setErrorVoucher('Formato no válido. Sube una captura en JPG, PNG o WEBP.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (file.size > MAX_VOUCHER_BYTES) {
      setErrorVoucher('La captura pesa demasiado (máximo 4 MB).');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setVoucherFile(file);
    setVoucherPreview(URL.createObjectURL(file));
    setAnalizandoVoucher(true);
    setErrorVoucher('');
    setVoucherValido(false);
    setMontoDetectado(null);
    setMetodoUsado(metodoId);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('total', total);
    formData.append('metodo', metodoId || 'yape');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/public/carta/validar-voucher`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const data = response.data;

      if (data.valido) {
        setVoucherValido(true);
        setMontoDetectado(data.monto);
        setErrorVoucher('');
      } else {
        setVoucherValido(false);
        setErrorVoucher(data.mensaje);
      }
    } catch (err) {
      console.error("Error al validar voucher con IA:", err);
      const msgBackend = err.response?.data?.mensaje;
      setErrorVoucher(msgBackend || "Hubo un error al conectar con el servicio de validación.");
      setVoucherValido(false);
    } finally {
      setAnalizandoVoucher(false);
    }
  };

  const quitarVoucher = () => {
    setVoucherFile(null);
    setVoucherPreview(null);
    setErrorVoucher('');
    setMontoDetectado(null);
    setVoucherValido(false);
    setMetodoUsado(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return {
    inputRef,
    voucherFile,
    voucherPreview,
    analizandoVoucher,
    errorVoucher,
    montoDetectado,
    voucherValido,
    metodoUsado,
    handleVoucherUpload,
    quitarVoucher,
  };
};

export default useVoucher;