'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Flags from 'react-world-flags';
import axios from 'axios';

const LANGUAGES = [
  { code: 'ru', label: 'Русский', country_code: 'RU' },
  { code: 'en', label: 'English', country_code: 'GB' },
  { code: 'fi', label: 'Suomi', country_code: 'FI' },
  { code: 'et', label: 'Eesti', country_code: 'EE' },
  { code: 'lt', label: 'Lietuvių', country_code: 'LT' },
  { code: 'lv', label: 'Latviešu', country_code: 'LV' },
  { code: 'pl', label: 'Polski', country_code: 'PL' },
];

// Типы для типов сообщений и заказов
interface OrderMessage {
  sender: string;
}

interface Order {
  hasUnreadMessages: boolean;
  messages: OrderMessage[];
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const [hydrated, setHydrated] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [hasUnreadInOrders, setHasUnreadInOrders] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  function getUserInfoFromToken() {
    if (typeof window === 'undefined') return { userType: null, userId: null };
    const token = localStorage.getItem('token');
    if (!token) return { userType: null, userId: null };
    try {
      const base64Payload = token.split('.')[1];
      const payloadJson = atob(base64Payload);
      const payload = JSON.parse(payloadJson);
      return {
        userType: (payload.userType || payload.role || payload.userRole || null)?.toLowerCase() ?? null,
        userId: payload.id || payload.sub || null,
      };
    } catch {
      return { userType: null, userId: null };
    }
  }

