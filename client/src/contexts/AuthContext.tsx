import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, AuthResponse, Convincer } from '../lib/api';

interface AuthState {
  isAuthenticated: boolean;
  user: Convincer | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  checkEmail: (email: string) => Promise<{ exists: boolean; user: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    // Check if user is logged in from localStorage
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('auth_user');
        const storedSession = localStorage.getItem('auth_session');
        
        if (storedUser && storedSession) {
          const user = JSON.parse(storedUser);
          const session = JSON.parse(storedSession);
          
          // Check if session is still valid
          if (session.expires_at && new Date(session.expires_at) > new Date()) {
            // Ensure the token is stored
            if (session.access_token) {
              localStorage.setItem('authToken', session.access_token);
            }
            
            setAuthState({
              isAuthenticated: true,
              user: user,
              loading: false,
            });
            return;
          }
        }
        
        // Clear invalid session
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_session');
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await apiService.login(email, password);
      
      if (response.success) {
        // Calculate session expiration
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + response.session.expires_in);
        
        const sessionWithExpiry = {
          ...response.session,
          expires_at: expiresAt.toISOString(),
        };
        
        // Store in localStorage
        localStorage.setItem('auth_user', JSON.stringify(response.convincer));
        localStorage.setItem('auth_session', JSON.stringify(sessionWithExpiry));
        localStorage.setItem('authToken', response.session.access_token);
        
        setAuthState({
          isAuthenticated: true,
          user: response.convincer,
          loading: false,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await apiService.register(email, password, name);
      
      if (response.success) {
        // Calculate session expiration
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + response.session.expires_in);
        
        const sessionWithExpiry = {
          ...response.session,
          expires_at: expiresAt.toISOString(),
        };
        
        // Store in localStorage
        localStorage.setItem('auth_user', JSON.stringify(response.convincer));
        localStorage.setItem('auth_session', JSON.stringify(sessionWithExpiry));
        localStorage.setItem('authToken', response.session.access_token);
        
        setAuthState({
          isAuthenticated: true,
          user: response.convincer,
          loading: false,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_session');
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
  };

  const checkEmail = async (email: string) => {
    try {
      return await apiService.checkEmail(email);
    } catch (error) {
      console.error('Check email error:', error);
      return { exists: false, user: null };
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    checkEmail,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};