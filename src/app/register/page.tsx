'use client';

import axios from 'axios';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
  const { t } = useTranslation();
  const firstNameRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'CLIENT',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Фокус на первое поле при монтировании
    firstNameRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Простая проверка email
  const isValidEmail = (email: string) =>
    /\S+@\S+\.\S+/.test(email);

  // Минимальная проверка пароля
  const isValidPassword = (pwd: string) => pwd.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.firstName.trim()) {
      setError(t('first_name_required', 'Введите имя'));
      return;
    }
    if (!form.lastName.trim()) {
      setError(t('last_name_required', 'Введите фамилию'));
      return;
    }
    if (!isValidEmail(form.email)) {
      setError(t('email_invalid', 'Введите корректный Email'));
      return;
    }
    if (!isValidPassword(form.password)) {
      setError(t('password_min_length', 'Пароль должен содержать минимум 6 символов'));
      return;
    }

    setLoading(true);
    try {
      const source = axios.CancelToken.source();
      // Таймаут 10 секунд — если сервер не отвечает - отменяем
      const timeoutId = setTimeout(() => {
        source.cancel();
      }, 10_000);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        form,
        { cancelToken: source.token }
      );

      clearTimeout(timeoutId);
      setSuccess(true);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        userType: 'CLIENT',
      });
    } catch (err: unknown) {
      if (axios.isCancel(err)) {
        setError(t('timeout_error', 'Сервер недоступен, попробуйте позже'));
      } else if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || t('registration_error', 'Ошибка регистрации'));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('registration_error', 'Ошибка регистрации'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700">
          {t('register_title', 'Регистрация')}
        </h1>

        {success ? (
          <div className="text-green-600 text-center font-semibold mb-4" role="alert" tabIndex={-1}>
            {t('register_success', 'Регистрация прошла успешно!')}<br />
            {t('register_check_email', 'Проверьте почту или войдите в аккаунт.')}
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="flex gap-3">
              <input
                name="firstName"
                type="text"
                placeholder={t('first_name_placeholder', 'Имя')}
                className="w-1/2 px-4 py-3 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-100 focus:ring-2 transition"
                value={form.firstName}
                onChange={handleChange}
                required
                aria-label={t('first_name_label', 'Имя')}
                ref={firstNameRef}
              />
              <input
                name="lastName"
                type="text"
                placeholder={t('last_name_placeholder', 'Фамилия')}
                className="w-1/2 px-4 py-3 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-100 focus:ring-2 transition"
                value={form.lastName}
                onChange={handleChange}
                required
                aria-label={t('last_name_label', 'Фамилия')}
              />
            </div>
            <input
              name="email"
              type="email"
              placeholder={t('email_placeholder', 'Email')}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-100 focus:ring-2 transition"
              value={form.email}
              onChange={handleChange}
              required
              aria-label={t('email_label', 'Email')}
              autoComplete="email"
            />
            <input
              name="password"
              type="password"
              placeholder={t('password_placeholder', 'Пароль')}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-100 focus:ring-2 transition"
              value={form.password}
              onChange={handleChange}
              required
              aria-label={t('password_label', 'Пароль')}
              minLength={6}
              autoComplete="new-password"
            />
            <select
              name="userType"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-100 focus:ring-2 transition"
              value={form.userType}
              onChange={handleChange}
              aria-label={t('user_type_label', 'Тип пользователя')}
            >
              <option value="CLIENT">{t('user_type_client', 'Клиент')}</option>
            </select>

            {error && (
              <div className="text-red-600 text-sm" role="alert" tabIndex={-1}>
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition-all duration-150 active:scale-95"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? t('register_loading', 'Регистрация...') : t('register_button', 'Зарегистрироваться')}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-gray-500">
          {t('register_already_have_account', 'Уже есть аккаунт?')}&nbsp;
          <Link href="/login" className="text-indigo-600 hover:underline font-semibold">
            {t('register_login_link', 'Войти')}
          </Link>
        </div>
      </div>
    </div>
  );
}
