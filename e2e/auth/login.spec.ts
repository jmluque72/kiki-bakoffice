import { test, expect } from '../fixtures/auth.fixture';

/**
 * Tests de autenticación
 */
test.describe('Autenticación', () => {
  test('debe poder loguearse con credenciales válidas', async ({ loginPage }) => {
    const email = process.env.TEST_USER_EMAIL || 'admin@kiki.com.ar';
    const password = process.env.TEST_USER_PASSWORD || 'admin123';

    await loginPage.goto();
    await loginPage.login(email, password);
    await loginPage.expectLoginSuccess();
  });

  test('debe mostrar error con credenciales inválidas', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('invalid@email.com', 'wrongpassword');
    
    // Esperar un momento para que aparezca el error
    await loginPage.page.waitForTimeout(2000);
    
    // Verificar que no se navegó al dashboard
    await expect(loginPage.page).not.toHaveURL(/.*dashboard|.*divisiones/);
  });
});

