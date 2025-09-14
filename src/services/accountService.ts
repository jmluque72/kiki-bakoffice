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
} 