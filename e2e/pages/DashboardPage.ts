import { Page, expect } from '@playwright/test';

/**
 * Page Object Model para el Dashboard
 */
export class DashboardPage {
  readonly page: Page;

  // Selectores del sidebar
  private readonly sidebar = '[data-testid="sidebar"], nav, aside, [class*="sidebar"]';
  private readonly menuItems = {
    usuarios: 'text=Usuarios',
    activity: 'text=Activity',
    eventos: 'text=Eventos',
    notificaciones: 'text=Notificaciones',
    divisiones: 'text=Divisiones',
    tutores: 'text=Tutores',
    alumnos: 'text=Alumnos',
    asistencias: 'text=Asistencias',
    'acciones-diarias': 'text=Acciones Diarias',
    pickup: 'text=Quién Retira',
    formularios: 'text=Formularios',
    documentos: 'text=Documentos',
    accounts: 'text=Instituciones',
    dashboard: 'text=Dashboard'
  };

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Esperar a que el dashboard esté cargado
   */
  async waitForDashboardLoad() {
    // Esperar a que el sidebar esté visible
    await this.page.waitForSelector(this.sidebar, { timeout: 10000 });
    
    // Esperar un momento para que todo se renderice
    await this.page.waitForTimeout(1000);
  }

  /**
   * Navegar a una sección del menú
   */
  async navigateToSection(sectionKey: string) {
    const menuText = this.menuItems[sectionKey as keyof typeof this.menuItems];
    
    if (!menuText) {
      throw new Error(`Sección "${sectionKey}" no encontrada en el menú`);
    }

    // Buscar el elemento del menú
    const menuItem = this.page.locator(menuText).first();
    
    // Verificar que existe
    await expect(menuItem).toBeVisible({ timeout: 5000 });
    
    // Hacer clic
    await menuItem.click();
    
    // Esperar a que la navegación ocurra
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verificar que una sección está visible
   */
  async expectSectionVisible(sectionKey: string) {
    // Buscar contenido típico de cada sección
    const sectionSelectors: Record<string, string> = {
      usuarios: 'text=Usuarios, text=Lista de usuarios, [class*="usuarios"]',
      activity: 'text=Activity, [class*="activity"]',
      eventos: 'text=Eventos, [class*="eventos"]',
      notificaciones: 'text=Notificaciones, [class*="notificaciones"]',
      divisiones: 'text=Divisiones, [class*="divisiones"]',
      tutores: 'text=Tutores, [class*="tutores"]',
      alumnos: 'text=Alumnos, [class*="alumnos"]',
      asistencias: 'text=Asistencias, [class*="asistencias"]',
      'acciones-diarias': 'text=Acciones Diarias, [class*="acciones"]',
      pickup: 'text=Quién Retira, [class*="pickup"]',
      formularios: 'text=Formularios, [class*="formularios"]',
      documentos: 'text=Documentos, [class*="documentos"]',
      accounts: 'text=Instituciones, [class*="accounts"]',
      dashboard: '[class*="dashboard"]'
    };

    const selector = sectionSelectors[sectionKey];
    if (selector) {
      // Intentar encontrar algún elemento de la sección
      const sectionElement = this.page.locator(selector).first();
      await expect(sectionElement).toBeVisible({ timeout: 10000 });
    }
  }

  /**
   * Verificar que no hay errores visibles en la página
   */
  async expectNoErrors() {
    // Buscar mensajes de error comunes
    const errorSelectors = [
      '[class*="error"]',
      '[role="alert"]',
      'text=/error/i',
      'text=/fallo/i',
      'text=/failed/i'
    ];

    for (const selector of errorSelectors) {
      const errorElements = await this.page.$$(selector);
      for (const element of errorElements) {
        const text = await element.textContent();
        // Ignorar errores que son parte de la UI normal (como validaciones de formularios vacíos)
        if (text && !text.includes('requerido') && !text.includes('required')) {
          throw new Error(`Error encontrado en la página: ${text}`);
        }
      }
    }
  }

  /**
   * Verificar que la página está cargando correctamente
   */
  async expectPageLoaded() {
    // Verificar que no hay spinners de carga
    const loadingSpinners = await this.page.$$('[class*="loading"], [class*="spinner"]');
    expect(loadingSpinners.length).toBe(0);
    
    // Verificar que hay contenido visible
    const mainContent = await this.page.$('main, [class*="content"], [class*="container"]');
    expect(mainContent).not.toBeNull();
  }
}

