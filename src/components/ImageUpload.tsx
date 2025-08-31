import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { UploadService } from '../services/uploadService';

interface ImageUploadProps {
  onImageUpload: (imageKey: string, imageUrl: string) => void;
  currentImageUrl?: string;
  className?: string;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  currentImageUrl,
  className = '',
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actualizar preview cuando cambia currentImageUrl
  React.useEffect(() => {
    if (currentImageUrl) {
      console.log('🖼️ Actualizando preview URL:', currentImageUrl);
      setPreviewUrl(currentImageUrl);
      setImageLoadError(false);
    } else {
      setPreviewUrl(null);
      setImageLoadError(false);
    }
  }, [currentImageUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setUploadError('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const result = await UploadService.uploadImage(file);
      
      if (result.success && result.data) {
        onImageUpload(result.data.imageKey, result.data.imageUrl);
        setUploadError(null);
      } else {
        setUploadError(result.message || 'Error al subir la imagen');
        setPreviewUrl(null);
      }
    } catch (error: any) {
      setUploadError(error.message || 'Error al subir la imagen');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setImageLoadError(false);
    onImageUpload('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Área de carga */}
      <div
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${disabled || isUploading 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
          }
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-600">Subiendo imagen...</p>
          </div>
        ) : previewUrl ? (
          <div className="relative">
            {imageLoadError ? (
              <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-gray-500 text-xs">Imagen no disponible</span>
                </div>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg mx-auto"
                onError={() => setImageLoadError(true)}
              />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Upload className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Haz clic para subir una imagen
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF hasta 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {uploadError && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {uploadError}
        </div>
      )}
    </div>
  );
};