  async function checkUnreadOrders(userId: string) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await axios.get<Order[]>(`${baseUrl}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data)) {
        const hasUnread = response.data.some((order) => {
          if (!order.hasUnreadMessages) return false;
          if (!order.messages?.length) return false;
          return order.messages[order.messages.length - 1].sender !== userId;
        });
        setHasUnreadInOrders(hasUnread);
        window.dispatchEvent(new CustomEvent('hasUnreadInOrdersUpdated', { detail: hasUnread }));
      }
    } catch {
      setHasUnreadInOrders(false);
      window.dispatchEvent(new CustomEvent('hasUnreadInOrdersUpdated', { detail: false }));
    }
  }

  useEffect(() => {
    if (!hydrated) return;

    const token = localStorage.getItem('token');
    setIsAuth(!!token);

    const { userId } = getUserInfoFromToken();

    if (token && userId) {
      checkUnreadOrders(userId);

      const onOrdersUpdated = () => checkUnreadOrders(userId);
      window.addEventListener('ordersUpdated', onOrdersUpdated);

      const onUnreadUpdated = (event: CustomEvent<boolean>) => {
        setHasUnreadInOrders(event.detail);
      };
      window.addEventListener('hasUnreadInOrdersUpdated', onUnreadUpdated as EventListener);

      return () => {
        window.removeEventListener('ordersUpdated', onOrdersUpdated);
        window.removeEventListener('hasUnreadInOrdersUpdated', onUnreadUpdated as EventListener);
      };
    }
  }, [hydrated]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [dropdownOpen]);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? LANGUAGES[0];

  function changeLanguage(lng: string) {
    i18n.changeLanguage(lng);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setIsAuth(false);
    router.push('/login');
    setMobileMenuOpen(false);
  }

  if (!hydrated) {
    // Skeleton loader
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm" aria-hidden="true">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between h-16">
          <div className="w-32 h-8 bg-gray-200 animate-pulse rounded" />
          <div className="flex gap-4">
            <div className="w-20 h-6 bg-gray-200 animate-pulse rounded" />
            <div className="w-20 h-6 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm" role="banner">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between h-16">

        {/* Логотип и выбор языка */}
       <div className="flex items-center space-x-4">
  <Link href="/" aria-label={t('home', 'Главная')} className="inline-block">
    <div
      style={{
        width: 100,
        height: 35,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        marginTop: '-2px',
      }}
    >
      <video
        src="/logo.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        width={100}
        height={35}
        style={{ display: 'block', objectFit: 'contain' }}
        aria-hidden="true"
        title={t('site_logo', 'Логотип MyBykeTaxi')}
      >
        <img
          src="/logo.png"
          alt={t('site_logo_alt', 'Логотип MyBykeTaxi')}
          width={100}
          height={35}
          style={{ display: 'block' }}
        />
      </video>
    </div>
          </Link>

          {/* Языковой селектор */}
          <div ref={dropdownRef} className="relative inline-block text-left">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              aria-label={t('language_selector', 'Выбор языка')}
              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              <Flags code={currentLang.country_code} className="w-4 h-4 rounded" />
              <span className="whitespace-nowrap font-medium">{currentLang.label}</span>
              <svg
                className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <ul
                role="listbox"
                tabIndex={-1}
                className="absolute right-0 mt-1 w-32 max-h-48 overflow-auto bg-white rounded shadow ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {LANGUAGES.map(({ code, label, country_code }) => (
                  <li
                    key={code}
                    role="option"
                    aria-selected={i18n.resolvedLanguage === code}
                    tabIndex={0}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
                      i18n.resolvedLanguage === code ? 'font-semibold bg-indigo-100 text-indigo-700' : ''
                    } hover:bg-indigo-600 hover:text-white`}
                    onClick={() => changeLanguage(code)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        changeLanguage(code);
                      }
                    }}
                  >
                    <Flags code={country_code} className="w-5 h-5" />
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Десктоп меню */}
        <nav className="hidden md:flex items-center gap-10">
          <Link
            href="/services"
            className="text-gray-700 hover:text-indigo-600 font-medium transition duration-200"
          >
            {t('menu_order_rickshaw', 'Заказать рикшу')}
          </Link>
          <Link
            href="/blog"
            className="text-gray-700 hover:text-indigo-600 font-medium transition duration-200"
          >
            {t('blog', 'Блог')}
          </Link>

          {isAuth && (
            <Link
              href="/my-orders"
              className="relative text-gray-700 hover:text-indigo-600 font-medium transition duration-200"
            >
              {t('menu_my_orders', 'Мои заказы')}
              {hasUnreadInOrders && pathname === '/my-orders' && (
                <span
                  className="absolute top-0 right-[-8px] w-3 h-3 bg-red-600 animate-pulse rounded-full"
                  aria-label={t('unread_messages', 'Есть новые сообщения')}
                />
              )}
            </Link>
          )}
        </nav>

        {/* Кнопки аутентификации */}
        <div className="hidden md:flex gap-2 items-center">
          {isAuth ? (
            <>
              <Link
                href="/profile"
                className="mr-4 text-green-700 hover:text-indigo-600 font-medium transition duration-400"
              >
                {t('menu_profile', 'Мой профиль')}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold transition"
              >
                {t('menu_logout', 'Выйти')}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-semibold transition"
            >
              {t('menu_login', 'Войти')}
            </Link>
          )}
        </div>

        {/* Мобильное меню (бургер) */}
        <button
          type="button"
          className="md:hidden flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-controls="mobile-menu"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? (
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Мобильное раскрывающееся меню */}
      {mobileMenuOpen && (
        <nav
          id="mobile-menu"
          className="md:hidden bg-gray-200 border-t border-gray-200 shadow-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="px-4 py-4 space-y-2">
            {/* Выбор языка */}
            <Link
              href="/services"
              className="block text-gray-700 hover:text-indigo-600 font-medium transition duration-200"
            >
              {t('menu_order_rickshaw', 'Заказать рикшу')}
            </Link>
            <Link
              href="/blog"
              className="block text-gray-700 hover:text-indigo-600 font-medium transition duration-200"
            >
              {t('blog', 'Блог')}
            </Link>

            {isAuth && (
              <Link
                href="/my-orders"
                className="relative block text-gray-700 hover:text-indigo-600 font-medium transition duration-200"
              >
                {t('menu_my_orders', 'Мои заказы')}
                {hasUnreadInOrders && pathname === '/my-orders' && (
                  <span
                    className="absolute top-0 right-0 w-3 h-3 bg-red-600 animate-pulse rounded-full"
                    aria-label={t('unread_messages', 'Есть новые сообщения')}
                  />
                )}
              </Link>
            )}

            {isAuth ? (
              <>
                <Link
                  href="/profile"
                  className="block text-green-700 hover:text-indigo-600 font-medium transition duration-400 text-center"
                >
                  {t('menu_profile', 'Мой профиль')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold w-full mt-2"
                >
                  {t('menu_logout', 'Выйти')}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-semibold transition text-center"
              >
                {t('menu_login', 'Войти')}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
