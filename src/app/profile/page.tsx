'use client';

import Link from "next/link";
import { useAuth } from '../../hooks/useAuth';
import ProfilePhoto from './ProfilePhoto';
import CertificatesEditor from "../../components/CertificatesEditor";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import BookingFilter from "../../components/bookingFilter";
import AboutEditor from "../../components/AboutEditor";
import axios from "axios";

interface StarRatingProps {
  rating: number;
}

function StarRating({ rating }: StarRatingProps) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const totalStars = 5;

  for (let i = 1; i <= totalStars; i++) {
    if (i <= fullStars) {
      stars.push(
        <span key={i} className="text-yellow-400 text-xl" aria-hidden="true">★</span>
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <span key={i} className="text-yellow-400 text-xl" aria-hidden="true">☆</span>
      );
    } else {
      stars.push(
        <span key={i} className="text-gray-300 text-xl" aria-hidden="true">★</span>
      );
    }
  }

  return (
    <div className="flex space-x-1" aria-label={`Rating: ${rating} out of 5 stars`}>
      {stars}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  // Все хуки объявляем здесь, без условий
  const [showTelegramInfo, setShowTelegramInfo] = useState(false);
  const [about, setAbout] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Роли пользователя в нижнем регистре для удобства
  const userRolesLower = user?.userType.map(role => role.toLowerCase()) || [];

  // Инициализация about при загрузке user
  useEffect(() => {
    if (user?.about && typeof user.about === 'object' && user.about !== null) {
      setAbout(user.about as Record<string, string>);
    }
  }, [user]);

  // Функция сохранения about (например, через API)
  async function saveAbout() {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert(t('error_not_authorized', 'Вы не авторизованы.'));
      return;
    }

    setIsSaving(true);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/about`,
        { about }, // тело запроса
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(t('about_saved', 'Информация о себе сохранена.'));
      // Опционально - обновить локальный контекст пользователя, если храните там about
    } catch (error: unknown) {
      console.error('Ошибка при сохранении about:', error);
       {
      }
    } finally {
      setIsSaving(false);
    }
  }

  // Рендерим загрузку или сообщение о неавторизованности без вызова хуков
  if (loading) return <div>{t('loading', 'Загрузка...')}</div>;

  if (!user) {
    return (
      <div className="p-4 text-center">
        {t('not_authorized', 'Вы не авторизованы')}
        <br />
        <Link href="/login" className="text-indigo-600 hover:underline">
          {t('login', 'Войти')}
        </Link>
      </div>
    );
  }

  return (
    <section className="container mx-auto py-8 px-4 max-w-xl">
      {/* Заголовок и рейтинг */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold">{t('user_profile', 'Профиль пользователя')}</h2>
        <div className="flex items-center space-x-2">
          <span className="text-gray-700 text-sm font-medium whitespace-nowrap">{t('rating_label', 'Ваш рейтинг')}:</span>
          {typeof user.rating === "number" && user.rating > 0 ? (
            <StarRating rating={user.rating} />
          ) : (
            <span className="text-gray-400 text-sm">{t('no_rating', 'Нет рейтинга')}</span>
          )}
        </div>
      </div>

      {/* Фото */}
      <ProfilePhoto
        currentPhotoUrl={user.photoUrl}
        onUpload={() => window.location.reload()}
      />

      {/* Основная инфа */}
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mt-6 space-y-2 text-gray-800">
        <p><strong>{t('first_name', 'Имя')}:</strong> {user.firstName}</p>
        <p><strong>{t('last_name', 'Фамилия')}:</strong> {user.lastName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>{t('user_type', 'Тип пользователя')}:</strong>{" "}
          {userRolesLower.includes('client')
            ? t("client", "Клиент")
            : userRolesLower.includes('therapist')
              ? t("therapist", "Терапевт")
              : userRolesLower.includes('manager')
                ? t("manager", "Менеджер")
                : user.userType.join(', ')}
        </p>
      </div>

      {/* Для терапевтов */}
      {userRolesLower.includes("therapist") && (
        <div className="mt-8">
          {/* Редактор about */}
          <section className="bg-white p-6 rounded-lg shadow-md max-w-md mb-6">
            <AboutEditor about={about} onChange={setAbout} />
            <button
              disabled={isSaving}
              onClick={saveAbout}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              aria-label={t('save', 'Сохранить')}
            >
              {isSaving ? t('saving', 'Сохранение...') : t('save', 'Сохранить')}
            </button>
          </section>

          {user.telegramChatId ? (
            <>
              <p className="text-green-700 font-semibold">{t("telegram_connected", "Вы успешно подключились к Telegram!")}</p>
              <div className="mt-6 space-y-3">
                <Link
                  href="/services/add"
                  className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-indigo-700 transition w-full text-center"
                >
                  ➕ {t('add_service', 'Добавить услугу')}
                </Link>
                <CertificatesEditor />
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowTelegramInfo(!showTelegramInfo)}
                className="w-full text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {t("connect_telegram", "Подключиться к Telegram")}
              </button>
              {showTelegramInfo && (
                <div className="mt-4 text-sm leading-relaxed bg-blue-50 p-4 rounded text-gray-700">
                  <p>{t('telegram_connect_instructions', 'Напишите нашему боту Telegram:')}</p>
                  <a
                    href="https://t.me/Mybooking888_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-mono text-blue-600 underline hover:text-blue-700"
                    aria-label={t("telegram_bot_link", "Ссылка на Telegram бота")}
                  >
                    https://t.me/Mybooking888_bot
                  </a>
                  <p className="mt-2">
                    {t('telegram_connect_detail', 'Отправьте команду /connect и свой email, чтобы связать профили.')}
                  </p>
                  <p className="mt-2 font-semibold text-gray-800">
                    {t('telegram_notifications', 'После связи вы начнёте получать уведомления о новых заказах в Telegram!')}
                  </p>
                </div>
              )}
              <div className="mt-6 space-y-3">
                <Link
                  href="/services/add"
                  className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-indigo-700 transition w-full text-center"
                >
                  ➕ {t('add_service', 'Добавить услугу')}
                </Link>
                <CertificatesEditor />
              </div>
            </>
          )}
        </div>
      )}

      {/* Для менеджера */}
      {userRolesLower.includes('manager') && (
        <div className="mt-8">
          <BookingFilter userType="MANAGER" />
        </div>
      )}
    </section>
  );
}
