'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface User {
  about: unknown;
  photoUrl?: string;
  rating?: number | null;
  _id: string; // "id" лучше типизировать как string, особенно если это MongoDB ObjectId
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  telegramChatId?: string;
  userType: Array<'CLIENT' | 'THERAPIST' | 'MANAGER'>;
  // ... другие поля, если нужно
}

interface UseAuthResult {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;

  // Добавляем методы для соцлогина, если нужно
  loginWithGoogle: () => void;
  loginWithFacebook: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Проверка токена и получение пользователя
  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await axios.get<User>('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (catchError: unknown) {
      let message = 'Не удалось получить пользователя';
      if (axios.isAxiosError(catchError)) {
        message = catchError.response?.data?.error || message;
      } else if (catchError instanceof Error) {
        message = catchError.message;
      }
      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Вход по email/password
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post<{ token: string }>('/api/auth/login', {
        email,
        password,
      });
      localStorage.setItem('token', res.data.token);
      await fetchUser();
    } catch (catchError: unknown) {
      let message = 'Ошибка входа';
      if (axios.isAxiosError(catchError)) {
        message = catchError.response?.data?.error || message;
      } else if (catchError instanceof Error) {
        message = catchError.message;
      }
      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Регистрация по email/password + имя
  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/auth/register', data);
      await login(data.email, data.password);
    } catch (catchError: unknown) {
      let message = 'Ошибка регистрации';
      if (axios.isAxiosError(catchError)) {
        message = catchError.response?.data?.error || message;
      } else if (catchError instanceof Error) {
        message = catchError.message;
      }
      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Выход (логаут)
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Принудительное обновление данных пользователя
  const refresh = async () => {
    await fetchUser();
  };

  // Социальный вход запускает редирект на серверный маршрут OAuth
  const loginWithGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  const loginWithFacebook = () => {
    window.location.href = '/api/auth/facebook';
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    refresh,
    loginWithGoogle,
    loginWithFacebook,
  };
}
