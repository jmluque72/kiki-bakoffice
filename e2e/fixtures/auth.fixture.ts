import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Fixture de autenticación que proporciona un usuario logueado
 */
export const test = base.extend<{
  loginPage: LoginPage;
  authenticatedPage: any;
}>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * Página con usuario autenticado
   * Usa las credenciales de las variables de entorno o valores por defecto
   */
  authenticatedPage: async ({ page, loginPage }, use) => {
    const email = process.env.TEST_USER_EMAIL || 'admin@kiki.com.ar';
    const password = process.env.TEST_USER_PASSWORD || 'admin123';

    // Navegar a la página de login
    await page.goto('/');
    
    // Esperar a que la página de login esté lista
    await loginPage.waitForPageLoad();
    
    // Realizar login
    await loginPage.login(email, password);
    
    // Verificar que el login fue exitoso (esperar a que aparezca el dashboard)
    await expect(page).toHaveURL(/.*dashboard|.*divisiones/);
    
    // Esperar a que el sidebar esté visible
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 }).catch(() => {
      // Si no hay data-testid, buscar por clase o selector alternativo
      return page.waitForSelector('nav, aside, [class*="sidebar"]', { timeout: 10000 });
    });

    await use(page);
  },
});

export { expect };

