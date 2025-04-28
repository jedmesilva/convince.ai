import { supabase } from "./supabase";

// Tipos para dados de usuário e pagamento
export interface User {
  id: string;
  username: string;
  password: string;
  created_at: Date;
}

export interface InsertUser {
  id?: string;
  username: string;
  password: string;
}

// Função genérica para fazer requisições API
async function apiRequest(method: string, url: string, data?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  
  return response;
}

export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface PaymentData {
  amount: number;
  sessionId: string;
  method: string;
  status: string;
}

// Registrar um novo usuário usando o Supabase Auth
export async function registerUser(userData: UserRegistrationData) {
  try {
    // Registrar no Supabase Auth (auth.users)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name
        }
      }
    });

    if (authError) throw authError;

    // Registrar no esquema público também (public.users)
    if (authData.user) {
      // Criar usuário na tabela public.users
      const insertUserData: Partial<InsertUser> = {
        id: authData.user.id,
        username: userData.name,
        password: "auth_managed", // Como a senha é gerenciada pelo Auth, usamos um placeholder
      };

      const response = await apiRequest("POST", "/api/register", insertUserData);
      const publicUser = await response.json();

      return {
        auth: authData,
        publicUser,
      };
    }

    throw new Error("Falha ao registrar usuário");
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    throw error;
  }
}

// Fazer login com Supabase Auth
export async function loginUser(loginData: UserLoginData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    throw error;
  }
}

// Fazer logout do usuário
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Também chamar o endpoint de logout da API para limpar sessões do servidor
    await apiRequest("POST", "/api/logout");
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw error;
  }
}

// Obter usuário atual
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    return null;
  }
}

// Processar pagamento e registro de usuário em uma única operação
export async function processPaymentAndRegister(
  paymentData: PaymentData,
  userData: UserRegistrationData
) {
  try {
    // 1. Registrar o usuário primeiro
    const userData_result = await registerUser(userData);
    
    // 2. Processar o pagamento
    const paymentRequest = {
      amount: paymentData.amount,
      session_id: paymentData.sessionId,
      method: paymentData.method,
      status: paymentData.status,
      user_id: userData_result.auth.user?.id
    };
    
    const response = await apiRequest("POST", "/api/payments", paymentRequest);
    const payment = await response.json();
    
    return {
      user: userData_result,
      payment
    };
  } catch (error) {
    console.error("Erro ao processar pagamento e registrar usuário:", error);
    throw error;
  }
}

// Processar pagamento para usuário existente
export async function processPaymentForExistingUser(
  paymentData: PaymentData,
  loginData: UserLoginData
) {
  try {
    // 1. Fazer login do usuário
    const userData = await loginUser(loginData);
    
    // 2. Processar o pagamento
    const paymentRequest = {
      amount: paymentData.amount,
      session_id: paymentData.sessionId,
      method: paymentData.method,
      status: paymentData.status,
      user_id: userData.user?.id
    };
    
    const response = await apiRequest("POST", "/api/payments", paymentRequest);
    const payment = await response.json();
    
    return {
      user: userData,
      payment
    };
  } catch (error) {
    console.error("Erro ao processar pagamento para usuário existente:", error);
    throw error;
  }
}