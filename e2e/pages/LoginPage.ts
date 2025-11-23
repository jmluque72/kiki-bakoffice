import { Page, expect } from '@playwright/test';

/**
 * Page Object Model para la página de Login
 */
export class LoginPage {
  readonly page: Page;

  // Selectores
  private readonly emailInput = 'input[type="email"], input[name="email"], input[placeholder*="email" i]';
  private readonly passwordInput = 'input[type="password"], input[name="password"]';
  private readonly loginButton = 'button:has-text("Iniciar"), button:has-text("Login"), button[type="submit"]';
  private readonly errorMessage = '[class*="error"], [class*="alert"], [role="alert"]';

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navegar a la página de login
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * Esperar a que la página de login esté completamente cargada
   */
  async waitForPageLoad() {
    // Esperar a que los inputs estén visibles
    await this.page.waitForSelector(this.emailInput, { state: 'visible', timeout: 10000 });
    await this.page.waitForSelector(this.passwordInput, { state: 'visible', timeout: 10000 });
  }

  /**
   * Llenar el campo de email
   */
  async fillEmail(email: string) {
    await this.page.fill(this.emailInput, email);
  }

  /**
   * Llenar el campo de contraseña
   */
  async fillPassword(password: string) {
    await this.page.fill(this.passwordInput, password);
  }

  /**
   * Hacer clic en el botón de login
   */
  async clickLogin() {
    await this.page.click(this.loginButton);
  }

  /**
   * Realizar login completo
   */
  async login(email: string, password: string) {
    await this.waitForPageLoad();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
    
    // Esperar a que la navegación ocurra (login exitoso) o aparezca un error
    await Promise.race([
      this.page.waitForURL(/.*dashboard|.*divisiones/, { timeout: 10000 }),
      this.page.waitForSelector(this.errorMessage, { timeout: 5000 }).catch(() => null)
    ]);
  }

  /**
   * Verificar que hay un mensaje de error
   */
  async expectErrorMessage() {
    const errorElement = await this.page.$(this.errorMessage);
    expect(errorElement).not.toBeNull();
  }

  /**
   * Verificar que el login fue exitoso
   */
  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/.*dashboard|.*divisiones/);
  }
}

