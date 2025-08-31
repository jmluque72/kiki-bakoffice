# Carga de Imágenes en Backoffice

## Descripción
Este documento explica la implementación de la funcionalidad de carga de imágenes en el backoffice de Kiki.

## Funcionalidades Implementadas

### 1. Componente ImageUpload
- **Ubicación**: `src/components/ImageUpload.tsx`
- **Funcionalidades**:
  - Drag & drop para subir imágenes
  - Preview de imagen antes de subir
  - Validación de tipo de archivo (solo imágenes)
  - Validación de tamaño (máximo 5MB)
  - Indicador de carga
  - Manejo de errores
  - Botón para eliminar imagen

### 2. Servicio UploadService
- **Ubicación**: `src/services/uploadService.ts`
- **Métodos**:
  - `uploadImage()` - Subir imagen a S3
  - `updateAccountLogo()` - Actualizar logo de cuenta
  - `getAccountLogo()` - Obtener logo de cuenta
  - `deleteImage()` - Eliminar imagen de S3

### 3. Configuración de Entorno
- **Ubicación**: `src/config/env.ts`
- **Variables**:
  - `VITE_API_BASE_URL` - URL de la API
  - `VITE_AWS_S3_BUCKET_NAME` - Nombre del bucket S3
  - `VITE_AWS_REGION` - Región de AWS

## Uso en AccountsSection

### 1. Importar Componentes
```typescript
import { ImageUpload } from '../ImageUpload';
import { config } from '../../config/env';
```

### 2. Estados para Imágenes
```typescript
const [currentImageKey, setCurrentImageKey] = useState<string>('');
const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
```

### 3. Función de Manejo
```typescript
const handleImageUpload = (imageKey: string, imageUrl: string) => {
  setCurrentImageKey(imageKey);
  setCurrentImageUrl(imageUrl);
  setFormData(prev => ({
    ...prev,
    logo: imageKey
  }));
};
```

### 4. En el Formulario
```typescript
<ImageUpload
  onImageUpload={handleImageUpload}
  currentImageUrl={currentImageUrl}
  className="w-full"
/>
```

### 5. Actualización de Logo
```typescript
// En handleSubmit
if (currentImageKey && currentImageKey !== editingAccount.logo) {
  const { UploadService } = await import('../services/uploadService');
  await UploadService.updateAccountLogo(editingAccount._id, currentImageKey);
}
```

## Flujo de Uso

### 1. Crear Nueva Institución
1. Usuario hace clic en "Nueva Institución"
2. Completa los campos del formulario
3. Sube una imagen usando el componente ImageUpload
4. La imagen se sube a S3 y se obtiene el `imageKey`
5. Se crea la institución con el `imageKey` en el campo `logo`
6. Se actualiza el logo en S3 usando el endpoint específico

### 2. Editar Institución Existente
1. Usuario hace clic en "Editar" en una institución
2. Se cargan los datos actuales, incluyendo el logo si existe
3. Usuario puede cambiar la imagen usando ImageUpload
4. Si se sube una nueva imagen, se actualiza en S3
5. Se guardan los cambios en la base de datos

### 3. Visualización en Tabla
1. Los logos se muestran en la tabla de instituciones
2. Si no hay logo, se muestra un placeholder
3. Si falla la carga de la imagen, se muestra un placeholder
4. Las URLs se generan automáticamente usando la configuración de S3

## Configuración Requerida

### 1. Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AWS_S3_BUCKET_NAME=tu-bucket-name
VITE_AWS_REGION=us-east-1
```

### 2. Backend Configurado
- API corriendo en el puerto especificado
- Endpoints de S3 implementados
- Bucket S3 configurado con CORS
- Credenciales AWS configuradas

## Características de Seguridad

- ✅ Validación de tipos de archivo
- ✅ Límite de tamaño de archivo
- ✅ Autenticación requerida
- ✅ Permisos por rol de usuario
- ✅ Manejo de errores
- ✅ Preview antes de subir
- ✅ Nombres únicos con UUID

## Estructura de Archivos

```
backoffice/src/
├── components/
│   ├── ImageUpload.tsx          # Componente de carga
│   └── sections/
│       └── AccountsSection.tsx  # Sección de cuentas
├── services/
│   └── uploadService.ts         # Servicio de upload
└── config/
    └── env.ts                   # Configuración
```

## Notas Importantes

1. **CORS**: El bucket S3 debe tener CORS configurado para permitir requests desde el frontend
2. **Credenciales**: Las credenciales AWS deben tener permisos mínimos necesarios
3. **Región**: Configurar la región correcta para el bucket
4. **Costos**: Monitorear el uso de S3 para controlar costos
5. **Fallbacks**: El componente maneja casos donde la imagen no carga correctamente
