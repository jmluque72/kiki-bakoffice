import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Tests para todas las pantallas del backoffice
 * Este test recorre todas las opciones del menú y verifica que carguen sin errores
 */
test.describe('Todas las Pantallas', () => {
  // Lista de todas las pantallas disponibles según el rol
  const screens = [
    'usuarios',
    'activity',
    'eventos',
    'notificaciones',
    'divisiones',
    'tutores',
    'alumnos',
    'asistencias',
    'acciones-diarias',
    'pickup',
    'formularios',
    // 'documentos', // Solo para adminaccount
    // 'accounts', // Solo para superadmin
  ];

  for (const screen of screens) {
    test(`debe cargar la pantalla "${screen}" sin errores`, async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      await dashboardPage.waitForDashboardLoad();
      
      try {
        await dashboardPage.navigateToSection(screen);
        await dashboardPage.expectSectionVisible(screen);
        await dashboardPage.expectNoErrors();
        await dashboardPage.expectPageLoaded();
        
        // Tomar screenshot para debugging
        await authenticatedPage.screenshot({ 
          path: `test-results/screenshots/${screen}.png`,
          fullPage: true 
        });
      } catch (error) {
        // Si falla, tomar screenshot del error
        await authenticatedPage.screenshot({ 
          path: `test-results/screenshots/${screen}-error.png`,
          fullPage: true 
        });
        throw error;
      }
    });
  }
});

