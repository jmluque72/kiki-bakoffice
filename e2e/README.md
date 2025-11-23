# Tests E2E del Backoffice con Playwright

Este directorio contiene los tests automatizados end-to-end para el backoffice usando Playwright.

## 📋 Estructura

```
e2e/
├── fixtures/          # Fixtures compartidos (auth, etc.)
├── pages/            # Page Object Models
├── screens/          # Tests por pantalla
├── auth/             # Tests de autenticación
└── README.md         # Esta documentación
```

## 🚀 Instalación

```bash
# Instalar dependencias (si no están instaladas)
npm install

# Instalar navegadores de Playwright
npx playwright install
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto backoffice con:

```env
# Credenciales para los tests
TEST_USER_EMAIL=admin@kiki.com.ar
TEST_USER_PASSWORD=admin123

# URL base (opcional, por defecto es http://localhost:5173)
PLAYWRIGHT_BASE_URL=http://localhost:5173
```

### Configuración de Playwright

La configuración está en `playwright.config.ts`. Puedes ajustar:
- Navegadores a usar
- Timeouts
- Screenshots y videos
- Servidor de desarrollo

## 🧪 Ejecutar Tests

### Todos los tests

```bash
npm run test:e2e
```

### Tests en modo UI (interactivo)

```bash
npm run test:e2e:ui
```

### Tests con navegador visible

```bash
npm run test:e2e:headed
```

### Tests en modo debug

```bash
npm run test:e2e:debug
```

### Ver reporte HTML

```bash
npm run test:e2e:report
```

### Ejecutar un test específico

```bash
npx playwright test e2e/screens/usuarios.spec.ts
```

### Ejecutar tests en paralelo

```bash
npx playwright test --workers=4
```

## 📝 Tests Disponibles

### Autenticación
- `e2e/auth/login.spec.ts` - Tests de login

### Pantallas Individuales
- `e2e/screens/usuarios.spec.ts` - Pantalla de Usuarios
- `e2e/screens/divisiones.spec.ts` - Pantalla de Divisiones
- `e2e/screens/all-screens.spec.ts` - Recorre todas las pantallas

## 🎯 Agregar Nuevos Tests

### 1. Crear test para una nueva pantalla

Crea un archivo en `e2e/screens/nombre-pantalla.spec.ts`:

```typescript
import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Pantalla de Nombre', () => {
  test('debe cargar sin errores', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    
    await dashboardPage.waitForDashboardLoad();
    await dashboardPage.navigateToSection('nombre-seccion');
    await dashboardPage.expectSectionVisible('nombre-seccion');
    await dashboardPage.expectNoErrors();
    await dashboardPage.expectPageLoaded();
  });
});
```

### 2. Agregar la sección al DashboardPage

Si la sección no está en el menú, agrégalo a `e2e/pages/DashboardPage.ts`:

```typescript
private readonly menuItems = {
  // ... existentes
  'nueva-seccion': 'text=Nombre en el Menú',
};
```

## 🔍 Debugging

### Ver qué está pasando

1. Ejecutar en modo headed:
   ```bash
   npm run test:e2e:headed
   ```

2. Usar modo debug:
   ```bash
   npm run test:e2e:debug
   ```

3. Ver screenshots:
   - Se guardan automáticamente en `test-results/screenshots/` cuando hay errores

4. Ver videos:
   - Se guardan en `test-results/` cuando hay errores

### Selectores

Si los tests fallan porque no encuentran elementos:

1. Inspecciona la página en el navegador
2. Verifica los selectores en `e2e/pages/`
3. Puedes usar el Playwright Inspector para generar selectores:
   ```bash
   npx playwright codegen http://localhost:5173
   ```

## 📊 Reportes

Después de ejecutar los tests, puedes ver un reporte HTML:

```bash
npm run test:e2e:report
```

Esto abrirá un reporte interactivo con:
- Resultados de todos los tests
- Screenshots de fallos
- Videos de fallos
- Traces para debugging

## 🎨 Mejores Prácticas

1. **Usar Page Object Model**: Toda la lógica de interacción con la página debe estar en `pages/`
2. **Usar fixtures**: Para código compartido (como login)
3. **Tests independientes**: Cada test debe poder ejecutarse solo
4. **Selectores robustos**: Preferir `data-testid` cuando sea posible
5. **Esperar explícitamente**: Usar `waitFor` en lugar de `waitForTimeout` cuando sea posible

## 🐛 Troubleshooting

### Los tests no encuentran elementos

- Verifica que el servidor de desarrollo esté corriendo
- Aumenta los timeouts en `playwright.config.ts`
- Verifica los selectores en el navegador

### Login falla

- Verifica las credenciales en `.env`
- Verifica que el API esté corriendo
- Revisa los logs del servidor

### Tests son lentos

- Reduce el número de workers si hay problemas de recursos
- Usa `test.setTimeout()` para tests específicos que necesiten más tiempo

