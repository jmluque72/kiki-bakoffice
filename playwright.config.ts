import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para tests E2E del backoffice
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Ejecutar tests en paralelo */
  fullyParallel: true,
  /* Fallar el build si accidentalmente dejaste test.only en el código */
  forbidOnly: !!process.env.CI,
  /* Retry en CI si los tests fallan */
  retries: process.env.CI ? 2 : 0,
  /* Opciones para ejecutar en paralelo */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter a usar */
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Configuración compartida para todos los proyectos */
  use: {
    /* URL base para usar en navegación */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    /* Recopilar trace cuando se reintenta el test fallido */
    trace: 'on-first-retry',
    /* Screenshot en fallos */
    screenshot: 'only-on-failure',
    /* Video en fallos */
    video: 'retain-on-failure',
    /* Timeout para acciones */
    actionTimeout: 10000,
    /* Timeout para navegación */
    navigationTimeout: 30000,
  },

  /* Configurar proyectos para diferentes navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Puedes agregar más navegadores si lo necesitas
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Ejecutar el servidor de desarrollo antes de los tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

