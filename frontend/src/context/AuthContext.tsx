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
  loginWithGoogle: (data: { email: string; name?: string; picture?: string; credential?: string }) => Promise<{ success: boolean; isNewUser?: boolean }>;
  logout: () => void;
  updateUserProfile: (data: {
    fullName?: string;
    regNo?: string;
    programme?: string;
    yearSemester?: string;
    avatarUrl?: string;
    school?: string;
    savedLocationIds?: string[];
  }) => Promise<boolean>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
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
          const parsed = JSON.parse(savedUserStr);
          if (parsed && (parsed.avatar?.includes('images.unsplash.com') || !parsed.avatar)) {
            parsed.avatar = '/default-avatar.png';
            localStorage.setItem('vitos_user', JSON.stringify(parsed));
          }
          setUser(parsed);
          setToken(savedToken);
        } catch {
          localStorage.removeItem('vitos_token');
          localStorage.removeItem('vitos_user');
        }
      } else {
        setUser(null);
        setToken(null);
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
      setError(err.response?.data?.error || err.message || 'Registration failed.');
      setLoading(false);
      return false;
    }
  };

  const loginWithGoogle = async (data: { email: string; name?: string; picture?: string; credential?: string }): Promise<{ success: boolean; isNewUser?: boolean }> => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.googleAuth(data);
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('vitos_token', res.token);
        localStorage.setItem('vitos_user', JSON.stringify(res.user));
        setLoading(false);
        return { success: true, isNewUser: res.isNewUser };
      }
      setError('Google authentication failed.');
      setLoading(false);
      return { success: false, isNewUser: false };
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Google authentication failed.';
      setError(msg);
      setLoading(false);
      return { success: false, isNewUser: false };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vitos_token');
    localStorage.removeItem('vitos_user');
  };

  const updateUserProfile = async (data: {
    fullName?: string;
    regNo?: string;
    programme?: string;
    yearSemester?: string;
    avatarUrl?: string;
    school?: string;
    savedLocationIds?: string[];
  }): Promise<boolean> => {
    try {
      const res = await authService.updateProfile(data);
      if (res.user) {
        const updated: User = {
          ...res.user,
          school: data.school || res.user.school || user?.school || 'SCOPE (School of Computer Science and Engineering)'
        };
        setUser(updated);
        localStorage.setItem('vitos_user', JSON.stringify(updated));
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      return false;
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.deleteAccount();
      logout();
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Failed to delete account.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUserProfile,
        deleteAccount,
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
