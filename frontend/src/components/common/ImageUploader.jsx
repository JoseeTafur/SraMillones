import React, { useRef } from 'react';
import './ImageUploader.css';

export const ImageUploader = ({
  value,
  onChange,
  label = '5. Foto / Imagen del Plato (Opcional)',
  placeholderUrl = 'O pegue el enlace de la imagen (https://...)'
}) => {
  const fileInputRef = useRef(null);

  // Procesar archivo seleccionado
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      onChange(imageUrl);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-uploader-container">
      {label && <label className="label-senior">{label}</label>}

      {/* Si ya hay una imagen cargada -> Muestra la vista previa con botón de quitar */}
      {value ? (
        <div className="uploader-preview-card">
          <div className="preview-image-wrapper">
            <img src={value} alt="Vista previa del plato" className="preview-thumb" />
            <div className="preview-overlay-info">
              <span className="preview-tag">Imagen Seleccionada</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-remove-uploader"
            onClick={handleRemove}
            title="Quitar foto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Quitar Foto
          </button>
        </div>
      ) : (
        /* Si NO hay imagen -> Folder Animado de Uiverse */
        <div className="uploader-input-group">
          <div className="folder-uiverse-container">
            <div className="folder">
              <div className="front-side">
                <div className="tip"></div>
                <div className="cover"></div>
              </div>
              <div className="back-side cover"></div>
            </div>
            
            <label className="custom-file-upload">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
              />
              Subir Foto del Equipo
            </label>
          </div>

          {/* Opción secundaria: Pegar enlace URL de la foto */}
          <div className="uploader-url-fallback">
            <input
              type="url"
              className="input-senior url-input"
              placeholder={placeholderUrl}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;