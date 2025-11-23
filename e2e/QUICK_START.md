# 🚀 Guía Rápida - Ejecutar Tests E2E

## ⚡ Inicio Rápido

### 1. Asegúrate de que el API esté corriendo

```bash
# En otra terminal, desde la raíz del proyecto
cd api
npm start
# O si usas nodemon
npm run dev
```

### 2. Ejecutar los tests

```bash
# Desde el directorio backoffice
cd backoffice

# Opción 1: Todos los tests (recomendado para empezar)
npm run test:e2e

# Opción 2: Con navegador visible (para ver qué pasa)
npm run test:e2e:headed

# Opción 3: Modo UI interactivo (muy útil para debugging)
npm run test:e2e:ui

# Opción 4: Un test específico
npx playwright test e2e/screens/usuarios.spec.ts

# Opción 5: Solo tests de login
npx playwright test e2e/auth/login.spec.ts
```

## 📋 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run test:e2e` | Ejecuta todos los tests en modo headless |
| `npm run test:e2e:headed` | Ejecuta tests con navegador visible |
| `npm run test:e2e:ui` | Abre UI interactiva de Playwright |
| `npm run test:e2e:debug` | Modo debug paso a paso |
| `npm run test:e2e:report` | Abre reporte HTML de resultados |

## 🎯 Ejecutar Tests Específicos

```bash
# Solo una pantalla
npx playwright test e2e/screens/usuarios.spec.ts

# Solo tests de autenticación
npx playwright test e2e/auth/

# Solo tests de pantallas
npx playwright test e2e/screens/

# Test específico por nombre
npx playwright test -g "debe cargar la pantalla de usuarios"
```

## 🔧 Configuración

### Variables de Entorno (Opcional)

Crea un archivo `.env` en `backoffice/`:

```env
TEST_USER_EMAIL=admin@kiki.com.ar
TEST_USER_PASSWORD=admin123
PLAYWRIGHT_BASE_URL=http://localhost:5173
```

Si no configuras estas variables, se usarán valores por defecto.

## 📊 Ver Resultados

Después de ejecutar los tests:

```bash
# Ver reporte HTML
npm run test:e2e:report

# O abrir directamente
npx playwright show-report
```

El reporte incluye:
- ✅ Tests que pasaron
- ❌ Tests que fallaron
- 📸 Screenshots de errores
- 🎥 Videos de errores
- 📝 Traces para debugging

## 🐛 Troubleshooting

### El servidor no inicia automáticamente

Si el servidor de desarrollo no inicia automáticamente:

1. Inicia el servidor manualmente:
   ```bash
   npm run dev
   ```

2. Ejecuta los tests sin el webServer:
   ```bash
   npx playwright test --config=playwright.config.ts
   ```

### Los tests no encuentran elementos

1. Ejecuta en modo headed para ver qué pasa:
   ```bash
   npm run test:e2e:headed
   ```

2. Usa el Playwright Inspector:
   ```bash
   npx playwright codegen http://localhost:5173
   ```

### Login falla

1. Verifica las credenciales en `.env` o usa las por defecto
2. Verifica que el API esté corriendo en `http://localhost:3000`
3. Revisa los logs del servidor

## 💡 Tips

- **Primera vez**: Ejecuta `npm run test:e2e:ui` para ver la UI interactiva
- **Debugging**: Usa `npm run test:e2e:debug` para ejecutar paso a paso
- **Ver qué pasa**: Usa `npm run test:e2e:headed` para ver el navegador
- **Un test rápido**: `npx playwright test e2e/auth/login.spec.ts --headed`

