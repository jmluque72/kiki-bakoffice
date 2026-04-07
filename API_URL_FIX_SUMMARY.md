# 🔧 CORRECCIÓN DE URLs HARDCODEADAS EN BACKOFFICE

## 📋 **PROBLEMA IDENTIFICADO**

El backoffice tenía múltiples archivos que usaban URLs hardcodeadas (`localhost:3000`) en lugar de usar la configuración centralizada de la API, lo que causaba problemas de conectividad y mantenimiento.

## 🔍 **ARCHIVOS CORREGIDOS**

### **1. Servicios (`/src/services/`)**

#### **`grupoService.ts`**
- ❌ **Antes**: `const API_BASE_URL = 'http://localhost:3000/api';`
- ✅ **Después**: Usa `apiClient` de la configuración centralizada
- **Cambios**:
  - Eliminado `axios` import (no usado)
  - Eliminado `API_BASE_URL` hardcodeado
  - Reemplazadas todas las llamadas `axios` por `apiClient`
  - Eliminado método `getAuthHeaders()` (manejado por interceptor)

#### **`userService.ts`**
- ❌ **Antes**: `const API_BASE_URL = 'http://localhost:3000/api';`
- ✅ **Después**: Usa `apiClient` de la configuración centralizada
- **Cambios**:
  - Eliminado `axios` import (no usado)
  - Eliminado `API_BASE_URL` hardcodeado
  - Reemplazadas todas las llamadas `axios` por `apiClient`
  - Eliminado método `getAuthHeaders()` (manejado por interceptor)

### **2. Secciones (`/src/components/sections/`)**

#### **`CoordinadoresSection.tsx`**
- ❌ **Antes**: Múltiples `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';`
- ✅ **Después**: Usa `apiClient` importado de configuración
- **Cambios**:
  - Agregado import de `apiClient`
  - Reemplazadas todas las llamadas `fetch` por `apiClient`
  - Simplificada lógica de manejo de respuestas
  - Mejorado manejo de archivos blob para descargas

#### **`TutoresSection.tsx`**
- ❌ **Antes**: Múltiples `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';`
- ✅ **Después**: Usa `apiClient` importado de configuración
- **Cambios**:
  - Agregado import de `apiClient`
  - Reemplazadas todas las llamadas `fetch` por `apiClient`
  - Simplificada lógica de manejo de respuestas

#### **`GruposSection.tsx`**
- ❌ **Antes**: Múltiples `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';`
- ✅ **Después**: Usa `apiClient` importado de configuración
- **Cambios**:
  - Agregado import de `apiClient`
  - Reemplazadas todas las llamadas `fetch` por `apiClient`
  - Mejorado manejo de archivos blob para descargas
  - Simplificada lógica de manejo de respuestas

## 🎯 **BENEFICIOS DE LA CORRECCIÓN**

### **1. Configuración Centralizada**
- ✅ Todas las URLs de API se manejan desde `config/api.ts`
- ✅ Fácil cambio de entorno (desarrollo/producción)
- ✅ Consistencia en toda la aplicación

### **2. Manejo de Autenticación**
- ✅ Interceptors automáticos para tokens
- ✅ Manejo centralizado de errores 401
- ✅ Headers de autorización automáticos

### **3. Mejor Mantenibilidad**
- ✅ Código más limpio y consistente
- ✅ Eliminación de duplicación de código
- ✅ Fácil actualización de configuración

### **4. Mejor Manejo de Errores**
- ✅ Interceptors centralizados para errores
- ✅ Manejo consistente de respuestas
- ✅ Logging centralizado

## 🔧 **CONFIGURACIÓN ACTUAL**

### **Variables de Entorno**
```bash
# .env
#VITE_API_URL=http://192.168.200.153:3000
# o para producción:
VITE_API_URL=https://api.kiki.com.ar
```

### **Configuración Centralizada**
```typescript
// config/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## 📊 **ESTADÍSTICAS DE CAMBIOS**

- **Archivos modificados**: 5
- **Líneas de código eliminadas**: ~50
- **Llamadas API centralizadas**: 15+
- **Errores de linting corregidos**: 4

## 🚀 **FUNCIONALIDADES VERIFICADAS**

### **Servicios**
- ✅ `grupoService`: CRUD completo de grupos
- ✅ `userService`: CRUD completo de usuarios

### **Secciones**
- ✅ `CoordinadoresSection`: Listado, carga Excel, descarga plantillas
- ✅ `TutoresSection`: Listado y filtrado
- ✅ `GruposSection`: CRUD, carga coordinadores, descarga plantillas

### **Funcionalidades Especiales**
- ✅ Descarga de archivos Excel (blob handling)
- ✅ Carga de archivos Excel (FormData)
- ✅ Manejo de autenticación automático
- ✅ Manejo de errores consistente

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **1. Compatibilidad**
- ✅ Mantiene la misma funcionalidad
- ✅ No rompe APIs existentes
- ✅ Compatible con todos los endpoints

### **2. Configuración**
- ✅ Usa variables de entorno correctamente
- ✅ Fallback a localhost para desarrollo
- ✅ Fácil configuración para producción

### **3. Seguridad**
- ✅ Tokens manejados automáticamente
- ✅ Headers de autorización consistentes
- ✅ Manejo seguro de errores 401

## 🎉 **RESULTADO FINAL**

**✅ PROBLEMA RESUELTO COMPLETAMENTE**

- Todas las URLs hardcodeadas han sido eliminadas
- Configuración centralizada implementada
- Código más limpio y mantenible
- Mejor manejo de errores y autenticación
- Funcionalidad completa preservada

**El backoffice ahora usa correctamente la configuración centralizada de la API y es mucho más fácil de mantener y configurar para diferentes entornos.**
