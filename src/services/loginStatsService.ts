import { apiClient, ApiResponse } from '../config/api';

export interface LoginStats {
  timeWindow: number;
  stats: {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    suspiciousAttempts: number;
    blockedAttempts: number;
    uniqueIPs: number;
    uniqueEmails: number;
    successRate: number;
  };
  timestamp: string;
}

export interface UserLoginStatus {
  _id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  loginCount?: number;
  lastLoginIP?: string;
  lastLoginDevice?: {
    platform: string;
    browser: string;
    isMobile: boolean;
  };
  lastLoginLocation?: {
    country: string;
    city: string;
  };
}

export interface UsersLoginStatusResponse {
  stats: {
    totalUsers: number;
    usersLoggedIn: number;
    usersNotLoggedIn: number;
    loginRate: string;
    period: string;
  };
  usersLoggedIn: UserLoginStatus[];
  usersNotLoggedIn: UserLoginStatus[];
}

export interface LoginAttempt {
  _id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  deviceInfo?: {
    platform: string;
    browser: string;
    isMobile: boolean;
  };
  location?: {
    country: string;
    city: string;
  };
  riskScore: number;
  suspiciousActivity: boolean;
  createdAt: string;
}

export class LoginStatsService {
  static async getLoginStats(timeWindow: number = 24): Promise<LoginStats> {
    try {
      const response = await apiClient.get<ApiResponse<LoginStats>>(
        `/admin/login-stats?timeWindow=${timeWindow}`
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al obtener estadísticas de login'
      );
    }
  }

  static async getUsersLoginStatus(
    timeWindow: number = 7,
    status: string = 'approved'
  ): Promise<UsersLoginStatusResponse> {
    try {
      const response = await apiClient.get<ApiResponse<UsersLoginStatusResponse>>(
        `/admin/users-login-status?timeWindow=${timeWindow}&status=${status}`
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al obtener estado de login de usuarios'
      );
    }
  }

  static async getUserLoginAttempts(
    email: string,
    limit: number = 10
  ): Promise<LoginAttempt[]> {
    try {
      const response = await apiClient.get<ApiResponse<LoginAttempt[]>>(
        `/admin/user-login-attempts/${encodeURIComponent(email)}?limit=${limit}`
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al obtener intentos de login del usuario'
      );
    }
  }

  static async getSuspiciousAttempts(
    timeWindow: number = 24,
    limit: number = 50
  ): Promise<LoginAttempt[]> {
    try {
      const response = await apiClient.get<ApiResponse<LoginAttempt[]>>(
        `/admin/suspicious-attempts?timeWindow=${timeWindow}&limit=${limit}`
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al obtener intentos sospechosos'
      );
    }
  }
}

