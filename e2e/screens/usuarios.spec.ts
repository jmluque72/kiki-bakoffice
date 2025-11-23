import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Tests para la pantalla de Usuarios
 */
test.describe('Pantalla de Usuarios', () => {
  test('debe cargar la pantalla de usuarios sin errores', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    
    await dashboardPage.waitForDashboardLoad();
    await dashboardPage.navigateToSection('usuarios');
    await dashboardPage.expectSectionVisible('usuarios');
    await dashboardPage.expectNoErrors();
    await dashboardPage.expectPageLoaded();
  });

  test('debe mostrar la lista de usuarios', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    
    await dashboardPage.waitForDashboardLoad();
    await dashboardPage.navigateToSection('usuarios');
    
    // Esperar a que la tabla o lista de usuarios esté visible
    await authenticatedPage.waitForSelector('table, [class*="table"], [class*="list"]', { timeout: 10000 });
    
    // Verificar que hay contenido
    const content = await authenticatedPage.textContent('body');
    expect(content).toBeTruthy();
  });
});

