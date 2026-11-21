import React from 'react';
import { UploadIcon, ClearIcon, CheckIcon, AlertIcon } from '../../../components/common/Icons';
import PagoPaso from './PagoPaso';
import './VoucherUpload.css';

// Paso 2 del pago: subir la captura del voucher y ver el resultado de la validación
const VoucherUpload = ({
  inputRef,
  voucherFile,
  voucherPreview,
  analizandoVoucher,
  errorVoucher,
  montoDetectado,
  voucherValido,
  onSubir,
  onQuitar,
}) => (
  <PagoPaso
    numero="2"
    titulo="Sube tu captura de pago"
    descripcion="Validamos el monto de tu pago automáticamente con IA."
  >
    <input
      ref={inputRef}
      id="voucher-input"
      type="file"
      accept="image/*"
      className="voucher-input"
      onChange={onSubir}
    />

    {!voucherPreview ? (
      <label htmlFor="voucher-input" className="voucher-dropzone">
        <span className="voucher-dropzone-icono"><UploadIcon width={22} height={22} /></span>
        <span className="voucher-dropzone-titulo">Toca para subir tu captura</span>
        <span className="voucher-dropzone-sub">Imagen del comprobante de pago</span>
      </label>
    ) : (
      <div className="voucher-preview">
        <img src={voucherPreview} alt="Vista previa del voucher" className="voucher-preview-img" />
        <span className="voucher-preview-nombre">{voucherFile?.name}</span>
        <button
          type="button"
          className="voucher-quitar"
          onClick={onQuitar}
          aria-label="Quitar voucher"
        >
          <ClearIcon width={16} height={16} />
        </button>
      </div>
    )}

    <div aria-live="polite">
      {analizandoVoucher && (
        <p className="voucher-estado voucher-estado--analizando">
          <span className="mini-spinner" />
          <span>Analizando tu voucher con IA...</span>
        </p>
      )}

      {errorVoucher && !analizandoVoucher && (
        <p className="voucher-estado voucher-estado--error">
          <AlertIcon width={17} height={17} />
          <span>{errorVoucher}</span>
        </p>
      )}

      {voucherValido && (
        <p className="voucher-estado voucher-estado--ok">
          <CheckIcon width={17} height={17} />
          <span>¡Voucher válido! Monto detectado: <strong>S/ {montoDetectado?.toFixed(2)}</strong></span>
        </p>
      )}
    </div>
  </PagoPaso>
);

export default VoucherUpload;
