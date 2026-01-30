import { apiClient, API_ENDPOINTS, ApiResponse, Account } from '../config/api';

export interface CreateAccountRequest {
  nombre: string;
  razonSocial: string;
  address: string;
  emailAdmin: string;
  passwordAdmin: string;
  nombreAdmin?: string;
  logo?: string;
}

export interface UpdateAccountRequest {
  nombre?: string;
  razonSocial?: string;
  address?: string;
  emailAdmin?: string;
  nombreAdmin?: string;
  logo?: string;
  activo?: boolean;
}

export interface CreateAdminUserRequest {
  nombre: string;
  apellido: string;
  email: string;
}

export interface AccountStats {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  totalUsers: number;
  totalGroups: number;
  totalEvents: number;
}

export class AccountService {
  static async getAccounts(page: number = 1, limit: number = 10): Promise<{
    accounts: Account[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        accounts: Account[];
        total: number;
        page: number;
        limit: number;
      }>>(`${API_ENDPOINTS.ACCOUNTS.LIST}?page=${page}&limit=${limit}`);
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener cuentas');
    }
  }

  static async getAccountById(id: string): Promise<Account> {
    try {
      const response = await apiClient.get<ApiResponse<Account>>(
        API_ENDPOINTS.ACCOUNTS.BY_ID(id)
      );
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener cuenta');
    }
  }

  static async createAccount(accountData: CreateAccountRequest): Promise<Account> {
    try {
      const response = await apiClient.post<ApiResponse<Account>>(
        API_ENDPOINTS.ACCOUNTS.CREATE,
        accountData
      );
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear cuenta');
    }
  }

  static async updateAccount(id: string, accountData: UpdateAccountRequest): Promise<Account> {
    try {
      const response = await apiClient.put<ApiResponse<Account>>(
        API_ENDPOINTS.ACCOUNTS.UPDATE(id),
        accountData
      );
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar cuenta');
    }
  }

  static async deleteAccount(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.ACCOUNTS.DELETE(id));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar cuenta');
    }
  }

  static async getAccountStats(): Promise<AccountStats> {
    try {
      const response = await apiClient.get<ApiResponse<AccountStats>>(
        API_ENDPOINTS.ACCOUNTS.STATS
      );
      
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  }

  static async createAdminUser(accountId: string, adminData: CreateAdminUserRequest): Promise<{
    user: any;
    account: any;
  }> {
    try {
      console.log('🚀 [FRONTEND] Creando usuario adminaccount...', { accountId, adminData });
      
      const response = await apiClient.post<ApiResponse<{
        user: any;
        account: any;
      }>>(
        `${API_ENDPOINTS.ACCOUNTS.BASE}/${accountId}/admin-users`,
        adminData
      );
      
      console.log('✅ [FRONTEND] Respuesta del servidor:', response.data);
      return response.data.data!;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error en createAdminUser:', error);
      throw new Error(error.response?.data?.message || 'Error al crear usuario administrador');
    }
  }

  // Configuración de cuenta
  static async getAccountConfig(accountId: string): Promise<{
    _id: string;
    account: string;
    requiereAprobarActividades: boolean;
    quickNotificationSettings: {
      code: string;
      enabled: boolean;
    }[];
    createdAt: string;
    updatedAt: string;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        config: {
          _id: string;
          account: string;
          requiereAprobarActividades: boolean;
          quickNotificationSettings?: {
            code: string;
            enabled: boolean;
          }[];
          createdAt: string;
          updatedAt: string;
        };
      }>>(`/api/accounts/${accountId}/config`);
      
      const cfg = response.data.data!.config;
      return {
        ...cfg,
        quickNotificationSettings: cfg.quickNotificationSettings || []
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener configuración');
    }
  }

  static async updateAccountConfig(accountId: string, config: {
    requiereAprobarActividades: boolean;
    quickNotificationSettings: {
      code: string;
      enabled: boolean;
    }[];
  }): Promise<{
    _id: string;
    account: string;
    requiereAprobarActividades: boolean;
    quickNotificationSettings: {
      code: string;
      enabled: boolean;
    }[];
    createdAt: string;
    updatedAt: string;
  }> {
    try {
      const response = await apiClient.put<ApiResponse<{
        config: {
          _id: string;
          account: string;
          requiereAprobarActividades: boolean;
          quickNotificationSettings?: {
            code: string;
            enabled: boolean;
          }[];
          createdAt: string;
          updatedAt: string;
        };
      }>>(`/api/accounts/${accountId}/config`, config);
      
      const cfg = response.data.data!.config;
      return {
        ...cfg,
        quickNotificationSettings: cfg.quickNotificationSettings || []
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar configuración');
    }
  }

  // Configuración de cobranzas (pagos)
  static async getPaymentConfig(accountId: string): Promise<{
    _id: string;
    account: string;
    matriculaAnual: { cobran: boolean; monto: number };
    matriculaPorDivision: { division: string; monto: number }[];
    cuotaPorDivision: { division: string; monto: number }[];
    moneda: string;
    createdAt?: string;
    updatedAt?: string;
  }> {
    const response = await apiClient.get<ApiResponse<{
      config: {
        _id: string;
        account: string;
        matriculaAnual: { cobran: boolean; monto: number };
        matriculaPorDivision: { division: string; monto: number }[];
        cuotaPorDivision: { division: string; monto: number }[];
        moneda: string;
        createdAt?: string;
        updatedAt?: string;
      };
    }>>(`/api/accounts/${accountId}/payment-config`);
    if (!response.data?.data?.config) throw new Error('Error al obtener configuración de cobranzas');
    return response.data.data.config;
  }

  static async updatePaymentConfig(accountId: string, config: {
    matriculaAnual: { cobran: boolean; monto: number };
    matriculaPorDivision?: { division: string; monto: number }[];
    cuotaPorDivision: { division: string; monto: number }[];
    moneda?: string;
  }): Promise<void> {
    await apiClient.put(`/api/accounts/${accountId}/payment-config`, config);
  }

  // Registro de pagos (por mes, estudiante, división)
  static async getPayments(accountId: string, params: {
    year: number;
    month: number; // 0 = matrícula anual
    divisionId?: string;
    studentId?: string;
  }): Promise<{ payments: PaymentRow[]; moneda: string }> {
    const search = new URLSearchParams();
    search.set('year', String(params.year));
    search.set('month', String(params.month));
    if (params.divisionId) search.set('divisionId', params.divisionId);
    if (params.studentId) search.set('studentId', params.studentId);
    const response = await apiClient.get<ApiResponse<{ payments: PaymentRow[]; moneda: string }>>(
      `/api/accounts/${accountId}/payments?${search.toString()}`
    );
    if (!response.data?.data) throw new Error('Error al obtener pagos');
    return response.data.data;
  }

  static async upsertPayment(accountId: string, body: {
    studentId: string;
    divisionId: string;
    year: number;
    month: number;
    amountPaid: number;
    paidAt?: string;
    notes?: string;
    origen?: string;
    referencia?: string;
  }): Promise<void> {
    await apiClient.post(`/api/accounts/${accountId}/payments`, body);
  }

  static async getPaymentStats(accountId: string, year?: number): Promise<PaymentStats> {
    const params = year != null ? `?year=${year}` : '';
    const response = await apiClient.get<ApiResponse<PaymentStats>>(
      `/api/accounts/${accountId}/payment-stats${params}`
    );
    if (!response.data?.data) throw new Error('Error al obtener estadísticas de pagos');
    return response.data.data;
  }
}

export interface PaymentStats {
  year: number;
  moneda: string;
  totalEsperado: number;
  totalCobrado: number;
  totalPendiente: number;
  resumenEstado: { pagado: number; pendiente: number; parcial: number };
  porMes: { month: number; esperado: number; cobrado: number; pendiente: number; cantidadPagados: number; cantidadPendientes: number }[];
  matriculaEsperada?: number;
}

export type OrigenPago = 'efectivo' | 'tarjeta' | 'banco' | 'transferencia' | 'cheque' | 'otro';

export interface PaymentRow {
  student: { _id: string; nombre: string; apellido: string };
  division: { _id: string; nombre: string } | null;
  year: number;
  month: number;
  amountExpected: number;
  amountPaid: number;
  status: 'pendiente' | 'pagado' | 'parcial';
  paidAt: string | null;
  notes: string;
  origen?: string | null;
  referencia?: string;
  paymentId: string | null;
} 