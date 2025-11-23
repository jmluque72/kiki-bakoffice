import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Tests para la pantalla de Divisiones
 */
test.describe('Pantalla de Divisiones', () => {
  test('debe cargar la pantalla de divisiones sin errores', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    
    await dashboardPage.waitForDashboardLoad();
    await dashboardPage.navigateToSection('divisiones');
    await dashboardPage.expectSectionVisible('divisiones');
    await dashboardPage.expectNoErrors();
    await dashboardPage.expectPageLoaded();
  });
});

