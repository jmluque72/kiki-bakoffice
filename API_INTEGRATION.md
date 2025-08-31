# 🔗 Integración del Backoffice con el API de Kiki

## 📋 Resumen

El backoffice de Kiki ahora está completamente integrado con el API del servidor. Se han implementado los siguientes componentes:

### ✅ Servicios Implementados

1. **AuthService** (`src/services/authService.ts`)
   - Login con credenciales reales
   - Registro de usuarios
   - Obtención de perfil
   - Gestión de tokens JWT

2. **UserService** (`src/services/userService.ts`)
   - Listado de usuarios con paginación
   - Crear, actualizar y eliminar usuarios
   - Cambiar estado de usuarios

3. **AccountService** (`src/services/accountService.ts`)
   - Gestión completa de cuentas/instituciones
   - Estadísticas de cuentas
   - CRUD completo

### ✅ Configuración del API

1. **Configuración base** (`src/config/api.ts`)
   - Cliente axios configurado
   - Interceptores para autenticación
   - Manejo automático de errores 401
   - Tipos TypeScript completos

2. **Endpoints mapeados**
   - Todos los endpoints del API documentados
   - URLs dinámicas para IDs
   - Tipos de respuesta tipados

### ✅ Autenticación Actualizada

1. **Hook de autenticación** (`src/hooks/useAuth.ts`)
   - Integración con AuthService
   - Verificación automática de tokens
   - Manejo de errores de autenticación

2. **Componente Login** (`src/components/Login.tsx`)
   - Conectado al API real
   - Manejo de errores mejorado
   - Feedback visual del estado

### ✅ Componentes Adicionales

1. **ApiStatus** (`src/components/ApiStatus.tsx`)
   - Indicador de conexión con el API
   - Verificación automática cada 30 segundos
   - Feedback visual del estado

2. **useApi Hook** (`src/hooks/useApi.ts`)
   - Hook genérico para llamadas al API
   - Manejo de estado de carga
   - Manejo de errores centralizado

## 🚀 Cómo usar

### 1. Configurar la URL del API

Crear archivo `.env.local` en el directorio `backoffice/`:

```env
VITE_API_URL=http://localhost:3000
```

### 2. Iniciar el API

```bash
# En el directorio raíz del proyecto
docker-compose up -d

# O sin Docker
cd api && npm start
```

### 3. Iniciar el Backoffice

```bash
cd backoffice
npm run dev
```

### 4. Acceder al Backoffice

- URL: `http://localhost:5173`
- Usar credenciales reales del sistema Kiki
- El estado de conexión se muestra en el header

## 🔧 Estructura de Archivos

```
backoffice/src/
├── config/
│   └── api.ts                 # Configuración del API
├── services/
│   ├── authService.ts         # Servicio de autenticación
│   ├── userService.ts         # Servicio de usuarios
│   └── accountService.ts      # Servicio de cuentas
├── hooks/
│   ├── useAuth.ts            # Hook de autenticación actualizado
│   └── useApi.ts             # Hook genérico para API
├── components/
│   ├── Login.tsx             # Login conectado al API
│   ├── Header.tsx            # Header con estado del API
│   └── ApiStatus.tsx         # Indicador de conexión
└── types/                    # Tipos compartidos
```

## 📊 Funcionalidades Disponibles

### ✅ Autenticación
- Login con credenciales reales
- Verificación automática de tokens
- Logout automático en token expirado

### ✅ Gestión de Usuarios
- Listado con paginación
- Crear nuevos usuarios
- Actualizar información
- Cambiar estado (activo/inactivo)

### ✅ Gestión de Cuentas
- Listado de instituciones
- Crear nuevas cuentas
- Actualizar información
- Estadísticas del sistema

### ✅ Estado del Sistema
- Indicador de conexión con el API
- Manejo de errores centralizado
- Feedback visual del estado

## 🛠️ Próximos Pasos

1. **Implementar servicios adicionales**:
   - GroupService para gestión de grupos
   - EventService para gestión de eventos
   - RoleService para gestión de roles

2. **Mejorar la UI**:
   - Tablas con paginación
   - Formularios de creación/edición
   - Modales de confirmación

3. **Funcionalidades avanzadas**:
   - Filtros y búsqueda
   - Exportación de datos
   - Dashboard con estadísticas

## 🔒 Seguridad

- Tokens JWT manejados automáticamente
- Interceptores para renovación de tokens
- Logout automático en errores 401
- Validación de permisos por rol

## 📝 Notas

- El backoffice está configurado para desarrollo local
- Para producción, cambiar la URL del API en las variables de entorno
- Todos los endpoints están documentados en el API Gateway
- El sistema maneja automáticamente los errores de red 