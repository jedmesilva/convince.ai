// Configurar URL da API para conectar com servidor API na porta 3001
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
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log(`Texto da resposta:`, responseText);
      
      try {
        const data = JSON.parse(responseText);
        console.log(`Dados recebidos:`, data);
        return data;
      } catch (parseError) {
        console.error(`Erro ao fazer parse do JSON:`, parseError);
        console.log(`Resposta original:`, responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
    } catch (error) {
      console.error(`Erro na chamada da API para ${endpoint}:`, error);
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