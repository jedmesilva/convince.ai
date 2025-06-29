// Configurar URL da API para conectar com servidor Supabase na porta 3001
const API_BASE_URL = 'http://localhost:3001/api';

export interface Prize {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface PrizeStatistics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  currentPrizeAmount: number;
  successRate: string;
}

export interface Attempt {
  id: string;
  status: string;
  convincing_score: number;
  created_at: string;
  convincers: {
    name: string;
  };
}

export interface Convincer {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  convincer_id: string;
  amount_paid: number;
  time_purchased_seconds: number;
  status: string;
  created_at: string;
}

export interface PaymentResponse {
  payment: Payment;
  timeBalance: {
    id: string;
    convincer_id: string;
    payment_id: string;
    amount_time_seconds: number;
    status: string;
    created_at: string;
  };
  success: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface CheckEmailResponse {
  exists: boolean;
  user: {
    id: string;
    email: string;
  } | null;
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  convincer: Convincer;
  session: AuthSession;
}

class ApiService {
  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      console.log(`Fazendo requisição para: ${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      console.log(`Resposta recebida: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro HTTP ${response.status}:`, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`Dados recebidos:`, data);
      return data;
    } catch (error) {
      console.error(`Erro na chamada da API para ${endpoint}:`, error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Erro de conexão com o servidor. Verifique se o servidor está rodando.');
      }
      throw error;
    }
  }

  // Health check
  async checkHealth(): Promise<{ status: string; timestamp: string; version: string }> {
    return this.fetchJson('/health');
  }

  // Prize endpoints
  async getCurrentPrize(): Promise<Prize> {
    return this.fetchJson('/prizes/current');
  }

  async getPrizeStatistics(): Promise<PrizeStatistics> {
    return this.fetchJson('/prizes/statistics');
  }

  // Attempts endpoints
  async getAttempts(): Promise<Attempt[]> {
    return this.fetchJson('/attempts');
  }

  // Convincers endpoints
  async createConvincer(name: string, email: string): Promise<Convincer> {
    return this.fetchJson('/convincers', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });
  }

  // Auth endpoints
  async checkEmail(email: string): Promise<CheckEmailResponse> {
    return this.fetchJson('/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    return this.fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  // Payments endpoints
  async processPayment(
    convincer_id: string,
    amount_paid: number,
    time_purchased_seconds: number
  ): Promise<PaymentResponse> {
    return this.fetchJson('/payments', {
      method: 'POST',
      body: JSON.stringify({
        convincer_id,
        amount_paid,
        time_purchased_seconds,
      }),
    });
  }
}

export const apiService = new ApiService();