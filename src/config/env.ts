// Configuración de variables de entorno
export const config = {
  // API - Detectar automáticamente el entorno
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.kiki.com.ar'),
  
  // Debug: Mostrar qué URL se está usando
  getApiUrl: () => {
    const url = import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.kiki.com.ar');
    console.log('🔗 API URL configurada:', url);
    return url;
  },
  
  // AWS S3 (para URLs de imágenes)
  AWS_S3_BUCKET_NAME: import.meta.env.VITE_AWS_S3_BUCKET_NAME || 'kiki-bucket-app',
  AWS_REGION: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  
  // Función para generar URL de imagen S3
  getS3ImageUrl: (imageKey: string): string => {
    if (!imageKey) return '';
    return `https://${config.AWS_S3_BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${imageKey}`;
  }
};
