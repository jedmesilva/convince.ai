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

  try {
    const response = await fetch(url, options);

    // Tenta obter detalhes do erro da API se a resposta não for bem-sucedida
    if (!response.ok) {
      let errorMessage = `Erro na requisição: ${response.status} ${response.statusText}`;
      
      try {
        // Tenta extrair mensagem de erro detalhada
        const errorData = await response.json();
        
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } catch (parseError) {
        // Falha ao analisar JSON de erro, mantém a mensagem padrão
        console.warn("Não foi possível analisar resposta de erro:", parseError);
      }

      // Adiciona informações úteis para diagnóstico nas mensagens de erro
      if (url.includes('login')) {
        errorMessage = `Erro ao fazer login: ${errorMessage}`;
      } else if (url.includes('register')) {
        errorMessage = `Erro ao registrar usuário: ${errorMessage}`;
      } else if (url.includes('logout')) {
        errorMessage = `Erro ao fazer logout: ${errorMessage}`;
      } else if (url.includes('payments')) {
        errorMessage = `Erro no processamento do pagamento: ${errorMessage}`;
      }

      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    // Captura erros de rede (como CORS, conexão perdida, etc)
    if (!(error instanceof Error)) {
      throw new Error("Erro de conexão desconhecido");
    }
    
    // Se já é um Error organizado, apenas repassa
    if (error.message.includes("Erro ao")) {
      throw error;
    }
    
    // Caso contrário, formata com prefixo para facilitar tratamento específico
    const errorPrefix = url.includes('login')
      ? "Erro ao fazer login: "
      : url.includes('register')
        ? "Erro ao registrar usuário: "
        : url.includes('logout')
          ? "Erro ao fazer logout: "
          : url.includes('payments')
            ? "Erro no processamento do pagamento: "
            : "Erro na API: ";
            
    throw new Error(`${errorPrefix}${error.message}`);
  }
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
    console.log("Iniciando registro de usuário:", { 
      name: userData.name, 
      email: userData.email,
      password: userData.password ? "****" : "não fornecida" 
    });
    
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

    console.log("Resultado de registro no Supabase Auth:", { 
      success: !authError, 
      userId: authData?.user?.id 
    });

    if (authError) throw authError;

    // Registrar no esquema público também (public.users)
    if (authData.user) {
      // Gerando um hash simples para simular um password hash
      const passwordHash = btoa(userData.password + "_salt_" + new Date().getTime());
      
      console.log("Tentando inserir usuário na tabela public.users", {
        id: authData.user.id,
        username: userData.name
      });
      
      let publicUser = null;
      try {
        const insertResult = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              username: userData.name,
              password: passwordHash,
              created_at: new Date().toISOString(),
              email: userData.email,
              status: 'active'
            }
          ])
          .select()
          .single();
        
        if (insertResult.error) {
          throw insertResult.error;
        }
        
        publicUser = insertResult.data;
  
        console.log("Resultado da inserção na tabela public.users:", {
          success: !insertResult.error,
          data: publicUser ? "dados recebidos" : "sem dados"
        });
  
      } catch (insertError) {
        console.error("Erro detalhado ao inserir na tabela users:", insertError);
        throw insertError;
      }

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
    // Tenta fazer logout no Supabase Auth
    // Mesmo se falhar, continua para garantir que ao menos a sessão seja limpa no cliente
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn("Aviso ao fazer logout do Supabase:", error);
    } catch (supabaseError) {
      console.warn("Erro ao fazer logout do Supabase:", supabaseError);
      // Continua mesmo se o Supabase falhar
    }

    // Chama o endpoint de logout da API para limpar sessões do servidor
    try {
      await apiRequest("POST", "/api/logout");
    } catch (apiError) {
      console.warn("Aviso ao chamar logout API:", apiError);
      // Continua mesmo se a API falhar
    }
    
    // Limpa informações de autenticação local, garantindo que o usuário vai sair
    localStorage.removeItem("supabase.auth.token");
    sessionStorage.removeItem("supabase.auth.token");
    
    // Considera sucesso mesmo se alguma parte falhar, pois o mais importante é a experiência do usuário
    return true;
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