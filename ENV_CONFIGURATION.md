# 🔧 Configuración de Variables de Entorno - Backoffice

## 📋 Problema Identificado

El backoffice no estaba leyendo correctamente las variables de entorno, siempre usando el valor por defecto `https://api.kiki.com.ar` en lugar de la URL local de desarrollo.

## ✅ Solución Implementada

### 1. **Detección Automática de Entorno**
Se modificó `/src/config/env.ts` para detectar automáticamente el entorno:

```typescript
// API - Detectar automáticamente el entorno
API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.kiki.com.ar'),
```

### 2. **Función de Debug**
Se agregó una función para mostrar qué URL se está usando:

```typescript
getApiUrl: () => {
  const url = import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.kiki.com.ar');
  console.log('🔗 API URL configurada:', url);
  return url;
},
```

### 3. **Configuración de API Actualizada**
Se actualizó `/src/config/api.ts` para usar la nueva función:

```typescript
const API_BASE_URL = config.getApiUrl();
```

## 🚀 Cómo Usar

### **Opción 1: Automática (Recomendada)**
- **Desarrollo**: Automáticamente usa `http://localhost:3000`
- **Producción**: Automáticamente usa `https://api.kiki.com.ar`

### **Opción 2: Manual con Variables de Entorno**
Crear un archivo `.env` en la raíz del backoffice:

```bash
# .env
VITE_API_BASE_URL=http://localhost:3000
```

## 🔍 Verificación

Para verificar que funciona correctamente:

1. **Abrir la consola del navegador**
2. **Buscar el mensaje**: `🔗 API URL configurada: http://localhost:3000`
3. **Verificar que las peticiones van a la URL correcta**

## 📝 Notas Importantes

- **Vite requiere el prefijo `VITE_`** para exponer variables de entorno al cliente
- **El archivo `.env` debe estar en la raíz** del proyecto backoffice
- **Reiniciar el servidor** después de crear/modificar el archivo `.env`
- **La detección automática funciona** basándose en `import.meta.env.DEV`

## 🛠️ Comandos Útiles

```bash
# Verificar variables de entorno en desarrollo
npm run dev

# Verificar variables de entorno en producción
npm run build && npm run preview
```

## 🎯 Resultado

Ahora el backoffice:
- ✅ **Detecta automáticamente** el entorno (desarrollo/producción)
- ✅ **Usa localhost:3000** en desarrollo
- ✅ **Usa api.kiki.com.ar** en producción
- ✅ **Permite override manual** con variables de entorno
- ✅ **Muestra debug info** en la consola
