import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (data: {
    fullName: string;
    regNo: string;
    email: string;
    password: string;
    programme: string;
    yearSemester: string;
  }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('vitos_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('vitos_token');
      const savedUserStr = localStorage.getItem('vitos_user');

      if (savedToken && savedUserStr) {
        try {
          setUser(JSON.parse(savedUserStr));
          setToken(savedToken);
        } catch {
          localStorage.removeItem('vitos_token');
          localStorage.removeItem('vitos_user');
        }
      } else {
        // Default demo user Chris
        const defaultUser: User = {
          id: 'usr_1024',
          name: 'Chris',
          regNo: '22BCE1024',
          program: 'B.Tech Computer Science and Engineering',
          school: 'SCOPE (School of Computer Science and Engineering)',
          year: '3rd Year (Semester VI)',
          email: 'chris.student2022@vitstudent.ac.in',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
          savedLocationIds: ['loc_tt', 'loc_lib', 'loc_med'],
          recentSearches: ['TT-624', 'Periyar Library', 'Medical Centre'],
          role: 'student'
        };
        setUser(defaultUser);
        setToken('vitos_token_demo_1024');
        localStorage.setItem('vitos_token', 'vitos_token_demo_1024');
        localStorage.setItem('vitos_user', JSON.stringify(defaultUser));
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.login(identifier, password);
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('vitos_token', res.token);
        localStorage.setItem('vitos_user', JSON.stringify(res.user));
        setLoading(false);
        return true;
      }
      setError('Invalid credentials');
      setLoading(false);
      return false;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      setLoading(false);
      return false;
    }
  };

  const register = async (data: {
    fullName: string;
    regNo: string;
    email: string;
    password: string;
    programme: string;
    yearSemester: string;
  }): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.register(data);
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('vitos_token', res.token);
        localStorage.setItem('vitos_user', JSON.stringify(res.user));
        setLoading(false);
        return true;
      }
      setError('Registration failed');
      setLoading(false);
      return false;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. An account with this Reg No may already exist.');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vitos_token');
    localStorage.removeItem('vitos_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
