// Configurar URL da API para conectar com servidor Supabase na porta 3001
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api' 
  : `https://${window.location.hostname}:3001/api`;

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
  convincer_id: string;
  status: string;
  available_time_seconds: number;
  convincing_score: number;
  created_at: string;
  updated_at: string;
  convincers?: {
    name: string;
  };
}

export interface Message {
  id: string;
  attempt_id: string;
  convincer_id: string;
  message: string;
  convincing_score_snapshot: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AIResponse {
  id: string;
  attempt_id: string;
  user_message_id: string;
  ai_response: string;
  convincing_score_snapshot: number;
  status: string;
  created_at: string;
  updated_at: string;
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

export interface TimeBalance {
  id: string;
  convincer_id: string;
  payment_id: string;
  amount_time_seconds: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentResponse {
  payment: Payment;
  timeBalance: TimeBalance;
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
        method: options?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options?.headers,
        },
        credentials: 'omit',
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

  async createAttempt(available_time_seconds: number): Promise<Attempt> {
    const session = localStorage.getItem('auth_session');
    const token = session ? JSON.parse(session).access_token : null;

    return this.fetchJson('/attempts', {
      method: 'POST',
      body: JSON.stringify({ available_time_seconds }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  private getAuthToken(): string | null {
    const session = localStorage.getItem('auth_session');
    return session ? JSON.parse(session).access_token : null;
  }

  async getAttempt(attemptId: string): Promise<Attempt> {
    const token = this.getAuthToken();
    return this.fetchJson(`/attempts/${attemptId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async updateAttempt(attemptId: string, data: { status?: string; convincing_score?: number }): Promise<Attempt> {
    const token = this.getAuthToken();
    console.log('=== DEBUG UPDATE ATTEMPT CLIENT ===');
    console.log('Attempt ID:', attemptId);
    console.log('Data to send:', data);
    console.log('Token exists:', !!token);
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'null');

    try {
      const response = await fetch(`${API_BASE_URL}/attempts/${attemptId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Success response:', result);
      return result;
    } catch (error) {
      console.error('Update attempt error:', error);
      throw error;
    }
  }

  async getActiveAttempt(convincerId: string): Promise<Attempt | null> {
    try {
      const token = this.getAuthToken();
      return await this.fetchJson(`/convincers/${convincerId}/attempts/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Se não encontrar tentativa ativa, retorna null
      return null;
    }
  }

  async getAttemptMessages(attemptId: string): Promise<Message[]> {
    const token = this.getAuthToken();
    return this.fetchJson(`/attempts/${attemptId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getAttemptAiResponses(attemptId: string): Promise<AIResponse[]> {
    const token = this.getAuthToken();
    return this.fetchJson(`/attempts/${attemptId}/ai-responses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Criar mensagem
  async createMessage(attemptId: string, message: string): Promise<Message> {
    console.log('=== DEBUG CREATE MESSAGE CLIENT ===');
    console.log('Attempt ID:', attemptId);
    console.log('Message:', message);
    console.log('Token exists:', !!this.getAuthToken());
    console.log('Token preview:', this.getAuthToken()?.substring(0, 20) + '...');

    return this.fetchJson('/messages', {
      method: 'POST',
      body: JSON.stringify({ attempt_id: attemptId, message }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });
  }

  async createAIResponse(attemptId: string, userMessageId: string, aiResponse: string, convincingScore: number): Promise<AIResponse> {
    const token = this.getAuthToken();
    return this.fetchJson('/ai-responses', {
      method: 'POST',
      body: JSON.stringify({ 
        attempt_id: attemptId, 
        user_message_id: userMessageId, 
        ai_response: aiResponse,
        convincing_score_snapshot: convincingScore
      }),
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
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

  // Time Balance endpoints
  async getTimeBalance(convincer_id: string): Promise<TimeBalance> {
    return this.fetchJson(`/time-balance/${convincer_id}`);
  }

  async updateTimeBalance(convincer_id: string, seconds_to_subtract: number): Promise<TimeBalance> {
    return this.fetchJson(`/time-balance/${convincer_id}`, {
      method: 'PUT',
      body: JSON.stringify({ seconds_to_subtract }),
    });
  }
}

export const apiService = new ApiService();