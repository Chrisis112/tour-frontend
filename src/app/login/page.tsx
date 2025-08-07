"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Реф для отмены запроса при размонтировании
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      abortControllerRef.current = new AbortController();
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { email, password },
        {
          signal: abortControllerRef.current.signal,
          timeout: 10000, // 10 секунд
        }
      );

      localStorage.setItem("token", res.data.token);

      // Редирект после успешного входа
      window.location.href = "/profile";
    } catch (err: unknown) {
      if (axios.isCancel(err)) {
        // Запрос отменён, не показываем ошибку
      } else if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error || t("login_error", "Ошибка входа. Проверьте email и пароль.")
        );
      } else {
        setError(t("login_error", "Ошибка входа. Проверьте email и пароль."));
      }
    } finally {
      setLoading(false);
    }
  };

  // Обработчики для кнопок соцлогина
  function handleGoogleLogin() {
    // Предполагается, что на backend настроен OAuth/login по этому URL
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  }

  function handleFacebookLogin() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/facebook`;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700" tabIndex={-1}>
          {t("login_title", "Вход в аккаунт")}
        </h1>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            placeholder={t("login_email_placeholder", "Email")}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            aria-label={t("login_email_label", "Email")}
          />
          <input
            type="password"
            placeholder={t("login_password_placeholder", "Пароль")}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            aria-label={t("login_password_label", "Пароль")}
          />
          {error && (
            <div className="text-red-600 text-sm" role="alert" tabIndex={-1}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 transition-all duration-150 active:scale-95"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? t("login_loading", "Вход...") : t("login_button", "Войти")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="mb-3 text-gray-600">{t("or_login_with", "Или войти с помощью")}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleGoogleLogin}
              className="flex items-center px-5 py-2 border rounded-lg hover:shadow-md transition"
              aria-label="Login with Google"
              type="button"
            >
              <img
                src="/google.png"
                alt="Google"
                className="w-5 h-5 mr-2"
                loading="lazy"
              />
              Google
            </button>
            <button
              onClick={handleFacebookLogin}
              className="flex items-center px-5 py-2 border rounded-lg hover:shadow-md transition"
              aria-label="Login with Facebook"
              type="button"
            >
              <img
                src="/facebook.png"
                alt="Facebook"
                className="w-5 h-5 mr-2"
                loading="lazy"
              />
              Facebook
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500">
          {t("login_no_account", "Нет аккаунта?")}{" "}
          <Link href="/register" className="text-blue-600 hover:underline font-semibold">
            {t("login_register", "Зарегистрироваться")}
          </Link>
        </div>
      </div>
    </div>
  );
}
